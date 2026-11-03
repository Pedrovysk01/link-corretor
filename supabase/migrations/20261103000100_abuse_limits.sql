-- Limites contra abuso nas funções públicas (visitante anônimo), 2026-11-03. Achados da revisão do projeto:
--   · public_join não tinha teto: um script cria clientes falsos, estoura o limite do plano (30 no Free) e o cliente real
--     leva "não está aceitando novos cartões"; também testava se um telefone/e-mail já é cliente, sem limite de tentativas;
--   · public_wifi_pass gravava um contato por chamada (o visitor_id é escolhido por quem chama) e disparava webhook;
--   · public_track não tinha teto por negócio (a tabela visits crescia sem fim e inflava "visitantes 30 d");
--   · enforce_client_limit contava sem trava: cadastros simultâneos passavam do limite do plano.
-- A contagem usa o hash da rede POR NEGÓCIO (net_hash): nenhum IP é guardado; as linhas somem em 2 dias.

create table if not exists public.abuse_hits (
  id bigint generated always as identity primary key,
  kind text not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  net text,                                   -- net_hash(business, rede) ou null (rede desconhecida)
  created_at timestamptz not null default now()
);
create index if not exists abuse_hits_biz on public.abuse_hits(kind, business_id, created_at desc);
create index if not exists abuse_hits_net on public.abuse_hits(kind, business_id, net, created_at desc);
alter table public.abuse_hits enable row level security;
revoke all on public.abuse_hits from anon, authenticated;

-- registra a chamada e diz se ainda está dentro do teto (por negócio e por rede, na janela). Quem chama decide o que fazer.
create or replace function public.abuse_ok(p_biz uuid, p_kind text, p_max_biz int, p_max_net int, p_window interval default interval '1 hour') returns boolean
language plpgsql security definer set search_path = public as $$
declare nh text := case when public.request_net() is null then null else public.net_hash(p_biz, public.request_net()) end; c int;
begin
  insert into public.abuse_hits(kind, business_id, net) values (p_kind, p_biz, nh);
  select count(*) into c from public.abuse_hits where kind = p_kind and business_id = p_biz and created_at > now() - p_window;
  if c > p_max_biz then return false; end if;
  if nh is not null then
    select count(*) into c from public.abuse_hits where kind = p_kind and business_id = p_biz and net = nh and created_at > now() - p_window;
    if c > p_max_net then return false; end if;
  end if;
  if random() < 0.02 then delete from public.abuse_hits where created_at < now() - interval '2 days'; end if;
  return true;
end $$;
revoke all on function public.abuse_ok(uuid, text, int, int, interval) from public, anon, authenticated;

-- ---------------------------------------------------------------- cadastro pelo QR/link: 200 tentativas por negócio e 30 por rede, por hora
create or replace function public.public_join(p_slug text, p_name text, p_email text default null, p_phone text default null, p_consent boolean default false, p_birthday date default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  b uuid; st jsonb; cid uuid; tok text; w record; cd record; q int;
  nm text := left(trim(coalesce(p_name, '')), 120);
  em text := nullif(lower(trim(p_email)), '');
  ph text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
begin
  select id, settings into b, st from public.businesses where slug = p_slug;
  if b is null then raise exception 'negócio não encontrado'; end if;
  if length(nm) < 2 then raise exception 'informe seu nome'; end if;
  if em is null and ph is null then raise exception 'informe e-mail ou telefone'; end if;
  if em is not null and (length(em) > 160 or em !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'e-mail inválido'; end if;
  if ph is not null and length(ph) not between 8 and 15 then raise exception 'telefone inválido'; end if;
  if p_birthday is not null and (p_birthday > current_date or p_birthday < date '1900-01-01') then p_birthday := null; end if;
  -- teto de tentativas (conta também quem já é cliente: assim não dá para usar a função para testar contatos em massa)
  -- (30 por rede: Wi-Fi de loja e operadoras com IP compartilhado têm gente de verdade atrás do mesmo endereço)
  if not public.abuse_ok(b, 'join', 200, 30) then raise exception 'muitos_cadastros'; end if;
  select id into cid from public.customers
   where business_id = b and ((em is not null and lower(email) = em) or (ph is not null and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = ph)) limit 1;
  if cid is not null then return null; end if;      -- já tem cartão: nada de token, nada de alteração
  begin
    insert into public.customers(business_id, name, email, phone, birthday, marketing_consent, consent_at)
      values (b, nm, em, ph, p_birthday, coalesce(p_consent, false), case when p_consent then now() end) returning id, token into cid, tok;
  exception when unique_violation then
    return null;                                    -- cadastro simultâneo do mesmo e-mail
  end;
  -- carimbo de boas-vindas (nunca completa o cartão sozinho)
  select * into w from public.welcome_rule(st);
  if w.mode <> 'off' then
    select * into cd from public.cards where business_id = b and active limit 1;
    if cd.id is not null then
      q := least(w.qty, cd.stamps - 1);
      if q >= 1 and w.mode = 'auto' then
        insert into public.customer_cards(customer_id, card_id, stamps, total, last_stamp_at) values (cid, cd.id, q, q, now())
          on conflict (customer_id, card_id) do nothing;
        insert into public.stamp_events(business_id, customer_id, card_id, kind, qty, by_user, source, note)
          values (b, cid, cd.id, 'stamp', q, null, 'welcome', 'boas-vindas');
      elsif q >= 1 then
        insert into public.stamp_requests(business_id, customer_id, kind, qty) values (b, cid, 'welcome', q);
      end if;
    end if;
  end if;
  return tok;
end $$;
grant execute on function public.public_join(text, text, text, text, boolean, date) to anon, authenticated;

-- ---------------------------------------------------------------- Wi-Fi em troca de contato: 120 por negócio e 30 por rede, por hora; contato com formato válido
create or replace function public.public_wifi_pass(p_slug text, p_item uuid, p_visitor text, p_token text default null, p_name text default null, p_phone text default null, p_email text default null, p_consent boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare b uuid; it record; ph text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), ''); em text := nullif(lower(trim(coalesce(p_email, ''))), '');
begin
  select id into b from public.businesses where slug = p_slug;
  if b is null then return null; end if;
  select * into it from public.page_items where id = p_item and business_id = b and type = 'wifi';
  if it is null then return null; end if;
  if coalesce(it.label, '') <> 'lead' then return it.body; end if;
  if p_token is not null and exists (select 1 from public.customers where token = p_token and business_id = b) then
    perform public.public_track(p_slug, coalesce(p_visitor, 'cliente-' || left(p_token, 20)), 'wifi', null, null, null);
    return it.body;
  end if;
  if p_name is null or length(trim(p_name)) < 2 or not coalesce(p_consent, false) or (ph is null and em is null) then return null; end if;
  if ph is not null and length(ph) not between 8 and 15 then return null; end if;
  if em is not null and (length(em) > 120 or em !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then return null; end if;
  if not public.abuse_ok(b, 'wifi', 120, 30) then return null; end if;
  if not exists (select 1 from public.visitor_leads where business_id = b and visitor_id = p_visitor and created_at > now() - interval '10 minutes') then
    insert into public.visitor_leads(business_id, visitor_id, name, phone, email, consent, source)
    values (b, left(p_visitor, 64), left(trim(p_name), 80), nullif(left(trim(coalesce(p_phone, '')), 30), ''), em, true, 'wifi');
  end if;
  perform public.public_track(p_slug, p_visitor, 'wifi', null, null, null);
  return it.body;
end $$;
grant execute on function public.public_wifi_pass(text, uuid, text, text, text, text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------- visitas: no máximo 6.000 por negócio por hora; origem e aparelho só de listas conhecidas
create or replace function public.public_track(p_slug text, p_visitor text, p_kind text, p_src text default null, p_device text default null, p_lang text default null)
returns void language plpgsql security definer set search_path = public as $$
declare b uuid;
begin
  if p_kind not in ('view', 'card', 'wifi', 'join') or p_visitor is null or length(p_visitor) not between 8 and 64 then return; end if;
  select id into b from public.businesses where slug = p_slug;
  if b is null then return; end if;
  if exists (select 1 from public.visits where business_id = b and visitor_id = p_visitor and kind = p_kind and created_at > now() - interval '30 minutes') then return; end if;
  if (select count(*) from public.visits where business_id = b and created_at > now() - interval '1 hour') >= 6000 then return; end if;
  insert into public.visits(business_id, visitor_id, kind, src, device, lang)
  values (b, p_visitor, p_kind,
          case when p_src in ('qr', 'link', 'bio', 'whatsapp', 'facebook', 'instagram', 'telegram', 'x', 'linkedin', 'email', 'google', 'direto') then p_src end,
          case when p_device in ('celular', 'computador') then p_device end,
          left(regexp_replace(coalesce(p_lang, ''), '[^A-Za-z-]', '', 'g'), 12));
end $$;
grant execute on function public.public_track(text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- webhooks: endereço mais restrito (SSRF)
-- O banco não resolve DNS, então não dá para recusar "domínio que aponta para IP interno" de verdade (isso exigiria checar o IP na hora do envio,
-- fora do banco). O que dá para fechar aqui: só a porta 443 (antes qualquer porta de 2 a 5 dígitos, que alcança serviços internos), os serviços
-- de DNS curinga que devolvem 127.0.0.1/10.x pelo próprio nome (nip.io, sslip.io, localtest.me…) e a revalidação do endereço na hora do envio.
create or replace function public.webhook_url_ok(p_url text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare h text := lower(substring(coalesce(p_url, '') from '^[a-zA-Z]+://([^/:?#]+)'));
begin
  if p_url is null or length(p_url) > 500 or p_url ~ '[[:space:]<>"]' or h is null then return false; end if;
  if exists (select 1 from public.webhook_dev_hosts d where d.host = h) then return p_url ~* '^https?://'; end if;
  return p_url ~* '^https://([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}(:443)?([/?#][^[:space:]]*)?$'
     and h !~ '\.(local|localhost|internal|lan|home|corp|intranet|test|invalid|nip\.io|sslip\.io|xip\.io|localtest\.me|lvh\.me|traefik\.me|vcap\.me)$'
     and h !~ '^(localhost|metadata)\.';
end $$;

create or replace function public.webhook_send(p_delivery uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare d record; w record; ts text := extract(epoch from now())::bigint::text; sig text; rid bigint;
begin
  select * into d from public.webhook_deliveries where id = p_delivery for update;
  if d.id is null then return; end if;
  select * into w from public.webhooks where id = d.webhook_id;
  if w.id is null or not w.active then update public.webhook_deliveries set status = 'canceled', done_at = now() where id = d.id; return; end if;
  if not public.webhook_url_ok(w.url) then   -- endereço salvo antes das regras novas: não envia
    update public.webhook_deliveries set status = 'canceled', done_at = now() where id = d.id; return;
  end if;
  sig := encode(extensions.hmac(ts || '.' || d.payload::text, w.secret, 'sha256'), 'hex');   -- o pg_net envia exatamente payload::text
  select net.http_post(
    url := w.url, body := d.payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'SeuClienteFiel-Webhooks/1',
                                  'X-SCF-Event', d.event, 'X-SCF-Delivery', d.id::text, 'X-SCF-Signature', 't=' || ts || ',v1=' || sig),
    timeout_milliseconds := 8000) into rid;
  update public.webhook_deliveries set request_id = rid, attempts = attempts + 1, status = 'sent', sent_at = now() where id = d.id;
end $$;
revoke all on function public.webhook_url_ok(text), public.webhook_send(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- limite do plano: trava por negócio (cadastros simultâneos não passam do limite)
create or replace function public.enforce_client_limit() returns trigger language plpgsql security definer set search_path = public as $$
declare lim int := coalesce(public.client_limit(new.business_id), 30);
begin
  perform pg_advisory_xact_lock(hashtext('scf-client-limit:' || new.business_id::text));
  if (select count(*) from public.customers where business_id = new.business_id) >= lim then
    raise exception 'client_limit_reached' using errcode = 'P0001', hint = format('Limite de %s clientes do plano atingido.', lim);
  end if;
  return new;
end $$;

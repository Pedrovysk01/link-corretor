-- Avisos para outros sistemas (webhooks, 2026-10-23)
-- Cada negócio cadastra até 5 URLs (n8n, Make, Zapier, CRM, automação de WhatsApp…) e recebe os eventos do cartão:
--   customer.created · stamp.added · reward.redeemed · stamp.undone · stamp_request.created|approved|rejected · lead.wifi · webhook.test
-- O envio sai do próprio banco (pg_net, assíncrono: não atrasa o carimbo), em JSON, assinado com HMAC-SHA256:
--   X-SCF-Signature: t=<unix>,v1=<hex de hmac_sha256(segredo, "<t>.<corpo>")>   ·   X-SCF-Event · X-SCF-Delivery
-- Reenvio automático (pg_cron, a cada minuto) com espera crescente até 5 tentativas; 50 falhas seguidas desligam o webhook.
-- Formato e exemplos de verificação: docs/WEBHOOKS.md

create extension if not exists pg_net;

-- ---------------------------------------------------------------- tabelas
create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  url text not null,
  events text[] not null default '{}',                                    -- vazio = todos os eventos
  secret text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  active boolean not null default true,
  fails int not null default 0,
  last_status int, last_error text, last_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists webhooks_biz on public.webhooks(business_id);

create table if not exists public.webhook_deliveries (
  id uuid primary key,
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'retry', 'ok', 'failed', 'canceled')),
  attempts int not null default 0,
  request_id bigint,
  response_code int,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  done_at timestamptz
);
create index if not exists webhook_deliveries_hook on public.webhook_deliveries(webhook_id, created_at desc);
create index if not exists webhook_deliveries_status on public.webhook_deliveries(status) where status in ('sent', 'retry');

-- hosts liberados SÓ para testes locais (receptor falso no próprio computador). Vazio em produção; só o superusuário mexe.
create table if not exists public.webhook_dev_hosts (host text primary key);

alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.webhook_dev_hosts enable row level security;
drop policy if exists "owner manages webhooks" on public.webhooks;
create policy "owner manages webhooks" on public.webhooks for all using (public.is_owner(business_id)) with check (public.is_owner(business_id));
drop policy if exists "owner reads deliveries" on public.webhook_deliveries;
create policy "owner reads deliveries" on public.webhook_deliveries for select using (public.is_owner(business_id));
revoke all on public.webhooks, public.webhook_deliveries, public.webhook_dev_hosts from anon, authenticated;
grant select, insert, update (url, events, active), delete on public.webhooks to authenticated;
grant select on public.webhook_deliveries to authenticated;

-- ---------------------------------------------------------------- endereço permitido
-- só https com domínio de verdade (nada de IP, localhost, .local, .internal…) — o envio sai da rede do servidor
create or replace function public.webhook_url_ok(p_url text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare h text := lower(substring(coalesce(p_url, '') from '^[a-zA-Z]+://([^/:?#]+)'));
begin
  if p_url is null or length(p_url) > 500 or p_url ~ '[[:space:]<>"]' or h is null then return false; end if;
  if exists (select 1 from public.webhook_dev_hosts d where d.host = h) then return p_url ~* '^https?://'; end if;
  return p_url ~* '^https://([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}(:[0-9]{2,5})?([/?#][^[:space:]]*)?$'
     and h !~ '\.(local|localhost|internal|lan|home|corp|intranet|test|invalid)$';
end $$;

create or replace function public.webhooks_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.webhook_url_ok(new.url) then
    raise exception 'url_invalida' using errcode = '22023', hint = 'Use um endereço https:// com domínio (ex.: https://hooks.zapier.com/...).';
  end if;
  new.events := coalesce((select array_agg(distinct e) from unnest(new.events) e where e in
    ('customer.created', 'stamp.added', 'reward.redeemed', 'stamp.undone', 'stamp_request.created', 'stamp_request.approved', 'stamp_request.rejected', 'lead.wifi')), '{}');
  if tg_op = 'INSERT' then
    if (select count(*) from public.webhooks where business_id = new.business_id) >= 5 then raise exception 'limite_de_webhooks' using errcode = '22023'; end if;
    new.fails := 0; new.last_status := null; new.last_error := null; new.last_at := null;
  end if;
  if tg_op = 'UPDATE' and new.active and not old.active then new.fails := 0; end if;   -- religar zera a contagem de falhas
  return new;
end $$;
drop trigger if exists webhooks_guard on public.webhooks;
create trigger webhooks_guard before insert or update on public.webhooks for each row execute function public.webhooks_guard();

-- ---------------------------------------------------------------- envio
create or replace function public.webhook_send(p_delivery uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare d record; w record; ts text := extract(epoch from now())::bigint::text; sig text; rid bigint;
begin
  select * into d from public.webhook_deliveries where id = p_delivery for update;
  if d.id is null then return; end if;
  select * into w from public.webhooks where id = d.webhook_id;
  if w.id is null or not w.active then update public.webhook_deliveries set status = 'canceled', done_at = now() where id = d.id; return; end if;
  sig := encode(extensions.hmac(ts || '.' || d.payload::text, w.secret, 'sha256'), 'hex');   -- o pg_net envia exatamente payload::text
  select net.http_post(
    url := w.url, body := d.payload,
    headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'SeuClienteFiel-Webhooks/1',
                                  'X-SCF-Event', d.event, 'X-SCF-Delivery', d.id::text, 'X-SCF-Signature', 't=' || ts || ',v1=' || sig),
    timeout_milliseconds := 8000) into rid;
  update public.webhook_deliveries set request_id = rid, attempts = attempts + 1, status = 'sent', sent_at = now() where id = d.id;
end $$;

-- um evento para todos os webhooks ativos do negócio que assinam esse evento
create or replace function public.emit_event(p_business uuid, p_event text, p_data jsonb, p_only uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare w record; biz record; got boolean := false; did uuid; body jsonb; n int := 0;
begin
  if p_business is null then return 0; end if;
  for w in select id from public.webhooks where business_id = p_business and active and (p_only is null or id = p_only)
             and (p_only is not null or cardinality(events) = 0 or p_event = any(events)) loop
    if not got then select id, name, slug into biz from public.businesses where id = p_business; got := true; end if;
    did := gen_random_uuid();
    body := jsonb_build_object('id', did, 'event', p_event, 'created_at', now(),
                               'business', jsonb_build_object('id', biz.id, 'name', biz.name, 'slug', biz.slug), 'data', coalesce(p_data, '{}'::jsonb));
    insert into public.webhook_deliveries(id, webhook_id, business_id, event, payload) values (did, w.id, p_business, p_event, body);
    perform public.webhook_send(did);
    n := n + 1;
  end loop;
  return n;
end $$;

-- resultados (pg_net), reenvio com espera crescente (1, 4, 9, 16 min) e limpeza — chamado pelo pg_cron a cada minuto
create or replace function public.webhook_process() returns int
language plpgsql security definer set search_path = public as $$
declare d record; n int := 0; err text;
begin
  for d in select wd.id, wd.webhook_id, wd.attempts, r.status_code, r.error_msg, r.timed_out
             from public.webhook_deliveries wd join net._http_response r on r.id = wd.request_id where wd.status = 'sent' loop
    if d.status_code between 200 and 299 then
      update public.webhook_deliveries set status = 'ok', response_code = d.status_code, error = null, done_at = now() where id = d.id;
      update public.webhooks set last_status = d.status_code, last_error = null, last_at = now(), fails = 0 where id = d.webhook_id;
    else
      err := left(coalesce(nullif(d.error_msg, ''), case when d.timed_out then 'tempo esgotado' end, 'HTTP ' || d.status_code), 300);
      update public.webhook_deliveries set status = case when attempts >= 5 then 'failed' else 'retry' end, response_code = d.status_code, error = err,
             done_at = case when attempts >= 5 then now() end where id = d.id;
      update public.webhooks set last_status = d.status_code, last_error = err, last_at = now(), fails = fails + 1 where id = d.webhook_id;
    end if;
    n := n + 1;
  end loop;
  for d in select id from public.webhook_deliveries where status = 'retry' and sent_at < now() - make_interval(mins => attempts * attempts) order by sent_at limit 200 loop
    perform public.webhook_send(d.id);
  end loop;
  update public.webhook_deliveries set status = 'failed', error = coalesce(error, 'sem resposta'), done_at = now() where status = 'sent' and sent_at < now() - interval '1 day';
  update public.webhooks set active = false where active and fails >= 50;
  delete from public.webhook_deliveries where created_at < now() - interval '30 days';
  return n;
end $$;

-- ---------------------------------------------------------------- eventos (gatilhos)
create or replace function public.trg_customer_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.webhooks where business_id = new.business_id and active) then
    perform public.emit_event(new.business_id, 'customer.created', jsonb_build_object('customer', jsonb_build_object(
      'id', new.id, 'name', new.name, 'email', new.email, 'phone', new.phone, 'code', new.code, 'birthday', new.birthday,
      'marketing_consent', new.marketing_consent, 'created_at', new.created_at)));
  end if;
  return null;
end $$;
drop trigger if exists customers_webhook on public.customers;
create trigger customers_webhook after insert on public.customers for each row execute function public.trg_customer_event();

create or replace function public.trg_stamp_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; cc record; cd record; ev text;
begin
  ev := case new.kind when 'stamp' then 'stamp.added' when 'redeem' then 'reward.redeemed' when 'undo' then 'stamp.undone' end;
  if ev is null or not exists (select 1 from public.webhooks where business_id = new.business_id and active) then return null; end if;
  select id, name, code, phone, email into c from public.customers where id = new.customer_id;
  select stamps, total, redeemed into cc from public.customer_cards where customer_id = new.customer_id and card_id = new.card_id;
  select name, stamps, reward_label into cd from public.cards where id = new.card_id;
  perform public.emit_event(new.business_id, ev, jsonb_build_object(
    'customer', jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code, 'phone', c.phone, 'email', c.email),
    'qty', new.qty, 'source', new.source, 'stamps', coalesce(cc.stamps, 0), 'total', coalesce(cc.total, 0), 'redeemed', coalesce(cc.redeemed, 0),
    'full', coalesce(cc.stamps, 0) >= coalesce(cd.stamps, 0) and cd.stamps is not null,
    'card', jsonb_build_object('name', cd.name, 'stamps', cd.stamps, 'reward', cd.reward_label)));
  return null;
end $$;
drop trigger if exists stamp_events_webhook on public.stamp_events;
create trigger stamp_events_webhook after insert on public.stamp_events for each row execute function public.trg_stamp_event();

create or replace function public.trg_request_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record; ev text;
begin
  if tg_op = 'INSERT' then ev := 'stamp_request.created';
  elsif new.status is distinct from old.status and new.status in ('approved', 'rejected') then ev := 'stamp_request.' || new.status;
  else return null; end if;
  if not exists (select 1 from public.webhooks where business_id = new.business_id and active) then return null; end if;
  select id, name, code, phone, email into c from public.customers where id = new.customer_id;
  perform public.emit_event(new.business_id, ev, jsonb_build_object(
    'request', jsonb_build_object('id', new.id, 'kind', new.kind, 'qty', new.qty, 'status', new.status, 'note', new.note, 'created_at', new.created_at),
    'customer', jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code, 'phone', c.phone, 'email', c.email)));
  return null;
end $$;
drop trigger if exists stamp_requests_webhook on public.stamp_requests;
create trigger stamp_requests_webhook after insert or update of status on public.stamp_requests for each row execute function public.trg_request_event();

create or replace function public.trg_lead_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.webhooks where business_id = new.business_id and active) then
    perform public.emit_event(new.business_id, 'lead.wifi', jsonb_build_object('lead', jsonb_build_object(
      'id', new.id, 'name', new.name, 'phone', new.phone, 'email', new.email, 'consent', new.consent, 'source', new.source, 'created_at', new.created_at)));
  end if;
  return null;
end $$;
drop trigger if exists visitor_leads_webhook on public.visitor_leads;
create trigger visitor_leads_webhook after insert on public.visitor_leads for each row execute function public.trg_lead_event();

-- ---------------------------------------------------------------- ações do dono no painel
-- teste: manda um "webhook.test" só para este webhook
create or replace function public.webhook_test(p_webhook uuid) returns int
language plpgsql security definer set search_path = public as $$
declare w record;
begin
  select id, business_id into w from public.webhooks where id = p_webhook;
  if w.id is null or not public.is_owner(w.business_id) then raise exception 'forbidden'; end if;
  update public.webhooks set active = true where id = w.id and not active;
  return public.emit_event(w.business_id, 'webhook.test', jsonb_build_object('message', 'Teste do Seu Cliente Fiel: se você recebeu, está tudo certo.'), w.id);
end $$;

-- trocar o segredo (se vazou ou para reconfigurar o destino)
create or replace function public.webhook_rotate_secret(p_webhook uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare w record; s text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  select id, business_id into w from public.webhooks where id = p_webhook;
  if w.id is null or not public.is_owner(w.business_id) then raise exception 'forbidden'; end if;
  update public.webhooks set secret = s where id = w.id;
  return s;
end $$;

revoke all on function public.webhook_url_ok(text), public.webhooks_guard(), public.webhook_send(uuid), public.emit_event(uuid, text, jsonb, uuid),
  public.webhook_process(), public.trg_customer_event(), public.trg_stamp_event(), public.trg_request_event(), public.trg_lead_event() from public, anon, authenticated;
revoke all on function public.webhook_test(uuid), public.webhook_rotate_secret(uuid) from public, anon;
grant execute on function public.webhook_test(uuid), public.webhook_rotate_secret(uuid) to authenticated;

-- ---------------------------------------------------------------- agendador (reenvio)
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(jobid) from cron.job where jobname = 'scf-webhooks';
    perform cron.schedule('scf-webhooks', '* * * * *', 'select public.webhook_process()');
  end if;
exception when others then
  raise notice 'pg_cron indisponível (%): o 1º envio funciona, mas sem reenvio automático.', sqlerrm;
end $$;

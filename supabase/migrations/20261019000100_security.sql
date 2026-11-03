-- Segurança (2026-10-09)
--  1) public_join não devolve mais o cartão (token) de quem já existe
--  2) coluna do plano (e trial/dono) travada: só o servidor muda — o dono não consegue se dar "Pro" pelo navegador
--  3) links e imagens da página pública só em https (ou e-mail/telefone nos contatos)

-- ---------------------------------------------------------------- 1) public_join
-- Antes: quem soubesse o e-mail/telefone de um cliente recebia o TOKEN dele (= o cartão, o QR e o histórico).
-- Agora: se o contato já existe, a função devolve NULL e não altera nada (nem o consentimento de marketing).
-- O cliente recupera o cartão pelo link/QR que já recebeu ou pedindo ao atendente.
create or replace function public.public_join(p_slug text, p_name text, p_email text default null, p_phone text default null, p_consent boolean default false, p_birthday date default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  b uuid; cid uuid; tok text;
  nm text := left(trim(coalesce(p_name, '')), 120);
  em text := nullif(lower(trim(p_email)), '');
  ph text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
begin
  select id into b from public.businesses where slug = p_slug;
  if b is null then raise exception 'negócio não encontrado'; end if;
  if length(nm) < 2 then raise exception 'informe seu nome'; end if;
  if em is null and ph is null then raise exception 'informe e-mail ou telefone'; end if;
  if em is not null and (length(em) > 160 or em !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'e-mail inválido'; end if;
  if ph is not null and length(ph) not between 8 and 15 then raise exception 'telefone inválido'; end if;
  if p_birthday is not null and (p_birthday > current_date or p_birthday < date '1900-01-01') then p_birthday := null; end if;

  select id into cid from public.customers
   where business_id = b and ((em is not null and lower(email) = em) or (ph is not null and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = ph)) limit 1;
  if cid is not null then return null; end if;      -- já tem cartão: nada de token, nada de alteração

  begin
    insert into public.customers(business_id, name, email, phone, birthday, marketing_consent, consent_at)
      values (b, nm, em, ph, p_birthday, coalesce(p_consent, false), case when p_consent then now() end) returning token into tok;
  exception when unique_violation then
    return null;                                    -- cadastro simultâneo do mesmo e-mail
  end;
  return tok;
end $$;

-- ---------------------------------------------------------------- 2) plano travado
-- Quem roda como "authenticated"/"anon" (o navegador) não muda plan, trial, dono nem datas; funções security definer
-- (ensure_business…), o service_role (webhook de pagamento) e o postgres continuam podendo.
create or replace function public.guard_business_columns() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    new.plan := 'free'; new.trial := true;           -- negócio criado direto pela API sempre nasce Free/teste
    return new;
  end if;
  if new.plan is distinct from old.plan or new.trial is distinct from old.trial
     or new.owner_id is distinct from old.owner_id or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'plan_locked' using errcode = '42501', hint = 'O plano só é alterado pelo servidor (pagamento).';
  end if;
  return new;
end $$;
drop trigger if exists businesses_guard on public.businesses;
create trigger businesses_guard before insert or update on public.businesses for each row execute function public.guard_business_columns();

-- único caminho para mudar o plano: o servidor (webhook de pagamento com a chave service_role)
create or replace function public.set_business_plan(p_business uuid, p_plan text, p_trial boolean default false) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_plan not in ('free', 'pro', 'business', 'multi') then raise exception 'plano inválido'; end if;
  update public.businesses set plan = p_plan, trial = p_trial where id = p_business;
end $$;
revoke all on function public.set_business_plan(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.set_business_plan(uuid, text, boolean) to service_role;

-- o dono também não pode "passar" o negócio para outro usuário nem apagar a trava via UPDATE com troca de dono
drop policy if exists "owner updates business" on public.businesses;
create policy "owner updates business" on public.businesses for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------- 3) https na página pública
-- NOT VALID: vale para tudo que for gravado daqui em diante sem reprovar linhas antigas (rode VALIDATE depois de conferir).
alter table public.page_items drop constraint if exists page_items_url_safe;
alter table public.page_items add constraint page_items_url_safe check (
  url is null or url = ''
  or url ~* '^https://[^[:space:]<>"'']+$'                                   -- link
  or url ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'                 -- e-mail (contato)
  or url ~ '^[+0-9][0-9 ().-]{7,}$'                                          -- telefone/WhatsApp (contato)
) not valid;

alter table public.businesses drop constraint if exists businesses_logo_safe, drop constraint if exists businesses_cover_safe;
alter table public.businesses add constraint businesses_logo_safe check (
  logo_url is null or logo_url = '' or logo_url ~* '^https://[^[:space:]<>"'']+$' or logo_url ~* '^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$'
) not valid;
alter table public.businesses add constraint businesses_cover_safe check (
  cover_url is null or cover_url = '' or cover_url ~* '^https://[^[:space:]<>"'']+$' or cover_url ~* '^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$'
) not valid;

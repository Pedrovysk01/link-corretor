-- Contatos do site (formulário /contato/): a página grava só pela função submit_lead; ninguém lê pela API pública.
-- Leitura: painel do Supabase (service_role) ou integração de CRM com a chave service_role.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (length(name) between 2 and 120),
  email text not null check (length(email) <= 160),
  phone text check (phone is null or length(phone) <= 30),
  business text check (business is null or length(business) <= 120),
  segment text check (segment is null or length(segment) <= 60),
  message text check (message is null or length(message) <= 2000),
  consent boolean not null check (consent),
  source jsonb not null default '{}'::jsonb      -- página, origem e UTMs/gclid da campanha
);
create index if not exists leads_created on public.leads(created_at desc);
create index if not exists leads_email on public.leads(lower(email));
alter table public.leads enable row level security;   -- sem políticas: anon/authenticated não leem nem gravam direto
revoke all on public.leads from anon, authenticated;

create or replace function public.submit_lead(p_name text, p_email text, p_phone text default null, p_business text default null, p_segment text default null,
  p_message text default null, p_consent boolean default false, p_hp text default '', p_source jsonb default '{}'::jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare em text := lower(trim(coalesce(p_email, ''))); src jsonb := coalesce(p_source, '{}'::jsonb);
begin
  if coalesce(p_hp, '') <> '' then return true; end if;                          -- isca anti-robô preenchida: finge sucesso, não grava
  if not coalesce(p_consent, false) then raise exception 'consentimento obrigatório'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'informe seu nome'; end if;
  if em !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(em) > 160 then raise exception 'e-mail inválido'; end if;
  if length(src::text) > 4000 then src := '{}'::jsonb; end if;
  -- limites contra abuso: o mesmo e-mail 1 vez a cada 10 min; no máximo 300 contatos por hora no total
  if exists (select 1 from public.leads where lower(email) = em and created_at > now() - interval '10 minutes') then return true; end if;
  if (select count(*) from public.leads where created_at > now() - interval '1 hour') >= 300 then raise exception 'tente novamente mais tarde'; end if;
  insert into public.leads(name, email, phone, business, segment, message, consent, source)
    values (left(trim(p_name), 120), em, nullif(left(trim(coalesce(p_phone, '')), 30), ''), nullif(left(trim(coalesce(p_business, '')), 120), ''),
            nullif(left(trim(coalesce(p_segment, '')), 60), ''), nullif(left(trim(coalesce(p_message, '')), 2000), ''), true, src);
  return true;
end $$;
revoke all on function public.submit_lead(text, text, text, text, text, text, boolean, text, jsonb) from public;
grant execute on function public.submit_lead(text, text, text, text, text, text, boolean, text, jsonb) to anon, authenticated;

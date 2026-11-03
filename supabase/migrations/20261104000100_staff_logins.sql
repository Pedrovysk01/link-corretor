-- Logins para a equipe.
-- O dono convida (nome + e-mail) na tela Funcionários; o painel cria a linha em public.staff com um código secreto (invite_token) e
-- monta o link  <painel>/?equipe=<código>. O funcionário abre o link, cria a conta (ou entra) e o painel chama staff_accept:
-- a linha ganha o user_id e vira 'active'. A partir daí can_manage() libera para ele os clientes e os carimbos desse negócio
-- (customers, stamp_events, stamp_requests, give_stamp/redeem/undo), e NÃO libera cartões, campanhas, página, pesquisas,
-- faturamento nem configurações (policies com is_owner). my_workspace() diz ao painel se quem entrou é dono ou funcionário,
-- para não criar um negócio vazio para o funcionário (ensure_business só roda para quem não é de nenhuma equipe).
-- O link vai por WhatsApp ou e-mail do próprio dono: não depende do SMTP do Supabase.

alter table public.staff add column if not exists invite_token text;
alter table public.staff add column if not exists accepted_at timestamptz;
update public.staff set invite_token = encode(extensions.gen_random_bytes(12), 'hex') where invite_token is null;
alter table public.staff alter column invite_token set default encode(extensions.gen_random_bytes(12), 'hex');
alter table public.staff alter column invite_token set not null;
create unique index if not exists staff_invite_token_idx on public.staff(invite_token);
-- um mesmo login só uma vez por negócio
create unique index if not exists staff_business_user_idx on public.staff(business_id, user_id) where user_id is not null;

-- o que o funcionário vê ao abrir o link, antes de entrar: nome do negócio e o dele (o código é o segredo; sem ele, nada)
create or replace function public.staff_invite_info(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case when s.status = 'revoked' then jsonb_build_object('ok', false, 'revoked', true)
                when s.status = 'active' and s.user_id is not null then jsonb_build_object('ok', false, 'used', true)
                else jsonb_build_object('ok', true, 'name', s.name, 'business', b.name, 'email', s.email) end
    from public.staff s join public.businesses b on b.id = s.business_id
    where p_token ~ '^[0-9a-f]{20,64}$' and s.invite_token = p_token),
    jsonb_build_object('ok', false))
$$;

-- aceita o convite com a conta logada: liga o user_id à linha e ativa
create or replace function public.staff_accept(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s record; b record; em text;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into s from public.staff where p_token ~ '^[0-9a-f]{20,64}$' and invite_token = p_token;
  if s.id is null then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  if s.status = 'revoked' then return jsonb_build_object('ok', false, 'error', 'revoked'); end if;
  if s.status = 'active' and s.user_id is not null and s.user_id <> auth.uid() then return jsonb_build_object('ok', false, 'error', 'used'); end if;
  select email into em from auth.users where id = auth.uid();
  -- se este login já tinha outra linha neste negócio, ela sai (fica só a do convite aceito)
  delete from public.staff where business_id = s.business_id and user_id = auth.uid() and id <> s.id;
  update public.staff set user_id = auth.uid(), status = 'active', accepted_at = coalesce(accepted_at, now()), email = coalesce(nullif(email, ''), em) where id = s.id;
  select id, name into b from public.businesses where id = s.business_id;
  return jsonb_build_object('ok', true, 'business_id', b.id, 'business', b.name, 'name', s.name);
end $$;

-- onde quem entrou trabalha: dono do próprio negócio, funcionário ativo de um negócio, ou ninguém (aí o painel cria o negócio)
create or replace function public.my_workspace() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object('role', 'owner', 'business_id', b.id) from public.businesses b where b.owner_id = auth.uid() order by b.created_at limit 1),
    (select jsonb_build_object('role', 'staff', 'business_id', s.business_id, 'staff_id', s.id, 'name', s.name)
       from public.staff s where s.user_id = auth.uid() and s.status = 'active' order by s.accepted_at desc nulls last, s.created_at desc limit 1),
    jsonb_build_object('role', 'none'))
$$;

revoke all on function public.staff_invite_info(text), public.staff_accept(text), public.my_workspace() from public;
grant execute on function public.staff_invite_info(text) to anon, authenticated;
grant execute on function public.staff_accept(text), public.my_workspace() to authenticated;

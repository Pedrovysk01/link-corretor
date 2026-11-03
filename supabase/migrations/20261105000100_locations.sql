-- Filiais: um cartão para todas as unidades do negócio, com os números separados por filial.
-- public.locations = as unidades (a matriz é o próprio negócio: carimbo sem filial conta como "Matriz").
-- stamp_events.location_id = onde o carimbo foi dado: o aparelho escolhe a filial (localStorage) ou, se quem carimba é um
-- funcionário com filial atribuída (staff.location_id), ela entra sozinha. customers.location_id = filial do 1º carimbo.
-- location_stats() compara as filiais (carimbos, clientes, resgates). A ficha do Google por filial continua em settings.gmaps["loc:<id>"].

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  address text not null default '',
  phone text,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists locations_business_idx on public.locations(business_id, position);
alter table public.locations enable row level security;
drop policy if exists "team reads locations" on public.locations;
drop policy if exists "owner inserts locations" on public.locations;
drop policy if exists "owner updates locations" on public.locations;
drop policy if exists "owner deletes locations" on public.locations;
create policy "team reads locations" on public.locations for select using (public.can_manage(business_id));
create policy "owner inserts locations" on public.locations for insert with check (public.is_owner(business_id));
create policy "owner updates locations" on public.locations for update using (public.is_owner(business_id)) with check (public.is_owner(business_id));
create policy "owner deletes locations" on public.locations for delete using (public.is_owner(business_id));
grant select, insert, update, delete on public.locations to authenticated;

alter table public.staff add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.stamp_events add column if not exists location_id uuid references public.locations(id) on delete set null;
create index if not exists stamp_events_location_idx on public.stamp_events(business_id, location_id, created_at desc);
alter table public.customers add column if not exists location_id uuid references public.locations(id) on delete set null;

-- filial de quem está carimbando: a informada (tem que ser do negócio) ou a do funcionário logado
create or replace function public.stamp_location(p_business uuid, p_location uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select case when p_location is not null then (select l.id from public.locations l where l.id = p_location and l.business_id = p_business)
              else (select s.location_id from public.staff s where s.business_id = p_business and s.user_id = auth.uid() and s.status = 'active' limit 1) end
$$;
revoke all on function public.stamp_location(uuid, uuid) from public, anon, authenticated;

-- give_stamp ganha a filial (4º parâmetro, opcional). A versão de 3 parâmetros sai: com as duas, a chamada ficaria ambígua.
drop function if exists public.give_stamp(uuid, int, text);
create or replace function public.give_stamp(p_customer uuid, p_qty int default 1, p_source text default 'panel', p_location uuid default null)
returns table (added int, stamps int, total_stamps int, full boolean, card_id uuid)
language plpgsql security definer set search_path = public as $$
declare c record; cd record; room int; add int; loc uuid;
begin
  select * into c from public.customers where id = p_customer;
  if c is null then raise exception 'customer not found'; end if;
  if not public.can_manage(c.business_id) then raise exception 'forbidden'; end if;
  if p_location is not null and not exists (select 1 from public.locations l where l.id = p_location and l.business_id = c.business_id) then raise exception 'location not found'; end if;
  loc := public.stamp_location(c.business_id, p_location);
  select * into cd from public.cards where business_id = c.business_id and active limit 1;
  if cd is null then raise exception 'no active card'; end if;
  perform pg_advisory_xact_lock(hashtext(p_customer::text));
  insert into public.customer_cards(customer_id, card_id) values (p_customer, cd.id) on conflict do nothing;
  select cc.stamps into room from public.customer_cards cc where cc.customer_id = p_customer and cc.card_id = cd.id;
  room := cd.stamps - room;
  add := greatest(0, least(coalesce(p_qty, 1), room));
  if add > 0 then
    update public.customer_cards cc set stamps = cc.stamps + add, total = cc.total + add, last_stamp_at = now()
      where cc.customer_id = p_customer and cc.card_id = cd.id;
    insert into public.stamp_events(business_id, customer_id, card_id, kind, qty, by_user, source, location_id)
      values (c.business_id, p_customer, cd.id, 'stamp', add, auth.uid(), p_source, loc);
    if loc is not null and c.location_id is null then update public.customers set location_id = loc where id = p_customer; end if;
  end if;
  return query select add, cc.stamps, cc.total, cc.stamps >= cd.stamps, cd.id from public.customer_cards cc where cc.customer_id = p_customer and cc.card_id = cd.id;
end $$;

drop function if exists public.give_stamp_by_token(text, int);
create or replace function public.give_stamp_by_token(p_token text, p_qty int default 1, p_location uuid default null)
returns table (customer_name text, added int, stamps int, card_stamps int, full boolean)
language plpgsql security definer set search_path = public as $$
declare c record; r record; cd record;
begin
  select * into c from public.customers where token = p_token;
  if c is null then raise exception 'token inválido'; end if;
  select * into r from public.give_stamp(c.id, p_qty, 'scan', p_location);
  select * into cd from public.cards where id = r.card_id;
  return query select c.name, r.added, r.stamps, cd.stamps, r.full;
end $$;

drop function if exists public.give_stamp_by_code(text, int);
create or replace function public.give_stamp_by_code(p_code text, p_qty int default 1, p_location uuid default null)
returns table (customer_name text, added int, stamps int, card_stamps int, full boolean)
language plpgsql security definer set search_path = public as $$
declare c record; r record; cd record; k text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if k !~ '^[A-HJ-NP-Z2-9]{6}$' then raise exception 'código inválido'; end if;
  select cu.id, cu.name into c from public.customers cu where cu.code = k and public.can_manage(cu.business_id) order by cu.created_at desc limit 1;
  if c.id is null then raise exception 'código não encontrado'; end if;
  select * into r from public.give_stamp(c.id, p_qty, 'code', p_location);
  select * into cd from public.cards where id = r.card_id;
  return query select c.name, r.added, r.stamps, cd.stamps, r.full;
end $$;

-- resgate também registra a filial (a informada ou a do funcionário)
create or replace function public.redeem_reward(p_customer uuid, p_source text default 'panel') returns boolean
language plpgsql security definer set search_path = public as $$
declare c record; cd record; cur int;
begin
  select * into c from public.customers where id = p_customer;
  if c is null or not public.can_manage(c.business_id) then raise exception 'forbidden'; end if;
  select * into cd from public.cards where business_id = c.business_id and active limit 1;
  perform pg_advisory_xact_lock(hashtext(p_customer::text));
  select stamps into cur from public.customer_cards where customer_id = p_customer and card_id = cd.id;
  if coalesce(cur, 0) < cd.stamps then return false; end if;
  update public.customer_cards set stamps = 0, redeemed = redeemed + 1 where customer_id = p_customer and card_id = cd.id;
  insert into public.stamp_events(business_id, customer_id, card_id, kind, qty, by_user, source, location_id)
    values (c.business_id, p_customer, cd.id, 'redeem', 1, auth.uid(), p_source, public.stamp_location(c.business_id, null));
  return true;
end $$;

-- números por filial (null = matriz): carimbos (menos os desfeitos), últimos 30 dias, clientes distintos, resgates, último carimbo
create or replace function public.location_stats(p_business uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.can_manage(p_business) then coalesce((
    select jsonb_agg(x) from (
      select e.location_id,
             coalesce(sum(e.qty) filter (where e.kind = 'stamp'), 0) - coalesce(sum(e.qty) filter (where e.kind = 'undo'), 0) as stamps,
             coalesce(sum(e.qty) filter (where e.kind = 'stamp' and e.created_at > now() - interval '30 days'), 0) as stamps_30d,
             count(distinct e.customer_id) filter (where e.kind = 'stamp') as customers,
             count(*) filter (where e.kind = 'redeem') as redeems,
             max(e.created_at) filter (where e.kind = 'stamp') as last_at
      from public.stamp_events e where e.business_id = p_business group by e.location_id) x), '[]'::jsonb)
  else null end
$$;

-- my_workspace passa a dizer a filial do funcionário
create or replace function public.my_workspace() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select jsonb_build_object('role', 'owner', 'business_id', b.id) from public.businesses b where b.owner_id = auth.uid() order by b.created_at limit 1),
    (select jsonb_build_object('role', 'staff', 'business_id', s.business_id, 'staff_id', s.id, 'name', s.name, 'location_id', s.location_id,
                               'location', (select l.name from public.locations l where l.id = s.location_id))
       from public.staff s where s.user_id = auth.uid() and s.status = 'active' order by s.accepted_at desc nulls last, s.created_at desc limit 1),
    jsonb_build_object('role', 'none'))
$$;

revoke all on function public.give_stamp(uuid, int, text, uuid), public.give_stamp_by_token(text, int, uuid), public.give_stamp_by_code(text, int, uuid), public.location_stats(uuid) from public, anon;
grant execute on function public.give_stamp(uuid, int, text, uuid), public.give_stamp_by_token(text, int, uuid), public.give_stamp_by_code(text, int, uuid), public.location_stats(uuid), public.redeem_reward(uuid, text), public.my_workspace() to authenticated;

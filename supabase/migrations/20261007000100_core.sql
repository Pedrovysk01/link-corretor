-- Cliente Fiel — núcleo: negócios, cartões, clientes, carimbos (ledger), campanhas, conteúdo da página.
-- Convenções: 1 dono (auth.users) = N negócios, mas o painel v1 usa o primeiro. RLS por owner_id.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ------------------------------------------------------------ util
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.slugify(t text) returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(coalesce(t, ''))), '[^a-z0-9]+', '-', 'g'))
$$;

-- ------------------------------------------------------------ negócios
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  tagline text default '',
  address text default '',
  logo_url text,
  cover_url text,
  page_color text default '#fef0c7',
  tz text default 'America/Sao_Paulo',
  currency text default 'BRL',
  type text default 'Café',
  plan text not null default 'free' check (plan in ('free','pro','business','multi')),
  trial boolean not null default true,
  settings jsonb not null default '{}'::jsonb,   -- legalType, legalName, privacyEmail, customFields, visitFreq, lang, share, print, birthday, google
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.businesses(owner_id);
create trigger businesses_updated before update on public.businesses for each row execute function public.set_updated_at();

-- ------------------------------------------------------------ cartões
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  stamps int not null default 8 check (stamps between 2 and 20),
  header text not null default 'RECOMPENSAS',
  reward_text text not null default 'Colete carimbos e ganhe recompensas!',
  reward_label text not null default 'Recompensa',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.cards(business_id);
create trigger cards_updated before update on public.cards for each row execute function public.set_updated_at();
-- só 1 cartão ativo por negócio
create unique index cards_one_active on public.cards(business_id) where active;

-- ------------------------------------------------------------ clientes
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  birthday date,
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),  -- identifica o cliente na página pública / QR
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.customers(business_id);
create unique index customers_email_per_business on public.customers(business_id, lower(email)) where email is not null and email <> '';
create trigger customers_updated before update on public.customers for each row execute function public.set_updated_at();

-- progresso por (cliente, cartão) — permite "manter ambos" os cartões
create table public.customer_cards (
  customer_id uuid not null references public.customers(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  stamps int not null default 0 check (stamps >= 0),
  total int not null default 0,
  redeemed int not null default 0,
  last_stamp_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (customer_id, card_id)
);
create trigger customer_cards_updated before update on public.customer_cards for each row execute function public.set_updated_at();

-- ledger: cada carimbo/resgate/desfazer é um evento (quem, quando, onde, motivo)
create table public.stamp_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  kind text not null check (kind in ('stamp','redeem','undo')),
  qty int not null default 1,
  by_user uuid references auth.users(id),
  source text not null default 'panel',  -- panel | scan | kiosk | api
  note text,
  created_at timestamptz not null default now()
);
create index on public.stamp_events(business_id, created_at desc);
create index on public.stamp_events(customer_id, created_at desc);

-- ------------------------------------------------------------ campanhas
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  tpl text not null default 'custom',
  title text not null,
  notification text not null,
  header text,
  card_text text,
  audience text not null default 'all',
  reach int not null default 0,
  style text default 'classic',
  banner text,
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active','ended')),
  created_at timestamptz not null default now()
);
create index on public.campaigns(business_id, created_at desc);

-- ------------------------------------------------------------ conteúdo da página pública
create table public.page_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null check (type in ('menu','news','link','contact')),
  title text not null,
  body text default '',
  label text default '',
  url text default '',
  items jsonb not null default '[]'::jsonb,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.page_items(business_id, position);

-- ------------------------------------------------------------ equipe (funcionários que carimbam)
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending','active','revoked')),
  created_at timestamptz not null default now()
);
create index on public.staff(business_id);
create index on public.staff(user_id);

-- ------------------------------------------------------------ RLS
alter table public.businesses enable row level security;
alter table public.cards enable row level security;
alter table public.customers enable row level security;
alter table public.customer_cards enable row level security;
alter table public.stamp_events enable row level security;
alter table public.campaigns enable row level security;
alter table public.page_items enable row level security;
alter table public.staff enable row level security;

-- quem pode agir por um negócio: dono ou funcionário ativo
create or replace function public.can_manage(b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses where id = b and owner_id = auth.uid())
      or exists (select 1 from public.staff where business_id = b and user_id = auth.uid() and status = 'active')
$$;
create or replace function public.is_owner(b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses where id = b and owner_id = auth.uid())
$$;

create policy "owner reads business" on public.businesses for select using (owner_id = auth.uid() or public.can_manage(id));
create policy "owner inserts business" on public.businesses for insert with check (owner_id = auth.uid());
create policy "owner updates business" on public.businesses for update using (owner_id = auth.uid());
create policy "owner deletes business" on public.businesses for delete using (owner_id = auth.uid());

create policy "manage cards" on public.cards for all using (public.can_manage(business_id)) with check (public.is_owner(business_id));
create policy "manage customers" on public.customers for all using (public.can_manage(business_id)) with check (public.can_manage(business_id));
create policy "read customer_cards" on public.customer_cards for select using (exists (select 1 from public.customers c where c.id = customer_id and public.can_manage(c.business_id)));
create policy "read stamp_events" on public.stamp_events for select using (public.can_manage(business_id));
create policy "manage campaigns" on public.campaigns for all using (public.is_owner(business_id)) with check (public.is_owner(business_id));
create policy "manage page_items" on public.page_items for all using (public.is_owner(business_id)) with check (public.is_owner(business_id));
create policy "manage staff" on public.staff for all using (public.is_owner(business_id)) with check (public.is_owner(business_id));
create policy "staff reads self" on public.staff for select using (user_id = auth.uid());
-- escrita em customer_cards / stamp_events só via RPC (security definer)

-- ------------------------------------------------------------ RPCs do dono
-- garante que o usuário logado tem um negócio (cria no primeiro login) e devolve o id
create or replace function public.ensure_business(p_name text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare b uuid; base text; s text; n int := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select id into b from public.businesses where owner_id = auth.uid() order by created_at limit 1;
  if b is not null then return b; end if;
  base := coalesce(nullif(public.slugify(p_name), ''), 'negocio');
  s := base;
  while exists (select 1 from public.businesses where slug = s) loop n := n + 1; s := base || '-' || n; end loop;
  insert into public.businesses(owner_id, name, slug) values (auth.uid(), coalesce(nullif(p_name, ''), 'Meu negócio'), s) returning id into b;
  insert into public.cards(business_id, name, reward_label) values (b, coalesce(nullif(p_name, ''), 'Meu negócio'), 'Um café por conta da casa');
  return b;
end $$;

-- dar carimbo (atômico): respeita o teto do cartão, grava no ledger, devolve estado
create or replace function public.give_stamp(p_customer uuid, p_qty int default 1, p_source text default 'panel')
returns table (added int, stamps int, total_stamps int, full boolean, card_id uuid)
language plpgsql security definer set search_path = public as $$
declare c record; cd record; room int; add int;
begin
  select * into c from public.customers where id = p_customer;
  if c is null then raise exception 'customer not found'; end if;
  if not public.can_manage(c.business_id) then raise exception 'forbidden'; end if;
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
    insert into public.stamp_events(business_id, customer_id, card_id, kind, qty, by_user, source)
      values (c.business_id, p_customer, cd.id, 'stamp', add, auth.uid(), p_source);
  end if;
  return query select add, cc.stamps, cc.total, cc.stamps >= cd.stamps, cd.id from public.customer_cards cc where cc.customer_id = p_customer and cc.card_id = cd.id;
end $$;

-- carimbar pelo token do QR do cliente (scanner do funcionário)
create or replace function public.give_stamp_by_token(p_token text, p_qty int default 1)
returns table (customer_name text, added int, stamps int, card_stamps int, full boolean)
language plpgsql security definer set search_path = public as $$
declare c record; r record; cd record;
begin
  select * into c from public.customers where token = p_token;
  if c is null then raise exception 'token inválido'; end if;
  select * into r from public.give_stamp(c.id, p_qty, 'scan');
  select * into cd from public.cards where id = r.card_id;
  return query select c.name, r.added, r.stamps, cd.stamps, r.full;
end $$;

-- resgatar recompensa (zera o cartão, grava no ledger)
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
  insert into public.stamp_events(business_id, customer_id, card_id, kind, qty, by_user, source) values (c.business_id, p_customer, cd.id, 'redeem', 1, auth.uid(), p_source);
  return true;
end $$;

-- desfazer o último carimbo dado hoje (toast "Desfazer")
create or replace function public.undo_last_stamp(p_customer uuid) returns int
language plpgsql security definer set search_path = public as $$
declare c record; ev record;
begin
  select * into c from public.customers where id = p_customer;
  if c is null or not public.can_manage(c.business_id) then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtext(p_customer::text));
  select * into ev from public.stamp_events where customer_id = p_customer and kind = 'stamp' and created_at > now() - interval '10 minutes' order by created_at desc limit 1;
  if ev is null then return 0; end if;
  update public.customer_cards set stamps = greatest(0, stamps - ev.qty), total = greatest(0, total - ev.qty) where customer_id = p_customer and card_id = ev.card_id;
  insert into public.stamp_events(business_id, customer_id, card_id, kind, qty, by_user, source, note) values (c.business_id, p_customer, ev.card_id, 'undo', ev.qty, auth.uid(), 'panel', ev.id::text);
  return ev.qty;
end $$;

-- substituir cartão: todos voltam a zero
create or replace function public.replace_card(p_business uuid, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  if not public.is_owner(p_business) then raise exception 'forbidden'; end if;
  update public.cards set active = false where business_id = p_business;
  insert into public.cards(business_id, name, active) values (p_business, p_name, true) returning id into nid;
  return nid;
end $$;

-- ------------------------------------------------------------ RPCs públicas (anon) — página do cliente
-- dados públicos do negócio pelo slug (sem e-mails, sem clientes)
create or replace function public.public_business(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', b.id, 'name', b.name, 'slug', b.slug, 'tagline', b.tagline, 'address', b.address, 'logo_url', b.logo_url, 'cover_url', b.cover_url, 'page_color', b.page_color,
    'legal', jsonb_build_object('name', b.settings->>'legalName', 'privacyEmail', b.settings->>'privacyEmail'),
    'card', (select to_jsonb(c) - 'business_id' from public.cards c where c.business_id = b.id and c.active limit 1),
    'items', coalesce((select jsonb_agg(to_jsonb(p) - 'business_id' order by p.position, p.created_at) from public.page_items p where p.business_id = b.id), '[]'::jsonb),
    'campaign', (select jsonb_build_object('header', k.header, 'text', k.card_text, 'ends_at', k.ends_at) from public.campaigns k where k.business_id = b.id and k.status = 'active' and k.ends_at > now() order by k.created_at desc limit 1)
  ) from public.businesses b where b.slug = p_slug
$$;

-- cliente entra pelo QR: cria (ou reaproveita pelo e-mail/telefone) e devolve o token
create or replace function public.public_join(p_slug text, p_name text, p_email text default null, p_phone text default null, p_consent boolean default false, p_birthday date default null)
returns text language plpgsql security definer set search_path = public as $$
declare b uuid; cid uuid; tok text; em text := nullif(lower(trim(p_email)), ''); ph text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
begin
  select id into b from public.businesses where slug = p_slug;
  if b is null then raise exception 'negócio não encontrado'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'informe seu nome'; end if;
  if em is null and ph is null then raise exception 'informe e-mail ou telefone'; end if;
  select id, token into cid, tok from public.customers where business_id = b and ((em is not null and lower(email) = em) or (ph is not null and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = ph)) limit 1;
  if cid is null then
    insert into public.customers(business_id, name, email, phone, birthday, marketing_consent, consent_at)
      values (b, trim(p_name), em, ph, p_birthday, coalesce(p_consent, false), case when p_consent then now() end) returning id, token into cid, tok;
  else
    update public.customers set marketing_consent = marketing_consent or coalesce(p_consent, false), consent_at = coalesce(consent_at, case when p_consent then now() end) where id = cid;
  end if;
  return tok;
end $$;

-- o cartão do cliente pelo token: progresso + últimos eventos
create or replace function public.public_card(p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'customer', jsonb_build_object('id', c.id, 'name', c.name, 'token', c.token),
    'business', public.public_business(b.slug),
    'stamps', coalesce(cc.stamps, 0), 'total', coalesce(cc.total, 0), 'redeemed', coalesce(cc.redeemed, 0), 'last_stamp_at', cc.last_stamp_at,
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'qty', e.qty, 'at', e.created_at) order by e.created_at desc) from (select * from public.stamp_events where customer_id = c.id order by created_at desc limit 20) e), '[]'::jsonb)
  )
  from public.customers c
  join public.businesses b on b.id = c.business_id
  left join public.cards cd on cd.business_id = b.id and cd.active
  left join public.customer_cards cc on cc.customer_id = c.id and cc.card_id = cd.id
  where c.token = p_token
$$;

-- permissões: anon só nas RPCs públicas; authenticated nas tabelas (via RLS) e RPCs do dono
revoke all on all functions in schema public from public, anon;
grant execute on function public.public_business(text), public.public_join(text, text, text, text, boolean, date), public.public_card(text) to anon, authenticated;
grant execute on function public.ensure_business(text), public.give_stamp(uuid, int, text), public.give_stamp_by_token(text, int), public.redeem_reward(uuid, text), public.undo_last_stamp(uuid), public.replace_card(uuid, text), public.can_manage(uuid), public.is_owner(uuid) to authenticated;
grant select, insert, update, delete on public.businesses, public.cards, public.customers, public.campaigns, public.page_items, public.staff to authenticated;
grant select on public.customer_cards, public.stamp_events to authenticated;

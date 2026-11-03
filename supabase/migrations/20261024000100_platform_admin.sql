-- Superadmin da plataforma + integração com o Forja (chatbots de IA, um Worker do Cloudflare por cliente), 2026-10-24.
--
-- O que entra aqui:
--   platform_admins   quem é superadmin (usuários do auth). Ninguém lê pela API; só a função is_platform_admin() consulta.
--   forja_instances   o bot Forja de cada negócio (nome, URL do Worker, estado e as últimas métricas). O dono vê o SEU; o superadmin vê todos.
--   forja_secrets     o Bearer (CONTROL_PLANE_TOKEN) de cada bot. SEM acesso para anon/authenticated: só a função forja-proxy (service_role) lê.
--   nav_items         itens que o superadmin atribui ao menu lateral do cliente (grupo, rótulo, ícone, tipo e destino). O dono só lê os seus.
--   RPCs admin_*      leitura agregada de todos os negócios (clientes, carimbos, visitantes, ficha do Google, Forja) e gravação do menu/Forja.
--
-- Para virar superadmin:  insert into public.platform_admins(user_id, note) values ('<uuid do auth.users>', 'eu');
-- Detalhes e fluxo local × online: docs/FORJA.md

-- ---------------------------------------------------------------- quem é superadmin
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.uid() is not null and exists (select 1 from public.platform_admins where user_id = auth.uid()), false)
$$;
grant execute on function public.is_platform_admin() to authenticated;

-- ---------------------------------------------------------------- instâncias do Forja (uma por negócio)
create table if not exists public.forja_instances (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  name text not null,
  base_url text not null check (base_url ~ '^https://[a-z0-9.-]+(:[0-9]+)?(/[^?#\s]*)?$'),  -- só https e sem query/fragmento
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'pending' check (status in ('pending', 'ok', 'error', 'off')),
  last_seen_at timestamptz,
  last_metrics jsonb,          -- última resposta de GET /api/metrics do bot ({range, leads, messages, conversations, health_score})
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists forja_instances_biz on public.forja_instances(business_id);
alter table public.forja_instances enable row level security;
drop policy if exists "owner or admin reads forja" on public.forja_instances;
create policy "owner or admin reads forja" on public.forja_instances for select
  using (public.is_owner(business_id) or public.can_manage(business_id) or public.is_platform_admin());
drop policy if exists "admin writes forja" on public.forja_instances;
create policy "admin writes forja" on public.forja_instances for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.forja_instances from anon, authenticated;
grant select on public.forja_instances to authenticated;   -- gravação só pelas RPCs admin_* (abaixo)

-- o Bearer de cada bot: nunca sai para o navegador
create table if not exists public.forja_secrets (
  instance_id uuid primary key references public.forja_instances(id) on delete cascade,
  control_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.forja_secrets enable row level security;
revoke all on public.forja_secrets from anon, authenticated;

-- ---------------------------------------------------------------- itens do menu lateral atribuídos pelo superadmin
create table if not exists public.nav_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  group_label text not null default 'Atendimento',
  label text not null check (length(label) between 1 and 40),
  icon text not null default 'zap' check (icon ~ '^[a-z0-9-]{1,30}$'),
  kind text not null check (kind in ('forja', 'url', 'route')),
  -- forja: a tela do painel do bot (overview, conversations, leads, kb, config, agente, campanas, insights…)
  -- url:   endereço externo (só https) · route: rota interna do painel (ex.: /integrations)
  target text not null,
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint nav_items_target_ok check (
    (kind = 'forja' and target ~ '^[a-z0-9_/-]{1,40}$') or
    (kind = 'url' and target ~ '^https://[^\s]{1,300}$') or
    (kind = 'route' and target ~ '^/[a-z0-9_/-]{0,60}$')
  )
);
create index if not exists nav_items_biz on public.nav_items(business_id, position);
alter table public.nav_items enable row level security;
drop policy if exists "owner or admin reads nav" on public.nav_items;
create policy "owner or admin reads nav" on public.nav_items for select
  using (public.is_owner(business_id) or public.can_manage(business_id) or public.is_platform_admin());
drop policy if exists "admin writes nav" on public.nav_items;
create policy "admin writes nav" on public.nav_items for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());
revoke all on public.nav_items from anon, authenticated;
grant select on public.nav_items to authenticated;

-- ---------------------------------------------------------------- RPCs do superadmin
-- Resumo de todos os negócios: quem é, plano, clientes, carimbos/visitantes nos últimos 30 dias, ficha do Google e estado do Forja.
create or replace function public.admin_businesses() returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query
  select jsonb_build_object(
    'id', b.id, 'name', b.name, 'slug', b.slug, 'plan', b.plan, 'trial', b.trial, 'created_at', b.created_at, 'logo_url', b.logo_url,
    'owner_email', (select u.email from auth.users u where u.id = b.owner_id),
    'customers', (select count(*) from public.customers c where c.business_id = b.id),
    'stamps_30d', (select coalesce(sum(case when e.kind = 'stamp' then e.qty when e.kind = 'undo' then -e.qty else 0 end), 0)
                   from public.stamp_events e where e.business_id = b.id and e.created_at > now() - interval '30 days'),
    'redeemed_30d', (select count(*) from public.stamp_events e where e.business_id = b.id and e.kind = 'redeem' and e.created_at > now() - interval '30 days'),
    'visitors_30d', (select count(distinct v.visitor_id) from public.visits v where v.business_id = b.id and v.created_at > now() - interval '30 days'),
    'gmaps', case when b.settings ? 'gmaps' then jsonb_build_object(
        'nome', b.settings->'gmaps'->'main'->>'nome', 'nota', b.settings->'gmaps'->'main'->>'nota',
        'total_avaliacoes', b.settings->'gmaps'->'main'->>'total_avaliacoes', 'place_id', b.settings->'gmaps'->'main'->>'place_id',
        'categoria', b.settings->'gmaps'->'main'->>'categoria', 'filiais', (select count(*) from jsonb_object_keys(b.settings->'gmaps') k where k like 'loc:%')) end,
    'forja', (select to_jsonb(f) - 'last_metrics' from public.forja_instances f where f.business_id = b.id),
    'nav_count', (select count(*) from public.nav_items n where n.business_id = b.id and n.active)
  )
  from public.businesses b order by b.created_at desc;
end $$;
grant execute on function public.admin_businesses() to authenticated;

-- Detalhe de um negócio: tudo que o superadmin precisa para dar suporte (ficha do Google completa, cartões, menu atribuído, Forja).
create or replace function public.admin_business(p_business uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'id', b.id, 'name', b.name, 'slug', b.slug, 'plan', b.plan, 'trial', b.trial, 'created_at', b.created_at, 'logo_url', b.logo_url,
    'tagline', b.tagline, 'address', b.address, 'tz', b.tz, 'currency', b.currency,
    'owner_email', (select u.email from auth.users u where u.id = b.owner_id),
    'gmaps', b.settings->'gmaps',
    'customers', (select count(*) from public.customers c where c.business_id = b.id),
    'stamps_total', (select coalesce(sum(case when e.kind = 'stamp' then e.qty when e.kind = 'undo' then -e.qty else 0 end), 0) from public.stamp_events e where e.business_id = b.id),
    'redeemed_total', (select count(*) from public.stamp_events e where e.business_id = b.id and e.kind = 'redeem'),
    'visitors_30d', (select count(distinct v.visitor_id) from public.visits v where v.business_id = b.id and v.created_at > now() - interval '30 days'),
    'leads', (select count(*) from public.visitor_leads l where l.business_id = b.id),
    'cards', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'stamps', c.stamps, 'active', c.active) order by c.created_at), '[]') from public.cards c where c.business_id = b.id),
    'staff', (select count(*) from public.staff s where s.business_id = b.id and s.status = 'active'),
    'webhooks', (select count(*) from public.webhooks w where w.business_id = b.id and w.active),
    'forja', (select to_jsonb(f) from public.forja_instances f where f.business_id = b.id),
    'nav', (select coalesce(jsonb_agg(to_jsonb(n) order by n.position, n.created_at), '[]') from public.nav_items n where n.business_id = b.id)
  ) into r from public.businesses b where b.id = p_business;
  if r is null then raise exception 'negocio_inexistente'; end if;
  return r;
end $$;
grant execute on function public.admin_business(uuid) to authenticated;

-- Substitui o menu atribuído a um negócio. p_items: [{group_label, label, icon, kind, target, active}] (até 12; a ordem da lista é a posição).
create or replace function public.admin_set_nav(p_business uuid, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it jsonb; i int := 0;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'itens_invalidos'; end if;
  if jsonb_array_length(p_items) > 12 then raise exception 'limite_de_itens'; end if;
  if not exists (select 1 from public.businesses where id = p_business) then raise exception 'negocio_inexistente'; end if;
  delete from public.nav_items where business_id = p_business;
  for it in select * from jsonb_array_elements(p_items) loop
    insert into public.nav_items(business_id, group_label, label, icon, kind, target, position, active)
    values (p_business, coalesce(nullif(trim(it->>'group_label'), ''), 'Atendimento'), trim(it->>'label'), coalesce(nullif(it->>'icon', ''), 'zap'),
            it->>'kind', trim(it->>'target'), i, coalesce((it->>'active')::boolean, true));
    i := i + 1;
  end loop;
  return (select coalesce(jsonb_agg(to_jsonb(n) order by n.position), '[]') from public.nav_items n where n.business_id = p_business);
end $$;
grant execute on function public.admin_set_nav(uuid, jsonb) to authenticated;

-- Vincula (ou atualiza) o bot Forja de um negócio. O token só é gravado quando vem preenchido e nunca é devolvido.
create or replace function public.admin_upsert_forja(p_business uuid, p_name text, p_base_url text, p_token text default null, p_tier text default 'free') returns jsonb
language plpgsql security definer set search_path = public as $$
declare iid uuid;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.businesses where id = p_business) then raise exception 'negocio_inexistente'; end if;
  insert into public.forja_instances(business_id, name, base_url, tier)
  values (p_business, trim(p_name), regexp_replace(trim(p_base_url), '/+$', ''), coalesce(p_tier, 'free'))
  on conflict (business_id) do update set name = excluded.name, base_url = excluded.base_url, tier = excluded.tier, status = 'pending', last_error = null, updated_at = now()
  returning id into iid;
  if nullif(trim(coalesce(p_token, '')), '') is not null then
    insert into public.forja_secrets(instance_id, control_token) values (iid, trim(p_token))
    on conflict (instance_id) do update set control_token = excluded.control_token, updated_at = now();
  end if;
  return (select to_jsonb(f) || jsonb_build_object('has_token', exists (select 1 from public.forja_secrets s where s.instance_id = f.id)) from public.forja_instances f where f.id = iid);
end $$;
grant execute on function public.admin_upsert_forja(uuid, text, text, text, text) to authenticated;

create or replace function public.admin_remove_forja(p_business uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  delete from public.forja_instances where business_id = p_business;   -- forja_secrets e nav_items do tipo forja ficam órfãos: o cascade limpa o segredo
  delete from public.nav_items where business_id = p_business and kind = 'forja';
end $$;
grant execute on function public.admin_remove_forja(uuid) to authenticated;

-- O dono (ou funcionário) vê se o seu bot tem token cadastrado, sem ver o token.
create or replace function public.my_forja() returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(f) || jsonb_build_object('has_token', exists (select 1 from public.forja_secrets s where s.instance_id = f.id))
  from public.forja_instances f
  where public.is_owner(f.business_id) or public.can_manage(f.business_id)
  order by f.created_at limit 1
$$;
grant execute on function public.my_forja() to authenticated;

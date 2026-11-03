-- Painel da plataforma (app/admin/) — operações do superadmin, 2026-10-26.
--   · is_platform_admin() passa a valer também para a service_role (API local tools/admin_api.py e funções do servidor)
--   · admin_audit: quem fez o quê (toda RPC de escrita registra)
--   · leitura: admin_stats (KPIs), admin_payments (negócios × assinatura Stripe), admin_billing_events, admin_customers, admin_audit_list
--   · escrita: admin_set_plan, admin_update_business, admin_set_card, admin_set_items, admin_import_model, admin_create_business
--   · modelo: admin_export_business → JSON com negócio, cartões e itens da página (para replicar em outro negócio / franquia)
-- Detalhes: docs/ADMIN.md

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', '') = 'service_role'
      or coalesce(auth.uid() is not null and exists (select 1 from public.platform_admins where user_id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------- auditoria
create table if not exists public.admin_audit (
  id bigserial primary key,
  user_id uuid,
  action text not null,
  business_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created on public.admin_audit(created_at desc);
alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon, authenticated;

create or replace function public.admin_log(p_action text, p_business uuid, p_details jsonb default null) returns void
language sql security definer set search_path = public as $$
  insert into public.admin_audit(user_id, action, business_id, details) values (auth.uid(), p_action, p_business, p_details)
$$;
revoke all on function public.admin_log(text, uuid, jsonb) from public, anon, authenticated;

create or replace function public.admin_audit_list(p_limit int default 200) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query select jsonb_build_object('id', a.id, 'at', a.created_at, 'action', a.action, 'business_id', a.business_id,
    'business', (select b.name from public.businesses b where b.id = a.business_id), 'by', (select u.email from auth.users u where u.id = a.user_id), 'details', a.details)
    from public.admin_audit a order by a.created_at desc limit greatest(1, least(p_limit, 1000));
end $$;
grant execute on function public.admin_audit_list(int) to authenticated;

-- ---------------------------------------------------------------- leitura
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'businesses', (select count(*) from public.businesses),
    'new_30d', (select count(*) from public.businesses where created_at > now() - interval '30 days'),
    'active_30d', (select count(distinct business_id) from public.stamp_events where created_at > now() - interval '30 days'),
    'paid', (select count(*) from public.businesses where plan <> 'free'),
    'trial', (select count(*) from public.businesses where trial and plan = 'free'),
    'sub_active', (select count(*) from public.billing_accounts where status in ('active', 'trialing')),
    'sub_past_due', (select count(*) from public.billing_accounts where status = 'past_due'),
    'sub_canceling', (select count(*) from public.billing_accounts where cancel_at_period_end and status in ('active', 'trialing', 'past_due')),
    'sub_month', (select count(*) from public.billing_accounts where status in ('active', 'trialing', 'past_due') and billing_interval = 'month'),
    'sub_year', (select count(*) from public.billing_accounts where status in ('active', 'trialing', 'past_due') and billing_interval = 'year'),
    'customers', (select count(*) from public.customers),
    'stamps_30d', (select coalesce(sum(case when kind = 'stamp' then qty when kind = 'undo' then -qty else 0 end), 0) from public.stamp_events where created_at > now() - interval '30 days'),
    'redeemed_30d', (select count(*) from public.stamp_events where kind = 'redeem' and created_at > now() - interval '30 days')
  );
end $$;
grant execute on function public.admin_stats() to authenticated;

create or replace function public.admin_payments() returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query select jsonb_build_object('id', b.id, 'name', b.name, 'slug', b.slug, 'plan', b.plan, 'trial', b.trial, 'created_at', b.created_at,
      'owner_email', (select u.email from auth.users u where u.id = b.owner_id),
      'customers', (select count(*) from public.customers c where c.business_id = b.id),
      'billing', case when a.business_id is null then null else jsonb_build_object('status', a.status, 'interval', a.billing_interval, 'period_end', a.current_period_end,
        'cancel_at_end', a.cancel_at_period_end, 'customer_id', a.stripe_customer_id, 'subscription_id', a.stripe_subscription_id, 'price_id', a.price_id, 'updated_at', a.updated_at) end)
    from public.businesses b left join public.billing_accounts a on a.business_id = b.id order by b.created_at desc;
end $$;
grant execute on function public.admin_payments() to authenticated;

create or replace function public.admin_billing_events(p_business uuid) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query select jsonb_build_object('id', e.id, 'type', e.type, 'at', e.created_at) from public.billing_events e where e.business_id = p_business order by e.created_at desc limit 100;
end $$;
grant execute on function public.admin_billing_events(uuid) to authenticated;

create or replace function public.admin_customers(p_business uuid) returns setof jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  return query select jsonb_build_object('id', c.id, 'name', c.name, 'email', c.email, 'phone', c.phone, 'birthday', c.birthday, 'code', c.code, 'created_at', c.created_at,
      'stamps', coalesce((select cc.stamps from public.customer_cards cc join public.cards k on k.id = cc.card_id where cc.customer_id = c.id and k.active order by k.created_at desc limit 1), 0),
      'total', coalesce((select sum(cc.total) from public.customer_cards cc where cc.customer_id = c.id), 0),
      'last', (select max(cc.last_stamp_at) from public.customer_cards cc where cc.customer_id = c.id))
    from public.customers c where c.business_id = p_business order by c.created_at desc;
end $$;
grant execute on function public.admin_customers(uuid) to authenticated;

-- ---------------------------------------------------------------- escrita
create or replace function public.admin_set_plan(p_business uuid, p_plan text, p_trial boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if p_plan not in ('free', 'pro', 'business', 'multi') then raise exception 'plano inválido'; end if;
  update public.businesses set plan = p_plan, trial = coalesce(p_trial, false), updated_at = now() where id = p_business;
  if not found then raise exception 'negocio_inexistente'; end if;
  perform public.admin_log('set_plan', p_business, jsonb_build_object('plan', p_plan, 'trial', p_trial));
  return jsonb_build_object('ok', true, 'plan', p_plan, 'trial', coalesce(p_trial, false));
end $$;
grant execute on function public.admin_set_plan(uuid, text, boolean) to authenticated;

-- campos do negócio (nome, frase, endereço, cor, fuso, moeda, tipo) e regras em settings (welcome, receipts, presence, legal…). O slug não muda.
create or replace function public.admin_update_business(p_business uuid, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare st jsonb; k text;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  select settings into st from public.businesses where id = p_business;
  if st is null then raise exception 'negocio_inexistente'; end if;
  if p_patch ? 'settings' and jsonb_typeof(p_patch->'settings') = 'object' then
    for k in select jsonb_object_keys(p_patch->'settings') loop
      if k in ('welcome', 'receipts', 'presence', 'legalType', 'legalName', 'privacyEmail', 'visitFreq', 'lang', 'customFields', 'birthday', 'google', 'share', 'print', 'pageBg')
      then st := st || jsonb_build_object(k, p_patch->'settings'->k); end if;
    end loop;
  end if;
  update public.businesses set
    name = coalesce(nullif(trim(p_patch->>'name'), ''), name), tagline = coalesce(p_patch->>'tagline', tagline), address = coalesce(p_patch->>'address', address),
    page_color = coalesce(nullif(p_patch->>'page_color', ''), page_color), tz = coalesce(nullif(p_patch->>'tz', ''), tz), currency = coalesce(nullif(p_patch->>'currency', ''), currency),
    type = coalesce(nullif(p_patch->>'type', ''), type), settings = st, updated_at = now()
  where id = p_business;
  perform public.admin_log('update_business', p_business, p_patch - 'settings' || jsonb_build_object('settings_keys', (select coalesce(jsonb_agg(x), '[]') from jsonb_object_keys(coalesce(p_patch->'settings', '{}'::jsonb)) x)));
  return public.admin_business(p_business);
end $$;
grant execute on function public.admin_update_business(uuid, jsonb) to authenticated;

-- cartão: cria (sem id) ou atualiza; nunca deixa o negócio sem cartão ativo (trigger da migração 25)
create or replace function public.admin_set_card(p_business uuid, p_card jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare cid uuid := nullif(p_card->>'id', '')::uuid; n int := coalesce((p_card->>'stamps')::int, 8);
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.businesses where id = p_business) then raise exception 'negocio_inexistente'; end if;
  if n < 2 or n > 20 then raise exception 'carimbos entre 2 e 20'; end if;
  if cid is not null and exists (select 1 from public.cards where id = cid and business_id = p_business) then
    update public.cards set name = coalesce(nullif(trim(p_card->>'name'), ''), name), stamps = n, header = coalesce(nullif(p_card->>'header', ''), header),
      reward_text = coalesce(p_card->>'reward_text', reward_text), reward_label = coalesce(nullif(p_card->>'reward_label', ''), reward_label),
      active = coalesce((p_card->>'active')::boolean, active), updated_at = now() where id = cid;
  else
    insert into public.cards(business_id, name, stamps, header, reward_text, reward_label, active)
    values (p_business, coalesce(nullif(trim(p_card->>'name'), ''), 'Cartão'), n, coalesce(nullif(p_card->>'header', ''), 'RECOMPENSAS'),
      coalesce(p_card->>'reward_text', 'Colete carimbos e ganhe recompensas!'), coalesce(nullif(p_card->>'reward_label', ''), 'Recompensa'), coalesce((p_card->>'active')::boolean, false))
    returning id into cid;
  end if;
  if coalesce((p_card->>'active')::boolean, false) then update public.cards set active = false where business_id = p_business and id <> cid; end if;
  perform public.admin_log('set_card', p_business, jsonb_build_object('card', cid, 'stamps', n, 'active', p_card->>'active'));
  return (select to_jsonb(c) from public.cards c where c.id = cid);
end $$;
grant execute on function public.admin_set_card(uuid, jsonb) to authenticated;

create or replace function public.admin_delete_card(p_business uuid, p_card uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if (select count(*) from public.cards where business_id = p_business) <= 1 then raise exception 'ultimo_cartao'; end if;
  delete from public.cards where id = p_card and business_id = p_business;
  perform public.admin_log('delete_card', p_business, jsonb_build_object('card', p_card));
end $$;
grant execute on function public.admin_delete_card(uuid, uuid) to authenticated;

-- itens da página: substitui a lista inteira (type, title, body, label, url, items, icon_only, onsite); a ordem da lista é a posição
create or replace function public.admin_set_items(p_business uuid, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it jsonb; i int := 0;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'itens_invalidos'; end if;
  if jsonb_array_length(p_items) > 60 then raise exception 'limite_de_itens'; end if;
  if not exists (select 1 from public.businesses where id = p_business) then raise exception 'negocio_inexistente'; end if;
  delete from public.page_items where business_id = p_business;
  for it in select * from jsonb_array_elements(p_items) loop
    insert into public.page_items(business_id, type, title, body, label, url, items, icon_only, onsite, position)
    values (p_business, it->>'type', coalesce(nullif(trim(it->>'title'), ''), 'Sem título'), coalesce(it->>'body', ''), coalesce(it->>'label', ''), coalesce(it->>'url', ''),
      case when jsonb_typeof(it->'items') = 'array' then it->'items' else '[]'::jsonb end, coalesce((it->>'icon_only')::boolean, false), coalesce((it->>'onsite')::boolean, false), i);
    i := i + 1;
  end loop;
  perform public.admin_log('set_items', p_business, jsonb_build_object('count', i));
  return (select coalesce(jsonb_agg(to_jsonb(p) order by p.position), '[]') from public.page_items p where p.business_id = p_business);
end $$;
grant execute on function public.admin_set_items(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------- modelo (exportar / importar)
create or replace function public.admin_export_business(p_business uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object('version', 1, 'exported_at', now(), 'source', jsonb_build_object('id', b.id, 'slug', b.slug),
    'business', jsonb_build_object('name', b.name, 'tagline', b.tagline, 'address', b.address, 'page_color', b.page_color, 'tz', b.tz, 'currency', b.currency, 'type', b.type,
      'logo_url', b.logo_url, 'cover_url', b.cover_url, 'settings', b.settings - 'gmaps' - 'billing'),
    'cards', (select coalesce(jsonb_agg(jsonb_build_object('name', c.name, 'stamps', c.stamps, 'header', c.header, 'reward_text', c.reward_text, 'reward_label', c.reward_label, 'active', c.active) order by c.created_at), '[]') from public.cards c where c.business_id = b.id),
    'page_items', (select coalesce(jsonb_agg(jsonb_build_object('type', p.type, 'title', p.title, 'body', p.body, 'label', p.label, 'url', p.url, 'items', p.items, 'icon_only', p.icon_only, 'onsite', p.onsite) order by p.position), '[]') from public.page_items p where p.business_id = b.id)
  ) into r from public.businesses b where b.id = p_business;
  if r is null then raise exception 'negocio_inexistente'; end if;
  return r;
end $$;
grant execute on function public.admin_export_business(uuid) to authenticated;

-- aplica um modelo a um negócio existente. p_replace = true apaga cartões e itens antes; false acrescenta. O nome e o slug não mudam.
create or replace function public.admin_import_model(p_business uuid, p_model jsonb, p_replace boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare bz jsonb := coalesce(p_model->'business', '{}'::jsonb); c jsonb; it jsonb; i int; nc int := 0; ni int := 0;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.businesses where id = p_business) then raise exception 'negocio_inexistente'; end if;
  if jsonb_typeof(p_model) <> 'object' then raise exception 'modelo_invalido'; end if;
  update public.businesses set tagline = coalesce(bz->>'tagline', tagline), address = coalesce(bz->>'address', address), page_color = coalesce(nullif(bz->>'page_color', ''), page_color),
    tz = coalesce(nullif(bz->>'tz', ''), tz), currency = coalesce(nullif(bz->>'currency', ''), currency), type = coalesce(nullif(bz->>'type', ''), type),
    logo_url = coalesce(nullif(bz->>'logo_url', ''), logo_url), cover_url = coalesce(nullif(bz->>'cover_url', ''), cover_url),
    settings = settings || coalesce(bz->'settings', '{}'::jsonb) - 'gmaps' - 'billing', updated_at = now() where id = p_business;
  if p_replace then delete from public.page_items where business_id = p_business; end if;
  if jsonb_typeof(p_model->'cards') = 'array' and jsonb_array_length(p_model->'cards') > 0 then
    if p_replace then delete from public.cards where business_id = p_business; end if;
    for c in select * from jsonb_array_elements(p_model->'cards') loop
      insert into public.cards(business_id, name, stamps, header, reward_text, reward_label, active)
      values (p_business, coalesce(nullif(c->>'name', ''), 'Cartão'), least(20, greatest(2, coalesce((c->>'stamps')::int, 8))), coalesce(nullif(c->>'header', ''), 'RECOMPENSAS'),
        coalesce(c->>'reward_text', 'Colete carimbos e ganhe recompensas!'), coalesce(nullif(c->>'reward_label', ''), 'Recompensa'), coalesce((c->>'active')::boolean, false) and p_replace);
      nc := nc + 1;
    end loop;
    if not exists (select 1 from public.cards where business_id = p_business and active) then
      update public.cards set active = true where id = (select id from public.cards where business_id = p_business order by created_at desc limit 1);
    end if;
  end if;
  if jsonb_typeof(p_model->'page_items') = 'array' then
    select coalesce(max(position), -1) + 1 into i from public.page_items where business_id = p_business;
    for it in select * from jsonb_array_elements(p_model->'page_items') loop
      insert into public.page_items(business_id, type, title, body, label, url, items, icon_only, onsite, position)
      values (p_business, it->>'type', coalesce(nullif(trim(it->>'title'), ''), 'Sem título'), coalesce(it->>'body', ''), coalesce(it->>'label', ''), coalesce(it->>'url', ''),
        case when jsonb_typeof(it->'items') = 'array' then it->'items' else '[]'::jsonb end, coalesce((it->>'icon_only')::boolean, false), coalesce((it->>'onsite')::boolean, false), i);
      i := i + 1; ni := ni + 1;
    end loop;
  end if;
  perform public.admin_log('import_model', p_business, jsonb_build_object('replace', p_replace, 'cards', nc, 'items', ni, 'from', p_model->'source'));
  return jsonb_build_object('ok', true, 'cards', nc, 'items', ni);
end $$;
grant execute on function public.admin_import_model(uuid, jsonb, boolean) to authenticated;

-- negócio para um dono já existente no auth (a conta é criada pela função admin-api / API local, que depois chama isto)
create or replace function public.admin_create_business(p_owner uuid, p_name text, p_plan text default 'free', p_trial boolean default true, p_model jsonb default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b uuid; base text; s text; n int := 0;
begin
  if not public.is_platform_admin() then raise exception 'forbidden'; end if;
  if not exists (select 1 from auth.users where id = p_owner) then raise exception 'dono_inexistente'; end if;
  if coalesce(p_plan, 'free') not in ('free', 'pro', 'business', 'multi') then raise exception 'plano inválido'; end if;
  base := coalesce(nullif(public.slugify(p_name), ''), 'negocio'); s := base;
  while exists (select 1 from public.businesses where slug = s) loop n := n + 1; s := base || '-' || n; end loop;
  insert into public.businesses(owner_id, name, slug, plan, trial) values (p_owner, coalesce(nullif(trim(p_name), ''), 'Meu negócio'), s, coalesce(p_plan, 'free'), coalesce(p_trial, true)) returning id into b;
  if p_model is not null and jsonb_typeof(p_model) = 'object' then perform public.admin_import_model(b, p_model, true); end if;
  if not exists (select 1 from public.cards where business_id = b) then insert into public.cards(business_id, name, reward_label) values (b, coalesce(nullif(trim(p_name), ''), 'Meu negócio'), 'Um café por conta da casa'); end if;
  perform public.admin_log('create_business', b, jsonb_build_object('owner', p_owner, 'plan', p_plan, 'model', p_model is not null));
  return jsonb_build_object('ok', true, 'id', b, 'slug', s);
end $$;
grant execute on function public.admin_create_business(uuid, text, text, boolean, jsonb) to authenticated;

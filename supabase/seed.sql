-- Dados de demonstração: dono demo + negócio "[SUA EMPRESA]" (slug sua-empresa) + 6 clientes. Senha: demo1234
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dono@clientefiel.test', crypt('demo1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"[Seu nome]"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'dono@clientefiel.test', '{"sub":"11111111-1111-1111-1111-111111111111","email":"dono@clientefiel.test"}', 'email', now(), now(), now())
on conflict do nothing;

insert into public.businesses (id, owner_id, name, slug, tagline, address, settings)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '[SUA EMPRESA]', 'sua-empresa', '[Sua frase de apresentação]', '[Endereço da empresa]', '{"privacyEmail":"voce@suaempresa.com.br","legalType":"individual"}')
on conflict (id) do nothing;
insert into public.cards (id, business_id, name, stamps, reward_label)
values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '[SUA EMPRESA]', 8, '[Sua recompensa]')
on conflict (id) do nothing;

insert into public.customers (id, business_id, name, email, phone, marketing_consent, consent_at, token) values
 ('44444444-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Cliente de exemplo', 'cliente@exemplo.com.br', null, true, now(), 'tok-cliente-demo'),
 ('44444444-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Ana Beatriz', 'ana@exemplo.com.br', '48999990001', true, now(), 'tok-ana-demo'),
 ('44444444-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Carlos Mendes', 'carlos@exemplo.com.br', '48999990002', false, null, 'tok-carlos-demo'),
 ('44444444-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'Juliana Rocha', 'ju.rocha@exemplo.com.br', null, true, now(), 'tok-ju-demo'),
 ('44444444-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'Marcos Lima', 'marcos@exemplo.com.br', null, true, now(), 'tok-marcos-demo'),
 ('44444444-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Fernanda Souza', 'fer@exemplo.com.br', '48999990003', true, now(), 'tok-fer-demo')
on conflict (id) do nothing;

insert into public.customer_cards (customer_id, card_id, stamps, total, last_stamp_at) values
 ('44444444-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 8, 8, now() - interval '1 day'),
 ('44444444-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 3, 3, now() - interval '2 days'),
 ('44444444-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 5, 5, now() - interval '6 days'),
 ('44444444-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 1, 1, now() - interval '9 days'),
 ('44444444-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 2, 2, now() - interval '13 days')
on conflict do nothing;

insert into public.stamp_events (business_id, customer_id, card_id, kind, qty, source, created_at)
select '22222222-2222-2222-2222-222222222222', cc.customer_id, cc.card_id, 'stamp', 1, 'seed', cc.last_stamp_at - (g || ' hours')::interval
from public.customer_cards cc, generate_series(0, 7) g where g < cc.stamps;

-- superadmin da plataforma (migração 20261024): o dono demo também é superadmin no ambiente local
insert into public.platform_admins (user_id, note) values ('11111111-1111-1111-1111-111111111111', 'dono demo (local)') on conflict (user_id) do nothing;

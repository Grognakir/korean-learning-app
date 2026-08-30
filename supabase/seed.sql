-- Dev-only тестовый пользователь для быстрого входа на локальной среде
-- (кнопка «Логин в dev», см. features/auth/actions.ts::devSignIn).
-- Вставляется напрямую в auth.users в обход GoTrue API и email-подтверждения
-- (enable_confirmations = true локально) — иначе кнопка не была бы "в один клик".
-- Применяется автоматически при `supabase start` / `supabase db reset`.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-0000000000d1',
  'authenticated',
  'authenticated',
  'dev@example.com',
  extensions.crypt('dev12345', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"Dev"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, created_at, updated_at
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-0000000000d1',
  '00000000-0000-0000-0000-0000000000d1',
  '{"sub":"00000000-0000-0000-0000-0000000000d1","email":"dev@example.com"}',
  'email',
  now(),
  now()
);

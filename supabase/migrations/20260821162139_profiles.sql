create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  font_latin text,
  font_kr text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT-политики для обычных пользователей нет намеренно: строка profiles
-- создаётся только триггером ниже (security definer), не прямой вставкой с клиента.

-- Начиная с этой версии Supabase CLI новые таблицы не открываются в Data API
-- автоматически (auto_expose_new_tables больше не включён по умолчанию) —
-- одних RLS-политик недостаточно, нужны и табличные GRANT для роли authenticated.
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

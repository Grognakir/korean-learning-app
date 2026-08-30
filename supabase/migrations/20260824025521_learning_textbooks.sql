-- Раздел «Обучение»: планы обучения, учебники, страницы учебника.
-- См. docs/dev_docs/3-dictionary-and-learning.md §2.2 и ADR-0002.

create table public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.textbooks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.learning_plans (id) on delete cascade,
  slug text not null unique,
  level int not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.textbook_pages (
  id uuid primary key default gen_random_uuid(),
  textbook_id uuid not null references public.textbooks (id) on delete cascade,
  -- Сквозной порядок страниц в учебнике (0-based) — идемпотентный ключ
  -- импорта, аналог external_id в словаре: page_number/lesson_number
  -- у части страниц nullable (оглавление, оборот титула), а page_index
  -- есть всегда.
  page_index int not null,
  page_number int,
  lesson_number int,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (textbook_id, page_index)
);

alter table public.learning_plans enable row level security;
alter table public.textbooks enable row level security;
alter table public.textbook_pages enable row level security;

-- Материал раздела «Обучение» — только для залогиненных пользователей
-- (docs/dev_docs/3-dictionary-and-learning.md §1.3/§2.2, ADR-0002), не для
-- anon. Запись — только через service_role (импорт-скрипт), обычным
-- пользователям политик на INSERT/UPDATE нет вовсе.
create policy "learning_plans_select_authenticated"
  on public.learning_plans for select
  to authenticated
  using (true);

create policy "textbooks_select_authenticated"
  on public.textbooks for select
  to authenticated
  using (true);

create policy "textbook_pages_select_authenticated"
  on public.textbook_pages for select
  to authenticated
  using (true);

-- Без явного GRANT RLS-политик недостаточно — см. примечание в
-- dev_steps/1-database-and-auth-setup.md про auto_expose_new_tables. Это
-- касается и service_role: он обходит RLS-политики, но не отменяет
-- необходимость табличного GRANT — импорт-скрипт (upsert = insert+update,
-- плюс select после) упал без этого с "permission denied", пока GRANT не
-- покрывал service_role явно.
grant select on public.learning_plans to authenticated;
grant select on public.textbooks to authenticated;
grant select on public.textbook_pages to authenticated;

grant select, insert, update on public.learning_plans to service_role;
grant select, insert, update on public.textbooks to service_role;
grant select, insert, update on public.textbook_pages to service_role;

-- Приватный bucket для иллюстраций/аудио учебника — раздаётся только через
-- подписанные URL, которые генерирует сервер после проверки сессии
-- (см. src/lib/supabase/admin.ts), публичного доступа нет.
insert into storage.buckets (id, name, public)
values ('textbook-assets', 'textbook-assets', false)
on conflict (id) do nothing;

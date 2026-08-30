-- Раздел «Словарь»: слова (words) с категориями, переводами, примерами,
-- примечаниями и формами как отдельными сущностями, плюс заготовка под
-- фразы (phrases) без UI/контента. См. docs/dev_docs/3-dictionary-and-learning.md §1.

create table public.words (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  -- Только у глобальных (импортированных) слов — идемпотентный ключ
  -- импорта, как и в остальных таблицах проекта. У слов, добавленных
  -- пользователем через UI, остаётся null.
  external_id text unique,
  headword text not null,
  reading text,
  part_of_speech text,
  level_tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.word_categories (
  word_id uuid not null references public.words (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (word_id, category_id)
);

create table public.translations (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words (id) on delete cascade,
  external_id text unique,
  text text not null,
  created_at timestamptz not null default now()
);

create table public.word_examples (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words (id) on delete cascade,
  external_id text unique,
  kr text not null,
  ru text not null,
  created_at timestamptz not null default now()
);

create table public.word_notes (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words (id) on delete cascade,
  external_id text unique,
  text text not null,
  created_at timestamptz not null default now()
);

-- Гибкая таблица форм/связей слова: обычные формы словоизменения
-- (label = "вежливая (해요체)", value = "걸어요") и связи с другими словами
-- (label = "антоним"/"синоним", value = заголовок связанного слова) —
-- без резолва в FK, просто текст, как и в источнике.
create table public.word_forms (
  id uuid primary key default gen_random_uuid(),
  word_id uuid not null references public.words (id) on delete cascade,
  external_id text unique,
  label text,
  value text not null,
  created_at timestamptz not null default now()
);

-- Впрок, без UI/контента/поиска в этом шаге — см. план.
create table public.phrases (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  external_id text unique,
  phrase_kr text not null,
  translation text not null,
  usage_note text,
  created_at timestamptz not null default now()
);

alter table public.words enable row level security;
alter table public.categories enable row level security;
alter table public.word_categories enable row level security;
alter table public.translations enable row level security;
alter table public.word_examples enable row level security;
alter table public.word_notes enable row level security;
alter table public.word_forms enable row level security;
alter table public.phrases enable row level security;

-- words: в отличие от textbook_pages, словарь читается и гостем
-- (US-1 в доке — гость ищет и видит только глобальные слова).
create policy "words_select"
  on public.words for select
  to anon, authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());

create policy "words_insert_own"
  on public.words for insert
  to authenticated
  with check (owner_user_id = auth.uid());

create policy "words_update_own"
  on public.words for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- categories: общий справочник, не приватный; пишется только импортом.
create policy "categories_select"
  on public.categories for select
  to anon, authenticated
  using (true);

-- Дочерние таблицы слова (word_categories/translations/word_examples/
-- word_notes/word_forms): видимость и право записи целиком зависят от
-- родительского слова в words, а не от собственного owner_user_id — у
-- этих таблиц его просто нет.
create policy "word_categories_select"
  on public.word_categories for select
  to anon, authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_categories.word_id
      and (w.owner_user_id is null or w.owner_user_id = auth.uid())
  ));

create policy "word_categories_insert_own"
  on public.word_categories for insert
  to authenticated
  with check (exists (
    select 1 from public.words w
    where w.id = word_categories.word_id
      and w.owner_user_id = auth.uid()
  ));

create policy "translations_select"
  on public.translations for select
  to anon, authenticated
  using (exists (
    select 1 from public.words w
    where w.id = translations.word_id
      and (w.owner_user_id is null or w.owner_user_id = auth.uid())
  ));

create policy "translations_insert_own"
  on public.translations for insert
  to authenticated
  with check (exists (
    select 1 from public.words w
    where w.id = translations.word_id
      and w.owner_user_id = auth.uid()
  ));

create policy "word_examples_select"
  on public.word_examples for select
  to anon, authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_examples.word_id
      and (w.owner_user_id is null or w.owner_user_id = auth.uid())
  ));

create policy "word_examples_insert_own"
  on public.word_examples for insert
  to authenticated
  with check (exists (
    select 1 from public.words w
    where w.id = word_examples.word_id
      and w.owner_user_id = auth.uid()
  ));

create policy "word_notes_select"
  on public.word_notes for select
  to anon, authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_notes.word_id
      and (w.owner_user_id is null or w.owner_user_id = auth.uid())
  ));

create policy "word_notes_insert_own"
  on public.word_notes for insert
  to authenticated
  with check (exists (
    select 1 from public.words w
    where w.id = word_notes.word_id
      and w.owner_user_id = auth.uid()
  ));

create policy "word_forms_select"
  on public.word_forms for select
  to anon, authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_forms.word_id
      and (w.owner_user_id is null or w.owner_user_id = auth.uid())
  ));

create policy "word_forms_insert_own"
  on public.word_forms for insert
  to authenticated
  with check (exists (
    select 1 from public.words w
    where w.id = word_forms.word_id
      and w.owner_user_id = auth.uid()
  ));

-- phrases: заготовка впрок — только чтение, без политик на запись у
-- обычных пользователей (появятся вместе с реальным импортом фраз).
create policy "phrases_select"
  on public.phrases for select
  to anon, authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());

-- Явный GRANT обязателен помимо RLS — см. примечание в миграции
-- learning_textbooks и в dev_steps/1-database-and-auth-setup.md.
grant select on public.words to anon, authenticated;
grant insert, update on public.words to authenticated;
grant select, insert, update on public.words to service_role;

grant select on public.categories to anon, authenticated;
grant select, insert on public.categories to service_role;

grant select on public.word_categories to anon, authenticated;
grant insert on public.word_categories to authenticated;
grant select, insert on public.word_categories to service_role;

grant select on public.translations to anon, authenticated;
grant insert on public.translations to authenticated;
grant select, insert on public.translations to service_role;

grant select on public.word_examples to anon, authenticated;
grant insert on public.word_examples to authenticated;
grant select, insert on public.word_examples to service_role;

grant select on public.word_notes to anon, authenticated;
grant insert on public.word_notes to authenticated;
grant select, insert on public.word_notes to service_role;

grant select on public.word_forms to anon, authenticated;
grant insert on public.word_forms to authenticated;
grant select, insert on public.word_forms to service_role;

grant select on public.phrases to anon, authenticated;

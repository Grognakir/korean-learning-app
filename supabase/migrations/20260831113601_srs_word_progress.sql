-- Тренажёр «Карточки слов»: SM-2-прогресс по каждому слову у пользователя
-- (одна строка = пользователь+слово, создаётся при первом ответе на
-- карточку; до этого слово считается «новым» — строки просто нет), плюс
-- настройка лимита новых карт за сессию в profiles. См. план
-- «Тренажёры → Карточки слов».

create table public.word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  ease_factor numeric not null default 2.5,
  interval_days numeric not null default 0,
  repetitions int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  last_rating text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word_id)
);

create index word_progress_user_due_idx
  on public.word_progress (user_id, due_at);

alter table public.word_progress enable row level security;

-- Приватная таблица прогресса — своя, без разделения на "глобальное/своё"
-- как у словаря: видно и пишется только через собственный user_id.
create policy "word_progress_select_own"
  on public.word_progress for select
  to authenticated
  using (user_id = auth.uid());

create policy "word_progress_insert_own"
  on public.word_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "word_progress_update_own"
  on public.word_progress for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.word_progress to authenticated;

alter table public.profiles
  add column srs_new_cards_per_session int not null default 20
    check (srs_new_cards_per_session between 5 and 50);

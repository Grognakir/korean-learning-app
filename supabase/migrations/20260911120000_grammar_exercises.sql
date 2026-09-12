-- Тренажёры → «Грамматика»: упражнения к конструкциям из grammar_points.
-- Одна строка на грамматику, каждый тип заданий — jsonb-массив: наборы
-- всегда читаются целиком и выбираются случайно при сборке сессии, отдельно
-- не фильтруются. Теория (объяснение, правила, примеры) остаётся в
-- grammar_points. Доступ как у topic_quiz_questions: чтение — гостям и
-- пользователям, запись — только service_role для импорта.

create table public.grammar_exercises (
  grammar_point_id uuid primary key references public.grammar_points (id) on delete cascade,
  drills jsonb not null,
  match jsonb not null,
  cloze jsonb not null,
  reply jsonb not null,
  blitz jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.grammar_exercises enable row level security;

create policy "grammar_exercises_select"
  on public.grammar_exercises for select
  to anon, authenticated
  using (true);

grant select on public.grammar_exercises to anon, authenticated;
grant select, insert, update on public.grammar_exercises to service_role;

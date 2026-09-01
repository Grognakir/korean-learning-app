-- Тренажёры → «Отработка тем»: quiz-вопросы по темам (не SRS — разовый
-- прогон вопросов по теме с подсчётом результата, без сохранения между
-- заходами). RLS — только authenticated, как остальной раздел «Обучение»
-- (в отличие от словаря, гостю не открыт).

create table public.topic_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  topic text not null,
  before_text text,
  after_text text,
  question_text text,
  options text[] not null,
  correct text not null,
  translation_ru text,
  hint jsonb,
  created_at timestamptz not null default now()
);

alter table public.topic_quiz_questions enable row level security;

create policy "topic_quiz_questions_select"
  on public.topic_quiz_questions for select
  to authenticated
  using (true);

grant select on public.topic_quiz_questions to authenticated;
grant select, insert, update on public.topic_quiz_questions to service_role;

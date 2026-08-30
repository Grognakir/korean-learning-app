-- Название урока (например "인사와 소개" для урока 1) до сих пор нигде не
-- хранилось — только lesson_number на textbook_pages. Нужно для отображения
-- "1과. 인사와 소개" в списке уроков и в составе урока.

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  textbook_id uuid not null references public.textbooks (id) on delete cascade,
  lesson_number int not null,
  title text not null,
  created_at timestamptz not null default now(),
  unique (textbook_id, lesson_number)
);

alter table public.lessons enable row level security;

create policy "lessons_select_authenticated"
  on public.lessons for select
  to authenticated
  using (true);

-- См. миграцию учебников: без явного GRANT RLS-политик недостаточно, и это
-- касается как authenticated, так и service_role (импорт-скрипт).
grant select on public.lessons to authenticated;
grant select, insert, update on public.lessons to service_role;

-- Словарь → «Грамматика»: новая таблица grammar_points, тот же паттерн
-- RLS/grant, что у phrases (гостю видно owner_user_id is null, запись —
-- только service_role для импорта).

create table public.grammar_points (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  external_id text unique,
  pattern text not null,
  short_desc text,
  category text not null,
  grammar_group text,
  lesson_label text,
  lessons int[],
  explanation text,
  usage text[],
  rules text[],
  -- examples/vocab — списки объектов {kr,ru}: jsonb, а не дочерние
  -- таблицы, как у words — этот контент всегда читается целиком вместе
  -- со своей записью, отдельно не фильтруется/не ищется.
  examples jsonb not null default '[]'::jsonb,
  vocab jsonb,
  created_at timestamptz not null default now()
);

alter table public.grammar_points enable row level security;

create policy "grammar_points_select"
  on public.grammar_points for select
  to anon, authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());

grant select on public.grammar_points to anon, authenticated;
grant select, insert, update on public.grammar_points to service_role;

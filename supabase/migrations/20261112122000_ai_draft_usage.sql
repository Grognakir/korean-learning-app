-- Суточный счётчик AI-черновиков слова: ограничивает расход бесплатной
-- квоты внешних провайдеров. Пользователь таблицу не читает и не пишет:
-- счётчик увеличивает только функция bump_ai_draft_usage, а пользователя
-- она берёт из auth.uid(), поэтому чужой счётчик изменить нельзя.
create table public.ai_draft_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

alter table public.ai_draft_usage enable row level security;
revoke all on public.ai_draft_usage from anon, authenticated;

create or replace function public.bump_ai_draft_usage()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  used int;
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  insert into public.ai_draft_usage (user_id, day, count)
  values (uid, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day)
  do update set count = public.ai_draft_usage.count + 1
  returning count into used;

  return used;
end;
$$;

revoke all on function public.bump_ai_draft_usage() from public, anon;
grant execute on function public.bump_ai_draft_usage() to authenticated;

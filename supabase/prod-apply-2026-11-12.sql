-- Версия строки прогресса: серверная запись ответа обновляет строку только
-- если версия не изменилась с момента чтения, поэтому два параллельных
-- ответа по одному слову не затирают друг друга.
alter table public.word_progress
  add column version int not null default 0;
-- Поиск слов по написанию и по переводу одним запросом. Раньше клиент
-- отдельно искал до 500 id переводов и подставлял их в URL запроса слов:
-- при частом совпадении («на» есть в сотнях переводов) выдача обрезалась,
-- а длинный список id мог упереться в лимит длины URL.
-- Возвращает строки words, поэтому к результату применимы встроенные
-- ресурсы, фильтры, сортировка и пагинация PostgREST. security invoker —
-- RLS таблиц words и translations действует как при обычном запросе.
create or replace function public.search_words(q text)
returns setof public.words
language sql
stable
security invoker
set search_path = public
as $$
  select w.*
  from public.words w
  cross join lateral (
    select '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  ) p
  where w.headword ilike p.pattern
     or exists (
       select 1 from public.translations t
       where t.word_id = w.id and t.text ilike p.pattern
     );
$$;

grant execute on function public.search_words(text) to anon, authenticated;
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

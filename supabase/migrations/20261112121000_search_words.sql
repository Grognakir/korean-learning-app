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

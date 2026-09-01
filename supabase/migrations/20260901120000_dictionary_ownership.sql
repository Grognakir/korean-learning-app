-- Владение словарём: личные категории, право править и удалять свои
-- слова, и атомарное сохранение слова одной транзакцией.

-- ---------------------------------------------------------------------
-- 1. Личные категории
-- ---------------------------------------------------------------------

alter table public.categories
  add column owner_user_id uuid references auth.users (id) on delete cascade;

-- Имя было уникально глобально — с личными категориями уникальность
-- становится «в пределах владельца», иначе своя «Еда» конфликтует с
-- импортированной. Заодно уходим от регистрозависимости: старый unique
-- пропускал «Еда» и «еда» рядом, а поиск категории при сохранении слова
-- шёл через регистронезависимый ilike и мог привязаться к любой из них.
alter table public.categories drop constraint categories_name_key;

create temporary table category_dupes on commit drop as
select c.id as dup_id, k.keep_id
from public.categories c
join (
  select lower(name) as name_key, min(id::text)::uuid as keep_id
  from public.categories
  group by lower(name)
) k on lower(c.name) = k.name_key
where c.id <> k.keep_id;

-- Сначала снимаем связи, которые после схлопывания дублей стали бы
-- повторным (word_id, category_id), потом переносим остальные.
delete from public.word_categories wc
using category_dupes d
where wc.category_id = d.dup_id
  and exists (
    select 1 from public.word_categories x
    where x.word_id = wc.word_id and x.category_id = d.keep_id
  );

update public.word_categories wc
set category_id = d.keep_id
from category_dupes d
where wc.category_id = d.dup_id;

delete from public.categories c
using category_dupes d
where c.id = d.dup_id;

create unique index categories_global_name_key
  on public.categories (lower(name))
  where owner_user_id is null;

create unique index categories_owner_name_key
  on public.categories (owner_user_id, lower(name))
  where owner_user_id is not null;

drop policy "categories_select" on public.categories;

create policy "categories_select"
  on public.categories for select
  to anon, authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());

-- Раньше любой залогиненный заводил категорию в общий справочник, и она
-- сразу попадала в фильтры и AI-промпт всех остальных.
drop policy "categories_insert_authenticated" on public.categories;

create policy "categories_insert_own"
  on public.categories for insert
  to authenticated
  with check (owner_user_id = auth.uid());

create policy "categories_delete_own"
  on public.categories for delete
  to authenticated
  using (owner_user_id = auth.uid());

grant delete on public.categories to authenticated;

-- ---------------------------------------------------------------------
-- 2. Правка и удаление своих слов
-- ---------------------------------------------------------------------

create policy "words_delete_own"
  on public.words for delete
  to authenticated
  using (owner_user_id = auth.uid());

-- Дочерние таблицы — то же условие, что у существующих *_insert_own:
-- право зависит от владельца родительского слова.
create policy "word_categories_delete_own"
  on public.word_categories for delete
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_categories.word_id
      and w.owner_user_id = auth.uid()
  ));

create policy "translations_update_own"
  on public.translations for update
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = translations.word_id and w.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.words w
    where w.id = translations.word_id and w.owner_user_id = auth.uid()
  ));

create policy "translations_delete_own"
  on public.translations for delete
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = translations.word_id and w.owner_user_id = auth.uid()
  ));

create policy "word_examples_update_own"
  on public.word_examples for update
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_examples.word_id and w.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.words w
    where w.id = word_examples.word_id and w.owner_user_id = auth.uid()
  ));

create policy "word_examples_delete_own"
  on public.word_examples for delete
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_examples.word_id and w.owner_user_id = auth.uid()
  ));

create policy "word_notes_update_own"
  on public.word_notes for update
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_notes.word_id and w.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.words w
    where w.id = word_notes.word_id and w.owner_user_id = auth.uid()
  ));

create policy "word_notes_delete_own"
  on public.word_notes for delete
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_notes.word_id and w.owner_user_id = auth.uid()
  ));

create policy "word_forms_update_own"
  on public.word_forms for update
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_forms.word_id and w.owner_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.words w
    where w.id = word_forms.word_id and w.owner_user_id = auth.uid()
  ));

create policy "word_forms_delete_own"
  on public.word_forms for delete
  to authenticated
  using (exists (
    select 1 from public.words w
    where w.id = word_forms.word_id and w.owner_user_id = auth.uid()
  ));

grant delete on public.words to authenticated;
grant delete on public.word_categories to authenticated;
grant update, delete on public.translations to authenticated;
grant update, delete on public.word_examples to authenticated;
grant update, delete on public.word_notes to authenticated;
grant update, delete on public.word_forms to authenticated;

-- ---------------------------------------------------------------------
-- 3. Атомарное сохранение слова
-- ---------------------------------------------------------------------

-- Раньше слово, категории, перевод, заметки и примеры вставлялись
-- отдельными запросами из server action: упавший на середине сценарий
-- оставлял в базе слово-огрызок, а поиск-или-создание категории двумя
-- запросами давал гонку. Здесь всё в одной транзакции, а security
-- invoker сохраняет RLS — функция не даёт больше прав, чем есть у
-- вызывающего.

create function public.apply_word_children(
  target_word_id uuid,
  uid uuid,
  payload jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  category_name text;
  resolved_category_id uuid;
begin
  insert into public.translations (word_id, text)
  values (target_word_id, payload->>'translation');

  if coalesce(payload->>'notes', '') <> '' then
    insert into public.word_notes (word_id, text)
    values (target_word_id, payload->>'notes');
  end if;

  insert into public.word_examples (word_id, kr, ru)
  select target_word_id, e->>'kr', e->>'ru'
  from jsonb_array_elements(coalesce(payload->'examples', '[]'::jsonb)) e
  where coalesce(e->>'kr', '') <> '' and coalesce(e->>'ru', '') <> '';

  for category_name in
    select distinct trim(value)
    from jsonb_array_elements_text(coalesce(payload->'categories', '[]'::jsonb))
    where trim(value) <> ''
  loop
    -- Общая категория с таким именем в приоритете над личной: не плодим
    -- личный дубль того, что уже есть в общем справочнике.
    select c.id into resolved_category_id
    from public.categories c
    where lower(c.name) = lower(category_name)
      and (c.owner_user_id is null or c.owner_user_id = uid)
    order by c.owner_user_id nulls first
    limit 1;

    if resolved_category_id is null then
      insert into public.categories (name, owner_user_id)
      values (category_name, uid)
      on conflict (owner_user_id, lower(name)) where owner_user_id is not null
        do nothing
      returning id into resolved_category_id;

      if resolved_category_id is null then
        select c.id into resolved_category_id
        from public.categories c
        where c.owner_user_id = uid and lower(c.name) = lower(category_name);
      end if;
    end if;

    insert into public.word_categories (word_id, category_id)
    values (target_word_id, resolved_category_id)
    on conflict do nothing;
  end loop;
end;
$$;

create function public.save_word(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_word_id uuid;
begin
  if uid is null then
    raise exception 'Нужно войти' using errcode = '42501';
  end if;

  insert into public.words (owner_user_id, headword, reading, part_of_speech)
  values (
    uid,
    payload->>'headword',
    payload->>'reading',
    payload->>'partOfSpeech'
  )
  returning id into new_word_id;

  perform public.apply_word_children(new_word_id, uid, payload);

  return new_word_id;
end;
$$;

-- Правка заменяет дочерние строки целиком: их немного, а diff по
-- переводам/примерам/категориям был бы заметно сложнее без выигрыша.
-- word_forms не трогаем — форму правки слова они не проходят.
create function public.update_word(target_word_id uuid, payload jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Нужно войти' using errcode = '42501';
  end if;

  update public.words
  set headword = payload->>'headword',
      reading = payload->>'reading',
      part_of_speech = payload->>'partOfSpeech',
      updated_at = now()
  where id = target_word_id and owner_user_id = uid;

  if not found then
    raise exception 'Слово не найдено' using errcode = '42501';
  end if;

  delete from public.translations where word_id = target_word_id;
  delete from public.word_notes where word_id = target_word_id;
  delete from public.word_examples where word_id = target_word_id;
  delete from public.word_categories where word_id = target_word_id;

  perform public.apply_word_children(target_word_id, uid, payload);
end;
$$;

grant execute on function public.apply_word_children(uuid, uuid, jsonb) to authenticated;
grant execute on function public.save_word(jsonb) to authenticated;
grant execute on function public.update_word(uuid, jsonb) to authenticated;

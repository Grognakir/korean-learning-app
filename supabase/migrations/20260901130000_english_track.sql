-- Второй язык обучения: колонка language на словах/категориях,
-- active_language в профиле. default 'ko' — чистый no-op для всех
-- существующих строк, бэкфилл не нужен.

alter table public.words
  add column language text not null default 'ko' check (language in ('ko', 'en'));

alter table public.categories
  add column language text not null default 'ko' check (language in ('ko', 'en'));

alter table public.profiles
  add column active_language text not null default 'ko' check (active_language in ('ko', 'en'));

create index words_language_idx on public.words (language);

-- Категории теперь именуются в пределах (владелец, язык), а не только
-- (владелец) — иначе общая "Еда" (ko) и потенциальная английская категория
-- с тем же именем конфликтовали бы. Существующие строки все language='ko',
-- расширение индекса лишним столбцом не может нарушить текущую уникальность.
drop index public.categories_global_name_key;
drop index public.categories_owner_name_key;

create unique index categories_global_name_key
  on public.categories (language, lower(name))
  where owner_user_id is null;

create unique index categories_owner_name_key
  on public.categories (owner_user_id, language, lower(name))
  where owner_user_id is not null;

-- apply_word_children получает новый параметр word_language: резолвит/
-- создаёт категории в пределах этого языка, а не глобально по имени.
-- Сигнатура меняется (добавлен 4-й параметр) — старую версию удаляем явно,
-- иначе она осталась бы висеть неиспользуемым оверлоадом.
drop function if exists public.apply_word_children(uuid, uuid, jsonb);

create function public.apply_word_children(
  target_word_id uuid,
  uid uuid,
  payload jsonb,
  word_language text
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
    select c.id into resolved_category_id
    from public.categories c
    where lower(c.name) = lower(category_name)
      and c.language = word_language
      and (c.owner_user_id is null or c.owner_user_id = uid)
    order by c.owner_user_id nulls first
    limit 1;

    if resolved_category_id is null then
      insert into public.categories (name, owner_user_id, language)
      values (category_name, uid, word_language)
      on conflict (owner_user_id, language, lower(name)) where owner_user_id is not null
        do nothing
      returning id into resolved_category_id;

      if resolved_category_id is null then
        select c.id into resolved_category_id
        from public.categories c
        where c.owner_user_id = uid and c.language = word_language and lower(c.name) = lower(category_name);
      end if;
    end if;

    insert into public.word_categories (word_id, category_id)
    values (target_word_id, resolved_category_id)
    on conflict do nothing;
  end loop;
end;
$$;

create or replace function public.save_word(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_word_id uuid;
  word_language text := coalesce(payload->>'language', 'ko');
begin
  if uid is null then
    raise exception 'Нужно войти' using errcode = '42501';
  end if;
  if word_language not in ('ko', 'en') then
    raise exception 'Некорректный язык' using errcode = '22023';
  end if;

  insert into public.words (owner_user_id, headword, reading, part_of_speech, language)
  values (
    uid,
    payload->>'headword',
    payload->>'reading',
    payload->>'partOfSpeech',
    word_language
  )
  returning id into new_word_id;

  perform public.apply_word_children(new_word_id, uid, payload, word_language);

  return new_word_id;
end;
$$;

-- Правка не даёт сменить язык слова — читаем его текущий language из
-- уже существующей строки и передаём тем же путём в apply_word_children.
create or replace function public.update_word(target_word_id uuid, payload jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  word_language text;
begin
  if uid is null then
    raise exception 'Нужно войти' using errcode = '42501';
  end if;

  update public.words
  set headword = payload->>'headword',
      reading = payload->>'reading',
      part_of_speech = payload->>'partOfSpeech',
      updated_at = now()
  where id = target_word_id and owner_user_id = uid
  returning language into word_language;

  if not found then
    raise exception 'Слово не найдено' using errcode = '42501';
  end if;

  delete from public.translations where word_id = target_word_id;
  delete from public.word_notes where word_id = target_word_id;
  delete from public.word_examples where word_id = target_word_id;
  delete from public.word_categories where word_id = target_word_id;

  perform public.apply_word_children(target_word_id, uid, payload, word_language);
end;
$$;

grant execute on function public.apply_word_children(uuid, uuid, jsonb, text) to authenticated;

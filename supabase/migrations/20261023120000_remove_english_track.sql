-- Английский трек убран: удаляем английские слова и категории и возвращаем
-- схему к виду до 20260901130000_english_track.sql (без колонок language /
-- active_language). Дочерние строки слов (translations, word_notes,
-- word_examples, word_forms, word_categories, word_progress) удаляются
-- каскадом по внешним ключам on delete cascade.

delete from public.words where language = 'en';
delete from public.categories where language = 'en';

drop index public.categories_global_name_key;
drop index public.categories_owner_name_key;

create unique index categories_global_name_key
  on public.categories (lower(name))
  where owner_user_id is null;

create unique index categories_owner_name_key
  on public.categories (owner_user_id, lower(name))
  where owner_user_id is not null;

-- Функции с параметром языка заменяются версиями без него.
drop function public.update_word(uuid, jsonb);
drop function public.save_word(jsonb);
drop function public.apply_word_children(uuid, uuid, jsonb, text);

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

drop index public.words_language_idx;

alter table public.words drop column language;
alter table public.categories drop column language;
alter table public.profiles drop column active_language;

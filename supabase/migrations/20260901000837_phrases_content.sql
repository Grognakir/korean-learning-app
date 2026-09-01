-- Словарь → «Фразы»: наполняем ранее пустую заготовку phrases (см.
-- 20260828230427_dictionary.sql) реальным контентом. Не хватает двух
-- колонок и прав на запись для service_role-импорта.

-- reading — транслитерация, как у words.reading (в UI везде показываем
-- романизацию под корейским текстом). category — плоское текстовое поле,
-- не M2M как у слов: в источнике у каждой фразы ровно одна ситуативная
-- категория, полноценная таблица связей была бы избыточной.
alter table public.phrases
  add column reading text,
  add column category text;

-- Раньше был только select-grant ("заготовка впрок") — импорт-скрипт
-- пишет через service_role, как и остальные таблицы словаря, нужны явные
-- grant в дополнение к RLS (одних политик недостаточно на этой версии
-- Supabase CLI).
grant select, insert, update on public.phrases to service_role;

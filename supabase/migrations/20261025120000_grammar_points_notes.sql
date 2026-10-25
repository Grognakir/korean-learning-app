-- Словарь → «Грамматика»: сноски к конструкции (сравнение с похожей грамматикой,
-- таблицы, примеры). Список разделов {title, blocks[]} читается целиком вместе
-- с записью, поэтому jsonb, как examples/vocab.

alter table public.grammar_points add column notes jsonb;

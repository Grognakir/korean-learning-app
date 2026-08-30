-- Разрешаем обычным пользователям заводить новые категории при
-- добавлении своего слова (вручную или через AI) — раньше categories
-- пополнялась только импортом (service_role). Категория остаётся общим
-- справочником без владельца — новая категория сразу видна всем.

create policy "categories_insert_authenticated"
  on public.categories for insert
  to authenticated
  with check (true);

grant insert on public.categories to authenticated;

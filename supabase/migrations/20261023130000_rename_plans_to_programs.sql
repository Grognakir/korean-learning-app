-- «Планы» → «Программы»: переименование таблицы learning_plans и колонки
-- textbooks.plan_id вместе с именами ограничений и политики. Данные, права
-- (GRANT) и RLS при переименовании сохраняются.

alter table public.learning_plans rename to learning_programs;
alter table public.textbooks rename column plan_id to program_id;

alter table public.learning_programs rename constraint learning_plans_pkey to learning_programs_pkey;
alter table public.learning_programs rename constraint learning_plans_slug_key to learning_programs_slug_key;
alter table public.textbooks rename constraint textbooks_plan_id_fkey to textbooks_program_id_fkey;

alter policy "learning_plans_select_authenticated"
  on public.learning_programs
  rename to "learning_programs_select_authenticated";

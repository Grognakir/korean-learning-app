alter policy "topic_quiz_questions_select"
  on public.topic_quiz_questions
  to anon, authenticated
  using (true);

grant select on public.topic_quiz_questions to anon;

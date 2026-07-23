set search_path = public, extensions;

alter table quizzes add column if not exists pdf_url text;

alter table questions alter column question_text drop not null;
alter table questions alter column option_a drop not null;
alter table questions alter column option_b drop not null;
alter table questions alter column option_c drop not null;
alter table questions alter column option_d drop not null;

notify pgrst, 'reload schema';

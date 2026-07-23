create extension if not exists pgcrypto;

set search_path = public, extensions;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  class_code text unique not null,
  teacher_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists class_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists lectures (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  content_type text not null check (content_type in ('pdf', 'video', 'link')),
  file_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  is_published boolean not null default false,
  pdf_url text,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_option text not null check (correct_option in ('A', 'B', 'C', 'D'))
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  score numeric(5, 2) not null,
  answers_json jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_classes_teacher on classes(teacher_id);
create index if not exists idx_class_students_class on class_students(class_id);
create index if not exists idx_class_students_student on class_students(student_id);
create index if not exists idx_lectures_class on lectures(class_id);
create index if not exists idx_quizzes_class on quizzes(class_id);
create index if not exists idx_questions_quiz on questions(quiz_id);
create index if not exists idx_submissions_quiz on submissions(quiz_id);
create index if not exists idx_submissions_student on submissions(student_id);

create or replace view directory as
  select id, name, role from users;

grant select on directory to anon, authenticated;

create or replace function app_login(p_email text, p_password text)
returns table (id uuid, email text, role text, name text)
language sql security definer set search_path = public, extensions
as $$
  select u.id, u.email, u.role, u.name
  from users u
  where u.email = lower(p_email)
    and u.password_hash = crypt(p_password, u.password_hash);
$$;

create or replace function app_create_user(p_actor uuid, p_email text, p_password text, p_role text, p_name text)
returns table (id uuid, email text, role text, name text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_actor_role text;
  v_new_id uuid;
begin
  select users.role into v_actor_role from users where users.id = p_actor;
  if v_actor_role is distinct from 'admin' then
    raise exception 'NOT_AUTHORIZED';
  end if;
  if p_role not in ('teacher', 'student') then
    raise exception 'INVALID_ROLE';
  end if;
  insert into users (email, password_hash, role, name)
  values (lower(p_email), crypt(p_password, gen_salt('bf')), p_role, p_name)
  returning users.id into v_new_id;
  return query select u.id, u.email, u.role, u.name from users u where u.id = v_new_id;
end;
$$;

create or replace function app_list_users(p_actor uuid, p_role text)
returns table (id uuid, email text, role text, name text, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_actor_role text;
begin
  select users.role into v_actor_role from users where users.id = p_actor;
  if v_actor_role is distinct from 'admin' then
    raise exception 'NOT_AUTHORIZED';
  end if;
  return query
    select u.id, u.email, u.role, u.name, u.created_at
    from users u
    where (p_role is null or u.role = p_role)
    order by u.created_at desc;
end;
$$;

create or replace function app_delete_user(p_actor uuid, p_target uuid)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_actor_role text;
begin
  select users.role into v_actor_role from users where users.id = p_actor;
  if v_actor_role is distinct from 'admin' then
    raise exception 'NOT_AUTHORIZED';
  end if;
  delete from users where id = p_target and role <> 'admin';
end;
$$;

create or replace function app_reset_password(p_actor uuid, p_target uuid, p_password text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_actor_role text;
begin
  select users.role into v_actor_role from users where users.id = p_actor;
  if v_actor_role is distinct from 'admin' then
    raise exception 'NOT_AUTHORIZED';
  end if;
  update users set password_hash = crypt(p_password, gen_salt('bf')) where id = p_target;
end;
$$;

create or replace function student_quiz_questions(p_quiz uuid)
returns table (id uuid, question_text text, option_a text, option_b text, option_c text, option_d text)
language sql security definer set search_path = public, extensions
as $$
  select q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d
  from questions q
  where q.quiz_id = p_quiz
  order by q.id;
$$;

create or replace function app_quiz_questions(p_actor uuid, p_quiz uuid)
returns table (id uuid, question_text text, option_a text, option_b text, option_c text, option_d text, correct_option text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_actor_role text;
  v_owner uuid;
begin
  select users.role into v_actor_role from users where users.id = p_actor;
  select c.teacher_id into v_owner
  from quizzes qz join classes c on c.id = qz.class_id
  where qz.id = p_quiz;
  if v_actor_role = 'admin' or v_owner = p_actor then
    return query
      select q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
      from questions q
      where q.quiz_id = p_quiz
      order by q.id;
  else
    raise exception 'NOT_AUTHORIZED';
  end if;
end;
$$;

create or replace function submit_quiz(p_quiz uuid, p_student uuid, p_answers jsonb)
returns table (score numeric, total integer, correct integer)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_total integer;
  v_correct integer;
  v_score numeric;
begin
  select count(*) into v_total from questions where quiz_id = p_quiz;
  select count(*) into v_correct
  from questions q
  where q.quiz_id = p_quiz
    and (p_answers ->> q.id::text) = q.correct_option;
  if v_total = 0 then
    v_score := 0;
  else
    v_score := round((v_correct::numeric / v_total) * 10, 2);
  end if;
  insert into submissions (quiz_id, student_id, score, answers_json)
  values (p_quiz, p_student, v_score, p_answers);
  return query select v_score, v_total, v_correct;
end;
$$;

grant execute on function app_login(text, text) to anon, authenticated;
grant execute on function app_create_user(uuid, text, text, text, text) to anon, authenticated;
grant execute on function app_list_users(uuid, text) to anon, authenticated;
grant execute on function app_delete_user(uuid, uuid) to anon, authenticated;
grant execute on function app_reset_password(uuid, uuid, text) to anon, authenticated;
grant execute on function student_quiz_questions(uuid) to anon, authenticated;
grant execute on function app_quiz_questions(uuid, uuid) to anon, authenticated;
grant execute on function submit_quiz(uuid, uuid, jsonb) to anon, authenticated;

alter table users enable row level security;
alter table classes enable row level security;
alter table class_students enable row level security;
alter table lectures enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table submissions enable row level security;

drop policy if exists classes_all on classes;
drop policy if exists class_students_all on class_students;
drop policy if exists lectures_all on lectures;
drop policy if exists quizzes_all on quizzes;
drop policy if exists submissions_all on submissions;
drop policy if exists questions_insert on questions;
drop policy if exists questions_update on questions;
drop policy if exists questions_delete on questions;

create policy classes_all on classes for all to anon, authenticated using (true) with check (true);
create policy class_students_all on class_students for all to anon, authenticated using (true) with check (true);
create policy lectures_all on lectures for all to anon, authenticated using (true) with check (true);
create policy quizzes_all on quizzes for all to anon, authenticated using (true) with check (true);
create policy submissions_all on submissions for all to anon, authenticated using (true) with check (true);

create policy questions_insert on questions for insert to anon, authenticated with check (true);
create policy questions_update on questions for update to anon, authenticated using (true) with check (true);
create policy questions_delete on questions for delete to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('lms-files', 'lms-files', true)
on conflict (id) do nothing;

drop policy if exists lms_files_read on storage.objects;
drop policy if exists lms_files_insert on storage.objects;
drop policy if exists lms_files_delete on storage.objects;

create policy lms_files_read on storage.objects for select to anon, authenticated using (bucket_id = 'lms-files');
create policy lms_files_insert on storage.objects for insert to anon, authenticated with check (bucket_id = 'lms-files');
create policy lms_files_delete on storage.objects for delete to anon, authenticated using (bucket_id = 'lms-files');

insert into users (email, password_hash, role, name)
values ('admin@lms.com', crypt('admin123', gen_salt('bf')), 'admin', 'Quản trị viên')
on conflict (email) do nothing;

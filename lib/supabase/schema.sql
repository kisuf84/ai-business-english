-- Supabase schema scaffold for MVP lessons table
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text not null,
  topic text not null,
  level text not null,
  industry text null,
  profession text null,
  lesson_type text not null,
  source_url text null,
  content_json jsonb not null,
  status text not null default 'saved',
  visibility text not null default 'private',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.lessons
  add column if not exists video_id text null;

alter table public.lessons
  add column if not exists transcript_text text null;

alter table public.lessons
  add column if not exists transcript_segments jsonb null;

create table if not exists public.youtube_lesson_jobs (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  video_id text not null,
  email text null,
  status text not null default 'queued',
  transcript_text text null,
  lesson_id uuid null references public.lessons(id) on delete set null,
  topic text null,
  level text null,
  industry text null,
  profession text null,
  lesson_type text null,
  title text null,
  attempts integer not null default 0,
  last_error_code text null,
  last_error_message text null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists youtube_lesson_jobs_status_created_at_idx
  on public.youtube_lesson_jobs(status, created_at);

create index if not exists youtube_lesson_jobs_email_idx
  on public.youtube_lesson_jobs(email);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text not null,
  topic text not null,
  level text not null,
  industry text null,
  profession text null,
  summary text not null,
  outline_json jsonb not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  scenario_type text not null,
  level text not null,
  industry text null,
  profession text null,
  created_at timestamp with time zone default now()
);

create table if not exists public.simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  user_input text not null,
  ai_response text not null,
  feedback_json jsonb not null,
  created_at timestamp with time zone default now()
);

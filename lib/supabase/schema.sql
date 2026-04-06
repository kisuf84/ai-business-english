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

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
-- Handles both admin and client profiles, linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('admin', 'client')) default 'client',
  full_name text not null,
  birth_date date,
  age integer,
  weight numeric(5,2),
  objective text,
  photo_url text,
  client_password text -- Storing password in plain text/here is generally not recommended, but adding as requested
);

-- EXERCISE LIBRARY TABLE
-- Catalog of available exercises
create table public.exercise_library (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  target_muscle text,
  video_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WORKOUTS TABLE
-- Defines a workout program assigned to a client
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  start_date date,
  end_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WORKOUT EXERCISES TABLE
-- Links exercises to specific workouts with prescriptions
create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercise_library(id) on delete cascade not null,
  sets integer not null,
  reps integer not null,
  weight_guidelines text,
  exercise_photo_url text,
  exercise_video_url text,
  trainer_notes text,
  client_feedback text
);

-- WEIGHT HISTORY TABLE
-- Tracks the client's body weight over time
create table public.weight_history (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  weight numeric(5,2) not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SESSION FEEDBACK TABLE
-- Tracks RPE and general comments for a specific workout session (day)
create table public.session_feedback (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete cascade not null,
  day_assigned text not null,
  rpe integer check (rpe >= 1 and rpe <= 10) not null,
  comments text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(workout_id, day_assigned)
);

-- RLS (Row Level Security) - Basic setup
alter table public.profiles enable row level security;
alter table public.exercise_library enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.weight_history enable row level security;
alter table public.session_feedback enable row level security;

-- (Optional) Basic policies - allowing all access for now, to be restricted later
create policy "Allow all access to profiles" on public.profiles for all using (true);
create policy "Allow all access to exercise_library" on public.exercise_library for all using (true);
create policy "Allow all access to workouts" on public.workouts for all using (true);
create policy "Allow all access to workout_exercises" on public.workout_exercises for all using (true);
create policy "Allow all access to weight_history" on public.weight_history for all using (true);
create policy "Allow all access to session_feedback" on public.session_feedback for all using (true);

----------------------------------------------------------------------------------
-- STORAGE BUCKETS SETUP
----------------------------------------------------------------------------------

-- 1. Create client-photos bucket (Public)
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', true)
on conflict (id) do nothing;

-- 2. Create exercise-media bucket (Public)
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

-- Set up storage policies to allow public read access
create policy "Public Access client-photos" on storage.objects for select
using ( bucket_id = 'client-photos' );

create policy "Public Access exercise-media" on storage.objects for select
using ( bucket_id = 'exercise-media' );

-- (Optional) Allow authenticated users to upload to these buckets
create policy "Allow uploads client-photos" on storage.objects for insert
with check ( bucket_id = 'client-photos' AND auth.role() = 'authenticated' );

create policy "Allow uploads exercise-media" on storage.objects for insert
with check ( bucket_id = 'exercise-media' AND auth.role() = 'authenticated' );

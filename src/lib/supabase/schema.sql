-- Blueprint · Supabase schema
-- Run in the Supabase SQL editor after creating a project.

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  age int,
  sex text check (sex in ('male', 'female', 'other')),
  height_cm numeric,
  weight_kg numeric,
  body_fat_pct numeric,
  experience text check (experience in ('beginner', 'intermediate', 'advanced')),
  equipment text check (equipment in ('full_gym', 'home_dumbbells', 'bodyweight', 'minimal')),
  injuries text[] default '{}',
  goal_type text,
  goal_description text,
  target_weight_kg numeric,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Physique photo captures (storage paths)
create table if not exists public.physique_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  pose text not null check (pose in ('front', 'side', 'back')),
  storage_path text not null,
  captured_at timestamptz default now()
);

-- Body-part scores from vision + heuristics
create table if not exists public.body_part_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  capture_id uuid references public.physique_photos(id) on delete set null,
  part_id text not null,
  score numeric not null check (score >= 0 and score <= 100),
  status text check (status in ('lagging', 'balanced', 'strong')),
  priority int,
  reason text,
  created_at timestamptz default now()
);

-- Inspiration images
create table if not exists public.inspo_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text,
  url text,
  notes text,
  created_at timestamptz default now()
);

-- Workout sessions
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  title text not null,
  focus_parts text[] default '{}',
  focus_reason text,
  estimated_minutes int,
  payload jsonb not null default '{}',
  completed boolean default false,
  created_at timestamptz default now()
);

-- Set / progressive overload logs
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.workout_sessions(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  set_index int not null,
  weight_kg numeric,
  reps int,
  rpe numeric,
  logged_at timestamptz default now()
);

-- Nutrition targets by phase
create table if not exists public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  phase text not null check (phase in ('maintain', 'bulk', 'cut')),
  calories int not null,
  protein_g int not null,
  carbs_g int not null,
  fat_g int not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Measurements
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  measured_at date not null,
  weight_kg numeric,
  waist_cm numeric,
  chest_cm numeric,
  arms_cm numeric,
  thighs_cm numeric
);

-- Storage bucket for photos (run via dashboard or storage API)
-- insert into storage.buckets (id, name, public) values ('physique', 'physique', false);

-- RLS
alter table public.profiles enable row level security;
alter table public.physique_photos enable row level security;
alter table public.body_part_scores enable row level security;
alter table public.inspo_images enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.measurements enable row level security;

create policy "Users own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users own photos" on public.physique_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own scores" on public.body_part_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own inspo" on public.inspo_images
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own sessions" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own logs" on public.exercise_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own nutrition" on public.nutrition_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users own measurements" on public.measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

/*
  # Create prediction logs table

  1. New Tables
    - `prediction_logs`
      - `id` (bigint, primary key)
      - `fighter1_id` (bigint, references fighters)
      - `fighter2_id` (bigint, references fighters)
      - `fighter1_name` (text)
      - `fighter2_name` (text)
      - `predicted_winner` (text)
      - `predicted_method` (text)
      - `confidence` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `prediction_logs` table
    - Add policy for public read access
    - Add policy for admin write access
*/

create table if not exists prediction_logs (
  id bigint primary key generated always as identity,
  fighter1_id bigint references fighters(id) on delete set null,
  fighter2_id bigint references fighters(id) on delete set null,
  fighter1_name text not null,
  fighter2_name text not null,
  predicted_winner text not null,
  predicted_method text not null check (predicted_method = any(array['KO/TKO', 'Submission', 'Decision - Unanimous', 'Decision - Split', 'Decision - Majority'])),
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table prediction_logs enable row level security;

-- Create policy for public read access
create policy "Anyone can view predictions"
  on prediction_logs
  for select
  using (true);

-- Create policy for admin write access
create policy "Only admins can create predictions"
  on prediction_logs
  for insert
  with check (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

-- Create index for faster queries
create index idx_prediction_logs_created_at on prediction_logs (created_at desc);

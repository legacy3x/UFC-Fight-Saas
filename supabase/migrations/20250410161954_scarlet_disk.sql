/*
  # Add scraper schedules table

  1. New Tables
    - `scraper_schedules`
      - `id` (bigint, primary key)
      - `type` (text, not null)
      - `cron_expression` (text)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on scraper_schedules table
    - Add policy for admin management
    - Add policy for public read access
*/

-- Add scraper schedules table
create table if not exists scraper_schedules (
  id bigint primary key generated always as identity,
  type text not null,
  cron_expression text,
  updated_at timestamptz default now()
);

-- Create index for querying schedules by type
create index if not exists idx_scraper_schedules_type on scraper_schedules (type);

-- Enable RLS
alter table scraper_schedules enable row level security;

-- Add RLS policies
create policy "Admins can manage scraper schedules"
  on scraper_schedules
  for all
  to public
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'admin'
    )
  );

create policy "Public can view scraper schedules"
  on scraper_schedules
  for select
  to public
  using (true);
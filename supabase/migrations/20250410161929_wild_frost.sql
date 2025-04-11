-- Add to existing schema
create table if not exists scraper_logs (
  id bigint primary key generated always as identity,
  type text not null,  -- 'full_run' or individual scraper type
  status text not null,  -- 'started', 'completed', 'failed'
  started_at timestamptz not null,
  completed_at timestamptz,
  duration_seconds numeric,
  records_processed integer,
  error text,
  results jsonb
);

-- Create index for querying logs
create index idx_scraper_logs_timestamp on scraper_logs (started_at);
create index idx_scraper_logs_type on scraper_logs (type);

-- Add scraper schedules table
create table if not exists scraper_schedules (
  id bigint primary key generated always as identity,
  type text not null,
  cron_expression text,
  updated_at timestamptz default now()
);

-- Create index for querying schedules by type
create index idx_scraper_schedules_type on scraper_schedules (type);

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

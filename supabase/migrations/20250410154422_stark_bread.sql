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

-- Create user predictions table
create table if not exists user_predictions (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade,
  fighter1_id bigint references fighters(id) on delete set null,
  fighter2_id bigint references fighters(id) on delete set null,
  fighter1_name text not null,
  fighter2_name text not null,
  predicted_winner text not null,
  predicted_method text not null check (
    predicted_method = any(array[
      'KO/TKO',
      'Submission',
      'Decision - Unanimous',
      'Decision - Split',
      'Decision - Majority'
    ])
  ),
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for user predictions
create index idx_user_predictions_user on user_predictions (user_id);
create index idx_user_predictions_created_at on user_predictions (created_at desc);

-- Enable RLS
alter table user_predictions enable row level security;
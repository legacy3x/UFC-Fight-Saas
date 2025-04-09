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

/*
  # Add modified_at column and indexes
  
  1. Changes
    - Add modified_at column to upcoming_events
    - Create indexes if they don't exist
    - Add trigger for automatic timestamp updates
    
  2. Security
    - Maintain existing table security
    - Add proper constraints for modified_at
*/

-- Add to existing schema
DO $$ 
BEGIN
  -- Create scraper_logs table if it doesn't exist
  CREATE TABLE IF NOT EXISTS scraper_logs (
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

  -- Create indexes if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_scraper_logs_timestamp'
  ) THEN
    CREATE INDEX idx_scraper_logs_timestamp ON scraper_logs (started_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_scraper_logs_type'
  ) THEN
    CREATE INDEX idx_scraper_logs_type ON scraper_logs (type);
  END IF;

  -- Add modified_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'upcoming_events' 
    AND column_name = 'modified_at'
  ) THEN
    ALTER TABLE upcoming_events 
    ADD COLUMN modified_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_upcoming_events_modified ON upcoming_events;
CREATE TRIGGER update_upcoming_events_modified
  BEFORE UPDATE ON upcoming_events
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
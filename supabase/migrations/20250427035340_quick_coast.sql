/*
  # Add ranking column to fighters table

  1. Changes
    - Add ranking column to fighters table
    - Add check constraint for valid ranking values
    - Add index for ranking column
*/

-- Add ranking column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'fighters' 
    AND column_name = 'ranking'
  ) THEN
    ALTER TABLE fighters 
    ADD COLUMN ranking integer;

    -- Add check constraint for valid ranking values (1-15)
    ALTER TABLE fighters 
    ADD CONSTRAINT valid_ranking_range 
    CHECK (ranking IS NULL OR (ranking >= 1 AND ranking <= 15));

    -- Add index for ranking column
    CREATE INDEX idx_fighters_ranking ON fighters(ranking);
  END IF;
END $$;
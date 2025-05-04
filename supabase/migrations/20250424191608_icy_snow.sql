/*
  # Add unique constraint to fighters table

  1. Changes
    - Add unique constraint on first_name and last_name columns in fighters table
    - This enables upsert operations based on fighter names

  2. Security
    - No security changes required
    - Existing RLS policies remain unchanged
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_first_name_last_name'
  ) THEN
    ALTER TABLE fighters 
    ADD CONSTRAINT unique_first_name_last_name 
    UNIQUE (first_name, last_name);
  END IF;
END $$;
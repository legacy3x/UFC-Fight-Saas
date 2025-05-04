/*
  # Add modified_at column to fighters table

  1. Changes
    - Add modified_at column to fighters table
    - Create trigger function for automatic updates
    - Add trigger to update modified_at on row changes
    - Add unique constraint for first_name and last_name

  2. Security
    - Maintain existing table security
    - Add proper constraints for modified_at
*/

-- Add modified_at column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'fighters' 
    AND column_name = 'modified_at'
  ) THEN
    ALTER TABLE fighters 
    ADD COLUMN modified_at timestamptz DEFAULT now() NOT NULL;
  END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_fighters_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and create it again
DROP TRIGGER IF EXISTS update_fighters_modified ON fighters;
CREATE TRIGGER update_fighters_modified
    BEFORE UPDATE ON fighters
    FOR EACH ROW
    EXECUTE FUNCTION update_fighters_modified_column();

-- Add unique constraint for first_name and last_name if it doesn't exist
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
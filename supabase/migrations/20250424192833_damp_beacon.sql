/*
  # Add modified_at column to fighters table

  1. Changes
    - Add `modified_at` column to `fighters` table with default value and trigger
    - Add trigger to automatically update `modified_at` on row updates

  2. Notes
    - Uses timestamptz for timezone-aware timestamps
    - Automatically sets initial value to current timestamp
    - Updates automatically on any row modification
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
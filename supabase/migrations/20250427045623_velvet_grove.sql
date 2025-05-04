/*
  # Remove ranking constraints
  
  1. Changes
    - Remove ranking range constraint to allow unlimited rankings
    - Keep ranking column as integer
    - Maintain index for performance
*/

-- Drop existing constraint
ALTER TABLE fighters 
DROP CONSTRAINT IF EXISTS valid_ranking_range;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_fighters_ranking ON fighters(ranking);
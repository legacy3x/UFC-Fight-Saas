/*
  # Update ranking range constraint
  
  1. Changes
    - Modify valid_ranking_range constraint to allow rankings up to 30
    - Drop existing constraint first to avoid conflicts
    
  2. Security
    - Maintain data integrity with new range validation
*/

-- Drop existing constraint
ALTER TABLE fighters 
DROP CONSTRAINT IF EXISTS valid_ranking_range;

-- Add new constraint with extended range
ALTER TABLE fighters 
ADD CONSTRAINT valid_ranking_range 
CHECK (ranking IS NULL OR (ranking >= 1 AND ranking <= 30));
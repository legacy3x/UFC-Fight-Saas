/*
  # Add fight stats columns
  
  1. Changes
    - Add new columns to fight_stats table for detailed statistics
    - Add indexes for performance
    - Update constraints and foreign keys
*/

-- Add new columns to fight_stats table
ALTER TABLE fight_stats
ADD COLUMN IF NOT EXISTS significant_strikes_per_min numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS significant_strike_accuracy numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS significant_strikes_absorbed_per_min numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS significant_strike_defense numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS takedown_avg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS takedown_accuracy numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS takedown_defense numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS submission_avg numeric DEFAULT 0;

-- Add check constraints for percentage values
ALTER TABLE fight_stats
ADD CONSTRAINT strike_accuracy_range CHECK (significant_strike_accuracy >= 0 AND significant_strike_accuracy <= 1),
ADD CONSTRAINT strike_defense_range CHECK (significant_strike_defense >= 0 AND significant_strike_defense <= 1),
ADD CONSTRAINT takedown_accuracy_range CHECK (takedown_accuracy >= 0 AND takedown_accuracy <= 1),
ADD CONSTRAINT takedown_defense_range CHECK (takedown_defense >= 0 AND takedown_defense <= 1);

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_fight_stats_strikes ON fight_stats (significant_strikes_per_min);
CREATE INDEX IF NOT EXISTS idx_fight_stats_takedowns ON fight_stats (takedown_avg);
CREATE INDEX IF NOT EXISTS idx_fight_stats_submissions ON fight_stats (submission_avg);
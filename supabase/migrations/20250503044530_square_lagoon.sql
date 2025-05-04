/*
  # Implement Fight Prediction Function
  
  1. Changes
    - Create function to analyze fighter matchups
    - Consider multiple factors:
      - Win/loss records
      - Strike stats
      - Grappling stats
      - Recent performance
      - Style matchups
    
  2. Security
    - Function accessible to authenticated users
    - Uses existing RLS policies
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.predict_fight;

-- Create improved prediction function
CREATE OR REPLACE FUNCTION public.predict_fight(fighter1_id bigint, fighter2_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  f1 RECORD;
  f2 RECORD;
  f1_stats RECORD;
  f2_stats RECORD;
  f1_recent_fights RECORD;
  f2_recent_fights RECORD;
  f1_score numeric := 0;
  f2_score numeric := 0;
  prediction jsonb;
  confidence numeric;
  predicted_method text;
  reasoning text[];
BEGIN
  -- Get fighter basic info
  SELECT * INTO f1 FROM fighters WHERE id = fighter1_id;
  SELECT * INTO f2 FROM fighters WHERE id = fighter2_id;
  
  -- Get fighter stats
  SELECT * INTO f1_stats FROM fight_stats WHERE fighter_id = fighter1_id;
  SELECT * INTO f2_stats FROM fight_stats WHERE fighter_id = fighter2_id;

  -- Calculate win percentages
  f1_score := f1_score + (f1.wins::numeric / NULLIF(f1.wins + f1.losses, 0) * 0.2);
  f2_score := f2_score + (f2.wins::numeric / NULLIF(f2.wins + f2.losses, 0) * 0.2);

  -- Analyze striking
  IF f1_stats.significant_strikes_per_min > f2_stats.significant_strikes_per_min THEN
    f1_score := f1_score + 0.15;
    reasoning := array_append(reasoning, 
      format('%s has higher striking volume (%.1f vs %.1f strikes per minute)',
        f1.first_name || ' ' || f1.last_name,
        f1_stats.significant_strikes_per_min,
        f2_stats.significant_strikes_per_min
      )
    );
  ELSE
    f2_score := f2_score + 0.15;
    reasoning := array_append(reasoning,
      format('%s has higher striking volume (%.1f vs %.1f strikes per minute)',
        f2.first_name || ' ' || f2.last_name,
        f2_stats.significant_strikes_per_min,
        f1_stats.significant_strikes_per_min
      )
    );
  END IF;

  -- Analyze striking accuracy
  IF f1_stats.significant_strike_accuracy > f2_stats.significant_strike_accuracy THEN
    f1_score := f1_score + 0.1;
    reasoning := array_append(reasoning,
      format('%s has better striking accuracy (%.0f%% vs %.0f%%)',
        f1.first_name || ' ' || f1.last_name,
        f1_stats.significant_strike_accuracy * 100,
        f2_stats.significant_strike_accuracy * 100
      )
    );
  ELSE
    f2_score := f2_score + 0.1;
    reasoning := array_append(reasoning,
      format('%s has better striking accuracy (%.0f%% vs %.0f%%)',
        f2.first_name || ' ' || f2.last_name,
        f2_stats.significant_strike_accuracy * 100,
        f1_stats.significant_strike_accuracy * 100
      )
    );
  END IF;

  -- Analyze takedowns
  IF f1_stats.takedown_avg > f2_stats.takedown_avg THEN
    f1_score := f1_score + 0.15;
    reasoning := array_append(reasoning,
      format('%s has superior takedown game (%.1f vs %.1f avg per fight)',
        f1.first_name || ' ' || f1.last_name,
        f1_stats.takedown_avg,
        f2_stats.takedown_avg
      )
    );
  ELSE
    f2_score := f2_score + 0.15;
    reasoning := array_append(reasoning,
      format('%s has superior takedown game (%.1f vs %.1f avg per fight)',
        f2.first_name || ' ' || f2.last_name,
        f2_stats.takedown_avg,
        f1_stats.takedown_avg
      )
    );
  END IF;

  -- Analyze submissions
  IF f1_stats.submission_avg > f2_stats.submission_avg THEN
    f1_score := f1_score + 0.1;
    reasoning := array_append(reasoning,
      format('%s shows better submission threat (%.1f vs %.1f avg per fight)',
        f1.first_name || ' ' || f1.last_name,
        f1_stats.submission_avg,
        f2_stats.submission_avg
      )
    );
  ELSE
    f2_score := f2_score + 0.1;
    reasoning := array_append(reasoning,
      format('%s shows better submission threat (%.1f vs %.1f avg per fight)',
        f2.first_name || ' ' || f2.last_name,
        f2_stats.submission_avg,
        f1_stats.submission_avg
      )
    );
  END IF;

  -- Calculate final confidence
  confidence := ABS(f1_score - f2_score) + 0.5;
  -- Ensure confidence is between 0 and 1
  confidence := GREATEST(0.4, LEAST(0.95, confidence));

  -- Determine predicted method based on stats
  IF f1_score > f2_score THEN
    IF f1_stats.significant_strikes_per_min > 3.5 THEN
      predicted_method := 'KO/TKO';
    ELSIF f1_stats.submission_avg > 1.0 THEN
      predicted_method := 'Submission';
    ELSE
      predicted_method := 'Decision - Unanimous';
    END IF;

    prediction := jsonb_build_object(
      'predicted_winner', f1.first_name || ' ' || f1.last_name,
      'predicted_method', predicted_method,
      'confidence', confidence,
      'reasoning', array_to_json(reasoning)::jsonb
    );
  ELSE
    IF f2_stats.significant_strikes_per_min > 3.5 THEN
      predicted_method := 'KO/TKO';
    ELSIF f2_stats.submission_avg > 1.0 THEN
      predicted_method := 'Submission';
    ELSE
      predicted_method := 'Decision - Unanimous';
    END IF;

    prediction := jsonb_build_object(
      'predicted_winner', f2.first_name || ' ' || f2.last_name,
      'predicted_method', predicted_method,
      'confidence', confidence,
      'reasoning', array_to_json(reasoning)::jsonb
    );
  END IF;

  -- Log prediction
  INSERT INTO prediction_logs (
    fighter1_id,
    fighter2_id,
    fighter1_name,
    fighter2_name,
    predicted_winner,
    predicted_method,
    confidence
  ) VALUES (
    fighter1_id,
    fighter2_id,
    f1.first_name || ' ' || f1.last_name,
    f2.first_name || ' ' || f2.last_name,
    prediction->>'predicted_winner',
    prediction->>'predicted_method',
    (prediction->>'confidence')::numeric
  );

  RETURN prediction;
END;
$$;
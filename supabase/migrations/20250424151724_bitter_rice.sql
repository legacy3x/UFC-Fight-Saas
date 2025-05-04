/*
  # Add fight prediction function
  
  1. New Functions
    - `predict_fight(fighter1_id bigint, fighter2_id bigint)`
      Returns a prediction object with:
      - predicted_winner (text)
      - predicted_method (text)
      - confidence (numeric)
  
  2. Security
    - Function is accessible to all authenticated users
    - Uses SECURITY DEFINER to ensure consistent access to tables
*/

CREATE OR REPLACE FUNCTION public.predict_fight(fighter1_id bigint, fighter2_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fighter1_record RECORD;
  fighter2_record RECORD;
  prediction jsonb;
BEGIN
  -- Get fighter records
  SELECT 
    f.first_name || ' ' || f.last_name as name,
    f.wins,
    f.losses,
    COALESCE(
      (SELECT COUNT(*) FROM fight_stats fs 
       WHERE fs.fighter_id = f.id 
       AND fs.significant_strikes_landed > fs.significant_strikes_attempted * 0.5
      ), 0
    ) as striking_accuracy_fights
  INTO fighter1_record
  FROM fighters f
  WHERE f.id = fighter1_id;

  SELECT 
    f.first_name || ' ' || f.last_name as name,
    f.wins,
    f.losses,
    COALESCE(
      (SELECT COUNT(*) FROM fight_stats fs 
       WHERE fs.fighter_id = f.id 
       AND fs.significant_strikes_landed > fs.significant_strikes_attempted * 0.5
      ), 0
    ) as striking_accuracy_fights
  INTO fighter2_record
  FROM fighters f
  WHERE f.id = fighter2_id;

  -- Simple prediction logic based on win/loss ratio and striking accuracy
  IF (fighter1_record.wins::float / NULLIF(fighter1_record.wins + fighter1_record.losses, 0)) > 
     (fighter2_record.wins::float / NULLIF(fighter2_record.wins + fighter2_record.losses, 0)) THEN
    prediction := jsonb_build_object(
      'predicted_winner', fighter1_record.name,
      'predicted_method', 'KO/TKO',
      'confidence', 0.6 + (fighter1_record.striking_accuracy_fights::float / 10)
    );
  ELSE
    prediction := jsonb_build_object(
      'predicted_winner', fighter2_record.name,
      'predicted_method', 'KO/TKO',
      'confidence', 0.6 + (fighter2_record.striking_accuracy_fights::float / 10)
    );
  END IF;

  -- Ensure confidence is between 0 and 1
  prediction := jsonb_set(
    prediction,
    '{confidence}',
    to_jsonb(LEAST(1.0, GREATEST(0.0, (prediction->>'confidence')::numeric)))
  );

  RETURN prediction;
END;
$$;
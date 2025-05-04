/*
  # Add welterweight rankings
  
  1. Changes
    - Add rankings for top welterweight fighters
    - Only update fighters with no existing ranking
*/

-- Update rankings for welterweight fighters
UPDATE fighters
SET ranking = CASE first_name || ' ' || last_name
  WHEN 'Leon Edwards' THEN 1
  WHEN 'Kamaru Usman' THEN 2
  WHEN 'Khamzat Chimaev' THEN 3
  WHEN 'Belal Muhammad' THEN 4
  WHEN 'Colby Covington' THEN 5
  WHEN 'Shavkat Rakhmonov' THEN 6
  WHEN 'Gilbert Burns' THEN 7
  WHEN 'Sean Brady' THEN 8
  WHEN 'Stephen Thompson' THEN 9
  WHEN 'Vicente Luque' THEN 10
  WHEN 'Jack Della Maddalena' THEN 11
  WHEN 'Michael Chiesa' THEN 12
  WHEN 'Neil Magny' THEN 13
  WHEN 'Ian Machado Garry' THEN 14
  WHEN 'Geoff Neal' THEN 15
END
WHERE weight_class = 'Welterweight'
  AND (ranking IS NULL OR ranking = 0);
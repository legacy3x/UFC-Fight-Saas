/*
  # Add Fight Cards Policies

  1. Security
    - Add RLS policies for fight_cards table
    - Allow public read access
    - Allow admin users to manage fight cards
*/

-- Fight cards policies
DROP POLICY IF EXISTS "Public can view fight cards" ON fight_cards;
DROP POLICY IF EXISTS "Admins can manage fight cards" ON fight_cards;

CREATE POLICY "Public can view fight cards" ON fight_cards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight cards" ON fight_cards
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

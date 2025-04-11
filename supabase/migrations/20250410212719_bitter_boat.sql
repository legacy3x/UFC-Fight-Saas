/*
  # Add fight cards policies

  1. Security
    - Drop existing fight cards policies to avoid conflicts
    - Add policy for public read access
    - Add policy for admin management
*/

-- Fight cards policies only
DROP POLICY IF EXISTS "Public can view fight cards" ON fight_cards;
DROP POLICY IF EXISTS "Admins can manage fight cards" ON fight_cards;

CREATE POLICY "Public can view fight cards" ON fight_cards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight cards" ON fight_cards
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

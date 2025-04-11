/*
  # Update RLS policies
  
  1. Changes
    - Add missing RLS policies for various tables
    - Skip already existing policies
    - Ensure proper access control for all tables
*/

-- Users policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Fighters policies
DROP POLICY IF EXISTS "Public can view fighters" ON fighters;
DROP POLICY IF EXISTS "Admins can manage fighters" ON fighters;

CREATE POLICY "Public can view fighters" ON fighters
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fighters" ON fighters
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fight stats policies
DROP POLICY IF EXISTS "Public can view fight stats" ON fight_stats;
DROP POLICY IF EXISTS "Admins can manage fight stats" ON fight_stats;

CREATE POLICY "Public can view fight stats" ON fight_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight stats" ON fight_stats
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fight history policies
DROP POLICY IF EXISTS "Public can view fight history" ON fight_history;
DROP POLICY IF EXISTS "Admins can manage fight history" ON fight_history;

CREATE POLICY "Public can view fight history" ON fight_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight history" ON fight_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Betting odds policies
DROP POLICY IF EXISTS "Public can view betting odds" ON betting_odds;
DROP POLICY IF EXISTS "Admins can manage betting odds" ON betting_odds;

CREATE POLICY "Public can view betting odds" ON betting_odds
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage betting odds" ON betting_odds
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Upcoming events policies
DROP POLICY IF EXISTS "Public can view upcoming events" ON upcoming_events;
DROP POLICY IF EXISTS "Admins can manage upcoming events" ON upcoming_events;

CREATE POLICY "Public can view upcoming events" ON upcoming_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage upcoming events" ON upcoming_events
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

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

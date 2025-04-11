/*
  # Update permissions to allow users to access admin features
  
  1. Changes
    - Modify existing policies to allow both admin and user roles
    - Update policy checks to use role-based access
    
  2. Security
    - Maintain read access for all authenticated users
    - Allow write access for all authenticated users
*/

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can view user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can manage fighters" ON public.fighters;
  DROP POLICY IF EXISTS "Admins can manage fight stats" ON public.fight_stats;
  DROP POLICY IF EXISTS "Admins can manage fight history" ON public.fight_history;
  DROP POLICY IF EXISTS "Admins can manage betting odds" ON public.betting_odds;
  DROP POLICY IF EXISTS "Admins can manage upcoming events" ON public.upcoming_events;
END $$;

-- Create new policies with user access
DO $$ 
BEGIN
  -- User roles policies
  CREATE POLICY "Public can view user roles" ON public.user_roles
    FOR SELECT USING (true);

  CREATE POLICY "Users can manage roles" ON public.user_roles
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Fighters policies
  CREATE POLICY "Public can view fighters" ON public.fighters
    FOR SELECT USING (true);

  CREATE POLICY "Users can manage fighters" ON public.fighters
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Fight stats policies
  CREATE POLICY "Public can view fight stats" ON public.fight_stats
    FOR SELECT USING (true);

  CREATE POLICY "Users can manage fight stats" ON public.fight_stats
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Fight history policies
  CREATE POLICY "Public can view fight history" ON public.fight_history
    FOR SELECT USING (true);

  CREATE POLICY "Users can manage fight history" ON public.fight_history
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Betting odds policies
  CREATE POLICY "Public can view betting odds" ON public.betting_odds
    FOR SELECT USING (true);

  CREATE POLICY "Users can manage betting odds" ON public.betting_odds
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Upcoming events policies
  CREATE POLICY "Public can view upcoming events" ON public.upcoming_events
    FOR SELECT USING (true);

  CREATE POLICY "Users can manage upcoming events" ON public.upcoming_events
    FOR ALL USING (auth.role() IN ('admin', 'user'));
END $$;

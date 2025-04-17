/*
  # Update policies to allow user access
  
  1. Changes
    - Drop existing admin-only policies
    - Create new policies that allow both admin and user roles
    - Use JWT claims for role checks
    
  2. Security
    - Maintain read access for all authenticated users
    - Grant write access to all authenticated users
*/

-- Drop existing management policies first
DO $$ 
BEGIN
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
  -- User roles management
  CREATE POLICY "Users can manage roles" ON public.user_roles
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Fighters management
  CREATE POLICY "Users can manage fighters" ON public.fighters
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Fight stats management
  CREATE POLICY "Users can manage fight stats" ON public.fight_stats
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Fight history management
  CREATE POLICY "Users can manage fight history" ON public.fight_history
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Betting odds management
  CREATE POLICY "Users can manage betting odds" ON public.betting_odds
    FOR ALL USING (auth.role() IN ('admin', 'user'));

  -- Upcoming events management
  CREATE POLICY "Users can manage upcoming events" ON public.upcoming_events
    FOR ALL USING (auth.role() IN ('admin', 'user'));
END $$;
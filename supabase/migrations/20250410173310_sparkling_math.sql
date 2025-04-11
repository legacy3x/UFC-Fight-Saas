/*
  # Fix user roles policies and permissions

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies using JWT claims for role checks
    - Simplify admin role checks to prevent recursion
    - Add basic CRUD policies for all tables

  2. Security
    - Public read access for most tables
    - Admin-only write access based on JWT claims
    - Prevent infinite recursion in policy checks
*/

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view all users" ON public.users;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
  DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Public can view fighters" ON public.fighters;
  DROP POLICY IF EXISTS "Admins can manage fighters" ON public.fighters;
  DROP POLICY IF EXISTS "Public can view fight stats" ON public.fight_stats;
  DROP POLICY IF EXISTS "Admins can manage fight stats" ON public.fight_stats;
  DROP POLICY IF EXISTS "Public can view fight history" ON public.fight_history;
  DROP POLICY IF EXISTS "Admins can manage fight history" ON public.fight_history;
  DROP POLICY IF EXISTS "Public can view betting odds" ON public.betting_odds;
  DROP POLICY IF EXISTS "Admins can manage betting odds" ON public.betting_odds;
  DROP POLICY IF EXISTS "Public can view upcoming events" ON public.upcoming_events;
  DROP POLICY IF EXISTS "Admins can manage upcoming events" ON public.upcoming_events;
END $$;

-- Create new policies using JWT claims
DO $$ 
BEGIN
  -- Users policies
  CREATE POLICY "Anyone can view users" ON public.users
    FOR SELECT USING (true);

  CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

  -- User roles policies (using JWT claims to avoid recursion)
  CREATE POLICY "Anyone can view roles" ON public.user_roles
    FOR SELECT USING (true);

  CREATE POLICY "Admin access to roles" ON public.user_roles
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

  -- Fighters policies
  CREATE POLICY "Anyone can view fighters" ON public.fighters
    FOR SELECT USING (true);

  CREATE POLICY "Admin manage fighters" ON public.fighters
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

  -- Fight stats policies
  CREATE POLICY "Anyone can view fight stats" ON public.fight_stats
    FOR SELECT USING (true);

  CREATE POLICY "Admin manage fight stats" ON public.fight_stats
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

  -- Fight history policies
  CREATE POLICY "Anyone can view fight history" ON public.fight_history
    FOR SELECT USING (true);

  CREATE POLICY "Admin manage fight history" ON public.fight_history
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

  -- Betting odds policies
  CREATE POLICY "Anyone can view betting odds" ON public.betting_odds
    FOR SELECT USING (true);

  CREATE POLICY "Admin manage betting odds" ON public.betting_odds
    FOR ALL USING (auth.jwt()->>'role' = 'admin');

  -- Upcoming events policies
  CREATE POLICY "Anyone can view upcoming events" ON public.upcoming_events
    FOR SELECT USING (true);

  CREATE POLICY "Admin manage upcoming events" ON public.upcoming_events
    FOR ALL USING (auth.jwt()->>'role' = 'admin');
END $$;

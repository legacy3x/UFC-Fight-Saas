/*
  # Update RLS Policies
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate policies using JWT claims for role checks
    - Simplify admin access checks
    
  2. Security
    - Maintain RLS on all tables
    - Use JWT claims for role verification
    - Ensure proper access control for admin operations
*/

-- Drop existing policies first
DO $$ 
BEGIN
  -- Drop all existing policies
  DROP POLICY IF EXISTS "Users can view all users" ON public.users;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
  DROP POLICY IF EXISTS "Public can view user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
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

-- Recreate all policies with JWT-based role checks
DO $$ 
BEGIN
  -- Users policies
  CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

  CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

  -- User roles policies
  CREATE POLICY "Public can view user roles" ON public.user_roles
    FOR SELECT USING (true);

  CREATE POLICY "Service role can manage roles" ON public.user_roles
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

  CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

  -- Fighters policies
  CREATE POLICY "Public can view fighters" ON public.fighters
    FOR SELECT USING (true);

  CREATE POLICY "Admins can manage fighters" ON public.fighters
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

  -- Fight stats policies
  CREATE POLICY "Public can view fight stats" ON public.fight_stats
    FOR SELECT USING (true);

  CREATE POLICY "Admins can manage fight stats" ON public.fight_stats
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

  -- Fight history policies
  CREATE POLICY "Public can view fight history" ON public.fight_history
    FOR SELECT USING (true);

  CREATE POLICY "Admins can manage fight history" ON public.fight_history
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

  -- Betting odds policies
  CREATE POLICY "Public can view betting odds" ON public.betting_odds
    FOR SELECT USING (true);

  CREATE POLICY "Admins can manage betting odds" ON public.betting_odds
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

  -- Upcoming events policies
  CREATE POLICY "Public can view upcoming events" ON public.upcoming_events
    FOR SELECT USING (true);

  CREATE POLICY "Admins can manage upcoming events" ON public.upcoming_events
    FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');
END $$;
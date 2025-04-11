/*
  # Fix recursion in RLS policies

  1. Changes
    - Remove recursive policy checks
    - Simplify admin role verification
    - Update all table policies

  2. Security
    - Maintain RLS security
    - Use JWT claims for role verification
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public can view user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can manage fighters" ON public.fighters;
  DROP POLICY IF EXISTS "Admins can manage fight stats" ON public.fight_stats;
  DROP POLICY IF EXISTS "Admins can manage fight history" ON public.fight_history;
  DROP POLICY IF EXISTS "Admins can manage betting odds" ON public.betting_odds;
  DROP POLICY IF EXISTS "Admins can manage upcoming events" ON public.upcoming_events;
END $$;

-- Create new policies without recursion
CREATE POLICY "Public can view user roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

-- Update other table policies to use JWT claims
CREATE POLICY "Admins can manage fighters" ON public.fighters
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can manage fight stats" ON public.fight_stats
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can manage fight history" ON public.fight_history
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can manage betting odds" ON public.betting_odds
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

CREATE POLICY "Admins can manage upcoming events" ON public.upcoming_events
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

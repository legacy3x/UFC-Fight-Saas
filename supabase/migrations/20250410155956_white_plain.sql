/*
  # Update RLS policies for admin access

  1. Changes
    - Drop and recreate service role and admin policies
    - Ensure proper admin access control
  
  2. Security
    - Maintain RLS on all tables
    - Update admin access policies
*/

-- Drop any conflicting policies first
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
END $$;

-- User roles policies
CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Create combined admin policies for each table
DO $$ 
BEGIN
    -- Fighters
    DROP POLICY IF EXISTS "Admins can manage fighters" ON public.fighters;
    CREATE POLICY "Admins can manage fighters" ON public.fighters
      FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ));

    -- Fight stats
    DROP POLICY IF EXISTS "Admins can manage fight stats" ON public.fight_stats;
    CREATE POLICY "Admins can manage fight stats" ON public.fight_stats
      FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ));

    -- Fight history
    DROP POLICY IF EXISTS "Admins can manage fight history" ON public.fight_history;
    CREATE POLICY "Admins can manage fight history" ON public.fight_history
      FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ));

    -- Betting odds
    DROP POLICY IF EXISTS "Admins can manage betting odds" ON public.betting_odds;
    CREATE POLICY "Admins can manage betting odds" ON public.betting_odds
      FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ));

    -- Upcoming events
    DROP POLICY IF EXISTS "Admins can manage upcoming events" ON public.upcoming_events;
    CREATE POLICY "Admins can manage upcoming events" ON public.upcoming_events
      FOR ALL USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      ));
END $$;

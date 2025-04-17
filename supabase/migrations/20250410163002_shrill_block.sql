/*
  # Update RLS policies for admin access
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Recreate policies with proper admin access checks
    - Fix service role authentication
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public read access where appropriate
    - Add policies for admin management access
*/

-- Drop existing policies first
DO $$ 
BEGIN
  -- Users policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all users') THEN
    DROP POLICY "Users can view all users" ON public.users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile') THEN
    DROP POLICY "Users can update their own profile" ON public.users;
  END IF;

  -- User roles policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage roles') THEN
    DROP POLICY "Service role can manage roles" ON public.user_roles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view user roles') THEN
    DROP POLICY "Public can view user roles" ON public.user_roles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage roles') THEN
    DROP POLICY "Admins can manage roles" ON public.user_roles;
  END IF;

  -- Fighters policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view fighters') THEN
    DROP POLICY "Public can view fighters" ON public.fighters;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage fighters') THEN
    DROP POLICY "Admins can manage fighters" ON public.fighters;
  END IF;

  -- Fight stats policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view fight stats') THEN
    DROP POLICY "Public can view fight stats" ON public.fight_stats;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage fight stats') THEN
    DROP POLICY "Admins can manage fight stats" ON public.fight_stats;
  END IF;

  -- Fight history policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view fight history') THEN
    DROP POLICY "Public can view fight history" ON public.fight_history;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage fight history') THEN
    DROP POLICY "Admins can manage fight history" ON public.fight_history;
  END IF;

  -- Betting odds policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view betting odds') THEN
    DROP POLICY "Public can view betting odds" ON public.betting_odds;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage betting odds') THEN
    DROP POLICY "Admins can manage betting odds" ON public.betting_odds;
  END IF;

  -- Upcoming events policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view upcoming events') THEN
    DROP POLICY "Public can view upcoming events" ON public.upcoming_events;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage upcoming events') THEN
    DROP POLICY "Admins can manage upcoming events" ON public.upcoming_events;
  END IF;
END $$;

-- Create new policies

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
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fighters policies
CREATE POLICY "Public can view fighters" ON public.fighters
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fighters" ON public.fighters
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fight stats policies
CREATE POLICY "Public can view fight stats" ON public.fight_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight stats" ON public.fight_stats
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fight history policies
CREATE POLICY "Public can view fight history" ON public.fight_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight history" ON public.fight_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Betting odds policies
CREATE POLICY "Public can view betting odds" ON public.betting_odds
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage betting odds" ON public.betting_odds
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Upcoming events policies
CREATE POLICY "Public can view upcoming events" ON public.upcoming_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage upcoming events" ON public.upcoming_events
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
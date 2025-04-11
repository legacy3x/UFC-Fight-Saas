/*
  # Update RLS Policies

  This migration updates Row Level Security (RLS) policies for all tables to ensure proper access control.

  1. User Access
     - Public read access for most tables
     - Users can update their own profiles
     - Users can manage their own predictions
  
  2. Admin Access
     - Admins can manage all data
     - Separate policies for different operations
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Users policies
    DROP POLICY IF EXISTS "Users can view all users" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

    -- User roles policies
    DROP POLICY IF EXISTS "Public can view user roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

    -- Fighters policies
    DROP POLICY IF EXISTS "Public can view fighters" ON public.fighters;
    DROP POLICY IF EXISTS "Admins can insert fighters" ON public.fighters;
    DROP POLICY IF EXISTS "Admins can update fighters" ON public.fighters;
    DROP POLICY IF EXISTS "Admins can delete fighters" ON public.fighters;

    -- Fight stats policies
    DROP POLICY IF EXISTS "Public can view fight stats" ON public.fight_stats;
    DROP POLICY IF EXISTS "Admins can insert fight stats" ON public.fight_stats;
    DROP POLICY IF EXISTS "Admins can update fight stats" ON public.fight_stats;
    DROP POLICY IF EXISTS "Admins can delete fight stats" ON public.fight_stats;

    -- Fight history policies
    DROP POLICY IF EXISTS "Public can view fight history" ON public.fight_history;
    DROP POLICY IF EXISTS "Admins can insert fight history" ON public.fight_history;
    DROP POLICY IF EXISTS "Admins can update fight history" ON public.fight_history;
    DROP POLICY IF EXISTS "Admins can delete fight history" ON public.fight_history;

    -- Betting odds policies
    DROP POLICY IF EXISTS "Public can view betting odds" ON public.betting_odds;
    DROP POLICY IF EXISTS "Admins can insert betting odds" ON public.betting_odds;
    DROP POLICY IF EXISTS "Admins can update betting odds" ON public.betting_odds;
    DROP POLICY IF EXISTS "Admins can delete betting odds" ON public.betting_odds;

    -- Upcoming events policies
    DROP POLICY IF EXISTS "Public can view upcoming events" ON public.upcoming_events;
    DROP POLICY IF EXISTS "Admins can insert upcoming events" ON public.upcoming_events;
    DROP POLICY IF EXISTS "Admins can update upcoming events" ON public.upcoming_events;
    DROP POLICY IF EXISTS "Admins can delete upcoming events" ON public.upcoming_events;

    -- User predictions policies
    DROP POLICY IF EXISTS "Users can view all predictions" ON public.user_predictions;
    DROP POLICY IF EXISTS "Users can create their own predictions" ON public.user_predictions;
    DROP POLICY IF EXISTS "Users can update their own predictions" ON public.user_predictions;
    DROP POLICY IF EXISTS "Users can delete their own predictions" ON public.user_predictions;
END $$;

-- Users policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Public can view user roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert user roles" ON public.user_roles
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update user roles" ON public.user_roles
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete user roles" ON public.user_roles
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fighters policies
CREATE POLICY "Public can view fighters" ON public.fighters
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert fighters" ON public.fighters
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update fighters" ON public.fighters
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete fighters" ON public.fighters
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fight stats policies
CREATE POLICY "Public can view fight stats" ON public.fight_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert fight stats" ON public.fight_stats
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update fight stats" ON public.fight_stats
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete fight stats" ON public.fight_stats
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Fight history policies
CREATE POLICY "Public can view fight history" ON public.fight_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert fight history" ON public.fight_history
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update fight history" ON public.fight_history
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete fight history" ON public.fight_history
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Betting odds policies
CREATE POLICY "Public can view betting odds" ON public.betting_odds
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert betting odds" ON public.betting_odds
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update betting odds" ON public.betting_odds
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete betting odds" ON public.betting_odds
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Upcoming events policies
CREATE POLICY "Public can view upcoming events" ON public.upcoming_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert upcoming events" ON public.upcoming_events
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update upcoming events" ON public.upcoming_events
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete upcoming events" ON public.upcoming_events
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- User predictions policies
CREATE POLICY "Users can view all predictions" ON public.user_predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own predictions" ON public.user_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON public.user_predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions" ON public.user_predictions
  FOR DELETE USING (auth.uid() = user_id);

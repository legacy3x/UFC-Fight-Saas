/*
  # Update RLS policies for user access
  
  1. Changes
    - Drop existing policies
    - Create new policies for authenticated users
    - Update user roles constraints
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Remove admin-specific policies
*/

-- Drop existing policies first
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage roles') THEN
    DROP POLICY "Users can manage roles" ON public.user_roles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage fighters') THEN
    DROP POLICY "Users can manage fighters" ON public.fighters;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage fight stats') THEN
    DROP POLICY "Users can manage fight stats" ON public.fight_stats;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage fight history') THEN
    DROP POLICY "Users can manage fight history" ON public.fight_history;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage betting odds') THEN
    DROP POLICY "Users can manage betting odds" ON public.betting_odds;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage upcoming events') THEN
    DROP POLICY "Users can manage upcoming events" ON public.upcoming_events;
  END IF;
END $$;

-- Create new policies for authenticated users
DO $$ 
BEGIN
  -- User roles
  CREATE POLICY "Authenticated users can view roles" ON public.user_roles
    FOR SELECT USING (auth.role() = 'authenticated');
    
  CREATE POLICY "Users can manage their own roles" ON public.user_roles
    FOR ALL USING (auth.uid() = user_id);

  -- Fighters
  CREATE POLICY "Anyone can view fighters" ON public.fighters
    FOR SELECT USING (true);
    
  CREATE POLICY "Authenticated users can manage fighters" ON public.fighters
    FOR ALL USING (auth.role() = 'authenticated');

  -- Fight stats
  CREATE POLICY "Anyone can view fight stats" ON public.fight_stats
    FOR SELECT USING (true);
    
  CREATE POLICY "Authenticated users can manage fight stats" ON public.fight_stats
    FOR ALL USING (auth.role() = 'authenticated');

  -- Fight history
  CREATE POLICY "Anyone can view fight history" ON public.fight_history
    FOR SELECT USING (true);
    
  CREATE POLICY "Authenticated users can manage fight history" ON public.fight_history
    FOR ALL USING (auth.role() = 'authenticated');

  -- Betting odds
  CREATE POLICY "Anyone can view betting odds" ON public.betting_odds
    FOR SELECT USING (true);
    
  CREATE POLICY "Authenticated users can manage betting odds" ON public.betting_odds
    FOR ALL USING (auth.role() = 'authenticated');

  -- Upcoming events
  CREATE POLICY "Anyone can view upcoming events" ON public.upcoming_events
    FOR SELECT USING (true);
    
  CREATE POLICY "Authenticated users can manage upcoming events" ON public.upcoming_events
    FOR ALL USING (auth.role() = 'authenticated');
END $$;

-- Update user_roles table constraints
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_role_check'
  ) THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
  END IF;
END $$;

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role = 'user');

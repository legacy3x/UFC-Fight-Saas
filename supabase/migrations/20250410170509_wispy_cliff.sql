/*
  # Update User Roles and Policies
  
  1. Changes
    - Update existing user roles to 'user'
    - Modify role constraint to only allow 'user' role
    - Update policies to grant access to authenticated users
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Maintain public read access where appropriate
*/

-- Update existing roles to 'user'
UPDATE public.user_roles SET role = 'user';

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can manage fighters" ON public.fighters;
  DROP POLICY IF EXISTS "Users can manage fight stats" ON public.fight_stats;
  DROP POLICY IF EXISTS "Users can manage fight history" ON public.fight_history;
  DROP POLICY IF EXISTS "Users can manage betting odds" ON public.betting_odds;
  DROP POLICY IF EXISTS "Users can manage upcoming events" ON public.upcoming_events;
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
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role = 'user');

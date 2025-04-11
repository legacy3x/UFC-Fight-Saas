/*
  # Update RLS policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies for admin access
    - Update user role management approach
  
  2. Security
    - Maintain RLS on all tables
    - Ensure proper access control for admin users
    - Keep public read access where appropriate
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

-- Update existing admin check policies
DO $$ 
BEGIN
    -- Fighters
    UPDATE public.fighters
    SET policy = (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WHERE policy IS NOT NULL;

    -- Fight stats
    UPDATE public.fight_stats
    SET policy = (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WHERE policy IS NOT NULL;

    -- Fight history
    UPDATE public.fight_history
    SET policy = (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WHERE policy IS NOT NULL;

    -- Betting odds
    UPDATE public.betting_odds
    SET policy = (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WHERE policy IS NOT NULL;

    -- Upcoming events
    UPDATE public.upcoming_events
    SET policy = (
      EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WHERE policy IS NOT NULL;
END $$;

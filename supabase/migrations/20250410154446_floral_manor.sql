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

-- Users policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Public can view user roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert user roles" ON public.user_roles
  FOR INSERT USING (EXISTS (
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

-- User predictions policies
CREATE POLICY "Users can view all predictions" ON public.user_predictions
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own predictions" ON public.user_predictions
  FOR INSERT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON public.user_predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions" ON public.user_predictions
  FOR DELETE USING (auth.uid() = user_id);

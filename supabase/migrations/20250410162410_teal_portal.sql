-- Users policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Public can view user roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING (role() = 'service_role');

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id 
      AND (users.raw_user_meta_data->>'is_admin')::text = 'true'
    )
  );

-- Fighters policies
CREATE POLICY "Public can view fighters" ON public.fighters
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fighters" ON public.fighters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id 
      AND (users.raw_user_meta_data->>'is_admin')::text = 'true'
    )
  );

-- Fight stats policies
CREATE POLICY "Public can view fight stats" ON public.fight_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight stats" ON public.fight_stats
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id 
      AND (users.raw_user_meta_data->>'is_admin')::text = 'true'
    )
  );

-- Fight history policies
CREATE POLICY "Public can view fight history" ON public.fight_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight history" ON public.fight_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id 
      AND (users.raw_user_meta_data->>'is_admin')::text = 'true'
    )
  );

-- Betting odds policies
CREATE POLICY "Public can view betting odds" ON public.betting_odds
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage betting odds" ON public.betting_odds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id 
      AND (users.raw_user_meta_data->>'is_admin')::text = 'true'
    )
  );

-- Upcoming events policies
CREATE POLICY "Public can view upcoming events" ON public.upcoming_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage upcoming events" ON public.upcoming_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = users.id 
      AND (users.raw_user_meta_data->>'is_admin')::text = 'true'
    )
  );

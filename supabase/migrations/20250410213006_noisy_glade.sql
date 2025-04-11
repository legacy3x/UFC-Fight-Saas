-- Users policies
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Admins can manage all roles" ON public.user_roles
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

-- Fight cards policies
CREATE POLICY "Public can view fight cards" ON public.fight_cards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fight cards" ON public.fight_cards
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

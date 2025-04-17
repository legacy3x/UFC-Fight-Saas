/*
  # Remove all policies and disable RLS

  1. Changes
    - Drop all existing policies for specified tables
    - Disable RLS on all specified tables
    
  2. Tables affected:
    - betting_odds
    - fighters
    - prediction_logs
    - scraper_logs
    - scraper_schedules
    - upcoming_events
    - user_predictions
    - user_roles
    - users
    - fight_history
    - fight_stats
*/

-- Drop all existing policies
DO $$ 
BEGIN
  -- Drop policies for each table
  DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admin access to roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Anyone can view fighters" ON public.fighters;
  DROP POLICY IF EXISTS "Admin manage fighters" ON public.fighters;
  DROP POLICY IF EXISTS "Anyone can view fight stats" ON public.fight_stats;
  DROP POLICY IF EXISTS "Admin manage fight stats" ON public.fight_stats;
  DROP POLICY IF EXISTS "Anyone can view fight history" ON public.fight_history;
  DROP POLICY IF EXISTS "Admin manage fight history" ON public.fight_history;
  DROP POLICY IF EXISTS "Anyone can view betting odds" ON public.betting_odds;
  DROP POLICY IF EXISTS "Admin manage betting odds" ON public.betting_odds;
  DROP POLICY IF EXISTS "Anyone can view upcoming events" ON public.upcoming_events;
  DROP POLICY IF EXISTS "Admin manage upcoming events" ON public.upcoming_events;
  DROP POLICY IF EXISTS "Anyone can view predictions" ON public.prediction_logs;
  DROP POLICY IF EXISTS "Admin manage predictions" ON public.prediction_logs;
  DROP POLICY IF EXISTS "Anyone can view scraper logs" ON public.scraper_logs;
  DROP POLICY IF EXISTS "Admin manage scraper logs" ON public.scraper_logs;
  DROP POLICY IF EXISTS "Anyone can view schedules" ON public.scraper_schedules;
  DROP POLICY IF EXISTS "Admin manage schedules" ON public.scraper_schedules;
  DROP POLICY IF EXISTS "Anyone can view user predictions" ON public.user_predictions;
  DROP POLICY IF EXISTS "Users manage own predictions" ON public.user_predictions;
END $$;

-- Disable RLS on all tables
ALTER TABLE public.betting_odds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fighters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_stats DISABLE ROW LEVEL SECURITY;
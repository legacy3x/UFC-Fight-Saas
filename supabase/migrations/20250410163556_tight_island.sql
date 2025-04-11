/*
  # Fix infinite recursion in user_roles policies

  1. Changes
    - Remove recursive policies that check user_roles table
    - Use JWT claims for admin role checks
    - Simplify policy structure

  2. Security
    - Maintain RLS security
    - Keep admin-only access for sensitive operations
    - Allow public read access where appropriate
*/

-- Drop existing policies first
DO $$ 
BEGIN
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
END $$;

-- Create new policies for user_roles
CREATE POLICY "Public can view user roles" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role');

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb->>'role' = 'admin');

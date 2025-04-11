/*
  # Fix admin authentication

  1. Changes
    - Add function to check admin role
    - Update user_roles policies
    - Add admin check function

  2. Security
    - Maintain RLS security
    - Ensure proper admin role verification
*/

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = user_id
    AND user_roles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_roles policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Public can view user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
  
  -- Create new policies
  CREATE POLICY "Public can view user roles" ON public.user_roles
    FOR SELECT USING (true);

  CREATE POLICY "Service role can manage roles" ON public.user_roles
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

  CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (is_admin(auth.uid()));
END $$;

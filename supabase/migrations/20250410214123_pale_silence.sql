/*
  # Fix Events Policies

  1. Changes
    - Drop and recreate upcoming events policies with explicit INSERT/UPDATE/DELETE policies
    - Ensure admin role check is consistent
  
  2. Security
    - Maintain public read access
    - Restrict write operations to admin users only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view upcoming events" ON upcoming_events;
DROP POLICY IF EXISTS "Admins can manage upcoming events" ON upcoming_events;

-- Recreate with specific policies
CREATE POLICY "Public can view upcoming events" 
  ON upcoming_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert upcoming events" 
  ON upcoming_events
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "Admins can update upcoming events" 
  ON upcoming_events
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "Admins can delete upcoming events" 
  ON upcoming_events
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ));

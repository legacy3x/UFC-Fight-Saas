/*
  # Create admin user

  1. Changes
    - Create new admin user with email and password
    - Grant admin role to the user
    
  2. Security
    - User will be created with email verification disabled
    - User will be granted admin role immediately
*/

-- Create the admin user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert the user into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'info@legacy3x.com',
    crypt('Primavera11d!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"is_admin":true}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Insert into public.users
  INSERT INTO public.users (id, email, username)
  VALUES (new_user_id, 'info@legacy3x.com', 'admin');

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin');
END $$;

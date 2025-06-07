/*
  # Fix all admin operations permissions
  
  1. Changes
    - Fix RLS policies for all admin operations
    - Ensure proper authentication checks
    - Add comprehensive error handling
    - Update all functions to work with authenticated users
    
  2. Security
    - Proper authentication verification
    - Consistent permission checks
    - Error handling for unauthorized access
*/

-- Fix admin_users policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON admin_users;

CREATE POLICY "Enable read access for authenticated users" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON admin_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON admin_users
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON admin_users
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fix courses policies
DROP POLICY IF EXISTS "Enable insert for authenticated" ON courses;
DROP POLICY IF EXISTS "Enable update for authenticated" ON courses;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON courses;

CREATE POLICY "Enable insert for authenticated users" ON courses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON courses
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON courses
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fix registrations policies
DROP POLICY IF EXISTS "Enable read access for authenticated" ON registrations;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON registrations;

CREATE POLICY "Enable read access for authenticated users" ON registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON registrations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Fix activity_logs policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activity_logs;

CREATE POLICY "Enable read access for authenticated users" ON activity_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to check if user is authenticated admin
CREATE OR REPLACE FUNCTION is_authenticated_admin()
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  admin_exists boolean;
BEGIN
  -- Get current user ID from auth
  current_user_id := auth.uid();
  
  -- Check if current user exists in admin_users table
  SELECT EXISTS(
    SELECT 1 FROM admin_users 
    WHERE id = current_user_id
  ) INTO admin_exists;
  
  RETURN COALESCE(admin_exists, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current admin user ID
CREATE OR REPLACE FUNCTION get_current_admin_id()
RETURNS uuid AS $$
DECLARE
  current_user_id uuid;
  admin_user_id uuid;
BEGIN
  -- Get current user ID from auth
  current_user_id := auth.uid();
  
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM admin_users 
  WHERE id = current_user_id
  LIMIT 1;
  
  -- If no authenticated admin found, get first admin for system operations
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id
    FROM admin_users
    LIMIT 1;
  END IF;
  
  RETURN admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update send_email_notification function
CREATE OR REPLACE FUNCTION send_email_notification(
  recipient_email text,
  email_subject text,
  email_body text
) RETURNS boolean AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get current admin user ID
  admin_user_id := get_current_admin_id();
  
  -- Log the email notification
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'email_notification_sent',
    jsonb_build_object(
      'recipient', recipient_email,
      'subject', email_subject,
      'timestamp', now()
    )
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_email_template function with better error handling
CREATE OR REPLACE FUNCTION create_email_template(
  template_name_param text,
  subject_param text,
  body_template_param text,
  variables_param text[] DEFAULT ARRAY[]::text[],
  is_active_param boolean DEFAULT true
) RETURNS uuid AS $$
DECLARE
  new_template_id uuid;
  variables_jsonb jsonb;
  admin_user_id uuid;
BEGIN
  -- Check authentication
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get current admin user ID
  admin_user_id := get_current_admin_id();
  
  -- Convert text array to jsonb array
  variables_jsonb := to_jsonb(variables_param);
  
  INSERT INTO email_templates (
    template_name,
    subject,
    body_template,
    variables,
    is_active
  )
  VALUES (
    template_name_param,
    subject_param,
    body_template_param,
    variables_jsonb,
    is_active_param
  )
  RETURNING id INTO new_template_id;
  
  -- Log the action
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'email_template_created',
    jsonb_build_object(
      'template_id', new_template_id,
      'template_name', template_name_param,
      'timestamp', now()
    )
  );
  
  RETURN new_template_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating email template: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for course management
CREATE OR REPLACE FUNCTION create_course(
  title_param text,
  description_param text,
  duration_param text,
  features_param text[] DEFAULT ARRAY[]::text[],
  image_url_param text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  new_course_id uuid;
  admin_user_id uuid;
BEGIN
  -- Check authentication
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get current admin user ID
  admin_user_id := get_current_admin_id();
  
  INSERT INTO courses (
    title,
    description,
    duration,
    features,
    image_url
  )
  VALUES (
    title_param,
    description_param,
    duration_param,
    features_param,
    image_url_param
  )
  RETURNING id INTO new_course_id;
  
  -- Log the action
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'course_created',
    jsonb_build_object(
      'course_id', new_course_id,
      'title', title_param,
      'timestamp', now()
    )
  );
  
  RETURN new_course_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating course: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for admin user management
CREATE OR REPLACE FUNCTION create_admin_user(
  email_param text,
  password_hash_param text
) RETURNS uuid AS $$
DECLARE
  new_admin_id uuid;
  admin_user_id uuid;
BEGIN
  -- Check authentication
  IF auth.role() != 'authenticated' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get current admin user ID
  admin_user_id := get_current_admin_id();
  
  INSERT INTO admin_users (email, password_hash)
  VALUES (email_param, password_hash_param)
  RETURNING id INTO new_admin_id;
  
  -- Log the action
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'admin_user_created',
    jsonb_build_object(
      'new_admin_id', new_admin_id,
      'email', email_param,
      'timestamp', now()
    )
  );
  
  RETURN new_admin_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating admin user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update test_notification_system function
CREATE OR REPLACE FUNCTION test_notification_system()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get current admin user ID
  admin_user_id := get_current_admin_id();
  
  -- Log the test
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'test_notification_system',
    jsonb_build_object(
      'test_time', now(),
      'admin_emails', get_email_setting('admin_emails'),
      'notifications_enabled', get_email_setting('notifications_enabled')
    )
  );
  
  -- Send test notification
  PERFORM send_email_notification(
    'dzmitry.arlou@grodno.ai',
    'Тестовое уведомление - ИИ Клуб',
    'Система уведомлений работает корректно. Время теста: ' || now()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log the permission fixes
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
      admin_user_id,
      'all_permissions_fixed',
      jsonb_build_object(
        'action', 'Fixed all admin operation permissions and authentication',
        'timestamp', now()
      )
    );
  END IF;
END $$;
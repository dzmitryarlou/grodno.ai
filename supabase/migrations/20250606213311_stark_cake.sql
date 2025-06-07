/*
  # Fix email template permissions
  
  1. Changes
    - Update RLS policies for email_templates table
    - Ensure authenticated users can create, read, update, and delete templates
    - Fix any permission issues with template management
    
  2. Security
    - Maintain proper RLS while allowing template management
    - Ensure only authenticated users can manage templates
*/

-- Drop existing policies for email_templates
DROP POLICY IF EXISTS "Enable read for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON email_templates;

-- Create comprehensive policies for email_templates
CREATE POLICY "Enable read access for authenticated users" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON email_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON email_templates
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON email_templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- Also ensure email_settings has proper policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON email_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON email_settings;

CREATE POLICY "Enable read access for authenticated users" ON email_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON email_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON email_settings
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Update the create_email_template function to be more robust
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
BEGIN
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
  
  RETURN new_template_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating email template: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log the permission fix
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
      admin_user_id,
      'email_template_permissions_fixed',
      jsonb_build_object(
        'action', 'Fixed RLS policies for email template management',
        'timestamp', now()
      )
    );
  END IF;
END $$;
/*
  # Remove course categories and filters
  
  1. Changes
    - Remove category column from courses table
    - Update existing courses to remove category references
    - Clean up any category-related data
    
  2. Security
    - Maintain existing RLS policies
*/

-- Remove category column from courses table
ALTER TABLE courses DROP COLUMN IF EXISTS category;

-- Update any existing data that might reference categories
-- (This is safe since we're removing the concept entirely)

-- Log the category removal
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
      admin_user_id,
      'categories_removed',
      jsonb_build_object(
        'action', 'Removed category system from courses',
        'timestamp', now()
      )
    );
  END IF;
END $$;
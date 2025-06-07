/*
  # Admin System Schema Update
  
  1. Tables
    - admin_users: Store admin user credentials
    - activity_logs: Track system activity
    
  2. Security
    - Enable RLS with appropriate policies
    - Allow public insert for admin_users
    - Allow authenticated access for activity logs
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow public insert but restrict other operations to authenticated users
CREATE POLICY "Enable public insert" ON admin_users
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated" ON admin_users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated" ON admin_users
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated" ON admin_users
  FOR DELETE TO authenticated
  USING (true);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public insert but restrict read to authenticated users
CREATE POLICY "Enable public insert" ON activity_logs
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated" ON activity_logs
  FOR SELECT TO authenticated
  USING (true);
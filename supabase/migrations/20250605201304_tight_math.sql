/*
  # Create registrations table
  
  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `phone` (text, required)
      - `telegram` (text, required)
      - `course_id` (text, required)
      - `created_at` (timestamp with timezone)
      
  2. Security
    - Enable RLS
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  telegram text NOT NULL,
  course_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for admin" ON registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for admin" ON registrations
  FOR DELETE USING (auth.role() = 'authenticated');
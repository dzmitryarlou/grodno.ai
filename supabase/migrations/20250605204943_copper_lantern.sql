/*
  # Add courses table and update registrations schema
  
  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, required)
      - `category` (text, required)
      - `duration` (text, required)
      - `features` (jsonb array)
      - `image_url` (text)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)
      
  2. Changes to existing tables
    - Add `legacy_course_id` to registrations
    - Convert course_id to UUID
    
  3. Security
    - Enable RLS on courses table
    - Add policies for public read access
    - Add policies for authenticated user management
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  duration text NOT NULL,
  features jsonb[] DEFAULT array[]::jsonb[],
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Add policies for courses
CREATE POLICY "Enable public read access" ON courses
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated" ON courses
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated" ON courses
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated" ON courses
  FOR DELETE TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Preserve existing course_id values
ALTER TABLE registrations 
  ADD COLUMN legacy_course_id text;

UPDATE registrations 
  SET legacy_course_id = course_id;

-- Add new UUID course_id column
ALTER TABLE registrations 
  DROP COLUMN course_id,
  ADD COLUMN course_id uuid;

-- Insert initial courses
INSERT INTO courses (id, title, description, category, duration, features, image_url) VALUES
  (gen_random_uuid(), 'Вайб-кодинг: Веб-разработка', 'Создавайте современные веб-приложения с использованием ИИ', 'web', '8 недель', array['{"feature": "Разработка с использованием React и современных фреймворков"}', '{"feature": "Интеграция ChatGPT и других ИИ API"}', '{"feature": "Создание адаптивных интерфейсов"}', '{"feature": "Работа с базами данных и серверной частью"}']::jsonb[], 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg'),
  (gen_random_uuid(), 'Вайб-кодинг: Мобильная разработка', 'Создавайте мобильные приложения нового поколения с интегрированным ИИ', 'mobile', '10 недель', array['{"feature": "Разработка на React Native"}', '{"feature": "Интеграция нейросетей в мобильные приложения"}', '{"feature": "Работа с камерой и сенсорами"}', '{"feature": "Публикация в App Store и Google Play"}']::jsonb[], 'https://images.pexels.com/photos/7988079/pexels-photo-7988079.jpeg'),
  (gen_random_uuid(), 'Вайб-кодинг: Машинное обучение', 'Погрузитесь в мир машинного обучения через призму вайб-кодинга', 'ml', '12 недель', array['{"feature": "Основы машинного обучения и нейросетей"}', '{"feature": "Работа с популярными ИИ API"}', '{"feature": "Создание собственных моделей"}', '{"feature": "Интеграция ИИ в веб и мобильные приложения"}']::jsonb[], 'https://images.pexels.com/photos/8386423/pexels-photo-8386423.jpeg');

-- Add foreign key constraint
ALTER TABLE registrations
  ADD CONSTRAINT registrations_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES courses(id)
  ON DELETE CASCADE;
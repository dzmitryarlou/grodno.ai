/*
  # Fix database schema and course registration

  1. Changes
    - Recreate courses table with proper structure
    - Update registrations table to use UUID for course_id
    - Add proper indexes and constraints
    - Insert initial course data
    
  2. Security
    - Enable RLS on courses table
    - Add policies for public read and authenticated write access
*/

-- First drop the foreign key if it exists
ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_course_id_fkey;

-- Recreate courses table
DROP TABLE IF EXISTS courses CASCADE;

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  duration text NOT NULL,
  features text[] DEFAULT ARRAY[]::text[],
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

-- Insert initial courses
INSERT INTO courses (title, description, category, duration, features, image_url) VALUES
  (
    'Вайб-кодинг: Веб-разработка',
    'Создавайте современные веб-приложения с использованием ИИ',
    'web',
    '8 недель',
    ARRAY[
      'Разработка с использованием React и современных фреймворков',
      'Интеграция ChatGPT и других ИИ API',
      'Создание адаптивных интерфейсов',
      'Работа с базами данных и серверной частью'
    ],
    'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg'
  ),
  (
    'Вайб-кодинг: Мобильная разработка',
    'Создавайте мобильные приложения нового поколения с интегрированным ИИ',
    'mobile',
    '10 недель',
    ARRAY[
      'Разработка на React Native',
      'Интеграция нейросетей в мобильные приложения',
      'Работа с камерой и сенсорами',
      'Публикация в App Store и Google Play'
    ],
    'https://images.pexels.com/photos/7988079/pexels-photo-7988079.jpeg'
  ),
  (
    'Вайб-кодинг: Машинное обучение',
    'Погрузитесь в мир машинного обучения через призму вайб-кодинга',
    'ml',
    '12 недель',
    ARRAY[
      'Основы машинного обучения и нейросетей',
      'Работа с популярными ИИ API',
      'Создание собственных моделей',
      'Интеграция ИИ в веб и мобильные приложения'
    ],
    'https://images.pexels.com/photos/8386423/pexels-photo-8386423.jpeg'
  );

-- Clear existing registrations since we're changing the course_id type
TRUNCATE TABLE registrations;

-- Update registrations table structure
ALTER TABLE registrations
  ALTER COLUMN course_id TYPE uuid USING (gen_random_uuid());

-- Add the foreign key constraint after data is cleared
ALTER TABLE registrations
  ADD CONSTRAINT registrations_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES courses(id)
  ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_course_id ON registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
/*
  # Add test data to database
  
  1. Changes
    - Add initial courses with proper jsonb[] features
    - Add test admin user
    - Add test registration
    - Add test activity logs
*/

-- First, ensure we have our initial courses
INSERT INTO courses (id, title, description, category, duration, features, image_url)
SELECT 
  gen_random_uuid(),
  'Вайб-кодинг: Веб-разработка',
  'Создавайте современные веб-приложения с использованием ИИ',
  'web',
  '8 недель',
  ARRAY[
    to_jsonb('Разработка с использованием React и современных фреймворков'::text),
    to_jsonb('Интеграция ChatGPT и других ИИ API'::text),
    to_jsonb('Создание адаптивных интерфейсов'::text),
    to_jsonb('Работа с базами данных и серверной частью'::text)
  ]::jsonb[],
  'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg'
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE title = 'Вайб-кодинг: Веб-разработка'
);

INSERT INTO courses (id, title, description, category, duration, features, image_url)
SELECT 
  gen_random_uuid(),
  'Вайб-кодинг: Мобильная разработка',
  'Создавайте мобильные приложения нового поколения с интегрированным ИИ',
  'mobile',
  '10 недель',
  ARRAY[
    to_jsonb('Разработка на React Native'::text),
    to_jsonb('Интеграция нейросетей в мобильные приложения'::text),
    to_jsonb('Работа с камерой и сенсорами'::text),
    to_jsonb('Публикация в App Store и Google Play'::text)
  ]::jsonb[],
  'https://images.pexels.com/photos/7988079/pexels-photo-7988079.jpeg'
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE title = 'Вайб-кодинг: Мобильная разработка'
);

INSERT INTO courses (id, title, description, category, duration, features, image_url)
SELECT 
  gen_random_uuid(),
  'Вайб-кодинг: Машинное обучение',
  'Погрузитесь в мир машинного обучения через призму вайб-кодинга',
  'ml',
  '12 недель',
  ARRAY[
    to_jsonb('Основы машинного обучения и нейросетей'::text),
    to_jsonb('Работа с популярными ИИ API'::text),
    to_jsonb('Создание собственных моделей'::text),
    to_jsonb('Интеграция ИИ в веб и мобильные приложения'::text)
  ]::jsonb[],
  'https://images.pexels.com/photos/8386423/pexels-photo-8386423.jpeg'
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE title = 'Вайб-кодинг: Машинное обучение'
);

-- Add test admin user if doesn't exist
INSERT INTO admin_users (email, password_hash)
SELECT 
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NRt0eNwNm' -- Test password: 'admin123'
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'admin@example.com'
);

-- Get the first course ID for test data
DO $$ 
DECLARE
  first_course_id uuid;
  admin_user_id uuid;
BEGIN
  SELECT id INTO first_course_id FROM courses LIMIT 1;
  SELECT id INTO admin_user_id FROM admin_users WHERE email = 'admin@example.com';

  -- Add test registration if none exist
  IF NOT EXISTS (SELECT 1 FROM registrations) THEN
    INSERT INTO registrations (name, phone, telegram, course_id)
    VALUES (
      'Иван Тестов',
      '+375291234567',
      '@test_user',
      first_course_id
    );
  END IF;

  -- Add test activity logs if none exist
  IF NOT EXISTS (SELECT 1 FROM activity_logs) THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES 
      (admin_user_id, 'login', jsonb_build_object('ip', '127.0.0.1')),
      (admin_user_id, 'view_registrations', jsonb_build_object('count', 1)),
      (admin_user_id, 'add_course', jsonb_build_object('course_id', first_course_id));
  END IF;
END $$;
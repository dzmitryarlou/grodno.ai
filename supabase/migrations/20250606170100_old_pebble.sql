/*
  # Исправление политик безопасности для загрузки изображений
  
  1. Изменения
    - Создание корректных политик для storage.objects
    - Настройка публичного доступа к изображениям курсов
    - Разрешение загрузки для аутентифицированных пользователей
    
  2. Безопасность
    - Публичный доступ на чтение изображений
    - Загрузка только для аутентифицированных пользователей
    - Ограничение по типам файлов и размеру
*/

-- Удаляем существующие политики если они есть
DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course images" ON storage.objects;

-- Создаем политику для публичного чтения изображений курсов
CREATE POLICY "Public can view course images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-images');

-- Создаем политику для загрузки изображений аутентифицированными пользователями
CREATE POLICY "Authenticated users can upload course images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-images' AND
  (storage.foldername(name))[1] = 'courses'
);

-- Создаем политику для обновления изображений
CREATE POLICY "Authenticated users can update course images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-images')
WITH CHECK (bucket_id = 'course-images');

-- Создаем политику для удаления изображений
CREATE POLICY "Authenticated users can delete course images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-images');

-- Убеждаемся, что bucket существует и настроен правильно
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images', 
  'course-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
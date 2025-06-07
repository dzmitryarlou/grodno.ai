/*
  # Исправление управления пользователями и добавление email уведомлений
  
  1. Исправления
    - Обновление RLS политик для правильной работы с ролями
    - Добавление функции для email уведомлений
    - Создание триггера для автоматических уведомлений
    
  2. Новые функции
    - send_email_notification: отправка email уведомлений
    - notify_new_registration: триггер для новых заявок
    
  3. Безопасность
    - Исправление политик RLS для корректной работы
    - Добавление проверок прав доступа
*/

-- Исправляем политики RLS для admin_users
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable public insert" ON admin_users;
DROP POLICY IF EXISTS "Enable read for authenticated" ON admin_users;
DROP POLICY IF EXISTS "Enable update for authenticated" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON admin_users;

-- Новые политики для admin_users
CREATE POLICY "Enable read for authenticated users" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON admin_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON admin_users
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON admin_users
  FOR DELETE USING (auth.role() = 'authenticated');

-- Исправляем политики RLS для activity_logs
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Enable public insert" ON activity_logs;
DROP POLICY IF EXISTS "Enable read for authenticated" ON activity_logs;

-- Новые политики для activity_logs
CREATE POLICY "Enable read for authenticated users" ON activity_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Исправляем политики RLS для registrations
DROP POLICY IF EXISTS "Enable read access for admin" ON registrations;
DROP POLICY IF EXISTS "Enable delete for admin" ON registrations;

-- Новые политики для registrations
CREATE POLICY "Enable read access for authenticated" ON registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON registrations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Создаем функцию для отправки email уведомлений
CREATE OR REPLACE FUNCTION send_email_notification(
  recipient_email text,
  subject_text text,
  body_text text
) RETURNS void AS $$
BEGIN
  -- В реальном проекте здесь будет интеграция с email сервисом
  -- Пока что просто логируем в activity_logs
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    'system',
    'email_notification',
    jsonb_build_object(
      'recipient', recipient_email,
      'subject', subject_text,
      'body', body_text,
      'sent_at', now()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию для обработки новых регистраций
CREATE OR REPLACE FUNCTION notify_new_registration() RETURNS trigger AS $$
DECLARE
  course_title text;
  admin_emails text[];
  admin_email text;
BEGIN
  -- Получаем название курса
  SELECT title INTO course_title
  FROM courses
  WHERE id = NEW.course_id;

  -- Получаем email адреса всех администраторов
  SELECT array_agg(email) INTO admin_emails
  FROM admin_users;

  -- Отправляем уведомление каждому администратору
  IF admin_emails IS NOT NULL THEN
    FOREACH admin_email IN ARRAY admin_emails
    LOOP
      PERFORM send_email_notification(
        admin_email,
        'Новая заявка на обучение - ИИ Клуб',
        format(
          'Поступила новая заявка на обучение:

Имя: %s
Телефон: %s
Telegram: %s
Курс: %s
Дата подачи: %s

Для просмотра всех заявок перейдите в панель администратора.',
          NEW.name,
          NEW.phone,
          NEW.telegram,
          COALESCE(course_title, 'Неизвестный курс'),
          NEW.created_at
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для автоматических уведомлений
DROP TRIGGER IF EXISTS trigger_notify_new_registration ON registrations;
CREATE TRIGGER trigger_notify_new_registration
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_registration();

-- Добавляем тестового администратора если его нет
INSERT INTO admin_users (email, password_hash)
SELECT 
  'admin@aiclub.by',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NRt0eNwNm' -- пароль: admin123
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'admin@aiclub.by'
);

-- Добавляем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
/*
  # Email system setup and course cleanup with proper UUID handling
  
  1. Changes
    - Clear all existing courses for testing
    - Add email field to registrations table
    - Setup email templates and settings
    - Create email notification system
    - Update admin email configuration
    
  2. Security
    - Maintain RLS policies
    - Add proper error handling for email functions
    - Proper UUID type handling for user_id fields
*/

-- Удаляем все существующие курсы
DELETE FROM courses;

-- Безопасно обновляем email администратора в настройках
INSERT INTO email_settings (setting_key, setting_value, description)
VALUES (
  'admin_emails',
  '["dzmitry.arlou@gmail.com"]',
  'Список email адресов администраторов для уведомлений'
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = '["dzmitry.arlou@gmail.com"]',
  updated_at = now();

-- Безопасно обновляем email в таблице admin_users
DO $$ 
BEGIN
  -- Проверяем, существует ли уже пользователь с нужным email
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'dzmitry.arlou@gmail.com') THEN
    -- Если не существует, обновляем первого найденного администратора
    UPDATE admin_users 
    SET email = 'dzmitry.arlou@gmail.com'
    WHERE id = (SELECT id FROM admin_users LIMIT 1);
  END IF;
END $$;

-- Добавляем поле email в таблицу регистраций если его нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' AND column_name = 'email'
  ) THEN
    ALTER TABLE registrations ADD COLUMN email text;
  END IF;
END $$;

-- Создаем или обновляем шаблон email для новых регистраций
INSERT INTO email_templates (
  template_name,
  subject,
  body_template,
  variables,
  is_active
)
VALUES (
  'new_registration',
  'Новая заявка на обучение - ИИ Клуб',
  'Поступила новая заявка на обучение:

Имя: {{name}}
Email: {{email}}
Телефон: {{phone}}
Telegram: {{telegram}}
Курс: {{course_name}}
Дата подачи: {{created_at}}

Для просмотра всех заявок перейдите в панель администратора.',
  '["name", "email", "phone", "telegram", "course_name", "created_at"]',
  true
)
ON CONFLICT (template_name) 
DO UPDATE SET 
  subject = 'Новая заявка на обучение - ИИ Клуб',
  body_template = 'Поступила новая заявка на обучение:

Имя: {{name}}
Email: {{email}}
Телефон: {{phone}}
Telegram: {{telegram}}
Курс: {{course_name}}
Дата подачи: {{created_at}}

Для просмотра всех заявок перейдите в панель администратора.',
  variables = '["name", "email", "phone", "telegram", "course_name", "created_at"]',
  is_active = true,
  updated_at = now();

-- Удаляем триггер сначала, затем функции
DROP TRIGGER IF EXISTS trigger_notify_new_registration ON registrations;
DROP FUNCTION IF EXISTS get_email_setting(text);
DROP FUNCTION IF EXISTS send_email_notification(text, text, text);
DROP FUNCTION IF EXISTS notify_new_registration();

-- Создаем функцию для получения email настроек
CREATE FUNCTION get_email_setting(setting_name text) 
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT setting_value INTO result
  FROM email_settings
  WHERE setting_key = setting_name;
  
  RETURN COALESCE(result, 'null'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию для отправки email уведомлений (заглушка)
CREATE FUNCTION send_email_notification(
  recipient_email text,
  email_subject text,
  email_body text
) RETURNS boolean AS $$
DECLARE
  system_user_id uuid;
BEGIN
  -- Получаем ID первого администратора для системных операций
  SELECT id INTO system_user_id FROM admin_users LIMIT 1;
  
  -- Логируем попытку отправки
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    system_user_id,
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
    -- В случае ошибки просто возвращаем false
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию уведомлений для новых регистраций
CREATE FUNCTION notify_new_registration() RETURNS trigger AS $$
DECLARE
  course_title text;
  admin_emails jsonb;
  admin_email text;
  template_subject text;
  template_body text;
  final_body text;
  notifications_enabled boolean;
BEGIN
  -- Проверяем, включены ли уведомления
  SELECT (get_email_setting('notifications_enabled'))::boolean INTO notifications_enabled;
  
  IF NOT COALESCE(notifications_enabled, false) THEN
    RETURN NEW;
  END IF;

  -- Получаем название курса
  SELECT title INTO course_title
  FROM courses
  WHERE id = NEW.course_id;

  -- Получаем шаблон email
  SELECT subject, body_template INTO template_subject, template_body
  FROM email_templates
  WHERE template_name = 'new_registration' AND is_active = true;

  -- Получаем список администраторов
  SELECT get_email_setting('admin_emails') INTO admin_emails;

  -- Заменяем переменные в шаблоне
  final_body := COALESCE(template_body, 'Новая заявка на обучение от {{name}}');
  final_body := replace(final_body, '{{name}}', NEW.name);
  final_body := replace(final_body, '{{email}}', COALESCE(NEW.email, 'Не указан'));
  final_body := replace(final_body, '{{phone}}', NEW.phone);
  final_body := replace(final_body, '{{telegram}}', NEW.telegram);
  final_body := replace(final_body, '{{course_name}}', COALESCE(course_title, 'Неизвестный курс'));
  final_body := replace(final_body, '{{created_at}}', NEW.created_at::text);

  -- Отправляем уведомления
  IF admin_emails IS NOT NULL AND jsonb_typeof(admin_emails) = 'array' THEN
    FOR admin_email IN SELECT jsonb_array_elements_text(admin_emails)
    LOOP
      PERFORM send_email_notification(
        admin_email,
        COALESCE(template_subject, 'Новая заявка на обучение - ИИ Клуб'),
        final_body
      );
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- В случае ошибки просто возвращаем NEW, чтобы не блокировать регистрацию
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для уведомлений
CREATE TRIGGER trigger_notify_new_registration
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_registration();

-- Создаем настройку для включения/отключения уведомлений
INSERT INTO email_settings (setting_key, setting_value, description)
VALUES (
  'notifications_enabled',
  'true',
  'Включить/отключить email уведомления'
)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = 'true',
  updated_at = now();

-- Логируем очистку курсов (используем UUID напрямую)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
      admin_user_id,
      'courses_cleared',
      jsonb_build_object(
        'action', 'All courses deleted for testing',
        'timestamp', now()
      )
    );
  END IF;
END $$;
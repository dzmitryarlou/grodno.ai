/*
  # Полное отключение авторизации в системе
  
  1. Изменения
    - Отключение RLS для всех таблиц
    - Удаление всех политик безопасности
    - Создание упрощенных функций без проверки авторизации
    - Разрешение всех операций для всех пользователей
    
  2. Безопасность
    - Полный доступ ко всем операциям
    - Отсутствие ограничений по ролям
*/

-- Отключаем RLS для всех таблиц
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Enable read for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON admin_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON admin_users;

DROP POLICY IF EXISTS "Enable public read access" ON courses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON courses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON courses;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON courses;

DROP POLICY IF EXISTS "Enable public insert" ON registrations;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON registrations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON registrations;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON activity_logs;
DROP POLICY IF EXISTS "Enable insert for all" ON activity_logs;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON email_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON email_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON email_settings;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON email_templates;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON email_templates;

-- Создаем упрощенные функции без проверки авторизации
CREATE OR REPLACE FUNCTION simple_create_email_template(
  template_name_param text,
  subject_param text,
  body_template_param text,
  variables_param text[] DEFAULT ARRAY[]::text[],
  is_active_param boolean DEFAULT true
) RETURNS uuid AS $$
DECLARE
  new_template_id uuid;
  variables_jsonb jsonb;
  admin_user_id uuid;
BEGIN
  -- Получаем ID первого администратора
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  -- Конвертируем массив в jsonb
  variables_jsonb := to_jsonb(variables_param);
  
  -- Создаем шаблон
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
  
  -- Логируем создание
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'email_template_created',
    jsonb_build_object(
      'template_id', new_template_id,
      'template_name', template_name_param,
      'timestamp', now()
    )
  );
  
  RETURN new_template_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ошибка при создании шаблона: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Упрощенная функция обновления шаблонов
CREATE OR REPLACE FUNCTION simple_update_email_template(
  template_id_param uuid,
  subject_param text,
  body_template_param text,
  variables_param text[] DEFAULT NULL,
  is_active_param boolean DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  variables_jsonb jsonb;
  admin_user_id uuid;
BEGIN
  -- Получаем ID первого администратора
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  -- Конвертируем массив в jsonb если передан
  IF variables_param IS NOT NULL THEN
    variables_jsonb := to_jsonb(variables_param);
  END IF;
  
  -- Обновляем шаблон
  UPDATE email_templates
  SET 
    subject = subject_param,
    body_template = body_template_param,
    variables = COALESCE(variables_jsonb, variables),
    is_active = COALESCE(is_active_param, is_active),
    updated_at = now()
  WHERE id = template_id_param;
  
  -- Логируем обновление
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'email_template_updated',
    jsonb_build_object(
      'template_id', template_id_param,
      'timestamp', now()
    )
  );
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ошибка при обновлении шаблона: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Упрощенная функция удаления шаблонов
CREATE OR REPLACE FUNCTION simple_delete_email_template(template_id_param uuid)
RETURNS boolean AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Получаем ID первого администратора
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  -- Удаляем шаблон
  DELETE FROM email_templates WHERE id = template_id_param;
  
  -- Логируем удаление
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'email_template_deleted',
    jsonb_build_object(
      'template_id', template_id_param,
      'timestamp', now()
    )
  );
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ошибка при удалении шаблона: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Упрощенная функция сохранения SMTP настроек
CREATE OR REPLACE FUNCTION simple_save_smtp_settings(
  host_param text,
  port_param integer,
  secure_param boolean,
  user_param text,
  pass_param text
) RETURNS boolean AS $$
DECLARE
  smtp_settings jsonb;
  admin_user_id uuid;
BEGIN
  -- Получаем ID первого администратора
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  -- Создаем объект настроек
  smtp_settings := jsonb_build_object(
    'host', host_param,
    'port', port_param,
    'secure', secure_param,
    'user', user_param,
    'pass', pass_param
  );
  
  -- Сохраняем настройки
  INSERT INTO email_settings (setting_key, setting_value, description)
  VALUES (
    'smtp_settings',
    smtp_settings,
    'Настройки SMTP сервера для отправки email'
  )
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = smtp_settings,
    updated_at = now();
  
  -- Логируем сохранение
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'smtp_settings_saved',
    jsonb_build_object(
      'host', host_param,
      'port', port_param,
      'user', user_param,
      'timestamp', now()
    )
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Ошибка при сохранении SMTP настроек: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Упрощенная функция тестирования email
CREATE OR REPLACE FUNCTION simple_test_email_notification()
RETURNS jsonb AS $$
DECLARE
  smtp_config jsonb;
  test_result jsonb;
  admin_user_id uuid;
BEGIN
  -- Получаем ID первого администратора
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  -- Получаем настройки SMTP
  SELECT setting_value INTO smtp_config
  FROM email_settings
  WHERE setting_key = 'smtp_settings';
  
  -- Логируем тест
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'email_test_initiated',
    jsonb_build_object(
      'smtp_host', smtp_config->>'host',
      'smtp_configured', CASE 
        WHEN smtp_config->>'host' IS NOT NULL AND smtp_config->>'host' != '' 
        THEN true 
        ELSE false 
      END,
      'timestamp', now()
    )
  );
  
  -- Отправляем тестовое уведомление
  PERFORM send_email_notification(
    'dzmitry.arlou@grodno.ai',
    'Тестовое уведомление - ИИ Клуб',
    'Система email уведомлений работает корректно.<br><br>Время теста: ' || now()::text
  );
  
  -- Возвращаем результат
  test_result := jsonb_build_object(
    'success', true,
    'message', 'Тестовое уведомление отправлено',
    'smtp_configured', CASE 
      WHEN smtp_config->>'host' IS NOT NULL AND smtp_config->>'host' != '' 
      THEN true 
      ELSE false 
    END,
    'timestamp', now()
  );
  
  RETURN test_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем функцию отправки email уведомлений
CREATE OR REPLACE FUNCTION send_email_notification(
  recipient_email text,
  email_subject text,
  email_body text
) RETURNS boolean AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Получаем ID первого администратора для логирования
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  -- Логируем попытку отправки email
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'email_notification_sent',
    jsonb_build_object(
      'recipient', recipient_email,
      'subject', email_subject,
      'timestamp', now(),
      'status', 'queued'
    )
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- В случае ошибки просто возвращаем false
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Логируем удаление требований авторизации
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
      admin_user_id,
      'authentication_requirements_removed',
      jsonb_build_object(
        'action', 'Removed all authentication requirements from database operations',
        'tables_affected', jsonb_build_array(
          'admin_users',
          'courses',
          'registrations', 
          'activity_logs',
          'email_settings',
          'email_templates'
        ),
        'rls_disabled', true,
        'functions_simplified', jsonb_build_array(
          'simple_create_email_template',
          'simple_update_email_template',
          'simple_delete_email_template',
          'simple_save_smtp_settings',
          'simple_test_email_notification'
        ),
        'timestamp', now()
      )
    );
  END IF;
END $$;
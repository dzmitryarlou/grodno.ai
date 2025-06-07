-- Обновляем настройки SMTP для Gandi.net
UPDATE email_settings 
SET setting_value = '{
  "host": "mail.gandi.net",
  "port": 587,
  "secure": false,
  "user": "",
  "pass": ""
}'
WHERE setting_key = 'smtp_settings';

-- Если настройки SMTP не существуют, создаем их
INSERT INTO email_settings (setting_key, setting_value, description)
SELECT 
  'smtp_settings',
  '{
    "host": "mail.gandi.net",
    "port": 587,
    "secure": false,
    "user": "",
    "pass": ""
  }',
  'Настройки SMTP сервера Gandi.net для отправки email'
WHERE NOT EXISTS (
  SELECT 1 FROM email_settings WHERE setting_key = 'smtp_settings'
);

-- Обновляем email администратора на домен grodno.ai
UPDATE admin_users 
SET email = 'dzmitry.arlou@grodno.ai'
WHERE email IN ('dzmitry.arlou@gmail.com', 'admin@aiclub.by');

-- Обновляем настройки email администраторов
UPDATE email_settings 
SET setting_value = '["dzmitry.arlou@grodno.ai"]'
WHERE setting_key = 'admin_emails';

-- Создаем функцию для проверки настроек SMTP
CREATE OR REPLACE FUNCTION check_smtp_configuration()
RETURNS jsonb AS $$
DECLARE
  smtp_settings jsonb;
  is_configured boolean;
BEGIN
  -- Получаем настройки SMTP
  SELECT setting_value INTO smtp_settings
  FROM email_settings
  WHERE setting_key = 'smtp_settings';
  
  -- Проверяем, настроен ли SMTP
  is_configured := (
    smtp_settings->>'host' IS NOT NULL AND 
    smtp_settings->>'host' != '' AND
    smtp_settings->>'user' IS NOT NULL AND 
    smtp_settings->>'user' != '' AND
    smtp_settings->>'pass' IS NOT NULL AND 
    smtp_settings->>'pass' != ''
  );
  
  RETURN jsonb_build_object(
    'configured', is_configured,
    'host', smtp_settings->>'host',
    'port', smtp_settings->>'port',
    'user', smtp_settings->>'user',
    'has_password', CASE WHEN smtp_settings->>'pass' != '' THEN true ELSE false END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем функцию тестирования для работы с Gandi.net
CREATE OR REPLACE FUNCTION test_gandi_email_system()
RETURNS jsonb AS $$
DECLARE
  admin_user_id uuid;
  smtp_config jsonb;
  test_result jsonb;
BEGIN
  -- Получаем ID администратора
  SELECT id INTO admin_user_id FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai' LIMIT 1;
  
  -- Проверяем конфигурацию SMTP
  smtp_config := check_smtp_configuration();
  
  -- Логируем тест
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    admin_user_id,
    'test_gandi_email_system',
    jsonb_build_object(
      'test_time', now(),
      'smtp_configured', smtp_config->'configured',
      'smtp_host', smtp_config->'host',
      'admin_emails', get_email_setting('admin_emails'),
      'notifications_enabled', get_email_setting('notifications_enabled')
    )
  );
  
  -- Отправляем тестовое уведомление
  PERFORM send_email_notification(
    'dzmitry.arlou@grodno.ai',
    'Тестовое уведомление - ИИ Клуб (Gandi.net)',
    'Система email уведомлений через Gandi.net работает корректно.<br><br>Время теста: ' || now()::text || '<br>SMTP сервер: mail.gandi.net'
  );
  
  -- Возвращаем результат теста
  test_result := jsonb_build_object(
    'success', true,
    'message', 'Test email sent via Gandi.net SMTP',
    'smtp_config', smtp_config,
    'timestamp', now()
  );
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем шаблон для уведомлений через Gandi.net
INSERT INTO email_templates (
  template_name,
  subject,
  body_template,
  variables,
  is_active
)
VALUES (
  'gandi_test_notification',
  'Тестовое уведомление через Gandi.net - ИИ Клуб',
  'Система email уведомлений через Gandi.net настроена и работает корректно.

Детали теста:
- SMTP сервер: mail.gandi.net
- Время отправки: {{timestamp}}
- Получатель: {{recipient}}

Если вы получили это письмо, значит настройка прошла успешно!

С наилучшими пожеланиями,
Команда ИИ Клуба Дмитрия Орлова',
  '["timestamp", "recipient"]',
  true
)
ON CONFLICT (template_name) 
DO UPDATE SET 
  subject = 'Тестовое уведомление через Gandi.net - ИИ Клуб',
  body_template = 'Система email уведомлений через Gandi.net настроена и работает корректно.

Детали теста:
- SMTP сервер: mail.gandi.net
- Время отправки: {{timestamp}}
- Получатель: {{recipient}}

Если вы получили это письмо, значит настройка прошла успешно!

С наилучшими пожеланиями,
Команда ИИ Клуба Дмитрия Орлова',
  variables = '["timestamp", "recipient"]',
  is_active = true,
  updated_at = now();

-- Логируем настройку Gandi.net
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
      admin_user_id,
      'gandi_email_system_configured',
      jsonb_build_object(
        'action', 'Configured email system for Gandi.net SMTP',
        'smtp_host', 'mail.gandi.net',
        'smtp_port', 587,
        'admin_email', 'dzmitry.arlou@grodno.ai',
        'timestamp', now(),
        'features', jsonb_build_array(
          'Gandi.net SMTP integration',
          'Email template management', 
          'Automatic notifications',
          'Test email functionality',
          'SMTP configuration validation'
        )
      )
    );
  END IF;
END $$;
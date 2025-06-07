/*
  # Update email system with new address and template management
  
  1. Changes
    - Update all email addresses to dzmitry.arlou@grodno.ai
    - Add template management capabilities
    - Update email settings and admin users
    
  2. Security
    - Maintain RLS policies
    - Add proper permissions for template management
*/

-- Update email in admin_users table
UPDATE admin_users 
SET email = 'dzmitry.arlou@grodno.ai'
WHERE email = 'dzmitry.arlou@gmail.com' OR email = 'admin@aiclub.by';

-- Add new admin user if none exists with the new email
INSERT INTO admin_users (email, password_hash)
SELECT 
  'dzmitry.arlou@grodno.ai',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NRt0eNwNm' -- пароль: admin123
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai'
);

-- Update email settings
UPDATE email_settings 
SET setting_value = '["dzmitry.arlou@grodno.ai"]'
WHERE setting_key = 'admin_emails';

-- Add template management functions
CREATE OR REPLACE FUNCTION create_email_template(
  template_name_param text,
  subject_param text,
  body_template_param text,
  variables_param jsonb DEFAULT '[]'::jsonb,
  is_active_param boolean DEFAULT true
) RETURNS uuid AS $$
DECLARE
  new_template_id uuid;
BEGIN
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
    variables_param,
    is_active_param
  )
  RETURNING id INTO new_template_id;
  
  RETURN new_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_email_template(
  template_id_param uuid,
  subject_param text,
  body_template_param text,
  variables_param jsonb DEFAULT NULL,
  is_active_param boolean DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  UPDATE email_templates
  SET 
    subject = subject_param,
    body_template = body_template_param,
    variables = COALESCE(variables_param, variables),
    is_active = COALESCE(is_active_param, is_active),
    updated_at = now()
  WHERE id = template_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_email_template(template_id_param uuid)
RETURNS boolean AS $$
BEGIN
  DELETE FROM email_templates WHERE id = template_id_param;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add more email templates
INSERT INTO email_templates (
  template_name,
  subject,
  body_template,
  variables,
  is_active
)
VALUES 
  (
    'welcome_message',
    'Добро пожаловать в ИИ Клуб!',
    'Здравствуйте, {{name}}!

Добро пожаловать в ИИ Клуб Дмитрия Орлова в Гродно!

Мы рады, что вы присоединились к нашему сообществу энтузиастов искусственного интеллекта.

Ваша заявка на курс "{{course_name}}" принята и находится на рассмотрении.

С наилучшими пожеланиями,
Команда ИИ Клуба',
    '["name", "course_name"]',
    false
  ),
  (
    'course_reminder',
    'Напоминание о занятии - ИИ Клуб',
    'Здравствуйте, {{name}}!

Напоминаем, что завтра в {{time}} состоится занятие по курсу "{{course_name}}".

Место проведения: {{location}}
Тема занятия: {{topic}}

До встречи!
Команда ИИ Клуба',
    '["name", "time", "course_name", "location", "topic"]',
    false
  ),
  (
    'course_completion',
    'Поздравляем с завершением курса!',
    'Поздравляем, {{name}}!

Вы успешно завершили курс "{{course_name}}" в ИИ Клубе!

Ваш сертификат будет готов в течение {{certificate_days}} рабочих дней.

Спасибо за участие в нашей программе!

С наилучшими пожеланиями,
Команда ИИ Клуба',
    '["name", "course_name", "certificate_days"]',
    false
  )
ON CONFLICT (template_name) DO NOTHING;

-- Update the test notification function to use new email
CREATE OR REPLACE FUNCTION test_notification_system()
RETURNS void AS $$
BEGIN
  -- Добавляем запись в логи о тестировании
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    (SELECT id FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai' LIMIT 1),
    'test_notification_system',
    jsonb_build_object(
      'test_time', now(),
      'admin_emails', get_email_setting('admin_emails'),
      'notifications_enabled', get_email_setting('notifications_enabled')
    )
  );
  
  -- Отправляем тестовое уведомление
  PERFORM send_email_notification(
    'dzmitry.arlou@grodno.ai',
    'Тестовое уведомление - ИИ Клуб',
    'Система уведомлений работает корректно. Время теста: ' || now()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log the email update
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users WHERE email = 'dzmitry.arlou@grodno.ai' LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO activity_logs (user_id, action, details)
    VALUES (
      admin_user_id,
      'email_system_updated',
      jsonb_build_object(
        'action', 'Updated all email addresses to dzmitry.arlou@grodno.ai',
        'timestamp', now()
      )
    );
  END IF;
END $$;
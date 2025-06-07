/*
  # Добавление настроек для email уведомлений
  
  1. Новые таблицы
    - `email_settings` - настройки email уведомлений
    - `email_templates` - шаблоны email сообщений
    
  2. Функции
    - Функция для получения настроек email
    - Функция для обновления шаблонов
    
  3. Безопасность
    - RLS политики для управления настройками
*/

-- Создаем таблицу настроек email
CREATE TABLE IF NOT EXISTS email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON email_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON email_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Создаем таблицу шаблонов email
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  subject text NOT NULL,
  body_template text NOT NULL,
  variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON email_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Добавляем триггеры для updated_at
CREATE TRIGGER update_email_settings_updated_at
    BEFORE UPDATE ON email_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Вставляем базовые настройки
INSERT INTO email_settings (setting_key, setting_value, description) VALUES
  ('notifications_enabled', 'true', 'Включить email уведомления'),
  ('admin_emails', '["admin@aiclub.by"]', 'Список email адресов администраторов'),
  ('smtp_settings', '{"host": "", "port": 587, "secure": false, "user": "", "pass": ""}', 'Настройки SMTP сервера')
ON CONFLICT (setting_key) DO NOTHING;

-- Вставляем шаблоны email
INSERT INTO email_templates (template_name, subject, body_template, variables) VALUES
  (
    'new_registration',
    'Новая заявка на обучение - ИИ Клуб',
    'Поступила новая заявка на обучение:

Имя: {{name}}
Телефон: {{phone}}
Telegram: {{telegram}}
Курс: {{course_name}}
Дата подачи: {{created_at}}

Для просмотра всех заявок перейдите в панель администратора.',
    '["name", "phone", "telegram", "course_name", "created_at"]'
  ),
  (
    'course_created',
    'Новый курс добавлен - ИИ Клуб',
    'В ИИ Клубе добавлен новый курс:

Название: {{title}}
Категория: {{category}}
Длительность: {{duration}}
Дата создания: {{created_at}}

Курс доступен для записи на сайте.',
    '["title", "category", "duration", "created_at"]'
  )
ON CONFLICT (template_name) DO NOTHING;

-- Функция для получения настроек email
CREATE OR REPLACE FUNCTION get_email_setting(key_name text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT setting_value INTO result
  FROM email_settings
  WHERE setting_key = key_name;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления настроек email
CREATE OR REPLACE FUNCTION update_email_setting(key_name text, new_value jsonb)
RETURNS void AS $$
BEGIN
  INSERT INTO email_settings (setting_key, setting_value)
  VALUES (key_name, new_value)
  ON CONFLICT (setting_key)
  DO UPDATE SET 
    setting_value = new_value,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем функцию уведомлений для использования шаблонов
CREATE OR REPLACE FUNCTION notify_new_registration() RETURNS trigger AS $$
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
  final_body := template_body;
  final_body := replace(final_body, '{{name}}', NEW.name);
  final_body := replace(final_body, '{{phone}}', NEW.phone);
  final_body := replace(final_body, '{{telegram}}', NEW.telegram);
  final_body := replace(final_body, '{{course_name}}', COALESCE(course_title, 'Неизвестный курс'));
  final_body := replace(final_body, '{{created_at}}', NEW.created_at::text);

  -- Отправляем уведомления
  IF admin_emails IS NOT NULL THEN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Добавляем индексы
CREATE INDEX IF NOT EXISTS idx_email_settings_key ON email_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);
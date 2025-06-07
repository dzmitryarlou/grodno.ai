/*
  # Исправление настроек email и обновление контактной информации
  
  1. Изменения
    - Обновляем email администратора на dzmitry.arlou@gmail.com
    - Исправляем настройки уведомлений
    - Добавляем функцию для проверки системы
*/

-- Обновляем email администратора
UPDATE email_settings 
SET setting_value = '["dzmitry.arlou@gmail.com"]'
WHERE setting_key = 'admin_emails';

-- Обновляем email в таблице admin_users
UPDATE admin_users 
SET email = 'dzmitry.arlou@gmail.com'
WHERE email = 'admin@aiclub.by';

-- Добавляем нового администратора если его нет
INSERT INTO admin_users (email, password_hash)
SELECT 
  'dzmitry.arlou@gmail.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NRt0eNwNm' -- пароль: admin123
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'dzmitry.arlou@gmail.com'
);

-- Функция для тестирования системы уведомлений
CREATE OR REPLACE FUNCTION test_notification_system()
RETURNS void AS $$
BEGIN
  -- Добавляем запись в логи о тестировании
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    'system',
    'test_notification_system',
    jsonb_build_object(
      'test_time', now(),
      'admin_emails', get_email_setting('admin_emails'),
      'notifications_enabled', get_email_setting('notifications_enabled')
    )
  );
  
  -- Отправляем тестовое уведомление
  PERFORM send_email_notification(
    'dzmitry.arlou@gmail.com',
    'Тестовое уведомление - ИИ Клуб',
    'Система уведомлений работает корректно. Время теста: ' || now()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения статистики системы
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_registrations', (SELECT COUNT(*) FROM registrations),
    'total_courses', (SELECT COUNT(*) FROM courses),
    'total_admins', (SELECT COUNT(*) FROM admin_users),
    'recent_activity', (SELECT COUNT(*) FROM activity_logs WHERE created_at > now() - interval '24 hours'),
    'courses_by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*) as count
        FROM courses
        GROUP BY category
      ) t
    ),
    'last_registration', (
      SELECT created_at
      FROM registrations
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
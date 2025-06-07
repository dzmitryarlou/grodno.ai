/*
  # Team Management System

  1. New Tables
    - `team_members`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `description` (text)
      - `image_url` (text)
      - `order_position` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Disable RLS on `team_members` table for maximum access
    - Add indexes for performance
*/

-- Создаем таблицу для членов команды
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  description text NOT NULL,
  image_url text,
  order_position integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Отключаем RLS для максимального доступа
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Добавляем индексы
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members(order_position);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

-- Создаем триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_updated_at();

-- Вставляем начальные данные команды
INSERT INTO team_members (name, role, description, image_url, order_position) VALUES
(
  'Дмитрий Орлов',
  'Основатель и руководитель',
  'Эксперт в области ИИ с более чем 10-летним опытом работы в технологических компаниях. Основал клуб с целью сделать знания об ИИ доступными для каждого.',
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  1
),
(
  'Анна Козлова',
  'Руководитель образовательных программ',
  'Специалист по машинному обучению и нейронным сетям. Отвечает за разработку и реализацию обучающих курсов в клубе.',
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  2
),
(
  'Михаил Соколов',
  'Технический директор',
  'Опытный разработчик и архитектор ИИ-систем. Помогает участникам клуба в реализации практических проектов и внедрении ИИ-решений.',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  3
)
ON CONFLICT DO NOTHING;

-- Функция для управления командой
CREATE OR REPLACE FUNCTION manage_team_member(
  action_type text, -- 'create', 'update', 'delete'
  member_id_param uuid DEFAULT NULL,
  name_param text DEFAULT NULL,
  role_param text DEFAULT NULL,
  description_param text DEFAULT NULL,
  image_url_param text DEFAULT NULL,
  order_position_param integer DEFAULT NULL,
  is_active_param boolean DEFAULT true
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
  new_member_id uuid;
  admin_user_id uuid;
BEGIN
  SELECT id INTO admin_user_id FROM admin_users LIMIT 1;
  
  CASE action_type
    WHEN 'create' THEN
      INSERT INTO team_members (
        name, role, description, image_url, order_position, is_active
      )
      VALUES (
        name_param, role_param, description_param, image_url_param, 
        COALESCE(order_position_param, 1), is_active_param
      )
      RETURNING id INTO new_member_id;
      
      result := jsonb_build_object('success', true, 'member_id', new_member_id);
      
    WHEN 'update' THEN
      UPDATE team_members
      SET 
        name = COALESCE(name_param, name),
        role = COALESCE(role_param, role),
        description = COALESCE(description_param, description),
        image_url = COALESCE(image_url_param, image_url),
        order_position = COALESCE(order_position_param, order_position),
        is_active = COALESCE(is_active_param, is_active),
        updated_at = now()
      WHERE id = member_id_param;
      
      result := jsonb_build_object('success', FOUND);
      
    WHEN 'delete' THEN
      DELETE FROM team_members WHERE id = member_id_param;
      result := jsonb_build_object('success', FOUND);
      
    ELSE
      result := jsonb_build_object('success', false, 'error', 'Invalid action type');
  END CASE;
  
  -- Логируем действие
  INSERT INTO activity_logs (user_id, action, details)
  VALUES (
    COALESCE(admin_user_id::text, 'system'),
    'team_member_' || action_type,
    jsonb_build_object(
      'member_id', COALESCE(new_member_id, member_id_param),
      'name', name_param,
      'action', action_type,
      'timestamp', now()
    )
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Упрощенные функции для фронтенда
CREATE OR REPLACE FUNCTION simple_update_team_member(
  member_id_param uuid,
  name_param text,
  role_param text,
  description_param text,
  image_url_param text DEFAULT NULL,
  order_position_param integer DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  result jsonb;
BEGIN
  result := manage_team_member('update', member_id_param, name_param, role_param, description_param, image_url_param, order_position_param);
  RETURN (result->>'success')::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Логируем создание системы управления командой
INSERT INTO activity_logs (user_id, action, details)
VALUES (
  'system',
  'team_management_system_created',
  jsonb_build_object(
    'action', 'Team management system created',
    'features', jsonb_build_array(
      'Team member CRUD operations',
      'Image upload support',
      'Order management',
      'Activity logging',
      'No authentication requirements'
    ),
    'timestamp', now()
  )
);
import React, { useState, useEffect } from 'react';
import { X, Save, User, Edit3, Camera, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ImageUpload from './ImageUpload';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image_url: string;
  order_position: number;
  is_active: boolean;
}

const TeamManagementModal: React.FC<TeamManagementModalProps> = ({ isOpen, onClose }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }
      
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching team members:', error);
      setError(`Ошибка загрузки команды: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamMember = async (memberId: string, updates: Partial<TeamMember>) => {
    setIsSaving(true);
    setError('');
    
    try {
      // Используем прямое обновление через Supabase
      const { data, error } = await supabase
        .from('team_members')
        .update({
          name: updates.name,
          role: updates.role,
          description: updates.description,
          image_url: updates.image_url,
          order_position: updates.order_position,
          is_active: updates.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('Error updating team member:', error);
        throw error;
      }

      // Логируем действие
      await supabase
        .from('activity_logs')
        .insert([{
          user_id: 'admin',
          action: 'team_member_updated',
          details: {
            member_id: memberId,
            name: updates.name,
            timestamp: new Date().toISOString()
          }
        }]);

      await fetchTeamMembers();
      setEditingMember(null);
    } catch (error: any) {
      console.error('Error updating team member:', error);
      setError(`Ошибка при обновлении: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMemberUpdate = (memberId: string, field: keyof TeamMember, value: string | number | boolean) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, [field]: value }
        : member
    ));
  };

  const handleImageUploaded = (memberId: string, url: string) => {
    handleMemberUpdate(memberId, 'image_url', url);
  };

  const handleImageDeleted = (memberId: string) => {
    handleMemberUpdate(memberId, 'image_url', '');
  };

  const saveMember = async (member: TeamMember) => {
    await updateTeamMember(member.id, {
      name: member.name,
      role: member.role,
      description: member.description,
      image_url: member.image_url,
      order_position: member.order_position,
      is_active: member.is_active
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Управление командой</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка команды...</p>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Команда не найдена. Проверьте подключение к базе данных.</p>
            <button
              onClick={fetchTeamMembers}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Повторить загрузку
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {member.name || `Член команды #${member.order_position}`}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                      className="text-indigo-600 hover:text-indigo-800 p-2 rounded-md hover:bg-indigo-50"
                      title={editingMember === member.id ? "Свернуть" : "Редактировать"}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => saveMember(member)}
                      disabled={isSaving}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                    >
                      <Save size={16} className="mr-2" />
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Фото */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Фотография
                    </label>
                    
                    {editingMember === member.id ? (
                      <ImageUpload
                        currentImageUrl={member.image_url}
                        onImageUploaded={(url) => handleImageUploaded(member.id, url)}
                        onImageDeleted={() => handleImageDeleted(member.id)}
                      />
                    ) : (
                      <div className="relative">
                        {member.image_url ? (
                          <img
                            src={member.image_url}
                            alt={member.name}
                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              console.error('Image failed to load:', member.image_url);
                              // Можно установить placeholder изображение
                            }}
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                            <User size={48} className="text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => setEditingMember(member.id)}
                            className="bg-white/90 backdrop-blur-sm text-gray-600 p-2 rounded-full hover:bg-white transition-colors duration-200"
                            title="Изменить фото"
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Основная информация */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Имя *
                      </label>
                      <input
                        type="text"
                        value={member.name || ''}
                        onChange={(e) => handleMemberUpdate(member.id, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Введите имя"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Роль *
                      </label>
                      <input
                        type="text"
                        value={member.role || ''}
                        onChange={(e) => handleMemberUpdate(member.id, 'role', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Введите роль"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Описание *
                      </label>
                      <textarea
                        value={member.description || ''}
                        onChange={(e) => handleMemberUpdate(member.id, 'description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Введите описание"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Позиция в команде
                        </label>
                        <select
                          value={member.order_position || 1}
                          onChange={(e) => handleMemberUpdate(member.id, 'order_position', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={1}>1 - Первый</option>
                          <option value={2}>2 - Второй</option>
                          <option value={3}>3 - Третий</option>
                          <option value={4}>4 - Четвертый</option>
                          <option value={5}>5 - Пятый</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={member.is_active || false}
                            onChange={(e) => handleMemberUpdate(member.id, 'is_active', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Активный</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Предварительный просмотр */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Предварительный просмотр:</h4>
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {member.image_url ? (
                        <img
                          src={member.image_url}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h5 className="font-semibold text-gray-900">{member.name || 'Имя не указано'}</h5>
                      <p className="text-indigo-600 text-sm">{member.role || 'Роль не указана'}</p>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {member.description || 'Описание не указано'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Позиция: {member.order_position} | 
                        Статус: {member.is_active ? 'Активный' : 'Неактивный'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementModal;
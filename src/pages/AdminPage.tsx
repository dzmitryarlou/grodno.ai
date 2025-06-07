import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Activity, Trash2, Plus, UserPlus, Edit, X, Mail, TestTube, AlertTriangle, Settings, UserCheck, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AdminUserModal from '../components/AdminUserModal';
import EmailSettingsModal from '../components/EmailSettingsModal';
import TeamManagementModal from '../components/TeamManagementModal';
import SystemHealthCheck from '../components/SystemHealthCheck';
import ImageUpload from '../components/ImageUpload';
import { testEmailNotification } from '../lib/emailService';
import { checkStorageConfiguration } from '../lib/storage';

interface Registration {
  id: string;
  name: string;
  email?: string;
  phone: string;
  telegram: string;
  course_id: string;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  features: string[];
  image_url: string;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'registrations' | 'courses' | 'users' | 'logs'>('registrations');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEmailSettingsModal, setShowEmailSettingsModal] = useState(false);
  const [showTeamManagementModal, setShowTeamManagementModal] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [storageStatus, setStorageStatus] = useState<boolean | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    duration: '',
    features: [''],
    image_url: ''
  });

  useEffect(() => {
    fetchData();
    checkStorageConfiguration().then(setStorageStatus);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchRegistrations(),
        fetchCourses(),
        fetchActivityLogs(),
        fetchAdminUsers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;

    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logActivity('delete_registration', { registration_id: id });
      await fetchRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('Ошибка при удалении заявки');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого администратора?')) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logActivity('delete_admin_user', { user_id: id });
      await fetchAdminUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('courses')
        .insert([{
          ...courseForm,
          features: courseForm.features.filter(f => f.trim() !== '')
        }]);

      if (error) throw error;
      
      await logActivity('add_course', { title: courseForm.title });
      await fetchCourses();
      setShowCourseModal(false);
      setCourseForm({
        title: '',
        description: '',
        duration: '',
        features: [''],
        image_url: ''
      });
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Ошибка при добавлении курса');
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          ...courseForm,
          features: courseForm.features.filter(f => f.trim() !== '')
        })
        .eq('id', selectedCourse.id);

      if (error) throw error;
      
      await logActivity('update_course', { course_id: selectedCourse.id });
      await fetchCourses();
      setShowCourseModal(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Ошибка при обновлении курса');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс? Все связанные заявки также будут удалены.')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logActivity('delete_course', { course_id: id });
      await fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Ошибка при удалении курса');
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description,
      duration: course.duration,
      features: course.features || [''],
      image_url: course.image_url || ''
    });
    setShowCourseModal(true);
  };

  const addFeatureField = () => {
    setCourseForm(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...courseForm.features];
    newFeatures[index] = value;
    setCourseForm(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const removeFeature = (index: number) => {
    setCourseForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleImageUploaded = (url: string) => {
    setCourseForm(prev => ({
      ...prev,
      image_url: url
    }));
  };

  const handleImageDeleted = () => {
    setCourseForm(prev => ({
      ...prev,
      image_url: ''
    }));
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      // Используем упрощенную функцию тестирования
      const { data, error } = await supabase.rpc('simple_test_email_notification');

      if (error) {
        console.error('Error testing email:', error);
        throw error;
      }

      if (data?.success) {
        alert('Тестовое уведомление отправлено! Проверьте логи активности.');
      } else {
        alert(`Ошибка при отправке: ${data?.error || 'Неизвестная ошибка'}`);
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      alert(`Ошибка при отправке тестового уведомления: ${error.message}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const logActivity = async (action: string, details: any = {}) => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert([{ 
          action, 
          details, 
          user_id: 'system' // Системная операция
        }]);

      if (error) throw error;
      await fetchActivityLogs();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const formatLogDetails = (details: any) => {
    if (typeof details === 'object' && details !== null) {
      return JSON.stringify(details, null, 2);
    }
    return String(details);
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
            <div className="flex items-center space-x-4">
              {storageStatus === false && (
                <div className="flex items-center text-amber-600 text-sm">
                  <AlertTriangle size={16} className="mr-1" />
                  <span>Хранилище не настроено</span>
                </div>
              )}
              <button
                onClick={() => setShowHealthCheck(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center"
              >
                <Shield size={18} className="mr-2" />
                Проверка системы
              </button>
              <button
                onClick={() => setShowTeamManagementModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center"
              >
                <UserCheck size={18} className="mr-2" />
                Управление командой
              </button>
              <button
                onClick={() => setShowEmailSettingsModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center"
              >
                <Settings size={18} className="mr-2" />
                Email настройки
              </button>
              <button
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-300 flex items-center disabled:opacity-50"
              >
                <TestTube size={18} className="mr-2" />
                {isTestingEmail ? 'Отправка...' : 'Тест Email'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Users className="text-indigo-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Регистрации</h2>
              </div>
              <p className="text-gray-600 mb-4">Всего заявок: {registrations.length}</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <BookOpen className="text-purple-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Курсы</h2>
              </div>
              <p className="text-gray-600 mb-4">Активных курсов: {courses.length}</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Activity className="text-green-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Активность</h2>
              </div>
              <p className="text-gray-600 mb-4">Записей: {activityLogs.length}</p>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Mail className="text-orange-600 mr-2" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Администраторы</h2>
              </div>
              <p className="text-gray-600 mb-4">Пользователей: {adminUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'registrations'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Заявки
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'courses'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Курсы
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'users'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Пользователи
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'logs'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Логи
              </button>
            </div>
            {activeTab === 'courses' && (
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  setCourseForm({
                    title: '',
                    description: '',
                    duration: '',
                    features: [''],
                    image_url: ''
                  });
                  setShowCourseModal(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Добавить курс
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Загрузка данных...</p>
            </div>
          ) : (
            <>
              {/* Registrations Tab */}
              {activeTab === 'registrations' && (
                <div className="overflow-x-auto">
                  {registrations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Нет активных заявок</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Телефон</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Курс</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {registrations.map((registration) => (
                          <tr key={registration.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{registration.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{registration.email || 'Не указан'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{registration.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{registration.telegram}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {courses.find(c => c.id === registration.course_id)?.title || 'Неизвестный курс'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(registration.created_at).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteRegistration(registration.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-300"
                                title="Удалить заявку"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Courses Tab */}
              {activeTab === 'courses' && (
                <div className="overflow-x-auto">
                  {courses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Нет курсов</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Длительность</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Создан</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {courses.map((course) => (
                          <tr key={course.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{course.title}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{course.duration}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(course.created_at).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditCourse(course)}
                                  className="text-indigo-600 hover:text-indigo-800 transition-colors duration-300"
                                  title="Редактировать курс"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors duration-300"
                                  title="Удалить курс"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center"
                    >
                      <UserPlus size={18} className="mr-2" />
                      Добавить администратора
                    </button>
                  </div>
                  
                  {adminUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Нет пользователей</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(user.created_at).toLocaleDateString('ru-RU')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-300"
                                title="Удалить администратора"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === 'logs' && (
                <div className="overflow-x-auto">
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Нет записей активности</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Детали</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activityLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                log.action.includes('email') ? 'bg-blue-100 text-blue-800' :
                                log.action.includes('delete') ? 'bg-red-100 text-red-800' :
                                log.action.includes('add') || log.action.includes('create') ? 'bg-green-100 text-green-800' :
                                log.action.includes('team') ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {log.user_id || 'Система'}
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-600">
                              {formatLogDetails(log.details)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(log.created_at).toLocaleString('ru-RU')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {selectedCourse ? 'Редактировать курс' : 'Добавить курс'}
              </h2>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={selectedCourse ? handleUpdateCourse : handleAddCourse}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Длительность
                  </label>
                  <input
                    type="text"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="например: 8 недель"
                    required
                  />
                </div>
                
                <ImageUpload
                  currentImageUrl={courseForm.image_url}
                  onImageUploaded={handleImageUploaded}
                  onImageDeleted={handleImageDeleted}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Особенности курса
                  </label>
                  {courseForm.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Введите особенность курса"
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeatureField}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    + Добавить особенность
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300"
                >
                  {selectedCourse ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add AdminUserModal */}
      <AdminUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSuccess={() => {
          fetchAdminUsers();
          logActivity('add_admin_user', { action: 'create' });
        }}
      />

      {/* Add EmailSettingsModal */}
      <EmailSettingsModal
        isOpen={showEmailSettingsModal}
        onClose={() => setShowEmailSettingsModal(false)}
      />

      {/* Add TeamManagementModal */}
      <TeamManagementModal
        isOpen={showTeamManagementModal}
        onClose={() => setShowTeamManagementModal(false)}
      />

      {/* Add SystemHealthCheck */}
      {showHealthCheck && (
        <SystemHealthCheck
          onClose={() => setShowHealthCheck(false)}
        />
      )}
    </div>
  );
};

export default AdminPage;
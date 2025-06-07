import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Activity, Database, Mail, Users, BookOpen, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SystemHealthCheckProps {
  onClose: () => void;
}

interface HealthStatus {
  system_status: string;
  database_health: {
    tables_present: boolean;
    functions_available: boolean;
    rls_disabled: boolean;
  };
  data_status: {
    admin_users: number;
    courses: number;
    registrations: number;
    team_members: number;
    email_templates: number;
  };
  features_status: {
    email_system: boolean;
    team_management: boolean;
    course_management: boolean;
    registration_system: boolean;
    admin_panel: boolean;
  };
  security_status: {
    rls_disabled: string;
    authentication_bypassed: boolean;
    ready_for_demo: boolean;
  };
  recommendations: string[];
}

const SystemHealthCheck: React.FC<SystemHealthCheckProps> = ({ onClose }) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsChecking(true);
    setError('');
    
    try {
      const { data: connectionTest, error: connectionError } = await supabase
        .from('admin_users')
        .select('count')
        .limit(1);

      if (connectionError) {
        throw new Error(`Ошибка подключения к БД: ${connectionError.message}`);
      }

      const { data, error } = await supabase.rpc('pre_presentation_system_check');
      
      if (error) {
        throw error;
      }
      
      setHealthStatus(data);
    } catch (err: any) {
      setError(err.message || 'Ошибка при проверке системы');
      
      setHealthStatus({
        system_status: 'error',
        database_health: {
          tables_present: false,
          functions_available: false,
          rls_disabled: true
        },
        data_status: {
          admin_users: 0,
          courses: 0,
          registrations: 0,
          team_members: 0,
          email_templates: 0
        },
        features_status: {
          email_system: false,
          team_management: false,
          course_management: false,
          registration_system: false,
          admin_panel: false
        },
        security_status: {
          rls_disabled: 'ERROR',
          authentication_bypassed: false,
          ready_for_demo: false
        },
        recommendations: ['Требуется немедленное исправление системы']
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle size={20} className="text-green-500" />
    ) : (
      <AlertCircle size={20} className="text-red-500" />
    );
  };

  const isSystemReady = healthStatus?.system_status === 'ready_for_presentation';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🚨 Критическая проверка системы</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={runHealthCheck}
            disabled={isChecking}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center disabled:opacity-50"
          >
            <RefreshCw size={20} className={`mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Проверка системы...' : 'Повторить проверку'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle size={20} className="text-red-500 mr-2" />
              <div>
                <span className="text-red-700 font-semibold">Критическая ошибка: </span>
                <span className="text-red-600">{error}</span>
              </div>
            </div>
          </div>
        )}

        {healthStatus && (
          <div className="space-y-6">
            <div className={`border rounded-lg p-4 ${
              isSystemReady 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                {isSystemReady ? (
                  <CheckCircle size={24} className="text-green-500 mr-3" />
                ) : (
                  <AlertCircle size={24} className="text-red-500 mr-3" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${
                    isSystemReady ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isSystemReady 
                      ? '✅ Система готова к презентации!' 
                      : '🚨 Система требует исправления!'
                    }
                  </h3>
                  <p className={isSystemReady ? 'text-green-600' : 'text-red-600'}>
                    Статус: {healthStatus.system_status}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Database size={24} className="text-indigo-600 mr-3" />
                  <h3 className="text-lg font-semibold">База данных</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {getStatusIcon(healthStatus.database_health.tables_present)}
                    <span className="ml-2">Таблицы созданы</span>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(healthStatus.database_health.functions_available)}
                    <span className="ml-2">Функции доступны</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Activity size={24} className="text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold">Данные</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Админы: {healthStatus.data_status.admin_users}</div>
                  <div>Курсы: {healthStatus.data_status.courses}</div>
                  <div>Заявки: {healthStatus.data_status.registrations}</div>
                  <div>Команда: {healthStatus.data_status.team_members}</div>
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-6 ${
              isSystemReady 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${
                isSystemReady ? 'text-blue-800' : 'text-yellow-800'
              }`}>
                {isSystemReady ? '🎯 Готовность к презентации' : '⚠️ Требуемые действия'}
              </h3>
              <ul className="space-y-2">
                {healthStatus.recommendations.slice(0, 3).map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={16} className={`mr-2 mt-0.5 flex-shrink-0 ${
                      isSystemReady ? 'text-blue-500' : 'text-yellow-500'
                    }`} />
                    <span className={isSystemReady ? 'text-blue-700' : 'text-yellow-700'}>
                      {recommendation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Последняя проверка: {new Date().toLocaleString('ru-RU')}
          </div>
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

export default SystemHealthCheck;
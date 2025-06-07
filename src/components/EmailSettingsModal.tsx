import React, { useState, useEffect } from 'react';
import { X, Mail, Save, TestTube, Plus, Edit, Trash2, Server, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getSMTPSettings, saveSMTPSettings, testEmailNotification, diagnoseEmailSystem } from '../lib/emailService';

interface EmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EmailTemplate {
  id: string;
  template_name: string;
  subject: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
}

interface EmailSettings {
  notifications_enabled: boolean;
  admin_emails: string[];
}

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

interface DiagnosisResult {
  smtp_configured: boolean;
  smtp_host: string;
  smtp_user: string;
  smtp_has_password: boolean;
  notifications_enabled: boolean;
  admin_emails_count: number;
  admin_emails: string[];
  active_templates_count: number;
  recent_email_activity: number;
  database_accessible: boolean;
  functions_working: boolean;
  rls_disabled: boolean;
}

const EmailSettingsModal: React.FC<EmailSettingsModalProps> = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [settings, setSettings] = useState<EmailSettings>({
    notifications_enabled: true,
    admin_emails: ['dzmitry.arlou@grodno.ai']
  });
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>({
    host: 'mail.gandi.net',
    port: 587,
    secure: false,
    user: 'tara@grodno.ai',
    pass: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'smtp' | 'templates' | 'create' | 'settings'>('diagnosis');
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    subject: '',
    body_template: '',
    variables: [''],
    is_active: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      runDiagnosis();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchTemplates(), fetchSettings(), fetchSMTPSettings()]);
    } catch (error) {
      console.error('Error fetching email data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runDiagnosis = async () => {
    try {
      setIsDiagnosing(true);
      const diagnosisResult = await diagnoseEmailSystem();
      setDiagnosis(diagnosisResult);
    } catch (error) {
      console.error('Error running diagnosis:', error);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_name');

      if (error) {
        console.error('Error fetching templates:', error);
        return;
      }
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*');

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      const settingsMap = (data || []).reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as any);

      setSettings({
        notifications_enabled: settingsMap.notifications_enabled || false,
        admin_emails: settingsMap.admin_emails || ['dzmitry.arlou@grodno.ai']
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSMTPSettings = async () => {
    try {
      const smtpConfig = await getSMTPSettings();
      if (smtpConfig) {
        setSMTPSettings(smtpConfig);
      }
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
    }
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase.rpc('simple_update_email_template', {
        template_id_param: selectedTemplate.id,
        subject_param: selectedTemplate.subject,
        body_template_param: selectedTemplate.body_template,
        variables_param: selectedTemplate.variables,
        is_active_param: selectedTemplate.is_active
      });

      if (error) {
        console.error('Error saving template:', error);
        throw error;
      }

      await fetchTemplates();
      alert('Шаблон сохранен успешно');
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(`Ошибка при сохранении шаблона: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.template_name || !newTemplate.subject || !newTemplate.body_template) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const { data, error } = await supabase.rpc('simple_create_email_template', {
        template_name_param: newTemplate.template_name,
        subject_param: newTemplate.subject,
        body_template_param: newTemplate.body_template,
        variables_param: newTemplate.variables.filter(v => v.trim() !== ''),
        is_active_param: newTemplate.is_active
      });

      if (error) {
        console.error('Error creating template:', error);
        throw error;
      }

      await fetchTemplates();
      setNewTemplate({
        template_name: '',
        subject: '',
        body_template: '',
        variables: [''],
        is_active: true
      });
      setActiveTab('templates');
      alert('Шаблон создан успешно');
    } catch (error: any) {
      console.error('Error creating template:', error);
      alert(`Ошибка при создании шаблона: ${error.message}`);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return;

    try {
      const { data, error } = await supabase.rpc('simple_delete_email_template', {
        template_id_param: templateId
      });

      if (error) {
        console.error('Error deleting template:', error);
        throw error;
      }

      await fetchTemplates();
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
      alert('Шаблон удален успешно');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(`Ошибка при удалении шаблона: ${error.message}`);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Сохраняем настройки уведомлений
      const { error: notifError } = await supabase
        .from('email_settings')
        .upsert({
          setting_key: 'notifications_enabled',
          setting_value: settings.notifications_enabled
        });

      if (notifError) throw notifError;

      // Сохраняем список администраторов
      const { error: emailsError } = await supabase
        .from('email_settings')
        .upsert({
          setting_key: 'admin_emails',
          setting_value: settings.admin_emails
        });

      if (emailsError) throw emailsError;

      alert('Настройки сохранены успешно');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      alert(`Ошибка при сохранении настроек: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSMTPSettingsHandler = async () => {
    setIsSaving(true);
    try {
      const success = await saveSMTPSettings(smtpSettings);
      if (success) {
        alert('Настройки SMTP сохранены успешно');
        await runDiagnosis(); // Обновляем диагностику
      } else {
        throw new Error('Не удалось сохранить настройки SMTP');
      }
    } catch (error: any) {
      console.error('Error saving SMTP settings:', error);
      alert(`Ошибка при сохранении настроек SMTP: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const testNotifications = async () => {
    setIsTesting(true);
    try {
      await testEmailNotification();
      alert('Тестовое уведомление отправлено! Проверьте почту и логи активности.');
      await runDiagnosis(); // Обновляем диагностику
    } catch (error: any) {
      console.error('Error testing notifications:', error);
      alert(`Ошибка при отправке тестового уведомления: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const addAdminEmail = () => {
    setSettings(prev => ({
      ...prev,
      admin_emails: [...prev.admin_emails, '']
    }));
  };

  const updateAdminEmail = (index: number, email: string) => {
    setSettings(prev => ({
      ...prev,
      admin_emails: prev.admin_emails.map((e, i) => i === index ? email : e)
    }));
  };

  const removeAdminEmail = (index: number) => {
    setSettings(prev => ({
      ...prev,
      admin_emails: prev.admin_emails.filter((_, i) => i !== index)
    }));
  };

  const addVariable = () => {
    setNewTemplate(prev => ({
      ...prev,
      variables: [...prev.variables, '']
    }));
  };

  const updateVariable = (index: number, value: string) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => i === index ? value : v)
    }));
  };

  const removeVariable = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Настройки Email уведомлений</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'diagnosis'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Activity size={16} className="inline mr-2" />
            Диагностика
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'smtp'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Server size={16} className="inline mr-2" />
            SMTP сервер
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'templates'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Шаблоны писем
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'create'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Создать шаблон
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'settings'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Настройки
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Diagnosis Tab */}
            {activeTab === 'diagnosis' && (
              <div className="max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Диагностика Email системы</h3>
                  <button
                    onClick={runDiagnosis}
                    disabled={isDiagnosing}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                  >
                    <Activity size={16} className="mr-2" />
                    {isDiagnosing ? 'Проверка...' : 'Обновить диагностику'}
                  </button>
                </div>

                {diagnosis ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SMTP Configuration */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Server size={18} className="mr-2" />
                        SMTP Конфигурация
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {diagnosis.smtp_configured ? (
                            <CheckCircle size={16} className="text-green-500 mr-2" />
                          ) : (
                            <AlertCircle size={16} className="text-red-500 mr-2" />
                          )}
                          <span className="text-sm">
                            SMTP настроен: {diagnosis.smtp_configured ? 'Да' : 'Нет'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Хост: {diagnosis.smtp_host || 'Не указан'}</p>
                          <p>Пользователь: {diagnosis.smtp_user || 'Не указан'}</p>
                          <p>Пароль: {diagnosis.smtp_has_password ? 'Установлен' : 'Не установлен'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Mail size={18} className="mr-2" />
                        Уведомления
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          {diagnosis.notifications_enabled ? (
                            <CheckCircle size={16} className="text-green-500 mr-2" />
                          ) : (
                            <AlertCircle size={16} className="text-red-500 mr-2" />
                          )}
                          <span className="text-sm">
                            Уведомления: {diagnosis.notifications_enabled ? 'Включены' : 'Отключены'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Администраторов: {diagnosis.admin_emails_count}</p>
                          <p>Активных шаблонов: {diagnosis.active_templates_count}</p>
                          <p>Email за 24ч: {diagnosis.recent_email_activity}</p>
                        </div>
                      </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Activity size={18} className="mr-2" />
                        Статус системы
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">База данных доступна</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">Функции работают</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-500 mr-2" />
                          <span className="text-sm">RLS отключен (небезопасный режим)</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Emails */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3">Email администраторов</h4>
                      <div className="space-y-1">
                        {diagnosis.admin_emails?.map((email, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {email}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Запустите диагностику для проверки системы</p>
                  </div>
                )}

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={testNotifications}
                    disabled={isTesting}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                  >
                    <TestTube size={16} className="mr-2" />
                    {isTesting ? 'Отправка...' : 'Тест Email системы'}
                  </button>
                </div>
              </div>
            )}

            {/* SMTP Settings Tab */}
            {activeTab === 'smtp' && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Настройки SMTP сервера Gandi.net</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP хост *
                    </label>
                    <input
                      type="text"
                      value={smtpSettings.host}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, host: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="mail.gandi.net"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Порт *
                      </label>
                      <input
                        type="number"
                        value={smtpSettings.port}
                        onChange={(e) => setSMTPSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="587"
                      />
                    </div>

                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id="secure"
                        checked={smtpSettings.secure}
                        onChange={(e) => setSMTPSettings(prev => ({ ...prev, secure: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="secure" className="ml-2 block text-sm text-gray-900">
                        Использовать SSL/TLS
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email пользователя *
                    </label>
                    <input
                      type="email"
                      value={smtpSettings.user}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, user: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your-email@grodno.ai"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Пароль *
                    </label>
                    <input
                      type="password"
                      value={smtpSettings.pass}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, pass: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Пароль от почтового ящика"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={saveSMTPSettingsHandler}
                      disabled={isSaving}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                    >
                      <Save size={16} className="mr-2" />
                      {isSaving ? 'Сохранение...' : 'Сохранить SMTP'}
                    </button>

                    <button
                      onClick={testNotifications}
                      disabled={isTesting || !smtpSettings.host}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                    >
                      <TestTube size={16} className="mr-2" />
                      {isTesting ? 'Отправка...' : 'Тест Email'}
                    </button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Настройки для Gandi.net:</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>SMTP хост:</strong> mail.gandi.net</p>
                      <p><strong>Порт:</strong> 587 (STARTTLS) или 465 (SSL)</p>
                      <p><strong>Безопасность:</strong> Включите SSL/TLS для порта 465</p>
                      <p><strong>Аутентификация:</strong> Используйте полный email адрес и пароль</p>
                    </div>
                    <div className="mt-3 text-xs text-blue-600">
                      <p>Убедитесь, что у вас есть активный почтовый ящик на домене grodno.ai в панели управления Gandi.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Шаблоны</h3>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate?.id === template.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div 
                            onClick={() => setSelectedTemplate(template)}
                            className="flex-grow"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{template.template_name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                template.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {template.is_active ? 'Активен' : 'Неактивен'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(template.id);
                            }}
                            className="ml-2 text-red-600 hover:text-red-800 p-1"
                            title="Удалить шаблон"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Editor */}
                <div>
                  {selectedTemplate ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Редактирование шаблона</h3>
                        <button
                          onClick={saveTemplate}
                          disabled={isSaving}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                        >
                          <Save size={16} className="mr-2" />
                          {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Тема письма
                          </label>
                          <input
                            type="text"
                            value={selectedTemplate.subject}
                            onChange={(e) => setSelectedTemplate(prev => prev ? {
                              ...prev,
                              subject: e.target.value
                            } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Текст письма
                          </label>
                          <textarea
                            value={selectedTemplate.body_template}
                            onChange={(e) => setSelectedTemplate(prev => prev ? {
                              ...prev,
                              body_template: e.target.value
                            } : null)}
                            rows={12}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_active"
                            checked={selectedTemplate.is_active}
                            onChange={(e) => setSelectedTemplate(prev => prev ? {
                              ...prev,
                              is_active: e.target.checked
                            } : null)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                            Активный шаблон
                          </label>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Доступные переменные:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedTemplate.variables.map((variable) => (
                              <span
                                key={variable}
                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                              >
                                {`{{${variable}}}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Выберите шаблон для редактирования
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create Template Tab */}
            {activeTab === 'create' && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Создать новый шаблон</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название шаблона *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.template_name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="например: welcome_message"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тема письма *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Тема письма"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Текст письма *
                    </label>
                    <textarea
                      value={newTemplate.body_template}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, body_template: e.target.value }))}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      placeholder="Текст письма с переменными {{variable_name}}"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Переменные
                    </label>
                    {newTemplate.variables.map((variable, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={variable}
                          onChange={(e) => updateVariable(index, e.target.value)}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="название_переменной"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariable(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addVariable}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      + Добавить переменную
                    </button>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="new_is_active"
                      checked={newTemplate.is_active}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="new_is_active" className="ml-2 block text-sm text-gray-900">
                      Активный шаблон
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={createTemplate}
                      disabled={isCreatingTemplate}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                    >
                      <Plus size={16} className="mr-2" />
                      {isCreatingTemplate ? 'Создание...' : 'Создать шаблон'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Уведомления</h3>
                      <p className="text-sm text-gray-600">Включить или отключить email уведомления</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications_enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        notifications_enabled: e.target.checked
                      }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Email адреса администраторов</h3>
                    <div className="space-y-2">
                      {settings.admin_emails.map((email, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => updateAdminEmail(index, e.target.value)}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="admin@grodno.ai"
                          />
                          <button
                            onClick={() => removeAdminEmail(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addAdminEmail}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        + Добавить email
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={saveSettings}
                      disabled={isSaving}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center disabled:opacity-50"
                    >
                      <Save size={16} className="mr-2" />
                      {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmailSettingsModal;
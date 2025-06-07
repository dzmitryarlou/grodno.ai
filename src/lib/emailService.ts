import { supabase } from './supabaseClient';

export interface EmailNotification {
  recipient: string;
  subject: string;
  body: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

// Функция для получения настроек SMTP
export const getSMTPSettings = async (): Promise<SMTPSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'smtp_settings')
      .single();

    if (error) {
      console.error('Error fetching SMTP settings:', error);
      return null;
    }

    return data?.setting_value as SMTPSettings;
  } catch (error) {
    console.error('Error getting SMTP settings:', error);
    return null;
  }
};

// Функция для сохранения настроек SMTP
export const saveSMTPSettings = async (settings: SMTPSettings): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('simple_save_smtp_settings', {
      host_param: settings.host,
      port_param: settings.port,
      secure_param: settings.secure,
      user_param: settings.user,
      pass_param: settings.pass
    });

    if (error) {
      console.error('Error saving SMTP settings:', error);
      return false;
    }

    console.log('SMTP settings saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    return false;
  }
};

// Функция для отправки email через Edge Function
export const sendEmailNotification = async (notification: EmailNotification): Promise<void> => {
  try {
    console.log('🚀 Starting email notification process');
    
    // Получаем настройки SMTP
    const smtpSettings = await getSMTPSettings();
    
    if (!smtpSettings || !smtpSettings.host || !smtpSettings.user) {
      console.warn('⚠️ SMTP settings not configured properly');
      await logEmailAttempt(notification, 'SMTP not configured');
      throw new Error('SMTP настройки не сконфигурированы. Пожалуйста, настройте SMTP в панели администратора.');
    }

    console.log('📧 Sending email via Edge Function');
    console.log('📍 SMTP Host:', smtpSettings.host);
    console.log('👤 SMTP User:', smtpSettings.user);
    console.log('📨 To:', notification.recipient);
    console.log('📝 Subject:', notification.subject);

    // Вызываем Edge Function для отправки email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: notification.recipient,
        subject: notification.subject,
        html: notification.body.replace(/\n/g, '<br>'),
        smtp: smtpSettings
      }
    });

    if (error) {
      console.error('❌ Error from Edge Function:', error);
      await logEmailAttempt(notification, `Edge Function Error: ${error.message}`);
      throw new Error(`Ошибка отправки email: ${error.message}`);
    }

    if (data?.success) {
      console.log('✅ Email sent successfully via Edge Function');
      await logEmailAttempt(notification, 'Sent successfully via Edge Function');
    } else {
      console.error('❌ Email sending failed:', data?.error);
      await logEmailAttempt(notification, `Failed: ${data?.error || 'Unknown error'}`);
      throw new Error(`Не удалось отправить email: ${data?.error || 'Неизвестная ошибка'}`);
    }
    
  } catch (error: any) {
    console.error('💥 Critical error in sendEmailNotification:', error);
    await logEmailAttempt(notification, `Critical Error: ${error.message}`);
    throw error;
  }
};

// Функция для логирования попыток отправки email
const logEmailAttempt = async (notification: EmailNotification, status: string) => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert([{
        user_id: null,
        action: 'email_notification_attempt',
        details: {
          recipient: notification.recipient,
          subject: notification.subject,
          status: status,
          timestamp: new Date().toISOString(),
          method: 'frontend_service'
        }
      }]);

    if (error) {
      console.error('Error logging email attempt:', error);
    }
  } catch (error) {
    console.error('Error logging email attempt:', error);
  }
};

// Функция для уведомления администраторов о новых регистрациях
export const notifyAdminsOfNewRegistration = async (registration: {
  name: string;
  email?: string;
  phone: string;
  telegram: string;
  courseName: string;
  createdAt: string;
}): Promise<void> => {
  try {
    console.log('📢 Notifying admins of new registration');

    // Получаем настройки email
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_emails')
      .single();

    if (settingsError) {
      console.error('Error fetching admin email settings:', settingsError);
      return;
    }

    const adminEmails = emailSettings?.setting_value || ['dzmitry.arlou@grodno.ai'];
    console.log('👥 Admin emails:', adminEmails);

    // Получаем шаблон email
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('subject, body_template')
      .eq('template_name', 'new_registration')
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error('Error fetching email template:', templateError);
    }

    // Создаем тело письма
    let emailBody = template?.body_template || `Поступила новая заявка на обучение в ИИ Клубе!

📋 Детали заявки:
👤 Имя: {{name}}
📧 Email: {{email}}
📱 Телефон: {{phone}}
💬 Telegram: {{telegram}}
🎓 Курс: {{courseName}}
📅 Дата подачи: {{createdAt}}

Для просмотра всех заявок перейдите в панель администратора.`;

    // Заменяем переменные
    emailBody = emailBody
      .replace(/\{\{name\}\}/g, registration.name)
      .replace(/\{\{email\}\}/g, registration.email || 'Не указан')
      .replace(/\{\{phone\}\}/g, registration.phone)
      .replace(/\{\{telegram\}\}/g, registration.telegram)
      .replace(/\{\{course_name\}\}/g, registration.courseName)
      .replace(/\{\{courseName\}\}/g, registration.courseName)
      .replace(/\{\{created_at\}\}/g, new Date(registration.createdAt).toLocaleString('ru-RU'))
      .replace(/\{\{createdAt\}\}/g, new Date(registration.createdAt).toLocaleString('ru-RU'));

    // Отправляем уведомление каждому администратору
    const emailPromises = adminEmails.map((email: string) => 
      sendEmailNotification({
        recipient: email,
        subject: template?.subject || 'Новая заявка на обучение - ИИ Клуб',
        body: emailBody
      })
    );

    await Promise.all(emailPromises);
    console.log('✅ All admin notifications sent successfully');
    
  } catch (error) {
    console.error('💥 Error notifying admins:', error);
    throw error;
  }
};

// Функция для тестирования email системы
export const testEmailNotification = async (): Promise<void> => {
  try {
    console.log('🧪 Starting email system test');
    
    const { data, error } = await supabase.rpc('simple_test_email_notification');

    if (error) {
      console.error('Error in test function:', error);
      throw new Error(`Ошибка тестирования: ${error.message}`);
    }

    if (data?.success) {
      console.log('✅ Email test completed successfully');
    } else {
      console.error('❌ Email test failed:', data?.error);
      throw new Error(`Тест не прошел: ${data?.error || 'Неизвестная ошибка'}`);
    }
  } catch (error: any) {
    console.error('💥 Error in testEmailNotification:', error);
    throw error;
  }
};

// Функция для диагностики email системы
export const diagnoseEmailSystem = async (): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('diagnose_email_system');

    if (error) {
      console.error('Error in diagnosis function:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error diagnosing email system:', error);
    throw error;
  }
};
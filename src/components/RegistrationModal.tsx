import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, courseId, courseTitle }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // First verify the course exists
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        throw new Error('Курс не найден. Пожалуйста, обновите страницу и попробуйте снова.');
      }

      // Insert the registration
      const { data: registration, error: registrationError } = await supabase
        .from('registrations')
        .insert([{
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone,
          telegram: formData.telegram,
          course_id: courseId
        }])
        .select('*')
        .single();

      if (registrationError) {
        console.error('Registration error:', registrationError);
        throw registrationError;
      }

      console.log('Registration successful:', registration);
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ name: '', email: '', phone: '', telegram: '' });
      }, 2000);
    } catch (err: any) {
      console.error('Error in registration:', err);
      setError(err.message || 'Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full m-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900">Запись на курс</h2>
        <p className="text-gray-600 mb-6">{courseTitle}</p>

        {success ? (
          <div className="text-green-600 text-center py-8">
            <p className="text-xl font-semibold">Спасибо за регистрацию!</p>
            <p className="mt-2">Мы свяжемся с вами в ближайшее время.</p>
            <p className="mt-1 text-sm text-gray-600">Администраторы получили уведомление о вашей заявке.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Имя *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Телефон *
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+375 XX XXX XX XX"
              />
            </div>

            <div>
              <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-1">
                Telegram *
              </label>
              <input
                type="text"
                id="telegram"
                required
                value={formData.telegram}
                onChange={(e) => setFormData(prev => ({ ...prev, telegram: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="@username"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-300 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Отправка...' : 'Записаться'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegistrationModal;
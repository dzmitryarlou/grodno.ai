import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleSecretClick = () => {
    navigate('/secret');
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Копируем номер в буфер обмена
    navigator.clipboard.writeText('+375292828878').then(() => {
      // Можно добавить уведомление о копировании
    }).catch(() => {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = '+375292828878';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Brain size={24} className="text-indigo-400" />
              <span className="text-xl font-bold">ИИ Клуб</span>
            </div>
            <p className="text-gray-400 text-sm">
              Инновационное сообщество для изучения и развития навыков в сфере искусственного интеллекта в Гродно.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Разделы</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-300">
                  О нас
                </Link>
              </li>
              <li>
                <Link to="/training" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Обучение ИИ
                </Link>
              </li>
              <li>
                <Link to="/vibe-code" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Вайб-код
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin size={20} className="text-indigo-400 flex-shrink-0 mt-1" />
                <span className="text-gray-400">г. Гродно, ул. Поповича 33</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={20} className="text-indigo-400 flex-shrink-0" />
                <button
                  onClick={handlePhoneClick}
                  className="text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer select-all"
                  title="Нажмите, чтобы скопировать номер"
                >
                  +375292828878
                </button>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="text-indigo-400 flex-shrink-0" />
                <a 
                  href="mailto:tara@grodno.ai" 
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                >
                  tara@grodno.ai
                </a>
              </li>
            </ul>
          </div>

          {/* Subscribe */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Подписаться</h3>
            <p className="text-gray-400 text-sm mb-4">
              Получайте новости и обновления о мероприятиях
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Ваш email"
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors duration-300"
              >
                Подписаться
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} ИИ Клуб Дмитрия Орлова. Все права <button 
            onClick={handleSecretClick}
            className="hover:text-white transition-colors duration-300"
          >
            защищены
          </button>.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
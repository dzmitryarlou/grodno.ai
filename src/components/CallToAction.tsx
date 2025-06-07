import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallToAction: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Начните свой путь в мир искусственного интеллекта сегодня
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Присоединяйтесь к ИИ Клубу Дмитрия Орлова и получите доступ к бесплатным образовательным программам, уникальному сообществу и передовым знаниям
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/training"
              className="bg-white text-indigo-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-300 inline-flex items-center justify-center"
            >
              Записаться на обучение
              <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link
              to="/about"
              className="bg-transparent hover:bg-white/10 text-white font-medium py-3 px-6 rounded-lg border border-white transition-colors duration-300 inline-flex items-center justify-center"
            >
              Узнать больше о клубе
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
import React from 'react';
import { Lightbulb, Users, Award, Globe, BookOpen, Zap } from 'lucide-react';

interface AdvantageCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const AdvantageCard: React.FC<AdvantageCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg border border-gray-100">
      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const Advantages: React.FC = () => {
  const advantages = [
    {
      icon: <Lightbulb size={24} />,
      title: 'Инновационный подход',
      description: 'Мы используем передовые методики обучения и практики работы с искусственным интеллектом, которые соответствуют мировым стандартам.'
    },
    {
      icon: <Users size={24} />,
      title: 'Сообщество единомышленников',
      description: 'Вступите в сообщество энтузиастов и профессионалов, которые разделяют вашу страсть к технологиям и ИИ.'
    },
    {
      icon: <Award size={24} />,
      title: 'Бесплатное образование',
      description: 'Все образовательные программы клуба доступны бесплатно для жителей Гродно, что делает знания доступными для каждого.'
    },
    {
      icon: <BookOpen size={24} />,
      title: 'Практический опыт',
      description: 'Вы получите не только теоретические знания, но и практические навыки работы с различными инструментами ИИ.'
    },
    {
      icon: <Globe size={24} />,
      title: 'Развитие региона',
      description: 'Мы вносим вклад в развитие технологического потенциала Гродно, создавая базу для инноваций и новых проектов.'
    },
    {
      icon: <Zap size={24} />,
      title: 'Актуальные знания',
      description: 'Программы обучения постоянно обновляются в соответствии с последними тенденциями и достижениями в сфере ИИ.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Преимущества ИИ Клуба в Гродно</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Присоединяйтесь к первому в городе сообществу специалистов и энтузиастов в сфере искусственного интеллекта
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <AdvantageCard 
              key={index}
              icon={advantage.icon}
              title={advantage.title}
              description={advantage.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Advantages;
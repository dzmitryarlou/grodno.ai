import React, { useState, useEffect } from 'react';
import { Users, Target, Award, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image_url: string;
  order_position: number;
  is_active: boolean;
}

const AboutPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-900 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">О нас</h1>
            <p className="text-xl opacity-90">
              ИИ Клуб Дмитрия Орлова — первое в Гродно сообщество энтузиастов и специалистов в области искусственного интеллекта
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">Наша история</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                ИИ Клуб был основан в 2024 году Дмитрием Орловым, специалистом в области искусственного интеллекта и технологическим энтузиастом, который увидел огромный потенциал в развитии ИИ-компетенций в Гродно.
              </p>
              <p>
                Клуб начал свою деятельность с небольших мастер-классов для всех интересующихся технологиями искусственного интеллекта. Постепенно сообщество росло, и сегодня ИИ Клуб стал значимой площадкой для обучения, обмена опытом и реализации проектов в области ИИ.
              </p>
              <p>
                Мы гордимся тем, что создали первое в Гродно пространство, где каждый человек может получить качественные знания о современных технологиях ИИ абсолютно бесплатно. Наша миссия — сделать эти знания доступными для всех и способствовать технологическому развитию региона.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Target size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Миссия</h3>
              <p className="text-gray-700">
                Наша миссия — демократизировать доступ к знаниям в области искусственного интеллекта, создавая открытое и инклюзивное сообщество, где каждый может учиться, делиться опытом и развиваться профессионально.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Видение</h3>
              <p className="text-gray-700">
                Мы стремимся стать ключевым игроком в формировании будущего искусственного интеллекта в Гродно и Беларуси, создавая образовательную экосистему, которая объединяет энтузиастов, профессионалов и бизнес для развития инновационных решений и технологий.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Наша команда</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Познакомьтесь с опытными специалистами, которые делятся своими знаниями и помогают участникам клуба освоить технологии ИИ
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Загрузка команды...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                    <img 
                      src={member.image_url} 
                      alt={member.name} 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1 text-gray-900">{member.name}</h3>
                    <p className="text-indigo-600 mb-4">{member.role}</p>
                    <p className="text-gray-600 mb-4">
                      {member.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Наши ценности</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Принципы, которыми мы руководствуемся в нашей работе
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Award size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Доступность</h3>
              <p className="text-gray-600">
                Мы убеждены, что знания должны быть доступны всем, независимо от финансовых возможностей.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Сообщество</h3>
              <p className="text-gray-600">
                Мы создаем среду, где каждый может учиться, делиться опытом и развиваться вместе.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Инновации</h3>
              <p className="text-gray-600">
                Мы стремимся быть в курсе последних тенденций и технологий в области ИИ.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Target size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Практичность</h3>
              <p className="text-gray-600">
                Мы фокусируемся на практическом применении знаний и развитии реальных навыков.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
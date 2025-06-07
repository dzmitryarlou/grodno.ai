import React, { useState, useEffect } from 'react';
import { Zap, Clock, BookOpen, CheckCircle, Download } from 'lucide-react';
import RegistrationModal from '../components/RegistrationModal';
import { supabase } from '../lib/supabaseClient';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  features: string[];
  image_url: string;
  created_at: string;
}

const TrainingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchCourses();
  }, []);

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
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRegistrationClick = (courseId: string, courseTitle: string) => {
    setSelectedCourse({ id: courseId, title: courseTitle });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка курсов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-900 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Обучение ИИ</h1>
            <p className="text-xl opacity-90 mb-8">
              Выберите образовательную программу, которая поможет вам развить навыки в области искусственного интеллекта
            </p>
            <div className="bg-white rounded-lg p-2 shadow-lg flex flex-col md:flex-row">
              <input
                type="text"
                placeholder="Поиск курсов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow px-4 py-2 text-gray-900 bg-transparent focus:outline-none"
              />
              <button
                className="mt-2 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300 flex items-center justify-center"
              >
                Найти
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h2 className="text-3xl font-bold mb-4 md:mb-0 text-gray-900">Доступные курсы</h2>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                {searchQuery ? 'Курсы не найдены. Попробуйте изменить параметры поиска.' : 'Курсы скоро появятся.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="md:flex">
                    <div className="md:w-1/3 relative">
                      <img 
                        src={course.image_url} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <h3 className="text-xl font-bold mb-2 text-gray-900">{course.title}</h3>
                      <p className="text-gray-600 mb-4">{course.description}</p>
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock size={16} className="mr-1 text-indigo-600" />
                          {course.duration}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <BookOpen size={16} className="mr-1 text-indigo-600" />
                          {course.features.length} тем
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => handleRegistrationClick(course.id, course.title)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 inline-flex items-center"
                        >
                          Записаться
                          <Zap size={16} className="ml-1" />
                        </button>
                        <button className="bg-transparent text-indigo-600 hover:bg-indigo-50 font-medium py-2 px-4 rounded-lg border border-indigo-600 transition-colors duration-300 inline-flex items-center">
                          Подробнее
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Course Details */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Как проходит обучение</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Образовательные программы ИИ Клуба сочетают теоретические знания и практический опыт
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Теоретическая база</h3>
              <p className="text-gray-600">
                Каждый курс начинается с изучения фундаментальных принципов и теоретических основ выбранного направления ИИ.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Практические занятия</h3>
              <p className="text-gray-600">
                Под руководством опытных наставников вы будете решать реальные задачи и создавать собственные проекты.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Download size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Учебные материалы</h3>
              <p className="text-gray-600">
                Вы получите доступ к специально разработанным учебным материалам, видеоурокам и дополнительным ресурсам.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Часто задаваемые вопросы</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ответы на популярные вопросы об обучении в ИИ Клубе
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-6 text-lg font-medium cursor-pointer">
                  <span>Действительно ли обучение полностью бесплатное?</span>
                  <span className="transition group-open:rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-700">
                  <p>Да, все образовательные программы ИИ Клуба Дмитрия Орлова абсолютно бесплатны. Наша миссия — сделать знания в области искусственного интеллекта доступными для каждого жителя Гродно.</p>
                </div>
              </details>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-6 text-lg font-medium cursor-pointer">
                  <span>Как выбрать подходящую программу обучения?</span>
                  <span className="transition group-open:rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-700">
                  <p>Ознакомьтесь с описанием каждой программы и выберите ту, которая соответствует вашим интересам и целям. Все программы подходят для начинающих и не требуют предварительной подготовки.</p>
                </div>
              </details>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-6 text-lg font-medium cursor-pointer">
                  <span>Как проходят занятия — онлайн или офлайн?</span>
                  <span className="transition group-open:rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-700">
                  <p>Мы предлагаем гибридный формат обучения. Теоретические занятия доступны онлайн, а практические воркшопы и встречи сообщества проходят в нашем офисе по адресу: г. Гродно, ул. Поповича 33.</p>
                </div>
              </details>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-6 text-lg font-medium cursor-pointer">
                  <span>Выдаете ли вы сертификаты по окончании обучения?</span>
                  <span className="transition group-open:rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-gray-700">
                  <p>Да, после успешного завершения программы обучения и выполнения всех практических заданий участники получают сертификат ИИ Клуба Дмитрия Орлова.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Add the RegistrationModal */}
      {selectedCourse && (
        <RegistrationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
        />
      )}
    </div>
  );
};

export default TrainingPage;
import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Star } from 'lucide-react';
import RegistrationModal from './RegistrationModal';
import { supabase } from '../lib/supabaseClient';

interface Program {
  id: string;
  title: string;
  description: string;
  duration: string;
  features: string[];
  image_url: string;
}

const EducationalPrograms: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string } | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationClick = (courseId: string, courseTitle: string) => {
    setSelectedCourse({ id: courseId, title: courseTitle });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка программ обучения...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Программы обучения ИИ</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Изучайте искусственный интеллект с помощью наших образовательных программ
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {programs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                Программы обучения скоро появятся
              </p>
            </div>
          ) : (
            programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-100 flex flex-col md:flex-row"
              >
                <div className="md:w-1/3 relative">
                  <img 
                    src={program.image_url} 
                    alt={program.title} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-semibold px-3 py-1 rounded-full">
                      {program.duration}
                    </span>
                  </div>
                </div>
                <div className="md:w-2/3 p-6">
                  <div className="flex items-center mb-2">
                    <span className="text-sm text-gray-500 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < 4 ? "text-yellow-500" : "text-gray-300"}
                        />
                      ))}
                      <span className="ml-2">4.0</span>
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900">{program.title}</h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <ul className="space-y-2 mb-6">
                    {program.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle size={18} className="text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => handleRegistrationClick(program.id, program.title)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-center font-medium py-2 px-6 rounded-lg transition-colors duration-300 flex items-center justify-center"
                    >
                      Записаться на курс
                      <ArrowRight size={18} className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedCourse && (
        <RegistrationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
        />
      )}
    </section>
  );
};

export default EducationalPrograms;
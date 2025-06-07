import React from 'react';
import { Code, Lightbulb, Brain, CheckCircle, Share2, Zap } from 'lucide-react';

const VibeCodePage: React.FC = () => {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-900 to-purple-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Вайб-код</h1>
            <p className="text-xl opacity-90">
              Инновационная методология, объединяющая технические навыки с творческим мышлением
            </p>
          </div>
        </div>
      </section>

      {/* What is Vibe-Code */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              <div className="md:w-1/2">
                <h2 className="text-3xl font-bold mb-4 text-gray-900">Что такое Вайб-код?</h2>
                <p className="text-lg text-gray-700 mb-4">
                  Вайб-код — это уникальная методология, разработанная Дмитрием Орловым, которая объединяет технические аспекты работы с ИИ и творческий подход к решению задач.
                </p>
                <p className="text-lg text-gray-700">
                  Это не просто набор правил или принципов, а целостная философия, которая помогает создавать более эффективные и инновационные решения в области искусственного интеллекта.
                </p>
              </div>
              <div className="md:w-1/2">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg blur-sm opacity-75"></div>
                  <div className="relative bg-white p-6 rounded-lg">
                    <img 
                      src="https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                      alt="Vibe-Code concept" 
                      className="rounded-lg shadow-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                Вайб-код основан на понимании того, что успешная работа с искусственным интеллектом требует не только технических знаний, но и развитого интуитивного мышления, креативности и глубокого понимания контекста.
              </p>
              <p>
                Эта методология помогает участникам ИИ Клуба развивать целостный подход к технологиям, объединяя аналитическое и творческое мышление для создания более совершенных решений.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Principles */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Ключевые принципы Вайб-кода</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Философия, которая лежит в основе нашего подхода к обучению и работе с искусственным интеллектом
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Brain size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Целостное мышление</h3>
              <p className="text-gray-700">
                Объединение логического и интуитивного подходов к решению задач, рассмотрение проблем в широком контексте.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Lightbulb size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Творческая адаптация</h3>
              <p className="text-gray-700">
                Способность творчески адаптировать существующие технологии и методы для создания новых, нестандартных решений.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Code size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Технический фундамент</h3>
              <p className="text-gray-700">
                Глубокое понимание технических основ и принципов работы искусственного интеллекта как базы для творчества.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Share2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Открытый обмен идеями</h3>
              <p className="text-gray-700">
                Культура обмена знаниями и идеями, которая способствует коллективному развитию и инновациям.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Практическая ценность</h3>
              <p className="text-gray-700">
                Фокус на создании решений, которые имеют реальную практическую ценность и отвечают на конкретные потребности.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Этическое использование</h3>
              <p className="text-gray-700">
                Ответственный подход к использованию ИИ, учитывающий этические аспекты и потенциальное влияние на общество.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Use Vibe-Code */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 text-center">Как мы используем Вайб-код</h2>
            
            <div className="space-y-8">
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900">В образовательных программах</h3>
                <p className="text-gray-700">
                  Все курсы и мастер-классы ИИ Клуба строятся с учетом принципов Вайб-кода, объединяя технические знания с развитием творческого мышления. Участники не только изучают конкретные технологии, но и учатся мыслить нестандартно, находить новые подходы к решению задач.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900">В проектной работе</h3>
                <p className="text-gray-700">
                  При разработке проектов мы используем методологию Вайб-кода для создания инновационных решений. Это позволяет участникам клуба не просто применять готовые шаблоны, а разрабатывать уникальные подходы, которые лучше соответствуют конкретным задачам и контексту.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4 text-gray-900">В сообществе</h3>
                <p className="text-gray-700">
                  Философия Вайб-кода формирует культуру нашего сообщества, способствуя открытому обмену идеями, экспериментированию и инновациям. Мы создаем среду, где каждый участник может развивать не только технические навыки, но и творческое мышление.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Отзывы участников</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Что говорят участники ИИ Клуба о методологии Вайб-код
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Александр Иванов" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Александр Иванов</h4>
                  <p className="text-gray-600">Веб-разработчик</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Методология Вайб-код полностью изменила мой подход к работе с ИИ. Раньше я концентрировался только на технической стороне, но теперь я научился видеть более широкую картину и находить нестандартные решения."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Екатерина Смирнова" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Екатерина Смирнова</h4>
                  <p className="text-gray-600">Дизайнер UX/UI</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Для меня, как дизайнера, Вайб-код стал мостом между творческим и техническим мирами. Теперь я не просто создаю красивые интерфейсы, но и понимаю, как интегрировать в них возможности ИИ наиболее эффективным образом."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src="https://images.pexels.com/photos/3778603/pexels-photo-3778603.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Максим Петров" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Максим Петров</h4>
                  <p className="text-gray-600">Предприниматель</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Вайб-код — это то, чего не хватало в современном обучении ИИ. Этот подход позволяет видеть не только технологии, но и их потенциальное влияние на бизнес и общество. Для меня как предпринимателя это бесценно."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                    alt="Ольга Новикова" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Ольга Новикова</h4>
                  <p className="text-gray-600">Маркетолог</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "До знакомства с Вайб-кодом я думала, что ИИ — это что-то слишком сложное и техническое. Но этот подход сделал технологии понятными и показал, как их можно творчески применять в маркетинге. Это открыло для меня новые возможности."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VibeCodePage;
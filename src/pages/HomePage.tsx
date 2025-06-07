import React from 'react';
import Hero from '../components/Hero';
import Advantages from '../components/Advantages';
import EducationalPrograms from '../components/EducationalPrograms';
import CallToAction from '../components/CallToAction';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <Advantages />
      <EducationalPrograms />
      <CallToAction />
    </div>
  );
};

export default HomePage;
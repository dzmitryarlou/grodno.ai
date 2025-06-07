import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Brain } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsOpen(false);
  }, [location]);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Brain size={28} className="text-indigo-600" />
            <span className="text-xl font-bold text-gray-800">ИИ Клуб Дмитрия Орлова</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <NavLink to="/" label="Главная" isActive={location.pathname === '/'} />
            <NavLink to="/about" label="О нас" isActive={location.pathname === '/about'} />
            <NavLink to="/training" label="Обучение ИИ" isActive={location.pathname === '/training'} />
            <NavLink to="/vibe-code" label="Вайб-код" isActive={location.pathname === '/vibe-code'} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              {isOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'max-h-60 opacity-100 py-2' 
            : 'max-h-0 opacity-0 overflow-hidden'
        } bg-white`}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-3 pb-3">
          <MobileNavLink to="/" label="Главная" isActive={location.pathname === '/'} />
          <MobileNavLink to="/about" label="О нас" isActive={location.pathname === '/about'} />
          <MobileNavLink to="/training" label="Обучение ИИ" isActive={location.pathname === '/training'} />
          <MobileNavLink to="/vibe-code" label="Вайб-код" isActive={location.pathname === '/vibe-code'} />
        </div>
      </div>
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  label: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`font-medium text-base transition-colors duration-300 ${
        isActive 
          ? 'text-indigo-600 border-b-2 border-indigo-600' 
          : 'text-gray-700 hover:text-indigo-600'
      }`}
    >
      {label}
    </Link>
  );
};

const MobileNavLink: React.FC<NavLinkProps> = ({ to, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`block py-2 px-4 rounded transition-colors duration-300 ${
        isActive 
          ? 'bg-indigo-50 text-indigo-600' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );
};

export default Navbar;
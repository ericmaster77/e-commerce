// Header.js - CON DEBUG VISUAL TEMPORAL

import React, { useState } from 'react';
import { ShoppingCart, User, Search, Menu, X, Palette } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ currentView, setCurrentView, getTotalItems, setIsCartOpen, setIsLoginModalOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, classes, isMinimal, isColorful } = useTheme();

  // 🔍 DEBUG: Ver valores en consola
  React.useEffect(() => {
    console.log('🎨 Tema:', theme);
    console.log('⬛ Es minimal:', isMinimal);
    console.log('🖼️ Logo:', isMinimal ? "NEGRO" : "COLORIDO");
  }, [theme, isMinimal]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setCurrentView('home');
    }
  };

  // 🔍 Variable para debug visual
  const logoSrc = isMinimal ? "/logo-rosa-oliva-black.png" : "/logo-rosa-oliva.png";

  return (
    <header className={`${classes.header} sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer space-x-2 md:space-x-3" 
            onClick={() => setCurrentView('home')}
          >
            {/* 🔍 DEBUG VISUAL - QUITAR DESPUÉS */}
            <div className="absolute top-20 left-4 bg-yellow-200 p-2 text-xs z-50 rounded">
              Tema: {theme}<br/>
              Logo: {isMinimal ? "NEGRO" : "COLORIDO"}<br/>
              Src: {logoSrc}
            </div>

            <img 
              key={logoSrc} // ← Fuerza re-render
              src={logoSrc}
              alt="Rosa Oliva Logo" 
              className="w-10 h-10 md:w-12 md:h-12 object-contain transition-all duration-300"
              onError={(e) => {
                console.error('❌ Error cargando logo:', logoSrc);
                console.log('Intentando cargar fallback...');
                e.target.src = '/logo-rosa-oliva.png'; // Fallback
              }}
              onLoad={() => {
                console.log('✅ Logo cargado exitosamente:', logoSrc);
              }}
            />
            <div>
              <div className={`text-lg md:text-2xl font-bold ${classes.headerLogo} transition-colors`}>
                Rosa Oliva
              </div>
              <div className={`text-xs md:text-sm ${classes.headerText} -mt-1 transition-colors`}>
                Joyería
              </div>
            </div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-4 lg:space-x-6 items-center">
            <button 
              onClick={() => setCurrentView('home')}
              className={`text-sm lg:text-base font-medium transition-colors ${
                currentView === 'home' 
                  ? isMinimal ? 'text-black font-semibold' : 'text-rosa-primary font-semibold'
                  : `${classes.headerText} ${classes.linkHover}`
              }`}
            >
              Inicio
            </button>
            <button 
              onClick={() => setCurrentView('products')}
              className={`text-sm lg:text-base font-medium transition-colors ${
                currentView === 'products' 
                  ? isMinimal ? 'text-black font-semibold' : 'text-rosa-primary font-semibold'
                  : `${classes.headerText} ${classes.linkHover}`
              }`}
            >
              Productos
            </button>
            {user && isAdmin() && (
              <>
                <button 
                  onClick={() => setCurrentView('admin')}
                  className={`${classes.buttonAdmin} px-3 py-1 rounded text-sm transition-colors`}
                >
                  Admin
                </button>
                <button 
                  onClick={() => setCurrentView('qrGenerator')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  QR
                </button>
                <button 
                  onClick={() => setCurrentView('siteConfig')}
                  className={isMinimal 
                    ? 'bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors'
                    : 'bg-rosa-secondary text-white px-3 py-1 rounded text-sm hover:bg-rosa-dark transition-colors'
                  }
                >
                  Config
                </button>
              </>
            )}
            <button 
              onClick={() => setCurrentView('membership')}
              className={`text-sm lg:text-base font-medium transition-colors ${
                currentView === 'membership' 
                  ? isMinimal ? 'text-black font-semibold' : 'text-rosa-primary font-semibold'
                  : `${classes.headerText} ${classes.linkHover}`
              }`}
            >
              Membresía
            </button>
            <button 
              onClick={() => setCurrentView('about')}
              className={`text-sm lg:text-base font-medium transition-colors ${
                currentView === 'about' 
                  ? isMinimal ? 'text-black font-semibold' : 'text-rosa-primary font-semibold'
                  : `${classes.headerText} ${classes.linkHover}`
              }`}
            >
              Nosotros
            </button>

            {/* ✅ TOGGLE DE TEMA */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all ${
                isMinimal 
                  ? 'hover:bg-gray-100 text-gray-900' 
                  : 'hover:bg-rosa-light text-gray-700'
              }`}
              title={isMinimal ? 'Cambiar a tema colorido' : 'Cambiar a tema minimalista'}
            >
              <div className="relative">
                <Palette className="w-5 h-5" />
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
                  isMinimal 
                    ? 'bg-gray-900 border-white' 
                    : 'bg-gradient-to-r from-rosa-primary to-rosa-secondary border-white'
                }`} />
              </div>
            </button>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <button className={`p-2 rounded-full transition-colors hidden sm:block ${
              isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light'
            }`}>
              <Search className={`w-5 h-5 ${classes.headerText}`} />
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className={`text-xs md:text-sm ${classes.headerText} hidden lg:block`}>
                  Hola, {user.displayName}
                </span>
                {!user.emailVerified && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hidden lg:block">
                    Verificar email
                  </span>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-xs md:text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className={`p-2 rounded-full transition-colors ${
                  isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light'
                }`}
              >
                <User className={`w-5 h-5 ${classes.headerText}`} />
              </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 rounded-full transition-colors ${
                isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light'
              }`}
            >
              <ShoppingCart className={`w-5 h-5 ${classes.headerText}`} />
              {getTotalItems() > 0 && (
                <span className={`absolute -top-1 -right-1 ${
                  isMinimal ? 'bg-black' : 'bg-rosa-primary'
                } text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold transition-colors`}>
                  {getTotalItems()}
                </span>
              )}
            </button>

            <button
              onClick={toggleTheme}
              className={`md:hidden p-2 rounded-full transition-colors ${
                isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light'
              }`}
            >
              <Palette className={`w-5 h-5 ${classes.headerText}`} />
            </button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-full transition-colors ${
                isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light'
              }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className={`md:hidden border-t py-4 space-y-1 ${
            isMinimal ? 'border-gray-200' : 'border-gray-200'
          }`}>
            <button 
              onClick={() => {setCurrentView('home'); setIsMenuOpen(false);}}
              className={`block w-full text-left py-3 px-4 rounded transition-colors ${
                classes.headerText
              } ${isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light hover:text-rosa-primary'}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => {setCurrentView('products'); setIsMenuOpen(false);}}
              className={`block w-full text-left py-3 px-4 rounded transition-colors ${
                classes.headerText
              } ${isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light hover:text-rosa-primary'}`}
            >
              Productos
            </button>
            {user && isAdmin() && (
              <>
                <button 
                  onClick={() => {setCurrentView('admin'); setIsMenuOpen(false);}}
                  className={`block w-full text-left py-3 px-4 rounded transition-colors ${classes.buttonAdmin}`}
                >
                  Admin
                </button>
                <button 
                  onClick={() => {setCurrentView('qrGenerator'); setIsMenuOpen(false);}}
                  className="block w-full text-left py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                >
                  QR Tienda
                </button>
                <button 
                  onClick={() => {setCurrentView('siteConfig'); setIsMenuOpen(false);}}
                  className={`block w-full text-left py-3 px-4 rounded transition-colors ${
                    isMinimal 
                      ? 'bg-gray-700 text-white hover:bg-gray-800'
                      : 'bg-rosa-secondary text-white hover:bg-rosa-dark'
                  }`}
                >
                  Configuración
                </button>
              </>
            )}
            <button 
              onClick={() => {setCurrentView('membership'); setIsMenuOpen(false);}}
              className={`block w-full text-left py-3 px-4 rounded transition-colors ${
                classes.headerText
              } ${isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light hover:text-rosa-primary'}`}
            >
              Membresía
            </button>
            <button 
              onClick={() => {setCurrentView('about'); setIsMenuOpen(false);}}
              className={`block w-full text-left py-3 px-4 rounded transition-colors ${
                classes.headerText
              } ${isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light hover:text-rosa-primary'}`}
            >
              Nosotros
            </button>
            
            <button
              onClick={toggleTheme}
              className={`flex items-center justify-between w-full py-3 px-4 rounded transition-colors ${
                isMinimal 
                  ? 'bg-gray-100 hover:bg-gray-200' 
                  : 'bg-rosa-light hover:bg-rosa-primary hover:text-white'
              }`}
            >
              <span className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  {isMinimal ? 'Tema Colorido' : 'Tema Minimalista'}
                </span>
              </span>
              <span className="text-xs opacity-70">
                {isMinimal ? '🎨' : '⬛'}
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
// src/App.js - CON INTEGRACIÓN DE QR, BÚSQUEDA POR SKU Y SISTEMA DE TEMAS
import React, { useState, useEffect, createContext, useContext } from 'react';
import { ShoppingCart, User, Search, Menu, X, Plus, Minus, Star, Filter, MapPin, Phone, Mail, Palette } from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import BannerCarousel from './components/BannerCarousel';
import SiteConfigPanel from './components/SiteConfigPanel';
import ProductSearch from './components/ProductSearch';
import QRGenerator from './components/QRGenerator';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useProducts, useFeaturedProducts, useDataInitialization } from './hooks/useFirestore';
import { usePricing } from './hooks/usePricing';
import { useSiteConfig } from './hooks/useSiteConfig';

// Context para el carrito de compras
const CartContext = createContext();

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getTotalItems,
      getTotalPrice,
      clearCart,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};

// ✅ Componente Header CON SISTEMA DE TEMAS
const Header = ({ currentView, setCurrentView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { getTotalItems, setIsCartOpen } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, classes, isMinimal } = useTheme();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      setCurrentView('home');
    }
  };

  return (
    <>
      <header className={`${classes.header} sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer space-x-2 md:space-x-3" 
              onClick={() => setCurrentView('home')}
            >
              <img 
                src="/logo-rosa-oliva.png" 
                alt="Rosa Oliva Logo" 
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
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

              {/* ✅ TOGGLE DE TEMA - DESKTOP */}
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

              {/* ✅ TOGGLE DE TEMA - MOBILE ICON */}
              <button
                onClick={toggleTheme}
                className={`md:hidden p-2 rounded-full transition-colors ${
                  isMinimal ? 'hover:bg-gray-100' : 'hover:bg-rosa-light'
                }`}
                title={isMinimal ? 'Cambiar a tema colorido' : 'Cambiar a tema minimalista'}
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
              
              {/* ✅ TOGGLE DE TEMA - MOBILE MENU */}
              <button
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
};

// Componente ProductCard - SIN CAMBIOS
// Componente ProductCard actualizado con temas
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { getPricingInfo, getPricingLevelText, getMembershipBenefits } = usePricing();
  const { classes } = useTheme(); // ✅ AGREGAR

  const pricingInfo = getPricingInfo(product);
  const membershipBenefits = getMembershipBenefits(product);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const getImageToShow = () => {
    if (product.hasRealImage && product.imageUrl && !product.imageUrl.includes('placeholder') && !imageError) {
      return product.imageUrl;
    }
    return null;
  };

  const imageToShow = getImageToShow();

  return (
    <div className={classes.card}>
      {product.featured && (
        <div className={`${classes.cardBadgeFeatured} text-xs px-2 py-1 absolute z-10 m-2 rounded`}>
          Destacado
        </div>
      )}
      {pricingInfo?.hasDiscount && (
        <div className={`${classes.cardBadgeDiscount} text-xs px-2 py-1 absolute z-10 m-2 mt-8 rounded`}>
          -{pricingInfo.discount}%
        </div>
      )}
      
      <div className="relative h-48 sm:h-56 md:h-64 bg-gray-200">
        {imageToShow ? (
          <div className="relative w-full h-full">
            {imageLoading && (
              <div className={`absolute inset-0 ${classes.placeholderGradient} flex items-center justify-center`}>
                <div className="animate-pulse">
                  <div className={`${classes.placeholderText} text-4xl`}>📸</div>
                  <div className={`text-xs ${classes.placeholderText} mt-2`}>Cargando...</div>
                </div>
              </div>
            )}
            <img 
              src={imageToShow} 
              alt={product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {product.hasRealImage && !imageError && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                📸
              </div>
            )}
          </div>
        ) : (
          <div className={`absolute inset-0 ${classes.placeholderGradient} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`${classes.placeholderText} text-5xl md:text-6xl mb-2`}>✨</div>
              <div className={`${classes.placeholderText} text-xs font-medium`}>Rosa Oliva</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 md:p-4">
        <h3 className={`${classes.productTitle} font-semibold mb-2 text-sm md:text-base line-clamp-2`}>
          {product.name}
        </h3>
        <p className={`${classes.productDescription} text-xs md:text-sm mb-3 line-clamp-2`}>
          {product.description}
        </p>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 md:w-4 md:h-4 ${
                  i < Math.floor(product.rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          <span className="text-xs md:text-sm text-gray-600 ml-2">({product.rating})</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className={`${classes.productPrice} text-base md:text-lg font-bold`}>
                ${(product.price || product.pricing?.public || 0).toLocaleString()}
              </span>
              {product.originalPrice > 0 && product.originalPrice > product.price && (
                <span className="text-xs md:text-sm text-gray-500 line-through">
                  ${product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            
            <div className={`text-xs ${classes.productPriceLabel} font-medium`}>
              {getPricingLevelText()}
            </div>
            
            {pricingInfo?.userLevel === 'public' && membershipBenefits?.memberSavings > 0 && (
              <div className="text-xs text-green-600">
                Socios ahorran: ${membershipBenefits.memberSavings.toLocaleString()}
              </div>
            )}
          </div>
          <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap ml-2">
            {product.stock} disp.
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1 md:space-x-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Minus className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <span className="w-6 md:w-8 text-center text-sm md:text-base">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
              product.stock === 0 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : classes.buttonAddToCart
            }`}
          >
            {product.stock === 0 ? 'Agotado' : 'Agregar'}
          </button>
        </div>

        {product.sku && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            SKU: {product.sku}
            {product.excel?.lote && ` • Lote: ${product.excel.lote}`}
          </div>
        )}
      </div>
    </div>
  );
};
// Componente Home - SIN CAMBIOS
// Componente Home actualizado con temas
const Home = ({ setCurrentView }) => {
  const { featuredProducts, loading, error } = useFeaturedProducts();
  const { initializeData, initializing } = useDataInitialization();
  const { classes } = useTheme(); // ✅ AGREGAR ESTO

  const handleInitializeData = async () => {
    const result = await initializeData();
    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Cargando productos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg text-red-600 mb-4">Error al cargar productos</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className={`${classes.buttonPrimary} px-4 py-2 rounded`}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <BannerCarousel />
      </section>

      {/* Hero Section */}
      <section className={`${classes.hero} py-12 md:py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`${classes.heroTitle} text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6`}>
              Rosa Oliva Joyería
            </h1>
            <p className={`${classes.heroSubtitle} text-lg md:text-xl mb-6 md:mb-8`}>
              Un Legado que Impulsa Nuevos Comienzos
            </p>
            <p className={`${classes.heroText} text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto px-4`}>
              Descubre la esencia de nuestra marca, inspirada en una filosofía de vida que transforma sueños en realidades.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <button 
                onClick={() => setCurrentView('products')}
                className={`${classes.buttonPrimary} px-6 md:px-8 py-3 rounded-lg text-base md:text-lg`}
              >
                Ver Productos
              </button>
              <button 
                onClick={() => setCurrentView('membership')}
                className={`${classes.buttonSecondary} px-6 md:px-8 py-3 rounded-lg text-base md:text-lg`}
              >
                Conocer Membresía
              </button>
            </div>

            {featuredProducts.length === 0 && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                <p className="text-blue-700 mb-4 text-sm md:text-base">
                  ¿Primera vez? Inicializa la base de datos con productos de ejemplo
                </p>
                <button
                  onClick={handleInitializeData}
                  disabled={initializing}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm md:text-base"
                >
                  {initializing ? 'Inicializando...' : 'Agregar Productos de Ejemplo'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`${classes.sectionTitle} text-2xl md:text-3xl font-bold mb-3 md:mb-4`}>
              Productos Destacados
            </h2>
            <p className={`${classes.sectionSubtitle} text-base md:text-lg`}>
              Nuestras piezas más populares y exclusivas
            </p>
          </div>
          
          {featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {featuredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              <div className="text-center mt-8 md:mt-12">
                <button 
                  onClick={() => setCurrentView('products')}
                  className={`${classes.buttonPrimary} px-6 md:px-8 py-3 rounded-lg text-sm md:text-base`}
                >
                  Ver Todos los Productos
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-500 text-base md:text-lg">
                No hay productos destacados disponibles
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Mission Section */}
      <section className={`${classes.sectionBg} py-12 md:py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className={`${classes.sectionTitle} text-2xl md:text-3xl font-bold mb-3 md:mb-4`}>
              Nuestra Misión
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className={classes.missionCard}>
              <div className={classes.missionIcon}>
                <div className="text-white text-2xl md:text-3xl">💡</div>
              </div>
              <h3 className={`${classes.missionTitle} text-lg md:text-xl font-semibold mb-3`}>Inspirar</h3>
              <p className={`${classes.missionText} text-sm md:text-base`}>
                A personas a encontrar su propio camino, impulsadas por el legado de Rosa Oliva.
              </p>
            </div>
            
            <div className={classes.missionCard}>
              <div className={classes.missionIcon}>
                <div className="text-white text-2xl md:text-3xl">🤝</div>
              </div>
              <h3 className={`${classes.missionTitle} text-lg md:text-xl font-semibold mb-3`}>Acompañar</h3>
              <p className={`${classes.missionText} text-sm md:text-base`}>
                Brindando herramientas y conocimientos para construir sus sueños desde cero.
              </p>
            </div>
            
            <div className={classes.missionCard}>
              <div className={classes.missionIcon}>
                <div className="text-white text-2xl md:text-3xl">🎯</div>
              </div>
              <h3 className={`${classes.missionTitle} text-lg md:text-xl font-semibold mb-3`}>Capacitar</h3>
              <p className={`${classes.missionText} text-sm md:text-base`}>
                Para que alcancen la libertad y el éxito que merecen, en cualquier lugar del mundo.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Mantener todos los demás componentes (Products, LoginModal, Cart, Membership, About, Footer)
const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('featured');
  const { products, loading, error } = useProducts();
  const { classes } = useTheme(); // ✅ AGREGAR
  
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  
  let filteredProducts = products;
  if (selectedCategory !== 'Todos') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }
  
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      default: return b.featured - a.featured;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">Cargando productos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-lg text-red-600 mb-4">Error al cargar productos</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className={`${classes.buttonPrimary} px-4 py-2 rounded`}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className={`${classes.sectionTitle} text-2xl md:text-3xl font-bold mb-4`}>
          Nuestros Productos
        </h1>
        <p className={`${classes.sectionSubtitle} text-base md:text-lg`}>
          Explora nuestra colección de joyería de alta calidad
        </p>
      </div>

      <div className={`flex flex-col lg:flex-row gap-4 mb-8 p-4 ${classes.filterBg} rounded-lg`}>
        <div className="flex-1">
          <label className={`${classes.filterLabel} block text-sm font-medium mb-2`}>
            Categoría
          </label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full p-2 ${classes.filterInput} ${classes.filterInputFocus}`}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className={`${classes.filterLabel} block text-sm font-medium mb-2`}>
            Ordenar por
          </label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`w-full p-2 ${classes.filterInput} ${classes.filterInputFocus}`}
          >
            <option value="featured">Destacados</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="rating">Mejor Calificados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-500 text-lg">
            No se encontraron productos en esta categoría
          </p>
        </div>
      )}
    </div>
  );
};

const LoginModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  const { login, register, resetPassword, authError, clearAuthError } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearAuthError();

    try {
      let result;
      if (showResetPassword) {
        result = await resetPassword(email);
        if (result.success) {
          alert('Email de recuperación enviado. Revisa tu bandeja de entrada.');
          setShowResetPassword(false);
          setEmail('');
        }
      } else if (isSignUp) {
        result = await register(email, password, displayName);
        if (result.success) {
          alert(result.message);
          onClose();
          resetForm();
        }
      } else {
        result = await login(email, password);
        if (result.success) {
          onClose();
          resetForm();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setShowResetPassword(false);
    clearAuthError();
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {showResetPassword ? 'Recuperar Contraseña' : 
               isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-primary focus:border-rosa-primary"
                required
                disabled={isLoading}
              />
            </div>
            
            {!showResetPassword && (
              <>
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-primary focus:border-rosa-primary"
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rosa-primary focus:border-rosa-primary"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-rosa-primary text-white py-3 rounded-lg hover:bg-rosa-dark transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Procesando...' : 
               showResetPassword ? 'Enviar Email' :
               isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {!showResetPassword && (
              <>
                <button
                  onClick={() => {setIsSignUp(!isSignUp); clearAuthError();}}
                  className="text-rosa-primary hover:text-rosa-dark text-sm"
                  disabled={isLoading}
                >
                  {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
                
                {!isSignUp && (
                  <div>
                    <button
                      onClick={() => {setShowResetPassword(true); clearAuthError();}}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                      disabled={isLoading}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}
              </>
            )}
            
            {showResetPassword && (
              <button
                onClick={() => {setShowResetPassword(false); clearAuthError();}}
                className="text-rosa-primary hover:text-rosa-dark text-sm"
                disabled={isLoading}
              >
                Volver al login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const { classes } = useTheme(); // ✅ AGREGAR

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    alert('¡Procesando compra! En una implementación real, aquí se integraría con un sistema de pagos.');
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md ${classes.cartBg} shadow-xl`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center justify-between p-4 ${classes.cartHeader}`}>
            <h2 className={`${classes.sectionTitle} text-lg font-semibold`}>
              Carrito de Compras
            </h2>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 border-b pb-4">
                    <div className={`w-16 h-16 ${classes.placeholderGradient} rounded-lg flex items-center justify-center`}>
                      {item.imageUrl && item.imageUrl !== '/api/placeholder/300/300' ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className={`${classes.placeholderText} text-2xl`}>✨</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`${classes.productTitle} font-medium text-sm`}>
                        {item.name}
                      </h3>
                      <p className={`${classes.cartTotal} font-semibold`}>
                        ${item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 text-sm ml-2"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t p-4">
              <div className="flex justify-between items-center mb-4">
                <span className={`${classes.sectionTitle} text-lg font-semibold`}>Total:</span>
                <span className={`${classes.cartTotal} text-xl font-bold`}>
                  ${getTotalPrice().toLocaleString()}
                </span>
              </div>
              <button 
                onClick={handleCheckout}
                className={`${classes.cartButton} w-full py-3 rounded-lg transition-colors shadow-lg`}
              >
                Procesar Compra
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Membership = () => {
  const { classes } = useTheme(); // ✅ AGREGAR

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8 md:mb-12">
        <h1 className={`${classes.sectionTitle} text-2xl md:text-3xl font-bold mb-4`}>
          Membresía "Socio Rosa Oliva"
        </h1>
        <p className={`${classes.sectionSubtitle} text-base md:text-lg`}>
          Únete a nuestra comunidad y obtén beneficios exclusivos
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className={classes.membershipCard}>
          <div className="text-center mb-8">
            <div className={`${classes.membershipPrice} text-3xl md:text-4xl font-bold mb-2`}>
              $500 MXN
            </div>
            <div className="text-base md:text-lg text-gray-600">Anual</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Beneficio 1 */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className={classes.membershipCheckmark}>
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className={`${classes.sectionTitle} font-semibold`}>
                    Precios Especiales
                  </h3>
                  <p className={`${classes.missionText} text-sm`}>
                    Acceso a tarifas de medio mayoreo y mayoreo desde tu primera compra.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className={classes.membershipCheckmark}>
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className={`${classes.sectionTitle} font-semibold`}>
                    Catálogos Digitales Exclusivos
                  </h3>
                  <p className={`${classes.missionText} text-sm`}>
                    Mantente al día con nuestras últimas colecciones y tendencias.
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficio 2 */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className={classes.membershipCheckmark}>
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className={`${classes.sectionTitle} font-semibold`}>
                    Cashback del 5%
                  </h3>
                  <p className={`${classes.missionText} text-sm`}>
                    Recibe un 5% de tu compra de vuelta, aplicable en futuras adquisiciones.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className={classes.membershipCheckmark}>
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className={`${classes.sectionTitle} font-semibold`}>
                    Preventas y Eventos Exclusivos
                  </h3>
                  <p className={`${classes.missionText} text-sm`}>
                    Sé el primero en conocer nuestras novedades y participa en capacitaciones.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button className={`${classes.buttonPrimary} px-6 md:px-8 py-3 rounded-lg text-base md:text-lg`}>
              Obtener Membresía
            </button>
          </div>
        </div>

        {/* Paquetes de compra */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className={`${classes.sectionTitle} text-lg md:text-xl font-semibold mb-3`}>
              Venta a Medio Mayoreo
            </h3>
            <p className={`${classes.missionText} mb-4 text-sm md:text-base`}>
              Para compras mínimas de $2,500 MXN, obtén un 25% de descuento.
            </p>
            <div className={`${classes.membershipCard} p-3 rounded`}>
              <div className={`${classes.membershipPrice} font-semibold`}>
                25% de descuento
              </div>
              <div className="text-sm text-gray-600">Compra mínima: $2,500 MXN</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className={`${classes.sectionTitle} text-lg md:text-xl font-semibold mb-3`}>
              Venta a Mayoreo
            </h3>
            <p className={`${classes.missionText} mb-4 text-sm md:text-base`}>
              Si tu compra mínima es de $5,000 MXN, te ofrecemos un 50% de descuento.
            </p>
            <div className={`${classes.membershipCard} p-3 rounded`}>
              <div className={`${classes.membershipPrice} font-semibold`}>
                50% de descuento
              </div>
              <div className="text-sm text-gray-600">Compra mínima: $5,000 MXN</div>
            </div>
          </div>
        </div>

        <div className={`${classes.sectionBg} p-6 rounded-lg text-center`}>
          <p className={`${classes.sectionSubtitle} text-base md:text-lg`}>
            Ideal para clientes frecuentes o para quienes buscan iniciar su propio negocio 
            de joyería con el respaldo de Rosa Oliva.
          </p>
        </div>
      </div>
    </div>
  );
};

const About = () => {
  const { classes } = useTheme(); // ✅ AGREGAR

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8 md:mb-12">
        <h1 className={`${classes.sectionTitle} text-2xl md:text-3xl font-bold mb-4`}>
          Nuestra Historia
        </h1>
        <p className={`${classes.sectionSubtitle} text-base md:text-lg`}>
          Conoce el legado que inspira todo lo que hacemos
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Historia */}
        <div className={classes.aboutCard}>
          <h2 className={`${classes.sectionTitle} text-xl md:text-2xl font-bold mb-6`}>
            El Legado de Rosa Oliva
          </h2>
          <div className={`space-y-4 ${classes.missionText} text-sm md:text-base`}>
            <p>
              Rosa Oliva Joyería es un homenaje vivo a nuestra madre Rosa Oliva. Una mujer 
              incansable que creyó firmemente en el poder de la autosuficiencia. Con dedicación, 
              siempre encontró la manera de emprender, vendiendo joyería y ropa para forjarnos 
              un futuro mejor.
            </p>
            <p>
              Tras su partida en 2021, nos heredó una filosofía de vida:
            </p>
            <blockquote className={classes.aboutQuote}>
              "Enseñar a pescar es más valioso que dar el pescado."
            </blockquote>
            <p>
              Hoy, esta enseñanza guía cada paso de nuestra empresa, transformando su ejemplo 
              en oportunidades reales para las personas.
            </p>
          </div>
        </div>

        {/* Visión */}
        <div className={classes.membershipCard}>
          <h2 className={`${classes.sectionTitle} text-xl md:text-2xl font-bold mb-6`}>
            Nuestra Visión
          </h2>
          <p className={`${classes.missionText} text-base md:text-lg mb-8`}>
            Construir una comunidad global de empresarios, inspirados en el legado de Rosa Oliva, 
            que empodere a las personas en cada rincón del mundo.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className={classes.missionIcon}>
                <div className="text-white text-2xl">💡</div>
              </div>
              <div className={`${classes.sectionTitle} font-semibold text-sm md:text-base`}>
                Inspiración
              </div>
            </div>
            <div className="p-4">
              <div className={classes.missionIcon}>
                <div className="text-white text-2xl">🚀</div>
              </div>
              <div className={`${classes.sectionTitle} font-semibold text-sm md:text-base`}>
                Emprender
              </div>
            </div>
            <div className="p-4">
              <div className={classes.missionIcon}>
                <div className="text-white text-2xl">🌟</div>
              </div>
              <div className={`${classes.sectionTitle} font-semibold text-sm md:text-base`}>
                Nuevos comienzos
              </div>
            </div>
            <div className="p-4">
              <div className={classes.missionIcon}>
                <div className="text-white text-2xl">🌍</div>
              </div>
              <div className={`${classes.sectionTitle} font-semibold text-sm md:text-base`}>
                Comunidad global
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className={classes.aboutCard}>
          <h2 className={`${classes.sectionTitle} text-xl md:text-2xl font-bold mb-6`}>
            Contáctanos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={classes.contactIcon}>
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className={`${classes.sectionTitle} font-semibold mb-2`}>Ubicación</h3>
              <p className={`${classes.missionText} text-sm`}>Oaxaca, México</p>
            </div>
            <div className="text-center">
              <div className={classes.contactIcon}>
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className={`${classes.sectionTitle} font-semibold mb-2`}>Teléfono</h3>
              <p className={`${classes.missionText} text-sm`}>+52 951 426 4996</p>
            </div>
            <div className="text-center">
              <div className={classes.contactIcon}>
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className={`${classes.sectionTitle} font-semibold mb-2`}>Email</h3>
              <p className={`${classes.missionText} text-sm`}>info@rosaolivajoyeria.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Footer actualizado con temas
const Footer = () => {
  const { config, loading } = useSiteConfig();
  const { classes } = useTheme(); // ✅ AGREGAR
  const socialMedia = config?.socialMedia || {};

  return (
    <footer className={classes.footer}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Logo y descripción */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/logo-rosa-oliva.png" 
                alt="Rosa Oliva Logo" 
                className="w-10 h-10 object-contain"
              />
              <div className={`${classes.footerLogo} text-xl md:text-2xl font-bold`}>
                Rosa Oliva
              </div>
            </div>
            <p className={`${classes.footerText} text-sm`}>
              Un legado que impulsa nuevos comienzos a través de la joyería de calidad.
            </p>
          </div>
          
          {/* Enlaces */}
          <div>
            <h3 className={`${classes.footerTitle} text-base md:text-lg font-semibold mb-3 md:mb-4`}>
              Enlaces
            </h3>
            <ul className={`space-y-2 ${classes.footerText} text-sm`}>
              <li>
                <a href="#" className={classes.footerLink}>Inicio</a>
              </li>
              <li>
                <a href="#" className={classes.footerLink}>Productos</a>
              </li>
              <li>
                <a href="#" className={classes.footerLink}>Membresía</a>
              </li>
              <li>
                <a href="#" className={classes.footerLink}>Nosotros</a>
              </li>
            </ul>
          </div>
          
          {/* Soporte */}
          <div>
            <h3 className={`${classes.footerTitle} text-base md:text-lg font-semibold mb-3 md:mb-4`}>
              Soporte
            </h3>
            <ul className={`space-y-2 ${classes.footerText} text-sm`}>
              <li>
                <a href="#" className={classes.footerLink}>Contacto</a>
              </li>
              <li>
                <a href="#" className={classes.footerLink}>Envíos</a>
              </li>
              <li>
                <a href="#" className={classes.footerLink}>Devoluciones</a>
              </li>
              <li>
                <a href="#" className={classes.footerLink}>FAQ</a>
              </li>
            </ul>
          </div>
          
          {/* Redes Sociales */}
          <div>
            <h3 className={`${classes.footerTitle} text-base md:text-lg font-semibold mb-3 md:mb-4`}>
              Síguenos
            </h3>
            <div className="space-y-3">
              {socialMedia.facebook && (
                <a 
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 ${classes.footerText} ${classes.footerLink} text-sm`}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">f</span>
                  </div>
                  <span>Facebook</span>
                </a>
              )}
              
              {socialMedia.instagram && (
                <a 
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 ${classes.footerText} ${classes.footerLink} text-sm`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">📷</span>
                  </div>
                  <span>Instagram</span>
                </a>
              )}
              
              {socialMedia.whatsapp && (
                <a 
                  href={`https://wa.me/${socialMedia.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 ${classes.footerText} ${classes.footerLink} text-sm`}
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💬</span>
                  </div>
                  <span>WhatsApp</span>
                </a>
              )}
              
              {socialMedia.email && (
                <a 
                  href={`mailto:${socialMedia.email}`}
                  className={`flex items-center space-x-2 ${classes.footerText} ${classes.footerLink} text-sm`}
                >
                  <Mail className="w-5 h-5" />
                  <span className="truncate">{socialMedia.email}</span>
                </a>
              )}
              
              {socialMedia.phone && (
                <a 
                  href={`tel:${socialMedia.phone}`}
                  className={`flex items-center space-x-2 ${classes.footerText} ${classes.footerLink} text-sm`}
                >
                  <Phone className="w-5 h-5" />
                  <span>{socialMedia.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6 mt-8 text-center">
          <p className={`${classes.footerText} text-sm`}>
            &copy; {new Date().getFullYear()} Rosa Oliva Joyería. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ✅ Componente principal con routing Y SISTEMA DE TEMAS
const AppContent = () => {
  const [currentView, setCurrentView] = useState('home');
  const { user, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const { theme } = useTheme();

  // ✅ Detectar ruta de URL (para QR)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#/buscar-producto' || hash === '#buscar-producto') {
      setCurrentView('productSearch');
    }
  }, []);

  // ✅ Aplicar tema al body
  useEffect(() => {
    document.body.className = theme === 'minimal' ? 'theme-minimal' : 'theme-colorful';
  }, [theme]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'admin':
        return isAdmin() ? <AdminPanel /> : <div className="p-8 text-center">Acceso denegado</div>;
      case 'qrGenerator':
        return isAdmin() ? <QRGenerator /> : <div className="p-8 text-center">Acceso denegado</div>;
      case 'siteConfig':
        return isAdmin() ? <SiteConfigPanel /> : <div className="p-8 text-center">Acceso denegado</div>;
      case 'productSearch':
        return <ProductSearch onAddToCart={addToCart} onClose={() => setCurrentView('home')} />;
      case 'products':
        return <Products />;
      case 'membership':
        return <Membership />;
      case 'about':
        return <About />;
      default:
        return <Home setCurrentView={setCurrentView} />;
    }
  };

  // ✅ Si está en búsqueda de productos, NO mostrar header ni footer
  if (currentView === 'productSearch') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderCurrentView()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <Cart />
      {renderCurrentView()}
      <Footer />
    </div>
  );
};

// Componente raíz de la App
const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
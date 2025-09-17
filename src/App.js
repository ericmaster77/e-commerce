import React, { useState, useEffect, createContext, useContext } from 'react';
import { ShoppingCart, User, Search, Menu, X, Plus, Minus, Star, Filter, MapPin, Phone, Mail } from 'lucide-react';
import AdminPanel from './components/AdminPanel';

// Context para el carrito de compras
const CartContext = createContext();

// Hook personalizado para usar el contexto del carrito
const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

// Componente proveedor del carrito
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

// Datos de ejemplo de productos
const sampleProducts = [
  {
    id: 1,
    name: "Brazalete Dorado Elegance",
    price: 2500,
    originalPrice: 3500,
    discount: 28,
    category: "Brazaletes",
    image: "/api/placeholder/300/300",
    description: "Brazalete dorado con textura única, inspirado en el legado de Rosa Oliva",
    rating: 4.8,
    stock: 15,
    featured: true
  },
  {
    id: 2,
    name: "Anillo Esmeralda Premium",
    price: 4200,
    originalPrice: 5600,
    discount: 25,
    category: "Anillos",
    image: "/api/placeholder/300/300",
    description: "Anillo con esmeralda natural en oro de 18k",
    rating: 4.9,
    stock: 8,
    featured: true
  },
  {
    id: 3,
    name: "Collar Perlas Naturales",
    price: 3800,
    originalPrice: 4800,
    discount: 20,
    category: "Collares",
    image: "/api/placeholder/300/300",
    description: "Collar de perlas naturales con certificado de autenticidad",
    rating: 4.7,
    stock: 12,
    featured: false
  },
  {
    id: 4,
    name: "Aretes Diamantes Deluxe",
    price: 6500,
    originalPrice: 8000,
    discount: 18,
    category: "Aretes",
    image: "/api/placeholder/300/300",
    description: "Aretes con diamantes certificados en oro blanco",
    rating: 5.0,
    stock: 5,
    featured: true
  },
  {
    id: 5,
    name: "Pulsera Oro Rosa",
    price: 1800,
    originalPrice: 2200,
    discount: 18,
    category: "Pulseras",
    image: "/api/placeholder/300/300",
    description: "Pulsera elegante en oro rosa de 14k",
    rating: 4.6,
    stock: 20,
    featured: false
  },
  {
    id: 6,
    name: "Gargantilla Minimalista",
    price: 1200,
    originalPrice: 1500,
    discount: 20,
    category: "Collares",
    image: "/api/placeholder/300/300",
    description: "Gargantilla de diseño minimalista en plata sterling",
    rating: 4.5,
    stock: 25,
    featured: false
  }
];

// Componente Header
const Header = ({ user, onLogin, onLogout, currentView, setCurrentView, isAdmin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { getTotalItems, setIsCartOpen } = useCart();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="text-2xl font-bold text-amber-700">Rosa Oliva</div>
            <div className="text-sm text-gray-600 ml-2">Joyería</div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => setCurrentView('home')}
              className={`text-gray-700 hover:text-amber-700 ${currentView === 'home' ? 'text-amber-700 font-semibold' : ''}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => setCurrentView('products')}
              className={`text-gray-700 hover:text-amber-700 ${currentView === 'products' ? 'text-amber-700 font-semibold' : ''}`}
            >
              Productos
            </button>
            {user && isAdmin && (
              <button 
                onClick={() => setCurrentView('admin')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Admin
              </button>
            )}
            <button 
              onClick={() => setCurrentView('membership')}
              className={`text-gray-700 hover:text-amber-700 ${currentView === 'membership' ? 'text-amber-700 font-semibold' : ''}`}
            >
              Membresía
            </button>
            <button 
              onClick={() => setCurrentView('about')}
              className={`text-gray-700 hover:text-amber-700 ${currentView === 'about' ? 'text-amber-700 font-semibold' : ''}`}
            >
              Nosotros
            </button>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Search className="w-5 h-5 text-gray-700" />
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Hola, {user.name}</span>
                <button 
                  onClick={onLogout}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button 
                onClick={onLogin}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <User className="w-5 h-5 text-gray-700" />
              </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <button 
                onClick={() => {setCurrentView('home'); setIsMenuOpen(false);}}
                className="text-left py-2 px-4 text-gray-700 hover:text-amber-700 hover:bg-gray-50 rounded"
              >
                Inicio
              </button>
              <button 
                onClick={() => {setCurrentView('products'); setIsMenuOpen(false);}}
                className="text-left py-2 px-4 text-gray-700 hover:text-amber-700 hover:bg-gray-50 rounded"
              >
                Productos
              </button>
              <button 
                onClick={() => {setCurrentView('membership'); setIsMenuOpen(false);}}
                className="text-left py-2 px-4 text-gray-700 hover:text-amber-700 hover:bg-gray-50 rounded"
              >
                Membresía
              </button>
              <button 
                onClick={() => {setCurrentView('about'); setIsMenuOpen(false);}}
                className="text-left py-2 px-4 text-gray-700 hover:text-amber-700 hover:bg-gray-50 rounded"
              >
                Nosotros
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

// Componente ProductCard
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {product.featured && (
        <div className="bg-amber-600 text-white text-xs px-2 py-1 absolute z-10 m-2 rounded">
          Destacado
        </div>
      )}
      {product.discount > 0 && (
        <div className="bg-red-500 text-white text-xs px-2 py-1 absolute z-10 m-2 mt-8 rounded">
          -{product.discount}%
        </div>
      )}
      
      <div className="relative h-48 bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <div className="text-amber-700 text-6xl">✨</div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</span>
            {product.discount > 0 && (
              <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          <span className="text-sm text-gray-600">{product.stock} disponibles</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Cart
const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, isCartOpen, setIsCartOpen, clearCart } = useCart();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    alert('¡Procesando compra! En una implementación real, aquí se integraría con un sistema de pagos.');
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Carrito de Compras</h2>
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
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                      <div className="text-amber-700 text-2xl">✨</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-amber-700 font-semibold">${item.price.toLocaleString()}</p>
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
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-amber-700">${getTotalPrice().toLocaleString()}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors"
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

// Componente Home
const Home = ({ setCurrentView }) => {
  const featuredProducts = sampleProducts.filter(p => p.featured);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 to-amber-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Rosa Oliva Joyería
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Un Legado que Impulsa Nuevos Comienzos
            </p>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Descubre la esencia de nuestra marca, inspirada en una filosofía de vida que transforma sueños en realidades.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setCurrentView('products')}
                className="bg-amber-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-amber-700 transition-colors"
              >
                Ver Productos
              </button>
              <button 
                onClick={() => setCurrentView('membership')}
                className="border-2 border-amber-600 text-amber-700 px-8 py-3 rounded-lg text-lg hover:bg-amber-50 transition-colors"
              >
                Conocer Membresía
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Productos Destacados</h2>
            <p className="text-lg text-gray-600">Nuestras piezas más populares y exclusivas</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => setCurrentView('products')}
              className="bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Ver Todos los Productos
            </button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-sm md:text-2xl">💡</div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Inspirar</h3>
              <p className="text-gray-600 text-sm md:text-base">A personas a encontrar su propio camino, impulsadas por el legado de Rosa Oliva.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-sm md:text-2xl">🤝</div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Acompañar</h3>
              <p className="text-gray-600 text-sm md:text-base">Brindando herramientas y conocimientos para construir sus sueños desde cero.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-white text-sm md:text-2xl">🎯</div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Capacitar</h3>
              <p className="text-gray-600 text-sm md:text-base">Para que alcancen la libertad y el éxito que merecen, en cualquier lugar del mundo.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Componente Products
const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('featured');
  
  const categories = ['Todos', ...new Set(sampleProducts.map(p => p.category))];
  
  let filteredProducts = sampleProducts;
  if (selectedCategory !== 'Todos') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }
  
  // Sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      default: return b.featured - a.featured;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Nuestros Productos</h1>
        <p className="text-lg text-gray-600">Explora nuestra colección de joyería de alta calidad</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="featured">Destacados</option>
            <option value="price-low">Precio: Menor a Mayor</option>
            <option value="price-high">Precio: Mayor a Menor</option>
            <option value="rating">Mejor Calificados</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos en esta categoría</p>
        </div>
      )}
    </div>
  );
};

// Componente Membership
const Membership = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Membresía "Socio Rosa Oliva"</h1>
        <p className="text-lg text-gray-600">Únete a nuestra comunidad y obtén beneficios exclusivos</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-amber-700 mb-2">$500 MXN</div>
            <div className="text-lg text-gray-600">Anual</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Precios Especiales</h3>
                  <p className="text-gray-600 text-sm">Acceso a tarifas de medio mayoreo y mayoreo desde tu primera compra.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Catálogos Digitales Exclusivos</h3>
                  <p className="text-gray-600 text-sm">Mantente al día con nuestras últimas colecciones y tendencias.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cashback del 5%</h3>
                  <p className="text-gray-600 text-sm">Recibe un 5% de tu compra de vuelta, aplicable en futuras adquisiciones de mercancía.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="text-white text-sm">✓</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Preventas y Eventos Exclusivos</h3>
                  <p className="text-gray-600 text-sm">Sé el primero en conocer y adquirir nuestras novedades, y participa en capacitaciones.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-amber-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-amber-700 transition-colors">
              Obtener Membresía
            </button>
          </div>
        </div>

        {/* Business Models */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Venta a Medio Mayoreo</h3>
            <p className="text-gray-600 mb-4">Para compras mínimas de $2,500 MXN, obtén un 25% de descuento.</p>
            <div className="bg-amber-50 p-3 rounded">
              <div className="text-amber-700 font-semibold">25% de descuento</div>
              <div className="text-sm text-gray-600">Compra mínima: $2,500 MXN</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Venta a Mayoreo</h3>
            <p className="text-gray-600 mb-4">Si tu compra mínima es de $5,000 MXN, te ofrecemos un 50% de descuento.</p>
            <div className="bg-amber-50 p-3 rounded">
              <div className="text-amber-700 font-semibold">50% de descuento</div>
              <div className="text-sm text-gray-600">Compra mínima: $5,000 MXN</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-700 text-lg">
            Ideal para clientes frecuentes o para quienes buscan iniciar su propio negocio de joyería con el respaldo de Rosa Oliva.
          </p>
        </div>
      </div>
    </div>
  );
};

// Componente About
const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Nuestra Historia</h1>
        <p className="text-lg text-gray-600">Conoce el legado que inspira todo lo que hacemos</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Historia */}
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">El Legado de Rosa Oliva</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Rosa Oliva Joyería es un homenaje vivo a nuestra madre Rosa Oliva. Una mujer incansable que creyó firmemente en el poder de la autosuficiencia. Con dedicación, siempre encontró la manera de emprender, vendiendo joyería y ropa para forjarnos un futuro mejor.
            </p>
            <p>
              Tras su partida en 2021, nos heredó una filosofía de vida:
            </p>
            <blockquote className="border-l-4 border-amber-600 pl-4 italic text-lg text-amber-700">
              "Enseñar a pescar es más valioso que dar el pescado."
            </blockquote>
            <p>
              Hoy, esta enseñanza guía cada paso de nuestra empresa, transformando su ejemplo en oportunidades reales para las personas.
            </p>
          </div>
        </div>

        {/* Visión */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuestra Visión</h2>
          <p className="text-lg text-gray-700 mb-8">
            Construir una comunidad global de empresarios, inspirados en el legado de Rosa Oliva, que empodere a las personas en cada rincón del mundo.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="text-white text-2xl">💡</div>
              </div>
              <div className="font-semibold text-gray-900">Inspiración</div>
            </div>
            <div className="p-4">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="text-white text-2xl">🚀</div>
              </div>
              <div className="font-semibold text-gray-900">Emprender</div>
            </div>
            <div className="p-4">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="text-white text-2xl">🌟</div>
              </div>
              <div className="font-semibold text-gray-900">Nuevos comienzos</div>
            </div>
            <div className="p-4">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="text-white text-2xl">🌍</div>
              </div>
              <div className="font-semibold text-gray-900">Comunidad global</div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contáctanos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ubicación</h3>
              <p className="text-gray-600">Oaxaca, México</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Teléfono</h3>
              <p className="text-gray-600">+52 951 XXX XXXX</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">info@rosaolivajoyeria.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Login simple
const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulación de login
    onLogin({ name: email.split('@')[0], email });
    onClose();
    setEmail('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-amber-700 hover:text-amber-800"
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Footer
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold text-amber-400 mb-4">Rosa Oliva</div>
            <p className="text-gray-400">
              Un legado que impulsa nuevos comienzos a través de la joyería de calidad.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Inicio</a></li>
              <li><a href="#" className="hover:text-white">Productos</a></li>
              <li><a href="#" className="hover:text-white">Membresía</a></li>
              <li><a href="#" className="hover:text-white">Nosotros</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Contacto</a></li>
              <li><a href="#" className="hover:text-white">Envíos</a></li>
              <li><a href="#" className="hover:text-white">Devoluciones</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white">WhatsApp</a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
          <p>&copy; 2024 Rosa Oliva Joyería. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

// Componente Principal de la App
const App = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    // Simular admin
    if (userData.email === 'admin@rosaolivajoyeria.com') {
      setIsAdmin(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false); // RESETEA isAdmin al logout
  };

const renderCurrentView = () => {
  switch (currentView) {
    case 'admin':
      return isAdmin ? <AdminPanel /> : <div className="p-8 text-center">Acceso denegado</div>;
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

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={user}
          onLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isAdmin={isAdmin}
        />
        {/* AGREGA ESTO PARA MOSTRAR LAS VISTAS Y COMPONENTES PRINCIPALES */}
        <Cart />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
        />
        {renderCurrentView()}
        <Footer />
      </div>
    </CartProvider>
  );
};

export default App;
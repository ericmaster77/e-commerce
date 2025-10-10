// src/components/ProductSearch.js - Búsqueda rápida por código de anaquel
import React, { useState } from 'react';
import { Search, Package, MapPin, Star, ShoppingCart, X } from 'lucide-react';
import { useProducts } from '../hooks/useFirestore';
import { usePricing } from '../hooks/usePricing';

const ProductSearch = ({ onAddToCart, onClose }) => {
  const [searchCode, setSearchCode] = useState('');
  const [foundProduct, setFoundProduct] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { products, loading } = useProducts();
  const { getPricingInfo, getPricingLevelText, getMembershipBenefits } = usePricing();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearching(true);
    setNotFound(false);
    setFoundProduct(null);

    // Buscar producto por SKU (código de anaquel)
    setTimeout(() => {
      const product = products.find(p => 
        p.sku?.toLowerCase() === searchCode.trim().toLowerCase()
      );

      if (product) {
        setFoundProduct(product);
      } else {
        setNotFound(true);
      }
      setSearching(false);
    }, 300);
  };

  const handleAddToCart = () => {
    if (foundProduct && onAddToCart) {
      onAddToCart(foundProduct, 1);
      alert('¡Producto agregado al carrito!');
    }
  };

  const resetSearch = () => {
    setSearchCode('');
    setFoundProduct(null);
    setNotFound(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rosa-light to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rosa-light to-white">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rosa-primary to-rosa-secondary rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-rosa-dark">Rosa Oliva</h1>
              <p className="text-xs text-gray-600">Búsqueda de Productos</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Instrucciones */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-rosa-primary rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¡Bienvenido a Rosa Oliva!
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                Para ver la información completa del producto que te interesa:
              </p>
              <ol className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="bg-rosa-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">1</span>
                  <span>Busca el <strong>código del producto</strong> en el anaquel de la tienda</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-rosa-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">2</span>
                  <span>Ingresa el código en el cuadro de búsqueda abajo</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-rosa-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">3</span>
                  <span>¡Descubre todos los detalles y el precio!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Código del Producto (SKU)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    placeholder="Ej: BR-001, COL-045, AR-123"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-rosa-primary focus:ring-2 focus:ring-rosa-primary focus:ring-opacity-20 text-lg font-mono"
                    disabled={searching}
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchCode.trim()}
                  className="px-6 py-3 bg-rosa-primary text-white rounded-lg hover:bg-rosa-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                >
                  {searching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 El código aparece en la etiqueta del producto en el anaquel
              </p>
            </div>

            {foundProduct && (
              <button
                type="button"
                onClick={resetSearch}
                className="text-sm text-rosa-primary hover:text-rosa-dark"
              >
                ← Buscar otro producto
              </button>
            )}
          </form>
        </div>

        {/* Resultado - Producto no encontrado */}
        {notFound && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <div className="text-5xl mb-3">😕</div>
            <h3 className="text-xl font-bold text-red-900 mb-2">
              Producto no encontrado
            </h3>
            <p className="text-red-700 mb-4">
              No encontramos ningún producto con el código <strong>{searchCode}</strong>
            </p>
            <div className="bg-white rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Verifica que:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• El código esté escrito correctamente</li>
                <li>• Incluyas guiones si los tiene (ej: BR-001)</li>
                <li>• El producto esté disponible en nuestro catálogo</li>
              </ul>
            </div>
            <button
              onClick={resetSearch}
              className="mt-4 text-rosa-primary hover:text-rosa-dark font-medium"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Resultado - Producto encontrado */}
        {foundProduct && (
          <ProductDetailCard 
            product={foundProduct}
            onAddToCart={handleAddToCart}
            getPricingInfo={getPricingInfo}
            getPricingLevelText={getPricingLevelText}
            getMembershipBenefits={getMembershipBenefits}
          />
        )}
      </div>
    </div>
  );
};

// Componente de detalle del producto
const ProductDetailCard = ({ product, onAddToCart, getPricingInfo, getPricingLevelText, getMembershipBenefits }) => {
  const [imageError, setImageError] = useState(false);
  const pricingInfo = getPricingInfo(product);
  const membershipBenefits = getMembershipBenefits(product);

  const imageToShow = product.hasRealImage && product.imageUrl && !product.imageUrl.includes('placeholder') && !imageError
    ? product.imageUrl
    : null;

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in">
      {/* Banner de éxito */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="text-2xl">✓</div>
          <p className="font-bold">¡Producto Encontrado!</p>
        </div>
      </div>

      {/* Imagen del producto */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-rosa-light to-rosa-primary">
        {imageToShow ? (
          <img 
            src={imageToShow}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-rosa-dark text-7xl mb-2">✨</div>
              <p className="text-rosa-dark font-medium">Rosa Oliva</p>
            </div>
          </div>
        )}
        {product.featured && (
          <div className="absolute top-4 left-4 bg-rosa-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            ⭐ Destacado
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="p-6 space-y-6">
        {/* Nombre y SKU */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">
              {product.name}
            </h2>
          </div>
          <div className="inline-block bg-gray-100 px-3 py-1 rounded-full">
            <span className="text-sm text-gray-600">Código: </span>
            <span className="text-sm font-mono font-bold text-rosa-dark">{product.sku}</span>
          </div>
        </div>

        {/* Categoría y Rating */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Package className="w-4 h-4 text-rosa-secondary" />
            <span className="text-gray-700">{product.category}</span>
          </div>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-gray-700 ml-1">({product.rating})</span>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Descripción</h3>
          <p className="text-gray-700 leading-relaxed">{product.description}</p>
        </div>

        {/* Precios */}
        <div className="bg-gradient-to-br from-rosa-light to-white border-2 border-rosa-primary rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Precio actual:</span>
              <span className="text-3xl font-bold text-rosa-primary">
                ${(product.price || product.pricing?.public || 0).toLocaleString()}
              </span>
            </div>
            
            {product.originalPrice > 0 && product.originalPrice > product.price && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Precio anterior:</span>
                <span className="text-gray-500 line-through">
                  ${product.originalPrice.toLocaleString()}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-rosa-primary">
              <p className="text-xs text-rosa-dark font-medium">
                {getPricingLevelText()}
              </p>
            </div>

            {/* Beneficios de membresía */}
            {pricingInfo?.userLevel === 'public' && membershipBenefits?.memberSavings > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  💰 <strong>Con Membresía Socios Rosa Oliva ahorras:</strong>
                </p>
                <p className="text-xl font-bold text-green-700 mt-1">
                  ${membershipBenefits.memberSavings.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <span className="text-sm font-medium text-gray-700">Disponibilidad:</span>
          <span className={`text-sm font-bold ${
            product.stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}
          </span>
        </div>

        {/* Botón agregar al carrito */}
        {product.stock > 0 && onAddToCart && (
          <button
            onClick={onAddToCart}
            className="w-full bg-gradient-to-r from-rosa-primary to-rosa-secondary text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Agregar al Carrito</span>
          </button>
        )}

        {/* Info adicional */}
        {product.excel?.lote && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Lote: {product.excel.lote}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
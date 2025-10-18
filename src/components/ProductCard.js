// ProductCard Component - Versión completa con carousel de imágenes

import React, { useState } from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePricing } from '../hooks/usePricing';
import ProductImageCarousel from './ProductImageCarousel';

const ProductCard = ({ product, addToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const { classes } = useTheme();
  const { getPricingInfo, getPricingLevelText, getMembershipBenefits } = usePricing();

  const pricingInfo = getPricingInfo(product);
  const membershipBenefits = getMembershipBenefits(product);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setQuantity(1);
  };

  // Preparar array de imágenes
  const getProductImages = () => {
    // Si el producto tiene un array de imágenes
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(img => img && !img.includes('placeholder'));
    }
    
    // Si tiene una sola imagen
    if (product.imageUrl && !product.imageUrl.includes('placeholder')) {
      return [product.imageUrl];
    }
    
    // Sin imágenes válidas
    return [];
  };

  const productImages = getProductImages();
  const hasImages = productImages.length > 0;

  return (
    <div className={classes.card}>
      {/* Badges */}
      {product.featured && (
        <div className={`${classes.cardBadgeFeatured} text-xs px-2 py-1 absolute z-10 m-2 rounded`}>
          Destacado
        </div>
      )}
      
      
      {/* Image Section con Carousel */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-gray-200">
        {hasImages ? (
          <ProductImageCarousel 
            images={productImages}
            productName={product.name}
            autoPlay={true}
            interval={3000}
          />
        ) : (
          <div className={`absolute inset-0 ${classes.placeholderGradient} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`${classes.placeholderText} text-5xl md:text-6xl mb-2`}>✨</div>
              <div className={`${classes.placeholderText} text-xs font-medium`}>Rosa Oliva</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-3 md:p-4">
        <h3 className={`${classes.productTitle} font-semibold mb-2 text-sm md:text-base line-clamp-2`}>
          {product.name}
        </h3>
        <p className={`${classes.productDescription} text-xs md:text-sm mb-3 line-clamp-2`}>
          {product.description}
        </p>
        
        {/* Rating */}
        {/* <div className="flex items-center mb-2">
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
        </div> */}

        {/* Price Section */}
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
              {pricingInfo?.hasDiscount && (
                <div className={`${classes.cardBadgeDiscount} text-xs px-2 py-1 absolute z-10 m-2 mt-8 rounded`}>
                  -{pricingInfo.discount}%
                </div>
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

        {/* Add to Cart Section */}
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

        {/* Product Meta */}
        {product.sku && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            SKU: {product.sku}
            {product.excel?.lote && ` • Lote: ${product.excel.lote}`}
          </div>
        )}

        {/* Multiple Images Indicator */}
        {productImages.length > 1 && (
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <span>📸</span>
            <span>{productImages.length} fotos</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
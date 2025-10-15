// src/components/ProductImageCarousel.js - Carousel de imágenes para productos

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductImageCarousel = ({ images, productName, autoPlay = true, interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Asegurar que images es un array
  const imageArray = Array.isArray(images) ? images : [images];
  const hasMultipleImages = imageArray.length > 1;

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || !hasMultipleImages || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageArray.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, hasMultipleImages, isHovered, interval, imageArray.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imageArray.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const currentImage = imageArray[currentIndex];
  const showImage = currentImage && !currentImage.includes('placeholder') && !imageError;

  return (
    <div 
      className="relative w-full h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Display */}
      <div className="relative w-full h-full overflow-hidden">
        {showImage ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-rosa-light to-rosa-primary flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="text-rosa-dark text-4xl">📸</div>
                  <div className="text-xs text-rosa-secondary mt-2">Cargando...</div>
                </div>
              </div>
            )}
            <img 
              src={currentImage}
              alt={`${productName} - Imagen ${currentIndex + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rosa-light to-rosa-primary flex items-center justify-center">
            <div className="text-center">
              <div className="text-rosa-dark text-5xl md:text-6xl mb-2">✨</div>
              <div className="text-rosa-dark text-xs font-medium">Rosa Oliva</div>
            </div>
          </div>
        )}

        {/* Navigation Arrows - Only show if multiple images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Real Image Badge */}
        {showImage && !imageError && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
            📸
          </div>
        )}

        {/* Image Counter - Only show if multiple images */}
        {hasMultipleImages && showImage && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {imageArray.length}
          </div>
        )}
      </div>

      {/* Dots Indicator - Only show if multiple images */}
      {hasMultipleImages && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {imageArray.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;
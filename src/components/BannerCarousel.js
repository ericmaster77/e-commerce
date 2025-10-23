// src/components/BannerCarousel.js - CON SOPORTE DE VIDEO Y GIF
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useActiveBanners } from '../hooks/useSiteConfig';

const BannerCarousel = () => {
  const { banners, loading } = useActiveBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  console.log('🎨 BannerCarousel render:', { 
    bannersCount: banners.length, 
    loading 
  });
  // Auto-advance every 5 seconds (solo para imágenes/GIF, no para videos)
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const currentBanner = banners[currentIndex];
    // No auto-avanzar si es un video (el usuario lo está viendo)
    if (currentBanner?.mediaType === 'video') return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, banners.length, currentIndex, banners]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Función para detectar el tipo de medio
  const getMediaType = (url) => {
    if (!url) return 'image';
    
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const isVideo = videoExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );
    
    return isVideo ? 'video' : 'image';
  };

  if (loading) {
    return (
      <div className="w-full h-64 md:h-96 bg-gradient-to-br from-blue-100 to-teal-100 animate-pulse flex items-center justify-center">
        <div className="text-blue-600">Cargando banners...</div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return (
      <div className="w-full h-64 md:h-96 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎨</div>
          <div className="text-gray-600">No hay banners configurados</div>
          <div className="text-sm text-gray-500 mt-2">Configura tus banners en el panel de administración</div>
        </div>
      </div>
    );
  }

  return (
<div className="relative w-full h-[calc(100vh-40px)] md:h-[calc(100vh-56px)] lg:h-[calc(100vh-80px)] overflow-hidden bg-gray-900 group">
      {/* Banner Content (Images or Videos) */}
      {banners.map((banner, index) => {
        const mediaType = banner.mediaType || getMediaType(banner.imageUrl);
        
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {banner.link ? (
              <a 
                href={banner.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block w-full h-full"
              >
                <MediaContent 
                  banner={banner} 
                  mediaType={mediaType}
                  isActive={index === currentIndex}
                />
              </a>
            ) : (
              <MediaContent 
                banner={banner} 
                mediaType={mediaType}
                isActive={index === currentIndex}
              />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
            
            {/* Banner Title */}
            {banner.title && (
              <div className="absolute bottom-8 left-8 text-white pointer-events-none">
                <h2 className="text-2xl md:text-4xl font-bold drop-shadow-lg">
                  {/* {banner.title} */}
                </h2>
                {mediaType === 'video' && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-full">
                    {/* 🎥 VIDEO */}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Banner siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {banners.map((banner, index) => {
            const mediaType = banner.mediaType || getMediaType(banner.imageUrl);
            
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all ${
                  index === currentIndex 
                    ? 'bg-white w-8' 
                    : 'bg-white/50 hover:bg-white/75'
                } h-3 rounded-full`}
                aria-label={`Ir al banner ${index + 1}`}
                title={mediaType === 'video' ? 'Video' : 'Imagen'}
              >
                {mediaType === 'video' && index === currentIndex && (
                  <span className="text-xs">▶</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Resume Auto-play hint */}
      {!isAutoPlaying && banners.length > 1 && (
        <button
          onClick={() => setIsAutoPlaying(true)}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs transition-all"
        >
          ▶ Reanudar auto-avance
        </button>
      )}
    </div>
  );
};

// Componente para renderizar imagen o video
const MediaContent = ({ banner, mediaType, isActive }) => {
  if (mediaType === 'video') {
    return (
      <video
        src={banner.imageUrl}
        className="w-full h-full object-cover"
        autoPlay={isActive}
        loop
        muted
        playsInline
        poster={banner.videoPoster || undefined}
      >
        Tu navegador no soporta el elemento de video.
      </video>
    );
  }

  // Para imágenes (incluyendo GIF)
  return (
    <img
      src={banner.imageUrl}
      alt={banner.title}
      className="w-full h-full object-cover"
    />
  );
};

export default BannerCarousel;
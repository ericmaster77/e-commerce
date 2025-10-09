// src/hooks/usePricing.js - CORREGIDO PARA SISTEMA ANAQUEL COMO DEFECTO
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePricing = () => {
  const { user, isMember } = useAuth();

  // Determinar el tipo de usuario para precios
  const getUserPricingLevel = useMemo(() => {
    if (!user) return 'public';
    
    // Si es miembro activo, precio de miembros (socios)
    if (isMember()) return 'member';
    
    // TODO: Agregar lógica para mayoristas cuando se implemente
    // if (user.userType === 'wholesale') return 'wholesale';
    
    // Por defecto, precio público (Anaquel)
    return 'public';
  }, [user, isMember]);

  // Función para obtener el precio correcto según el usuario - CORREGIDA
  const getPrice = (product) => {
    if (!product) return 0;

    // NUEVO SISTEMA: Precio Anaquel como precio principal por defecto
    
    // Si el producto tiene el nuevo esquema de precios
    if (product.pricing) {
      switch (getUserPricingLevel) {
        case 'member':
          return product.pricing.member || product.pricing.public;
        case 'wholesale':
          return product.pricing.wholesale || product.pricing.member || product.pricing.public;
        default:
          return product.pricing.public; // PRECIO ANAQUEL
      }
    }

    // Fallback para productos con esquema anterior
    // CORREGIDO: price ahora es el precio Anaquel (público)
    return product.price || 0;
  };

  // Función para obtener el precio original (para mostrar descuento) - CORREGIDA
  const getOriginalPrice = (product) => {
    if (!product) return 0;

    // Si el usuario tiene descuento, mostrar precio público como "original"
    if (getUserPricingLevel === 'member' && product.pricing) {
      const publicPrice = product.pricing.public;
      const memberPrice = product.pricing.member;
      
      // Solo mostrar precio original si hay diferencia significativa
      if (publicPrice > memberPrice && publicPrice - memberPrice >= 100) {
        return publicPrice;
      }
    }

    if (getUserPricingLevel === 'wholesale' && product.pricing) {
      const publicPrice = product.pricing.public;
      const wholesalePrice = product.pricing.wholesale;
      
      if (publicPrice > wholesalePrice && publicPrice - wholesalePrice >= 100) {
        return publicPrice;
      }
    }

    // Fallback para esquema anterior
    return product.originalPrice && product.originalPrice > product.price 
      ? product.originalPrice 
      : 0;
  };

  // Función para calcular el descuento actual - CORREGIDA
  const getDiscount = (product) => {
    if (!product) return 0;

    const currentPrice = getPrice(product);
    const originalPrice = getOriginalPrice(product);

    if (originalPrice > 0 && currentPrice < originalPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    return 0;
  };

  // Función para obtener información completa de precios - CORREGIDA
  const getPricingInfo = (product) => {
    if (!product) return null;

    const currentPrice = getPrice(product);
    const originalPrice = getOriginalPrice(product);
    const discount = getDiscount(product);
    
    return {
      current: currentPrice,
      original: originalPrice,
      discount: discount,
      userLevel: getUserPricingLevel,
      hasDiscount: discount > 0,
      // Información adicional para mostrar en UI
      showMemberPrice: getUserPricingLevel === 'member',
      showWholesalePrice: getUserPricingLevel === 'wholesale',
      // Todos los precios disponibles (para comparación)
      allPrices: product.pricing ? {
        public: product.pricing.public,    // Precio Anaquel
        member: product.pricing.member,    // Precio Medio Mayoreo  
        wholesale: product.pricing.wholesale // Precio Mayoreo
      } : {
        public: product.price,             // Precio principal (Anaquel)
        member: product.price,             // Sin diferenciación en esquema anterior
        wholesale: product.wholesalePrice  // Precio mayorista
      }
    };
  };

  // Función para obtener el texto del nivel de precio - CORREGIDA
  const getPricingLevelText = () => {
    switch (getUserPricingLevel) {
      case 'member':
        return 'Precio Socio';
      case 'wholesale':
        return 'Precio Mayoreo';
      default:
        return 'Precio Público'; // Precio Anaquel
    }
  };

  // Función para mostrar beneficios de membresía - CORREGIDA
  const getMembershipBenefits = (product) => {
    if (!product || !product.pricing) return null;

    const publicPrice = product.pricing.public;    // Anaquel
    const memberPrice = product.pricing.member;    // Medio Mayoreo
    const wholesalePrice = product.pricing.wholesale; // Mayoreo

    const memberSavings = publicPrice > memberPrice 
      ? publicPrice - memberPrice 
      : 0;
    
    const wholesaleSavings = publicPrice > wholesalePrice 
      ? publicPrice - wholesalePrice 
      : 0;

    return {
      memberSavings,
      wholesaleSavings,
      memberPercent: memberSavings > 0 
        ? Math.round((memberSavings / publicPrice) * 100) 
        : 0,
      wholesalePercent: wholesaleSavings > 0 
        ? Math.round((wholesaleSavings / publicPrice) * 100) 
        : 0,
      // Información adicional
      priceBreakdown: {
        public: publicPrice,
        publicLabel: 'Anaquel (Público)',
        member: memberPrice, 
        memberLabel: 'Socios',
        wholesale: wholesalePrice,
        wholesaleLabel: 'Mayoreo'
      }
    };
  };

  // Función para obtener el precio según cantidad (para mayoreo automático)
  const getPriceByQuantity = (product, quantity = 1) => {
    if (!product || !product.pricing) {
      return getPrice(product);
    }

    // Lógica de cantidad para mayoreo automático
    if (quantity >= 50) {
      return product.pricing.wholesale; // Mayoreo
    } else if (quantity >= 10) {
      return product.pricing.member; // Medio mayoreo
    } else {
      return product.pricing.public; // Anaquel
    }
  };

  // Función para obtener el nivel de precio por cantidad
  const getPricingLevelByQuantity = (quantity = 1) => {
    if (quantity >= 50) {
      return 'wholesale';
    } else if (quantity >= 10) {
      return 'member';
    } else {
      return 'public';
    }
  };

  return {
    // Funciones principales
    getUserPricingLevel,
    getPrice,
    getOriginalPrice,
    getDiscount,
    getPricingInfo,
    getPricingLevelText,
    getMembershipBenefits,
    
    // Funciones de cantidad
    getPriceByQuantity,
    getPricingLevelByQuantity,
    
    // Estado del usuario
    isPublicUser: getUserPricingLevel === 'public',
    isMemberUser: getUserPricingLevel === 'member',
    isWholesaleUser: getUserPricingLevel === 'wholesale',

    // Utilidades
    formatPrice: (price) => `$${price.toLocaleString()}`,
    
    // Información de descuentos estándar
    standardDiscounts: {
      memberDiscount: 25, // 25% descuento para socios vs público
      wholesaleDiscount: 50 // 50% descuento para mayoreo vs público
    }
  };
};
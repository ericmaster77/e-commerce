// src/hooks/usePricing.js
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePricing = () => {
  const { user, isMember } = useAuth();

  // Determinar el tipo de usuario para precios
  const getUserPricingLevel = useMemo(() => {
    if (!user) return 'public';
    
    // Si es miembro activo, precio de miembros
    if (isMember()) return 'member';
    
    // TODO: Agregar lógica para mayoristas cuando se implemente
    // if (user.userType === 'wholesale') return 'wholesale';
    
    // Por defecto, precio público
    return 'public';
  }, [user, isMember]);

  // Función para obtener el precio correcto según el usuario
  const getPrice = (product) => {
    if (!product) return 0;

    // Si el producto tiene el nuevo esquema de precios
    if (product.pricing) {
      switch (getUserPricingLevel) {
        case 'member':
          return product.pricing.member || product.pricing.public;
        case 'wholesale':
          return product.pricing.wholesale || product.pricing.member || product.pricing.public;
        default:
          return product.pricing.public;
      }
    }

    // Fallback para productos con esquema anterior
    return product.price || 0;
  };

  // Función para obtener el precio original (para mostrar descuento)
  const getOriginalPrice = (product) => {
    if (!product) return 0;

    // Si el producto tiene el nuevo esquema de precios
    if (product.pricing) {
      // Mostrar precio público como "precio original" si el usuario tiene descuento
      if (getUserPricingLevel !== 'public') {
        return product.pricing.public;
      }
      return 0; // No hay precio original para usuarios públicos
    }

    // Fallback para productos con esquema anterior
    return product.originalPrice || 0;
  };

  // Función para calcular el descuento actual
  const getDiscount = (product) => {
    if (!product) return 0;

    const currentPrice = getPrice(product);
    const originalPrice = getOriginalPrice(product);

    if (originalPrice > 0 && currentPrice < originalPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    return 0;
  };

  // Función para obtener información completa de precios
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
        public: product.pricing.public,
        member: product.pricing.member,
        wholesale: product.pricing.wholesale
      } : {
        public: product.price,
        member: product.originalPrice,
        wholesale: product.wholesalePrice
      }
    };
  };

  // Función para obtener el texto del nivel de precio
  const getPricingLevelText = () => {
    switch (getUserPricingLevel) {
      case 'member':
        return 'Precio Socio';
      case 'wholesale':
        return 'Precio Mayoreo';
      default:
        return 'Precio Público';
    }
  };

  // Función para mostrar beneficios de membresía
  const getMembershipBenefits = (product) => {
    if (!product || !product.pricing) return null;

    const publicPrice = product.pricing.public;
    const memberPrice = product.pricing.member;
    const wholesalePrice = product.pricing.wholesale;

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
        : 0
    };
  };

  return {
    getUserPricingLevel,
    getPrice,
    getOriginalPrice,
    getDiscount,
    getPricingInfo,
    getPricingLevelText,
    getMembershipBenefits,
    // Estado del usuario
    isPublicUser: getUserPricingLevel === 'public',
    isMemberUser: getUserPricingLevel === 'member',
    isWholesaleUser: getUserPricingLevel === 'wholesale'
  };
};
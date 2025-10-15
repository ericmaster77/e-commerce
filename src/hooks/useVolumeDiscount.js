// src/hooks/useVolumeDiscount.js - Hook para descuentos por volumen de compra

import { useMemo } from 'react';

/**
 * Sistema de descuentos por monto de compra:
 * - $5,000 - $9,999 = 25% descuento
 * - $10,000+ = 50% descuento
 */
export const useVolumeDiscount = (subtotal) => {
  const discountInfo = useMemo(() => {
    let discountPercentage = 0;
    let discountAmount = 0;
    let discountTier = 'none';
    let nextTierAmount = 5000;
    let savingsToNextTier = 0;

    if (subtotal >= 10000) {
      // Descuento del 50%
      discountPercentage = 50;
      discountAmount = subtotal * 0.50;
      discountTier = 'platinum';
      nextTierAmount = null; // Ya está en el tier más alto
      savingsToNextTier = 0;
    } else if (subtotal >= 5000) {
      // Descuento del 25%
      discountPercentage = 25;
      discountAmount = subtotal * 0.25;
      discountTier = 'gold';
      nextTierAmount = 10000;
      savingsToNextTier = 10000 - subtotal;
    } else {
      // Sin descuento
      discountPercentage = 0;
      discountAmount = 0;
      discountTier = 'none';
      nextTierAmount = 5000;
      savingsToNextTier = 5000 - subtotal;
    }

    const total = subtotal - discountAmount;

    return {
      subtotal,
      discountPercentage,
      discountAmount,
      total,
      discountTier,
      nextTierAmount,
      savingsToNextTier,
      hasDiscount: discountPercentage > 0,
      isMaxTier: discountTier === 'platinum'
    };
  }, [subtotal]);

  const getTierInfo = () => {
    switch (discountInfo.discountTier) {
      case 'platinum':
        return {
          name: 'Platino',
          color: 'purple',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          icon: '💎',
          message: '¡Felicidades! Obtienes el máximo descuento del 50%'
        };
      case 'gold':
        return {
          name: 'Oro',
          color: 'yellow',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: '🏆',
          message: `¡Genial! Tienes 25% de descuento. Agrega $${discountInfo.savingsToNextTier.toLocaleString()} más para obtener 50% de descuento`
        };
      default:
        return {
          name: 'Estándar',
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '🛍️',
          message: `Agrega $${discountInfo.savingsToNextTier.toLocaleString()} más para obtener 25% de descuento`
        };
    }
  };

  return {
    ...discountInfo,
    tierInfo: getTierInfo()
  };
};

export default useVolumeDiscount;
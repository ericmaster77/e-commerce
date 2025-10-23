// src/components/Cart.js - VERSIÓN COMPLETA INTEGRADA
import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Tag, Gift, TrendingUp, DollarSign } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVolumeDiscount } from '../hooks/useVolumeDiscount';
import { recommendationService } from '../services/recommendationService';
import { useAuth } from '../contexts/AuthContext';

const Cart = () => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getTotalPrice,
    getTotalItems,
    isCartOpen, 
    setIsCartOpen,
    cashbackBalance,
    appliedCashback,
    applyCashback,
    processCheckout,
    addToCart,
    clearCart
  } = useCart();
  
  const { classes, isMinimal } = useTheme();
  const { user } = useAuth();
  
  const [showCashbackInput, setShowCashbackInput] = useState(false);
  const [cashbackAmount, setCashbackAmount] = useState('');
  
  // Sistema de descuentos por volumen
  const subtotal = getTotalPrice();
  const volumeDiscount = useVolumeDiscount(subtotal);
  
  // Calcular total final con cashback
  const finalTotal = volumeDiscount.total - appliedCashback;
  
  // Recomendaciones
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  useEffect(() => {
    if (isCartOpen && user && cartItems.length > 0) {
      loadRecommendations();
    }
  }, [isCartOpen, cartItems]);
  
  const loadRecommendations = async () => {
    if (!user) return;
    
    setLoadingRecs(true);
    try {
      const recs = await recommendationService.getProductRecommendations(
        user.uid,
        cartItems[0]?.id
      );
      setRecommendations(recs.slice(0, 3));
    } catch (error) {
      console.error('Error cargando recomendaciones:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleApplyCashback = () => {
    const amount = parseFloat(cashbackAmount);
    if (!isNaN(amount) && amount > 0) {
      const applied = applyCashback(amount);
      alert(`Se aplicaron $${applied.toLocaleString()} de cashback`);
      setShowCashbackInput(false);
      setCashbackAmount('');
    }
  };

  const handleCheckout = async () => {
    const orderData = {
      items: cartItems,
      subtotal: subtotal,
      volumeDiscount: volumeDiscount.discountAmount,
      cashbackUsed: appliedCashback,
      total: finalTotal,
      discountTier: volumeDiscount.discountTier
    };
    
    const result = await processCheckout(orderData);
    
    if (result.success) {
      alert(`¡Esto sería lo que pagarías en tienda! 
        Total a pagar: $${finalTotal.toLocaleString()}` //Quite esto: Cashback ganado: $${result.earnedCashback.toLocaleString()}
        //Nuevo saldo de cashback: $${cashbackBalance.toLocaleString()}
      );
      setIsCartOpen(false);
    }
  };

  const addRecommendationToCart = (product) => {
    addToCart(product, 1);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsCartOpen(false)} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-lg ${classes.cartBg} shadow-xl overflow-y-auto`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 ${classes.cartHeader}`}>
            <h2 className={`${classes.sectionTitle} text-lg font-semibold`}>
              Carrito de Compras
            </h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Discount Banner */}
          {volumeDiscount.hasDiscount && (
            <div className={`mx-4 p-3 rounded-lg ${volumeDiscount.tierInfo.bgColor} animate-pulse-soft`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{volumeDiscount.tierInfo.icon}</span>
                  <div>
                    <div className={`font-bold ${volumeDiscount.tierInfo.textColor}`}>
                      ¡{volumeDiscount.discountPercentage}% de Descuento!
                    </div>
                    <div className="text-xs opacity-80">
                      Nivel {volumeDiscount.tierInfo.name}
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-lg ${volumeDiscount.tierInfo.textColor}`}>
                  -${volumeDiscount.discountAmount.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Next Tier Progress */}
          {!volumeDiscount.isMaxTier && (
            <div className="mx-4 mt-2 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-800">
                  Agrega ${volumeDiscount.savingsToNextTier.toLocaleString()} más
                </span>
                <span className="text-xs text-blue-600">
                  {volumeDiscount.discountTier === 'none' ? '25%' : '50%'} desc
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (subtotal / volumeDiscount.nextTierAmount) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Cart Items - SECCIÓN PRINCIPAL DE PRODUCTOS */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* MOSTRAR CADA PRODUCTO */}
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 border-b pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-rosa-light to-rosa-primary rounded-lg flex items-center justify-center">
                      {item.imageUrl && item.imageUrl !== '/api/placeholder/300/300' ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-2xl">✨</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className={`${isMinimal ? 'text-black' : 'text-rosa-primary'} font-semibold`}>
                        ${item.price.toLocaleString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 text-sm ml-2 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Subtotal</p>
                      <p className="font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}

                {/* Recommendations Section */}
                {recommendations.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Gift className={`w-4 h-4 ${isMinimal ? 'text-black' : 'text-rosa-primary'}`} />
                      Te puede interesar
                    </h3>
                    <div className="space-y-2">
                      {recommendations.map(rec => (
                        <div key={rec.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-rosa-light to-rosa-primary rounded flex items-center justify-center">
                              <span className="text-xs">✨</span>
                            </div>
                            <div>
                              <p className="text-xs font-medium">{rec.name}</p>
                              <p className={`text-xs ${isMinimal ? 'text-black' : 'text-rosa-primary'} font-semibold`}>
                                ${rec.price.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => addRecommendationToCart(rec)}
                            className={`text-xs px-2 py-1 rounded ${
                              isMinimal 
                                ? 'bg-black text-white hover:bg-gray-800' 
                                : 'bg-rosa-primary text-white hover:bg-rosa-dark'
                            }`}
                          >
                            Agregar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cashback Section */}
            {/* {cartItems.length > 0 && cashbackBalance > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Tu Cashback Disponible
                  </span>
                  <span className="font-bold text-green-600">
                    ${cashbackBalance.toLocaleString()}
                  </span>
                </div>
                
                {!showCashbackInput ? (
                  <button
                    onClick={() => setShowCashbackInput(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Aplicar cashback a esta compra
                  </button>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="number"
                      value={cashbackAmount}
                      onChange={(e) => setCashbackAmount(e.target.value)}
                      placeholder="Monto"
                      max={Math.min(cashbackBalance, volumeDiscount.total * 0.1)}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                    <button
                      onClick={handleApplyCashback}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => {
                        setShowCashbackInput(false);
                        setCashbackAmount('');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                
                {appliedCashback > 0 && (
                  <div className="mt-2 text-xs text-green-600 font-semibold">
                    ✓ Cashback aplicado: -${appliedCashback.toLocaleString()}
                  </div>
                )}
              </div>
            )} */}
          </div>

          {/* Checkout Section - RESUMEN DE TOTALES */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({getTotalItems()} items):</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                
                {volumeDiscount.hasDiscount && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Descuento ({volumeDiscount.discountPercentage}%):
                    </span>
                    <span>-${volumeDiscount.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                
                {appliedCashback > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Cashback aplicado:</span>
                    <span>-${appliedCashback.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total a Pagar:</span>
                    <div className="text-right">
                      {(volumeDiscount.hasDiscount || appliedCashback > 0) && (
                        <span className="text-xs text-gray-500 line-through block">
                          ${subtotal.toLocaleString()}
                        </span>
                      )}
                      <span className={`text-2xl font-bold ${isMinimal ? 'text-black' : 'text-rosa-primary'}`}>
                        ${finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {cashbackBalance > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      {/* 🎁 Ganarás ${Math.round(finalTotal * 0.05).toLocaleString()} en cashback (5%) */}
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className={`w-full py-3 rounded-lg transition-colors shadow-lg font-semibold ${
                  isMinimal 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gradient-to-r from-rosa-primary to-rosa-secondary text-white hover:opacity-90'
                }`}
              >
                Cotizar compra
              </button>
              
              <button
                onClick={() => { clearCart(); setIsCartOpen(false); }}
                className="w-full mt-2 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
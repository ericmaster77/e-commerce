// src/contexts/CartContext.js - AGREGAR AL EXISTENTE
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cashbackBalance, setCashbackBalance] = useState(0); // NUEVO
  const [appliedCashback, setAppliedCashback] = useState(0); // NUEVO

  // Cargar cashback del usuario al iniciar
  useEffect(() => {
    loadUserCashback();
  }, []);

  const loadUserCashback = async () => {
    // Aquí cargarías el cashback del usuario desde Firebase
    // Por ahora simulamos
    setCashbackBalance(250);
  };

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
    setAppliedCashback(0);
  };

  // NUEVO: Aplicar cashback
  const applyCashback = (amount) => {
    const maxApplicable = Math.min(amount, cashbackBalance, getTotalPrice() * 0.1);
    setAppliedCashback(maxApplicable);
    return maxApplicable;
  };

  // NUEVO: Procesar compra con cashback
  const processCheckout = async (orderData) => {
    // Calcular cashback ganado (5% de la compra)
    const earnedCashback = Math.round(orderData.total * 0.05);
    
    // Actualizar balance
    const newBalance = cashbackBalance - appliedCashback + earnedCashback;
    setCashbackBalance(newBalance);
    
    // Aquí guardarías en Firebase
    console.log('Cashback usado:', appliedCashback);
    console.log('Cashback ganado:', earnedCashback);
    console.log('Nuevo balance:', newBalance);
    
    clearCart();
    return { success: true, earnedCashback };
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
      setIsCartOpen,
      // NUEVO
      cashbackBalance,
      appliedCashback,
      applyCashback,
      processCheckout
    }}>
      {children}
    </CartContext.Provider>
  );
};
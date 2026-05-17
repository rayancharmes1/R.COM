import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // cart is keyed by disciplineId: { [discId]: [{article, quantity}] }
  const [carts, setCarts] = useState({});

  const getCart = (discId) => carts[discId] || [];

  const addToCart = (discId, article) => {
    setCarts(prev => {
      const cart = prev[discId] || [];
      const existing = cart.find(i => i.article.id === article.id);
      const updated = existing
        ? cart.map(i => i.article.id === article.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...cart, { article, quantity: 1 }];
      return { ...prev, [discId]: updated };
    });
  };

  const removeFromCart = (discId, articleId) => {
    setCarts(prev => ({ ...prev, [discId]: (prev[discId]||[]).filter(i => i.article.id !== articleId) }));
  };

  const updateQuantity = (discId, articleId, qty) => {
    if (qty <= 0) { removeFromCart(discId, articleId); return; }
    setCarts(prev => ({ ...prev, [discId]: (prev[discId]||[]).map(i => i.article.id === articleId ? { ...i, quantity: qty } : i) }));
  };

  const clearCart = (discId) => setCarts(prev => ({ ...prev, [discId]: [] }));

  const totalItems = (discId) => (carts[discId]||[]).reduce((s,i) => s+i.quantity, 0);
  const totalPrice = (discId) => (carts[discId]||[]).reduce((s,i) => s+i.article.price*i.quantity, 0);

  return (
    <CartContext.Provider value={{ getCart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);


"use client";

import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  platform: 'instagram' | 'whatsapp';
}

interface CartContextType {
  cartItems: Product[];
  addToCart: (item: Product) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('zoro_cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        setCartItems([]);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('zoro_cart', JSON.stringify(cartItems));
    } catch (error) {
        console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = (item: Product) => {
    setCartItems(prevItems => {
      if (!prevItems.find(i => i.id === item.id)) {
        toast({ title: "Added to Cart", description: `${item.name} has been added to your cart.` });
        return [...prevItems, item];
      }
      return prevItems;
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({ title: "Removed from Cart" });
  };

  const clearCart = () => {
    setCartItems([]);
    toast({ title: "Cart Cleared"});
  }

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

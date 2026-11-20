"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { KantiProduct } from "../data/snacksData";

export interface CartItem {
  product: KantiProduct;
  weight: string;
  quantity: number;
}

interface KantiCartContextType {
  cart: CartItem[];
  addToCart: (product: KantiProduct, weight?: string, qty?: number) => void;
  removeFromCart: (productId: string, weight: string) => void;
  updateQuantity: (productId: string, weight: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // Delivery location
  deliveryType: string;
  deliveryCity: string;
  setDeliveryLocation: (type: string, city: string) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  // Quick product detail modal
  activeQuickViewProduct: KantiProduct | null;
  setActiveQuickViewProduct: (prod: KantiProduct | null) => void;
}

const KantiCartContext = createContext<KantiCartContextType | undefined>(undefined);

export function KantiCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState("Courier");
  const [deliveryCity, setDeliveryCity] = useState("Bengaluru");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeQuickViewProduct, setActiveQuickViewProduct] = useState<KantiProduct | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kanti_cart");
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem("kanti_cart", JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const addToCart = (product: KantiProduct, weight?: string, qty = 1) => {
    const chosenWeight = weight || product.weight;
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.weight === chosenWeight
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += qty;
        return copy;
      }
      return [...prev, { product, weight: chosenWeight, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, weight: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.weight === weight)
      )
    );
  };

  const updateQuantity = (productId: string, weight: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, weight);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.weight === weight
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const setDeliveryLocation = (type: string, city: string) => {
    setDeliveryType(type);
    setDeliveryCity(city);
    setIsLocationModalOpen(false);
  };

  return (
    <KantiCartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        deliveryType,
        deliveryCity,
        setDeliveryLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        activeQuickViewProduct,
        setActiveQuickViewProduct,
      }}
    >
      {children}
    </KantiCartContext.Provider>
  );
}

export function useKantiCart() {
  const ctx = useContext(KantiCartContext);
  if (!ctx) {
    throw new Error("useKantiCart must be used within a KantiCartProvider");
  }
  return ctx;
}


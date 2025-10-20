import { useCallback, useEffect, useMemo, useState } from 'react';
import CartContext from './CartContextBase.js';

const STORAGE_KEY = 'leia_sabores_cart_items';

const normalizeItem = (item) => ({
  id: item.id,
  name: item.name,
  slug: item.slug,
  image_url: item.image_url,
  price: Number(item.price),
  quantity: item.quantity,
});

const getInitialItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(getInitialItems);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addItem = useCallback((accessory, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === accessory.id);
      if (existing) {
        return prev.map((item) =>
          item.id === accessory.id
            ? normalizeItem({ ...item, quantity: item.quantity + quantity })
            : item
        );
      }
      return prev.concat(normalizeItem({ ...accessory, quantity }));
    });
  }, []);

  const updateItem = useCallback((id, quantity) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? normalizeItem({ ...item, quantity: Math.max(quantity, 1) }) : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totals = useMemo(() => {
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return { totalItems, totalAmount };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      totalItems: totals.totalItems,
      totalAmount: totals.totalAmount,
      addItem,
      updateItem,
      removeItem,
      clearCart,
    }),
    [items, totals.totalItems, totals.totalAmount, addItem, updateItem, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

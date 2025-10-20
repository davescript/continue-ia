import { createContext } from 'react';

export const CartContext = createContext({
  items: [],
  totalItems: 0,
  totalAmount: 0,
  addItem: () => {},
  updateItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
});

export default CartContext;

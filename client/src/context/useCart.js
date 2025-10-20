import { useContext } from 'react';
import CartContext from './CartContextBase.js';

export const useCart = () => useContext(CartContext);

export default useCart;

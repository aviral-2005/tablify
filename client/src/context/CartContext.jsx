import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restaurantSlug, setRestaurantSlug] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);

  const initCart = useCallback((slug, table) => {
    setRestaurantSlug(slug);
    setTableNumber(table);
  }, []);

  const addItem = useCallback((menuItem, quantity = 1, note = '') => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem.id && i.note === note);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === menuItem.id && i.note === note
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: Number(menuItem.price),
        imageUrl: menuItem.imageUrl,
        quantity,
        note,
      }];
    });
  }, []);

  const updateQuantity = useCallback((menuItemId, note, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => !(i.menuItemId === menuItemId && i.note === note)));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.menuItemId === menuItemId && i.note === note ? { ...i, quantity } : i
        )
      );
    }
  }, []);

  const removeItem = useCallback((menuItemId, note) => {
    setItems((prev) => prev.filter((i) => !(i.menuItemId === menuItemId && i.note === note)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, restaurantSlug, tableNumber,
      initCart, addItem, updateQuantity, removeItem, clearCart,
      subtotal, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

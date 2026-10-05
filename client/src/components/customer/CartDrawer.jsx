import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingCart, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ordersApi } from '../../services/api';
import { formatCurrency } from '../ui/StatusBadge';

export default function CartDrawer({ isOpen, onClose, restaurant, table }) {
  const { items, updateQuantity, removeItem, clearCart, subtotal, restaurantSlug, tableNumber } = useCart();
  const [customerNote, setCustomerNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const res = await ordersApi.place({
        restaurantSlug,
        tableNumber,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note || undefined,
        })),
        customerNote: customerNote || undefined,
      });

      const order = res.data.data;
      localStorage.setItem(`activeOrder_${restaurantSlug}_${tableNumber}`, order.orderId);

      // Save to local order history
      const historyKey = `order_history_${restaurantSlug}_${tableNumber}`;
      const existingHistoryRaw = localStorage.getItem(historyKey);
      const history = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];

      const newHistoryItem = {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal,
        createdAt: new Date().toISOString(),
        items: order.items || items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      };

      localStorage.setItem(historyKey, JSON.stringify([newHistoryItem, ...history.filter((h) => h.orderId !== order.orderId)]));

      clearCart();
      onClose();
      navigate(`/order/${restaurantSlug}/${tableNumber}/track/${order.orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
            {items.length > 0 && (
              <span className="text-sm text-gray-500">({items.length} item{items.length !== 1 ? 's' : ''})</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={`${item.menuItemId}-${idx}`} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    {item.note && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MessageSquare size={10} />
                        {item.note}
                      </p>
                    )}
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {formatCurrency(item.price * item.quantity, restaurant?.currencySymbol)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2 py-1">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.note, item.quantity - 1)}
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold text-gray-900 w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.note, item.quantity + 1)}
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.menuItemId, item.note)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Customer note */}
              <div className="mt-2">
                <label className="label text-xs">Order Note (optional)</label>
                <textarea
                  className="input text-sm resize-none"
                  rows={2}
                  placeholder="Any special requests for the entire order..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  maxLength={500}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-500">Table {table?.tableNumber}</p>
                <p className="text-lg font-bold text-gray-900">
                  Subtotal: {formatCurrency(subtotal, restaurant?.currencySymbol)}
                </p>
              </div>
              <p className="text-xs text-gray-400 text-right">Pay at<br />counter</p>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
              style={{ backgroundColor: restaurant?.themeColor || '#D97706' }}
            >
              {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {placing ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

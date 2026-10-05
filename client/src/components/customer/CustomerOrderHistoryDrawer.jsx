import { X, Clock, Receipt, ChevronRight, PackageCheck, UtensilsCrossed, CheckCircle, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatTime } from '../ui/StatusBadge';

const STATUS_BADGES = {
  NEW: { label: 'Order Received', bg: 'bg-blue-100', text: 'text-blue-700' },
  ACCEPTED: { label: 'Accepted', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  PREPARING: { label: 'Preparing', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  READY: { label: 'Ready!', bg: 'bg-green-100', text: 'text-green-700' },
  COMPLETED: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-600' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
};

export default function CustomerOrderHistoryDrawer({ isOpen, onClose, slug, tableNumber, themeColor, currencySymbol }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Retrieve saved orders history from localStorage
  const savedOrdersRaw = localStorage.getItem(`order_history_${slug}_${tableNumber}`);
  const orders = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];

  const handleTrack = (orderId) => {
    onClose();
    navigate(`/order/${slug}/${tableNumber}/track/${orderId}`);
  };

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
            <Receipt className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Your Past Orders</h2>
            {orders.length > 0 && (
              <span className="text-sm text-gray-500">({orders.length})</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🧾</div>
              <p className="text-gray-500 font-medium">No previous orders found</p>
              <p className="text-gray-400 text-xs mt-1">Orders placed at Table {tableNumber} will appear here</p>
            </div>
          ) : (
            orders.map((ord) => {
              const badge = STATUS_BADGES[ord.status] || STATUS_BADGES.NEW;

              return (
                <div key={ord.orderId} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Order #{ord.orderNumber}</h3>
                      <p className="text-xs text-gray-400">{formatTime(ord.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Summary of items */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="text-xs text-gray-600 my-2 space-y-0.5 border-t border-b border-gray-200/60 py-2">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.quantity} × {it.name || it.itemNameSnapshot}</span>
                          <span className="font-medium text-gray-700">{formatCurrency((it.price || it.priceSnapshot) * it.quantity, currencySymbol)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-gray-400">Total Amount</p>
                      <p className="text-base font-bold text-gray-900">{formatCurrency(ord.subtotal, currencySymbol)}</p>
                    </div>

                    <button
                      onClick={() => handleTrack(ord.orderId)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                      style={{ backgroundColor: themeColor || '#D97706' }}
                    >
                      <span>Track Order</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

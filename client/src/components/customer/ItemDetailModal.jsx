import { useState } from 'react';
import { X, Plus, Minus, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { VegBadge, formatCurrency } from '../ui/StatusBadge';

export default function ItemDetailModal({ item, restaurant, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const { addItem } = useCart();
  const toast = useToast();

  const handleAdd = () => {
    addItem(item, quantity, note);
    toast.success(`${item.name} added to cart!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] flex flex-col">
        {/* Image */}
        {item.imageUrl ? (
          <div className="h-52 flex-shrink-0 overflow-hidden bg-gray-100">
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-32 flex-shrink-0 flex items-center justify-center text-6xl bg-gray-50">🍽️</div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-start gap-2 mb-1">
            <VegBadge isVegetarian={item.isVegetarian} />
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{item.name}</h2>
          </div>

          {item.description && (
            <p className="text-gray-500 text-sm leading-relaxed mt-2">{item.description}</p>
          )}

          <div className="mt-3">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(item.price, restaurant?.currencySymbol)}
            </span>
          </div>

          {/* Special instructions */}
          <div className="mt-4">
            <label className="label text-sm">Special Instructions (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="e.g. Less spicy, no onions, extra cheese..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
          {/* Quantity */}
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              <Minus size={14} />
            </button>
            <span className="font-bold text-gray-900 w-5 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(20, quantity + 1))}
              className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            className="flex-1 py-3 rounded-xl text-white font-semibold transition-all active:scale-95 flex items-center justify-between px-4"
            style={{ backgroundColor: restaurant?.themeColor || '#D97706' }}
          >
            <span>Add to Cart</span>
            <span className="font-bold">{formatCurrency(item.price * quantity, restaurant?.currencySymbol)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

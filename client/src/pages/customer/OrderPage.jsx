import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { Search, ShoppingCart, X, Plus, Minus, ChevronLeft, Loader2, AlertCircle, Clock, ChevronRight, Receipt } from 'lucide-react';
import { VegBadge, formatCurrency } from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CartDrawer from '../../components/customer/CartDrawer';
import ItemDetailModal from '../../components/customer/ItemDetailModal';
import CustomerOrderHistoryDrawer from '../../components/customer/CustomerOrderHistoryDrawer';

export default function OrderPage() {
  const { slug, tableNumber } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { items: cartItems, itemCount, initCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);

  useEffect(() => {
    loadData();
    const savedOrderId = localStorage.getItem(`activeOrder_${slug}_${tableNumber}`);
    if (savedOrderId) {
      setActiveOrderId(savedOrderId);
    }
  }, [slug, tableNumber]);

  const loadData = async () => {
    try {
      const [tableRes, menuRes] = await Promise.all([
        restaurantApi.getTable(slug, tableNumber),
        restaurantApi.getMenu(slug),
      ]);

      const { restaurant: rest, table: tbl } = tableRes.data.data;
      const { categories: cats } = menuRes.data.data;

      setRestaurant(rest);
      setTable(tbl);
      setCategories(cats);
      initCart(slug, tableNumber);

      if (rest.themeColor) {
        document.documentElement.style.setProperty('--brand-color', rest.themeColor);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load menu';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const allItems = categories.flatMap((c) => c.menuItems);

  const filteredItems = (() => {
    let items = selectedCategory === 'ALL' ? allItems : categories.find((c) => c.id === selectedCategory)?.menuItems || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return items;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={loadData} className="btn-primary btn">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto relative">
      {/* Header Container */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        {/* Cover/Brand bar */}
        <div className="bg-amber-600 px-4 py-4 relative overflow-hidden" style={{ backgroundColor: restaurant?.themeColor || '#D97706' }}>
          {restaurant?.coverImageUrl && (
            <div className="absolute inset-0">
              <img src={restaurant.coverImageUrl} alt="" className="w-full h-full object-cover opacity-20" />
            </div>
          )}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant.name} className="w-10 h-10 rounded-xl object-cover border-2 border-white/30" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{restaurant?.name?.[0]}</span>
                </div>
              )}
              <div>
                <h1 className="text-white font-bold text-base leading-tight">{restaurant?.name}</h1>
                <p className="text-white/80 text-xs font-medium">Table {table?.tableNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHistoryOpen(true)}
                className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                title="My Orders"
              >
                <Receipt size={18} />
              </button>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                title="Search"
              >
                {showSearch ? <X size={18} /> : <Search size={18} />}
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                title="Cart"
              >
                <ShoppingCart size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center animate-bounce-in"
                    style={{ color: restaurant?.themeColor || '#D97706' }}>
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Active Order Notification Bar */}
        {activeOrderId && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
              <span>You have an active order</span>
            </div>
            <button
              onClick={() => navigate(`/order/${slug}/${tableNumber}/track/${activeOrderId}`)}
              className="font-bold text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-200/60 px-2.5 py-1 rounded-full transition-colors"
            >
              <span>Track Order</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Search Input Bar */}
        {showSearch && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <input
              type="text"
              className="input"
              placeholder="Search coffee, snacks, desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Clean Non-Overlapping Category Scroll Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'ALL'
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedCategory === 'ALL' ? { backgroundColor: restaurant?.themeColor || '#D97706' } : {}}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: restaurant?.themeColor || '#D97706' } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-4 space-y-4 pb-32">
        {selectedCategory === 'ALL' && !searchQuery ? (
          categories.map((cat) => (
            cat.menuItems.length > 0 && (
              <div key={cat.id}>
                <h2 className="text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                  <span className="w-1 h-3.5 rounded-full inline-block" style={{ backgroundColor: restaurant?.themeColor || '#D97706' }}></span>
                  {cat.name}
                  <span className="text-xs font-normal text-gray-400">({cat.menuItems.length})</span>
                </h2>
                <div className="space-y-2.5">
                  {cat.menuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      currencySymbol={restaurant?.currencySymbol}
                      themeColor={restaurant?.themeColor}
                      onSelect={setSelectedItem}
                    />
                  ))}
                </div>
              </div>
            )
          ))
        ) : (
          <>
            {searchQuery && (
              <p className="text-xs text-gray-500 font-medium">{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"</p>
            )}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-gray-500 text-sm font-medium">No menu items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  currencySymbol={restaurant?.currencySymbol}
                  themeColor={restaurant?.themeColor}
                  onSelect={setSelectedItem}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Floating cart button */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pb-6 safe-bottom z-20">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full py-3.5 rounded-2xl text-white font-semibold flex items-center justify-between px-5 shadow-xl transition-all active:scale-95"
            style={{ backgroundColor: restaurant?.themeColor || '#D97706' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {itemCount}
              </div>
              <span className="text-sm">View Cart</span>
            </div>
            <span className="font-bold text-sm">{formatCurrency(cartItems.reduce((s, i) => s + i.price * i.quantity, 0), restaurant?.currencySymbol)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        restaurant={restaurant}
        table={table}
      />

      {/* Customer Order History Drawer */}
      <CustomerOrderHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        slug={slug}
        tableNumber={tableNumber}
        themeColor={restaurant?.themeColor}
        currencySymbol={restaurant?.currencySymbol}
      />

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          restaurant={restaurant}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

function MenuItemCard({ item, currencySymbol, themeColor, onSelect }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex gap-3 p-3 transition-all active:scale-98 ${
        !item.isAvailable ? 'opacity-60' : 'cursor-pointer'
      }`}
      onClick={() => item.isAvailable && onSelect(item)}
    >
      {/* Image */}
      {item.imageUrl && (
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <VegBadge isVegetarian={item.isVegetarian} />
              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.name}</h3>
            </div>
            {item.description && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-gray-900 text-sm">{formatCurrency(item.price, currencySymbol)}</span>
          {!item.isAvailable ? (
            <span className="text-xs text-red-500 font-medium">Unavailable</span>
          ) : (
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-all active:scale-90"
              style={{ backgroundColor: themeColor || '#D97706' }}
              onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

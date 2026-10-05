import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ordersApi, restaurantApi } from '../../services/api';
import { trackOrder, connectSocket } from '../../services/socket';
import { formatCurrency, formatTime } from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { CheckCircle, Circle, ArrowLeft, RefreshCw, UtensilsCrossed, ShoppingBag, PackageCheck, Receipt, CreditCard, ChevronRight } from 'lucide-react';

const STATUS_FLOW = [
  { status: 'NEW', label: 'Order Received', icon: ShoppingBag, description: 'Your order has been sent to the kitchen' },
  { status: 'ACCEPTED', label: 'Accepted', icon: CheckCircle, description: 'Kitchen has accepted your order' },
  { status: 'PREPARING', label: 'Preparing', icon: UtensilsCrossed, description: 'Your food is being prepared' },
  { status: 'READY', label: 'Ready!', icon: PackageCheck, description: 'Your order is ready to be served' },
  { status: 'COMPLETED', label: 'Completed', icon: CheckCircle, description: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const { slug, tableNumber, orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadOrder();
    loadRestaurant();

    // Store active order ID so customer can return anytime from menu
    if (orderId && slug && tableNumber) {
      localStorage.setItem(`activeOrder_${slug}_${tableNumber}`, orderId);
    }

    const socket = connectSocket();
    trackOrder(orderId);

    socket.on('order_status_updated', (data) => {
      if (data.orderId === orderId) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
        setLastUpdated(new Date());
        playNotificationSound();
      }
    });

    return () => {
      socket.off('order_status_updated');
    };
  }, [orderId, slug, tableNumber]);

  const loadOrder = async () => {
    try {
      const res = await ordersApi.track(orderId);
      setOrder(res.data.data);
    } catch {
      // Order not found
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurant = async () => {
    try {
      const res = await restaurantApi.get(slug);
      setRestaurant(res.data.data);
    } catch {}
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.status === order?.status);
  const themeColor = restaurant?.themeColor || '#D97706';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4 font-medium">Order not found</p>
          <Link to={`/order/${slug}/${tableNumber}`} className="btn-primary btn">Back to Café Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto pb-12">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate(`/order/${slug}/${tableNumber}`)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Menu</span>
        </button>
        <div className="text-center">
          <h1 className="font-bold text-gray-900 text-sm">{restaurant?.name || 'Order Tracking'}</h1>
          <p className="text-xs text-gray-400">Table {tableNumber}</p>
        </div>
        <button onClick={loadOrder} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status timeline card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Status</span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">Order #{order.orderNumber}</h2>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {order.status}
              </span>
            </div>
          </div>

          {order.status === 'CANCELLED' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">❌</span>
              </div>
              <p className="font-semibold text-red-600">Order Cancelled</p>
              <p className="text-sm text-gray-500 mt-1">Please speak to café staff</p>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {STATUS_FLOW.map((step, idx) => {
                const isDone = idx < currentStatusIndex;
                const isActive = idx === currentStatusIndex;
                const isPending = idx > currentStatusIndex;

                return (
                  <div key={step.status} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isDone ? 'bg-green-100' : isActive ? 'ring-2 ring-offset-1' : 'bg-gray-100'
                        }`}
                        style={isActive ? { backgroundColor: `${themeColor}20`, ringColor: themeColor } : {}}
                      >
                        {isDone ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : isActive ? (
                          <step.icon className="w-5 h-5" style={{ color: themeColor }} />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className={`w-0.5 h-6 mt-1 rounded-full transition-all duration-500 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>

                    <div className="pt-1.5 pb-6">
                      <p className={`font-semibold text-sm ${isDone ? 'text-green-700' : isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                        {isActive && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal" style={{ color: themeColor }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: themeColor }}></span>
                            In progress
                          </span>
                        )}
                      </p>
                      {(isDone || isActive) && (
                        <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear Total Bill Breakdown Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <Receipt className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900 text-base">Total Bill Summary</h3>
          </div>

          {/* Itemized breakdown */}
          <div className="space-y-2.5 py-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{item.quantity} × {item.itemNameSnapshot}</span>
                  {item.note && <p className="text-xs text-gray-400 ml-1">"{item.note}"</p>}
                </div>
                <span className="text-gray-800 font-semibold">
                  {formatCurrency(Number(item.priceSnapshot) * item.quantity, order.restaurant?.currencySymbol)}
                </span>
              </div>
            ))}
          </div>

          {order.customerNote && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-800 font-medium">Special Request: {order.customerNote}</p>
            </div>
          )}

          {/* Bill Total Summary Footer */}
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Items Subtotal</span>
              <span>{formatCurrency(order.subtotal, order.restaurant?.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Taxes & Charges</span>
              <span className="text-gray-400">Included</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200/80">
              <div>
                <p className="text-sm font-bold text-gray-900">Total Amount</p>
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                  <CreditCard size={12} />
                  <span>Pay at counter</span>
                </p>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">
                {formatCurrency(order.subtotal, order.restaurant?.currencySymbol)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Return to menu to order more items */}
        <Link
          to={`/order/${slug}/${tableNumber}`}
          className="w-full py-4 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-gray-100 shadow-sm"
          style={{ borderColor: themeColor, color: themeColor }}
        >
          <span>+ Order More Items / Back to Menu</span>
        </Link>
      </div>
    </div>
  );
}

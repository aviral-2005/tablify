import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { joinRestaurantRoom, connectSocket, getSocket } from '../../services/socket';
import { Clock, CheckCircle, ChefHat, Bell, RefreshCw } from 'lucide-react';
import { formatTime, getTimeAgo } from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_COLS = [
  { status: 'NEW', label: 'New Orders', color: 'blue', headerClass: 'bg-blue-600', dotClass: 'bg-blue-500', badgeClass: 'bg-blue-100 text-blue-700' },
  { status: 'ACCEPTED', label: 'Accepted', color: 'indigo', headerClass: 'bg-indigo-600', dotClass: 'bg-indigo-500', badgeClass: 'bg-indigo-100 text-indigo-700' },
  { status: 'PREPARING', label: 'Preparing', color: 'yellow', headerClass: 'bg-yellow-500', dotClass: 'bg-yellow-400', badgeClass: 'bg-yellow-100 text-yellow-700' },
  { status: 'READY', label: 'Ready', color: 'green', headerClass: 'bg-green-600', dotClass: 'bg-green-500', badgeClass: 'bg-green-100 text-green-700' },
];

const NEXT_STATUS = {
  NEW: { status: 'ACCEPTED', label: 'Accept', color: 'bg-blue-600 hover:bg-blue-700' },
  ACCEPTED: { status: 'PREPARING', label: 'Start Preparing', color: 'bg-indigo-600 hover:bg-indigo-700' },
  PREPARING: { status: 'READY', label: 'Mark Ready', color: 'bg-yellow-500 hover:bg-yellow-600' },
  READY: { status: 'COMPLETED', label: 'Complete', color: 'bg-green-600 hover:bg-green-700' },
};

export default function KitchenDashboard() {
  const { restaurant } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  const loadOrders = useCallback(async () => {
    try {
      const res = await kitchenApi.getOrders();
      setOrders(res.data.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    if (!restaurant?.id) return;

    const socket = connectSocket();
    joinRestaurantRoom(restaurant.id);

    socket.on('new_order', (data) => {
      loadOrders();
      setNewOrderIds((prev) => new Set([...prev, data.orderId]));
      playNewOrderSound();
      toast.info(`New order #${data.orderNumber} - Table ${data.tableNumber}`);
      // Remove highlight after 5s
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(data.orderId);
          return next;
        });
      }, 5000);
    });

    socket.on('order_status_updated', () => {
      loadOrders();
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, [restaurant?.id]);

  const playNewOrderSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playBeep(660, 0, 0.2);
      playBeep(880, 0.25, 0.2);
      playBeep(1100, 0.5, 0.3);
    } catch {}
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingIds((prev) => new Set([...prev, orderId]));
    try {
      await kitchenApi.updateStatus(orderId, newStatus);
      if (newStatus === 'COMPLETED') {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const ordersByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.status] = orders.filter((o) => o.status === col.status);
    return acc;
  }, {});

  const totalActive = orders.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <LoadingSpinner size="xl" className="border-white/20 border-t-white" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          {STATUS_COLS.map((col) => (
            <div key={col.status} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${col.dotClass}`} />
              <span className="text-gray-400 text-sm">{col.label}:</span>
              <span className="text-white font-bold text-sm">{ordersByStatus[col.status]?.length || 0}</span>
            </div>
          ))}
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600 transition-colors text-sm"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Kanban columns */}
      {totalActive === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl font-medium">No active orders</p>
            <p className="text-gray-600 text-sm mt-2">New orders will appear here in real-time</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden min-h-0">
          {STATUS_COLS.map((col) => (
            <div key={col.status} className="flex-shrink-0 w-72 flex flex-col min-h-0">
              {/* Column header */}
              <div className={`${col.headerClass} rounded-t-xl px-4 py-2.5 flex items-center justify-between`}>
                <h3 className="text-white font-semibold text-sm">{col.label}</h3>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {ordersByStatus[col.status]?.length || 0}
                </span>
              </div>

              {/* Orders */}
              <div className="flex-1 overflow-y-auto bg-gray-800 rounded-b-xl p-2 space-y-2">
                {ordersByStatus[col.status]?.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-gray-600 text-sm">
                    No orders
                  </div>
                ) : (
                  ordersByStatus[col.status].map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      col={col}
                      isNew={newOrderIds.has(order.id)}
                      isUpdating={updatingIds.has(order.id)}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KitchenOrderCard({ order, col, isNew, isUpdating, onStatusUpdate }) {
  const next = NEXT_STATUS[order.status];

  return (
    <div className={`bg-gray-700 rounded-xl p-3 transition-all duration-300 ${isNew ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-800' : ''}`}>
      {/* Order header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isNew && <Bell className="w-3.5 h-3.5 text-blue-400 animate-bounce" />}
          <span className="text-white font-bold text-sm">#{order.orderNumber}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${col.badgeClass}`}>
            Table {order.table?.tableNumber}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock size={11} />
          {getTimeAgo(order.createdAt)}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-gray-300 text-sm font-semibold w-6 flex-shrink-0">{item.quantity}×</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-200 text-sm leading-tight">{item.itemNameSnapshot}</p>
              {item.note && (
                <p className="text-amber-400 text-xs mt-0.5">"{item.note}"</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customer note */}
      {order.customerNote && (
        <div className="mb-3 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-300 text-xs">📝 {order.customerNote}</p>
        </div>
      )}

      {/* Action button */}
      {next && (
        <button
          onClick={() => onStatusUpdate(order.id, next.status)}
          disabled={isUpdating}
          className={`w-full py-2 rounded-lg text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${next.color}`}
        >
          {isUpdating ? (
            <span className="flex items-center justify-center gap-1.5">
              <LoadingSpinner size="sm" className="border-white/30 border-t-white" />
              Updating...
            </span>
          ) : (
            next.label
          )}
        </button>
      )}

      {order.status === 'READY' && (
        <p className="text-center text-xs text-green-400 mt-1 font-medium">Waiting for pickup/service</p>
      )}
    </div>
  );
}

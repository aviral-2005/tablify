import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { OrderStatusBadge, formatCurrency, formatTime } from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

const STATUSES = ['ALL', 'NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export default function AdminOrders() {
  const { restaurant } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const sym = restaurant?.currencySymbol || '₹';

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      const res = await adminApi.getOrders(params);
      setOrders(res.data.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedStatus]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} orders</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm flex items-center gap-1.5">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedStatus === s
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'ALL' ? 'All Orders' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedOrder(order)}
            >
              <div>
                <p className="font-bold text-gray-900">#{order.orderNumber}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatTime(order.createdAt)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-800">Table {order.table?.tableNumber}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">
                  {order.items?.map((i) => `${i.quantity}× ${i.itemNameSnapshot}`).join(', ')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">{formatCurrency(order.subtotal, sym)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order detail modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.orderNumber}`}>
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Table {selectedOrder.table?.tableNumber}</p>
                <p className="text-xs text-gray-400">{formatTime(selectedOrder.createdAt)}</p>
              </div>
              <div className="text-right">
                <OrderStatusBadge status={selectedOrder.status} />
                <p className="text-xs text-gray-400 mt-1">{selectedOrder.paymentStatus}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.quantity}× {item.itemNameSnapshot}</span>
                    {item.note && <p className="text-xs text-gray-400">"{item.note}"</p>}
                  </div>
                  <span className="font-medium">{formatCurrency(Number(item.priceSnapshot) * item.quantity, sym)}</span>
                </div>
              ))}
            </div>

            {selectedOrder.customerNote && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700">Customer Note: {selectedOrder.customerNote}</p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900 text-lg">{formatCurrency(selectedOrder.subtotal, sym)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

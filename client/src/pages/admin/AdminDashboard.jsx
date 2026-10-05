import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShoppingBag, TrendingUp, Clock, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency, OrderStatusBadge, formatTime } from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const STATUS_COLORS = {
  NEW: '#3B82F6',
  ACCEPTED: '#6366F1',
  PREPARING: '#EAB308',
  READY: '#22C55E',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444',
};

export default function AdminDashboard() {
  const { restaurant } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboard();
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { stats, statusCounts, recentOrders, topItems } = data;
  const sym = restaurant?.currencySymbol || '₹';

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: 'blue', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue, sym), icon: TrendingUp, color: 'green', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'amber', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Completed Today', value: stats.completedOrders, icon: CheckCircle, color: 'indigo', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm flex items-center gap-1.5">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders by status chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
          {statusCounts.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statusCounts} barSize={32}>
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusCounts.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top items */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top Items Today</h2>
          {topItems.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No orders today</div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand-600">#{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                      <div
                        className="h-1.5 rounded-full bg-brand-500"
                        style={{ width: `${Math.min(100, (item.quantity / (topItems[0]?.quantity || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No orders yet</div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-5 py-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600">Table {order.table?.tableNumber}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {order.items?.map((i) => `${i.quantity}× ${i.itemNameSnapshot}`).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <OrderStatusBadge status={order.status} />
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatCurrency(order.subtotal, sym)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

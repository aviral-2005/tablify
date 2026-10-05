export function OrderStatusBadge({ status }) {
  const config = {
    NEW: { label: 'New Order', className: 'badge-new' },
    ACCEPTED: { label: 'Accepted', className: 'badge-accepted' },
    PREPARING: { label: 'Preparing', className: 'badge-preparing' },
    READY: { label: 'Ready', className: 'badge-ready' },
    COMPLETED: { label: 'Completed', className: 'badge-completed' },
    CANCELLED: { label: 'Cancelled', className: 'badge-cancelled' },
  };

  const c = config[status] || { label: status, className: 'badge bg-gray-100 text-gray-600' };

  return <span className={c.className}>{c.label}</span>;
}

export function VegBadge({ isVegetarian }) {
  return (
    <div className={isVegetarian ? 'veg-dot' : 'nonveg-dot'} title={isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}>
      <div className={`w-2 h-2 rounded-full ${isVegetarian ? 'bg-green-600' : 'bg-red-600'}`} />
    </div>
  );
}

export function formatCurrency(amount, symbol = '₹') {
  return `${symbol}${Number(amount).toFixed(0)}`;
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2, Loader2, Search, Eye, EyeOff, Filter } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { VegBadge, formatCurrency } from '../../components/ui/StatusBadge';

export default function AdminMenu() {
  const { restaurant } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [form, setForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isVegetarian: true,
    isAvailable: true,
    displayOrder: 0,
  });

  const load = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([adminApi.getMenu(), adminApi.getCategories()]);
      setItems(menuRes.data.data);
      setCategories(catRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryId: categories[0]?.id || '', name: '', description: '', price: '', imageUrl: '', isVegetarian: true, isAvailable: true, displayOrder: 0 });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      imageUrl: item.imageUrl || '',
      isVegetarian: item.isVegetarian,
      isAvailable: item.isAvailable,
      displayOrder: item.displayOrder,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editing) {
        const res = await adminApi.updateMenuItem(editing.id, payload);
        setItems((prev) => prev.map((i) => i.id === editing.id ? res.data.data : i));
        toast.success('Item updated');
      } else {
        const res = await adminApi.createMenuItem(payload);
        setItems((prev) => [...prev, res.data.data]);
        toast.success('Item created');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    setDeletingId(id);
    try {
      await adminApi.deleteMenuItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Item deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete item with existing orders');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (item) => {
    setTogglingId(item.id);
    try {
      await adminApi.toggleAvailability(item.id, !item.isAvailable);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
    } catch (err) {
      toast.error('Failed to update availability');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = items.filter((item) => {
    if (filterCategory && item.categoryId !== filterCategory) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Group by category
  const grouped = categories.map((cat) => ({
    ...cat,
    items: filtered.filter((i) => i.categoryId === cat.id),
  })).filter((cat) => cat.items.length > 0);

  const sym = restaurant?.currencySymbol || '₹';

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} items across {categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn gap-2">
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="input w-44"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Items */}
      {grouped.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 mb-4">No items found</p>
          <button onClick={openCreate} className="btn-primary btn">Add First Item</button>
        </div>
      ) : (
        grouped.map((cat) => (
          <div key={cat.id} className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700 text-sm">{cat.name} ({cat.items.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {cat.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  {/* Image */}
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-100" onError={(e) => e.target.style.display='none'} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <VegBadge isVegetarian={item.isVegetarian} />
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                      {!item.isAvailable && <span className="badge bg-red-50 text-red-500 text-xs">Unavailable</span>}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
                    )}
                    <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(item.price, sym)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      disabled={togglingId === item.id}
                      title={item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      className={`btn-ghost btn-sm p-2 ${item.isAvailable ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-green-500'}`}
                    >
                      {togglingId === item.id ? <Loader2 size={15} className="animate-spin" /> : item.isAvailable ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => openEdit(item)} className="btn-ghost btn-sm p-2">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="btn-ghost btn-sm p-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      {deletingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Menu Item' : 'New Menu Item'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cappuccino" autoFocus />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price (₹) *</label>
              <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" min={0} step="0.5" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description of the item..." />
            </div>
            <div className="col-span-2">
              <label className="label">Image URL</label>
              <input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-auto rounded-xl object-cover border border-gray-100" onError={(e) => e.target.style.display='none'} />
              )}
            </div>
            <div>
              <label className="label">Display Order</label>
              <input type="number" className="input" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isVegetarian} onChange={(e) => setForm({ ...form, isVegetarian: e.target.checked })} className="w-4 h-4 rounded accent-green-600" />
                <span className="text-sm text-gray-700">Vegetarian</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="w-4 h-4 rounded accent-brand-600" />
                <span className="text-sm text-gray-700">Available</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editing ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

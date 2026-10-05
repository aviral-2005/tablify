import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Plus, Pencil, Trash2, Loader2, GripVertical, Eye, EyeOff } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', displayOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', displayOrder: categories.length });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, displayOrder: cat.displayOrder });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await adminApi.updateCategory(editing.id, form);
        setCategories((prev) => prev.map((c) => c.id === editing.id ? res.data.data : c));
        toast.success('Category updated');
      } else {
        const res = await adminApi.createCategory(form);
        setCategories((prev) => [...prev, res.data.data]);
        toast.success('Category created');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Menu items in this category cannot be deleted if they have orders.')) return;
    setDeletingId(id);
    try {
      await adminApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary btn gap-2">
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 mb-4">No categories yet</p>
          <button onClick={openCreate} className="btn-primary btn">Add First Category</button>
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-4">
              <GripVertical className="text-gray-300 flex-shrink-0" size={18} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{cat.name}</p>
                <p className="text-sm text-gray-400">{cat._count?.menuItems || 0} items · Order: {cat.displayOrder}</p>
              </div>
              <div className="flex items-center gap-2">
                {!cat.isActive && <span className="badge bg-gray-100 text-gray-500">Hidden</span>}
                <button onClick={() => openEdit(cat)} className="btn-ghost btn-sm p-2">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="btn-ghost btn-sm p-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  {deletingId === cat.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <div>
            <label className="label">Category Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Coffee, Snacks, Desserts"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Display Order</label>
            <input
              type="number"
              className="input"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <p className="text-xs text-gray-400 mt-1">Lower number shows first</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

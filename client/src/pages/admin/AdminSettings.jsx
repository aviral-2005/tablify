import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loader2, Save } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminSettings() {
  const { restaurant } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await adminApi.getRestaurant();
      const r = res.data.data;
      setForm({
        name: r.name || '',
        description: r.description || '',
        phone: r.phone || '',
        address: r.address || '',
        openingHours: r.openingHours || '',
        logoUrl: r.logoUrl || '',
        coverImageUrl: r.coverImageUrl || '',
        themeColor: r.themeColor || '#D97706',
        currency: r.currency || 'INR',
        currencySymbol: r.currencySymbol || '₹',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateRestaurant(form);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  if (loading || !form) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const previewUrl = form.logoUrl || '';

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your café profile and branding</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary btn gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Basic info */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Basic Information</h2>

        <div>
          <label className="label">Restaurant Name *</label>
          <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What makes your café special..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Opening Hours</label>
            <input className="input" value={form.openingHours} onChange={(e) => update('openingHours', e.target.value)} placeholder="Mon-Sun: 8AM - 11PM" />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <textarea className="input resize-none" rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Full address..." />
        </div>
      </div>

      {/* Branding */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Branding</h2>

        <div>
          <label className="label">Logo URL</label>
          <input className="input" value={form.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} placeholder="https://..." />
          {form.logoUrl && (
            <img src={form.logoUrl} alt="logo" className="mt-2 h-16 w-16 rounded-xl object-cover border border-gray-100" onError={(e) => e.target.style.display='none'} />
          )}
        </div>

        <div>
          <label className="label">Cover Image URL</label>
          <input className="input" value={form.coverImageUrl} onChange={(e) => update('coverImageUrl', e.target.value)} placeholder="https://..." />
          {form.coverImageUrl && (
            <img src={form.coverImageUrl} alt="cover" className="mt-2 h-24 w-full rounded-xl object-cover border border-gray-100" onError={(e) => e.target.style.display='none'} />
          )}
        </div>

        <div>
          <label className="label">Theme Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.themeColor}
              onChange={(e) => update('themeColor', e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"
            />
            <input
              className="input max-w-xs"
              value={form.themeColor}
              onChange={(e) => update('themeColor', e.target.value)}
              placeholder="#D97706"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Used for buttons and accents in the customer menu</p>
        </div>
      </div>

      {/* Currency */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Currency</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Currency Code</label>
            <input className="input" value={form.currency} onChange={(e) => update('currency', e.target.value)} placeholder="INR" />
          </div>
          <div>
            <label className="label">Currency Symbol</label>
            <input className="input" value={form.currencySymbol} onChange={(e) => update('currencySymbol', e.target.value)} placeholder="₹" />
          </div>
        </div>
      </div>

      {/* QR Code URL Preview */}
      <div className="card p-5 bg-amber-50 border border-amber-100">
        <h3 className="font-semibold text-amber-900 mb-1 text-sm">Customer Menu URL</h3>
        <p className="text-xs text-amber-700">
          Customers scan QR to reach:{' '}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-800">
            {window.location.origin}/order/{restaurant?.slug || 'your-slug'}/[table-number]
          </code>
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary btn-lg gap-2">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

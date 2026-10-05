import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Loader2, Download, QrCode, ExternalLink } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminTables() {
  const { restaurant } = useAuth();
  const toast = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', displayName: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  const load = async () => {
    try {
      const res = await adminApi.getTables();
      setTables(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.tableNumber.trim()) {
      toast.error('Table number is required');
      return;
    }
    setSaving(true);
    try {
      const res = await adminApi.createTable({
        tableNumber: form.tableNumber,
        displayName: form.displayName || `Table ${form.tableNumber}`,
      });
      setTables((prev) => [...prev, { ...res.data.data, qrCode: null, qrUrl: null }]);
      setModalOpen(false);
      toast.success('Table created');
      // Reload to get QR
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create table');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this table? This will remove all QR codes for this table.')) return;
    setDeletingId(id);
    try {
      await adminApi.deleteTable(id);
      setTables((prev) => prev.filter((t) => t.id !== id));
      toast.success('Table deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete table with active orders');
    } finally {
      setDeletingId(null);
    }
  };

  const downloadQR = (table) => {
    if (!table.qrCode) return;
    const link = document.createElement('a');
    link.download = `QR-Table-${table.tableNumber}-${restaurant?.name?.replace(/\s+/g, '-')}.png`;
    link.href = table.qrCode;
    link.click();
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tables & QR Codes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tables.length} tables configured</p>
        </div>
        <button onClick={() => { setForm({ tableNumber: '', displayName: '' }); setModalOpen(true); }} className="btn-primary btn gap-2">
          <Plus size={16} />
          Add Table
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🪑</div>
          <p className="text-gray-500 font-medium mb-4">No tables configured yet</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary btn">Add First Table</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="card p-4 flex flex-col items-center gap-3 group hover:shadow-md transition-all">
              {/* QR Code */}
              <div
                className="w-full aspect-square rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden cursor-pointer p-2 group-hover:border-brand-200 transition-colors"
                onClick={() => setQrModal(table)}
              >
                {table.qrCode ? (
                  <img src={table.qrCode} alt={`QR for Table ${table.tableNumber}`} className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-12 h-12 text-gray-200" />
                )}
              </div>

              {/* Table info */}
              <div className="text-center">
                <p className="font-bold text-gray-900 text-sm">Table {table.tableNumber}</p>
                {table.displayName && table.displayName !== `Table ${table.tableNumber}` && (
                  <p className="text-xs text-gray-400">{table.displayName}</p>
                )}
                {table._count?.orders > 0 && (
                  <span className="badge bg-amber-100 text-amber-700 mt-1">{table._count.orders} active</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 w-full">
                <button
                  onClick={() => downloadQR(table)}
                  disabled={!table.qrCode}
                  className="btn-secondary btn-sm flex-1 gap-1 text-xs"
                  title="Download QR"
                >
                  <Download size={12} />
                  Download
                </button>
                <a
                  href={table.qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-sm p-2"
                  title="Open table URL"
                >
                  <ExternalLink size={12} />
                </a>
                <button
                  onClick={() => handleDelete(table.id)}
                  disabled={deletingId === table.id}
                  className="btn-ghost btn-sm p-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  {deletingId === table.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Full view modal */}
      <Modal isOpen={!!qrModal} onClose={() => setQrModal(null)} title={`Table ${qrModal?.tableNumber} QR Code`} size="sm">
        {qrModal && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-xs mx-auto bg-white rounded-2xl border border-gray-100 p-4">
              <img src={qrModal.qrCode} alt="QR Code" className="w-full" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{restaurant?.name}</p>
              <p className="text-gray-500 text-sm">Table {qrModal.tableNumber}</p>
              <p className="text-xs text-gray-400 mt-1 break-all">{qrModal.qrUrl}</p>
            </div>
            <div className="flex gap-3 w-full">
              <a
                href={qrModal.qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 btn gap-1.5"
              >
                <ExternalLink size={14} />
                Open URL
              </a>
              <button onClick={() => downloadQR(qrModal)} className="btn-primary flex-1 btn gap-1.5">
                <Download size={14} />
                Download PNG
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create table modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Table">
        <div className="space-y-4">
          <div>
            <label className="label">Table Number *</label>
            <input
              className="input"
              value={form.tableNumber}
              onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
              placeholder="e.g. 1, 2, A1, Terrace-1"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Display Name (optional)</label>
            <input
              className="input"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="e.g. Window Seat, Corner Table"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Create & Generate QR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Loader,
  ChevronDown,
  ChevronRight,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  inventoryApi,
  materialsApi,
  InventoryItem,
  StockMovementItem,
  Material,
} from '../services';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface NewStockForm {
  material_id: number | '';
  thickness_mm: number | '';
  sheet_width_mm: number | '';
  sheet_height_mm: number | '';
  quantity_sheets: number;
  cost_per_sheet: number;
  low_threshold: number;
  supplier: string;
  supplier_url: string;
  notes: string;
}

const EMPTY_FORM: NewStockForm = {
  material_id: '',
  thickness_mm: '',
  sheet_width_mm: '',
  sheet_height_mm: '',
  quantity_sheets: 0,
  cost_per_sheet: 0,
  low_threshold: 5,
  supplier: '',
  supplier_url: '',
  notes: '',
};

export const Inventory: React.FC = () => {
  useDocumentTitle('Inventory — LaserHub');
  const { currency } = useCurrencyStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewStockForm>(EMPTY_FORM);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [movements, setMovements] = useState<Record<number, StockMovementItem[]>>({});

  const load = async () => {
    try {
      const [stock, mats] = await Promise.all([inventoryApi.list(), materialsApi.listMaterials()]);
      setItems(stock);
      setMaterials(mats);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const alertCount = useMemo(() => items.filter((i) => i.is_low).length, [items]);

  const handleAdjust = async (id: number, delta: number) => {
    try {
      const updated = await inventoryApi.adjust(id, delta, delta > 0 ? 'manual add' : 'manual remove');
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      // Invalidate movements cache for expanded row
      if (expanded[id]) {
        const mv = await inventoryApi.movements(id);
        setMovements((m) => ({ ...m, [id]: mv }));
      }
    } catch {
      toast.error('Adjustment failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this inventory line?')) return;
    try {
      await inventoryApi.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleCreate = async () => {
    if (!form.material_id || !form.thickness_mm || !form.sheet_width_mm || !form.sheet_height_mm) {
      toast.error('Material, thickness, and sheet size are required');
      return;
    }
    try {
      const created = await inventoryApi.create({
        material_id: Number(form.material_id),
        thickness_mm: Number(form.thickness_mm),
        sheet_width_mm: Number(form.sheet_width_mm),
        sheet_height_mm: Number(form.sheet_height_mm),
        quantity_sheets: Number(form.quantity_sheets || 0),
        cost_per_sheet: Number(form.cost_per_sheet || 0),
        low_threshold: Number(form.low_threshold || 0),
        supplier: form.supplier,
        supplier_url: form.supplier_url,
        notes: form.notes,
      });
      setItems((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Stock line added');
    } catch {
      toast.error('Failed to add stock');
    }
  };

  const toggleExpand = async (id: number) => {
    const nextOpen = !expanded[id];
    setExpanded((e) => ({ ...e, [id]: nextOpen }));
    if (nextOpen && !movements[id]) {
      try {
        const mv = await inventoryApi.movements(id);
        setMovements((m) => ({ ...m, [id]: mv }));
      } catch {
        // silent
      }
    }
  };

  if (loading) {
    return (
      <div className="adm-loading">
        <Loader className="spinner" size={32} />
        <p>Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="adm-page animate-in">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-page-title">
            <Boxes size={22} /> Inventory
            {alertCount > 0 && (
              <span
                className="adm-badge"
                style={{
                  marginLeft: 8,
                  background: 'var(--warning-color, #f59e0b)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                }}
              >
                <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {alertCount} low
              </span>
            )}
          </h1>
          <p className="adm-page-sub">Track your material sheet stock and reorder thresholds</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="adm-btn adm-btn--primary">
          <Plus size={15} /> Add Stock
        </button>
      </header>

      {showForm && (
        <div className="adm-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>New stock line</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
              gap: '0.75rem',
            }}
          >
            <label>
              <span style={{ fontSize: '0.8rem' }}>Material</span>
              <select
                value={form.material_id}
                onChange={(e) => setForm({ ...form, material_id: e.target.value ? Number(e.target.value) : '' })}
                style={{ width: '100%', padding: '0.45rem', borderRadius: 6, border: '1px solid var(--border-color)' }}
              >
                <option value="">Select material…</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <InputNum label="Thickness (mm)" value={form.thickness_mm} onChange={(v) => setForm({ ...form, thickness_mm: v })} />
            <InputNum label="Sheet W (mm)" value={form.sheet_width_mm} onChange={(v) => setForm({ ...form, sheet_width_mm: v })} />
            <InputNum label="Sheet H (mm)" value={form.sheet_height_mm} onChange={(v) => setForm({ ...form, sheet_height_mm: v })} />
            <InputNum label="Quantity" value={form.quantity_sheets} onChange={(v) => setForm({ ...form, quantity_sheets: Number(v) || 0 })} />
            <InputNum label="Cost / sheet" value={form.cost_per_sheet} onChange={(v) => setForm({ ...form, cost_per_sheet: Number(v) || 0 })} />
            <InputNum label="Low threshold" value={form.low_threshold} onChange={(v) => setForm({ ...form, low_threshold: Number(v) || 0 })} />
            <label>
              <span style={{ fontSize: '0.8rem' }}>Supplier</span>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                style={{ width: '100%', padding: '0.45rem', borderRadius: 6, border: '1px solid var(--border-color)' }}
              />
            </label>
            <label>
              <span style={{ fontSize: '0.8rem' }}>Supplier URL</span>
              <input
                type="text"
                value={form.supplier_url}
                onChange={(e) => setForm({ ...form, supplier_url: e.target.value })}
                style={{ width: '100%', padding: '0.45rem', borderRadius: 6, border: '1px solid var(--border-color)' }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={handleCreate} className="adm-btn adm-btn--primary">
              <Save size={14} /> Save
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="adm-btn"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th></th>
                <th>Material</th>
                <th>Thickness</th>
                <th>Sheet Size</th>
                <th>In Stock</th>
                <th>Cost / Sheet</th>
                <th>Supplier</th>
                <th style={{ minWidth: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="adm-empty-row">No inventory yet. Click "Add Stock" to get started.</td>
                </tr>
              )}
              {items.map((item) => {
                const low = item.is_low;
                const empty = item.quantity_sheets <= 0;
                const rowStyle: React.CSSProperties = empty
                  ? { background: 'rgba(239,68,68,0.08)' }
                  : low
                  ? { background: 'rgba(245,158,11,0.12)' }
                  : {};
                return (
                  <React.Fragment key={item.id}>
                    <tr style={rowStyle}>
                      <td>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="adm-btn adm-btn--ghost-sm"
                          aria-label="Toggle history"
                          style={{ padding: '0.25rem' }}
                        >
                          {expanded[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </td>
                      <td className="adm-cell-bold">{item.material_name}</td>
                      <td>{item.thickness_mm} mm</td>
                      <td className="adm-cell-sub">
                        {item.sheet_width_mm} × {item.sheet_height_mm} mm
                      </td>
                      <td className="adm-cell-bold">
                        {item.quantity_sheets}
                        {low && (
                          <span style={{ marginLeft: 6, color: 'var(--warning-color, #f59e0b)' }}>
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </td>
                      <td>{formatPrice(item.cost_per_sheet, currency)}</td>
                      <td className="adm-cell-sub">
                        {item.supplier_url ? (
                          <a href={item.supplier_url} target="_blank" rel="noreferrer">
                            {item.supplier || item.supplier_url}
                          </a>
                        ) : (
                          item.supplier || '—'
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button
                            className="adm-btn adm-btn--ghost-sm"
                            onClick={() => handleAdjust(item.id, -1)}
                            aria-label="Decrement"
                          >
                            <Minus size={12} />
                          </button>
                          <button
                            className="adm-btn adm-btn--ghost-sm"
                            onClick={() => handleAdjust(item.id, 1)}
                            aria-label="Increment"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            className="adm-btn adm-btn--ghost-sm"
                            onClick={() => handleAdjust(item.id, 10)}
                          >
                            +10
                          </button>
                          <button
                            className="adm-btn adm-btn--ghost-sm"
                            onClick={() => handleDelete(item.id)}
                            aria-label="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded[item.id] && (
                      <tr>
                        <td colSpan={8} style={{ background: 'var(--bg-secondary, #f9fafb)', padding: '0.75rem 1rem' }}>
                          <strong style={{ fontSize: '0.8rem' }}>Recent movements</strong>
                          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1rem', fontSize: '0.8rem' }}>
                            {(movements[item.id] || []).length === 0 && (
                              <li style={{ color: 'var(--text-secondary)' }}>No movements yet.</li>
                            )}
                            {(movements[item.id] || []).map((m) => (
                              <li key={m.id}>
                                <span style={{ color: m.delta > 0 ? 'var(--success-color,#22c55e)' : 'var(--error-color,#ef4444)' }}>
                                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                                </span>
                                {' — '}
                                {m.reason || 'no reason'}
                                <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>
                                  {new Date(m.created_at).toLocaleString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function InputNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
}) {
  return (
    <label>
      <span style={{ fontSize: '0.8rem' }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        style={{ width: '100%', padding: '0.45rem', borderRadius: 6, border: '1px solid var(--border-color)' }}
      />
    </label>
  );
}

export default Inventory;

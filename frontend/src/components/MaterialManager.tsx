import React, { useState, useEffect, useMemo } from 'react';
import { materialsApi, Material, type MaterialConfig } from '../services';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Layers,
  Settings,
  Search,
  ImageOff,
} from 'lucide-react';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';
import { Skeleton } from './Skeleton';

export const MaterialManager: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [expandedMaterial, setExpandedMaterial] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const { currency } = useCurrencyStore();
  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    type: 'acrylic',
    rate_per_cm2_mm: 0.05,
    available_thicknesses: [3, 5, 10],
    description: '',
    image_url: '',
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await materialsApi.listMaterials();
      setMaterials(data);
    } catch (error) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = (configId: number, data: Partial<MaterialConfig>) => {
    setMaterials(prev => prev.map(m => ({
      ...m,
      configs: m.configs.map(c => c.id === configId ? { ...c, ...data } : c)
    })));
  };

  const handleSaveConfig = async (configId: number) => {
    try {
      const material = materials.find(m => m.configs.some(c => c.id === configId));
      if (!material) return;
      const config = material.configs.find(c => c.id === configId);
      if (!config) return;

      await materialsApi.updateConfig(configId, config);
      toast.success('Configuration saved');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await materialsApi.updateMaterial(isEditing, formData);
        toast.success('Material updated');
      } else {
        await materialsApi.createMaterial(formData as Omit<Material, 'id'>);
        toast.success('Material created');
      }
      setIsEditing(null);
      setShowAddForm(false);
      setFormData({
        name: '',
        type: 'acrylic',
        rate_per_cm2_mm: 0.05,
        available_thicknesses: [3, 5, 10],
        description: '',
        image_url: '',
      });
      loadMaterials();
    } catch (error) {
      toast.error('Failed to save material');
    }
  };

  const handleEdit = (material: Material) => {
    setIsEditing(material.id);
    setFormData(material);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this material?')) {
      try {
        await materialsApi.deleteMaterial(id);
        toast.success('Material deactivated');
        loadMaterials();
      } catch (error) {
        toast.error('Failed to deactivate material');
      }
    }
  };

  const handleThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const values = e.target.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    setFormData({ ...formData, available_thicknesses: values });
  };

  const visibleMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials
      .filter((m) => m.name !== 'Validation Test')
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          (m.description || '').toLowerCase().includes(q)
        );
      });
  }, [materials, search]);

  if (loading) {
    return (
      <div className="adm-page animate-in" aria-busy="true" aria-label="Loading materials">
        <header className="adm-page-header">
          <div>
            <h1 className="adm-page-title">Materials</h1>
            <p className="adm-page-sub">Manage materials, configs, and pricing</p>
          </div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Skeleton width="48px" height="48px" borderRadius="6px" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Skeleton height="1rem" width="40%" />
                <Skeleton height="0.75rem" width="70%" />
              </div>
              <Skeleton width="80px" height="1.75rem" borderRadius="6px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="adm-page animate-in">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-page-title"><Layers size={22} /> Materials</h1>
          <p className="adm-page-sub">Manage materials, rates and stock per thickness</p>
        </div>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="adm-btn adm-btn--primary">
            <Plus size={16} /> Add Material
          </button>
        )}
      </header>

      <div className="adm-toolbar">
        <div className="adm-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="adm-card adm-form">
          <h3 className="adm-card-title">{isEditing ? 'Edit Material' : 'Add New Material'}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Acrylic Clear"
                required
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="acrylic">Acrylic</option>
                <option value="wood_mdf">Wood/MDF</option>
                <option value="plywood">Plywood</option>
                <option value="leather">Leather</option>
                <option value="paper">Paper</option>
                <option value="aluminum">Aluminum</option>
                <option value="stainless_steel">Stainless Steel</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rate (per cm² per mm)</label>
              <input
                type="number"
                step="0.001"
                value={formData.rate_per_cm2_mm}
                onChange={e => setFormData({...formData, rate_per_cm2_mm: parseFloat(e.target.value)})}
                required
              />
            </div>
            <div className="form-group">
              <label>Thicknesses (mm, comma separated)</label>
              <input
                type="text"
                value={formData.available_thicknesses?.join(', ')}
                onChange={handleThicknessChange}
                placeholder="e.g. 3, 5, 10"
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of material usage..."
                rows={2}
              />
            </div>
            <div className="form-group full-width">
              <label>Image URL (optional)</label>
              <input
                type="url"
                value={formData.image_url || ''}
                onChange={e => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://example.com/material-image.jpg"
              />
              {formData.image_url && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img
                    src={formData.image_url}
                    alt="Material preview"
                    style={{ maxWidth: '120px', maxHeight: '80px', borderRadius: '6px', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => { setShowAddForm(false); setIsEditing(null); }} className="adm-btn adm-btn--ghost">
              <X size={15} /> Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn--primary">
              <Check size={15} /> {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="adm-card">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Thumb</th>
                <th>Name</th>
                <th>Type</th>
                <th>Rate (per cm²·mm)</th>
                <th>Thicknesses</th>
                <th style={{ width: '130px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleMaterials.length === 0 && (
                <tr>
                  <td colSpan={6} className="adm-empty-row">No materials found.</td>
                </tr>
              )}
              {visibleMaterials.map(material => (
                <React.Fragment key={material.id}>
                  <tr>
                    <td>
                      <div className="adm-thumb">
                        {material.image_url ? (
                          <img
                            src={material.image_url}
                            alt={material.name}
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                              img.parentElement?.classList.add('adm-thumb--fallback');
                            }}
                          />
                        ) : (
                          <ImageOff size={16} />
                        )}
                      </div>
                    </td>
                    <td className="adm-cell-bold">{material.name}</td>
                    <td className="adm-cell-capitalize">{material.type.replace('_', ' ')}</td>
                    <td className="adm-cell-accent">{formatPrice(material.rate_per_cm2_mm, currency)}</td>
                    <td>
                      <div className="adm-thickness-badges">
                        {material.available_thicknesses.map(t => (
                          <span key={t} className="adm-badge">{t}mm</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="adm-actions">
                        <button
                          onClick={() => handleEdit(material)}
                          className="adm-icon-btn"
                          title="Edit material"
                          aria-label="Edit material"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setExpandedMaterial(expandedMaterial === material.id ? null : material.id)}
                          className="adm-icon-btn"
                          title="Thickness configs"
                          aria-label="Thickness configs"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="adm-icon-btn adm-icon-btn--danger"
                          title="Deactivate material"
                          aria-label="Deactivate material"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedMaterial === material.id && (
                    <tr>
                      <td colSpan={6}>
                        <div className="adm-configs">
                          <div className="adm-configs-header">
                            <h4>Thickness Configs</h4>
                            <span className="adm-cell-sub">Custom rates and speeds per thickness</span>
                          </div>
                          <table className="adm-table adm-table--nested">
                            <thead>
                              <tr>
                                <th>Thickness</th>
                                <th>Rate</th>
                                <th>Speed (mm/min)</th>
                                <th>Stock</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {material.configs.map(config => (
                                <tr key={config.id}>
                                  <td className="adm-cell-bold">{config.thickness_mm}mm</td>
                                  <td>
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={config.rate_per_cm2}
                                      onChange={(e) => handleUpdateConfig(config.id, { rate_per_cm2: parseFloat(e.target.value) })}
                                      className="adm-inline-input"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      value={config.cut_speed_mm_min}
                                      onChange={(e) => handleUpdateConfig(config.id, { cut_speed_mm_min: parseFloat(e.target.value) })}
                                      className="adm-inline-input"
                                    />
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => handleUpdateConfig(config.id, { is_in_stock: !config.is_in_stock })}
                                      className={`adm-stock-toggle ${config.is_in_stock ? 'adm-stock-toggle--in' : 'adm-stock-toggle--out'}`}
                                    >
                                      {config.is_in_stock ? 'In Stock' : 'Out'}
                                    </button>
                                  </td>
                                  <td>
                                    <button onClick={() => handleSaveConfig(config.id)} className="adm-btn adm-btn--sm adm-btn--primary">
                                      Save
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

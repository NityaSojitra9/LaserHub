import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Trash2,
  Palette,
  Plus,
  Pencil,
  Star,
  Eye,
  EyeOff,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { superAdminApi, SADesign, SADesignCreate } from '../../services';
import { resolveMediaUrl } from '../../services/api';
import { DESIGN_CATEGORIES, EMPTY_DESIGN_FORM } from './_shared';

export function DesignsTab() {
  const [designs, setDesigns] = useState<SADesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SADesignCreate>({ ...EMPTY_DESIGN_FORM });
  const [tagsInput, setTagsInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not_featured'>('all');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminApi.getDesigns();
      setDesigns(data);
    } catch {
      toast.error('Failed to load designs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  const filtered = designs.filter((d) => {
    if (categoryFilter && d.category !== categoryFilter) return false;
    if (visibilityFilter === 'public' && !d.is_public) return false;
    if (visibilityFilter === 'private' && d.is_public) return false;
    if (featuredFilter === 'featured' && !d.is_featured) return false;
    if (featuredFilter === 'not_featured' && d.is_featured) return false;
    return true;
  });

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_DESIGN_FORM });
    setTagsInput('');
    setShowForm(true);
  };

  const openEditForm = (design: SADesign) => {
    setEditingId(design.id);
    setForm({
      title: design.title,
      description: design.description || '',
      category: design.category,
      tags: design.tags || [],
      thumbnail_url: design.thumbnail_url || '',
      is_public: design.is_public,
      is_featured: design.is_featured,
    });
    setTagsInput((design.tags || []).join(', '));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_DESIGN_FORM });
    setTagsInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = { ...form, tags };
    setSaving(true);

    try {
      if (editingId) {
        const updated = await superAdminApi.updateDesign(editingId, payload);
        setDesigns((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
        toast.success('Design updated');
      } else {
        const created = await superAdminApi.createDesign(payload);
        setDesigns((prev) => [created, ...prev]);
        toast.success('Design created');
      }
      closeForm();
    } catch {
      toast.error(editingId ? 'Failed to update design' : 'Failed to create design');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (design: SADesign, field: 'is_public' | 'is_featured') => {
    try {
      const updated = await superAdminApi.updateDesign(design.id, {
        [field]: !design[field],
      });
      setDesigns((prev) => prev.map((d) => (d.id === design.id ? updated : d)));
    } catch {
      toast.error('Failed to update design');
    }
  };

  const handleDelete = async (designId: number) => {
    try {
      await superAdminApi.deleteDesign(designId);
      setDesigns((prev) => prev.filter((d) => d.id !== designId));
      setDeleteConfirm(null);
      toast.success('Design deleted');
    } catch {
      toast.error('Failed to delete design');
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkFeature = async (feature: boolean) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    try {
      await Promise.all(
        ids.map((id) => superAdminApi.updateDesign(id, { is_featured: feature }))
      );
      toast.success(`${feature ? 'Featured' : 'Unfeatured'} ${ids.length} designs`);
      setSelected(new Set());
      fetchDesigns();
    } catch {
      toast.error('Bulk update failed');
    }
  };

  return (
    <div>
      <div className="sa-filters">
        <select
          className="role-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {DESIGN_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          className="role-select"
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
        >
          <option value="all">All visibility</option>
          <option value="public">Public only</option>
          <option value="private">Private only</option>
        </select>
        <select
          className="role-select"
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value as typeof featuredFilter)}
        >
          <option value="all">All featured</option>
          <option value="featured">Featured only</option>
          <option value="not_featured">Not featured</option>
        </select>
        <div className="sa-view-toggle">
          <button
            className={`sa-view-btn ${view === 'table' ? 'sa-view-btn--active' : ''}`}
            onClick={() => setView('table')}
            title="Table view"
          >
            <ListIcon size={16} />
          </button>
          <button
            className={`sa-view-btn ${view === 'grid' ? 'sa-view-btn--active' : ''}`}
            onClick={() => setView('grid')}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
        <button className="sa-btn sa-btn--primary-sm" onClick={openCreateForm}>
          <Plus size={16} /> Add Design
        </button>
      </div>

      <div className="sa-bulk-bar">
        <span className="sa-count">
          Showing {filtered.length} of {designs.length} designs
          {selected.size > 0 && ` · ${selected.size} selected`}
        </span>
        {selected.size > 0 && (
          <div className="sa-bulk-actions">
            <button className="sa-btn sa-btn--primary-sm" onClick={() => bulkFeature(true)}>
              <Star size={14} /> Feature
            </button>
            <button className="sa-btn sa-btn--ghost-sm" onClick={() => bulkFeature(false)}>
              Unfeature
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form className="sa-design-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Design' : 'Add New Design'}</h3>
          <div className="sa-design-form__grid">
            <div className="sa-design-form__field">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Design title"
                required
              />
            </div>
            <div className="sa-design-form__field">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {DESIGN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="sa-design-form__field sa-design-form__field--full">
              <label>Description</label>
              <textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the design"
                rows={3}
              />
            </div>
            <div className="sa-design-form__field sa-design-form__field--full">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. laser, acrylic, signage"
              />
            </div>
            <div className="sa-design-form__field sa-design-form__field--full">
              <label>Thumbnail URL</label>
              <input
                type="text"
                value={form.thumbnail_url || ''}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="https://example.com/image.svg"
              />
            </div>
            <div className="sa-design-form__field">
              <label className="sa-design-form__checkbox">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                />
                Public
              </label>
            </div>
            <div className="sa-design-form__field">
              <label className="sa-design-form__checkbox">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                Featured
              </label>
            </div>
          </div>
          <div className="sa-design-form__actions">
            <button type="submit" className="sa-btn sa-btn--primary-sm" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="sa-btn sa-btn--ghost-sm" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="sa-loading">Loading designs...</div>
      ) : filtered.length === 0 ? (
        <div className="sa-empty">No designs match these filters.</div>
      ) : view === 'table' ? (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === filtered.length}
                    onChange={() => {
                      if (selected.size === filtered.length) setSelected(new Set());
                      else setSelected(new Set(filtered.map((d) => d.id)));
                    }}
                  />
                </th>
                <th style={{ width: 56 }}>Thumb</th>
                <th>Title</th>
                <th>Category</th>
                <th>Public</th>
                <th>Featured</th>
                <th>Likes</th>
                <th>Creator</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className={selected.has(d.id) ? 'sa-row--selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(d.id)}
                      onChange={() => toggleSelect(d.id)}
                    />
                  </td>
                  <td>
                    {d.thumbnail_url ? (
                      <img
                        className="sa-design-thumb"
                        src={resolveMediaUrl(d.thumbnail_url)!}
                        alt={d.title}
                      />
                    ) : (
                      <div className="sa-design-thumb sa-design-thumb--placeholder">
                        <Palette size={18} />
                      </div>
                    )}
                  </td>
                  <td>{d.title}</td>
                  <td>
                    <span className="sa-badge">{d.category.replace('_', ' ')}</span>
                  </td>
                  <td>
                    <button
                      className={`sa-toggle ${d.is_public ? 'sa-toggle--on' : ''}`}
                      onClick={() => handleToggle(d, 'is_public')}
                      title={d.is_public ? 'Make private' : 'Make public'}
                    >
                      {d.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`sa-toggle ${d.is_featured ? 'sa-toggle--on' : ''}`}
                      onClick={() => handleToggle(d, 'is_featured')}
                      title={d.is_featured ? 'Remove featured' : 'Set featured'}
                    >
                      <Star size={16} />
                    </button>
                  </td>
                  <td>{d.likes_count}</td>
                  <td>{d.creator_name || '—'}</td>
                  <td>
                    {deleteConfirm === d.id ? (
                      <span className="sa-delete-confirm">
                        <button
                          className="sa-btn sa-btn--danger-sm"
                          onClick={() => handleDelete(d.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="sa-btn sa-btn--ghost-sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="sa-action-group">
                        <button
                          className="sa-btn sa-btn--ghost-sm sa-btn--icon"
                          onClick={() => openEditForm(d)}
                          title="Edit design"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="sa-btn sa-btn--ghost-sm sa-btn--icon"
                          onClick={() => {
                            if (!window.confirm(`Delete design "${d.title}"? This cannot be undone.`)) return;
                            handleDelete(d.id);
                          }}
                          title="Delete design"
                        >
                          <Trash2 size={16} />
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sa-design-grid">
          {filtered.map((d) => (
            <div className="sa-design-card" key={d.id}>
              <div className="sa-design-card__thumb">
                {d.thumbnail_url ? (
                  <img src={resolveMediaUrl(d.thumbnail_url)!} alt={d.title} />
                ) : (
                  <Palette size={32} />
                )}
                <input
                  type="checkbox"
                  className="sa-design-card__check"
                  checked={selected.has(d.id)}
                  onChange={() => toggleSelect(d.id)}
                />
                {d.is_featured && (
                  <span className="sa-design-card__badge">
                    <Star size={12} fill="currentColor" /> Featured
                  </span>
                )}
              </div>
              <div className="sa-design-card__body">
                <div className="sa-design-card__title">{d.title}</div>
                <div className="sa-design-card__meta">
                  <span className="sa-badge">{d.category.replace('_', ' ')}</span>
                  <span>{d.likes_count} likes</span>
                </div>
                <div className="sa-design-card__creator">{d.creator_name || 'Unknown creator'}</div>
                <div className="sa-design-card__actions">
                  <button
                    className={`sa-toggle ${d.is_public ? 'sa-toggle--on' : ''}`}
                    onClick={() => handleToggle(d, 'is_public')}
                    title={d.is_public ? 'Make private' : 'Make public'}
                  >
                    {d.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    className={`sa-toggle ${d.is_featured ? 'sa-toggle--on' : ''}`}
                    onClick={() => handleToggle(d, 'is_featured')}
                    title={d.is_featured ? 'Remove featured' : 'Set featured'}
                  >
                    <Star size={16} />
                  </button>
                  <button
                    className="sa-btn sa-btn--ghost-sm sa-btn--icon"
                    onClick={() => openEditForm(d)}
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="sa-btn sa-btn--ghost-sm sa-btn--icon"
                    onClick={() => {
                      if (!window.confirm(`Delete design "${d.title}"? This cannot be undone.`)) return;
                      handleDelete(d.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

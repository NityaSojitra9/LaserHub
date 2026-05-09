import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { superAdminApi, SAUser } from '../../services';

export function UsersTab() {
  const [users, setUsers] = useState<SAUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: { role?: string; search?: string } = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const data = await superAdminApi.getUsers(params);
      setUsers(data);
      if (!search && !roleFilter) setTotalCount(data.length);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    // fetch total once
    (async () => {
      try {
        const all = await superAdminApi.getUsers();
        setTotalCount(all.length);
      } catch { /* ignore */ }
    })();
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const updated = await superAdminApi.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleVerifyToggle = async (userId: number, current: boolean) => {
    try {
      const updated = await superAdminApi.updateUserVerification(userId, !current);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      toast.success(updated.is_verified ? 'User verified' : 'Verification removed');
    } catch {
      toast.error('Failed to update verification');
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await superAdminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
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

  const toggleSelectAll = () => {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  const bulkVerify = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    try {
      await Promise.all(
        ids.map((id) => superAdminApi.updateUserVerification(id, true))
      );
      toast.success(`Verified ${ids.length} users`);
      setSelected(new Set());
      fetchUsers();
    } catch {
      toast.error('Bulk verify failed');
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} users? This cannot be undone.`)) return;
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map((id) => superAdminApi.deleteUser(id)));
      toast.success(`Deleted ${ids.length} users`);
      setSelected(new Set());
      fetchUsers();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  return (
    <div>
      <div className="sa-filters">
        <div className="sa-search-wrapper">
          <Search size={16} />
          <input
            className="sa-search"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="role-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="sa-bulk-bar">
        <span className="sa-count">
          Showing {users.length} of {totalCount} users
          {selected.size > 0 && ` · ${selected.size} selected`}
        </span>
        {selected.size > 0 && (
          <div className="sa-bulk-actions">
            <button className="sa-btn sa-btn--primary-sm" onClick={bulkVerify}>
              <CheckCircle size={14} /> Verify selected
            </button>
            <button className="sa-btn sa-btn--danger-sm" onClick={bulkDelete}>
              <Trash2 size={14} /> Delete selected
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="sa-loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="sa-empty">No users found.</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selected.size > 0 && selected.size === users.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Orders</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={selected.has(u.id) ? 'sa-row--selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                    />
                  </td>
                  <td>{u.name}</td>
                  <td className="sa-email-cell">{u.email}</td>
                  <td>
                    <select
                      className="role-select role-select--inline"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`verify-toggle ${u.is_verified ? 'verify-toggle--active' : ''}`}
                      onClick={() => handleVerifyToggle(u.id, u.is_verified)}
                      title={u.is_verified ? 'Click to unverify' : 'Click to verify'}
                    >
                      {u.is_verified ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    </button>
                  </td>
                  <td>{u.order_count}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {deleteConfirm === u.id ? (
                      <span className="sa-delete-confirm">
                        <button className="sa-btn sa-btn--danger-sm" onClick={() => handleDelete(u.id)}>
                          Confirm
                        </button>
                        <button className="sa-btn sa-btn--ghost-sm" onClick={() => setDeleteConfirm(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        className="sa-btn sa-btn--ghost-sm sa-btn--icon"
                        onClick={() => {
                          if (!window.confirm(`Delete user "${u.email}"? This cannot be undone.`)) return;
                          handleDelete(u.id);
                        }}
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

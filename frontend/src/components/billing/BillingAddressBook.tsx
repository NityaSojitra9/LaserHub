import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star, Loader2, Home, Briefcase, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState } from '../ui';
import { BillingAddressForm } from './BillingAddressForm';
import { billingAddressesApi } from '../../services/billingAddresses';
import type { BillingAddress, BillingAddressInput } from '../../types/billing';

export const BillingAddressBook: React.FC = () => {
  const [addresses, setAddresses] = useState<BillingAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BillingAddress | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await billingAddressesApi.list();
      setAddresses(data);
    } catch {
      toast.error('Failed to load billing addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: BillingAddressInput) => {
    try {
      await billingAddressesApi.create(data);
      toast.success('Billing address added');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error('Could not add address');
      throw err;
    }
  };

  const handleUpdate = async (data: BillingAddressInput) => {
    if (!editing) return;
    try {
      await billingAddressesApi.update(editing.id, data);
      toast.success('Address updated');
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Could not update address');
      throw err;
    }
  };

  const handleDelete = async (addr: BillingAddress) => {
    if (!confirm(`Delete billing address "${addr.label || addr.name}"?`)) return;
    setBusyId(addr.id);
    try {
      await billingAddressesApi.delete(addr.id);
      toast.success('Address deleted');
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleSetDefault = async (addr: BillingAddress) => {
    if (addr.is_default) return;
    setBusyId(addr.id);
    try {
      await billingAddressesApi.setDefault(addr.id);
      toast.success(`"${addr.label || addr.name}" is now your default`);
      load();
    } catch {
      toast.error('Could not update default');
    } finally {
      setBusyId(null);
    }
  };

  const labelIcon = (label: string | null) => {
    if (label === 'Home') return <Home size={14} />;
    if (label === 'Office') return <Briefcase size={14} />;
    return <MapPin size={14} />;
  };

  return (
    <div className="adm-page animate-in">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-page-title">
            <MapPin size={22} /> Billing Addresses
          </h1>
          <p className="adm-page-subtitle">
            Save GSTIN-enabled addresses to receive GST-compliant tax invoices automatically.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowForm(true)}
        >
          Add address
        </Button>
      </header>

      {loading ? (
        <div className="inv-loading">
          <Loader2 size={20} className="animate-spin" /> Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={40} />}
          title="No billing addresses yet"
          description="Add a billing address with GSTIN to have tax invoices issued directly to your business."
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowForm(true)}>
              Add your first address
            </Button>
          }
        />
      ) : (
        <div className="bab-grid">
          {addresses.map((addr) => {
            const isBusy = busyId === addr.id;
            return (
              <div
                key={addr.id}
                className={`bab-card ${addr.is_default ? 'bab-card-default' : ''}`}
              >
                <div className="bab-card-head">
                  <span className="bab-badge-label">
                    {labelIcon(addr.label)}
                    {addr.label || 'Address'}
                  </span>
                  {addr.is_default && (
                    <span className="bab-badge-default">
                      <Star size={12} /> Default
                    </span>
                  )}
                  {addr.is_business && (
                    <span className="bab-badge-business">
                      <Building2 size={12} /> Business
                    </span>
                  )}
                </div>

                <div className="bab-card-name">{addr.name}</div>
                <div className="bab-card-address">
                  {addr.address_line_1}
                  {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                  <br />
                  {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}
                  <br />
                  {addr.country}
                </div>

                <div className="bab-card-meta">
                  {addr.gstin && (
                    <span className="bab-card-gstin">GSTIN: {addr.gstin}</span>
                  )}
                  {addr.phone && <span>📞 {addr.phone}</span>}
                  {addr.email && <span>✉️ {addr.email}</span>}
                </div>

                <div className="bab-card-actions">
                  {!addr.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Star size={13} />}
                      onClick={() => handleSetDefault(addr)}
                      disabled={isBusy}
                    >
                      Set default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={13} />}
                    onClick={() => setEditing(addr)}
                    disabled={isBusy}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => handleDelete(addr)}
                    disabled={isBusy}
                  >
                    {isBusy ? 'Working…' : 'Delete'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <BillingAddressForm
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}

      {editing && (
        <BillingAddressForm
          address={editing}
          onCancel={() => setEditing(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
};

export default BillingAddressBook;

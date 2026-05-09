import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Building2, Home, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input, Select } from '../ui';
import { INDIA_STATES, findStateByName } from '../../data/india-states';
import { GSTIN_REGEX } from '../../services/invoices';
import type { BillingAddress, BillingAddressInput } from '../../types/billing';

interface BillingAddressFormProps {
  address?: BillingAddress | null;
  onCancel: () => void;
  onSubmit: (data: BillingAddressInput) => Promise<void>;
}

type LabelChoice = 'Home' | 'Office' | 'Custom';

const POSTAL_REGEX = /^[0-9]{6}$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

export const BillingAddressForm: React.FC<BillingAddressFormProps> = ({
  address,
  onCancel,
  onSubmit,
}) => {
  const isEdit = Boolean(address);

  // Initial label derivation: if address.label matches one of the presets, use it;
  // otherwise use Custom and expose a text field.
  const initialLabelChoice: LabelChoice = useMemo(() => {
    if (!address?.label) return 'Home';
    if (address.label === 'Home' || address.label === 'Office') return address.label;
    return 'Custom';
  }, [address]);

  const [labelChoice, setLabelChoice] = useState<LabelChoice>(initialLabelChoice);
  const [customLabel, setCustomLabel] = useState(
    initialLabelChoice === 'Custom' ? address?.label || '' : ''
  );
  const [isBusiness, setIsBusiness] = useState<boolean>(address?.is_business ?? false);
  const [isDefault, setIsDefault] = useState<boolean>(address?.is_default ?? false);

  const [form, setForm] = useState<Omit<BillingAddressInput, 'label' | 'is_business' | 'is_default'>>(
    {
      name: address?.name ?? '',
      gstin: address?.gstin ?? '',
      address_line_1: address?.address_line_1 ?? '',
      address_line_2: address?.address_line_2 ?? '',
      city: address?.city ?? '',
      state: address?.state ?? '',
      state_code: address?.state_code ?? '',
      postal_code: address?.postal_code ?? '',
      country: address?.country ?? 'India',
      phone: address?.phone ?? '',
      email: address?.email ?? '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Keep state_code in sync when user picks a state
  useEffect(() => {
    if (!form.state) return;
    const match = findStateByName(form.state);
    if (match && match.code !== form.state_code) {
      setForm((f) => ({ ...f, state_code: match.code }));
    }
  }, [form.state, form.state_code]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.address_line_1.trim()) e.address_line_1 = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state.trim()) e.state = 'State is required';
    if (!POSTAL_REGEX.test(form.postal_code.trim())) e.postal_code = 'Must be 6 digits';
    if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
      e.phone = 'Must be a 10-digit Indian mobile number';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = 'Invalid email';
    }
    if (isBusiness) {
      const gstin = (form.gstin || '').trim().toUpperCase();
      if (!gstin) {
        e.gstin = 'GSTIN is required for business addresses';
      } else if (!GSTIN_REGEX.test(gstin)) {
        e.gstin = 'Invalid GSTIN format';
      }
    }
    if (labelChoice === 'Custom' && !customLabel.trim()) {
      e.label = 'Enter a custom label or choose Home/Office';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors highlighted in red');
      return;
    }
    setSubmitting(true);
    try {
      const resolvedLabel =
        labelChoice === 'Custom' ? customLabel.trim() : labelChoice;
      const payload: BillingAddressInput = {
        ...form,
        gstin: isBusiness ? (form.gstin || '').trim().toUpperCase() : null,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        address_line_2: form.address_line_2?.trim() || null,
        label: resolvedLabel || null,
        is_business: isBusiness,
        is_default: isDefault,
      };
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bab-modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div
        className="bab-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bab-modal-header">
          <h3>{isEdit ? 'Edit billing address' : 'Add billing address'}</h3>
          <button
            type="button"
            className="bab-modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bab-modal-body">
            {/* Label selector */}
            <div className="bab-form-row">
              <Select
                label="Label"
                value={labelChoice}
                onChange={(e) => setLabelChoice(e.target.value as LabelChoice)}
              >
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Custom">Custom</option>
              </Select>
              {labelChoice === 'Custom' ? (
                <Input
                  label="Custom label"
                  placeholder="e.g. Warehouse, Studio"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  error={errors.label}
                />
              ) : (
                <div />
              )}
            </div>

            {/* Business toggle */}
            <div className="bab-toggle-row">
              <input
                id="is-business"
                type="checkbox"
                checked={isBusiness}
                onChange={(e) => setIsBusiness(e.target.checked)}
              />
              <label htmlFor="is-business">
                <Building2 size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                Register as business (include GSTIN)
              </label>
            </div>

            {/* Name + GSTIN */}
            <Input
              label={isBusiness ? 'Business / Company name' : 'Full name'}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={errors.name}
              required
            />

            {isBusiness && (
              <Input
                label="GSTIN"
                placeholder="e.g. 27AAPFU0939F1ZV"
                value={form.gstin || ''}
                onChange={(e) => update('gstin', e.target.value.toUpperCase())}
                error={errors.gstin}
                hint="15-character GST Identification Number"
                maxLength={15}
              />
            )}

            {/* Address lines */}
            <Input
              label="Address line 1"
              value={form.address_line_1}
              onChange={(e) => update('address_line_1', e.target.value)}
              error={errors.address_line_1}
              required
            />
            <Input
              label="Address line 2 (optional)"
              value={form.address_line_2 || ''}
              onChange={(e) => update('address_line_2', e.target.value)}
            />

            {/* City + postal */}
            <div className="bab-form-row">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                error={errors.city}
                required
              />
              <Input
                label="Postal / PIN code"
                value={form.postal_code}
                onChange={(e) => update('postal_code', e.target.value)}
                error={errors.postal_code}
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>

            {/* State + country */}
            <div className="bab-form-row">
              <Select
                label="State"
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                error={errors.state}
                required
              >
                <option value="">Select a state…</option>
                {INDIA_STATES.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Country"
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                required
              />
            </div>

            {/* Phone + email */}
            <div className="bab-form-row">
              <Input
                label="Phone (optional)"
                placeholder="10-digit mobile"
                value={form.phone || ''}
                onChange={(e) => update('phone', e.target.value)}
                error={errors.phone}
                inputMode="tel"
                maxLength={10}
              />
              <Input
                label="Email (optional)"
                type="email"
                value={form.email || ''}
                onChange={(e) => update('email', e.target.value)}
                error={errors.email}
              />
            </div>

            {/* Default flag */}
            <div className="bab-toggle-row">
              <input
                id="is-default"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <label htmlFor="is-default">
                {labelChoice === 'Home' ? (
                  <Home size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                ) : (
                  <Briefcase size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                )}
                Set as default billing address
              </label>
            </div>
          </div>

          <div className="bab-modal-footer">
            <Button variant="ghost" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              icon={<Save size={14} />}
            >
              {isEdit ? 'Save changes' : 'Add address'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingAddressForm;

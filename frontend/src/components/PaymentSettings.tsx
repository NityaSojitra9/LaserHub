import React, { useState, useEffect } from 'react';
import { adminApi } from '../services';
import { api } from '../services/api';
import { toast } from 'sonner';
import {
  CreditCard,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  Shield,
  Globe,
  IndianRupee,
  Percent,
  ExternalLink,
  Info,
} from 'lucide-react';

interface Setting {
  id?: number;
  key: string;
  value: string;
  category: string;
  is_secret: boolean;
}

export const PaymentSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      try { await adminApi.seedPaymentSettings(); } catch { /* already seeded */ }
      const data = await adminApi.getSettings('payment');
      setSettings(data);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const getValue = (key: string) => settings.find((s) => s.key === key)?.value ?? '';
  const getBool = (key: string) => getValue(key) === 'true';

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const handleToggle = (key: string) => {
    handleChange(key, getBool(key) ? 'false' : 'true');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast.success('Payment settings saved');
      // Re-mask secrets locally instead of re-fetching (which would show •••••••• for newly entered values)
      setSettings(prev => prev.map(s => s.is_secret && s.value && s.value !== '••••••••' ? { ...s, value: '••••••••' } : s));
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (provider: 'stripe' | 'razorpay') => {
    const apiKey = provider === 'stripe' ? getValue('stripe_secret_key') : getValue('razorpay_key_id');
    const apiSecret = provider === 'razorpay' ? getValue('razorpay_key_secret') : '';
    if (!apiKey || apiKey === '••••••••') {
      toast.error(`Enter a ${provider === 'stripe' ? 'Secret Key' : 'Key ID'} first`);
      return;
    }
    setTestStatus((p) => ({ ...p, [provider]: 'testing' }));
    try {
      const { data } = await api.post('/payment/test-credentials', { provider, api_key: apiKey, api_secret: apiSecret });
      setTestStatus((p) => ({ ...p, [provider]: data.valid ? 'success' : 'error' }));
      data.valid ? toast.success(data.message) : toast.error(data.message);
    } catch {
      setTestStatus((p) => ({ ...p, [provider]: 'error' }));
      toast.error('Connection error');
    }
    setTimeout(() => setTestStatus((p) => ({ ...p, [provider]: 'idle' })), 5000);
  };

  if (loading) {
    return (
      <div className="ps-loading">
        <Loader2 size={28} className="spin" />
        <span>Loading payment settings…</span>
      </div>
    );
  }

  const stripeEnabled = getBool('stripe_enabled');
  const razorpayEnabled = getBool('razorpay_enabled');

  return (
    <div className="ps-page">
      {/* Header */}
      <div className="ps-header">
        <div className="ps-header-left">
          <div>
            <h1 className="ps-title"><CreditCard size={22} /> Payment Settings</h1>
            <p className="ps-subtitle">Configure your payment gateways and billing preferences</p>
          </div>
        </div>
        <button className="ps-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      <div className="ps-grid">
        {/* ── Stripe Card ──────────────────────────── */}
        <div className={`ps-card ${stripeEnabled ? 'ps-card--active' : ''}`}>
          <div className="ps-card-header">
            <div className="ps-card-brand">
              <div className="ps-brand-icon ps-brand-stripe">
                <Globe size={20} />
              </div>
              <div>
                <h3>Stripe</h3>
                <p>Global card payments</p>
              </div>
            </div>
            <button
              className={`ps-toggle ${stripeEnabled ? 'ps-toggle--on' : ''}`}
              onClick={() => handleToggle('stripe_enabled')}
            >
              <span className="ps-toggle-track">
                <span className="ps-toggle-thumb" />
              </span>
              <span className="ps-toggle-label">{stripeEnabled ? 'Active' : 'Inactive'}</span>
            </button>
          </div>

          {stripeEnabled && (
            <div className="ps-card-body">
              <div className="ps-info-bar">
                <Info size={14} />
                Get your API keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer">Stripe Dashboard <ExternalLink size={11} /></a>
              </div>

              <div className="ps-fields-grid">
                <FieldRow label="Publishable Key" settingKey="stripe_public_key" placeholder="pk_live_..." settings={settings} onChange={handleChange} showSecrets={showSecrets} onToggleSecret={(k) => setShowSecrets(p => ({ ...p, [k]: !p[k] }))} />
                <FieldRow label="Secret Key" settingKey="stripe_secret_key" placeholder="sk_live_..." settings={settings} onChange={handleChange} showSecrets={showSecrets} onToggleSecret={(k) => setShowSecrets(p => ({ ...p, [k]: !p[k] }))} />
                <FieldRow label="Webhook Secret" settingKey="stripe_webhook_secret" placeholder="whsec_..." settings={settings} onChange={handleChange} showSecrets={showSecrets} onToggleSecret={(k) => setShowSecrets(p => ({ ...p, [k]: !p[k] }))} />
              </div>

              <div className="ps-card-footer">
                <TestButton provider="stripe" status={testStatus['stripe'] || 'idle'} onTest={() => handleTest('stripe')} />
              </div>
            </div>
          )}
        </div>

        {/* ── Razorpay Card ────────────────────────── */}
        <div className={`ps-card ${razorpayEnabled ? 'ps-card--active' : ''}`}>
          <div className="ps-card-header">
            <div className="ps-card-brand">
              <div className="ps-brand-icon ps-brand-razorpay">
                <IndianRupee size={20} />
              </div>
              <div>
                <h3>Razorpay</h3>
                <p>UPI, cards & net banking</p>
              </div>
            </div>
            <button
              className={`ps-toggle ${razorpayEnabled ? 'ps-toggle--on' : ''}`}
              onClick={() => handleToggle('razorpay_enabled')}
            >
              <span className="ps-toggle-track">
                <span className="ps-toggle-thumb" />
              </span>
              <span className="ps-toggle-label">{razorpayEnabled ? 'Active' : 'Inactive'}</span>
            </button>
          </div>

          {razorpayEnabled && (
            <div className="ps-card-body">
              <div className="ps-info-bar">
                <Info size={14} />
                Get your API keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer">Razorpay Dashboard <ExternalLink size={11} /></a>
              </div>

              <div className="ps-fields-grid">
                <FieldRow label="Key ID" settingKey="razorpay_key_id" placeholder="rzp_live_..." settings={settings} onChange={handleChange} showSecrets={showSecrets} onToggleSecret={(k) => setShowSecrets(p => ({ ...p, [k]: !p[k] }))} />
                <FieldRow label="Key Secret" settingKey="razorpay_key_secret" placeholder="Enter key secret" settings={settings} onChange={handleChange} showSecrets={showSecrets} onToggleSecret={(k) => setShowSecrets(p => ({ ...p, [k]: !p[k] }))} />
                <FieldRow label="Webhook Secret" settingKey="razorpay_webhook_secret" placeholder="Enter webhook secret" settings={settings} onChange={handleChange} showSecrets={showSecrets} onToggleSecret={(k) => setShowSecrets(p => ({ ...p, [k]: !p[k] }))} />
              </div>

              <div className="ps-card-footer">
                <TestButton provider="razorpay" status={testStatus['razorpay'] || 'idle'} onTest={() => handleTest('razorpay')} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── General Settings ───────────────────────── */}
      <div className="ps-card ps-card--general">
        <div className="ps-card-header">
          <div className="ps-card-brand">
            <div className="ps-brand-icon ps-brand-general">
              <Shield size={20} />
            </div>
            <div>
              <h3>Billing Preferences</h3>
              <p>Currency, tax rate, and other billing settings</p>
            </div>
          </div>
        </div>
        <div className="ps-card-body">
          <div className="ps-general-grid">
            <div className="ps-general-field">
              <label><Globe size={14} /> Default Currency</label>
              <select
                className="ps-select"
                value={getValue('currency')}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="usd">USD — US Dollar ($)</option>
                <option value="inr">INR — Indian Rupee (₹)</option>
                <option value="eur">EUR — Euro (€)</option>
                <option value="gbp">GBP — British Pound (£)</option>
                <option value="cad">CAD — Canadian Dollar (C$)</option>
                <option value="aud">AUD — Australian Dollar (A$)</option>
                <option value="jpy">JPY — Japanese Yen (¥)</option>
                <option value="sgd">SGD — Singapore Dollar (S$)</option>
              </select>
            </div>
            <div className="ps-general-field">
              <label><Percent size={14} /> Tax Rate</label>
              <div className="ps-tax-input-wrap">
                <input
                  type="number"
                  className="ps-input"
                  value={getValue('tax_rate')}
                  onChange={(e) => handleChange('tax_rate', e.target.value)}
                  step="0.01"
                  min="0"
                  max="1"
                />
                <span className="ps-tax-hint">{(parseFloat(getValue('tax_rate') || '0') * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Save ────────────────────────────── */}
      <div className="ps-bottom-bar">
        <p className="ps-bottom-hint">Changes are saved to the database and take effect immediately.</p>
        <button className="ps-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────── */

function FieldRow({ label, settingKey, placeholder, settings, onChange, showSecrets, onToggleSecret }: {
  label: string;
  settingKey: string;
  placeholder: string;
  settings: Setting[];
  onChange: (key: string, value: string) => void;
  showSecrets: Record<string, boolean>;
  onToggleSecret: (key: string) => void;
}) {
  const setting = settings.find((s) => s.key === settingKey);
  if (!setting) return null;
  const isVisible = showSecrets[settingKey];

  return (
    <div className="ps-field">
      <label className="ps-field-label">{label}</label>
      <div className="ps-field-input-wrap">
        <input
          type={setting.is_secret && !isVisible ? 'password' : 'text'}
          className="ps-input"
          value={setting.value}
          onChange={(e) => onChange(settingKey, e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        {setting.is_secret && (
          <button
            type="button"
            className="ps-eye-btn"
            onClick={() => onToggleSecret(settingKey)}
            title={isVisible ? 'Hide' : 'Reveal'}
          >
            {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

function TestButton({ provider, status, onTest }: { provider: string; status: string; onTest: () => void }) {
  return (
    <button
      className={`ps-test-btn ps-test-btn--${status}`}
      onClick={onTest}
      disabled={status === 'testing'}
    >
      {status === 'testing' ? (
        <><Loader2 size={14} className="spin" /> Verifying…</>
      ) : status === 'success' ? (
        <><CheckCircle size={14} /> Credentials Valid</>
      ) : status === 'error' ? (
        <><XCircle size={14} /> Invalid Credentials</>
      ) : (
        <><Zap size={14} /> Test {provider === 'stripe' ? 'Stripe' : 'Razorpay'} Connection</>
      )}
    </button>
  );
}

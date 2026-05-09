import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { trackingApi, type OrderTimeline } from '../services/tracking';
import OrderTimeline_ from './OrderTimeline';
import OrderEventForm from './OrderEventForm';

interface Props {
  orderId: number;
  isVendorView?: boolean;
  onClose: () => void;
}

export const OrderTrackingPanel: React.FC<Props> = ({ orderId, isVendorView, onClose }) => {
  const [data, setData] = useState<OrderTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await trackingApi.getOrderTimeline(orderId);
      setData(d);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="otp-backdrop" onClick={onClose} />
      <aside className="otp-panel" role="dialog" aria-modal="true" aria-label="Order tracking">
        <header className="otp-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
              {data ? `Order ${data.order_number}` : 'Order Tracking'}
            </h2>
            {data && (
              <span className="otp-status">{data.status.replace('_', ' ')}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button className="sa-btn sa-btn--ghost-sm" onClick={load} aria-label="Refresh">
              <RefreshCw size={14} />
            </button>
            <button className="sa-btn sa-btn--ghost-sm" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="otp-body">
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Loader2 className="spinner" size={28} />
            </div>
          )}
          {error && <div style={{ padding: '1rem', color: '#ef4444' }}>{error}</div>}
          {data && <OrderTimeline_ data={data} />}

          {data && isVendorView && (
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
              <h3 style={{ padding: '1rem 1rem 0', margin: 0, fontSize: '1rem' }}>Add update</h3>
              <OrderEventForm orderId={orderId} onAdded={load} />
            </div>
          )}
        </div>

        <style>{`
          .otp-backdrop {
            position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9998;
          }
          .otp-panel {
            position: fixed; top: 0; right: 0; bottom: 0;
            width: min(560px, 100vw); background: var(--bg-primary, #fff);
            z-index: 9999; display: flex; flex-direction: column;
            box-shadow: -8px 0 24px rgba(0,0,0,0.15);
            animation: otp-slide 0.2s ease-out;
          }
          @keyframes otp-slide { from { transform: translateX(100%); } to { transform: none; } }
          .otp-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 1rem; border-bottom: 1px solid var(--border-color, #e5e7eb);
          }
          .otp-status {
            display: inline-block; font-size: 0.75rem;
            padding: 0.2rem 0.55rem; border-radius: 999px;
            background: rgba(14, 165, 233, 0.12); color: #0369a1;
            margin-top: 0.25rem; text-transform: capitalize;
          }
          .otp-body { flex: 1; overflow-y: auto; }
          .otp-body .spinner { animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </aside>
    </>
  );
};

export default OrderTrackingPanel;

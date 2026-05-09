import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Camera,
  AlertTriangle,
  XCircle,
  Factory,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { OrderTimeline as OrderTimelineData, OrderEvent } from '../services/tracking';
import { getCourierTrackingUrl, getCourierName } from '../utils/couriers';
import { resolveMediaUrl } from '../services/api';
import { toast } from 'sonner';

interface Props {
  data: OrderTimelineData;
}

const EVENT_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  created: { icon: Clock, color: '#64748b', label: 'Order Created' },
  accepted: { icon: CheckCircle2, color: '#0ea5e9', label: 'Accepted' },
  in_production: { icon: Factory, color: '#f59e0b', label: 'In Production' },
  photo_update: { icon: Camera, color: '#8b5cf6', label: 'Photo Update' },
  shipped: { icon: Truck, color: '#3b82f6', label: 'Shipped' },
  delivered: { icon: Package, color: '#10b981', label: 'Delivered' },
  delayed: { icon: AlertTriangle, color: '#f97316', label: 'Delayed' },
  cancelled: { icon: XCircle, color: '#ef4444', label: 'Cancelled' },
};

const STATUS_PILLS: { key: string; label: string }[] = [
  { key: 'pending', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_production', label: 'In Production' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Delivered' },
];

function statusIndex(status: string): number {
  const idx = STATUS_PILLS.findIndex((p) => p.key === status);
  return idx < 0 ? 0 : idx;
}

export const OrderTimeline: React.FC<Props> = ({ data }) => {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const activeIdx = statusIndex(data.status);
  const trackingUrl = getCourierTrackingUrl(data.courier, data.tracking_number);

  const eta = data.estimated_delivery_date
    ? new Date(data.estimated_delivery_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const copyTracking = async () => {
    if (!data.tracking_number) return;
    try {
      await navigator.clipboard.writeText(data.tracking_number);
      setCopied(true);
      toast.success('Tracking number copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="order-timeline">
      {/* Status pills */}
      <div className="ot-stages">
        {STATUS_PILLS.map((pill, i) => {
          const reached = i <= activeIdx && data.status !== 'cancelled';
          const isCurrent = i === activeIdx;
          return (
            <React.Fragment key={pill.key}>
              <div className={`ot-stage ${reached ? 'ot-stage--reached' : ''} ${isCurrent ? 'ot-stage--current' : ''}`}>
                <div className="ot-stage-dot" />
                <span className="ot-stage-label">{pill.label}</span>
              </div>
              {i < STATUS_PILLS.length - 1 && (
                <div className={`ot-stage-line ${i < activeIdx ? 'ot-stage-line--reached' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ETA / Tracking info */}
      <div className="ot-meta">
        {eta && (
          <div className="ot-eta-badge">
            <Clock size={14} /> Estimated delivery: <strong>{eta}</strong>
          </div>
        )}
        {data.tracking_number && (
          <div className="ot-tracking-card">
            <div>
              <div className="ot-tracking-label">
                {data.courier ? getCourierName(data.courier) : 'Tracking'}
              </div>
              <div className="ot-tracking-number">{data.tracking_number}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="sa-btn sa-btn--ghost-sm" onClick={copyTracking}>
                {copied ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
              {trackingUrl && (
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="sa-btn sa-btn--primary-sm">
                  <ExternalLink size={14} /> Track with {getCourierName(data.courier)}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline events */}
      <div className="ot-events">
        {data.events.length === 0 ? (
          <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No updates yet. You'll see updates here as your order progresses.
          </div>
        ) : (
          data.events.slice().reverse().map((ev: OrderEvent) => {
            const meta = EVENT_META[ev.event_type] || EVENT_META.photo_update;
            const Icon = meta.icon;
            return (
              <div key={ev.id} className="ot-event">
                <div className="ot-event-icon" style={{ background: meta.color }}>
                  <Icon size={16} color="#fff" />
                </div>
                <div className="ot-event-body">
                  <div className="ot-event-head">
                    <strong>{meta.label}</strong>
                    <span className="ot-event-time">
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </div>
                  {ev.message && <div className="ot-event-msg">{ev.message}</div>}
                  {ev.photo_url && (
                    <img
                      src={resolveMediaUrl(ev.photo_url) || ev.photo_url}
                      alt="Update"
                      className="ot-event-photo"
                      onClick={() => setLightbox(resolveMediaUrl(ev.photo_url) || ev.photo_url)}
                    />
                  )}
                  {ev.tracking_number && (
                    <div className="ot-event-tracking">
                      Tracking: <code>{ev.tracking_number}</code>
                      {ev.courier && <span> via {getCourierName(ev.courier)}</span>}
                    </div>
                  )}
                  {ev.created_by_name && (
                    <div className="ot-event-author">by {ev.created_by_name}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {lightbox && (
        <div className="ot-lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <img src={lightbox} alt="Enlarged update" />
        </div>
      )}

      <style>{`
        .order-timeline { padding: 1rem 0; }
        .ot-stages {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 1rem; flex-wrap: wrap;
        }
        .ot-stage { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
        .ot-stage-dot {
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--border-color, #e5e7eb); border: 2px solid var(--border-color, #e5e7eb);
        }
        .ot-stage--reached .ot-stage-dot { background: #10b981; border-color: #10b981; }
        .ot-stage--current .ot-stage-dot {
          background: #0ea5e9; border-color: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.25);
        }
        .ot-stage-label { font-size: 0.75rem; margin-top: 0.35rem; color: var(--text-secondary); }
        .ot-stage--current .ot-stage-label { color: var(--text-primary); font-weight: 600; }
        .ot-stage-line { flex: 1; height: 2px; background: var(--border-color, #e5e7eb); margin: 0 2px; min-width: 20px; }
        .ot-stage-line--reached { background: #10b981; }
        .ot-meta {
          display: flex; flex-wrap: wrap; gap: 0.75rem;
          padding: 0 1rem 1rem;
        }
        .ot-eta-badge {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.5rem 0.85rem; border-radius: 999px;
          background: rgba(14, 165, 233, 0.1); color: #0369a1;
          font-size: 0.875rem;
        }
        .ot-tracking-card {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 1rem; border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px; flex: 1; min-width: 260px; gap: 0.75rem; flex-wrap: wrap;
        }
        .ot-tracking-label { font-size: 0.75rem; color: var(--text-secondary); }
        .ot-tracking-number { font-family: monospace; font-weight: 600; font-size: 0.95rem; }
        .ot-events { display: flex; flex-direction: column; gap: 1rem; padding: 0 1rem; position: relative; }
        .ot-events::before {
          content: ""; position: absolute; left: 1.9rem; top: 0.5rem; bottom: 0.5rem;
          width: 2px; background: var(--border-color, #e5e7eb);
        }
        .ot-event { display: flex; gap: 0.85rem; position: relative; z-index: 1; }
        .ot-event-icon {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; box-shadow: 0 0 0 3px var(--bg-primary, #fff);
        }
        .ot-event-body { flex: 1; background: var(--bg-secondary, #f9fafb); padding: 0.75rem 1rem; border-radius: 8px; }
        .ot-event-head { display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
        .ot-event-time { font-size: 0.75rem; color: var(--text-secondary); }
        .ot-event-msg { margin-top: 0.35rem; color: var(--text-primary); font-size: 0.9rem; white-space: pre-wrap; }
        .ot-event-photo {
          margin-top: 0.5rem; max-width: 240px; max-height: 180px;
          border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color);
        }
        .ot-event-tracking { margin-top: 0.35rem; font-size: 0.8rem; color: var(--text-secondary); }
        .ot-event-tracking code { background: rgba(0,0,0,0.06); padding: 1px 6px; border-radius: 3px; }
        .ot-event-author { margin-top: 0.25rem; font-size: 0.7rem; color: var(--text-secondary); font-style: italic; }
        .ot-lightbox {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; cursor: zoom-out; padding: 2rem;
        }
        .ot-lightbox img { max-width: 100%; max-height: 100%; border-radius: 8px; }
      `}</style>
    </div>
  );
};

export default OrderTimeline;

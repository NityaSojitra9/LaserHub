import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trackingApi, type EventCreatePayload } from '../services/tracking';
import { COURIER_OPTIONS } from '../utils/couriers';

interface Props {
  orderId: number;
  onAdded?: () => void;
}

const EVENT_TYPES = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_production', label: 'In Production' },
  { value: 'photo_update', label: 'Photo / Progress Update' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const OrderEventForm: React.FC<Props> = ({ orderId, onAdded }) => {
  const [eventType, setEventType] = useState('in_production');
  const [message, setMessage] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showTracking = eventType === 'shipped';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        const resp = await trackingApi.uploadPhoto(orderId, photoFile);
        photoUrl = resp.url;
      }
      const payload: EventCreatePayload = {
        event_type: eventType,
        message: message || undefined,
        photo_url: photoUrl,
        tracking_number: showTracking ? trackingNumber || undefined : undefined,
        courier: showTracking ? courier || undefined : undefined,
        estimated_delivery_date: etaDate ? new Date(etaDate).toISOString() : undefined,
      };
      await trackingApi.addEvent(orderId, payload);
      toast.success('Update added');
      setMessage('');
      setTrackingNumber('');
      setCourier('');
      setEtaDate('');
      setPhotoFile(null);
      onAdded?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="oef-form">
      <div className="oef-row">
        <label>Update Type</label>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="oef-row">
        <label>Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Share progress details for the customer…"
        />
      </div>

      <div className="oef-row">
        <label>Photo (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        />
      </div>

      {showTracking && (
        <>
          <div className="oef-row">
            <label>Courier</label>
            <select value={courier} onChange={(e) => setCourier(e.target.value)}>
              <option value="">Select courier…</option>
              {COURIER_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="oef-row">
            <label>Tracking number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
            />
          </div>
        </>
      )}

      <div className="oef-row">
        <label>Estimated delivery (optional)</label>
        <input type="date" value={etaDate} onChange={(e) => setEtaDate(e.target.value)} />
      </div>

      <button
        type="submit"
        className="sa-btn sa-btn--primary-sm"
        disabled={submitting}
        style={{ alignSelf: 'flex-start' }}
      >
        {submitting ? <Loader2 size={14} className="spinner" /> : <Send size={14} />}
        {submitting ? 'Saving…' : 'Post update'}
      </button>

      <style>{`
        .oef-form { display: flex; flex-direction: column; gap: 0.85rem; padding: 1rem; }
        .oef-row { display: flex; flex-direction: column; gap: 0.25rem; }
        .oef-row label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
        .oef-row input, .oef-row select, .oef-row textarea {
          padding: 0.5rem 0.65rem;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: var(--bg-primary, #fff);
          color: var(--text-primary);
          font-family: inherit;
        }
        .oef-form .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
};

export default OrderEventForm;

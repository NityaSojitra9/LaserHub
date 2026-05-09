import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Download, Mail, Eye, CheckCircle, XCircle, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { invoicesApi, type Invoice, type InvoiceStatus, type VendorInvoiceStats } from '../../services/invoices';
import { InvoiceDetail } from './InvoiceDetail';

/**
 * Vendor-facing invoice list with stats, filters, and quick actions.
 * Shows all invoices issued by the current vendor (filtered server-side).
 */
export const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<VendorInvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [search, setSearch] = useState('');
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        invoicesApi.list(statusFilter ? { status: statusFilter } : undefined),
        invoicesApi.getVendorStats().catch(() => null),
      ]);
      setInvoices(list);
      setStats(s);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.trim().toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoice_number.toLowerCase().includes(q) ||
        (i.buyer_name || '').toLowerCase().includes(q) ||
        (i.buyer_email || '').toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const handleDownload = async (inv: Invoice) => {
    setActionInProgress(inv.id);
    try {
      await invoicesApi.downloadPdf(inv.id, `${inv.invoice_number.replace(/\//g, '-')}.pdf`);
      toast.success('Downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEmail = async (inv: Invoice) => {
    if (!inv.buyer_email) {
      toast.error('No buyer email on this invoice');
      return;
    }
    setActionInProgress(inv.id);
    try {
      const res = await invoicesApi.email(inv.id);
      if (res.success) {
        toast.success(`Emailed to ${inv.buyer_email}`);
      } else {
        toast.error(res.message || 'Email failed');
      }
    } catch {
      toast.error('Email failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    setActionInProgress(inv.id);
    try {
      await invoicesApi.updateStatus(inv.id, 'paid');
      toast.success('Marked as paid');
      loadAll();
    } catch {
      toast.error('Status update failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="inv-page">
      <div className="inv-header">
        <div>
          <h2 className="inv-title">
            <FileText size={22} /> Tax Invoices
          </h2>
          <p className="inv-subtitle">Issue, track, and share GST-compliant invoices with customers.</p>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="inv-stats">
          <div className="inv-stat">
            <div className="inv-stat-label">Total Invoiced</div>
            <div className="inv-stat-value">{fmt(stats.total_invoiced || 0)}</div>
            <div className="inv-stat-sub">{stats.total_count ?? 0} invoices</div>
          </div>
          <div className="inv-stat inv-stat--success">
            <div className="inv-stat-label">Paid</div>
            <div className="inv-stat-value">{fmt(stats.paid_amount || 0)}</div>
            <div className="inv-stat-sub">{stats.paid_count ?? 0} paid</div>
          </div>
          <div className="inv-stat inv-stat--warning">
            <div className="inv-stat-label">Pending</div>
            <div className="inv-stat-value">{fmt(stats.pending_amount || 0)}</div>
            <div className="inv-stat-sub">{stats.pending_count ?? 0} pending</div>
          </div>
          <div className="inv-stat inv-stat--info">
            <div className="inv-stat-label">This Month</div>
            <div className="inv-stat-value">{fmt(stats.this_month_amount || 0)}</div>
            <div className="inv-stat-sub">{stats.this_month_count ?? 0} this month</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="inv-filters">
        <div className="inv-search-wrap">
          <Filter size={14} />
          <input
            type="search"
            placeholder="Search invoice # or buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="inv-search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
          className="inv-status-select"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="inv-loading">
          <Loader2 size={20} className="animate-spin" /> Loading invoices...
        </div>
      ) : filtered.length === 0 ? (
        <div className="inv-empty">
          <FileText size={48} opacity={0.3} />
          <p>No invoices yet. Generate an invoice from a completed order.</p>
        </div>
      ) : (
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Buyer</th>
                <th className="num">Taxable</th>
                <th className="num">GST</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const totalGst = Number(inv.cgst_amount) + Number(inv.sgst_amount) + Number(inv.igst_amount);
                const isBusy = actionInProgress === inv.id;
                return (
                  <tr key={inv.id}>
                    <td><code className="inv-number">{inv.invoice_number}</code></td>
                    <td className="inv-date-cell">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td>
                      <div className="inv-buyer">
                        <div className="inv-buyer-name">{inv.buyer_name}</div>
                        {inv.buyer_gstin && <div className="inv-buyer-gstin">{inv.buyer_gstin}</div>}
                      </div>
                    </td>
                    <td className="num">{fmt(inv.taxable_amount)}</td>
                    <td className="num">{fmt(totalGst)}</td>
                    <td className="num"><strong>{fmt(inv.total_amount)}</strong></td>
                    <td>
                      <span className={`inv-status inv-status--${inv.status}`}>{inv.status}</span>
                    </td>
                    <td>
                      <div className="inv-actions">
                        <button className="inv-action-btn" title="View" onClick={() => setViewingId(inv.id)} disabled={isBusy}>
                          <Eye size={14} />
                        </button>
                        <button className="inv-action-btn" title="Download PDF" onClick={() => handleDownload(inv)} disabled={isBusy}>
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                        <button className="inv-action-btn" title="Email to buyer" onClick={() => handleEmail(inv)} disabled={isBusy}>
                          <Mail size={14} />
                        </button>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button className="inv-action-btn inv-action-btn--success" title="Mark as paid" onClick={() => handleMarkPaid(inv)} disabled={isBusy}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                          <button className="inv-action-btn inv-action-btn--danger" title="Cancel" onClick={async () => {
                            if (!confirm('Cancel this invoice?')) return;
                            setActionInProgress(inv.id);
                            try { await invoicesApi.updateStatus(inv.id, 'cancelled'); toast.success('Cancelled'); loadAll(); }
                            catch { toast.error('Cancel failed'); }
                            finally { setActionInProgress(null); }
                          }} disabled={isBusy}>
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewingId != null && (
        <InvoiceDetail invoiceId={viewingId} onClose={() => setViewingId(null)} onRefresh={loadAll} />
      )}
    </div>
  );
};

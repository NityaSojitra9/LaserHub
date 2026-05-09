import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Eye, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyState } from '../ui';
import { invoicesApi, type Invoice, type InvoiceStatus } from '../../services/invoices';
import { InvoiceDetail } from './InvoiceDetail';

/**
 * Customer-facing list of invoices issued TO the current user.
 * Read-only: download PDF + view. Scoped server-side (buyer_email / customer_id match).
 */
export const CustomerInvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await invoicesApi.list(
        statusFilter === 'all' ? undefined : { status: statusFilter }
      );
      setInvoices(list);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.trim().toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoice_number.toLowerCase().includes(q) ||
        (i.seller_name || '').toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const fmt = (n: number) =>
    `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDownload = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    try {
      await invoicesApi.downloadPdf(inv.id, `${inv.invoice_number.replace(/\//g, '-')}.pdf`);
      toast.success('Downloaded');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const filters: { label: string; value: InvoiceStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Issued', value: 'issued' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="adm-page animate-in">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-page-title">
            <FileText size={22} /> My Invoices
          </h1>
          <p className="adm-page-subtitle">
            GST-compliant tax invoices issued to you by vendors. Download or print for your records.
          </p>
        </div>
      </header>

      <div className="cust-invoice-toolbar">
        <div className="cust-invoice-filter">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className={statusFilter === f.value ? 'cust-invoice-filter-active' : ''}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="inv-search-wrap">
          <Search size={14} />
          <input
            type="search"
            placeholder="Search invoice # or vendor..."
            className="inv-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="inv-loading">
          <Loader2 size={20} className="animate-spin" /> Loading invoices...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={40} />}
          title={search || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices yet'}
          description={
            search || statusFilter !== 'all'
              ? 'Try clearing filters to see all invoices.'
              : "You'll see tax invoices here once a vendor issues one for an order."
          }
        />
      ) : (
        <div className="cust-invoice-table-wrap">
          <table className="cust-invoice-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>From</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const isDownloading = downloadingId === inv.id;
                return (
                  <tr key={inv.id}>
                    <td>
                      <button
                        type="button"
                        className="cust-invoice-number-link"
                        onClick={() => setViewingId(inv.id)}
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                    <td>{inv.seller_name}</td>
                    <td className="num">
                      <strong>{fmt(inv.total_amount)}</strong>
                    </td>
                    <td>
                      <span className={`cust-invoice-status cust-invoice-status-${inv.status}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="cust-invoice-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Eye size={13} />}
                          onClick={() => setViewingId(inv.id)}
                          aria-label="View invoice"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                          onClick={() => handleDownload(inv)}
                          disabled={isDownloading}
                          aria-label="Download PDF"
                        >
                          PDF
                        </Button>
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
        <InvoiceDetail
          invoiceId={viewingId}
          onClose={() => setViewingId(null)}
          readOnly
        />
      )}
    </div>
  );
};

export default CustomerInvoiceList;

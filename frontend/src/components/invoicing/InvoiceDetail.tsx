import React, { useEffect, useState } from 'react';
import { X, Download, Mail, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invoicesApi, type Invoice } from '../../services/invoices';

interface Props {
  invoiceId: number;
  onClose: () => void;
  onRefresh?: () => void;
  readOnly?: boolean; // customer view hides vendor-only actions
}

/**
 * Full invoice detail viewer — matches the PDF layout for a WYSIWYG feel.
 * Opens as a modal overlay. Supports print, email, and PDF download.
 */
export const InvoiceDetail: React.FC<Props> = ({ invoiceId, onClose, readOnly }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    invoicesApi
      .get(invoiceId)
      .then(setInvoice)
      .catch(() => toast.error('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const fmt = (n: number | null | undefined) => {
    if (n == null) return '—';
    return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleDownload = async () => {
    if (!invoice) return;
    setBusy(true);
    try {
      await invoicesApi.downloadPdf(invoice.id, `${invoice.invoice_number.replace(/\//g, '-')}.pdf`);
    } catch { toast.error('Download failed'); }
    finally { setBusy(false); }
  };

  const handleEmail = async () => {
    if (!invoice) return;
    setBusy(true);
    try {
      const res = await invoicesApi.email(invoice.id);
      res.success ? toast.success('Emailed') : toast.error(res.message || 'Email failed');
    } catch { toast.error('Email failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="inv-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="inv-modal">
        <div className="inv-modal-toolbar">
          <div className="inv-modal-title">{invoice ? invoice.invoice_number : 'Loading...'}</div>
          <div className="inv-modal-actions">
            {invoice && (
              <>
                <button className="inv-btn" onClick={() => window.print()} disabled={busy}>
                  <Printer size={14} /> Print
                </button>
                <button className="inv-btn" onClick={handleDownload} disabled={busy}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} PDF
                </button>
                {!readOnly && (
                  <button className="inv-btn" onClick={handleEmail} disabled={busy}>
                    <Mail size={14} /> Email
                  </button>
                )}
              </>
            )}
            <button className="inv-btn inv-btn--icon" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="inv-modal-body">
          {loading ? (
            <div className="inv-loading">
              <Loader2 size={20} className="animate-spin" /> Loading...
            </div>
          ) : invoice ? (
            <div className="inv-paper" id="invoice-print-area">
              {/* Title */}
              <div className="inv-paper-head">
                <div className="inv-paper-title-block">
                  <div className="inv-paper-title">TAX INVOICE</div>
                  <div className="inv-paper-meta">
                    <div><strong>Invoice #:</strong> {invoice.invoice_number}</div>
                    <div><strong>Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</div>
                    {invoice.due_date && <div><strong>Due:</strong> {new Date(invoice.due_date).toLocaleDateString('en-IN')}</div>}
                  </div>
                </div>
                <div className={`inv-status-large inv-status--${invoice.status}`}>
                  {invoice.status}
                </div>
              </div>

              {/* Parties */}
              <div className="inv-parties">
                <div className="inv-party">
                  <div className="inv-party-label">FROM (Seller)</div>
                  <div className="inv-party-name">{invoice.seller_name}</div>
                  <div className="inv-party-addr">{invoice.seller_address}</div>
                  {invoice.seller_gstin && <div className="inv-party-id">GSTIN: {invoice.seller_gstin}</div>}
                  <div className="inv-party-state">State: {invoice.seller_state} ({invoice.seller_state_code})</div>
                  {invoice.seller_email && <div className="inv-party-contact">{invoice.seller_email}</div>}
                  {invoice.seller_phone && <div className="inv-party-contact">{invoice.seller_phone}</div>}
                </div>
                <div className="inv-party">
                  <div className="inv-party-label">BILL TO (Buyer)</div>
                  <div className="inv-party-name">{invoice.buyer_name}</div>
                  <div className="inv-party-addr">{invoice.buyer_address}</div>
                  {invoice.buyer_gstin && <div className="inv-party-id">GSTIN: {invoice.buyer_gstin}</div>}
                  <div className="inv-party-state">State: {invoice.buyer_state} ({invoice.buyer_state_code})</div>
                  {invoice.buyer_email && <div className="inv-party-contact">{invoice.buyer_email}</div>}
                  {invoice.buyer_phone && <div className="inv-party-contact">{invoice.buyer_phone}</div>}
                </div>
              </div>

              {/* Place of supply / reverse charge notice */}
              <div className="inv-meta-strip">
                <span><strong>Place of Supply:</strong> {invoice.place_of_supply} ({invoice.place_of_supply_code})</span>
                <span><strong>Type:</strong> {invoice.is_interstate ? 'Inter-state (IGST)' : 'Intra-state (CGST+SGST)'}</span>
                {invoice.reverse_charge && <span className="inv-flag">Reverse Charge Applies</span>}
              </div>

              {/* Line items */}
              <div className="inv-lines-wrap">
                <table className="inv-lines">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th>HSN/SAC</th>
                      <th className="num">Qty</th>
                      <th>Unit</th>
                      <th className="num">Rate</th>
                      <th className="num">Disc %</th>
                      <th className="num">Taxable</th>
                      {invoice.is_interstate ? (
                        <th className="num" colSpan={2}>IGST</th>
                      ) : (
                        <>
                          <th className="num" colSpan={2}>CGST</th>
                          <th className="num" colSpan={2}>SGST</th>
                        </>
                      )}
                      <th className="num">Total</th>
                    </tr>
                    <tr className="inv-lines-subhead">
                      <th colSpan={8}></th>
                      {invoice.is_interstate ? (
                        <><th className="num">%</th><th className="num">₹</th></>
                      ) : (
                        <>
                          <th className="num">%</th><th className="num">₹</th>
                          <th className="num">%</th><th className="num">₹</th>
                        </>
                      )}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items.map((li, idx) => (
                      <tr key={li.id}>
                        <td>{idx + 1}</td>
                        <td>{li.description}</td>
                        <td><code>{li.hsn_sac_code}</code></td>
                        <td className="num">{li.quantity}</td>
                        <td>{li.unit}</td>
                        <td className="num">{fmt(li.unit_price)}</td>
                        <td className="num">{Number(li.discount_percent).toFixed(2)}</td>
                        <td className="num">{fmt(li.taxable_value)}</td>
                        {invoice.is_interstate ? (
                          <><td className="num">{Number(li.igst_rate).toFixed(2)}</td><td className="num">{fmt(li.igst_amount)}</td></>
                        ) : (
                          <>
                            <td className="num">{Number(li.cgst_rate).toFixed(2)}</td><td className="num">{fmt(li.cgst_amount)}</td>
                            <td className="num">{Number(li.sgst_rate).toFixed(2)}</td><td className="num">{fmt(li.sgst_amount)}</td>
                          </>
                        )}
                        <td className="num"><strong>{fmt(li.total_amount)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="inv-totals-wrap">
                <div className="inv-totals">
                  <div className="inv-total-row">
                    <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
                  </div>
                  {Number(invoice.discount_amount) > 0 && (
                    <div className="inv-total-row">
                      <span>Discount</span><span>−{fmt(invoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="inv-total-row">
                    <span>Taxable Amount</span><span>{fmt(invoice.taxable_amount)}</span>
                  </div>
                  {!invoice.is_interstate && (
                    <>
                      <div className="inv-total-row">
                        <span>CGST</span><span>{fmt(invoice.cgst_amount)}</span>
                      </div>
                      <div className="inv-total-row">
                        <span>SGST</span><span>{fmt(invoice.sgst_amount)}</span>
                      </div>
                    </>
                  )}
                  {invoice.is_interstate && (
                    <div className="inv-total-row">
                      <span>IGST</span><span>{fmt(invoice.igst_amount)}</span>
                    </div>
                  )}
                  {Number(invoice.round_off) !== 0 && (
                    <div className="inv-total-row">
                      <span>Round Off</span><span>{fmt(invoice.round_off)}</span>
                    </div>
                  )}
                  <div className="inv-total-row inv-total-row--grand">
                    <span>Grand Total</span>
                    <span>{fmt(invoice.total_amount)}</span>
                  </div>
                </div>
              </div>

              {invoice.amount_in_words && (
                <div className="inv-words">
                  <strong>Amount in words:</strong> {invoice.amount_in_words}
                </div>
              )}

              {invoice.notes && (
                <div className="inv-notes">
                  <strong>Notes:</strong>
                  <p>{invoice.notes}</p>
                </div>
              )}

              {invoice.terms_and_conditions && (
                <div className="inv-terms">
                  <strong>Terms &amp; Conditions:</strong>
                  <p>{invoice.terms_and_conditions}</p>
                </div>
              )}

              <div className="inv-footer">
                <div>This is a computer-generated invoice. No signature required.</div>
                <div>Issued on {new Date(invoice.created_at).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ) : (
            <div className="inv-error">Invoice not found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

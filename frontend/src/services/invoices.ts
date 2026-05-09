import api, { API_URL } from './api';

// =============================================================================
// Types
// =============================================================================
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';
export type InvoiceType = 'tax_invoice' | 'proforma' | 'credit_note';

export interface InvoiceLineItem {
  id: number;
  description: string;
  hsn_sac_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  order_id: number | null;
  vendor_id: number | null;
  customer_id: number | null;
  invoice_date: string;
  due_date: string | null;
  seller_name: string;
  seller_address: string;
  seller_gstin: string | null;
  seller_state: string;
  seller_state_code: string;
  seller_email: string | null;
  seller_phone: string | null;
  buyer_name: string;
  buyer_address: string;
  buyer_gstin: string | null;
  buyer_state: string;
  buyer_state_code: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  round_off: number;
  total_amount: number;
  amount_in_words: string | null;
  place_of_supply: string;
  place_of_supply_code: string;
  reverse_charge: boolean;
  is_interstate: boolean;
  currency: string;
  notes: string | null;
  terms_and_conditions: string | null;
  line_items: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceListParams {
  status?: InvoiceStatus | '';
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface InvoiceLineItemCreate {
  description: string;
  hsn_sac_code?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_percent?: number;
  cgst_rate?: number;
  sgst_rate?: number;
  igst_rate?: number;
}

export interface InvoiceCreate {
  invoice_type?: InvoiceType;
  order_id?: number | null;
  customer_id?: number | null;
  invoice_date?: string;
  due_date?: string | null;
  buyer_name: string;
  buyer_address: string;
  buyer_gstin?: string | null;
  buyer_state: string;
  buyer_state_code: string;
  buyer_email?: string | null;
  buyer_phone?: string | null;
  place_of_supply: string;
  place_of_supply_code: string;
  reverse_charge?: boolean;
  notes?: string | null;
  terms_and_conditions?: string | null;
  line_items: InvoiceLineItemCreate[];
}

export interface VendorInvoiceStats {
  vendor_id?: number | null;
  total_count: number;
  total_invoiced: number;
  paid_count: number;
  paid_amount: number;
  pending_count: number;
  pending_amount: number;
  this_month_count: number;
  this_month_amount: number;
  by_status?: Record<string, number>;
}

// =============================================================================
// API wrapper
// =============================================================================
export const invoicesApi = {
  list: async (params?: InvoiceListParams): Promise<Invoice[]> => {
    const response = await api.get<Invoice[]>('/invoices/', { params });
    return response.data;
  },

  get: async (id: number): Promise<Invoice> => {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  generateFromOrder: async (orderId: number): Promise<Invoice> => {
    const response = await api.post<Invoice>(`/invoices/from-order/${orderId}`);
    return response.data;
  },

  create: async (body: InvoiceCreate): Promise<Invoice> => {
    const response = await api.post<Invoice>('/invoices/', body);
    return response.data;
  },

  updateStatus: async (id: number, status: InvoiceStatus): Promise<Invoice> => {
    const response = await api.put<Invoice>(`/invoices/${id}/status`, { status });
    return response.data;
  },

  downloadPdf: async (id: number, filename?: string): Promise<void> => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  email: async (
    id: number,
    body?: { to?: string; message?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post(`/invoices/${id}/email`, body || {});
    return response.data;
  },

  getVendorStats: async (): Promise<VendorInvoiceStats> => {
    const response = await api.get<VendorInvoiceStats>('/invoices/stats/vendor');
    return response.data;
  },
};

// Small helper so consumers can construct a stable PDF preview URL if needed.
export function invoicePdfUrl(id: number): string {
  return `${API_URL}/invoices/${id}/pdf`;
}

// Validate an Indian GSTIN. Returns true if format matches, false otherwise.
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGstin(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function isValidPan(pan: string): boolean {
  return PAN_REGEX.test(pan.trim().toUpperCase());
}

// Shared billing/invoice types used across customer-facing and admin billing UIs.
// Invoice + InvoiceLineItem are defined in services/invoices.ts (Agent 3).
// We re-export them here so consumers can import everything from one location.

export type {
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceType,
  InvoiceListParams,
} from '../services/invoices';

export interface BillingAddress {
  id: number;
  label: string | null;
  name: string;
  gstin: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
  country: string;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  is_business: boolean;
  created_at: string;
}

export type BillingAddressInput = Omit<BillingAddress, 'id' | 'created_at'>;

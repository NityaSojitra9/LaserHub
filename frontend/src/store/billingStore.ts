/**
 * Zustand store for the billing selection at checkout.
 *
 * Keeps track of the billing address ID the user picked from their saved
 * addresses, and an optional GSTIN override for guest checkout where no saved
 * address exists. Cleared via `reset()` after an order is placed.
 */
import { create } from 'zustand';

interface BillingState {
  /** ID of the saved BillingAddress selected for this order, or null for inline entry. */
  selectedAddressId: number | null;
  /** GSTIN entered at checkout by a guest/one-off buyer (nullable). */
  gstinOverride: string | null;

  setAddress: (id: number | null) => void;
  setGstinOverride: (gstin: string | null) => void;
  reset: () => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  selectedAddressId: null,
  gstinOverride: null,

  setAddress: (id) => set({ selectedAddressId: id }),
  setGstinOverride: (gstin) => set({ gstinOverride: gstin }),
  reset: () => set({ selectedAddressId: null, gstinOverride: null }),
}));

import api from './api';
import type { BillingAddress, BillingAddressInput } from '../types/billing';

export const billingAddressesApi = {
  list: async (): Promise<BillingAddress[]> => {
    const response = await api.get<BillingAddress[]>('/billing-addresses/');
    return response.data;
  },

  create: async (data: BillingAddressInput): Promise<BillingAddress> => {
    const response = await api.post<BillingAddress>('/billing-addresses/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<BillingAddressInput>): Promise<BillingAddress> => {
    const response = await api.put<BillingAddress>(`/billing-addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/billing-addresses/${id}`);
  },

  setDefault: async (id: number): Promise<BillingAddress> => {
    const response = await api.put<BillingAddress>(`/billing-addresses/${id}/default`);
    return response.data;
  },
};

export default billingAddressesApi;

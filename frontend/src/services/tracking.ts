/**
 * Tracking API wrappers.
 */

import api from './api';

export interface OrderEvent {
  id: number;
  event_type: string;
  message: string;
  photo_url: string | null;
  tracking_number: string | null;
  courier: string | null;
  created_at: string;
  created_by_name: string | null;
}

export interface OrderTimeline {
  order_id: number;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  material_name: string | null;
  thickness_mm: number | null;
  quantity: number;
  total_amount: number;
  shipping_address: string;
  courier: string | null;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  vendor_name: string | null;
  vendor_email: string | null;
  file_id: string | null;
  events: OrderEvent[];
}

export interface EventCreatePayload {
  event_type: string;
  message?: string;
  photo_url?: string;
  tracking_number?: string;
  courier?: string;
  estimated_delivery_date?: string;
}

export const trackingApi = {
  getOrderTimeline: async (orderId: number): Promise<OrderTimeline> => {
    const { data } = await api.get<OrderTimeline>(`/tracking/order/${orderId}`);
    return data;
  },

  getGuestTracking: async (token: string): Promise<OrderTimeline> => {
    const { data } = await api.get<OrderTimeline>(`/tracking/guest/${encodeURIComponent(token)}`);
    return data;
  },

  addEvent: async (orderId: number, payload: EventCreatePayload): Promise<OrderEvent> => {
    const { data } = await api.post<OrderEvent>(`/tracking/order/${orderId}/event`, payload);
    return data;
  },

  uploadPhoto: async (orderId: number, file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<{ url: string }>(
      `/tracking/order/${orderId}/upload-photo`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },
};

/**
 * Courier tracking link helpers.
 */

export type CourierKey = 'delhivery' | 'bluedart' | 'ups' | 'fedex' | 'dhl';

export interface CourierInfo {
  name: string;
  url: (trackingNumber: string) => string;
}

export const COURIERS: Record<CourierKey, CourierInfo> = {
  delhivery: {
    name: 'Delhivery',
    url: (t) => `https://www.delhivery.com/track/package/${encodeURIComponent(t)}`,
  },
  bluedart: {
    name: 'BlueDart',
    url: (t) => `https://www.bluedart.com/tracking/${encodeURIComponent(t)}`,
  },
  ups: {
    name: 'UPS',
    url: (t) => `https://www.ups.com/track?tracknum=${encodeURIComponent(t)}`,
  },
  fedex: {
    name: 'FedEx',
    url: (t) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}`,
  },
  dhl: {
    name: 'DHL',
    url: (t) =>
      `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(t)}`,
  },
};

export function getCourierTrackingUrl(
  courier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!courier || !trackingNumber) return null;
  const key = courier.toLowerCase() as CourierKey;
  const entry = COURIERS[key];
  if (!entry) return null;
  return entry.url(trackingNumber);
}

export function getCourierName(courier: string | null | undefined): string {
  if (!courier) return '';
  const key = courier.toLowerCase() as CourierKey;
  return COURIERS[key]?.name || courier;
}

export const COURIER_OPTIONS: { value: CourierKey; label: string }[] = (
  Object.keys(COURIERS) as CourierKey[]
).map((k) => ({ value: k, label: COURIERS[k].name }));

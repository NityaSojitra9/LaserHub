export interface IndiaState {
  name: string;
  code: string;
}

export const INDIA_STATES: IndiaState[] = [
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Karnataka', code: '29' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Delhi', code: '07' },
  { name: 'Gujarat', code: '24' },
  { name: 'West Bengal', code: '19' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Kerala', code: '32' },
  { name: 'Punjab', code: '03' },
  { name: 'Haryana', code: '06' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Bihar', code: '10' },
  { name: 'Odisha', code: '21' },
  { name: 'Telangana', code: '36' },
  { name: 'Goa', code: '30' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Assam', code: '18' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'Jammu and Kashmir', code: '01' },
  { name: 'Ladakh', code: '38' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Puducherry', code: '34' },
  { name: 'Andaman and Nicobar Islands', code: '35' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: '26' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' },
  { name: 'Sikkim', code: '11' },
  { name: 'Tripura', code: '16' },
  { name: 'Arunachal Pradesh', code: '12' },
];

export function findStateByName(name: string): IndiaState | undefined {
  if (!name) return undefined;
  const needle = name.trim().toLowerCase();
  return INDIA_STATES.find((s) => s.name.toLowerCase() === needle);
}

export function findStateByCode(code: string): IndiaState | undefined {
  if (!code) return undefined;
  const needle = code.trim();
  return INDIA_STATES.find((s) => s.code === needle);
}

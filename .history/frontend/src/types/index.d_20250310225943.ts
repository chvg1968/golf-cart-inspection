// export const CartPartCategory = {
//   EXTERIOR: 'Exterior',
//   INTERIOR: 'Interior',
//   SEATS: 'Seats',
//   MECHANICAL: 'Mechanical',
//   OTHER: 'Other'
// };

export type CartPartCategory = typeof CartPartCategory[keyof typeof CartPartCategory];

export interface CartPart {
  id: string;
  name: string;
  category: CartPartCategory;
}

export interface CartTypeOption {
  value: string;
  label: string;
}

export interface CartProperty {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

export interface DamageType {
  value: string;
  name: string;
}

export interface Damage {
  part: string;
  type: string;
  quantity: number;
}

export interface GuestInfo {
  name?: string;
  email?: string;
  phone?: string;
}

// Base Types for Golf Cart Inspection
export const CartPartCategory = {
  EXTERIOR: 'Exterior',
  INTERIOR: 'Interior',
  SEATS: 'Seats',
  MECHANICAL: 'Mechanical',
  OTHER: 'Other'
} as const;

export type CartPartCategoryType = typeof CartPartCategory[keyof typeof CartPartCategory];

export interface Point {
  x: number;
  y: number;
}

export interface GuestInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export type CartPart = {
  id: string;
  name: string;
  category: CartPartCategoryType;
};

export type CartTypeOption = {
  name: string;
  diagramPath?: string;
};

export type DamageType = {
  id: string;
  value: string;
  name: string;
  label?: string;
  severity?: string;
};

export type Properties = {
  id: string;
  name: string;
  type: string;
  required: boolean;
};

export type Damage = {
  part: CartPartCategoryType;
  type: string;
  quantity: number;
};

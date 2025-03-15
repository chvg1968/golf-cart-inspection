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
  id: number | string;
  name: string;
  diagramPath?: string;
  value?: string;
};

export type DamageType = {
  id: number | string;
  name: string;
  value?: string;
  severity?: string;
};

export type Properties = {
  id: string;
  name: string;
  type: string;
  required: boolean;
};

export type Damage = {
  part: number | string;
  type: number | string;
  quantity: number;
  description?: string;
  category: CartPartCategoryType;
  x?: number;
  y?: number;
};

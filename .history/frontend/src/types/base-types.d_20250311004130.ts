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

export interface DamageType {
  value: string;
  label: string;
  name: string;
  severity?: string;
  id?: string;
}

export type CartPart = {
  id: string;
  name: string;
  category: CartPartCategoryType;
  value: string;
};

export type CartTypeOption = {
  value: string;
  label?: string;
  diagramPath?: string;
  id?: string;
  name?: string;
};

export type CartProperty = {
  id: string;
  name: string;
  type: 'color' | 'year' | 'make' | 'model';
  value: string;
};

export type Damage = {
  part: string;
  type: string;
  quantity: number;
};

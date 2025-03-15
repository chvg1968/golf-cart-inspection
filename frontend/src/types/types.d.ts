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

export type Damage = {
  part: number | string;
  type: number | string;
  quantity: number;
  description?: string;
  category: string;
  x?: number;
  y?: number;
};

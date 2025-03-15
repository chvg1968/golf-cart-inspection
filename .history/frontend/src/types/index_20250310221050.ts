export interface Point {
  x?: number;
  y?: number;
}

export enum CartPartCategory {
  EXTERIOR = 'Exterior',
  INTERIOR = 'Interior',
  SEATS = 'Seats',
  MECHANICAL = 'Mechanical',
  OTHER = 'Other'
}

export interface CartPart {
  id: string;
  name: string;
  value?: string;
  category: CartPartCategory;
  diagramPath?: string;
}

export interface CartTypeOption {
  value: string;
  name?: string;
  diagramPath?: string;
}

export interface CartProperty {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

export interface DamageType {
  value: string;
  name?: string;
}

export interface Damage {
  part: string;
  type: string;
  quantity: number;
  description?: string;
  category?: string;
}

export interface GuestInfo {
  name?: string;
  email?: string;
  phone?: string;
  property?: string | null;
  date?: string;
}

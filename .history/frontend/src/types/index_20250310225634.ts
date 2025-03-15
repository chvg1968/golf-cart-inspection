import type { 
  CartPartCategory 
} from './index.d.ts'

export const CartPartCategory = {
  EXTERIOR: 'Exterior',
  INTERIOR: 'Interior',
  SEATS: 'Seats',
  MECHANICAL: 'Mechanical',
  OTHER: 'Other'
} as const

export type CartPartCategory = typeof CartPartCategory[keyof typeof CartPartCategory]



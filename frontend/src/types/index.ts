// Type Exports for Golf Cart Inspection
export * from './base-types'

export type { 
  CART_PARTS, 
  GOLF_CART_TYPES, 
  DAMAGE_TYPES, 
  PROPERTIES 
} from '../constants'

// Tipos adicionales si son necesarios
import { User } from '@supabase/supabase-js'

export interface UserExtended extends User {
  email: string
}

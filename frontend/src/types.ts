// Tipos para la aplicación de inspección de carros de golf

export interface Damage {
  part: string
  type: string
  description?: string
  quantity: number
  category?: string
  x: number
  y: number
  position?: {
    x: number
    y: number
  }
}

export interface CartTypeOption {
  label: string
  value: string
  diagramPath: string
}

export interface PropertyOption {
  label: string
  value: string
}

export interface CartPart {
  id: string
  name: string
  category: string
}

export interface DamageType {
  label: string
  value: string
}

export interface GuestInfo {
  name: string
  email: string
  phone: string
  date: string
}

export interface InspectionForm {
  guestInfo: GuestInfo
  selectedProperty: PropertyOption | null
  selectedCartType: CartTypeOption | null
  damages: Damage[]
  observations?: string
  signature?: string | null
  termsAccepted: boolean
}

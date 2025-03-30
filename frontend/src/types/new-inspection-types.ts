import { 
  Properties, 
  CartTypeOption, 
  GuestInfo 
} from './base-types'

export interface PDFGeneratorRef {
  generatePDF: () => Promise<Blob>
}

export interface NewInspectionState {
  selectedProperty: Properties | null
  selectedCartType: CartTypeOption
  guestInfo: GuestInfo
  annotatedDiagramImage: string
  diagramMarkings: Record<string, string>
  guestObservations: string
  signature: string | null
  termsAccepted: boolean
  cartNumber: string
}

// Re-exportar tipos base para evitar conflictos de importación
export type { 
  Properties, 
  CartTypeOption, 
  GuestInfo 
}

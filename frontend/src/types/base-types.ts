export interface Properties {
  id: string
  name: string
  type: string
  required: boolean
  cartNumber: string
  diagramType: string
  value?: string  // Add optional value property
  label?: string  // Add optional label property
}

export interface GuestInfo {
  name: string
  email: string
  phone: string
  date: string
}

export interface CartTypeOption {
  id: string
  name: string
  label: string
  diagramPath: string
  value: string
}

export interface Damage {
  id?: string
  description: string
  location: string
  severity: 'low' | 'medium' | 'high'
}

export interface EmailData {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    content: string
    filename: string
    type: string
  }>
}

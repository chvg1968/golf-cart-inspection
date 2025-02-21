export type DamageSection = 
  | 'Front Left Side'
  | 'Front Right Side'
  | 'Rear Left Side'
  | 'Rear Right Side'
  | 'Roof'
  | 'Seats'
  | 'Steering & Dashboard'
  | 'Wheels & Tires'
  | 'Front Lights'
  | 'Rear Lights';

export type DamageType = 
  | 'Scratches'
  | 'Missing parts'
  | 'Damage/Bumps';

export interface DamageRecord {
  section: DamageSection;
  damageType: DamageType;
  quantity: number;
}

export interface GolfCartFormData {
  // Sección 1: Guest Basic Information
  id?: string;
  property: string;
  cartNumber: string | number;
  inspectionDate: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;

  // Sección 2: Damages List
  damageRecords?: DamageRecord[];

  // Sección 3: Guest Exclusive Fields
  previewObservationsByGuest?: string;
  acceptInspectionTerms: boolean;
  guestSignature?: string | null;

  // Campos adicionales
  golfCartInspectionSend?: boolean;
  pdfBase64?: string;
}

export const INSPECTION_SECTIONS: DamageSection[] = [
  'Front Left Side',
  'Front Right Side', 
  'Rear Left Side',
  'Rear Right Side',
  'Roof',
  'Seats',
  'Steering & Dashboard', 
  'Wheels & Tires',
  'Front Lights',
  'Rear Lights'
];

export const DAMAGE_TYPES: DamageType[] = [
  'Scratches',
  'Missing parts', 
  'Damage/Bumps'
];

export interface PdfAttachment {
  url: string;
  filename: string;
}

export interface AirtableFields {
  'Inspection ID'?: string;
  'Property'?: string;
  'Golf Cart Number'?: number;
  'Inspection Date'?: string;
  'Guest Name'?: string;
  'Guest Email'?: string;
  'Guest Phone'?: string; 
  'Golf Cart Inspection Send'?: boolean;
}

export interface FormValidationErrors {
  id?: string;
  property?: string;
  cartNumber?: string;
  inspectionDate?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  golfcartinspectionsend?: boolean;
}

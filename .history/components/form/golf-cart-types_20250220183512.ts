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
  property: string;
  cartNumber: number | string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  date: Date;
  inspectionDate?: string;
  previewObservationsByGuest?: string | null;
  acceptInspectionTerms: boolean;
  guestSignature?: string | null;
  damageRecords: DamageRecord[];
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

export interface AirtableFields {
  'Property'?: string;
  'Golf Cart Number'?: number;
  'Inspection Date'?: string;
  'Guest Name'?: string;
  'Guest Email'?: string;
  'Guest Phone'?: string; 
  'Guest Signature Checked'?: boolean;
}

export interface FormValidationErrors {
  property?: string;
  cartNumber?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  date?: string;
}

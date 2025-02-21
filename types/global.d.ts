// Tipos para Airtable
declare module 'airtable' {
  export interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
    get(columnName: string): any;
  }

  export interface AirtableBase {
    create(tableName: string, fields: Record<string, any>, callback: (err: Error | null, record: AirtableRecord) => void): void;
    select(options: {
      filterByFormula?: string;
      maxRecords?: number;
    }): AirtableQuery;
    update(recordId: string, fields: Record<string, any>, callback: (err: Error | null, record: AirtableRecord) => void): void;
  }

  export interface AirtableQuery {
    eachPage(
      pageFunction: (records: AirtableRecord[], fetchNextPage: () => void) => void,
      doneFunction: (err: Error | null) => void
    ): void;
  }

  export function configure(options: { apiKey: string }): void;
  export function base(baseId: string): AirtableBase;
}

// Tipos para registros específicos
interface TokenRecord {
  token: string;
  inspectionId: string;
  expirationDate: string;
  status: 'active' | 'used' | 'expired';
}

interface InspectionRecord {
  id: string;
  propertyName?: string;
  cartDetails?: string;
  // Añade aquí los campos específicos de tu tabla de inspecciones
}

// Tipos para variables de entorno
declare namespace NodeJS {
  interface ProcessEnv {
    AIRTABLE_API_KEY: string;
    AIRTABLE_BASE_ID: string;
    NEXT_PUBLIC_SITE_URL: string;
  }
}

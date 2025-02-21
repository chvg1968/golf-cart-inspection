import Airtable from 'airtable';

// Definición de tipo FieldSet
export interface FieldSet {
  'Inspection ID'?: string;
  'Property'?: string;
  'Golf Cart Number'?: number | string;
  'Inspection Date'?: string;
  'Guest Name'?: string;
  'Guest Email'?: string;
  'Guest Phone'?: string;
  'Golf Cart Inspection Send'?: boolean;
  [key: string]: any;
}

// Definición de tipo de error de Airtable
interface AirtableError extends Error {
  statusCode?: number;
  message: string;
}

// Configurar Airtable
const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID || '');

const tableName = process.env.AIRTABLE_TABLE_NAME || 'Inspections';

export async function createAirtableRecord(record: Partial<FieldSet>): Promise<{ id: string }> {
  try {
    const createdRecord = await new Promise<Airtable.Record<FieldSet>>((resolve, reject) => {
      base(tableName).create(record, (err: AirtableError | null, record?: Airtable.Record<FieldSet>) => {
        if (err) {
          console.error('Error creating Airtable record:', err);
          reject(err);
        } else if (record) {
          resolve(record);
        } else {
          reject(new Error('No record created'));
        }
      });
    });

    return { 
      id: createdRecord.id 
    };
  } catch (error) {
    console.error('Airtable record creation failed:', error);
    throw error;
  }
}

export async function updateAirtableRecord(recordId: string, data: Partial<FieldSet>): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      base(tableName).update(recordId, data, (err: AirtableError | null) => {
        if (err) {
          console.error('Error updating Airtable record:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Airtable record update failed:', error);
    throw error;
  }
}

export const getAirtableRecord = async (inspectionId: string): Promise<FieldSet | null> => {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    const records = await base(process.env.AIRTABLE_TABLE_NAME || 'Inspections')
      .select({
        filterByFormula: `{Inspection ID} = "${inspectionId}"`
      })
      .firstPage();

    if (records.length === 0) {
      return null;
    }

    return records[0].fields;
  } catch (error) {
    console.error('Error fetching Airtable record:', error);
    throw error;
  }
};

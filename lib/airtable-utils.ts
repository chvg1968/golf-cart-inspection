import Airtable from 'airtable';
import { randomUUID } from 'crypto';

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY || '',
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID || '');

export async function createRecord<T>(tableName: string, fields: Partial<T>): Promise<Airtable.AirtableRecord> {
  return new Promise((resolve, reject) => {
    base(tableName).create(fields, (err, record) => {
      if (err) reject(err);
      resolve(record);
    });
  });
}

export async function findRecord<T>(tableName: string, options: { 
  filterByFormula?: string, 
  maxRecords?: number 
} = {}): Promise<Airtable.AirtableRecord[]> {
  return new Promise((resolve, reject) => {
    const records: Airtable.AirtableRecord[] = [];
    base(tableName)
      .select({
        filterByFormula: options.filterByFormula,
        maxRecords: options.maxRecords || 1
      })
      .eachPage(
        (pageRecords, fetchNextPage) => {
          records.push(...pageRecords);
          fetchNextPage();
        },
        (err) => {
          if (err) reject(err);
          resolve(records);
        }
      );
  });
}

export async function updateRecord<T>(tableName: string, recordId: string, fields: Partial<T>): Promise<Airtable.AirtableRecord> {
  return new Promise((resolve, reject) => {
    base(tableName).update(recordId, fields, (err, record) => {
      if (err) reject(err);
      resolve(record);
    });
  });
}

export async function createGuestToken(inspectionId: string, expirationDays = 7): Promise<TokenRecord> {
  const token = randomUUID();
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);

  const record = await createRecord<TokenRecord>('GuestTokens', {
    token,
    inspectionId,
    expirationDate: expirationDate.toISOString(),
    status: 'active'
  });

  return record.fields as TokenRecord;
}

export async function validateGuestToken(token: string): Promise<{ 
  valid: boolean; 
  inspectionId?: string; 
  inspectionData?: InspectionRecord;
  message?: string;
}> {
  try {
    const tokenRecords = await findRecord<TokenRecord>('GuestTokens', {
      filterByFormula: `token = "${token}"`
    });

    if (!tokenRecords.length) {
      return { valid: false, message: 'Token inválido' };
    }

    const tokenRecord = tokenRecords[0].fields as TokenRecord;
    const expirationDate = new Date(tokenRecord.expirationDate);
    const now = new Date();

    if (expirationDate < now || tokenRecord.status !== 'active') {
      return { valid: false, message: 'Token expirado o inactivo' };
    }

    const inspectionRecords = await findRecord<InspectionRecord>('Inspections', {
      filterByFormula: `id = "${tokenRecord.inspectionId}"`
    });

    if (!inspectionRecords.length) {
      return { valid: false, message: 'Inspección no encontrada' };
    }

    await updateRecord<TokenRecord>('GuestTokens', tokenRecords[0].id, {
      status: 'used'
    });

    return { 
      valid: true, 
      inspectionId: tokenRecord.inspectionId,
      inspectionData: inspectionRecords[0].fields as InspectionRecord
    };

  } catch (error) {
    console.error('Error validating guest token:', error);
    return { valid: false, message: 'Error interno al validar token' };
  }
}

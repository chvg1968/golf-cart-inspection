import AirtableLib from 'airtable';
import { AirtableFields } from '../../../../components/form';

export const initializeAirtable = () => {
  const base = new AirtableLib({
    apiKey: process.env.AIRTABLE_API_KEY
  }).base(process.env.AIRTABLE_BASE_ID!);

  return base(process.env.AIRTABLE_TABLE_NAME!);
};

export const createAirtableRecord = (table: any, fields: AirtableFields) => {
  return new Promise((resolve, reject) => {
    table.create(fields, (err: any, record: any) => {
      if (err) reject(err);
      else resolve(record);
    });
  });
};

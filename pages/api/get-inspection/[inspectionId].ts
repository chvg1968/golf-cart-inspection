import type { NextApiRequest, NextApiResponse } from 'next';
import AirtableLib from 'airtable';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extraer y limpiar el inspectionId
  let { inspectionId } = req.query;
  
  // Manejar casos donde inspectionId es un array o contiene caracteres no deseados
  const cleanInspectionId = Array.isArray(inspectionId) 
    ? inspectionId[0] 
    : inspectionId?.replace(/^\//, '') || '';

  if (!cleanInspectionId) {
    return res.status(400).json({ error: 'ID de inspección inválido' });
  }

  try {
    // Configurar Airtable
    const base = new AirtableLib({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID || '');

    // Buscar registros con este ID de inspección
    // Usar una búsqueda más flexible que permita coincidencias parciales
    const records = await base(process.env.AIRTABLE_TABLE_NAME || '').select({
      filterByFormula: `FIND("${cleanInspectionId}", {Inspection ID}) > 0`
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ 
        error: 'Inspección no encontrada',
        searchedId: cleanInspectionId
      });
    }

    // Agrupar datos de la inspección
    const firstRecord = records[0];
    const inspectionData = {
      inspectionId: firstRecord.get('Inspection ID'),
      property: firstRecord.get('Property'),
      cartNumber: firstRecord.get('Golf Cart Number'),
      guestName: firstRecord.get('Guest Name'),
      guestEmail: firstRecord.get('Guest Email'),
      inspectionDate: firstRecord.get('Inspection Date'),
      frontLeftSide: {
        scratches: records
          .filter(r => r.get('Section') === 'Front Left' && r.get('Damage Type') === 'Scratches')
          .reduce((sum, r) => sum + (r.get('Quantity') || 0), 0),
        missingParts: records
          .filter(r => r.get('Section') === 'Front Left' && r.get('Damage Type') === 'Missing Parts')
          .reduce((sum, r) => sum + (r.get('Quantity') || 0), 0),
        damageBumps: records
          .filter(r => r.get('Section') === 'Front Left' && r.get('Damage Type') === 'Damage/Bumps')
          .reduce((sum, r) => sum + (r.get('Quantity') || 0), 0)
      },
      frontRightSide: {
        scratches: records
          .filter(r => r.get('Section') === 'Front Right' && r.get('Damage Type') === 'Scratches')
          .reduce((sum, r) => sum + (r.get('Quantity') || 0), 0),
        missingParts: records
          .filter(r => r.get('Section') === 'Front Right' && r.get('Damage Type') === 'Missing Parts')
          .reduce((sum, r) => sum + (r.get('Quantity') || 0), 0),
        damageBumps: records
          .filter(r => r.get('Section') === 'Front Right' && r.get('Damage Type') === 'Damage/Bumps')
          .reduce((sum, r) => sum + (r.get('Quantity') || 0), 0)
      }
    };

    res.status(200).json(inspectionData);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ 
      error: 'Error al obtener los datos de la inspección',
      details: error instanceof Error ? error.message : 'Error desconocido',
      searchedId: cleanInspectionId
    });
  }
}

// Deshabilitar el body parser para permitir URLs más flexibles
export const config = {
  api: {
    bodyParser: false
  }
};

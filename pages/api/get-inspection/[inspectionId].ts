import type { NextApiRequest, NextApiResponse } from 'next';
import AirtableLib from 'airtable';
import { Records, FieldSet } from 'airtable';

// Tipos para mejorar la tipificación
interface IssueRecord {
  section: string;
  damageType: string;
  quantity: number;
}

interface InspectionData {
  inspectionId: string;
  property: string;
  cartNumber: string;
  date: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  observations?: string;
  sections: {
    frontLeftSide: {
      scratches: number;
      missingParts: number;
      damageBumps: number;
    };
    frontRightSide: {
      scratches: number;
      missingParts: number;
      damageBumps: number;
    };
  };
  issues: IssueRecord[];
  signatureChecked?: boolean;
}

// Función de logging detallado
function logError(message: string, details: any = {}) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    type: 'INSPECTION_FETCH_ERROR',
    message,
    details
  }));
}

// Función para limpiar y normalizar IDs
function normalizeInspectionId(id: string | string[] | undefined): string | null {
  if (!id) return null;
  
  // Manejar casos de array y eliminar barras iniciales
  const rawId = (Array.isArray(id) ? id[0] : id)
    .replace(/^\/+/, '')  // Eliminar barras iniciales
    .trim();
  
  // Estrategias de normalización
  const normalizationStrategies = [
    // 1. Usar toda la cadena
    () => rawId,
    
    // 2. Extraer último segmento
    () => {
      const parts = rawId.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    }
  ];

  // Probar estrategias hasta encontrar un ID válido
  for (const strategy of normalizationStrategies) {
    const cleanId = strategy();
    if (cleanId && cleanId.length > 0) {
      logError('ID normalizado con éxito', { 
        original: id, 
        normalized: cleanId 
      });
      return cleanId;
    }
  }
  
  return null;
}

// Función para serializar datos de manera segura
function safeSerialize(data: any): string {
  try {
    return JSON.stringify(data, (key, value) => {
      // Manejar valores undefined
      if (typeof value === 'undefined') return null;
      
      // Convertir fechas a cadenas ISO
      if (value instanceof Date) return value.toISOString();
      
      // Manejar valores no serializables
      if (typeof value === 'function') return undefined;
      
      return value;
    }, 2);
  } catch (error) {
    logError('Error en serialización', { error: String(error) });
    return '{}';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Registrar detalles de la solicitud
  logError('Solicitud de obtención de inspección recibida', {
    method: req.method,
    query: req.query,
    headers: req.headers
  });

  // Normalizar el ID de inspección
  const inspectionId = normalizeInspectionId(req.query.inspectionId);

  if (!inspectionId) {
    logError('ID de inspección inválido', { 
      rawId: req.query.inspectionId 
    });
    return res.status(400).json({ 
      error: 'Invalid Inspection ID',
      details: 'No valid inspection ID was provided',
      rawId: req.query.inspectionId
    });
  }

  try {
    // Configurar Airtable
    const base = new AirtableLib({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID || '');

    // Estrategias de búsqueda con logging detallado
    const searchStrategies = [
      // 1. Búsqueda exacta
      async () => {
        logError('Intentando búsqueda exacta', { inspectionId });
        const records = await base(process.env.AIRTABLE_TABLE_NAME || '').select({
          filterByFormula: `{Inspection ID} = "${inspectionId}"`
        }).firstPage();
        logError('Resultados búsqueda exacta', { 
          recordCount: records.length 
        });
        return records;
      },
      // 2. Búsqueda parcial
      async () => {
        logError('Intentando búsqueda parcial', { inspectionId });
        const records = await base(process.env.AIRTABLE_TABLE_NAME || '').select({
          filterByFormula: `FIND("${inspectionId}", {Inspection ID}) > 0`
        }).firstPage();
        logError('Resultados búsqueda parcial', { 
          recordCount: records.length 
        });
        return records;
      },
      // 3. Búsqueda por componentes
      async () => {
        const parts = inspectionId.split('-');
        const searchPromises = parts.map(async (part) => {
          logError('Buscando por componente', { part });
          const records = await base(process.env.AIRTABLE_TABLE_NAME || '').select({
            filterByFormula: `FIND("${part}", {Inspection ID}) > 0`
          }).firstPage();
          return records;
        });

        const results = await Promise.all(searchPromises);
        const flattenedResults = results.flat();
        
        logError('Resultados búsqueda por componentes', { 
          recordCount: flattenedResults.length 
        });
        
        return flattenedResults;
      }
    ];

    // Ejecutar estrategias de búsqueda
    let records: Records<FieldSet> = [];
    for (const strategy of searchStrategies) {
      const strategyResults = await strategy();
      if (strategyResults.length > 0) {
        records = strategyResults;
        break;
      }
    }

    // Manejar resultados
    if (records.length === 0) {
      logError('No se encontraron registros', { inspectionId });
      return res.status(404).json({ 
        error: 'Inspection Not Found',
        details: `No records found for ID: ${inspectionId}`
      });
    }

    // Procesar todos los registros para extraer secciones e incidencias
    const issues: IssueRecord[] = records.map(record => ({
      section: record.get('Section') as string,
      damageType: record.get('Damage Type') as string,
      quantity: record.get('Quantity') as number || 0
    }));

    // Agrupar issues por sección
    const sections = {
      frontLeftSide: {
        scratches: 0,
        missingParts: 0,
        damageBumps: 0
      },
      frontRightSide: {
        scratches: 0,
        missingParts: 0,
        damageBumps: 0
      }
    };

    issues.forEach(issue => {
      const sectionKey = issue.section.toLowerCase().includes('left') ? 
        'frontLeftSide' : 'frontRightSide';

      switch(issue.damageType) {
        case 'Scratches':
          sections[sectionKey].scratches += issue.quantity;
          break;
        case 'Missing Parts':
          sections[sectionKey].missingParts += issue.quantity;
          break;
        case 'Damage/Bumps':
          sections[sectionKey].damageBumps += issue.quantity;
          break;
      }
    });

    // Convertir registros readonly a mutable
    const firstRecord = records[0];
    const inspectionData: InspectionData = {
      inspectionId: firstRecord.get('Inspection ID') as string,
      property: firstRecord.get('Property') as string,
      cartNumber: firstRecord.get('Golf Cart Number') as string,
      date: firstRecord.get('Inspection Date') as string,
      guestName: firstRecord.get('Guest Name') as string,
      guestEmail: firstRecord.get('Guest Email') as string,
      guestPhone: firstRecord.get('Guest Phone') as string,
      observations: firstRecord.get('Preview observations by Guest') as string,
      sections,
      issues,
      signatureChecked: firstRecord.get('Signature Checked') as boolean
    };

    logError('Datos de inspección encontrados', { 
      recordId: firstRecord.id,
      data: inspectionData 
    });

    // Usar serialización segura
    const serializedData = safeSerialize(inspectionData);
    
    // Establecer cabecera de contenido JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Enviar respuesta
    res.status(200).send(serializedData);
  } catch (error) {
    logError('Error en la búsqueda de inspección', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Deshabilitar el body parser para mayor flexibilidad
export const config = {
  api: {
    bodyParser: false
  }
};

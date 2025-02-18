const Airtable = require('airtable');

// Configuración de Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

// Función para normalizar ID de inspección
function normalizeInspectionId(id) {
  if (!id) return null;
  
  // Eliminar barras iniciales y espacios
  const rawId = id.toString()
    .replace(/^\/+/, '')
    .trim();
  
  // Estrategias de normalización
  const strategies = [
    // 1. Usar toda la cadena
    () => rawId,
    
    // 2. Extraer último segmento
    () => {
      const parts = rawId.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    }
  ];

  // Probar estrategias
  for (const strategy of strategies) {
    const cleanId = strategy();
    if (cleanId && cleanId.length > 0) {
      return cleanId;
    }
  }
  
  return null;
}

// Función para serializar datos de manera segura
function safeSerialize(data) {
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
    console.error('Error en serialización', error);
    return '{}';
  }
}

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET'
  };

  // Manejar preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Verificar método GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Extraer ID de inspección
    const inspectionId = normalizeInspectionId(
      event.queryStringParameters.inspectionId || 
      event.path.split('/').pop()
    );

    if (!inspectionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid Inspection ID',
          details: 'No valid inspection ID was provided'
        })
      };
    }

    // Configurar base de Airtable
    const base = new Airtable().base(process.env.AIRTABLE_BASE_ID);

    // Estrategias de búsqueda
    const searchStrategies = [
      // 1. Búsqueda exacta
      () => base(process.env.AIRTABLE_TABLE_NAME).select({
        filterByFormula: `{Inspection ID} = "${inspectionId}"`
      }).firstPage(),

      // 2. Búsqueda parcial
      () => base(process.env.AIRTABLE_TABLE_NAME).select({
        filterByFormula: `FIND("${inspectionId}", {Inspection ID}) > 0`
      }).firstPage(),

      // 3. Búsqueda por componentes
      () => {
        const parts = inspectionId.split('-');
        return Promise.all(
          parts.map(part => 
            base(process.env.AIRTABLE_TABLE_NAME).select({
              filterByFormula: `FIND("${part}", {Inspection ID}) > 0`
            }).firstPage()
          )
        ).then(results => results.flat());
      }
    ];

    // Ejecutar estrategias de búsqueda
    let records = null;
    for (const strategy of searchStrategies) {
      records = await strategy();
      if (records.length > 0) break;
    }

    // Manejar caso sin registros
    if (!records || records.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Inspection Not Found',
          details: `No records found for ID: ${inspectionId}`
        })
      };
    }

    // Procesar registros
    const firstRecord = records[0];
    const issues = records.map(record => ({
      section: record.get('Section'),
      damageType: record.get('Damage Type'),
      quantity: record.get('Quantity') || 0
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

    // Preparar datos de inspección
    const inspectionData = {
      inspectionId: firstRecord.get('Inspection ID'),
      property: firstRecord.get('Property'),
      cartNumber: firstRecord.get('Golf Cart Number'),
      date: firstRecord.get('Inspection Date'),
      guestName: firstRecord.get('Guest Name'),
      guestEmail: firstRecord.get('Guest Email'),
      guestPhone: firstRecord.get('Guest Phone'),
      observations: firstRecord.get('Preview observations by Guest'),
      sections,
      issues,
      signatureChecked: firstRecord.get('Signature Checked')
    };

    // Devolver respuesta
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: safeSerialize(inspectionData)
    };

  } catch (error) {
    console.error('Error en la búsqueda de inspección', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message || 'Unknown error'
      })
    };
  }
};

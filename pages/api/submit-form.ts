import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import AirtableLib from 'airtable';
import { format } from 'date-fns';

// Tipos de datos
interface FormData {
  property: string;
  cartNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  inspectionDate: string;
  pdfBase64: string;
  observations?: string;
  damageRecords?: Array<{
    section: string;
    damageType: string;
    quantity: number;
  }>;
  guestSignature?: string;
  previewObservationsByGuest?: string;
}

// Configuración de servicios con registro de errores
const initializeAirtable = () => {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    if (!apiKey || !baseId || !tableName) {
      throw new Error('Configuración de Airtable incompleta');
    }

    console.log('Inicializando Airtable:', { 
      baseId, 
      tableName, 
      apiKeyPresent: !!apiKey 
    });

    const airtable = new AirtableLib({ apiKey });
    const base = airtable.base(baseId);
    const table = base(tableName);

    return { table, base };
  } catch (error) {
    console.error('Error al inicializar Airtable:', error);
    throw error;
  }
};

const { table } = initializeAirtable();

// Función para enviar email con el PDF adjunto
async function sendInspectionEmail(data: FormData): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    
    console.log('Enviando correo electrónico para:', data.guestEmail);
    
    const pdfBuffer = Buffer.from(data.pdfBase64.replace(/^data:.*,/, ''), 'base64');
    
    const emailResponse = await resend.emails.send({
      from: 'Golf Cart Inspection <inspection@resend.dev>',
      to: [data.guestEmail],
      subject: `Golf Cart Inspection Report - Cart #${data.cartNumber}`,
      html: `
        <h2>Golf Cart Inspection Form</h2>
        <p>Dear ${data.guestName},</p>
        <p>Thank you for completing the golf cart inspection form. Please find the inspection document attached.</p>
        <p>Inspection Details:</p>
        <ul>
          <li>Property: ${data.property}</li>
          <li>Cart Number: ${data.cartNumber}</li>
          <li>Inspection Date: ${data.inspectionDate}</li>
        </ul>
        ${data.previewObservationsByGuest ? `<p>Guest Observations: ${data.previewObservationsByGuest}</p>` : ''}
        <p>Greetings,<br>Luxe Properties</p>
      `,
      attachments: [{
        filename: `golf-cart-inspection-${data.cartNumber}.pdf`,
        content: pdfBuffer
      }]
    });

    console.log('Email sending response:', emailResponse);
  } catch (emailError) {
    console.error('Error al enviar correo electrónico:', emailError);
    throw emailError;
  }
}

// Función de registro de errores de Airtable
const logAirtableError = (error: any) => {
  console.error('📋 Airtable Error Details:', {
    errorType: error.name || 'Unknown Error',
    errorMessage: error.message || 'No error message',
    statusCode: error.statusCode || 'N/A',
    errorDetails: {
      type: error.type,
      fields: error.fields,
      recordId: error.recordId
    },
    fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
  });
};

// Función de validación de campos de Airtable
const validateAirtableFields = (fields: Record<string, any>) => {
  const requiredFields = [
    'Inspection ID',
    'Property', 
    'Golf Cart Number', 
    'Inspection Date', 
    'Guest Name', 
    'Guest Email'
  ];

  const missingFields = requiredFields.filter(field => !fields[field]);

  if (missingFields.length > 0) {
    console.error('⚠️ Campos de Airtable faltantes:', missingFields);
    throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
  }

  // Validaciones adicionales
  if (fields['Guest Email'] && !isValidEmail(fields['Guest Email'])) {
    throw new Error('Formato de correo electrónico inválido');
  }
};

// Función de validación de email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Manejador de errores de Airtable
const handleAirtableError = (error: any) => {
  logAirtableError(error);

  switch (error.name) {
    case 'UNKNOWN_RECORD_FIELDS':
      return {
        statusCode: 400,
        mensaje: 'Campos no reconocidos por Airtable',
        detalles: error.fields
      };
    case 'INVALID_MULTIPLE_CHOICE_FIELD':
      return {
        statusCode: 400,
        mensaje: 'Valor inválido en campo de selección múltiple',
        detalles: error.fields
      };
    case 'RATE_LIMIT_EXCEEDED':
      return {
        statusCode: 429,
        mensaje: 'Límite de solicitudes de Airtable excedido',
        reintento: 'Por favor, espere e intente nuevamente'
      };
    default:
      return {
        statusCode: 500,
        mensaje: 'Error desconocido al guardar en Airtable',
        detalles: error.message
      };
  }
};

// Función de validación de Golf Cart Number
const validateGolfCartNumber = (cartNumber: any): number => {
  // Convertir explícitamente a número
  const parsedNumber = Number(cartNumber);

  // Verificar que sea un número válido
  if (isNaN(parsedNumber)) {
    throw new Error('Golf Cart Number must be a valid number');
  }

  // Verificar que sea un número positivo
  if (parsedNumber <= 0) {
    throw new Error('Golf Cart Number must be a positive number');
  }
  
  // Opcional: Límite máximo de número de carrito
  if (parsedNumber > 9999) {
    throw new Error('Golf Cart Number cannot exceed 9999');
  }
  
  return parsedNumber;
};

// Función para generar contenido de correo en inglés
const generarContenidoCorreo = (datosInspeccion: any) => {
  return `Golf Cart Inspection Form

Dear ${datosInspeccion['Guest Name']},

Thank you for completing the golf cart inspection form. Please find the inspection document attached.

Inspection Details:

Property: ${datosInspeccion['Property']}
Golf Cart Number: ${datosInspeccion['Golf Cart Number']}
Inspection Date: ${datosInspeccion['Inspection Date']}

Greetings,
Luxe Properties`;
};

// Manejador de API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();

  try {
    // Validar método de solicitud
    if (req.method !== 'POST') {
      console.warn('Método no permitido:', req.method);
      return res.status(405).json({ mensaje: 'Método no permitido' });
    }

    const data = req.body;

    console.log('🚀 Datos recibidos:', {
      property: data.property,
      cartNumber: data.cartNumber,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone, // Log específico de número telefónico
      inspectionDate: data.inspectionDate
    });

    // Validaciones de campos requeridos
    const requiredFields = [
      'property', 
      'cartNumber', 
      'guestName', 
      'guestEmail', 
      'inspectionDate'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        mensaje: 'Campos requeridos faltantes',
        detalles: missingFields
      });
    }

    // Validar Golf Cart Number
    const validatedCartNumber = validateGolfCartNumber(data.cartNumber);

    // Preparar campos para Airtable
    const camposAirtable: Record<string, any> = {
      'Inspection ID': `INSP-${Date.now()}`,
      'Property': data.property,
      'Golf Cart Number': validatedCartNumber,
      'Inspection Date': format(data.inspectionDate, 'yyyy-MM-dd'),
      'Guest Name': data.guestName,
      'Guest Email': data.guestEmail,
      'Guest Phone': data.guestPhone || '', // Siempre enviar teléfono
      'Golf Cart Signature Checked': false,
      'Golf Cart Inspection Send': false // Por defecto falso
    };

    // Campos opcionales con validación
    if (data.previewObservationsByGuest) {
      camposAirtable['Golf Cart Inspection Send'] = true; // Marcar como true si hay observaciones
    }

    // Asegurar envío de teléfono si está presente
    if (data.guestPhone && data.guestPhone.trim() !== '') {
      camposAirtable['Guest Phone'] = data.guestPhone.trim();
    }

    // Forzar envío de Golf Cart Inspection Send
    camposAirtable['Golf Cart Inspection Send'] = true;

    console.log('Campos para Airtable:', JSON.stringify(camposAirtable, null, 2));

    try {
      // Validar campos antes de enviar
      validateAirtableFields(camposAirtable);

      // Intentar crear registro en Airtable
      const registro = await table.create([{ fields: camposAirtable }]);

      if (!registro || registro.length === 0) {
        console.error('No se pudo crear el registro en Airtable');
        return res.status(500).json({ 
          mensaje: 'Error al crear registro en Airtable',
          detalles: 'Registro vacío o nulo'
        });
      }

      // Intentar enviar correo electrónico
      try {
        const contenidoCorreo = generarContenidoCorreo(camposAirtable);
        await sendInspectionEmail(data);
        await enviarCorreo({
          to: data.guestEmail,
          subject: 'Golf Cart Inspection - Luxe Properties',
          text: contenidoCorreo
        });
      } catch (emailError) {
        console.error('Error al enviar correo electrónico:', emailError);
        // No interrumpir el flujo principal
      }

      const tiempoTotal = Date.now() - startTime;
      console.log('Formulario enviado exitosamente en', tiempoTotal, 'ms');

      return res.status(200).json({
        mensaje: 'Formulario enviado exitosamente',
        idRegistroAirtable: registro[0].getId(),
        tiempoProcesamientoMs: tiempoTotal
      });

    } catch (airtableError) {
      const errorResponse = handleAirtableError(airtableError);
      
      return res.status(errorResponse.statusCode).json({
        mensaje: errorResponse.mensaje,
        detalles: errorResponse.detalles
      });
    }

  } catch (error) {
    const tiempoTotal = Date.now() - startTime;

    // Registro exhaustivo del error general
    console.error('Error detallado en el manejador:', {
      nombreError: error instanceof Error ? error.name : 'Error Desconocido',
      mensajeError: error instanceof Error ? error.message : 'Error desconocido',
      pilaError: error instanceof Error ? error.stack : 'Sin traza de pila'
    });

    return res.status(500).json({ 
      mensaje: error instanceof Error ? error.message : 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido',
      tiempoProcesamientoMs: tiempoTotal
    });
  }
}

// Configuración de API
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

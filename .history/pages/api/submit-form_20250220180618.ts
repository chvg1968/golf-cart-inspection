import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import AirtableLib from 'airtable';
import { format } from 'date-fns';
import { Attachment as AirtableAttachment } from 'airtable/lib/attachment';
import { FieldSet } from 'airtable/lib/field_set';
import { SendEmailResponse, ResendError } from 'resend/build/types';

// Función de utilidad para manejar variables de entorno
const getEnvVariable = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

// Función de utilidad para extraer detalles de error de manera exhaustiva
const extractErrorDetails = (error: unknown): Record<string, any> => {
  const errorDetails: Record<string, any> = {
    type: typeof error,
    message: 'Unknown error',
    name: 'UnknownError',
    stack: 'No stack trace available'
  };

  try {
    if (error instanceof Error) {
      errorDetails.message = error.message;
      errorDetails.name = error.name;
      errorDetails.stack = error.stack || 'No stack trace available';
    } else if (typeof error === 'string') {
      errorDetails.message = error;
    } else if (error && typeof error === 'object') {
      // Intentar extraer propiedades de objetos de error personalizados
      errorDetails.message = (error as any).message || JSON.stringify(error);
      errorDetails.name = (error as any).name || 'CustomError';
      errorDetails.details = JSON.stringify(error);
    }
  } catch (extractionError) {
    console.error('Error al extraer detalles de error:', extractionError);
  }

  return errorDetails;
};

// Función de utilidad para registrar errores de manera segura
const logError = (context: string, error: unknown) => {
  console.error(`❌ Error en ${context}:`, {
    errorType: typeof error,
    errorMessage: extractErrorDetails(error).message,
    fullError: error
  });
};

// Configuración de servicios con logs detallados
const resend = new Resend(getEnvVariable('RESEND_API_KEY'));

// Definir tipos para los campos de Airtable
interface AirtableFields extends FieldSet {
  [key: string]: string | number | boolean | AirtableAttachment[] | undefined;
  'Property'?: string;
  'Golf Cart Number'?: number | string;
  'Inspection Date'?: string;
  'Guest Name'?: string;
  'Guest Email'?: string;
  'Guest Phone'?: string;
  'Golf Cart Signature Checked'?: boolean;
  'PDF Attachment'?: AirtableAttachment[];
}

interface AirtableErrorType {
  name: string;
  message: string;
  type?: string;
  statusCode?: number;
}

const { table, base } = (() => {
  try {
    // Obtener variables de entorno de manera segura
    const apiKey = getEnvVariable('AIRTABLE_API_KEY');
    const baseId = getEnvVariable('AIRTABLE_BASE_ID');
    const tableName = getEnvVariable('AIRTABLE_TABLE_NAME');

    // Configuración de Airtable
    const airtable = new AirtableLib({ apiKey });
    const base = airtable.base(baseId);
    const table = base.table(tableName);

    console.log('🔐 Configuración de servicios:', {
      AIRTABLE_API_KEY: apiKey ? 'PRESENTE' : 'AUSENTE',
      AIRTABLE_BASE_ID: baseId ? 'PRESENTE' : 'AUSENTE',
      AIRTABLE_TABLE_NAME: tableName ? 'PRESENTE' : 'AUSENTE',
      RESEND_API_KEY: getEnvVariable('RESEND_API_KEY') ? 'PRESENTE' : 'AUSENTE'
    });

    if (!apiKey || !baseId || !tableName) {
      throw new Error('Configuración de Airtable incompleta');
    }

    return { table, base };
  } catch (error) {
    console.error('Error inicializando Airtable:', error);
    throw error;
  }
})();

// Función de utilidad para procesar PDF
const processPDF = (pdfData: string): Buffer | null => {
  try {
    if (!pdfData) {
      console.warn('⚠️ No PDF data provided');
      return null;
    }

    // Limpiar el string base64
    let cleanBase64 = pdfData;
    
    // Remover el encabezado Data URI si existe
    if (pdfData.includes('base64,')) {
      cleanBase64 = pdfData.split('base64,')[1];
    }

    // Validaciones adicionales de seguridad
    if (cleanBase64.length < 100) {
      console.error('❌ PDF data appears to be too short');
      return null;
    }

    // Eliminar cualquier carácter no base64
    cleanBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, '');

    // Convertir a Buffer
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // Validar que el buffer no esté vacío y tenga un tamaño razonable
    if (buffer.length === 0) {
      console.error('❌ Generated PDF buffer is empty');
      return null;
    }

    if (buffer.length > 10 * 1024 * 1024) { // Límite de 10MB
      console.error('❌ PDF exceeds maximum allowed size');
      return null;
    }

    // Verificación básica de firma PDF
    const pdfSignature = buffer.slice(0, 4).toString('ascii');
    if (pdfSignature !== '%PDF') {
      console.warn('⚠️ Generated file may not be a valid PDF');
    }

    console.log('✅ PDF processed successfully:', {
      originalLength: pdfData.length,
      cleanedLength: cleanBase64.length,
      bufferLength: buffer.length,
      pdfSignature
    });

    return buffer;
  } catch (error) {
    console.error('❌ Error processing PDF:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error
    });
    return null;
  }
};

// Función para crear un attachment completo
const createAirtableAttachment = (base64Pdf: string, cartNumber: string): AirtableAttachment => {
  const filename = `inspection_${cartNumber}_${Date.now()}.pdf`;
  const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
  
  return {
    id: '', // Airtable generará un ID único
    url: dataUrl,
    filename: filename,
    size: base64Pdf.length, // Tamaño aproximado
    type: 'application/pdf'
  };
};

// Función de mapeo de campos para Airtable
const mapToAirtableFields = (formData: any): AirtableFields => {
  try {
    console.log('🔍 Campos originales recibidos:', JSON.stringify(formData, null, 2));

    const airtableMapping: AirtableFields = {
      // Mapeo exacto de campos del formulario a nombres de columnas en Airtable
      'Property': formData.property,
      'Golf Cart Number': formData.cartNumber,
      'Inspection Date': formData.inspectionDate || new Date().toISOString(),
      'Guest Name': formData.guestName,
      'Guest Email': formData.guestEmail,
      'Guest Phone': formData.guestPhone || '',
      'Golf Cart Signature Checked': formData.guestSignature ? true : false
    };

    console.log('🗺️ Campos mapeados para Airtable:', JSON.stringify(airtableMapping, null, 2));

    // Filtrar campos no vacíos
    const filteredFields: AirtableFields = Object.fromEntries(
      Object.entries(airtableMapping)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );

    console.log('✅ Campos finales para Airtable:', JSON.stringify(filteredFields, null, 2));

    return filteredFields;
  } catch (error) {
    console.error('❌ Error en mapeo de campos:', error);
    throw error;
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const startTime = Date.now();
  console.log('🚀 Starting form submission handler');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const formData = req.body;
    
    // Log del PDF recibido
    console.log('📄 PDF Data received:', {
      hasPdfData: !!formData.pdfBase64,
      pdfDataLength: formData.pdfBase64?.length || 0,
      pdfDataStart: formData.pdfBase64?.substring(0, 50)
    });

    // Procesar PDF
    const pdfBuffer = processPDF(formData.pdfBase64);

    if (!pdfBuffer) {
      console.warn('⚠️ Continuing without PDF attachment');
    }

    // Crear el registro en Airtable
    try {
      // Mapear campos antes de crear el registro
      const airtableFields = mapToAirtableFields(formData);

      console.log('🌟 Intentando crear registro en Airtable con campos:', JSON.stringify(airtableFields, null, 2));

      // Depuración adicional: verificar configuración de Airtable
      console.log('🔧 Configuración de Airtable:', {
        baseId: process.env.AIRTABLE_BASE_ID,
        tableId: process.env.AIRTABLE_TABLE_NAME,
        apiKeyPresent: !!process.env.AIRTABLE_API_KEY
      });

      // Añadir manejo de errores más detallado
      try {
        // Preparar campos para Airtable
        const recordFields: AirtableFields = { ...airtableFields };

        // Agregar PDF si está presente
        if (pdfBuffer) {
          recordFields['PDF Attachment'] = [
            createAirtableAttachment(
              pdfBuffer.toString('base64'), 
              formData.cartNumber
            )
          ];
        }

        // Crear registro usando el método correcto
        const record = await new Promise<AirtableLib.Record<AirtableFields>>((resolve, reject) => {
          table.create(recordFields, (err: AirtableErrorType | null, record) => {
            if (err) {
              console.error('❌ Airtable Create Error:', {
                name: err.name,
                message: err.message,
                type: err.type,
                statusCode: err.statusCode
              });
              reject(err);
            } else {
              resolve(record as AirtableLib.Record<AirtableFields>);
            }
          });
        });

        console.log('✅ Airtable record created:', record.id);

        // Enviar el email
        try {
          const emailAttachments = pdfBuffer ? [{
            filename: `golf-cart-inspection-${formData.cartNumber}.pdf`,
            content: pdfBuffer
          }] : [];

          const emailResponse = await resend.emails.send({
            from: 'Luxe Properties <noreply@luxeproperties.com>',
            to: formData.guestEmail,
            subject: `Golf Cart Inspection Report - Cart #${formData.cartNumber}`,
            html: `
              <h2>Golf Cart Inspection Form</h2>
              <p>Dear ${formData.guestName},</p>
              <p>Thank you for completing the golf cart inspection form.</p>
              <p>Inspection Details:</p>
              <ul>
                <li>Property: ${formData.property}</li>
                <li>Cart Number: ${formData.cartNumber}</li>
                <li>Inspection Date: ${formData.inspectionDate || new Date().toISOString()}</li>
              </ul>
              <p>Please review the attached PDF.</p>
              <p>Best regards,<br>Luxe Properties</p>
            `,
            attachments: emailAttachments
          });

          console.log('✅ Email sent successfully:', {
            emailId: emailResponse.data?.id,
          });

          return res.status(200).json({
            success: true,
            recordId: record.id,
            emailId: emailResponse.data?.id,
            processingTime: Date.now() - startTime
          });

        } catch (emailError) {
          console.error('❌ Error sending email:', emailError);
          
          return res.status(200).json({
            success: true,
            recordId: record.id,
            emailError: emailError instanceof Error ? emailError.message : 'Unknown email error',
            processingTime: Date.now() - startTime
          });
        }

      } catch (airtableCreateError) {
        console.error('❌ Error específico al crear registro:', {
          errorName: airtableCreateError instanceof Error ? airtableCreateError.name : 'Unknown Error',
          errorMessage: airtableCreateError instanceof Error ? airtableCreateError.message : 'Unknown error',
          errorType: typeof airtableCreateError,
          errorStack: airtableCreateError instanceof Error ? airtableCreateError.stack : 'No stack trace',
          errorDetails: JSON.stringify(airtableCreateError, Object.getOwnPropertyNames(airtableCreateError), 2)
        });

        return res.status(500).json({
          success: false,
          message: 'Error creating Airtable record',
          error: airtableCreateError instanceof Error ? airtableCreateError.message : 'Unknown error',
          errorDetails: airtableCreateError instanceof Error 
            ? JSON.stringify(airtableCreateError, Object.getOwnPropertyNames(airtableCreateError)) 
            : null
        });
      }

    } catch (airtableError) {
      console.error('❌ Error general de Airtable:', airtableError);
      return res.status(500).json({
        success: false,
        message: 'Error preparing Airtable record',
        error: airtableError instanceof Error ? airtableError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('❌ Unhandled error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export default handler;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Aumentar límite de tamaño
    }
  }
};

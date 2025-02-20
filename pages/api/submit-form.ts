import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import AirtableLib from 'airtable';
import { format } from 'date-fns';

// Configuración de servicios con logs detallados
const resend = new Resend(process.env.RESEND_API_KEY);

const { table } = (() => {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    console.log('🔐 Configuración de servicios:', {
      AIRTABLE_API_KEY: apiKey ? 'PRESENTE' : 'AUSENTE',
      AIRTABLE_BASE_ID: baseId ? 'PRESENTE' : 'AUSENTE',
      AIRTABLE_TABLE_NAME: tableName ? 'PRESENTE' : 'AUSENTE',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'PRESENTE' : 'AUSENTE'
    });

    if (!apiKey || !baseId || !tableName) {
      throw new Error('Configuración de Airtable incompleta');
    }

    const airtable = new AirtableLib({ apiKey });
    const base = airtable.base(baseId);
    const table = base(tableName);

    return { table, base };
  } catch (error) {
    console.error('❌ Error al inicializar servicios:', error);
    throw error;
  }
})();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const startTime = Date.now();
  console.log('🚀 Solicitud recibida:', {
    method: req.method,
    body: JSON.stringify(req.body, null, 2)
  });

  try {
    if (req.method !== 'POST') {
      console.warn('❌ Método no permitido:', req.method);
      return res.status(405).json({ mensaje: 'Método no permitido' });
    }

    const data = req.body;

    // Validación exhaustiva de datos
    const requiredFields = [
      'property', 
      'cartNumber', 
      'guestName', 
      'guestEmail', 
      'inspectionDate'
    ];

    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      console.error('❌ Campos requeridos faltantes:', missingFields);
      return res.status(400).json({
        mensaje: 'Campos requeridos faltantes',
        detalles: missingFields
      });
    }

    // Validar Golf Cart Number
    const validatedCartNumber = data.cartNumber;

    // Preparar campos para Airtable con logs detallados
    const camposAirtable = {
      'Inspection ID': `INSP-${Date.now()}`,
      'Property': data.property,
      'Golf Cart Number': validatedCartNumber,
      'Inspection Date': format(new Date(data.inspectionDate), 'yyyy-MM-dd'),
      'Guest Name': data.guestName,
      'Guest Email': data.guestEmail,
      'Guest Phone': data.guestPhone || '',
      'Golf Cart Signature Checked': false,
      'Golf Cart Inspection Send': true
    };

    console.log('📋 Campos para Airtable:', JSON.stringify(camposAirtable, null, 2));

    // Decodificar PDF base64
    let pdfBuffer: Buffer | null = null;
    if (data.pdfBase64) {
      try {
        const base64Data = data.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
        pdfBuffer = Buffer.from(base64Data, 'base64');
        
        console.log('📄 PDF Buffer:', {
          length: pdfBuffer.length,
          isValid: pdfBuffer.length > 0
        });
      } catch (pdfError) {
        console.error('❌ Error al procesar PDF:', pdfError);
      }
    }

    // Crear registro en Airtable
    const registro = await table.create([{ fields: camposAirtable }]);

    if (!registro || registro.length === 0) {
      console.error('❌ No se pudo crear el registro en Airtable');
      return res.status(500).json({ 
        mensaje: 'Error al crear registro en Airtable',
        detalles: 'Registro vacío o nulo'
      });
    }

    // Enviar correo electrónico
    try {
      const emailResponse = await resend.emails.send({
        from: 'Golf Cart Inspection <inspection@resend.dev>',
        to: [data.guestEmail],
        subject: `Golf Cart Inspection Report - Cart #${data.cartNumber}`,
        html: `
          <h2>Golf Cart Inspection Form</h2>
          <p>Dear ${data.guestName},</p>
          <p>Thank you for completing the golf cart inspection form.</p>
          <p>Inspection Details:</p>
          <ul>
            <li>Property: ${data.property}</li>
            <li>Cart Number: ${data.cartNumber}</li>
            <li>Inspection Date: ${data.inspectionDate}</li>
          </ul>
          ${data.previewObservationsByGuest ? `<p>Guest Observations: ${data.previewObservationsByGuest}</p>` : ''}
          <p>Greetings,<br>Luxe Properties</p>
        `,
        attachments: pdfBuffer ? [{
          filename: `golf-cart-inspection-${data.cartNumber}.pdf`,
          content: pdfBuffer
        }] : []
      });

      console.log('📧 Respuesta de envío de correo:', emailResponse);
    } catch (emailError) {
      console.error('❌ Error al enviar correo electrónico:', emailError);
    }

    const tiempoTotal = Date.now() - startTime;
    console.log('✅ Formulario enviado exitosamente en', tiempoTotal, 'ms');

    return res.status(200).json({
      mensaje: 'Formulario enviado exitosamente',
      inspectionId: camposAirtable['Inspection ID'],
      tiempoProcesamientoMs: tiempoTotal
    });

  } catch (error) {
    const tiempoTotal = Date.now() - startTime;
    console.error('❌ Error global:', {
      mensaje: error.message,
      pila: error.stack,
      tiempoProcesamientoMs: tiempoTotal
    });

    return res.status(500).json({
      mensaje: 'Error interno del servidor',
      detalles: error.message
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

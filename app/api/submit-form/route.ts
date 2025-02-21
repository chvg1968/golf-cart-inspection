import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import AirtableLib, { FieldSet, Attachment, Record as AirtableRecord } from 'airtable';
import { 
  GolfCartFormData,
  AirtableFields
} from '../../../components/form';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar variables de entorno
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

    if (!RESEND_API_KEY) {
      throw new Error('Resend API key is not configured');
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      throw new Error('Airtable configuration is incomplete');
    }

    const formData: GolfCartFormData = await req.json();
    const resend = new Resend(RESEND_API_KEY);
    const base = new AirtableLib({ apiKey: AIRTABLE_API_KEY })
      .base(AIRTABLE_BASE_ID);
    const table = base(AIRTABLE_TABLE_NAME);

    // Generar Inspection ID único
    const inspectionId = uuidv4();

    // Asegurar que cartNumber sea un número
    const cartNumber = typeof formData.cartNumber === 'string'
      ? parseInt(formData.cartNumber, 10)
      : formData.cartNumber;

    // Validar que sea un número válido
    if (isNaN(cartNumber)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid cart number'
      }, { status: 400 });
    }

    // Formatear registros de daños como string para referencia
    const damageRecordsString = formData.damageRecords && formData.damageRecords.length > 0
      ? formData.damageRecords.map(record => 
          `Section: ${record.section}, Type: ${record.damageType}, Quantity: ${record.quantity}`
        ).join(' | ')
      : '';

    // Separar el PDF de los datos de Airtable
    const { pdfBase64, ...airtableData } = formData;

    // Crear registro en Airtable sin el PDF
    const airtableRecord = mapFormDataToAirtable(airtableData);

    let recordId = null;
    try {
      const record = await table.create(airtableRecord);
      recordId = record.id;
      console.log('Airtable Record Created:', recordId);
    } catch (airtableError) {
      console.error('Airtable Creation Error:', airtableError);
      throw new Error('Failed to create Airtable record');
    }

    // Diagnóstico detallado de PDF
    console.log('PDF Base64 Debugging:', {
      pdfOriginal: pdfBase64 ? pdfBase64.substring(0, 100) + '...' : 'No PDF',
      pdfOriginalLength: pdfBase64 ? pdfBase64.length : 0,
      pdfOriginalType: pdfBase64 ? pdfBase64.split(',')[0] : 'N/A'
    });

    // Preparar datos para email
    const pdfBase64Clean = pdfBase64 
      ? pdfBase64.split(',')[1] // Obtener solo la parte base64
      : null;

    console.log('PDF Base64 Clean Debugging:', {
      pdfClean: pdfBase64Clean ? pdfBase64Clean.substring(0, 100) + '...' : 'No Clean PDF',
      pdfCleanLength: pdfBase64Clean ? pdfBase64Clean.length : 0
    });

    const emailPayload = {
      from: 'noreply@resend.dev',
      to: formData.guestEmail,
      subject: `Golf Cart Inspection Report - Cart #${cartNumber}`,
      html: `
        <h2>Golf Cart Inspection Form</h2>
        <p>Dear ${formData.guestName},</p>
        <p>Thank you for completing the golf cart inspection form.</p>
        <p>Inspection Details:</p>
        <ul>
          <li>Inspection ID: ${inspectionId}</li>
          <li>Property: ${formData.property}</li>
          <li>Cart Number: ${cartNumber}</li>
          <li>Inspection Date: ${formData.inspectionDate || new Date().toISOString().split('T')[0]}</li>
        </ul>
        ${formData.damageRecords && formData.damageRecords.length > 0 ? `
          <h3>Damage Records:</h3>
          <ul>
            ${formData.damageRecords.map(record => 
              `<li>${record.section}: ${record.damageType} (Qty: ${record.quantity})</li>`
            ).join('')}
          </ul>
        ` : ''}
        ${formData.previewObservationsByGuest ? `
          <h3>Guest Observations:</h3>
          <p>${formData.previewObservationsByGuest}</p>
        ` : ''}
        ${pdfBase64 ? `
          <p>Please review the attached PDF.</p>
        ` : ''}
        <p>Best regards,<br>Luxe Properties Inspection Team</p>
      `,
      attachments: pdfBase64Clean ? [
        {
          filename: `golf-cart-inspection-${cartNumber}-${inspectionId}.pdf`,
          content: Buffer.from(pdfBase64Clean, 'base64'),
          contentType: 'application/pdf'
        }
      ] : []
    };

    // Log de estado final de adjuntos
    console.log('Email Attachments Debugging:', {
      hasAttachments: !!emailPayload.attachments.length,
      attachmentFilename: emailPayload.attachments.length ? emailPayload.attachments[0].filename : 'N/A',
      attachmentSize: emailPayload.attachments.length ? emailPayload.attachments[0].content.length : 0
    });

    let emailResponse = null;
    try {
      // Enviar email
      emailResponse = await resend.emails.send(emailPayload);

      // Log de respuesta de correo
      console.log('Email Response:', JSON.stringify(emailResponse, null, 2));

      // Verificar campos obligatorios
      if (!emailPayload.to) {
        throw new Error('Email destinatario es obligatorio');
      }
      if (!emailPayload.from) {
        throw new Error('Email remitente es obligatorio');
      }
      if (!emailPayload.subject) {
        throw new Error('Asunto del correo es obligatorio');
      }
    } catch (emailError) {
      // Log detallado de errores de correo
      console.error('Email Send Error:', emailError);
      
      // No lanzar error para permitir que la solicitud continúe
      console.warn('Email could not be sent, but form submission will proceed');
    }

    // Actualizar registro para marcar como enviado
    await new Promise<void>((resolve, reject) => {
      table.update(recordId, {
        'Golf Cart Inspection Send': true
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return NextResponse.json({
      success: true,
      recordId: recordId,
      inspectionId: inspectionId,
      emailId: emailResponse?.data?.id || null,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function mapFormDataToAirtable(formData: GolfCartFormData): Partial<FieldSet> {
  return {
    'Inspection ID': uuidv4(),
    'Property': formData.property,
    'Golf Cart Number': formData.cartNumber,
    'Inspection Date': formData.inspectionDate || new Date().toISOString().split('T')[0],
    'Guest Name': formData.guestName,
    'Guest Email': formData.guestEmail,
    'Guest Phone': formData.guestPhone || '',
    'Golf Cart Inspection Send': false
  };
}

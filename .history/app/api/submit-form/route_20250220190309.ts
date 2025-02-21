import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import AirtableLib, { FieldSet, Attachment, Record as AirtableRecord } from 'airtable';
import { 
  GolfCartFormData,
  AirtableFields
} from '../../../components/form';

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

    // Preparar campos para Airtable - usar nombres exactos
    const airtableFields: Partial<FieldSet> = {
      'Property': formData.property,
      'Golf Cart Number': cartNumber,
      'Inspection Date': formData.inspectionDate || new Date().toISOString().split('T')[0],
      'Guest Name': formData.guestName,
      'Guest Email': formData.guestEmail,
      'Guest Phone': formData.guestPhone || '',
      'Golf Cart Inspection Send': false  // Inicialmente false
    };

    // Agregar PDF si está presente
    if (formData.pdfBase64) {
      // Convertir base64 a Attachment
      const pdfAttachment: Attachment[] = [{
        id: '',  // Airtable generará un ID
        url: formData.pdfBase64,
        filename: `golf-cart-inspection-${cartNumber}-${new Date().toISOString().split('T')[0]}.pdf`,
        size: Buffer.from(formData.pdfBase64.split(',')[1], 'base64').length,
        type: 'application/pdf'
      }];
      // Comentado hasta confirmar si hay un campo para PDF
      // airtableFields['PDF Attachment'] = pdfAttachment;
    }

    // Crear registro en Airtable
    const record = await new Promise<AirtableRecord<Partial<FieldSet>> | null>((resolve, reject) => {
      table.create(airtableFields, (err, record) => {
        if (err) reject(err);
        else resolve(record || null);
      });
    });

    // Verificar si el registro se creó correctamente
    if (!record) {
      throw new Error('Failed to create Airtable record');
    }

    // Preparar datos para email
    const emailPayload = {
      from: 'Luxe Properties <noreply@luxeproperties.com>',
      to: formData.guestEmail,
      subject: `Golf Cart Inspection Report - Cart #${cartNumber}`,
      html: `
        <h2>Golf Cart Inspection Form</h2>
        <p>Dear ${formData.guestName},</p>
        <p>Thank you for completing the golf cart inspection form.</p>
        <p>Inspection Details:</p>
        <ul>
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
        <p>Please review the attached PDF.</p>
        <p>Best regards,<br>Luxe Properties</p>
      `,
      attachments: formData.pdfBase64 ? [{
        filename: `golf-cart-inspection-${cartNumber}.pdf`,
        content: Buffer.from(formData.pdfBase64.split(',')[1], 'base64')
      }] : []
    };

    // Enviar email
    const emailResponse = await resend.emails.send(emailPayload);

    // Actualizar registro para marcar como enviado
    await new Promise<void>((resolve, reject) => {
      table.update(record.id, {
        'Golf Cart Inspection Send': "true"
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return NextResponse.json({
      success: true,
      recordId: record.id,
      emailId: emailResponse.data?.id,
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

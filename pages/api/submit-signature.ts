import type { NextApiRequest, NextApiResponse } from 'next';
import AirtableLib from 'airtable';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { inspectionId, signatureImage } = req.body;

  if (!inspectionId || !signatureImage) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    // Configurar Airtable
    const base = new AirtableLib({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID || '');

    // Buscar registros con este ID de inspección
    const records = await base(process.env.AIRTABLE_TABLE_NAME || '').select({
      filterByFormula: `{Inspection ID} = "${inspectionId}"`
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Inspección no encontrada' });
    }

    const firstRecord = records[0];
    const guestEmail = firstRecord.get('Guest Email') as string;
    const guestName = firstRecord.get('Guest Name') as string;
    const cartNumber = firstRecord.get('Golf Cart Number') as string;
    const property = firstRecord.get('Property') as string;

    // Actualizar registro con firma
    await base(process.env.AIRTABLE_TABLE_NAME || '').update([
      {
        id: firstRecord.id,
        fields: {
          'Signature Image': signatureImage,
          'Signature Status': 'Signed'
        }
      }
    ]);

    // Enviar correo de confirmación
    await resend.emails.send({
      from: 'Golf Cart Inspection <onboarding@resend.dev>',
      to: guestEmail,
      subject: 'Firma de Inspección Confirmada',
      html: `
        <html>
          <body>
            <h1>Firma de Inspección Confirmada</h1>
            <p>Estimado/a ${guestName},</p>
            <p>Su firma para la inspección del carrito de golf #${cartNumber} en ${property} ha sido recibida y confirmada.</p>
            <p>Gracias por su colaboración.</p>
            <p>Atentamente,<br>Equipo de Inspección de Carritos de Golf</p>
          </body>
        </html>
      `
    });

    res.status(200).json({ 
      message: 'Firma guardada exitosamente',
      inspectionId 
    });
  } catch (error) {
    console.error('Error guardando firma:', error);
    res.status(500).json({ 
      error: 'Error al guardar la firma',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

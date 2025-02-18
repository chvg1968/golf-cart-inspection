import type { NextApiRequest, NextApiResponse } from 'next';
import AirtableLib from 'airtable';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { inspectionId, signatureImage } = req.body;

  if (!inspectionId || !signatureImage) {
    return res.status(400).json({ error: 'Incomplete Data' });
  }

  try {
    // Configure Airtable
    const base = new AirtableLib({
      apiKey: process.env.AIRTABLE_API_KEY,
    }).base(process.env.AIRTABLE_BASE_ID || '');

    // Find records with this inspection ID
    const records = await base(process.env.AIRTABLE_TABLE_NAME || '').select({
      filterByFormula: `{Inspection ID} = "${inspectionId}"`
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Inspection Not Found' });
    }

    const firstRecord = records[0];
    const guestEmail = firstRecord.get('Guest Email') as string;
    const guestName = firstRecord.get('Guest Name') as string;
    const cartNumber = firstRecord.get('Golf Cart Number') as string;
    const property = firstRecord.get('Property') as string;

    // Signature link
    const signatureLink = `${process.env.NEXT_PUBLIC_APP_URL}/signature/${inspectionId}`;

    // Update record with signature
    await base(process.env.AIRTABLE_TABLE_NAME || '').update([
      {
        id: firstRecord.id,
        fields: {
          'Signature Image': signatureImage,
          'Signature Status': 'Signed'
        }
      }
    ]);

    // Send confirmation email
    await resend.emails.send({
      from: 'Golf Cart Inspection <noreply@golfcartinsp.com>',
      to: guestEmail,
      subject: 'Signature Required for Inspection',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Signature Required</h1>
            <p>Dear ${guestName},</p>
            <p>We need your signature for the golf cart inspection of Cart #${cartNumber} at ${property}.</p>
            <a href="${signatureLink}" style="
              display: inline-block; 
              padding: 10px 20px; 
              background-color: #007bff; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 15px 0;
            ">Sign Inspection</a>
            <p>If the button doesn't work, please copy and paste this link in your browser:</p>
            <p>${signatureLink}</p>
            <p>Best regards,<br>Golf Cart Inspection Team</p>
          </body>
        </html>
      `
    });

    res.status(200).json({ 
      message: 'Signature saved successfully',
      inspectionId 
    });
  } catch (error) {
    console.error('Error saving signature:', error);
    res.status(500).json({ 
      error: 'Error saving signature',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

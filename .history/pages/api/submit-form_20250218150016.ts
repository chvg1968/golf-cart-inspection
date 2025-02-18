import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import path from 'path';
import AirtableLib from 'airtable';
import { v4 as uuidv4 } from 'uuid';

// Types
type DamageRecord = {
  Section: string;
  'Damage Type': string;
  Quantity: number;
};

// Environment validation
const requiredEnvVars = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TABLE_NAME',
  'EMAIL_USER',
  'EMAIL_PASS',
  'NEXT_PUBLIC_APP_URL'
] as const;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`${varName} is not set`);
  }
});

// Services setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: true }
});

const airtable = new AirtableLib({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID!);
const table = base(process.env.AIRTABLE_TABLE_NAME!);

// Utility functions
const createDamageRecords = (side: string, damages: any): DamageRecord[] => {
  const records: DamageRecord[] = [];
  const damageTypes = ['scratches', 'missingParts', 'damageBumps'];
  
  damageTypes.forEach(type => {
    if (damages[type] > 0) {
      records.push({
        'Section': side,
        'Damage Type': type.replace(/([A-Z])/g, ' $1').trim(),
        'Quantity': damages[type]
      });
    }
  });
  
  return records;
};

const generatePDF = async (data: any): Promise<string> => {
  const pdfPath = path.join('/tmp', `inspection_${Date.now()}.pdf`);
  const doc = new PDFDocument();
  const stream = createWriteStream(pdfPath);
  
  return new Promise((resolve, reject) => {
    doc.pipe(stream);
    
    // Add content to PDF
    doc.fontSize(20).text('Golf Cart Inspection Report', { align: 'center' });
    doc.moveDown();
    
    // Basic information
    const basicInfo = [
      ['Property', data.property],
      ['Cart Number', data.cartNumber],
      ['Guest Name', data.guestName],
      ['Guest Email', data.guestEmail],
      ['Guest Phone', data.guestPhone]
    ];
    
    basicInfo.forEach(([label, value]) => {
      doc.fontSize(12).text(`${label}: ${value ?? 'N/A'}`);
    });
    
    // Damage information
    doc.moveDown().fontSize(14).text('Damage Report');
    
    ['frontLeftSide', 'frontRightSide'].forEach(side => {
      doc.fontSize(12).text(`\n${side.replace(/([A-Z])/g, ' $1').trim()}:`);
      Object.entries(data[side] || {}).forEach(([type, value]) => {
        if (typeof value === 'number' && value > 0) {
          doc.text(`  ${type}: ${value}`);
        }
      });
    });
    
    // Client information
    if (data.observations) {
      doc.moveDown().text(`Observations: ${data.observations}`);
    }
    
    if (data.clientSignature) {
      doc.moveDown().text('Client Signature:');
      doc.image(data.clientSignature, { width: 200 });
    }
    
    doc.end();
    
    stream.on('finish', () => resolve(pdfPath));
    stream.on('error', reject);
  });
};

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let mainRecord: any = null;

  try {
    const {
      property,
      cartNumber,
      guestName,
      guestEmail,
      guestPhone,
      frontLeftSide,
      frontRightSide,
      observations,
      termsAccepted,
      clientSignature,
      isClientView
    } = req.body;

    // Initial validation
    if (!property || !cartNumber || !guestName || !guestEmail) {
      return res.status(400).json({
        message: 'Missing required fields',
        errors: ['property', 'cartNumber', 'guestName', 'guestEmail']
          .filter(field => !req.body[field])
          .map(field => `${field} is required`)
      });
    }

    // Handle initial inspection submission
    if (!isClientView) {
      const signatureToken = uuidv4();
      const inspectionDate = new Date().toISOString().split('T')[0];

      // Create main record
      mainRecord = await table.create([{
        fields: {
          'Property': property,
          'Golf Cart Number': cartNumber,
          'Inspection Date': inspectionDate,
          'Guest Name': guestName,
          'Guest Email': guestEmail,
          'Guest Phone': guestPhone || '',
          'Signature Checked': false,
          'Inspection ID': signatureToken
        }
      }]);

      // Create damage records
      const damageRecords = [
        ...createDamageRecords('Front Left', frontLeftSide),
        ...createDamageRecords('Front Right', frontRightSide)
      ];

      if (damageRecords.length > 0) {
        await Promise.all(damageRecords.map(record => 
          table.create([{
            fields: {
              ...record,
              'Inspection ID': signatureToken
            }
          }])
        ));
      }

      // Send email to client
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: guestEmail,
        subject: 'Golf Cart Inspection - Signature Required',
        html: `
          <h1>Golf Cart Inspection</h1>
          <p>Please review and complete the inspection form by clicking the link below:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/signature/${signatureToken}">
            Complete Inspection
          </a>
        `
      });

      return res.status(200).json({
        message: 'Initial inspection saved',
        signatureToken
      });
    }

    // Handle client completion
    else {
      if (!termsAccepted || !clientSignature) {
        return res.status(400).json({
          message: 'Terms acceptance and signature are required',
          errors: [
            !termsAccepted && 'Terms must be accepted',
            !clientSignature && 'Signature is required'
          ].filter(Boolean)
        });
      }

      // Generate PDF
      const pdfPath = await generatePDF({
        property,
        cartNumber,
        guestName,
        guestEmail,
        guestPhone,
        frontLeftSide,
        frontRightSide,
        observations,
        clientSignature
      });

      // Update Airtable record
      if (!mainRecord) {
        // If mainRecord is not available, try to find the record by inspection details
        const existingRecords = await table.select({
          filterByFormula: `AND(
            {Guest Name} = '${guestName}', 
            {Guest Email} = '${guestEmail}', 
            {Golf Cart Number} = '${cartNumber}'
          )`
        }).firstPage();

        if (existingRecords.length > 0) {
          mainRecord = existingRecords[0];
        } else {
          throw new Error('No matching inspection record found');
        }
      }

      await table.update([{
        id: mainRecord.id,
        fields: {
          'Signature Checked': true,
          'Preview observations by Guest': observations || '',
          'PDF Path': pdfPath
        }
      }]);

      // Send final email with PDF
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: guestEmail,
        subject: 'Golf Cart Inspection - Completed',
        text: `Hello ${guestName}, attached is your completed inspection form.`,
        attachments: [{
          filename: 'inspection.pdf',
          path: pdfPath
        }]
      });

      return res.status(200).json({
        message: 'Inspection completed successfully'
      });
    }
  } catch (error) {
    console.error('Error processing inspection:', error);
    return res.status(500).json({
      message: 'Error processing inspection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// API configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

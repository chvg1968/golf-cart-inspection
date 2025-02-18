import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';
import { createWriteStream } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import AirtableLib from 'airtable';

// Tipos para SendGrid
interface SendGridMailData {
  to: string;
  from: { 
    email: string; 
    name?: string; 
  };
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

// Tipos
type DamageRecord = {
  Section: string;
  'Damage Type': string;
  Quantity: number;
};

// Configuración de variables de entorno
const REQUIRED_ENV_VARS = [
  'SENDGRID_API_KEY',
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'AIRTABLE_TABLE_NAME',
  'NEXT_PUBLIC_APP_URL'
] as const;

// Verificar variables de entorno
REQUIRED_ENV_VARS.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Configuración de Airtable
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

const generatePreviewHTML = (data: any, previewLink: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Golf Cart Inspection Preview</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .preview-container { background-color: #f4f4f4; padding: 20px; border-radius: 8px; }
        .preview-section { margin-bottom: 15px; }
        .preview-label { font-weight: bold; color: #333; }
        .preview-value { color: #666; }
        .preview-link { 
            display: block; 
            background-color: #007bff; 
            color: white; 
            text-decoration: none; 
            padding: 10px; 
            text-align: center; 
            border-radius: 5px; 
            margin-top: 20px; 
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <h2>Golf Cart Inspection Preview</h2>
        
        <div class="preview-section">
            <span class="preview-label">Property:</span>
            <span class="preview-value">${data.property}</span>
        </div>
        
        <div class="preview-section">
            <span class="preview-label">Cart Number:</span>
            <span class="preview-value">${data.cartNumber}</span>
        </div>
        
        <div class="preview-section">
            <span class="preview-label">Guest Name:</span>
            <span class="preview-value">${data.guestName}</span>
        </div>
        
        <div class="preview-section">
            <span class="preview-label">Guest Email:</span>
            <span class="preview-value">${data.guestEmail}</span>
        </div>
        
        <div class="preview-section">
            <span class="preview-label">Guest Phone:</span>
            <span class="preview-value">${data.guestPhone || 'N/A'}</span>
        </div>
        
        <div class="preview-section">
            <h3>Damage Report</h3>
            <div class="preview-section">
                <span class="preview-label">Front Left Side:</span>
                <div>
                    <span>Scratches: ${data.frontLeftSide?.scratches || 0}</span><br>
                    <span>Missing Parts: ${data.frontLeftSide?.missingParts || 0}</span><br>
                    <span>Damage Bumps: ${data.frontLeftSide?.damageBumps || 0}</span>
                </div>
            </div>
            <div class="preview-section">
                <span class="preview-label">Front Right Side:</span>
                <div>
                    <span>Scratches: ${data.frontRightSide?.scratches || 0}</span><br>
                    <span>Missing Parts: ${data.frontRightSide?.missingParts || 0}</span><br>
                    <span>Damage Bumps: ${data.frontRightSide?.damageBumps || 0}</span>
                </div>
            </div>
        </div>
        
        <a href="${previewLink}" class="preview-link">Complete Inspection Form</a>
    </div>
</body>
</html>
`;

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
      const previewLink = `${process.env.NEXT_PUBLIC_APP_URL}/signature/${signatureToken}`;
      try {
        const msg: SendGridMailData = {
          to: guestEmail,
          from: {
            email: 'inspections@golfcartinsp.netlify.app',
            name: 'Golf Cart Inspection'
          },
          subject: 'Golf Cart Inspection - Preview and Signature Required',
          html: generatePreviewHTML(req.body, previewLink)
        };

        await sgMail.send(msg);
        console.log('Email sent successfully to', guestEmail);

      } catch (emailError) {
        console.error('SendGrid Email Error:', {
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          stack: emailError instanceof Error ? emailError.stack : 'No stack trace',
          emailDetails: {
            to: guestEmail
          }
        });

        // Opcional: Enviar respuesta sin bloquear si el correo falla
        return res.status(206).json({ 
          message: 'Inspección guardada, pero hubo un problema enviando el correo',
          signatureToken: signatureToken,
          previewLink: previewLink,
          emailError: emailError instanceof Error ? emailError.message : 'Error desconocido'
        });
      }

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
      try {
        const msg: SendGridMailData = {
          to: guestEmail,
          from: {
            email: 'inspections@golfcartinsp.netlify.app',
            name: 'Golf Cart Inspection'
          },
          subject: 'Golf Cart Inspection - Completed',
          text: `Hello ${guestName}, attached is your completed inspection form.`,
          attachments: [{
            filename: 'inspection.pdf',
            path: pdfPath
          }]
        };

        await sgMail.send(msg);
        console.log('Email sent successfully to', guestEmail);

      } catch (emailError) {
        console.error('SendGrid Email Error:', {
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          stack: emailError instanceof Error ? emailError.stack : 'No stack trace',
          emailDetails: {
            to: guestEmail
          }
        });

        // Opcional: Enviar respuesta sin bloquear si el correo falla
        return res.status(206).json({ 
          message: 'Inspección guardada, pero hubo un problema enviando el correo',
          emailError: emailError instanceof Error ? emailError.message : 'Error desconocido'
        });
      }

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

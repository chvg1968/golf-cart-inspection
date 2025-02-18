import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import * as ResendImport from 'resend';
import { createWriteStream } from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import AirtableLib from 'airtable';

// Tipos para Resend
interface ResendMailData {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// Tipos
type DamageRecord = {
  Section: string;
  'Damage Type': string;
  Quantity: number;
};

// Configuración de variables de entorno
const REQUIRED_ENV_VARS = [
  'RESEND_API_KEY',
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

function generatePreviewHTML(data: any, previewLink: string) {
  return `
    <html>
      <body>
        <h1>Golf Cart Inspection Preview</h1>
        <p>Hello ${data.guestName},</p>
        <p>An inspection has been recorded for Golf Cart #${data.cartNumber} at ${data.property}.</p>
        <p>Please review and sign the inspection report at:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/signature/${data.inspectionId}">View Inspection Report</a>
        <p>Inspection Details:</p>
        <ul>
          <li>Date: ${data.inspectionDate}</li>
          <li>Cart Number: ${data.cartNumber}</li>
          <li>Property: ${data.property}</li>
        </ul>
        <p>Thank you,<br>Golf Cart Inspection Team</p>
      </body>
    </html>
  `;
}

const resend = new Resend(process.env.RESEND_API_KEY || '');

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || '';

function logWithDiagnostics(message: string, data: any, level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data: data ? JSON.stringify(data) : null
  };

  console[level](JSON.stringify(logEntry));
}

function diagnoseNextApiRequest(req: NextApiRequest) {
  logWithDiagnostics('📋 API Request Diagnostics', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
}

async function sendEmailWithDiagnostics(emailData: SendEmailOptions) {
  logWithDiagnostics('📧 Sending Email', {
    to: emailData.to,
    subject: emailData.subject
  });

  try {
    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      logWithDiagnostics('❌ Email Sending Failed', error, 'error');
      throw error;
    }

    logWithDiagnostics('✅ Email Sent Successfully', data);
    return data;
  } catch (error) {
    console.error('Resend Email Error:', error);
    throw error;
  }
}

// Función para generar un ID de inspección consistente y seguro para URL
function generateInspectionId(data: any): string {
  // Usar una combinación de datos para crear un ID único pero legible
  const baseId = `${data.property}-${data.cartNumber}-${data.inspectionDate}`;
  
  // Reemplazar espacios y caracteres especiales
  const safeId = baseId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')  // Reemplazar caracteres no alfanuméricos con guiones
    .replace(/-+/g, '-')  // Reemplazar múltiples guiones con uno solo
    .replace(/^-|-$/g, '');  // Eliminar guiones al inicio y final

  // Agregar un fragmento aleatorio para mayor unicidad
  const randomFragment = Math.random().toString(36).substring(2, 8);
  
  return `${safeId}-${randomFragment}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Diagnóstico de la solicitud
  console.error('🔍 Solicitud recibida:', {
    method: req.method,
    body: JSON.stringify(req.body),
    headers: req.headers
  });

  diagnoseNextApiRequest(req);

  if (req.method !== 'POST') {
    console.error('❌ Método no permitido');
    logWithDiagnostics('❌ MÉTODO NO PERMITIDO', null, 'error');
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed',
      error: 'Solo se permiten solicitudes POST'
    });
  }

  try {
    const {
      property,
      cartNumber,
      guestName,
      guestEmail,
      guestPhone = '',
      observations = '',
      signatureChecked = false,
      frontLeftSide = { scratches: 0, missingParts: 0, damageBumps: 0 },
      frontRightSide = { scratches: 0, missingParts: 0, damageBumps: 0 },
      inspectionDate
    } = req.body;

    console.error('📋 Datos procesados:', {
      property,
      cartNumber,
      guestName,
      guestEmail,
      inspectionDate
    });

    // Generar ID de inspección
    const inspectionId = generateInspectionId(req.body);

    // Validar datos de entrada
    if (!guestEmail) {
      console.error('❌ No se proporcionó correo electrónico');
      logWithDiagnostics('❌ ERROR: No se proporcionó un correo electrónico', null, 'error');
      return res.status(400).json({ 
        success: false,
        message: 'Correo electrónico es requerido',
        datosRecibidos: req.body
      });
    }

    // Configurar cabeceras para JSON
    res.setHeader('Content-Type', 'application/json');

    // Preparar registros para Airtable
    const airtableRecords = [
      // Front Left Scratches
      {
        "Inspection ID": inspectionId,
        Property: property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": inspectionDate,
        "Guest Name": guestName,
        "Guest Email": guestEmail,
        "Guest Phone": guestPhone,
        Section: "Front Left",
        "Damage Type": "Scratches",
        Quantity: frontLeftSide.scratches,
        "Preview observations by Guest": observations,
        "Signature Checked": signatureChecked
      },
      // Front Right Scratches
      {
        "Inspection ID": inspectionId,
        Property: property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": inspectionDate,
        "Guest Name": guestName,
        "Guest Email": guestEmail,
        "Guest Phone": guestPhone,
        Section: "Front Right",
        "Damage Type": "Scratches",
        Quantity: frontRightSide.scratches,
        "Preview observations by Guest": observations,
        "Signature Checked": signatureChecked
      },
      // Front Left Missing Parts
      {
        "Inspection ID": inspectionId,
        Property: property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": inspectionDate,
        "Guest Name": guestName,
        "Guest Email": guestEmail,
        "Guest Phone": guestPhone,
        Section: "Front Left",
        "Damage Type": "Missing Parts",
        Quantity: frontLeftSide.missingParts,
        "Preview observations by Guest": observations,
        "Signature Checked": signatureChecked
      },
      // Front Right Missing Parts
      {
        "Inspection ID": inspectionId,
        Property: property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": inspectionDate,
        "Guest Name": guestName,
        "Guest Email": guestEmail,
        "Guest Phone": guestPhone,
        Section: "Front Right",
        "Damage Type": "Missing Parts",
        Quantity: frontRightSide.missingParts,
        "Preview observations by Guest": observations,
        "Signature Checked": signatureChecked
      },
      // Front Left Damage/Bumps
      {
        "Inspection ID": inspectionId,
        Property: property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": inspectionDate,
        "Guest Name": guestName,
        "Guest Email": guestEmail,
        "Guest Phone": guestPhone,
        Section: "Front Left",
        "Damage Type": "Damage/Bumps",
        Quantity: frontLeftSide.damageBumps,
        "Preview observations by Guest": observations,
        "Signature Checked": signatureChecked
      },
      // Front Right Damage/Bumps
      {
        "Inspection ID": inspectionId,
        Property: property || "No Property Specified",
        "Golf Cart Number": cartNumber,
        "Inspection Date": inspectionDate,
        "Guest Name": guestName,
        "Guest Email": guestEmail,
        "Guest Phone": guestPhone,
        Section: "Front Right",
        "Damage Type": "Damage/Bumps",
        Quantity: frontRightSide.damageBumps,
        "Preview observations by Guest": observations,
        "Signature Checked": signatureChecked
      }
    ].filter(record => record.Quantity > 0);

    // Enviar registros a Airtable
    const airtableSubmissionPromises = airtableRecords.map(record => 
      fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: record }),
      })
    );

    const airtableResponses = await Promise.all(airtableSubmissionPromises);
    const airtableResults = await Promise.all(airtableResponses.map(r => r.json()));

    // Verificar si todos los registros se enviaron correctamente
    const allAirtableSubmissionsSuccessful = airtableResults.every(result => !result.error);

    if (!allAirtableSubmissionsSuccessful) {
      logWithDiagnostics('❌ ERROR: No todos los registros se guardaron en Airtable', airtableResults, 'error');
    }

    // Generar enlace de vista previa
    const previewLink = `${process.env.NEXT_PUBLIC_APP_URL}/signature/${inspectionId}`;

    // Preparar correo electrónico
    const emailData = {
      from: 'Golf Cart Inspection <onboarding@resend.dev>',
      to: guestEmail,
      subject: 'Golf Cart Inspection - Preview and Signature Required',
      html: generatePreviewHTML(req.body, previewLink)
    };

    // Intentar enviar correo
    let emailResult = null;
    try {
      emailResult = await sendEmailWithDiagnostics(emailData);
    } catch (emailError) {
      logWithDiagnostics('❌ ERROR AL ENVIAR CORREO', emailError, 'error');
      // No interrumpir el proceso si falla el correo
    }

    // Respuesta final
    const responseData = { 
      success: true,
      message: 'Inspección guardada exitosamente',
      airtableResults: {
        success: allAirtableSubmissionsSuccessful,
        details: allAirtableSubmissionsSuccessful ? 'Todos los registros guardados' : 'Algunos registros fallaron'
      },
      emailResult: emailResult ? { success: true } : { success: false },
      previewLink: previewLink
    };

    console.error('✅ Respuesta JSON:', JSON.stringify(responseData));
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Error completo:', error);
    logWithDiagnostics('❌ ERROR PROCESANDO LA INSPECCIÓN', error, 'error');
    return res.status(500).json({ 
      success: false,
      message: 'Error procesando la inspección',
      error: error instanceof Error ? error.message : 'Error desconocido',
      fullError: error instanceof Error ? error.stack : null
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

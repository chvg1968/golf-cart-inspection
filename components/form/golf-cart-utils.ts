import { GolfCartFormData } from './golf-cart-types';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// Configuración de Vercel Blob (asegúrate de tener las credenciales configuradas)

const BUCKET_NAME = 'your-bucket-name';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const generateInspectionId = (formData: Partial<GolfCartFormData>): string => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const cartNumber = formData.cartNumber || 'Unknown';
  return `${timestamp}--${cartNumber}`;
};

export const generatePDFFilename = (formData: GolfCartFormData): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `golf-cart-inspection-${formData.cartNumber}-${timestamp}.pdf`;
};

export const generatePDF = (formData: Partial<GolfCartFormData>): string => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Configuraciones de estilo
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 15;
  const lineHeight = 7;
  const fontSize = 11;
  const titleFontSize = 16;
  const grayColor = '#666666';
  
  // Función para dibujar línea divisoria
  const drawDivider = (y: number) => {
    pdf.setDrawColor(grayColor);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
  };

  // Título del documento
  pdf.setFontSize(titleFontSize);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Golf Cart Inspection Report', pageWidth / 2, 25, { align: 'center' });

  // Generar Inspection ID si no existe
  const inspectionId = formData.inspectionId || generateInspectionId(formData);

  // Información de la Inspección
  let currentY = 40;
  pdf.setFontSize(fontSize);
  pdf.text(`Inspection ID: ${inspectionId}`, margin, currentY);
  currentY += lineHeight;
  pdf.text(`Property: ${formData.property || 'N/A'}`, margin, currentY);
  currentY += lineHeight;
  pdf.text(`Cart Number: ${formData.cartNumber || 'N/A'}`, margin, currentY);
  currentY += lineHeight;
  pdf.text(`Inspection Date: ${formData.inspectionDate || 'N/A'}`, margin, currentY);
  
  // Línea divisoria
  currentY += lineHeight;
  drawDivider(currentY);

  // Información del Invitado
  currentY += lineHeight;
  pdf.text('Guest Information', margin, currentY);
  currentY += lineHeight;
  pdf.text(`Name: ${formData.guestName || 'N/A'}`, margin, currentY);
  currentY += lineHeight;
  pdf.text(`Email: ${formData.guestEmail || 'N/A'}`, margin, currentY);
  currentY += lineHeight;
  pdf.text(`Phone: ${formData.guestPhone || 'N/A'}`, margin, currentY);
  
  // Línea divisoria
  currentY += lineHeight;
  drawDivider(currentY);

  // Daños y Observaciones
  currentY += lineHeight;
  pdf.text('Damage List', margin, currentY);
  currentY += lineHeight;
  
  // Manejar múltiples daños en formato de tabla
  const damageRecords = formData.damageRecords || [];
  if (damageRecords.length > 0) {
    // Definir anchos de columna
    const columnWidths = [50, 50, 30];
    const tableHeaders = ['Section', 'Damage Type', 'Quantity'];
    
    // Dibujar encabezados de tabla
    pdf.setFillColor(240, 240, 240); // Color de fondo gris claro
    pdf.rect(margin, currentY, columnWidths[0], lineHeight, 'F');
    pdf.rect(margin + columnWidths[0], currentY, columnWidths[1], lineHeight, 'F');
    pdf.rect(margin + columnWidths[0] + columnWidths[1], currentY, columnWidths[2], lineHeight, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(tableHeaders[0], margin + 2, currentY + 5);
    pdf.text(tableHeaders[1], margin + columnWidths[0] + 2, currentY + 5);
    pdf.text(tableHeaders[2], margin + columnWidths[0] + columnWidths[1] + 2, currentY + 5);
    
    currentY += lineHeight;
    pdf.setFont('helvetica', 'normal');
    
    // Dibujar filas de daños
    damageRecords.forEach((record) => {
      // Dibujar bordes de celdas
      pdf.rect(margin, currentY, columnWidths[0], lineHeight);
      pdf.rect(margin + columnWidths[0], currentY, columnWidths[1], lineHeight);
      pdf.rect(margin + columnWidths[0] + columnWidths[1], currentY, columnWidths[2], lineHeight);
      
      // Escribir contenido
      pdf.text(record.section || 'N/A', margin + 2, currentY + 5);
      pdf.text(record.damageType || 'N/A', margin + columnWidths[0] + 2, currentY + 5);
      pdf.text(record.quantity?.toString() || 'N/A', margin + columnWidths[0] + columnWidths[1] + 2, currentY + 5);
      
      currentY += lineHeight;
    });
  } else {
    // Si no hay daños específicos, pero hay un campo de daños general
    const damagesArray = formData.damages?.split(',') || [];
    if (damagesArray.length > 0 && damagesArray[0].trim() !== '') {
      damagesArray.forEach((damage, index) => {
        pdf.text(`${index + 1}. ${damage.trim()}`, margin, currentY);
        currentY += lineHeight;
      });
    }
  }
  
  // Línea divisoria
  currentY += lineHeight;
  drawDivider(currentY);

  // Observaciones del Invitado (solo si hay observaciones)
  if (formData.previewObservationsByGuest && formData.previewObservationsByGuest.trim() !== '') {
    currentY += lineHeight;
    pdf.text('Guest Observations', margin, currentY);
    currentY += lineHeight;
    pdf.text(formData.previewObservationsByGuest, margin, currentY);
    
    // Línea divisoria
    currentY += lineHeight * 2;
    drawDivider(currentY);
  }

  // Términos y Condiciones
  currentY += lineHeight;
  pdf.text('Terms and Conditions', margin, currentY);
  currentY += lineHeight;
  
  // Checkbox con un cuadrado
  pdf.rect(margin, currentY, 5, 5);
  pdf.text(' I accept the terms and conditions', margin + 6, currentY + 4);
  
  // Espacio para firma
  currentY += lineHeight * 3;
  pdf.text('Guest Signature:', margin, currentY);
  currentY += lineHeight * 3;
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  // Generar base64
  return pdf.output('datauristring');
};

export const generatePDFLink = async (pdfBase64: string, formData: Partial<GolfCartFormData>): Promise<string> => {
  try {
    // Simplemente devolver el base64 original
    return pdfBase64;
  } catch (error) {
    console.error('Error generating PDF link:', error);
    return pdfBase64;
  }
};

// Función auxiliar para generar URL de datos
const generateDataURL = (pdfBase64: string): string => {
  try {
    const blob = base64ToBlob(pdfBase64);
    return URL.createObjectURL(blob);
  } catch (blobError) {
    console.error('Error generando URL de datos:', blobError);
    // Si falla la generación de blob, devolver la base64 original
    return pdfBase64;
  }
};

// Función auxiliar para convertir base64 a Blob
const base64ToBlob = (base64: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'application/pdf' });
};

// Definición de tipo para registro de Airtable
interface AirtableRecord {
  'Property': string;
  'Golf Cart Number': string | number;
  'Inspection Date': string;
  'Guest Name': string;
  'Guest Email': string;
  'Guest Phone': string;
  'Golf Cart Signature Checked': boolean;
}

export const mapFormDataToAirtable = (formData: GolfCartFormData): AirtableRecord => {
  return {
    'Property': formData.property,
    'Golf Cart Number': formData.cartNumber,
    'Inspection Date': formData.inspectionDate || new Date().toISOString().split('T')[0],
    'Guest Name': formData.guestName,
    'Guest Email': formData.guestEmail,
    'Guest Phone': formData.guestPhone || '',
    'Golf Cart Signature Checked': !!formData.guestSignature
  };
};

export const generateSignatureLink = (inspectionId: string): string => {
  // Generar enlace de firma basado en la URL de la aplicación
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://golfcartinsp.netlify.app/';
  
  // Asegurar que no haya doble barra al final
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  
  return `${cleanBaseUrl}/signature/${inspectionId}`;
};

export const generateSignatureConfirmLink = (inspectionId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://golfcartinsp.netlify.app/';
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  
  // Generar un token único basado en el Inspection ID
  const token = generateUniqueToken(inspectionId);
  
  return `${cleanBaseUrl}/signature-confirm/${inspectionId}/${token}`;
};

// Función auxiliar para generar un token único
const generateUniqueToken = (inspectionId: string): string => {
  // Implementación simple de generación de token
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(`${inspectionId}-signature-confirm`)
    .digest('hex')
    .slice(0, 16);
};

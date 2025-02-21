import { GolfCartFormData } from './golf-cart-types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDFFilename = (formData: GolfCartFormData): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `golf-cart-inspection-${formData.cartNumber}-${timestamp}.pdf`;
};

export const generatePDF = async (formRef: React.RefObject<HTMLFormElement>): Promise<string> => {
  if (!formRef.current) {
    throw new Error('Form reference is not available');
  }

  try {
    // Capturar el formulario como imagen
    const canvas = await html2canvas(formRef.current, {
      scale: 2,
      useCORS: true,
      logging: true
    });

    // Crear PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Convertir canvas a imagen base64
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const imgProps = pdf.getImageProperties(imgData);
    
    // Calcular dimensiones para ajustar al PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Añadir imagen al PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Convertir PDF a base64
    const pdfBase64 = pdf.output('datauristring');

    return pdfBase64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Definición de tipo para registro de Airtable
interface BaseAirtableRecord {
  'Property': string;
  'Golf Cart Number': string | number;
  'Inspection Date': string;
  'Guest Name': string;
  'Guest Email': string;
  'Guest Phone': string;
  'Golf Cart Signature Checked': boolean;
}

// Tipo extendido para campos opcionales
// type ExtendedAirtableRecord = BaseAirtableRecord & {
//   'Guest Observations'?: string;
//   'Damage Records'?: string;
// };

export const mapFormDataToAirtable = (formData: GolfCartFormData): ExtendedAirtableRecord => {
  const baseRecord: ExtendedAirtableRecord = {
    'Property': formData.property,
    'Golf Cart Number': formData.cartNumber,
    'Inspection Date': formData.inspectionDate || new Date().toISOString().split('T')[0],
    'Guest Name': formData.guestName,
    'Guest Email': formData.guestEmail,
    'Guest Phone': formData.guestPhone || '',
    'Golf Cart Signature Checked': !!formData.guestSignature
  };

  // Añadir observaciones del invitado si existen
  if (formData.previewObservationsByGuest) {
    baseRecord['Guest Observations'] = formData.previewObservationsByGuest;
  }

  // Añadir registros de daños si existen
  if (formData.damageRecords && formData.damageRecords.length > 0) {
    baseRecord['Damage Records'] = formData.damageRecords.map(record => 
      `${record.section}: ${record.damageType} (Qty: ${record.quantity})`
    ).join('; ');
  }

  return baseRecord;
};

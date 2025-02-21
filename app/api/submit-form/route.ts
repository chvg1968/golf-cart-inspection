import { Resend } from 'resend';
import { 
  generateInspectionId, 
  mapFormDataToAirtable
} from '@/components/form/golf-cart-utils';
import { createAirtableRecord } from './airtable-service';
import { NextRequest, NextResponse } from 'next/server';
import { 
  GolfCartFormData
} from '../../../components/form';
import { createGuestToken } from '@/lib/airtable-utils';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Validar clave de Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key is not configured');
    }

    const formData: GolfCartFormData = await req.json();

    // Validaciones de datos con tipado seguro
    const requiredFields: (keyof GolfCartFormData)[] = ['property', 'cartNumber', 'guestEmail'];
    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missingFields
      }, { status: 400 });
    }

    // Generar ID de inspección
    const inspectionId = generateInspectionId();

    // Preparar datos para Airtable
    const airtableRecord = {
      ...mapFormDataToAirtable(formData),
      'Inspection ID': inspectionId,
      'Status': 'Pending Guest Review'
    };

    const recordResponse = await createAirtableRecord(airtableRecord);

    // Generar token para acceso de invitado
    const { token } = await createGuestToken(inspectionId);

    // Generar enlace de invitado
    const guestInspectionLink = `${SITE_URL}/guest-inspection/${token}`;

    // Enviar correo con enlace
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: 'Inspección de Carrito de Golf <noreply@golfcartinsp.vercel.app>',
      to: formData.guestEmail,
      subject: 'Inspección de Carrito de Golf - Revisión Requerida',
      html: `
        <h1>Inspección de Carrito de Golf</h1>
        <p>Se requiere su revisión para la inspección del carrito de golf.</p>
        
        <h2>Detalles de la Inspección</h2>
        <ul>
          <li><strong>Propiedad:</strong> ${formData.property}</li>
          <li><strong>Número de Carrito:</strong> ${formData.cartNumber}</li>
        </ul>

        <h2>Acciones Requeridas</h2>
        <p>Por favor, haga clic en el siguiente enlace para revisar y completar la inspección:</p>
        
        <a href="${guestInspectionLink}">Completar Inspección de Carrito de Golf</a>

        <p>Nota: Este enlace es válido por 7 días.</p>
      `
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Inspection created and email sent',
      inspectionId,
      guestInspectionLink
    });

  } catch (error) {
    console.error('Inspection submission error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

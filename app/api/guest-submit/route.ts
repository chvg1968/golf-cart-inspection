import { NextRequest, NextResponse } from 'next/server';
import { createAirtableRecord, updateAirtableRecord } from '../submit-form/airtable-service';
import { mapFormDataToAirtable } from '@/components/form/golf-cart-utils';
import { GolfCartFormData } from '@/components/form/golf-cart-types';
import { validateGuestToken } from '@/lib/airtable-utils';

export async function POST(req: NextRequest) {
  try {
    const formData: GolfCartFormData & { 
      token: string; 
      inspectionId?: string; 
    } = await req.json();

    // Validar token de invitado
    const tokenValidation = await validateGuestToken(formData.token);

    if (!tokenValidation.valid) {
      return NextResponse.json({ 
        success: false, 
        message: tokenValidation.message || 'Token inválido' 
      }, { status: 403 });
    }

    // Usar el inspectionId del token validado
    const inspectionId = tokenValidation.inspectionId;

    if (!inspectionId) {
      return NextResponse.json({ 
        success: false, 
        message: 'No se encontró el ID de inspección' 
      }, { status: 400 });
    }

    // Preparar datos para Airtable
    const airtableRecord = {
      ...mapFormDataToAirtable(formData),
      'Inspection ID': inspectionId,
      'Status': 'Completed by Guest',
      'Guest Signature Timestamp': new Date().toISOString()
    };

    // Actualizar registro en Airtable
    const recordResponse = await updateAirtableRecord(inspectionId, airtableRecord);

    return NextResponse.json({ 
      success: true, 
      message: 'Inspección actualizada exitosamente',
      recordId: recordResponse.id 
    });

  } catch (error) {
    console.error('Guest submission error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 });
  }
}

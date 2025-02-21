import { NextRequest, NextResponse } from 'next/server';
import { findRecord, updateRecord } from '@/lib/airtable-utils';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Buscar token en Airtable
    const tokenRecord = await findRecord('GuestTokens', {
      filterByFormula: `token = "${token}"`
    });

    if (!tokenRecord || tokenRecord.length === 0) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Token inválido' 
      }, { status: 404 });
    }

    const record = tokenRecord[0];
    const expirationDate = new Date(record.fields.expirationDate);
    const now = new Date();

    if (expirationDate < now || record.fields.status !== 'active') {
      return NextResponse.json({ 
        valid: false, 
        message: 'Token expirado o inactivo' 
      }, { status: 403 });
    }

    // Obtener datos de inspección
    const inspectionId = record.fields.inspectionId;
    const inspectionData = await findRecord('Inspections', {
      filterByFormula: `id = "${inspectionId}"`
    });

    // Marcar token como usado
    await updateRecord('GuestTokens', record.id, {
      status: 'used'
    });

    return NextResponse.json({ 
      valid: true, 
      inspectionId,
      inspectionData: inspectionData[0]?.fields || null
    }, { status: 200 });

  } catch (error) {
    console.error('Error validating guest token:', error);
    return NextResponse.json({ 
      error: 'Error validando token' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createRecord } from '@/lib/airtable-utils';

export async function POST(request: NextRequest) {
  try {
    const { inspectionId, expirationDays = 7 } = await request.json();

    // Generar token único
    const token = uuidv4();

    // Calcular fecha de expiración
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    // Crear registro en Airtable para el token
    const tokenRecord = await createRecord('GuestTokens', {
      token,
      inspectionId,
      expirationDate: expirationDate.toISOString(),
      status: 'active'
    });

    return NextResponse.json({ 
      token, 
      expirationDate: expirationDate.toISOString() 
    }, { status: 200 });

  } catch (error) {
    console.error('Error generating guest token:', error);
    return NextResponse.json({ 
      error: 'Failed to generate guest token' 
    }, { status: 500 });
  }
}

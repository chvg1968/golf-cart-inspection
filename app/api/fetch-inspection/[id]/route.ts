import { NextRequest, NextResponse } from 'next/server';
import { getAirtableRecord } from '../../submit-form/airtable-service';

export async function GET(request: NextRequest) {
  const inspectionId = request.nextUrl.pathname.split('/').pop();

  if (!inspectionId) {
    return NextResponse.json({ error: 'Inspection ID is required' }, { status: 400 });
  }

  try {
    const record = await getAirtableRecord(inspectionId);

    if (!record) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    return NextResponse.json(record);

  } catch (error) {
    console.error('Error fetching inspection:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { updateAirtableRecord } from '@/app/api/submit-form/airtable-service';

export async function GET(
  request: NextRequest, 
  context: { params: { inspectionId: string } }
) {
  const { inspectionId } = context.params;

  try {
    // Actualizar registro en Airtable
    await updateAirtableRecord(inspectionId, {
      'Golf Cart Signature Checked': true,
      'Signature Timestamp': new Date().toISOString()
    });

    // Página de confirmación
    return new NextResponse(`
      <html>
        <body>
          <h1>Signature Confirmed ✅</h1>
          <p>Thank you for signing the Golf Cart Inspection Report.</p>
          <script>
            // Opcional: Cerrar ventana después de 3 segundos
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Signature confirmation error:', error);
    return NextResponse.json({ 
      error: 'Unable to confirm signature' 
    }, { status: 500 });
  }
}

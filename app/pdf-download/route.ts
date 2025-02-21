import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get('filename') || 'golf-cart-inspection.pdf';
  const base64Data = searchParams.get('data');

  if (!base64Data) {
    return NextResponse.json({ error: 'No PDF data provided' }, { status: 400 });
  }

  try {
    // Convertir base64 a buffer
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // Configurar headers para descarga
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    // Devolver el PDF como respuesta
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Error generating PDF download:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

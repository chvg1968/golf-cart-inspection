import { Resend } from 'resend';
import { generatePDF, generatePDFLink, mapFormDataToAirtable, generateInspectionId, generateSignatureLink } from '@/components/form/golf-cart-utils';
import { createAirtableRecord } from './airtable-service';
import { FieldSet } from './airtable-service';
import { NextRequest, NextResponse } from 'next/server';
import { 
  GolfCartFormData
} from '../../../components/form';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Validar clave de Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
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

    // Generar PDF
    const pdfBase64 = generatePDF(formData);
    const pdfLink = await generatePDFLink(pdfBase64, formData);

    console.error(' PDF Link Generation:', {
      pdfLink,
      linkLength: pdfLink.length
    });

    console.error(' PDF Attachment Debug:', {
      base64Length: pdfBase64.length,
      base64Prefix: pdfBase64.substring(0, 50) + '...',
      pdfLinkLength: pdfLink.length,
      pdfLinkPrefix: pdfLink.substring(0, 50) + '...'
    });

    // Extraer solo el contenido base64 sin el prefijo data URI
    const pdfContent = pdfBase64.split(',')[1];

    console.error(' Email Attachment Payload:', {
      filename: `golf-cart-inspection-${formData.cartNumber}.pdf`,
      contentLength: pdfContent.length
    });

    // Generar Inspection ID
    const inspectionId = generateInspectionId(formData);

    // Preparar datos para Airtable con Inspection ID
    const airtableRecord = {
      ...mapFormDataToAirtable(formData),
      'Inspection ID': inspectionId,
      'Golf Cart Inspection Send': true
    };

    // Crear registro en Airtable
    const recordResponse = await createAirtableRecord(airtableRecord);

    // Enviar correo con enlace de PDF
    try {
      // Validar API Key de Resend
      if (!RESEND_API_KEY) {
        throw new Error('Resend API key is missing or invalid');
      }

      const resend = new Resend(RESEND_API_KEY);
      
      // Validar email del destinatario
      if (!formData.guestEmail || !formData.guestEmail.includes('@')) {
        throw new Error('Invalid guest email address');
      }

      console.error(' Resend Email Configuration:', {
        apiKeyPresent: !!RESEND_API_KEY,
        sender: 'hello@resend.dev',
        recipient: formData.guestEmail
      });

      const signatureLink = generateSignatureLink(inspectionId);

      const INSPECTION_EMAIL = process.env.EMAIL_USER || 'conradovilla@hotmail.com';
      const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://golfcartinsp.netlify.app/';

      const emailPayload = {
        from: 'Golf Cart Inspection <hello@resend.dev>',
        to: [formData.guestEmail],
        subject: `Golf Cart Inspection Report - Cart #${formData.cartNumber}`,
        html: `
          <h1>Golf Cart Inspection Report</h1>
          <p>Dear ${formData.guestName || 'Guest'},</p>
          
          <p>Please review the attached Golf Cart Inspection Report.</p>
          
          <h2>Next Steps:</h2>
          <ol>
            <li>Review the attached PDF carefully</li>
            <li>Sign the document physically</li>
            <li>Send the signed PDF to: <strong>${INSPECTION_EMAIL}</strong></li>
            <li>Include your Inspection ID: <code>${inspectionId}</code> in the email subject</li>
          </ol>
          
          <p>After sending the signed PDF, please confirm the signature here: 
            <a href="${APP_URL.replace(/\/+$/, '')}/signature-confirm">Confirm Signature</a>
          </p>
          
          <p>To complete the digital confirmation, please <a href="${signatureLink}">click here to acknowledge the inspection</a>.</p>
          
          <p>If you have any questions, please contact us.</p>
        `,
        attachments: [
          {
            filename: `golf-cart-inspection-${formData.cartNumber}.pdf`,
            content: pdfContent,
            contentType: 'application/pdf'
          }
        ]
      };

      console.error(' Email Payload Details:', {
        recipients: emailPayload.to,
        subject: emailPayload.subject,
        attachmentSize: emailPayload.attachments[0].content.length
      });

      try {
        const emailResponse = await resend.emails.send(emailPayload);
        
        console.error(' Email Sent Response:', {
          responseId: emailResponse.data?.id,
          success: !!emailResponse.data,
          fullResponse: JSON.stringify(emailResponse, null, 2)
        });

        console.error(' Resend Full Response:', {
          data: emailResponse.data,
          error: emailResponse.error
        });

        if (emailResponse.error) {
          throw new Error(emailResponse.error.message);
        }

        return NextResponse.json({
          success: true,
          recordId: recordResponse.id,
          inspectionId: inspectionId,
          emailId: emailResponse.data?.id || null,
          processingTime: Date.now() - startTime,
          pdfLink
        });

      } catch (resendError) {
        console.error(' Resend Email Sending Error:', {
          message: resendError instanceof Error ? resendError.message : 'Unknown error',
          name: resendError instanceof Error ? resendError.name : 'Unknown',
          stack: resendError instanceof Error ? resendError.stack : 'No stack trace'
        });

        return NextResponse.json({ 
          error: 'Email sending failed', 
          details: resendError instanceof Error ? resendError.message : 'Unknown error',
          payload: {
            to: formData.guestEmail,
            subject: `Golf Cart Inspection Report - Cart #${formData.cartNumber}`
          }
        }, { status: 500 });
      }
    } catch (generalError) {
      console.error(' General Email Configuration Error:', {
        message: generalError instanceof Error ? generalError.message : 'Unknown error',
        name: generalError instanceof Error ? generalError.name : 'Unknown',
        stack: generalError instanceof Error ? generalError.stack : 'No stack trace'
      });

      return NextResponse.json({ 
        error: 'Email configuration failed', 
        details: generalError instanceof Error ? generalError.message : 'Unknown error' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ 
      error: 'Submission failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

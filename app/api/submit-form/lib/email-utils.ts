import { Resend } from 'resend';
import { GolfCartFormData } from '../../../../components/form';

export const sendInspectionEmail = async (
  resend: Resend, 
  formData: GolfCartFormData, 
  pdfBuffer?: Buffer
) => {
  const emailAttachments = pdfBuffer ? [{
    filename: `golf-cart-inspection-${formData.cartNumber}.pdf`,
    content: pdfBuffer
  }] : [];

  return await resend.emails.send({
    from: 'Luxe Properties <noreply@luxeproperties.com>',
    to: formData.guestEmail,
    subject: `Golf Cart Inspection Report - Cart #${formData.cartNumber}`,
    html: `
      <h2>Golf Cart Inspection Form</h2>
      <p>Dear ${formData.guestName},</p>
      <p>Thank you for completing the golf cart inspection form.</p>
      <p>Inspection Details:</p>
      <ul>
        <li>Property: ${formData.property}</li>
        <li>Cart Number: ${formData.cartNumber}</li>
        <li>Inspection Date: ${formData.inspectionDate || new Date().toISOString()}</li>
      </ul>
      <p>Please review the attached PDF.</p>
      <p>Best regards,<br>Luxe Properties</p>
    `,
    attachments: emailAttachments
  });
};

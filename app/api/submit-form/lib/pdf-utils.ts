export const processPDF = (base64Pdf: string): Buffer | null => {
  try {
    const base64Data = base64Pdf.replace(/^data:application\/pdf;filename=.*?;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    return pdfBuffer;
  } catch (error) {
    console.error('Error processing PDF:', error);
    return null;
  }
};

export const createAirtableAttachment = (base64Pdf: string, cartNumber: string) => {
  const filename = `inspection_${cartNumber}_${Date.now()}.pdf`;
  const dataUrl = `data:application/pdf;base64,${base64Pdf}`;
  
  return {
    url: dataUrl,
    filename: filename
  };
};

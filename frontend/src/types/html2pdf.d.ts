declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number[] | { top: number, bottom: number, left: number, right: number },
    filename?: string,
    image?: { type: string, quality: number },
    html2canvas?: {
      scale?: number,
      useCORS?: boolean,
      allowTaint?: boolean,
      logging?: boolean,
      backgroundColor?: string
    },
    jsPDF?: {
      unit?: string,
      format?: string,
      orientation?: 'portrait' | 'landscape'
    }
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement | string): Html2PdfInstance;
    save(): void;
  }

  function html2pdf(): Html2PdfInstance;

  export = html2pdf;
}

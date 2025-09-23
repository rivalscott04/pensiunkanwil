/**
 * Helper function untuk membuat window print dengan ukuran yang konsisten
 * @param content - HTML content yang akan ditampilkan di window print
 * @param title - Title untuk window print
 * @returns Window object atau null jika gagal
 */
export function createPrintWindow(content: string, title: string = "Print Document"): Window | null {
  const base = window.location.origin;
  
  // Create a new window/tab for printing with consistent size
  const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  
  if (!printWindow) {
    alert('Popup blocked! Please allow popups for this site to print documents.');
    return null;
  }
  
  const printDocument = printWindow.document;
  printDocument.open();
  printDocument.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <base href="${base}">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/paper-css/0.4.1/paper.min.css">
        <style>
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #000;
          }
          h1, h2, h3, h4, h5, h6 {
            font-size: 11.5pt;
          }
          .print-content {
            max-width: 100%;
            margin: 0 auto;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-content">
          ${content}
        </div>
      </body>
    </html>
  `);
  printDocument.close();
  
  return printWindow;
}

/**
 * Helper function untuk menunggu gambar selesai dimuat sebelum print
 * @param printWindow - Window object dari createPrintWindow
 */
export function waitForImagesAndPrint(printWindow: Window): void {
  const waitForImages = async () => {
    const images = Array.from(printWindow.document.images || []);
    await Promise.all(images.map((img) => 
      img.complete && img.naturalWidth > 0 
        ? Promise.resolve() 
        : new Promise<void>((resolve) => { 
            img.onload = () => resolve(); 
            img.onerror = () => resolve(); 
          })
    ));
  };
  
  waitForImages().then(() => {
    printWindow.focus();
    printWindow.print();
    // Close the window after printing (optional)
    // printWindow.close();
  });
}

/**
 * Helper function untuk print dengan content dari DOM element
 * @param elementId - ID dari DOM element yang akan di-print
 * @param title - Title untuk window print
 */
export function printFromElement(elementId: string, title: string = "Print Document"): void {
  const printContents = document.getElementById(elementId)?.innerHTML || "";
  const printWindow = createPrintWindow(printContents, title);
  
  if (printWindow) {
    waitForImagesAndPrint(printWindow);
  }
}

/**
 * Helper function untuk print dengan content HTML langsung
 * @param content - HTML content yang akan di-print
 * @param title - Title untuk window print
 */
export function printFromContent(content: string, title: string = "Print Document"): void {
  const printWindow = createPrintWindow(content, title);
  
  if (printWindow) {
    waitForImagesAndPrint(printWindow);
  }
}

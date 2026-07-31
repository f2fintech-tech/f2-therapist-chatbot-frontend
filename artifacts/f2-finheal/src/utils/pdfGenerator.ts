import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { inlineCrossOriginStylesheets } from "./cibilUtils";

export interface GeneratePdfOptions {
  element: HTMLElement;
  filename: string;
  clientName: string;
  bureau?: string;
}

export async function generatePdfFromElement({ element, filename, clientName, bureau = "CIBIL" }: GeneratePdfOptions): Promise<void> {
  let clone: HTMLElement | null = null;
  try {
    await inlineCrossOriginStylesheets();
    
    // Create an offscreen clone of the report element to capture the full expanded height
    clone = element.cloneNode(true) as HTMLElement;
    clone.classList.add("cibil-pdf-downloading");
    
    // Style the clone to render offscreen and expand to its natural height
    clone.style.setProperty("position", "absolute", "important");
    clone.style.setProperty("top", "0", "important");
    clone.style.setProperty("left", "-9999px", "important");
    clone.style.setProperty("width", "1024px", "important");
    clone.style.setProperty("height", "auto", "important");
    clone.style.setProperty("max-height", "none", "important");
    clone.style.setProperty("overflow", "visible", "important");
    clone.style.setProperty("display", "block", "important");
    
    // Expand all scrollable containers inside the clone
    const scrollableElements = Array.from(clone.querySelectorAll(".cibil-print-scrollable")) as HTMLElement[];
    scrollableElements.forEach(el => {
      el.style.setProperty("height", "auto", "important");
      el.style.setProperty("min-height", "0", "important");
      el.style.setProperty("max-height", "none", "important");
      el.style.setProperty("overflow", "visible", "important");
      el.style.setProperty("display", "block", "important");
    });
    
    // Hide all elements with print-hide class inside the clone
    const hideElements = Array.from(clone.querySelectorAll(".cibil-print-hide")) as HTMLElement[];
    hideElements.forEach(el => {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
    });

    document.body.appendChild(clone);
    
    // Wait for layout reflow
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // Adjust positions of elements in the clone to avoid breaking them across A4 page splits
    const cloneWidth = clone.clientWidth || 1024;
    const pageHeightPx = Math.floor(cloneWidth * 1.45789); // A4 printable area ratio (277 / 190) -> ~1493px
    
    const breakables = Array.from(clone.querySelectorAll([
      ".divide-y > div",
      ".divide-y > a",
      "tr",
      "table",
      "h1", "h2", "h3", "h4",
      ".cibil-print-section",
      ".cibil-print-keep-together",
      ".cibil-chart-container"
    ].join(", "))) as HTMLElement[];

    const cloneRect = clone.getBoundingClientRect();

    breakables.forEach(el => {
      const elRect = el.getBoundingClientRect();
      const top = elRect.top - cloneRect.top;
      const height = elRect.height;
      const bottom = top + height;
      
      const pageNumStart = Math.floor(top / pageHeightPx);
      const pageNumEnd = Math.floor(bottom / pageHeightPx);
      
      if (pageNumStart !== pageNumEnd && height < pageHeightPx) {
        const topOnPage = top % pageHeightPx;
        const remainingPageSpace = pageHeightPx - topOnPage;
        
        const spacer = document.createElement("div");
        spacer.style.height = `${remainingPageSpace}px`;
        spacer.style.width = "100%";
        spacer.style.clear = "both";
        
        if (el.parentNode) {
          el.parentNode.insertBefore(spacer, el);
        }
      }
    });
    
    // Generate canvas from the adjusted offscreen clone
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1024
    });
    
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    
    // A4 dimensions: 210mm x 297mm
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const margin = 10;
    const contentWidth = pdfWidth - (margin * 2); // 190mm
    const contentHeight = 277; // Exactly 277mm printable area (10mm to 287mm)
    
    // Calculate how the canvas height maps to PDF height
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = margin;
    
    // Mask function to cover top/bottom margins with solid white rectangles
    const drawMarginMasks = (pdfDoc: typeof pdf) => {
      pdfDoc.setFillColor(255, 255, 255);
      pdfDoc.rect(0, 0, pdfWidth, margin, "F"); // Top margin mask
      pdfDoc.rect(0, pdfHeight - margin, pdfWidth, margin, "F"); // Bottom margin mask
    };
    
    // Page 1
    pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
    drawMarginMasks(pdf);
    heightLeft -= contentHeight;
    
    // Additional pages
    while (heightLeft > 0) {
      position = (heightLeft - imgHeight) + margin;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      drawMarginMasks(pdf);
      heightLeft -= contentHeight;
    }
    
    // Post-process to draw elegant divider lines, header & footer labels, and page numbers
    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Draw thin horizontal separator lines
      pdf.setDrawColor(229, 231, 235); // gray-200
      pdf.setLineWidth(0.2);
      pdf.line(margin, margin, pdfWidth - margin, margin); // Top line
      pdf.line(margin, pdfHeight - margin, pdfWidth - margin, pdfHeight - margin); // Bottom line
      
      // Draw Header text
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(156, 163, 175); // gray-400
      pdf.text(`CREDIT REPORT ANALYZER • ${bureau.toUpperCase()}`, margin, margin - 3.5);
      
      pdf.setFont("helvetica", "normal");
      pdf.text(`CLIENT: ${clientName.toUpperCase()}`, pdfWidth - margin, margin - 3.5, { align: "right" });
      
      // Draw Footer text
      pdf.text("F2 FINTECH • CREDIT REPORT ANALYSER", margin, pdfHeight - margin + 5.5);
      pdf.text(`Page ${i} of ${totalPages}`, pdfWidth - margin, pdfHeight - margin + 5.5, { align: "right" });
    }
    
    pdf.save(filename);
  } finally {
    if (clone && clone.parentNode) {
      document.body.removeChild(clone);
    }
  }
}

export async function generateTherapyPdf(
  page1Id: string, 
  page2Id: string, 
  filename: string
): Promise<void> {
  const page1El = document.getElementById(page1Id);
  const page2El = document.getElementById(page2Id);
  if (!page1El || !page2El) return;

  const pdf = new jsPDF("p", "mm", "a4");

  // Render Page 1
  const originalWidth1 = page1El.style.width;
  const originalMaxWidth1 = page1El.style.maxWidth;
  const originalPadding1 = page1El.style.padding;
  page1El.style.width = "794px";
  page1El.style.maxWidth = "794px";
  page1El.style.padding = "30px";

  const canvas1 = await html2canvas(page1El, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff"
  });

  page1El.style.width = originalWidth1;
  page1El.style.maxWidth = originalMaxWidth1;
  page1El.style.padding = originalPadding1;

  // Render Page 2
  const originalWidth2 = page2El.style.width;
  const originalMaxWidth2 = page2El.style.maxWidth;
  const originalPadding2 = page2El.style.padding;
  page2El.style.width = "794px";
  page2El.style.maxWidth = "794px";
  page2El.style.padding = "30px";

  const canvas2 = await html2canvas(page2El, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff"
  });

  page2El.style.width = originalWidth2;
  page2El.style.maxWidth = originalMaxWidth2;
  page2El.style.padding = originalPadding2;

  const imgWidth = 210;

  // Add Page 1
  const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
  pdf.addImage(canvas1.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight1);

  // Add Page 2
  pdf.addPage();
  const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
  pdf.addImage(canvas2.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight2);

  pdf.save(filename);
}


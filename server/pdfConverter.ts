export async function convertHtmlToPdf(html: string): Promise<Buffer> {
  try {
    // Using html-pdf-lib or similar - fallback to weasyprint CLI
    const { execSync } = require("child_process");
    const fs = require("fs");
    const path = require("path");
    const tmpDir = "/tmp";
    const htmlFile = path.join(tmpDir, `strategy-${Date.now()}.html`);
    const pdfFile = path.join(tmpDir, `strategy-${Date.now()}.pdf`);
    
    // Write HTML to temp file
    fs.writeFileSync(htmlFile, html);
    
    // Convert using weasyprint (pre-installed)
    try {
      execSync(`weasyprint ${htmlFile} ${pdfFile}`, { timeout: 30000 });
    } catch (e) {
      // Fallback: use xhtml2pdf if weasyprint fails
      execSync(`python3 -m xhtml2pdf.cli ${htmlFile} ${pdfFile}`, { timeout: 30000 });
    }
    
    // Read PDF buffer
    const pdfBuffer = fs.readFileSync(pdfFile);
    
    // Cleanup
    fs.unlinkSync(htmlFile);
    fs.unlinkSync(pdfFile);
    
    return pdfBuffer;
  } catch (error) {
    console.error("PDF conversion error:", error);
    throw new Error(`Failed to convert HTML to PDF: ${error}`);
  }
}

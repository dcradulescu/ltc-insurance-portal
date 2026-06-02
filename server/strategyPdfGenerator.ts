import { storagePut } from "./storage";
import { generatePdfBuffer, PdfData } from "./pdfConverter";

export async function generateStrategyPdf(data: PdfData): Promise<{ url: string; key: string }> {
  const pdfBuffer = generatePdfBuffer(data);

  const safeName = (data.insuredName || "unknown").replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
  const fileName = `LTC-Strategy-${safeName}-${Date.now()}.pdf`;
  const result = await storagePut(
    `strategies/${fileName}`,
    pdfBuffer,
    "application/pdf"
  );

  return result;
}

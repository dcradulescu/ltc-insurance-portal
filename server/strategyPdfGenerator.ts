import { storagePut } from "./storage";
import { generatePdfBuffer } from "./pdfConverter";

interface StrategyPdfData {
  insuredName: string;
  policyNumber: string;
  carrierName: string;
  dailyMaximum: number;
  monthlyMaximum: number;
  lifetimeMaximum: number;
  diagnosis: string;
  adlLimitations: string[];
  stage1Tasks: string[];
  stage2Tasks: string[];
  stage3Tasks: string[];
  careRecommendations: string;
  strategyContent: string;
}

export async function generateStrategyPdf(data: StrategyPdfData): Promise<{ url: string; key: string }> {
  const pdfBuffer = generatePdfBuffer(data);
  
  const fileName = `LTC-Strategy-${data.insuredName.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  const result = await storagePut(
    `strategies/${fileName}`,
    pdfBuffer,
    "application/pdf"
  );

  return result;
}

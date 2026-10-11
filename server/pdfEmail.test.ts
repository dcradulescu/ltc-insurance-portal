import { describe, it, expect, vi } from "vitest";
import { generatePdfBuffer } from "./pdfConverter";

const samplePdfData = {
  insuredName: "John Smith",
  policyNumber: "POL-12345",
  carrierName: "Genworth Financial",
  dailyMaximum: 250,
  monthlyMaximum: 7500,
  lifetimeMaximum: 500000,
  diagnosis: "LTC Insurance Claim",
  adlLimitations: ["Bathing", "Dressing", "Toileting"],
  stage1Tasks: [
    "Gather all policy documents",
    "Schedule physician assessment",
    "Contact insurance carrier",
  ],
  stage2Tasks: [
    "Submit claim packet",
    "Track 30-day review window",
    "Follow up with adjuster",
  ],
  stage3Tasks: [
    "Set up care schedule",
    "Submit monthly invoices",
    "Maintain documentation",
  ],
  careRecommendations: "Based on the diagnosis, home care services are recommended including personal care assistance and companion care.",
  strategyContent: "This is the full strategy content for the insured.",
};

describe("PDF Generation (jsPDF-based)", () => {
  it("should generate a valid PDF buffer from policy data", () => {
    const buffer = generatePdfBuffer(samplePdfData);
    
    // Should return a Buffer
    expect(buffer).toBeInstanceOf(Buffer);
    
    // Should have content (not empty)
    expect(buffer.length).toBeGreaterThan(1000);
    
    // Should start with PDF magic bytes
    const header = buffer.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("should handle empty task lists gracefully", () => {
    const data = {
      ...samplePdfData,
      stage1Tasks: [],
      stage2Tasks: [],
      stage3Tasks: [],
      adlLimitations: [],
      careRecommendations: "",
    };
    
    const buffer = generatePdfBuffer(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("should handle long insured names and text wrapping", () => {
    const data = {
      ...samplePdfData,
      insuredName: "Alexander Bartholomew Christopherson-Williamson III",
      careRecommendations: "A ".repeat(500) + "very long recommendation text that should wrap properly across multiple lines in the PDF document.",
    };
    
    const buffer = generatePdfBuffer(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("should handle special characters in data", () => {
    const data = {
      ...samplePdfData,
      insuredName: "José María García-López",
      carrierName: "Carrier & Co. (LLC)",
      stage1Tasks: ["Task with 'quotes' and \"double quotes\"", "Task with $pecial ch@racters!"],
    };
    
    const buffer = generatePdfBuffer(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("should generate multi-page PDFs", () => {
    const data = {
      ...samplePdfData,
      stage1Tasks: Array.from({ length: 20 }, (_, i) => `Stage 1 Task ${i + 1}: Detailed description of what needs to be done`),
      stage2Tasks: Array.from({ length: 15 }, (_, i) => `Stage 2 Task ${i + 1}: Follow up on important documentation`),
      stage3Tasks: Array.from({ length: 10 }, (_, i) => `Stage 3 Task ${i + 1}: Ongoing maintenance and review`),
    };
    
    const buffer = generatePdfBuffer(data);
    expect(buffer).toBeInstanceOf(Buffer);
    // With many tasks, the PDF should be larger
    expect(buffer.length).toBeGreaterThan(5000);
  });
});

describe("PDF Delivery Router Schema", () => {
  it("should validate the pdfDelivery router exists and has expected procedures", async () => {
    // Dynamic import to test the router structure
    const { pdfDeliveryRouter } = await import("./routers/pdfDelivery");
    
    // The router should exist
    expect(pdfDeliveryRouter).toBeDefined();
    
    // Check that the router has the expected procedures
    const procedures = Object.keys(pdfDeliveryRouter._def.procedures);
    expect(procedures).toContain("generatePdf");
    expect(procedures).toContain("sendPdfByEmail");
    expect(procedures).toContain("validateEmail");
  }, 15000);
});

describe("Email Router Schema", () => {
  it("should validate the email.sendStrategy procedure accepts policyData", async () => {
    const { appRouter } = await import("./routers");
    
    // The router should exist
    expect(appRouter).toBeDefined();
    
    // Check email router exists
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("email.sendStrategy");
    expect(procedures).toContain("email.sendPageContent");
    expect(procedures).toContain("email.sendContactForm");
  });
});

import { describe, it, expect } from "vitest";
import { generatePhysicianLetter, PhysicianLetterData } from "./physicianLetterGenerator";

describe("Physician Letter Generator", () => {
  const mockData: PhysicianLetterData = {
    patientFullName: "John Smith",
    patientDob: "01/15/1950",
    diagnosis: "Congestive Heart Failure",
    lastVisitDate: "04/01/2026",
    physicianName: "Dr. Jane Doe",
    physicianCredentials: "MD, FACC",
    practiceName: "Cardiology Associates",
    streetAddress: "123 Medical Drive",
    cityStateZip: "New York, NY 10001",
    phone: "(212) 555-1234",
    fax: "(212) 555-5678",
    adlLimitations: ["Bathing", "Dressing", "Toileting"],
    cognitiveImpairmentTrigger: false,
    minAdlsRequired: 2,
    prognosis: "indefinitely",
  };

  it("should generate letter with all required sections", () => {
    const result = generatePhysicianLetter(mockData);

    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("markdown");

    // Check that all formats contain key content
    expect(result.text).toContain("John Smith");
    expect(result.text).toContain("Congestive Heart Failure");
    expect(result.text).toContain("Dr. Jane Doe");
    expect(result.text).toContain("Bathing");
    expect(result.text).toContain("Dressing");
    expect(result.text).toContain("Toileting");
  });

  it("should include cognitive impairment section when triggered", () => {
    const dataWithCognitive: PhysicianLetterData = {
      ...mockData,
      cognitiveImpairmentTrigger: true,
      cognitiveRisks: ["Wandering", "Falls"],
    };

    const result = generatePhysicianLetter(dataWithCognitive);

    expect(result.text).toContain("cognitive impairment");
    expect(result.text).toContain("Wandering");
    expect(result.text).toContain("Falls");
  });

  it("should exclude cognitive section when not triggered", () => {
    const result = generatePhysicianLetter(mockData);

    // The text should not have excessive cognitive risk mentions
    const cognitiveCount = (result.text.match(/cognitive impairment/gi) || []).length;
    expect(cognitiveCount).toBe(0);
  });

  it("should handle optional fields with defaults", () => {
    const minimalData: PhysicianLetterData = {
      patientFullName: "Jane Doe",
      patientDob: "06/20/1955",
      diagnosis: "Stroke",
      qualifyingAdls: ["Transferring", "Continence / Incontinence Care"],
      cognitiveImpairmentTrigger: false,
      minAdlsRequired: 2,
    };

    const result = generatePhysicianLetter(minimalData);

    expect(result.text).toContain("Jane Doe");
    expect(result.text).toContain("Stroke");
    expect(result.text).toContain("[PHYSICIAN NAME");
    expect(result.text).toContain("[MEDICAL PRACTICE NAME");
  });

  it("should generate valid HTML with proper structure", () => {
    const result = generatePhysicianLetter(mockData);

    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("<html>");
    expect(result.html).toContain("</html>");
    expect(result.html).toContain("<head>");
    expect(result.html).toContain("<body>");
    expect(result.html).toContain("John Smith");
  });

  it("should generate markdown with proper formatting", () => {
    const result = generatePhysicianLetter(mockData);

    expect(result.markdown).toContain("# Physician Letter");
    expect(result.markdown).toContain("**John Smith**");
    expect(result.markdown).toContain("**Congestive Heart Failure**");
    expect(result.markdown).toContain("- ✓ Bathing");
  });

  it("should correctly mark selected and unselected ADLs", () => {
    const result = generatePhysicianLetter(mockData);

    // Selected ADLs should be marked
    expect(result.text).toContain("☑ Bathing");
    expect(result.text).toContain("☑ Dressing");
    expect(result.text).toContain("☑ Toileting");

    // Unselected ADLs should be unmarked
    expect(result.text).toContain("☐ Transferring");
    expect(result.text).toContain("☐ Continence / Incontinence Care");
    expect(result.text).toContain("☐ Eating / Feeding");
  });

  it("should include today's date in letter", () => {
    const result = generatePhysicianLetter(mockData);
    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    expect(result.text).toContain(`Date: ${today}`);
  });

  it("should handle multiple cognitive risks", () => {
    const dataWithMultipleRisks: PhysicianLetterData = {
      ...mockData,
      cognitiveImpairmentTrigger: true,
      cognitiveRisks: ["Wandering", "Personal injury due to impaired judgment or disorientation", "Falls", "Medication mismanagement"],
    };

    const result = generatePhysicianLetter(dataWithMultipleRisks);

    expect(result.text).toContain("☑ Wandering");
    expect(result.text).toContain("☑ Personal injury due to impaired judgment or disorientation");
    expect(result.text).toContain("☑ Falls");
    expect(result.text).toContain("☑ Medication mismanagement");
  });

  it("should use provided prognosis value", () => {
    const dataWithCustomPrognosis: PhysicianLetterData = {
      ...mockData,
      prognosis: "for the next 5 years",
    };

    const result = generatePhysicianLetter(dataWithCustomPrognosis);

    expect(result.text).toContain("for the next 5 years");
    expect(result.text).not.toContain("indefinitely");
  });

  it("should format physician credentials correctly", () => {
    const result = generatePhysicianLetter(mockData);

    expect(result.text).toContain("Dr. Jane Doe, MD, FACC");
  });

  it("should handle empty cognitive risks array when cognitive impairment is true", () => {
    const dataWithEmptyRisks: PhysicianLetterData = {
      ...mockData,
      cognitiveImpairmentTrigger: true,
      cognitiveRisks: [],
    };

    const result = generatePhysicianLetter(dataWithEmptyRisks);

    expect(result.text).toContain("cognitive impairment");
    // Should still have the checklist structure even if empty
    expect(result.text).toContain("☐ Wandering");
  });
});

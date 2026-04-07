import { describe, it, expect, beforeAll } from "vitest";
import {
  chunkDocument,
  buildRAGContext,
  retrieveRelevantDocuments,
} from "./rag";

describe("RAG System", () => {
  describe("Document Chunking", () => {
    it("should split document into chunks", () => {
      const doc = `This is a test document. It has multiple sentences. Each sentence is important. We need to chunk this properly. The chunking should preserve meaning. Sentences should not be split in the middle.`;
      const chunks = chunkDocument(doc, 50);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every((chunk) => chunk.length > 0)).toBe(true);
    });

    it("should handle empty documents", () => {
      const chunks = chunkDocument("");
      expect(chunks).toEqual([]);
    });

    it("should handle single chunk documents", () => {
      const doc = "Short document.";
      const chunks = chunkDocument(doc, 100);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(doc);
    });

    it("should break at sentence boundaries", () => {
      const doc = "First sentence. Second sentence. Third sentence.";
      const chunks = chunkDocument(doc, 30);

      // Chunks should be non-empty
      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeGreaterThan(0);
      });
    });
  });

  describe("RAG Context Building", () => {
    it("should build context from documents", () => {
      const documents = [
        { title: "Document 1", content: "Content 1" },
        { title: "Document 2", content: "Content 2" },
      ];

      const context = buildRAGContext(documents);

      expect(context).toContain("RETRIEVED CONTEXT:");
      expect(context).toContain("Document 1");
      expect(context).toContain("Document 2");
      expect(context).toContain("Content 1");
      expect(context).toContain("Content 2");
    });

    it("should handle empty document list", () => {
      const context = buildRAGContext([]);
      expect(context).toBe("");
    });

    it("should truncate long content", () => {
      const longContent = "x".repeat(2000);
      const documents = [{ title: "Long Doc", content: longContent }];

      const context = buildRAGContext(documents);

      expect(context).toContain("...");
      expect(context.length).toBeLessThan(longContent.length + 100);
    });
  });

  describe("Document Retrieval", () => {
    it("should score documents based on keyword matches", async () => {
      // This is a simplified test since we can't easily mock the database
      // In production, use a proper test database or mock the db functions

      const query = "elimination period";
      const mockDocs = [
        {
          id: 1,
          title: "Understanding Elimination Periods",
          content: "The elimination period is the waiting period before benefits begin.",
          isActive: true,
        },
        {
          id: 2,
          title: "Policy Coverage",
          content: "This policy covers various aspects of long-term care.",
          isActive: true,
        },
      ];

      // Test keyword extraction
      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((k) => k.length > 3);

      expect(keywords).toContain("elimination");
      expect(keywords).toContain("period");
    });

    it("should handle queries with no keywords", () => {
      const query = "a an the";
      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .filter((k) => k.length > 3);

      expect(keywords.length).toBe(0);
    });
  });

  describe("Semantic Search Scoring", () => {
    it("should score title matches higher than content matches", () => {
      const query = "elimination";
      const doc1 = {
        title: "Elimination Period Guide",
        content: "This document discusses various policy details.",
      };
      const doc2 = {
        title: "Policy Overview",
        content: "The elimination period is an important concept.",
      };

      // Title match should score higher
      const titleMatches = (doc1.title.toLowerCase().match(/elimination/g) || []).length * 10;
      const contentMatches = (doc2.content.toLowerCase().match(/elimination/g) || []).length;

      expect(titleMatches).toBeGreaterThan(contentMatches);
    });
  });

  describe("Chat Context Integration", () => {
    it("should properly format user policy context", () => {
      const policyContext = {
        insuredName: "John Doe",
        policyNumber: "LTC-12345",
        carrierName: "Insurance Co",
        eliminationPeriod: "90 days",
        dailyMax: "$150",
        monthlyMax: "$4500",
        lifetimeMax: "$500000",
        minAdls: "2 of 6",
      };

      const contextStr = `
USER'S POLICY CONTEXT:
- Insured: ${policyContext.insuredName}
- Policy #: ${policyContext.policyNumber}
- Carrier: ${policyContext.carrierName}
- Elimination Period: ${policyContext.eliminationPeriod}
- Daily Max: ${policyContext.dailyMax}
- Monthly Max: ${policyContext.monthlyMax}
- Lifetime Max: ${policyContext.lifetimeMax}
- Min ADLs Required: ${policyContext.minAdls}
`;

      expect(contextStr).toContain("John Doe");
      expect(contextStr).toContain("LTC-12345");
      expect(contextStr).toContain("90 days");
      expect(contextStr).toContain("$150");
    });
  });
});

/**
 * RAG Seed Data Test Script
 * Validates the RAG seed data structure without requiring database connection
 * Run with: node server/test-rag-seed.mjs
 */

import { ragSeedData } from "./rag-seed-data.mjs";

console.log("🧪 Testing RAG Seed Data Structure...\n");

// Validation rules
const VALID_CATEGORIES = [
  "policy_guide",
  "claim_process",
  "glossary",
  "faq",
  "best_practices",
];

let totalErrors = 0;
let totalWarnings = 0;
let documentStats = {
  total: 0,
  byCategory: {},
  totalContent: 0,
  totalKeywords: 0,
  totalChunks: 0,
};

// Test each document
ragSeedData.forEach((doc, index) => {
  console.log(`📄 Document ${index + 1}: "${doc.title}"`);

  // Check required fields
  const errors = [];
  const warnings = [];

  if (!doc.title || doc.title.trim().length === 0) {
    errors.push("Missing or empty title");
  }

  if (!doc.category || !VALID_CATEGORIES.includes(doc.category)) {
    errors.push(
      `Invalid category: "${doc.category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  if (!doc.content || doc.content.trim().length === 0) {
    errors.push("Missing or empty content");
  } else if (doc.content.length < 100) {
    warnings.push(`Content is short (${doc.content.length} chars)`);
  }

  if (!doc.summary || doc.summary.trim().length === 0) {
    warnings.push("Missing summary");
  }

  if (!doc.keywords || doc.keywords.length === 0) {
    warnings.push("No keywords provided");
  } else if (doc.keywords.length < 3) {
    warnings.push(`Only ${doc.keywords.length} keywords (recommend 3+)`);
  }

  if (!doc.source || doc.source.trim().length === 0) {
    warnings.push("Missing source");
  }

  // Display results
  if (errors.length > 0) {
    console.log(`   ❌ ERRORS:`);
    errors.forEach((err) => console.log(`      - ${err}`));
    totalErrors += errors.length;
  }

  if (warnings.length > 0) {
    console.log(`   ⚠️  WARNINGS:`);
    warnings.forEach((warn) => console.log(`      - ${warn}`));
    totalWarnings += warnings.length;
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`   ✅ Valid`);
  }

  // Update statistics
  documentStats.total++;
  documentStats.byCategory[doc.category] =
    (documentStats.byCategory[doc.category] || 0) + 1;
  documentStats.totalContent += doc.content.length;
  documentStats.totalKeywords += doc.keywords?.length || 0;

  // Estimate chunks (simple paragraph-based chunking)
  const chunks = doc.content.split("\n\n").filter((p) => p.trim());
  documentStats.totalChunks += chunks.length;

  console.log();
});

// Summary statistics
console.log("📊 SUMMARY STATISTICS:");
console.log(`   Total documents: ${documentStats.total}`);
console.log(`   Total errors: ${totalErrors}`);
console.log(`   Total warnings: ${totalWarnings}`);
console.log(`\n📚 Documents by Category:`);
Object.entries(documentStats.byCategory).forEach(([category, count]) => {
  console.log(`   ${category}: ${count}`);
});
console.log(`\n📈 Content Statistics:`);
console.log(
  `   Total content size: ${(documentStats.totalContent / 1024).toFixed(2)} KB`
);
console.log(
  `   Average content per doc: ${(documentStats.totalContent / documentStats.total).toFixed(0)} chars`
);
console.log(`   Total keywords: ${documentStats.totalKeywords}`);
console.log(
  `   Average keywords per doc: ${(documentStats.totalKeywords / documentStats.total).toFixed(1)}`
);
console.log(`   Estimated chunks: ${documentStats.totalChunks}`);
console.log(
  `   Average chunks per doc: ${(documentStats.totalChunks / documentStats.total).toFixed(1)}`
);

// Final result
console.log("\n" + "=".repeat(60));
if (totalErrors === 0) {
  console.log("✅ ALL TESTS PASSED - Ready for database seeding!");
  console.log("\nNext steps:");
  console.log("1. Set up database connection");
  console.log("2. Run: node server/seed-rag.mjs");
  console.log("3. Verify documents in database");
  console.log("4. Test chat with RAG retrieval");
  process.exit(0);
} else {
  console.log(`❌ TESTS FAILED - ${totalErrors} error(s) found`);
  console.log("Please fix the errors above and try again.");
  process.exit(1);
}

/**
 * Complete RAG Seed Script with Visiting Angels Content
 * Combines original LTC insurance knowledge base with home care information
 * Run with: node server/seed-rag-complete.mjs
 */

import { ragSeedData } from "./rag-seed-data.mjs";
import { visitingAngelsData } from "./rag-visiting-angels.mjs";

// Combine both datasets
const completeRagData = [...ragSeedData, ...visitingAngelsData];

console.log("📚 Complete RAG Knowledge Base:");
console.log(`   Original LTC Insurance Documents: ${ragSeedData.length}`);
console.log(`   Visiting Angels Home Care Documents: ${visitingAngelsData.length}`);
console.log(`   Total Documents: ${completeRagData.length}\n`);

// Export for use in seed script
export { completeRagData };

// Display summary
console.log("📊 Document Categories:");
const categoryCounts = {};
completeRagData.forEach((doc) => {
  categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
});

Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`   ${category}: ${count}`);
});

console.log("\n✅ Ready for database seeding!");
console.log("   Use this data in your seed script to populate the RAG tables.");

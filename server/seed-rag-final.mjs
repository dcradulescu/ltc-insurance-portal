/**
 * Final Complete RAG Seed Script
 * Combines all RAG data sources:
 * 1. Original LTC Insurance Knowledge Base (20 docs)
 * 2. Visiting Angels Home Care Information (8 docs)
 * 3. Client Service Agreement (7 docs)
 * Total: 35 comprehensive documents
 */

import { ragSeedData } from "./rag-seed-data.mjs";
import { visitingAngelsData } from "./rag-visiting-angels.mjs";
import { clientServiceAgreementData } from "./rag-client-service-agreement.mjs";

// Combine all datasets
const finalRagData = [
  ...ragSeedData,
  ...visitingAngelsData,
  ...clientServiceAgreementData,
];

console.log("📚 Complete RAG Knowledge Base - Final Version:");
console.log(`   Original LTC Insurance Documents: ${ragSeedData.length}`);
console.log(`   Visiting Angels Home Care Documents: ${visitingAngelsData.length}`);
console.log(`   Client Service Agreement Documents: ${clientServiceAgreementData.length}`);
console.log(`   TOTAL DOCUMENTS: ${finalRagData.length}\n`);

// Display summary
console.log("📊 Document Categories:");
const categoryCounts = {};
finalRagData.forEach((doc) => {
  categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
});

Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`   ${category}: ${count}`);
});

// Calculate total content size
let totalSize = 0;
finalRagData.forEach((doc) => {
  totalSize += doc.content.length;
});

console.log(`\n📊 Content Statistics:`);
console.log(`   Total Content Size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log(`   Average Doc Size: ${(totalSize / finalRagData.length).toFixed(0)} characters`);

console.log("\n✅ RAG Knowledge Base Ready for Database Seeding!");
console.log("   Use this data in your seed script to populate the RAG tables.");
console.log("   The chat system will now have access to:");
console.log("   - Complete LTC insurance claim guidance");
console.log("   - Visiting Angels home care services and pricing");
console.log("   - Client Service Agreement terms and conditions");
console.log("   - Billing, scheduling, and insurance coordination information");

export { finalRagData };

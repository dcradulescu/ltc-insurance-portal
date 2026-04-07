/**
 * RAG Seed Script
 * Populates the knowledge base with LTC insurance information
 * Run with: node server/seed-rag.mjs
 */

import mysql from "mysql2/promise";
import { nanoid } from "nanoid";
import { ragSeedData } from "./rag-seed-data.mjs";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ltc_insurance",
});

console.log("🌱 Starting RAG Knowledge Base Population...\n");

try {
  // Check if tables exist, create if not
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ragDocuments (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      content LONGTEXT NOT NULL,
      summary TEXT,
      keywords TEXT,
      source VARCHAR(255),
      isActive BOOLEAN DEFAULT true,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ragDocumentChunks (
      id VARCHAR(36) PRIMARY KEY,
      docId VARCHAR(36) NOT NULL,
      chunkIndex INT NOT NULL,
      content LONGTEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (docId) REFERENCES ragDocuments(id) ON DELETE CASCADE
    )
  `);

  console.log("✅ Tables ready\n");

  // Clear existing data (optional - comment out to keep existing data)
  // await connection.execute("DELETE FROM ragDocumentChunks");
  // await connection.execute("DELETE FROM ragDocuments");

  let successCount = 0;
  let failureCount = 0;

  // Insert each document
  for (const doc of ragSeedData) {
    try {
      const docId = nanoid();

      // Insert document
      await connection.execute(
        `INSERT INTO ragDocuments (id, title, category, content, summary, keywords, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          docId,
          doc.title,
          doc.category,
          doc.content,
          doc.summary || null,
          doc.keywords ? doc.keywords.join(",") : null,
          doc.source || null,
        ]
      );

      // Chunk the document (simple chunking by paragraphs)
      const paragraphs = doc.content.split("\n\n").filter((p) => p.trim());
      let chunkIndex = 0;

      for (const paragraph of paragraphs) {
        if (paragraph.trim().length > 0) {
          const chunkId = nanoid();
          await connection.execute(
            `INSERT INTO ragDocumentChunks (id, docId, chunkIndex, content)
             VALUES (?, ?, ?, ?)`,
            [chunkId, docId, chunkIndex, paragraph]
          );
          chunkIndex++;
        }
      }

      console.log(`✅ Added: ${doc.title} (${chunkIndex} chunks)`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${doc.title}`, error.message);
      failureCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${ragSeedData.length}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);

  // Show statistics
  const stats = await connection.execute(
    "SELECT category, COUNT(*) as count FROM ragDocuments WHERE isActive = true GROUP BY category"
  );
  console.log(`\n📚 Documents by Category:`);
  stats[0].forEach((row) => {
    console.log(`   ${row.category}: ${row.count}`);
  });

  const totalDocs = await connection.execute(
    "SELECT COUNT(*) as count FROM ragDocuments WHERE isActive = true"
  );
  console.log(`\n✨ Total active documents: ${totalDocs[0][0].count}`);
} catch (error) {
  console.error("❌ Error:", error.message);
} finally {
  await connection.end();
  console.log("\n✅ Done!");
}

import { getDb } from "./db";
import { ragDocuments, ragDocumentChunks, chatSessions, chatMessagesEnhanced } from "../drizzle/schema";
import { eq, and, like, desc } from "drizzle-orm";

/**
 * RAG (Retrieval-Augmented Generation) Helper Functions
 * Manages document storage, retrieval, and semantic search
 */

// ===== Document Management =====

/**
 * Add a new RAG document
 */
export async function addRAGDocument(data: {
  title: string;
  category: string;
  content: string;
  summary?: string;
  keywords?: string[];
  source?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ragDocuments).values({
    title: data.title,
    category: data.category,
    content: data.content,
    summary: data.summary,
    keywords: data.keywords ? JSON.stringify(data.keywords) : null,
    source: data.source,
    isActive: true,
  });
  return result;
}

/**
 * Get all active RAG documents
 */
export async function getAllRAGDocuments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(ragDocuments)
    .where(eq(ragDocuments.isActive, true))
    .orderBy(desc(ragDocuments.createdAt));
}

/**
 * Get RAG documents by category
 */
export async function getRAGDocumentsByCategory(category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(ragDocuments)
    .where(
      and(
        eq(ragDocuments.category, category),
        eq(ragDocuments.isActive, true)
      )
    );
}

/**
 * Search RAG documents by keyword
 */
export async function searchRAGDocuments(query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(ragDocuments)
    .where(
      and(
        eq(ragDocuments.isActive, true),
        like(ragDocuments.content, `%${query}%`)
      )
    )
    .limit(10);
}

/**
 * Get document by ID
 */
export async function getRAGDocumentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(ragDocuments)
    .where(eq(ragDocuments.id, id))
    .limit(1);
}

// ===== Document Chunking =====

/**
 * Split document into chunks for efficient retrieval
 * Chunks are approximately 500 tokens (roughly 2000 characters)
 */
export function chunkDocument(content: string, chunkSize: number = 2000): string[] {
  const chunks: string[] = [];
  let offset = 0;

  while (offset < content.length) {
    let chunk = content.substring(offset, offset + chunkSize);

    // Try to break at sentence boundary
    const lastPeriod = chunk.lastIndexOf(".");
    const lastNewline = chunk.lastIndexOf("\n");
    const breakPoint = Math.max(lastPeriod, lastNewline);

    if (breakPoint > 0 && breakPoint < chunk.length - 100) {
      chunk = chunk.substring(0, breakPoint + 1);
    }

    chunks.push(chunk.trim());
    offset += chunk.length;
  }

  return chunks;
}

/**
 * Store document chunks in database
 */
export async function storeDocumentChunks(
  documentId: number,
  chunks: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let offset = 0;
  const chunkRecords = chunks.map((chunk, index) => {
    const startOffset = offset;
    offset += chunk.length;
    return {
      documentId,
      chunkIndex: index,
      content: chunk,
      startOffset,
      endOffset: offset,
    };
  });

  await db.insert(ragDocumentChunks).values(chunkRecords);
}

/**
 * Get document chunks by document ID
 */
export async function getDocumentChunks(documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(ragDocumentChunks)
    .where(eq(ragDocumentChunks.documentId, documentId))
    .orderBy(ragDocumentChunks.chunkIndex);
}

// ===== Chat Session Management =====

/**
 * Create a new chat session
 */
export async function createChatSession(data: {
  sessionId: string;
  userId?: number;
  policyId?: number;
  topic?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSessions).values({
    sessionId: data.sessionId,
    userId: data.userId,
    policyId: data.policyId,
    topic: data.topic,
    messageCount: 0,
    isActive: true,
  });
  return result;
}

/**
 * Get chat session by ID
 */
export async function getChatSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionId))
    .limit(1);
}

/**
 * Update chat session
 */
export async function updateChatSession(
  sessionId: string,
  data: {
    topic?: string;
    summary?: string;
    messageCount?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(chatSessions)
    .set(data)
    .where(eq(chatSessions.sessionId, sessionId));
}

/**
 * Get user's active chat sessions
 */
export async function getUserChatSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, userId),
        eq(chatSessions.isActive, true)
      )
    )
    .orderBy(desc(chatSessions.updatedAt));
}

// ===== Enhanced Chat Messages =====

/**
 * Save enhanced chat message with context
 */
export async function saveEnhancedChatMessage(data: {
  sessionId: string;
  userId?: number;
  role: "user" | "assistant" | "system";
  content: string;
  retrievedDocuments?: Array<{ docId: number; title: string; relevanceScore: number }>;
  userContext?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessagesEnhanced).values({
    sessionId: data.sessionId,
    userId: data.userId,
    role: data.role,
    content: data.content,
    retrievedDocuments: data.retrievedDocuments
      ? JSON.stringify(data.retrievedDocuments)
      : null,
    userContext: data.userContext ? JSON.stringify(data.userContext) : null,
  });

  // Update session message count
  const session = await getChatSession(data.sessionId);
  if (session && session[0]) {
    await updateChatSession(data.sessionId, {
      messageCount: (session[0].messageCount || 0) + 1,
    });
  }

  return result;
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(chatMessagesEnhanced)
    .where(eq(chatMessagesEnhanced.sessionId, sessionId))
    .orderBy(chatMessagesEnhanced.createdAt)
    .limit(limit);
}

/**
 * Get recent chat messages for context (last N messages)
 */
export async function getRecentChatContext(
  sessionId: string,
  messageCount: number = 10
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const messages = await db
    .select()
    .from(chatMessagesEnhanced)
    .where(eq(chatMessagesEnhanced.sessionId, sessionId))
    .orderBy(desc(chatMessagesEnhanced.createdAt))
    .limit(messageCount);

  return messages.reverse(); // Return in chronological order
}

// ===== Semantic Search (Simple Implementation) =====

/**
 * Simple keyword-based retrieval
 * In production, this would use vector embeddings
 */
export async function retrieveRelevantDocuments(
  query: string,
  limit: number = 5
): Promise<Array<{ docId: number; title: string; relevanceScore: number; content: string }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Split query into keywords
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((k) => k.length > 3);

  if (keywords.length === 0) {
    return [];
  }

  // Search for documents containing keywords
  const docs = await db
    .select()
    .from(ragDocuments)
    .where(eq(ragDocuments.isActive, true));

  // Score documents based on keyword matches
  const scored = docs
    .map((doc: any) => {
      let score = 0;
      const contentLower = doc.content.toLowerCase();
      const titleLower = doc.title.toLowerCase();

      keywords.forEach((keyword) => {
        // Title matches worth more
        const titleMatches = (titleLower.match(new RegExp(keyword, "g")) || [])
          .length;
        score += titleMatches * 10;

        // Content matches
        const contentMatches = (contentLower.match(new RegExp(keyword, "g")) || [])
          .length;
        score += contentMatches;
      });

      return {
        docId: doc.id,
        title: doc.title,
        relevanceScore: score,
        content: doc.content,
      };
    })
    .filter((doc: any) => doc.relevanceScore > 0)
    .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return scored;
}

/**
 * Build RAG context from retrieved documents
 */
export function buildRAGContext(
  documents: Array<{ title: string; content: string }>
): string {
  if (documents.length === 0) {
    return "";
  }

  const context = documents
    .map(
      (doc) =>
        `## ${doc.title}\n\n${doc.content.substring(0, 1000)}${doc.content.length > 1000 ? "..." : ""}`
    )
    .join("\n\n---\n\n");

  return `RETRIEVED CONTEXT:\n\n${context}`;
}

import { createPool } from "mysql2";
import { eq, and, desc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, portalFiles,
  policies, InsertPolicy, Policy,
  strategies, InsertStrategy, Strategy,
  chatMessages, InsertChatMessage,
  documentUploads, InsertDocumentUpload, DocumentUpload,
  userContacts, InsertUserContact, UserContact,
  taskCompletions, InsertTaskCompletion, TaskCompletion,
  saveLinks, InsertSaveLink, SaveLink,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { persistTaskCompletionAtomic } from './taskCompletionAtomic';
import { decodeMariaDbJsonColumn } from "./dbJsonCompatibility";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const address = new URL(process.env.DATABASE_URL);
      address.searchParams.delete("timezone");
      const pool = createPool({
        uri: address.toString(), timezone: "Z",
        typeCast: decodeMariaDbJsonColumn,
      });
      // Drizzle encodes timestamp columns as UTC strings. Align MySQL's session
      // timezone too, including NOW(), defaults, and timestamp comparisons.
      pool.on("connection", connection => {
        connection.query("SET time_zone = '+00:00'", error => {
          if (error) connection.destroy();
        });
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Policy helpers ----
export async function createPolicy(data: InsertPolicy): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(policies).values(data);
  return Number(result[0].insertId);
}

export async function updatePolicy(id: number, userId: number, data: Partial<InsertPolicy>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(policies).set(data).where(and(eq(policies.id, id), eq(policies.userId, userId)));
}

export async function getPolicyByUserId(userId: number): Promise<Policy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(policies).where(eq(policies.userId, userId)).orderBy(desc(policies.updatedAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPolicyById(id: number): Promise<Policy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(policies).where(eq(policies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Strategy helpers ----
export async function createStrategy(data: InsertStrategy): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(strategies).values(data);
  return Number(result[0].insertId);
}

export async function getStrategyByPolicyId(policyId: number, userId: number): Promise<Strategy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(strategies).where(and(eq(strategies.policyId, policyId), eq(strategies.userId, userId))).orderBy(desc(strategies.generatedAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getStrategyById(id: number): Promise<Strategy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(strategies).where(eq(strategies.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateStrategy(id: number, userId: number, data: Partial<InsertStrategy>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(strategies).set(data).where(and(eq(strategies.id, id), eq(strategies.userId, userId)));
}

export async function getStrategyByUserId(userId: number): Promise<Strategy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(strategies).where(eq(strategies.userId, userId)).orderBy(desc(strategies.generatedAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Document Upload helpers ----
export async function createDocumentUpload(data: InsertDocumentUpload): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentUploads).values(data);
  return Number(result[0].insertId);
}

export async function getDocumentsByUserId(userId: number): Promise<DocumentUpload[]> {
  const db = await getDb();
  if (!db) throw new Error("Document database is unavailable");
  return db.select().from(documentUploads).where(eq(documentUploads.userId, userId)).orderBy(desc(documentUploads.createdAt));
}

export async function getDocumentsByTaskId(taskId: string, userId: number, strategyId: number): Promise<DocumentUpload[]> {
  const db = await getDb();
  if (!db) throw new Error("Document database is unavailable");
  return db.select().from(documentUploads).where(and(eq(documentUploads.taskId, taskId), eq(documentUploads.userId, userId), eq(documentUploads.strategyId, strategyId)));
}

// Compare the complete association so a stale browser cannot move a file
// that another request attached in the meantime.
export async function updateDocumentTaskLink(
  doc: DocumentUpload,
  next: { policyId: number | null; strategyId: number | null; taskId: string | null },
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Document database is unavailable");
  const result = await db.update(documentUploads).set(next).where(and(
    eq(documentUploads.id, doc.id), eq(documentUploads.userId, doc.userId),
    doc.policyId === null ? isNull(documentUploads.policyId) : eq(documentUploads.policyId, doc.policyId),
    doc.strategyId === null ? isNull(documentUploads.strategyId) : eq(documentUploads.strategyId, doc.strategyId),
    doc.taskId === null ? isNull(documentUploads.taskId) : eq(documentUploads.taskId, doc.taskId),
  ));
  return result[0].affectedRows === 1;
}

export async function deleteDocument(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.transaction(async tx => {
    const docs = await tx.select({ key: documentUploads.fileKey }).from(documentUploads)
      .where(and(eq(documentUploads.id, id), eq(documentUploads.userId, userId))).limit(1);
    if (!docs[0]) return;
    await tx.delete(portalFiles).where(and(eq(portalFiles.fileKey, docs[0].key), eq(portalFiles.userId, userId)));
    await tx.delete(documentUploads).where(and(eq(documentUploads.id, id), eq(documentUploads.userId, userId)));
  });
}

// ---- User Contacts helpers ----
export async function createUserContact(data: InsertUserContact): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userContacts).values(data);
  return Number(result[0].insertId);
}

export async function getUserContacts(userId: number): Promise<UserContact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userContacts).where(eq(userContacts.userId, userId));
}

export async function updateUserContact(id: number, userId: number, data: Partial<InsertUserContact>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(userContacts).set(data).where(and(eq(userContacts.id, id), eq(userContacts.userId, userId)));
}

export async function deleteUserContact(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userContacts).where(and(eq(userContacts.id, id), eq(userContacts.userId, userId)));
}

// ---- Chat helpers ----
export async function saveChatMessage(data: InsertChatMessage): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values(data);
}

export async function getChatHistory(sessionId: string, userId: number, limit = 50): Promise<typeof chatMessages.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId))).orderBy(chatMessages.createdAt).limit(limit);
}

// ---- Task Completion helpers ----
export async function saveTaskCompletion(
  userId: number,
  strategyId: number,
  taskId: string,
  taskTitle: string,
  stage: number,
  completed: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await persistTaskCompletionAtomic(db, {userId, strategyId, taskId, taskTitle, stage, completed});
}

export async function getTaskCompletions(
  userId: number,
  strategyId: number
): Promise<TaskCompletion[]> {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select()
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, userId),
        eq(taskCompletions.strategyId, strategyId)
      )
    );
  
  // Never return ambiguous duplicate completion records to the UI.
  const seen = new Set<string>();
  for (const completion of results) {
    if (seen.has(completion.taskId)) {
      throw new Error("Duplicate completion records require reviewed database remediation");
    }
    seen.add(completion.taskId);
  }
  return results;
}

export async function getTaskCompletion(
  userId: number,
  strategyId: number,
  taskId: string
): Promise<TaskCompletion | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const results = await db
    .select()
    .from(taskCompletions)
    .where(
      and(
        eq(taskCompletions.userId, userId),
        eq(taskCompletions.strategyId, strategyId),
        eq(taskCompletions.taskId, taskId)
      )
    )
    .limit(2);
  
  if (results.length > 1) throw new Error("Duplicate completion records require reviewed database remediation");
  return results[0];
}

// ---- Save & Resume Link helpers ----
export async function createSaveLink(data: InsertSaveLink): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(saveLinks).values(data);
  return Number(result[0].insertId);
}

export async function getSaveLinkByToken(token: string): Promise<SaveLink | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(saveLinks).where(eq(saveLinks.token, token)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markSaveLinkUsed(token: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(saveLinks).set({ used: true }).where(eq(saveLinks.token, token));
}

export async function canReadFile(fileKey: string, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const owned = await db.select({ key: portalFiles.fileKey }).from(portalFiles)
    .where(and(eq(portalFiles.fileKey, fileKey), eq(portalFiles.userId, userId))).limit(1);
  if (owned.length) return true;
  const legacy = await db.select({ id: documentUploads.id }).from(documentUploads)
    .where(and(eq(documentUploads.fileKey, fileKey), eq(documentUploads.userId, userId))).limit(1);
  return legacy.length > 0;
}
export async function registerFile(fileKey: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(portalFiles).values({ fileKey, userId });
}

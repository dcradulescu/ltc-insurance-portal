import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  policies, InsertPolicy, Policy,
  strategies, InsertStrategy, Strategy,
  chatMessages, InsertChatMessage,
  documentUploads, InsertDocumentUpload, DocumentUpload,
  userContacts, InsertUserContact, UserContact,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
  try {
    const result = await db.select().from(policies).where(eq(policies.userId, userId)).orderBy(desc(policies.updatedAt)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.warn("[Database] Error in getPolicyByUserId, falling back to safe query:", error);
    // Fallback: select only core columns that definitely exist
    const result = await db.select({
      id: policies.id,
      userId: policies.userId,
      insuredFullName: policies.insuredFullName,
      insuredEmail: policies.insuredEmail,
      insuredPhone: policies.insuredPhone,
      carrierName: policies.carrierName,
      policyNumber: policies.policyNumber,
      eliminationPeriod: policies.eliminationPeriod,
      dailyMaximum: policies.dailyMaximum,
      monthlyMaximum: policies.monthlyMaximum,
      lifetimeMaximum: policies.lifetimeMaximum,
      waiverOfPremium: policies.waiverOfPremium,
      adlLimitations: policies.adlLimitations,
      cognitiveImpairmentTrigger: policies.cognitiveImpairmentTrigger,
      minAdlsRequired: policies.minAdlsRequired,
      primaryDiagnosis: policies.primaryDiagnosis,
      createdAt: policies.createdAt,
      updatedAt: policies.updatedAt,
    }).from(policies).where(eq(policies.userId, userId)).orderBy(desc(policies.updatedAt)).limit(1);
    return result.length > 0 ? result[0] as any : undefined;
  }
}

export async function getPolicyById(id: number): Promise<Policy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(policies).where(eq(policies.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.warn("[Database] Error in getPolicyById, falling back to safe query:", error);
    // Fallback: select only core columns that definitely exist
    const result = await db.select({
      id: policies.id,
      userId: policies.userId,
      insuredFullName: policies.insuredFullName,
      insuredEmail: policies.insuredEmail,
      insuredPhone: policies.insuredPhone,
      carrierName: policies.carrierName,
      policyNumber: policies.policyNumber,
      eliminationPeriod: policies.eliminationPeriod,
      dailyMaximum: policies.dailyMaximum,
      monthlyMaximum: policies.monthlyMaximum,
      lifetimeMaximum: policies.lifetimeMaximum,
      waiverOfPremium: policies.waiverOfPremium,
      adlLimitations: policies.adlLimitations,
      cognitiveImpairmentTrigger: policies.cognitiveImpairmentTrigger,
      minAdlsRequired: policies.minAdlsRequired,
      primaryDiagnosis: policies.primaryDiagnosis,
      createdAt: policies.createdAt,
      updatedAt: policies.updatedAt,
    }).from(policies).where(eq(policies.id, id)).limit(1);
    return result.length > 0 ? result[0] as any : undefined;
  }
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

export async function updateStrategy(id: number, data: Partial<InsertStrategy>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(strategies).set(data).where(eq(strategies.id, id));
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
  if (!db) return [];
  return db.select().from(documentUploads).where(eq(documentUploads.userId, userId)).orderBy(desc(documentUploads.createdAt));
}

export async function getDocumentsByTaskId(taskId: string, userId: number): Promise<DocumentUpload[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentUploads).where(and(eq(documentUploads.taskId, taskId), eq(documentUploads.userId, userId)));
}

export async function deleteDocument(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentUploads).where(and(eq(documentUploads.id, id), eq(documentUploads.userId, userId)));
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

export async function getChatHistory(sessionId: string, limit = 50): Promise<typeof chatMessages.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt).limit(limit);
}

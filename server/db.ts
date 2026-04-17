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
  try {
    const result = await db.insert(policies).values(data);
    return Number(result[0].insertId);
  } catch (error: any) {
    // If insert fails due to missing equipmentAllowance column, try without it
    const errorMsg = error.message || error.cause?.message || '';
    if (errorMsg.includes('equipmentAllowance') || errorMsg.includes('Unknown column')) {
      console.warn('[Database] equipmentAllowance column missing, attempting insert without it');
      try {
        const { equipmentAllowance, ...dataWithoutEquipment } = data as any;
        const result = await db.insert(policies).values(dataWithoutEquipment);
        return Number(result[0].insertId);
      } catch (fallbackError) {
        console.error('[Database] Fallback insert also failed:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

export async function updatePolicy(id: number, userId: number, data: Partial<InsertPolicy>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.update(policies).set(data).where(and(eq(policies.id, id), eq(policies.userId, userId)));
  } catch (error: any) {
    // If update fails due to missing equipmentAllowance column, try without it
    const errorMsg = error.message || error.cause?.message || '';
    if (errorMsg.includes('equipmentAllowance') || errorMsg.includes('Unknown column')) {
      console.warn('[Database] equipmentAllowance column missing, attempting update without it');
      try {
        const { equipmentAllowance, ...dataWithoutEquipment } = data as any;
        await db.update(policies).set(dataWithoutEquipment).where(and(eq(policies.id, id), eq(policies.userId, userId)));
      } catch (fallbackError) {
        console.error('[Database] Fallback update also failed:', fallbackError);
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
}

export async function getPolicyByUserId(userId: number): Promise<Policy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(policies).where(eq(policies.userId, userId)).orderBy(desc(policies.updatedAt)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error: any) {
    // If query fails due to missing columns, try with a raw query
    const errorCode = error.code || error.cause?.code;
    const errorMsg = error.message || error.cause?.message || '';
    console.warn('[Database] getPolicyByUserId error:', errorCode, errorMsg);
    if (errorCode === 'ER_BAD_FIELD_ERROR' || errorMsg.includes('Unknown column')) {
      console.warn('[Database] Column mismatch in getPolicyByUserId, attempting fallback');
      try {
        const raw = await (db as any).execute(`SELECT * FROM policies WHERE userId = ? ORDER BY updatedAt DESC LIMIT 1`, [userId]);
        return raw[0] && raw[0][0] ? raw[0][0] : undefined;
      } catch (fallbackError) {
        console.error('[Database] Fallback query also failed:', fallbackError);
        return undefined;
      }
    }
    console.error('[Database] getPolicyByUserId throwing error:', error);
    throw error;
  }
}

export async function getPolicyById(id: number): Promise<Policy | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(policies).where(eq(policies.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error: any) {
    // If query fails due to missing columns, try with a raw query
    const errorCode = error.code || error.cause?.code;
    const errorMsg = error.message || error.cause?.message || '';
    console.warn('[Database] getPolicyById error:', errorCode, errorMsg);
    if (errorCode === 'ER_BAD_FIELD_ERROR' || errorMsg.includes('Unknown column')) {
      console.warn('[Database] Column mismatch in getPolicyById, attempting fallback');
      try {
        const raw = await (db as any).execute(`SELECT * FROM policies WHERE id = ? LIMIT 1`, [id]);
        return raw[0] && raw[0][0] ? raw[0][0] : undefined;
      } catch (fallbackError) {
        console.error('[Database] Fallback query also failed:', fallbackError);
        return undefined;
      }
    }
    console.error('[Database] getPolicyById throwing error:', error);
    throw error;
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

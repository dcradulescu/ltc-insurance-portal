import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const policies = mysqlTable("policies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Policy holder info
  holderFirstName: varchar("holderFirstName", { length: 255 }),
  holderLastName: varchar("holderLastName", { length: 255 }),
  holderDateOfBirth: varchar("holderDateOfBirth", { length: 32 }),
  holderRelationship: varchar("holderRelationship", { length: 128 }),
  // Policy details
  insuranceCompany: varchar("insuranceCompany", { length: 255 }),
  policyNumber: varchar("policyNumber", { length: 128 }),
  policyType: varchar("policyType", { length: 128 }),
  policyStatus: varchar("policyStatus", { length: 64 }),
  effectiveDate: varchar("effectiveDate", { length: 32 }),
  // Benefits
  dailyBenefitAmount: varchar("dailyBenefitAmount", { length: 64 }),
  benefitPeriod: varchar("benefitPeriod", { length: 128 }),
  eliminationPeriod: varchar("eliminationPeriod", { length: 128 }),
  inflationProtection: varchar("inflationProtection", { length: 128 }),
  homeCareCoverage: varchar("homeCareCoverage", { length: 8 }),
  facilityCareCoverage: varchar("facilityCareCoverage", { length: 8 }),
  // Current care needs
  currentCareNeeds: text("currentCareNeeds"),
  diagnosisOrCondition: text("diagnosisOrCondition"),
  adlLimitations: json("adlLimitations"),
  cognitiveImpairment: varchar("cognitiveImpairment", { length: 8 }),
  currentCareReceiving: text("currentCareReceiving"),
  preferredCareType: varchar("preferredCareType", { length: 128 }),
  // Additional info
  priorClaimsFiled: varchar("priorClaimsFiled", { length: 8 }),
  priorClaimsDetails: text("priorClaimsDetails"),
  additionalNotes: text("additionalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = typeof policies.$inferInsert;

export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  policyId: int("policyId").notNull(),
  strategyContent: text("strategyContent"),
  strategyHtml: text("strategyHtml"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const policies = mysqlTable("policies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),

  // === Holder/Insured Person Info ===
  holderFirstName: varchar("holderFirstName", { length: 255 }),
  holderLastName: varchar("holderLastName", { length: 255 }),
  holderDateOfBirth: varchar("holderDateOfBirth", { length: 32 }),
  holderRelationship: varchar("holderRelationship", { length: 128 }),
  insuredFullName: varchar("insuredFullName", { length: 255 }),
  insuredDob: varchar("insuredDob", { length: 32 }),
  insuredEmail: varchar("insuredEmail", { length: 320 }),
  insuredPhone: varchar("insuredPhone", { length: 32 }),
  insuredMailingAddress: text("insuredMailingAddress"),
  insuredSsn: varchar("insuredSsn", { length: 16 }),
  insuredMedicareNumber: varchar("insuredMedicareNumber", { length: 64 }),
  insuredMedicaidNumber: varchar("insuredMedicaidNumber", { length: 64 }),
  powerOfAttorneyPresent: varchar("powerOfAttorneyPresent", { length: 8 }),

  // === Insurance/Policy Info ===
  insuranceCompany: varchar("insuranceCompany", { length: 255 }),
  policyNumber: varchar("policyNumber", { length: 128 }),
  policyType: varchar("policyType", { length: 128 }),
  policyStatus: varchar("policyStatus", { length: 64 }),
  effectiveDate: varchar("effectiveDate", { length: 32 }),

  // === Carrier Info ===
  carrierName: varchar("carrierName", { length: 255 }),
  carrierAddress1: varchar("carrierAddress1", { length: 255 }),
  carrierAddress2: varchar("carrierAddress2", { length: 255 }),
  carrierCityStateZip: varchar("carrierCityStateZip", { length: 255 }),
  carrierPhone: varchar("carrierPhone", { length: 32 }),
  carrierFax: varchar("carrierFax", { length: 32 }),

  // === Policy Identifiers ===
  claimPreClaimNumber: varchar("claimPreClaimNumber", { length: 128 }),

  // === Coverage Details ===
  eliminationPeriod: varchar("eliminationPeriod", { length: 128 }),
  dailyBenefitAmount: varchar("dailyBenefitAmount", { length: 64 }),
  benefitPeriod: varchar("benefitPeriod", { length: 128 }),
  dailyMaximum: varchar("dailyMaximum", { length: 64 }),
  monthlyMaximum: varchar("monthlyMaximum", { length: 64 }),
  lifetimeMaximum: varchar("lifetimeMaximum", { length: 64 }),
  inflationProtection: varchar("inflationProtection", { length: 128 }),
  equipmentAllowance: varchar("equipmentAllowance", { length: 8 }).default("no"),
  homeCareCoverage: varchar("homeCareCoverage", { length: 8 }),
  facilityCareCoverage: varchar("facilityCareCoverage", { length: 8 }),

  // === ADL & Care Requirements ===
  minAdlsRequired: varchar("minAdlsRequired", { length: 16 }),
  adlLimitations: json("adlLimitations"),
  waiverOfPremium: varchar("waiverOfPremium", { length: 8 }),
  cnaRequired: varchar("cnaRequired", { length: 8 }),
  careNotesRequired: varchar("careNotesRequired", { length: 8 }),
  paymentCycle: varchar("paymentCycle", { length: 128 }),
  assignmentOfBenefits: varchar("assignmentOfBenefits", { length: 8 }),

  // === Medical / Administrative ===
  caseManagerName: varchar("caseManagerName", { length: 255 }),
  thirdPartyAssessmentRequired: varchar("thirdPartyAssessmentRequired", { length: 8 }),
  thirdPartyAssessmentWho: varchar("thirdPartyAssessmentWho", { length: 255 }),
  cognitiveImpairmentTrigger: varchar("cognitiveImpairmentTrigger", { length: 8 }),
  cognitiveImpairment: varchar("cognitiveImpairment", { length: 8 }),
  planOfCareStatus: varchar("planOfCareStatus", { length: 128 }),
  ltcCoordinatorAssigned: varchar("ltcCoordinatorAssigned", { length: 255 }),

  // === Medical Providers (JSON arrays) ===
  primaryCarePhysician: json("primaryCarePhysician"),
  otherProviders: json("otherProviders"),
  facilitiesUsed: json("facilitiesUsed"),
  dischargeDocumentation: varchar("dischargeDocumentation", { length: 8 }),

  // === Care Needs ===
  currentCareNeeds: text("currentCareNeeds"),
  currentCareReceiving: text("currentCareReceiving"),
  diagnosisOrCondition: text("diagnosisOrCondition"),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 255 }),
  priorClaimsFiled: varchar("priorClaimsFiled", { length: 8 }),
  priorClaimsDetails: text("priorClaimsDetails"),
  preferredCareType: varchar("preferredCareType", { length: 128 }),
  additionalNotes: text("additionalNotes"),

  // === Relationship of form filler ===
  fillerRelationship: varchar("fillerRelationship", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = typeof policies.$inferInsert;

export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  policyId: int("policyId").notNull(),
  currentStage: int("currentStage").default(1).notNull(),
  strategyContent: text("strategyContent"),
  strategyHtml: text("strategyHtml"),
  stage1Tasks: json("stage1Tasks"),
  stage2Tasks: json("stage2Tasks"),
  stage3Tasks: json("stage3Tasks"),
  checklistItems: json("checklistItems"),
  claimStatus: varchar("claimStatus", { length: 32 }).default("not_started"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

export type ChecklistItem = {
  id: string;
  title: string;
  section: string;
  completed: boolean;
  expandedContent?: string;
  notes?: string;
};

export const documentUploads = mysqlTable("documentUploads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  policyId: int("policyId"),
  strategyId: int("strategyId"),
  taskId: varchar("taskId", { length: 128 }),
  category: varchar("category", { length: 128 }).notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentUpload = typeof documentUploads.$inferSelect;
export type InsertDocumentUpload = typeof documentUploads.$inferInsert;

export const userContacts = mysqlTable("userContacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  relationship: varchar("relationship", { length: 128 }),
  receiveCcEmails: int("receiveCcEmails").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserContact = typeof userContacts.$inferSelect;
export type InsertUserContact = typeof userContacts.$inferInsert;

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

// === RAG Tables ===
export const ragDocuments = mysqlTable("ragDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  source: varchar("source", { length: 512 }),
  category: varchar("category", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RagDocument = typeof ragDocuments.$inferSelect;
export type InsertRagDocument = typeof ragDocuments.$inferInsert;

export const ragDocumentChunks = mysqlTable("ragDocumentChunks", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RagDocumentChunk = typeof ragDocumentChunks.$inferSelect;
export type InsertRagDocumentChunk = typeof ragDocumentChunks.$inferInsert;

// === Enhanced Chat Tables ===
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

export const chatMessagesEnhanced = mysqlTable("chatMessagesEnhanced", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId"),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessageEnhanced = typeof chatMessagesEnhanced.$inferSelect;
export type InsertChatMessageEnhanced = typeof chatMessagesEnhanced.$inferInsert;

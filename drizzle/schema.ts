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

  // === Insured Person Info ===
  insuredFullName: varchar("insuredFullName", { length: 255 }),
  insuredDob: varchar("insuredDob", { length: 32 }),
  insuredEmail: varchar("insuredEmail", { length: 320 }),
  insuredPhone: varchar("insuredPhone", { length: 32 }),
  insuredMailingAddress: text("insuredMailingAddress"),

  insuredMedicareNumber: varchar("insuredMedicareNumber", { length: 64 }),
  insuredMedicaidNumber: varchar("insuredMedicaidNumber", { length: 64 }),
  powerOfAttorneyPresent: varchar("powerOfAttorneyPresent", { length: 8 }),

  // === Carrier Info ===
  carrierName: varchar("carrierName", { length: 255 }),
  carrierAddress1: varchar("carrierAddress1", { length: 255 }),
  carrierAddress2: varchar("carrierAddress2", { length: 255 }),
  carrierCityStateZip: varchar("carrierCityStateZip", { length: 255 }),
  carrierPhone: varchar("carrierPhone", { length: 32 }),
  carrierFax: varchar("carrierFax", { length: 32 }),

  // === Policy Identifiers ===
  policyNumber: varchar("policyNumber", { length: 128 }),
  claimPreClaimNumber: varchar("claimPreClaimNumber", { length: 128 }),

  // === Coverage Details ===
  eliminationPeriod: varchar("eliminationPeriod", { length: 128 }),
  lookBackPeriodEnabled: boolean("lookBackPeriodEnabled").default(false),
  lookBackPeriodDays: varchar("lookBackPeriodDays", { length: 16 }),
  careCoordinatorReductionEnabled: boolean("careCoordinatorReductionEnabled").default(false),
  careCoordinatorReducedToDays: varchar("careCoordinatorReducedToDays", { length: 16 }),
  reductionInCareProvidedEnabled: boolean("reductionInCareProvidedEnabled").default(false),
  reductionInCareDaysCountedAs7: varchar("reductionInCareDaysCountedAs7", { length: 16 }),
  dailyMaximum: varchar("dailyMaximum", { length: 64 }),
  monthlyMaximum: varchar("monthlyMaximum", { length: 64 }),
  lifetimeMaximum: varchar("lifetimeMaximum", { length: 64 }),
  equipmentAllowanceEnabled: boolean("equipmentAllowanceEnabled").default(false),
  equipmentAllowanceAmount: varchar("equipmentAllowanceAmount", { length: 64 }),
  equipmentAllowanceCoverage: text("equipmentAllowanceCoverage"),
  equipmentAllowanceDeductedFromLifetime: varchar("equipmentAllowanceDeductedFromLifetime", { length: 8 }),
  inflationAdjustmentEnabled: boolean("inflationAdjustmentEnabled").default(false),
  inflationType: varchar("inflationType", { length: 32 }).default("none"),
  inflationPercentagePerYear: varchar("inflationPercentagePerYear", { length: 16 }),
  inflationContinuesAfterBenefits: boolean("inflationContinuesAfterBenefits").default(false),
  minAdlsRequired: varchar("minAdlsRequired", { length: 16 }),
  waiverOfPremium: varchar("waiverOfPremium", { length: 8 }),
  cnaRequired: varchar("cnaRequired", { length: 8 }),
  careNotesRequired: varchar("careNotesRequired", { length: 8 }),
  paymentCycle: varchar("paymentCycle", { length: 128 }),
  assignmentOfBenefits: varchar("assignmentOfBenefits", { length: 8 }),
  isHomeCareCovidInPolicy: varchar("isHomeCareCovidInPolicy", { length: 8 }),
  equipmentAllowanceRelatedAdls: json("equipmentAllowanceRelatedAdls"),

  // === Medical / Administrative ===
  caseManagerName: varchar("caseManagerName", { length: 255 }),
  thirdPartyAssessmentRequired: varchar("thirdPartyAssessmentRequired", { length: 8 }),
  thirdPartyAssessmentWho: varchar("thirdPartyAssessmentWho", { length: 255 }),
  cognitiveImpairmentTrigger: varchar("cognitiveImpairmentTrigger", { length: 8 }),
  planOfCareStatus: varchar("planOfCareStatus", { length: 128 }),
  ltcCoordinatorAssigned: varchar("ltcCoordinatorAssigned", { length: 255 }),

  // === Medical Providers (JSON arrays) ===
  primaryCarePhysician: json("primaryCarePhysician"),
  otherProviders: json("otherProviders"),
  facilitiesUsed: json("facilitiesUsed"),
  dischargeDocumentation: varchar("dischargeDocumentation", { length: 8 }),

  // === Care Needs ===
  currentCareNeeds: text("currentCareNeeds"),
  diagnosisOrCondition: text("diagnosisOrCondition"),
  primaryDiagnosis: varchar("primaryDiagnosis", { length: 255 }),
  adlLimitations: json("adlLimitations"),
  qualifyingAdls: json("qualifyingAdls"),
  careNeeds: json("careNeeds"),
  equipmentNeeds: json("equipmentNeeds"),
  preferredCareType: varchar("preferredCareType", { length: 128 }),
  additionalNotes: text("additionalNotes"),
  equipmentAllowanceNotes: text("equipmentAllowanceNotes"),

  // === Relationship of form filler ===
  fillerRelationship: varchar("fillerRelationship", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = typeof policies.$inferInsert;

export type EquipmentAllowance = {
  enabled: boolean;
  amount: string;
  coverage: string;
  deductedFromLifetime: boolean;
  relatedAdls: string[];
  equipmentNeeds: string[];
  notes: string;
};

export type InflationAdjustment = {
  enabled: boolean;
  type: "none" | "cpi" | "fixed_percentage";
  percentagePerYear?: number;
  continuesAfterBenefits: boolean;
};

// Helper function to extract equipment allowance from policy
export function getEquipmentAllowance(policy: Policy): EquipmentAllowance {
  return {
    enabled: policy.equipmentAllowanceEnabled || false,
    amount: policy.equipmentAllowanceAmount || "",
    coverage: policy.equipmentAllowanceCoverage || "",
    deductedFromLifetime: policy.equipmentAllowanceDeductedFromLifetime === "yes",
    relatedAdls: policy.equipmentAllowanceRelatedAdls ? (typeof policy.equipmentAllowanceRelatedAdls === "string" ? JSON.parse(policy.equipmentAllowanceRelatedAdls) : policy.equipmentAllowanceRelatedAdls) : [],
    equipmentNeeds: policy.equipmentNeeds ? (typeof policy.equipmentNeeds === "string" ? JSON.parse(policy.equipmentNeeds) : policy.equipmentNeeds) : [],
    notes: policy.equipmentAllowanceNotes || "",
  };
}

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
  checklistItems: json("checklistItems"), // Array of {id, title, section, completed, expandedContent, notes}
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
  section: string; // "review", "start_care", "physician_support", "home_care_records", "claim_packet", "claim_review", "continue_care"
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


// ===== RAG (Retrieval-Augmented Generation) Tables =====

export const ragDocuments = mysqlTable("ragDocuments", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(), // "policy_guide", "claim_process", "glossary", "faq", "best_practices"
  content: text("content").notNull(), // Full document text (mediumtext in DB)
  summary: text("summary"), // Brief summary for retrieval
  keywords: json("keywords"), // Array of keywords for semantic search
  embedding: text("embedding"), // Vector embedding (JSON stringified)
  source: varchar("source", { length: 255 }), // Where document came from
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type RAGDocument = typeof ragDocuments.$inferSelect;
export type InsertRAGDocument = typeof ragDocuments.$inferInsert;

// Chat sessions with multi-turn memory
export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  userId: int("userId"),
  policyId: int("policyId"), // Link to user's policy for context
  topic: varchar("topic", { length: 255 }), // Main topic of conversation
  summary: text("summary"), // AI-generated summary of conversation
  messageCount: int("messageCount").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  expiresAt: timestamp("expiresAt"), // Auto-expire old sessions
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

// Enhanced chat messages with metadata
export const chatMessagesEnhanced = mysqlTable("chatMessagesEnhanced", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  userId: int("userId"),
  role: varchar("role", { length: 16 }).notNull(), // "user", "assistant", "system"
  content: text("content").notNull(), // mediumtext in DB
  retrievedDocuments: json("retrievedDocuments"), // Array of {docId, title, relevanceScore}
  userContext: json("userContext"), // Snapshot of user's policy data at message time
  embedding: text("embedding"), // Vector embedding for semantic search
  createdAt: timestamp("createdAt").defaultNow(),
});

export type ChatMessageEnhanced = typeof chatMessagesEnhanced.$inferSelect;
export type InsertChatMessageEnhanced = typeof chatMessagesEnhanced.$inferInsert;

// RAG document chunks for efficient retrieval
export const ragDocumentChunks = mysqlTable("ragDocumentChunks", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  content: text("content").notNull(), // Chunk of text (e.g., 500 tokens)
  embedding: text("embedding"), // Vector embedding for semantic search
  startOffset: int("startOffset"), // Character offset in original document
  endOffset: int("endOffset"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type RAGDocumentChunk = typeof ragDocumentChunks.$inferSelect;
export type InsertRAGDocumentChunk = typeof ragDocumentChunks.$inferInsert;

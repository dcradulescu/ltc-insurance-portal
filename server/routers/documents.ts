import { TRPCError } from "@trpc/server";
import type { DocumentUpload } from "../../drizzle/schema";
import { requireOwnedPolicy, requireOwnedStrategy, owned } from "../_core/ownership";
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { isDocumentClaimEvidence } from "../claimMilestones";
import {
  createDocumentUpload,
  getDocumentsByUserId,
  getDocumentsByTaskId,
  deleteDocument,
  updateDocumentTaskLink,
} from "../db";

// Allowed file types and sizes
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 52428800; // 50MB
const MAX_FILE_SIZE_DISPLAY = "50MB";

// Document categories with requirements
const DOCUMENT_CATEGORIES = {
  MEDICAL_RECORDS: {
    name: "Medical Records",
    description: "Patient medical records and history",
    required: true,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  PHYSICIAN_ASSESSMENT: {
    name: "Physician Assessment",
    description: "Physician evaluation and assessment",
    required: true,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  PLAN_OF_CARE: {
    name: "Plan of Care",
    description: "Care plan documentation",
    required: true,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  INSURANCE_POLICY: {
    name: "Insurance Policy",
    description: "Long-term care insurance policy document",
    required: true,
    allowedTypes: ["application/pdf"],
  },
  PROOF_OF_PAYMENT: {
    name: "Proof of Payment",
    description: "Proof of premium payments",
    required: false,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  IDENTIFICATION: {
    name: "Identification",
    description: "Government-issued ID or Medicare card",
    required: false,
    allowedTypes: ["image/jpeg", "image/png"],
  },
  BANK_STATEMENTS: {
    name: "Bank Statements",
    description: "Financial documentation for claims",
    required: false,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  OTHER: {
    name: "Other",
    description: "Other supporting documentation",
    required: false,
    allowedTypes: ALLOWED_MIME_TYPES,
  },
};

// Ignore legacy/public URLs: every listed document goes through the ownership proxy.
function presentDocument(doc: DocumentUpload) {
  const key = doc.fileKey.split("/").map(encodeURIComponent).join("/");
  return { ...doc, fileUrl: `/storage/${key}?filename=${encodeURIComponent(doc.fileName)}`,
    status: "uploaded" as const, category: doc.category || "Other", uploadedAt: doc.createdAt };
}
function invalid(message: string): never { throw new TRPCError({ code: "BAD_REQUEST", message }); }

const taskInput = z.object({ strategyId: z.number().int().positive(), taskId: z.string().min(1).max(128) });
async function taskContext(strategyId: number, taskId: string, userId: number) {
  const strategy = await requireOwnedStrategy(strategyId, userId);
  const tasks = [strategy.stage1Tasks, strategy.stage2Tasks, strategy.stage3Tasks]
    .flatMap(stage => Array.isArray(stage) ? stage : []);
  const task = tasks.find(task => task && typeof task === "object" && task.id === taskId && typeof task.label === "string");
  if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Strategy task not found" });
  return { strategyId: strategy.id, policyId: strategy.policyId, taskId, taskLabel: task.label as string };
}

export const documentsRouter = router({
  /**
   * Upload a document with validation
   */
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string().trim().min(1).max(512).refine(name => !/[\x00-\x1f\x7f]/.test(name), "Filename contains unsupported characters"),
        fileData: z.string(), // base64
        mimeType: z.string(),
        category: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        taskId: z.string().min(1).max(128).optional(),
        policyId: z.number().int().positive().optional(),
        strategyId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        invalid(
          `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        );
      }

      // Validate file size
      if (input.fileData.length > Math.ceil(MAX_FILE_SIZE / 3) * 4) invalid("File exceeds 50 MB");
      const buffer = Buffer.from(input.fileData, "base64");
      if (buffer.length === 0) invalid("File is empty");
      if (buffer.toString("base64") !== input.fileData) invalid("Invalid file encoding");
      if (buffer.length > MAX_FILE_SIZE) {
        invalid(
          `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_DISPLAY}`
        );
      }

      // Validate category
      const categoryKey = Object.keys(DOCUMENT_CATEGORIES).find(
        (key) =>
          DOCUMENT_CATEGORIES[key as keyof typeof DOCUMENT_CATEGORIES].name ===
          input.category
      );

      if (!categoryKey) {
        invalid(`Invalid document category: ${input.category}`);
      }

      const category =
        DOCUMENT_CATEGORIES[categoryKey as keyof typeof DOCUMENT_CATEGORIES];

      // Check if file type is allowed for category
      if (!category.allowedTypes.includes(input.mimeType)) {
        invalid(
          `File type not allowed for ${category.name}. Allowed types: ${category.allowedTypes.join(", ")}`
        );
      }

      // Upload to S3
      const userId = ctx.user.id;
      const policy = input.policyId ? await requireOwnedPolicy(input.policyId, userId) : undefined;
      const strategy = input.strategyId ? await requireOwnedStrategy(input.strategyId, userId) : undefined;
      if (policy && strategy && strategy.policyId !== policy.id) invalid("Policy and strategy do not match");
      if (input.taskId && !input.strategyId) invalid("A strategy is required for a task attachment");
      if (input.taskId && input.strategyId) await taskContext(input.strategyId, input.taskId, userId);
      const fileKey = `users/${userId}/documents/${nanoid()}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType, userId);

      // Create document record
      const docId = await createDocumentUpload({
        userId,
        policyId: strategy?.policyId ?? input.policyId ?? null,
        strategyId: input.strategyId ?? null,
        taskId: input.taskId ?? null,
        category: input.category,
        fileName: input.fileName,
        fileUrl: url,
        fileKey,
        mimeType: input.mimeType,
        fileSize: buffer.length,
      });

      return {
        id: docId,
        url,
        fileName: input.fileName,
        fileSize: buffer.length,
        uploadedAt: new Date(),
        status: "uploaded",
      };
    }),

  /**
   * List all documents for user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const documents = await getDocumentsByUserId(ctx.user.id); // Account owner
    return documents.map(presentDocument);
  }),

  /**
   * List documents by category
   */
  listByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input, ctx }) => {
      const documents = await getDocumentsByUserId(ctx.user.id);
      return documents
        .filter((doc) => doc.category === input.category)
        .map(presentDocument);
    }),

  /**
   * List documents for specific task
   */
  listByTask: protectedProcedure
    .input(taskInput)
    .query(async ({ input, ctx }) => {
      await taskContext(input.strategyId, input.taskId, ctx.user.id);
      const documents = await getDocumentsByTaskId(input.taskId, ctx.user.id, input.strategyId);
      return documents.map(presentDocument);
    }),

  taskDocuments: protectedProcedure.input(taskInput).query(async ({ input, ctx }) => {
    const context = await taskContext(input.strategyId, input.taskId, ctx.user.id);
    const documents = await getDocumentsByTaskId(input.taskId, ctx.user.id, input.strategyId);
    return { ...context, documents: documents.map(presentDocument) };
  }),

  availableForTask: protectedProcedure.input(taskInput).query(async ({ input, ctx }) => {
    const task = await taskContext(input.strategyId, input.taskId, ctx.user.id);
    return (await getDocumentsByUserId(ctx.user.id))
      .filter(doc => doc.taskId === null && (doc.strategyId === null || doc.strategyId === task.strategyId)
        && (doc.policyId === null || doc.policyId === task.policyId)).map(presentDocument);
  }),

  attachToTask: protectedProcedure.input(taskInput.extend({ documentId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const task = await taskContext(input.strategyId, input.taskId, ctx.user.id);
      const doc = owned((await getDocumentsByUserId(ctx.user.id)).find(doc => doc.id === input.documentId), ctx.user.id);
      if (doc.policyId !== null && doc.policyId !== task.policyId) invalid("This document belongs to another policy");
      if (doc.strategyId === task.strategyId && doc.taskId === task.taskId && doc.policyId === task.policyId) return { success: true };
      if (await isDocumentClaimEvidence(ctx.user.id, doc.id)) {
        throw new TRPCError({ code: "CONFLICT", message: "This document is part of the recorded claim history and cannot be reassigned." });
      }
      if (doc.taskId !== null || (doc.strategyId !== null && doc.strategyId !== task.strategyId)) {
        throw new TRPCError({ code: "CONFLICT", message: "This document is already attached elsewhere. Refresh the list." });
      }
      if (!await updateDocumentTaskLink(doc, { policyId: task.policyId, strategyId: task.strategyId, taskId: task.taskId })) {
        throw new TRPCError({ code: "CONFLICT", message: "This document changed. Refresh the list before trying again." });
      }
      return { success: true };
    }),

  detachFromTask: protectedProcedure.input(taskInput.extend({ documentId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await requireOwnedStrategy(input.strategyId, ctx.user.id);
      const doc = owned((await getDocumentsByUserId(ctx.user.id)).find(doc => doc.id === input.documentId), ctx.user.id);
      if (doc.strategyId !== input.strategyId || doc.taskId !== input.taskId) {
        throw new TRPCError({ code: "CONFLICT", message: "This document is no longer attached to this task. Refresh the list." });
      }
      if (await isDocumentClaimEvidence(ctx.user.id, doc.id)) {
        throw new TRPCError({ code: "CONFLICT", message: "This document is part of the recorded claim history and cannot be detached." });
      }
      if (!await updateDocumentTaskLink(doc, { policyId: doc.policyId, strategyId: null, taskId: null })) {
        throw new TRPCError({ code: "CONFLICT", message: "This document changed. Refresh the list before trying again." });
      }
      return { success: true };
    }),

  /**
   * Get document details
   */
  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const documents = await getDocumentsByUserId(ctx.user.id);
      const doc = documents.find((d) => d.id === input.id);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });
      return presentDocument(doc);
    }),

  /**
   * Delete document
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      owned((await getDocumentsByUserId(ctx.user.id)).find(doc => doc.id === input.id), ctx.user.id);
      if (await isDocumentClaimEvidence(ctx.user.id, input.id)) {
        throw new TRPCError({ code: "CONFLICT", message: "This document supports the claim audit history and cannot be deleted." });
      }
      await deleteDocument(input.id, ctx.user.id); // Account owner
      return { success: true };
    }),

  /**
   * Get document categories
   */
  getCategories: protectedProcedure.query(() => {
    return Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => ({
      id: key,
      name: category.name,
      description: category.description,
      required: category.required,
      allowedTypes: category.allowedTypes,
    }));
  }),

  /**
   * Get upload requirements
   */
  getRequirements: protectedProcedure.query(() => {
    return {
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeDisplay: MAX_FILE_SIZE_DISPLAY,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      categories: Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => ({
        id: key,
        name: category.name,
        description: category.description,
        required: category.required,
        allowedTypes: category.allowedTypes,
      })),
    };
  }),

  /**
   * Validate file before upload
   */
  validateFile: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileSize: z.number().int().nonnegative(),
        mimeType: z.string(),
        category: z.string(),
      })
    )
    .query(({ input }) => {
      const errors: string[] = [];

      // Check file type
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        errors.push(
          `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        );
      }

      // Check file size
      if (input.fileSize === 0) errors.push("File is empty");
      if (input.fileSize > MAX_FILE_SIZE) {
        errors.push(
          `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_DISPLAY}`
        );
      }

      // Check category
      const categoryKey = Object.keys(DOCUMENT_CATEGORIES).find(
        (key) =>
          DOCUMENT_CATEGORIES[key as keyof typeof DOCUMENT_CATEGORIES].name ===
          input.category
      );

      if (!categoryKey) {
        errors.push(`Invalid document category: ${input.category}`);
      } else {
        const category =
          DOCUMENT_CATEGORIES[categoryKey as keyof typeof DOCUMENT_CATEGORIES];
        if (!category.allowedTypes.includes(input.mimeType)) {
          errors.push(
            `File type not allowed for ${category.name}. Allowed types: ${category.allowedTypes.join(", ")}`
          );
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    }),
});

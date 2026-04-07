import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import {
  createDocumentUpload,
  getDocumentsByUserId,
  getDocumentsByTaskId,
  deleteDocument,
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

export const documentsRouter = router({
  /**
   * Upload a document with validation
   */
  upload: publicProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(512),
        fileData: z.string(), // base64
        mimeType: z.string(),
        category: z.string(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        taskId: z.string().optional(),
        policyId: z.number().optional(),
        strategyId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
        throw new Error(
          `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
        );
      }

      // Validate file size
      const buffer = Buffer.from(input.fileData, "base64");
      if (buffer.length > MAX_FILE_SIZE) {
        throw new Error(
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
        throw new Error(`Invalid document category: ${input.category}`);
      }

      const category =
        DOCUMENT_CATEGORIES[categoryKey as keyof typeof DOCUMENT_CATEGORIES];

      // Check if file type is allowed for category
      if (!category.allowedTypes.includes(input.mimeType)) {
        throw new Error(
          `File type not allowed for ${category.name}. Allowed types: ${category.allowedTypes.join(", ")}`
        );
      }

      // Upload to S3
      const userId = 1; // Default public user
      const fileKey = `${userId}-docs/${nanoid()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Create document record
      const docId = await createDocumentUpload({
        userId,
        policyId: input.policyId ?? null,
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
  list: publicProcedure.query(async () => {
    const documents = await getDocumentsByUserId(1); // Default public user
    return documents.map((doc) => ({
      ...doc,
      status: "uploaded",
      category: doc.category || "Other",
      uploadedAt: doc.createdAt,
    }));
  }),

  /**
   * List documents by category
   */
  listByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const documents = await getDocumentsByUserId(1);
      return documents
        .filter((doc) => doc.category === input.category)
        .map((doc) => ({
          ...doc,
          status: "uploaded",
          uploadedAt: doc.createdAt,
        }));
    }),

  /**
   * List documents for specific task
   */
  listByTask: publicProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => {
      const documents = await getDocumentsByTaskId(input.taskId, 1);
      return documents.map((doc) => ({
        ...doc,
        status: "uploaded",
        uploadedAt: doc.createdAt,
      }));
    }),

  /**
   * Get document details
   */
  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const documents = await getDocumentsByUserId(1);
      const doc = documents.find((d) => d.id === input.id);
      if (!doc) {
        throw new Error("Document not found");
      }
      return {
        ...doc,
        status: "uploaded",
        uploadedAt: doc.createdAt,
      };
    }),

  /**
   * Delete document
   */
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteDocument(input.id, 1); // Default public user
      return { success: true };
    }),

  /**
   * Get document categories
   */
  getCategories: publicProcedure.query(() => {
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
  getRequirements: publicProcedure.query(() => {
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
  validateFile: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileSize: z.number(),
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

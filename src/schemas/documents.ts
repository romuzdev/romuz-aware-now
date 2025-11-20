/**
 * Document Validation Schemas
 * 
 * Zod schemas for documents and attachments forms
 */

import { z } from "zod";

/**
 * Create Document Schema
 */
export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  doc_type: z.enum(["policy", "procedure", "guideline", "form", "report", "other"] as const, {
    message: "Document type is required",
  }),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

/**
 * Upload Document Version Schema
 */
export const uploadVersionSchema = z.object({
  versionNumber: z
    .number()
    .int()
    .positive("Version number must be positive")
    .min(1, "Version number must be at least 1")
    .max(9999, "Version number too large"),
  file: z
    .instanceof(File, { message: "File is required" })
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine((file) => file.size <= 20 * 1024 * 1024, "File size must be less than 20MB"),
});

export type UploadVersionInput = z.infer<typeof uploadVersionSchema>;

/**
 * Upload Attachment Schema
 */
export const uploadAttachmentSchema = z.object({
  file: z
    .instanceof(File, { message: "File is required" })
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine((file) => file.size <= 20 * 1024 * 1024, "File size must be less than 20MB"),
  is_private: z.boolean().default(false),
});

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;

// lib/validation.ts

export interface ValidationError {
  field: string;
  message: string;
}

const VALID_PRIORITIES = ["low", "medium", "high"] as const;
const VALID_STATUSES = ["pending", "in-progress", "completed"] as const;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateCreateAssignment(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = body as Record<string, unknown>;

  if (!data?.title || typeof data.title !== "string" || data.title.trim().length === 0) {
    errors.push({ field: "title", message: "Title is required and must be a non-empty string." });
  } else if (data.title.trim().length > 200) {
    errors.push({ field: "title", message: "Title must not exceed 200 characters." });
  }

  if (!data?.subject || typeof data.subject !== "string" || data.subject.trim().length === 0) {
    errors.push({ field: "subject", message: "Subject is required and must be a non-empty string." });
  }

  if (data?.description !== undefined) {
    if (typeof data.description !== "string") {
      errors.push({ field: "description", message: "Description must be a string." });
    } else if (data.description.length > 2000) {
      errors.push({ field: "description", message: "Description must not exceed 2000 characters." });
    }
  }

  if (!data?.dueDate || typeof data.dueDate !== "string") {
    errors.push({ field: "dueDate", message: "Due date is required (format: YYYY-MM-DD)." });
  } else if (!DATE_REGEX.test(data.dueDate) || isNaN(Date.parse(data.dueDate))) {
    errors.push({ field: "dueDate", message: "Due date must be a valid date in YYYY-MM-DD format." });
  }

  if (!data?.priority) {
    errors.push({ field: "priority", message: "Priority is required (low | medium | high)." });
  } else if (!VALID_PRIORITIES.includes(data.priority as "low" | "medium" | "high")) {
    errors.push({ field: "priority", message: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}.` });
  }

  if (!data?.status) {
    errors.push({ field: "status", message: "Status is required (pending | in-progress | completed)." });
  } else if (!VALID_STATUSES.includes(data.status as "pending" | "in-progress" | "completed")) {
    errors.push({ field: "status", message: `Status must be one of: ${VALID_STATUSES.join(", ")}.` });
  }

  return errors;
}

export function validateUpdateAssignment(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = body as Record<string, unknown>;

  if (data?.title !== undefined) {
    if (typeof data.title !== "string" || data.title.trim().length === 0) {
      errors.push({ field: "title", message: "Title must be a non-empty string." });
    } else if (data.title.trim().length > 200) {
      errors.push({ field: "title", message: "Title must not exceed 200 characters." });
    }
  }

  if (data?.subject !== undefined && (typeof data.subject !== "string" || data.subject.trim().length === 0)) {
    errors.push({ field: "subject", message: "Subject must be a non-empty string." });
  }

  if (data?.description !== undefined) {
    if (typeof data.description !== "string") {
      errors.push({ field: "description", message: "Description must be a string." });
    } else if (data.description.length > 2000) {
      errors.push({ field: "description", message: "Description must not exceed 2000 characters." });
    }
  }

  if (data?.dueDate !== undefined) {
    if (typeof data.dueDate !== "string" || !DATE_REGEX.test(data.dueDate) || isNaN(Date.parse(data.dueDate))) {
      errors.push({ field: "dueDate", message: "Due date must be a valid date in YYYY-MM-DD format." });
    }
  }

  if (data?.priority !== undefined && !VALID_PRIORITIES.includes(data.priority as "low" | "medium" | "high")) {
    errors.push({ field: "priority", message: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}.` });
  }

  if (data?.status !== undefined && !VALID_STATUSES.includes(data.status as "pending" | "in-progress" | "completed")) {
    errors.push({ field: "status", message: `Status must be one of: ${VALID_STATUSES.join(", ")}.` });
  }

  return errors;
}

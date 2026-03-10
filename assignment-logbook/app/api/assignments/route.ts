// app/api/assignments/route.ts

/**
 * @swagger
 * /api/assignments:
 *   get:
 *     summary: List all assignments
 *     description: Retrieves a paginated list of all assignments with optional filtering by status, priority, or subject.
 *     tags: [Assignments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *         description: Number of results per page
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in-progress, completed] }
 *         description: Filter by assignment status
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *         description: Filter by priority level
 *       - in: query
 *         name: subject
 *         schema: { type: string }
 *         description: Filter by subject (partial match, case-insensitive)
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Assignment' }
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     summary: Create a new assignment
 *     description: Creates a new assignment entry in the log book.
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssignmentRequest'
 *           examples:
 *             example1:
 *               summary: High priority assignment
 *               value:
 *                 title: "Final Project - Microservices Architecture"
 *                 subject: "Software Engineering"
 *                 description: "Design and implement a microservices-based e-commerce platform"
 *                 dueDate: "2026-04-15"
 *                 priority: "high"
 *                 status: "pending"
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Assignment' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

import { NextRequest } from "next/server";
import { getAllAssignments, createAssignment } from "@/lib/store";
import { validateCreateAssignment } from "@/lib/validation";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page") ?? "1";
    const limitParam = searchParams.get("limit") ?? "10";
    const status = searchParams.get("status") ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;
    const subject = searchParams.get("subject") ?? undefined;

    const page = parseInt(pageParam, 10);
    const limit = Math.min(parseInt(limitParam, 10), 100);

    if (isNaN(page) || page < 1) {
      return errorResponse("Invalid page parameter. Must be a positive integer.", 400);
    }
    if (isNaN(limit) || limit < 1) {
      return errorResponse("Invalid limit parameter. Must be between 1 and 100.", 400);
    }

    // Validate filter enums
    if (status && !["pending", "in-progress", "completed"].includes(status)) {
      return errorResponse("Invalid status filter. Must be: pending | in-progress | completed.", 400);
    }
    if (priority && !["low", "medium", "high"].includes(priority)) {
      return errorResponse("Invalid priority filter. Must be: low | medium | high.", 400);
    }

    const allFiltered = getAllAssignments({ status, priority, subject });
    const total = allFiltered.length;
    const start = (page - 1) * limit;
    const paginated = allFiltered.slice(start, start + limit);

    return paginatedResponse(paginated, "Assignments retrieved successfully.", {
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("GET /api/assignments error:", err);
    return errorResponse("Internal server error.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body.", 400);
    }

    const errors = validateCreateAssignment(body);
    if (errors.length > 0) {
      return errorResponse("Validation failed.", 400, errors);
    }

    const data = body as {
      title: string;
      subject: string;
      description: string;
      dueDate: string;
      priority: "low" | "medium" | "high";
      status: "pending" | "in-progress" | "completed";
    };

    const assignment = createAssignment({
      title: data.title.trim(),
      subject: data.subject.trim(),
      description: data.description?.trim() ?? "",
      dueDate: data.dueDate,
      priority: data.priority,
      status: data.status,
    });

    return successResponse(assignment, "Assignment created successfully.", 201);
  } catch (err) {
    console.error("POST /api/assignments error:", err);
    return errorResponse("Internal server error.", 500);
  }
}

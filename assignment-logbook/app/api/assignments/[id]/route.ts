// app/api/assignments/[id]/route.ts

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Get an assignment by ID
 *     description: Retrieves a single assignment by its unique ID.
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Unique assignment ID
 *         example: asgn-001
 *     responses:
 *       200:
 *         description: Assignment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Assignment' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Update an assignment
 *     description: Updates one or more fields of an existing assignment. All fields are optional.
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Unique assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAssignmentRequest'
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { $ref: '#/components/schemas/Assignment' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   delete:
 *     summary: Delete an assignment
 *     description: Permanently removes an assignment from the log book.
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Unique assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

import { NextRequest } from "next/server";
import { getAssignmentById, updateAssignment, deleteAssignment } from "@/lib/store";
import { validateUpdateAssignment } from "@/lib/validation";
import { successResponse, errorResponse } from "@/lib/response";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const assignment = getAssignmentById(params.id);
    if (!assignment) {
      return errorResponse(`Assignment with ID '${params.id}' not found.`, 404);
    }
    return successResponse(assignment, "Assignment retrieved successfully.");
  } catch (err) {
    console.error(`GET /api/assignments/${params.id} error:`, err);
    return errorResponse("Internal server error.", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const existing = getAssignmentById(params.id);
    if (!existing) {
      return errorResponse(`Assignment with ID '${params.id}' not found.`, 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body.", 400);
    }

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return errorResponse("Request body must contain at least one field to update.", 400);
    }

    const errors = validateUpdateAssignment(body);
    if (errors.length > 0) {
      return errorResponse("Validation failed.", 400, errors);
    }

    const updated = updateAssignment(params.id, body as Record<string, unknown>);
    return successResponse(updated, "Assignment updated successfully.");
  } catch (err) {
    console.error(`PUT /api/assignments/${params.id} error:`, err);
    return errorResponse("Internal server error.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const existing = getAssignmentById(params.id);
    if (!existing) {
      return errorResponse(`Assignment with ID '${params.id}' not found.`, 404);
    }
    deleteAssignment(params.id);
    return successResponse({ id: params.id }, "Assignment deleted successfully.");
  } catch (err) {
    console.error(`DELETE /api/assignments/${params.id} error:`, err);
    return errorResponse("Internal server error.", 500);
  }
}

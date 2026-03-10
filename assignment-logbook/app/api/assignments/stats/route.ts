// app/api/assignments/stats/route.ts

/**
 * @swagger
 * /api/assignments/stats:
 *   get:
 *     summary: Get assignment statistics
 *     description: Returns aggregate statistics about all assignments in the log book.
 *     tags: [Assignments]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: integer, description: "Total number of assignments" }
 *                     pending: { type: integer }
 *                     inProgress: { type: integer }
 *                     completed: { type: integer }
 *                     highPriority: { type: integer }
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

import { getStats } from "@/lib/store";
import { successResponse, errorResponse } from "@/lib/response";

export async function GET() {
  try {
    const stats = getStats();
    return successResponse(stats, "Statistics retrieved successfully.");
  } catch (err) {
    console.error("GET /api/assignments/stats error:", err);
    return errorResponse("Internal server error.", 500);
  }
}

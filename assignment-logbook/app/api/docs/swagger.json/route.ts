// app/api/docs/swagger.json/route.ts
import { NextResponse } from "next/server";

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Claude Assignment Log Book API",
    version: "1.0.0",
    description:
      "A RESTful API for managing student assignment logs built with Next.js 14 App Router. Supports creating, reading, updating, and deleting assignments with filtering and pagination.",
    contact: {
      name: "Claude",
      email: "claude@anthropic.com",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  tags: [
    {
      name: "Assignments",
      description: "Operations for managing assignment entries in the log book",
    },
  ],
  paths: {
    "/api/assignments": {
      get: {
        summary: "List all assignments",
        description:
          "Retrieves a paginated list of assignments. Supports filtering by status, priority, and subject.",
        tags: ["Assignments"],
        operationId: "listAssignments",
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "Page number (1-based)",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 10, minimum: 1, maximum: 100 },
            description: "Number of items per page",
          },
          {
            in: "query",
            name: "status",
            schema: { type: "string", enum: ["pending", "in-progress", "completed"] },
            description: "Filter by status",
          },
          {
            in: "query",
            name: "priority",
            schema: { type: "string", enum: ["low", "medium", "high"] },
            description: "Filter by priority",
          },
          {
            in: "query",
            name: "subject",
            schema: { type: "string" },
            description: "Filter by subject (partial, case-insensitive)",
          },
        ],
        responses: {
          "200": {
            description: "Assignments retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Assignments retrieved successfully." },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Assignment" },
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
                examples: {
                  success: {
                    summary: "Successful response with 2 assignments",
                    value: {
                      success: true,
                      message: "Assignments retrieved successfully.",
                      data: [
                        {
                          id: "asgn-001",
                          title: "REST API Design & Documentation",
                          subject: "Web Development",
                          description: "Design and implement a RESTful API using Next.js",
                          dueDate: "2026-03-20",
                          priority: "high",
                          status: "in-progress",
                          createdAt: "2026-03-01T08:00:00.000Z",
                          updatedAt: "2026-03-05T10:30:00.000Z",
                        },
                      ],
                      meta: {
                        total: 5,
                        page: 1,
                        limit: 10,
                        totalPages: 1,
                        hasNextPage: false,
                        hasPrevPage: false,
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
      post: {
        summary: "Create a new assignment",
        description: "Creates a new assignment entry in the log book.",
        tags: ["Assignments"],
        operationId: "createAssignment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAssignmentRequest" },
              examples: {
                valid: {
                  summary: "Valid assignment creation",
                  value: {
                    title: "Final Project - Microservices Architecture",
                    subject: "Software Engineering",
                    description:
                      "Design and implement a microservices-based e-commerce platform using Docker and Kubernetes.",
                    dueDate: "2026-04-15",
                    priority: "high",
                    status: "pending",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Assignment created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Assignment" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/assignments/stats": {
      get: {
        summary: "Get assignment statistics",
        description: "Returns aggregate counts by status and priority.",
        tags: ["Assignments"],
        operationId: "getAssignmentStats",
        responses: {
          "200": {
            description: "Statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Stats" },
                  },
                },
                examples: {
                  success: {
                    value: {
                      success: true,
                      message: "Statistics retrieved successfully.",
                      data: {
                        total: 5,
                        pending: 2,
                        inProgress: 2,
                        completed: 1,
                        highPriority: 2,
                      },
                    },
                  },
                },
              },
            },
          },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/api/assignments/{id}": {
      get: {
        summary: "Get an assignment by ID",
        tags: ["Assignments"],
        operationId: "getAssignmentById",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            example: "asgn-001",
          },
        ],
        responses: {
          "200": {
            description: "Assignment retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Assignment" },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
      put: {
        summary: "Update an assignment",
        description: "Updates one or more fields. All body fields are optional.",
        tags: ["Assignments"],
        operationId: "updateAssignment",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            example: "asgn-001",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateAssignmentRequest" },
              examples: {
                statusUpdate: {
                  summary: "Update only the status",
                  value: { status: "completed" },
                },
                fullUpdate: {
                  summary: "Update multiple fields",
                  value: {
                    title: "Updated Assignment Title",
                    priority: "high",
                    status: "in-progress",
                    dueDate: "2026-04-20",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Assignment updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/Assignment" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
      delete: {
        summary: "Delete an assignment",
        description: "Permanently removes an assignment from the log book.",
        tags: ["Assignments"],
        operationId: "deleteAssignment",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
            example: "asgn-001",
          },
        ],
        responses: {
          "200": {
            description: "Assignment deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
  },
  components: {
    schemas: {
      Assignment: {
        type: "object",
        properties: {
          id: { type: "string", example: "asgn-001", description: "Unique identifier" },
          title: { type: "string", example: "REST API Design & Documentation", maxLength: 200 },
          subject: { type: "string", example: "Web Development" },
          description: { type: "string", example: "Build a full REST API with Next.js", maxLength: 2000 },
          dueDate: { type: "string", format: "date", example: "2026-03-20" },
          priority: { type: "string", enum: ["low", "medium", "high"], example: "high" },
          status: { type: "string", enum: ["pending", "in-progress", "completed"], example: "in-progress" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "title", "subject", "dueDate", "priority", "status", "createdAt", "updatedAt"],
      },
      CreateAssignmentRequest: {
        type: "object",
        required: ["title", "subject", "dueDate", "priority", "status"],
        properties: {
          title: { type: "string", example: "Final Project", maxLength: 200 },
          subject: { type: "string", example: "Software Engineering" },
          description: { type: "string", example: "Build a microservices app", maxLength: 2000 },
          dueDate: { type: "string", format: "date", example: "2026-04-15" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          status: { type: "string", enum: ["pending", "in-progress", "completed"] },
        },
      },
      UpdateAssignmentRequest: {
        type: "object",
        description: "All fields are optional for partial updates",
        properties: {
          title: { type: "string", maxLength: 200 },
          subject: { type: "string" },
          description: { type: "string", maxLength: 2000 },
          dueDate: { type: "string", format: "date" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          status: { type: "string", enum: ["pending", "in-progress", "completed"] },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          total: { type: "integer", example: 25 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          totalPages: { type: "integer", example: 3 },
          hasNextPage: { type: "boolean", example: true },
          hasPrevPage: { type: "boolean", example: false },
        },
      },
      Stats: {
        type: "object",
        properties: {
          total: { type: "integer" },
          pending: { type: "integer" },
          inProgress: { type: "integer" },
          completed: { type: "integer" },
          highPriority: { type: "integer" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed." },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: "Bad request — validation error or malformed input",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            examples: {
              validationError: {
                summary: "Validation failed",
                value: {
                  success: false,
                  message: "Validation failed.",
                  details: [
                    { field: "title", message: "Title is required and must be a non-empty string." },
                    { field: "dueDate", message: "Due date must be a valid date in YYYY-MM-DD format." },
                  ],
                },
              },
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            examples: {
              notFound: {
                value: {
                  success: false,
                  message: "Assignment with ID 'asgn-999' not found.",
                },
              },
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            examples: {
              serverError: {
                value: { success: false, message: "Internal server error." },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(swaggerSpec);
}

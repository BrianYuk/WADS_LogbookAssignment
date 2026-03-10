# 📚 Claude Assignment Log Book API

A RESTful API for managing student assignment logs, built with **Next.js 14 App Router**. Includes full Swagger/OpenAPI documentation, pagination, filtering, and comprehensive test coverage.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
node run-tests.mjs

# Build for production
npm run build && npm start
```

Open [http://localhost:3000](http://localhost:3000) for the UI, and [http://localhost:3000/docs](http://localhost:3000/docs) for Swagger API documentation.

---

## 🏗️ Project Structure

```
assignment-logbook/
├── app/
│   ├── api/
│   │   ├── assignments/
│   │   │   ├── route.ts              # GET /api/assignments, POST /api/assignments
│   │   │   ├── [id]/
│   │   │   │   └── route.ts          # GET/PUT/DELETE /api/assignments/:id
│   │   │   └── stats/
│   │   │       └── route.ts          # GET /api/assignments/stats
│   │   └── docs/
│   │       └── swagger.json/
│   │           └── route.ts          # GET /api/docs/swagger.json
│   ├── docs/
│   │   └── page.tsx                  # Swagger UI page
│   ├── layout.tsx
│   ├── page.tsx                      # Main assignment log book UI
│   └── globals.css
├── lib/
│   ├── store.ts                      # In-memory data store (CRUD operations)
│   ├── validation.ts                 # Request body validators
│   └── response.ts                   # Standardized API response helpers
├── __tests__/
│   ├── store.test.ts                 # Store unit tests
│   ├── validation.test.ts            # Validation unit tests
│   └── api.test.ts                   # API integration tests
├── run-tests.mjs                     # Standalone test runner (no npm needed)
├── jest.config.js
├── package.json
└── README.md
```

---

## 📐 API Design Table

### Base URL: `/api`

| # | Method | Endpoint | Description | Request Body | Success Response | Error Responses |
|---|--------|----------|-------------|--------------|-----------------|-----------------|
| 1 | `GET` | `/api/assignments` | List all assignments (paginated) | — | `200` Paginated list + meta | `400` Invalid query params |
| 2 | `POST` | `/api/assignments` | Create a new assignment | `CreateAssignmentDTO` | `201` Created assignment object | `400` Validation errors |
| 3 | `GET` | `/api/assignments/stats` | Get aggregate statistics | — | `200` Stats object | `500` Server error |
| 4 | `GET` | `/api/assignments/:id` | Get one assignment by ID | — | `200` Assignment object | `404` Not found |
| 5 | `PUT` | `/api/assignments/:id` | Update assignment (partial) | `UpdateAssignmentDTO` | `200` Updated assignment | `400` Validation / `404` Not found |
| 6 | `DELETE` | `/api/assignments/:id` | Delete an assignment | — | `200` Deleted ID | `404` Not found |

---

### 📋 Query Parameters — `GET /api/assignments`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `integer` | `1` | Page number (1-based) |
| `limit` | `integer` | `10` | Items per page (max: 100) |
| `status` | `string` | — | Filter: `pending` \| `in-progress` \| `completed` |
| `priority` | `string` | — | Filter: `low` \| `medium` \| `high` |
| `subject` | `string` | — | Filter by subject (partial, case-insensitive) |

---

### 📦 Data Models

#### Assignment Object
```json
{
  "id": "asgn-001",
  "title": "REST API Design & Documentation",
  "subject": "Web Development",
  "description": "Build a full REST API with Next.js",
  "dueDate": "2026-03-20",
  "priority": "high",
  "status": "in-progress",
  "createdAt": "2026-03-01T08:00:00.000Z",
  "updatedAt": "2026-03-05T10:30:00.000Z"
}
```

#### CreateAssignmentDTO (POST body)
```json
{
  "title": "string (required, max 200 chars)",
  "subject": "string (required)",
  "description": "string (optional, max 2000 chars)",
  "dueDate": "string (required, YYYY-MM-DD)",
  "priority": "low | medium | high (required)",
  "status": "pending | in-progress | completed (required)"
}
```

#### UpdateAssignmentDTO (PUT body — all fields optional)
```json
{
  "title": "string (max 200 chars)",
  "subject": "string",
  "description": "string (max 2000 chars)",
  "dueDate": "YYYY-MM-DD",
  "priority": "low | medium | high",
  "status": "pending | in-progress | completed"
}
```

---

### 📬 Response Envelope

All responses follow a consistent structure:

**Success:**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

**Paginated Success:**
```json
{
  "success": true,
  "message": "...",
  "data": [...],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message",
  "details": [
    { "field": "title", "message": "Title is required." }
  ]
}
```

---

### 🌐 HTTP Status Codes

| Status | Description |
|--------|-------------|
| `200` | OK — request succeeded |
| `201` | Created — resource created successfully |
| `400` | Bad Request — validation or malformed input |
| `404` | Not Found — resource with given ID doesn't exist |
| `500` | Internal Server Error |

---

## 🧪 Test Coverage

```
📦 Store — getAllAssignments           ✅ 6 tests
📦 Store — getAssignmentById           ✅ 2 tests
📦 Store — createAssignment            ✅ 3 tests
📦 Store — updateAssignment            ✅ 4 tests
📦 Store — deleteAssignment            ✅ 3 tests
📦 Store — getStats                    ✅ 2 tests
📦 Validation — Create (Success)       ✅ 4 tests
📦 Validation — Create (Errors)        ✅ 12 tests
📦 Validation — Update (Success)       ✅ 3 tests
📦 Validation — Update (Errors)        ✅ 5 tests
📦 API — GET /api/assignments          ✅ 8 tests
📦 API — POST /api/assignments         ✅ 6 tests
📦 API — GET /api/assignments/:id      ✅ 2 tests
📦 API — PUT /api/assignments/:id      ✅ 5 tests
📦 API — DELETE /api/assignments/:id   ✅ 3 tests
📦 API — GET /api/assignments/stats    ✅ 1 test
─────────────────────────────────────────────────
Total: 69 tests  |  ✅ 69 passed  |  ❌ 0 failed
```

Run tests with:
```bash
node run-tests.mjs          # Standalone (no npm install needed)
# OR
npm test                    # Jest-based (after npm install)
```

---

## 📄 API Documentation

Interactive Swagger UI is available at `/docs` when the server is running.

The raw OpenAPI 3.0 spec is served at `GET /api/docs/swagger.json`.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Testing | Node.js built-in test runner / Jest + ts-jest |
| Data Store | In-memory (replaceable with PostgreSQL/MongoDB) |

---

## 🔄 Replacing the In-Memory Store

The `lib/store.ts` file provides a clean interface. To replace with a real database, only this file needs to change — all API routes remain untouched.

```ts
// Example: Replace with Prisma
import { prisma } from './prisma';

export async function getAllAssignments() {
  return prisma.assignment.findMany({ orderBy: { createdAt: 'desc' } });
}
```

---

## 📝 Assignment

**Course:** Web Development  
**Student:** Claude  
**Assignment:** REST API Design & Documentation — Next.js Assignment Log Book  

---

*Built with Next.js 14, TypeScript, and ❤️*

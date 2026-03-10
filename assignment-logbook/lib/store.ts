// lib/store.ts
// In-memory data store (simulates a database)
// In production, replace with a real DB like PostgreSQL, MongoDB, etc.

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;       // ISO date string
  priority: "low" | "medium" | "high";
  status: "pending" | "in-progress" | "completed";
  createdAt: string;     // ISO datetime string
  updatedAt: string;     // ISO datetime string
}

export type CreateAssignmentDTO = Omit<Assignment, "id" | "createdAt" | "updatedAt">;
export type UpdateAssignmentDTO = Partial<CreateAssignmentDTO>;

// Seed data
let assignments: Assignment[] = [
  {
    id: "asgn-001",
    title: "REST API Design & Documentation",
    subject: "Web Development",
    description: "Design and implement a RESTful API using Next.js with full Swagger documentation.",
    dueDate: "2026-03-20",
    priority: "high",
    status: "in-progress",
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-05T10:30:00.000Z",
  },
  {
    id: "asgn-002",
    title: "Database Normalization Report",
    subject: "Database Systems",
    description: "Write a comprehensive report on 1NF, 2NF, 3NF, and BCNF normalization with real-world examples.",
    dueDate: "2026-03-25",
    priority: "medium",
    status: "pending",
    createdAt: "2026-03-02T09:15:00.000Z",
    updatedAt: "2026-03-02T09:15:00.000Z",
  },
  {
    id: "asgn-003",
    title: "Algorithm Analysis - Big O Notation",
    subject: "Data Structures & Algorithms",
    description: "Analyze the time and space complexity of sorting algorithms: QuickSort, MergeSort, HeapSort.",
    dueDate: "2026-03-15",
    priority: "high",
    status: "completed",
    createdAt: "2026-02-28T07:00:00.000Z",
    updatedAt: "2026-03-10T16:45:00.000Z",
  },
  {
    id: "asgn-004",
    title: "UI/UX Prototype for Mobile App",
    subject: "Human-Computer Interaction",
    description: "Create a high-fidelity prototype for a task management mobile app using Figma.",
    dueDate: "2026-04-01",
    priority: "low",
    status: "pending",
    createdAt: "2026-03-03T11:20:00.000Z",
    updatedAt: "2026-03-03T11:20:00.000Z",
  },
  {
    id: "asgn-005",
    title: "Network Security Vulnerability Assessment",
    subject: "Cybersecurity",
    description: "Perform a vulnerability assessment on a sample network topology using OWASP guidelines.",
    dueDate: "2026-03-30",
    priority: "medium",
    status: "in-progress",
    createdAt: "2026-03-04T13:00:00.000Z",
    updatedAt: "2026-03-08T14:00:00.000Z",
  },
];

// ── CRUD Operations ──────────────────────────────────────────────

export function getAllAssignments(filters?: {
  status?: string;
  priority?: string;
  subject?: string;
}): Assignment[] {
  let result = [...assignments];

  if (filters?.status) {
    result = result.filter((a) => a.status === filters.status);
  }
  if (filters?.priority) {
    result = result.filter((a) => a.priority === filters.priority);
  }
  if (filters?.subject) {
    result = result.filter((a) =>
      a.subject.toLowerCase().includes(filters.subject!.toLowerCase())
    );
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getAssignmentById(id: string): Assignment | undefined {
  return assignments.find((a) => a.id === id);
}

export function createAssignment(data: CreateAssignmentDTO): Assignment {
  const now = new Date().toISOString();
  const newAssignment: Assignment = {
    id: `asgn-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  assignments.push(newAssignment);
  return newAssignment;
}

export function updateAssignment(
  id: string,
  data: UpdateAssignmentDTO
): Assignment | undefined {
  const index = assignments.findIndex((a) => a.id === id);
  if (index === -1) return undefined;

  assignments[index] = {
    ...assignments[index],
    ...data,
    id: assignments[index].id,       // prevent id overwrite
    createdAt: assignments[index].createdAt, // prevent createdAt overwrite
    updatedAt: new Date().toISOString(),
  };
  return assignments[index];
}

export function deleteAssignment(id: string): boolean {
  const index = assignments.findIndex((a) => a.id === id);
  if (index === -1) return false;
  assignments.splice(index, 1);
  return true;
}

export function getStats() {
  return {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    inProgress: assignments.filter((a) => a.status === "in-progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
    highPriority: assignments.filter((a) => a.priority === "high").length,
  };
}

// For test resets
export function _resetStore(data: Assignment[] = []) {
  assignments = [...data];
}

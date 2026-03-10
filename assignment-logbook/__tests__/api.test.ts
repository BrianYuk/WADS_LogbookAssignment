// __tests__/api.test.ts
// Tests the route handler logic via direct function invocation

import { NextRequest } from 'next/server';
import { _resetStore, Assignment } from '../lib/store';

// ── Helpers ───────────────────────────────────────────────────

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return new NextRequest(url, init);
}

async function parseResponse(res: Response) {
  return res.json();
}

// ── Seed data ─────────────────────────────────────────────────

const seed: Assignment[] = [
  {
    id: 'asgn-001',
    title: 'REST API Design',
    subject: 'Web Development',
    description: 'Build an API',
    dueDate: '2026-04-01',
    priority: 'high',
    status: 'in-progress',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'asgn-002',
    title: 'Database Report',
    subject: 'Database Systems',
    description: 'Write a report',
    dueDate: '2026-04-15',
    priority: 'medium',
    status: 'pending',
    createdAt: '2026-03-02T08:00:00.000Z',
    updatedAt: '2026-03-02T08:00:00.000Z',
  },
];

// ── GET /api/assignments ───────────────────────────────────────

describe('GET /api/assignments', () => {
  beforeEach(() => _resetStore([...seed]));

  it('[SUCCESS] returns paginated list of assignments', async () => {
    const { GET } = await import('../app/api/assignments/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments?page=1&limit=10');
    const res = await GET(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.meta).toBeDefined();
    expect(body.meta.total).toBe(2);
  });

  it('[SUCCESS] filters by status=pending', async () => {
    const { GET } = await import('../app/api/assignments/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments?status=pending');
    const res = await GET(req);
    const body = await parseResponse(res);

    expect(body.success).toBe(true);
    expect(body.data.every((a: Assignment) => a.status === 'pending')).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it('[SUCCESS] filters by priority=high', async () => {
    const { GET } = await import('../app/api/assignments/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments?priority=high');
    const res = await GET(req);
    const body = await parseResponse(res);

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].priority).toBe('high');
  });

  it('[SUCCESS] returns empty array when no match', async () => {
    const { GET } = await import('../app/api/assignments/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments?status=completed');
    const res = await GET(req);
    const body = await parseResponse(res);

    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(0);
  });

  it('[SUCCESS] paginates correctly (page 2)', async () => {
    _resetStore([...seed, { ...seed[0], id: 'asgn-003' }]);
    const { GET } = await import('../app/api/assignments/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments?page=2&limit=2');
    const res = await GET(req);
    const body = await parseResponse(res);

    expect(body.meta.page).toBe(2);
    expect(body.data).toHaveLength(1);
    expect(body.meta.hasPrevPage).toBe(true);
  });

  it('[ERROR] returns 400 for invalid page parameter', async () => {
    const { GET } = await import('../app/api/assignments/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments?page=abc');
    const res = await GET(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('[ERROR] returns 400 for invalid status filter', async () => {
    const { GET } = await import('../app/api/assignments/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments?status=archived');
    const res = await GET(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ── POST /api/assignments ──────────────────────────────────────

describe('POST /api/assignments', () => {
  beforeEach(() => _resetStore([...seed]));

  it('[SUCCESS] creates a new assignment', async () => {
    const { POST } = await import('../app/api/assignments/route');
    const req = makeRequest('POST', 'http://localhost/api/assignments', {
      title: 'New Assignment',
      subject: 'Computer Science',
      description: 'Build something cool',
      dueDate: '2026-05-01',
      priority: 'medium',
      status: 'pending',
    });
    const res = await POST(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.title).toBe('New Assignment');
    expect(body.data.createdAt).toBeDefined();
  });

  it('[ERROR] returns 400 when title is missing', async () => {
    const { POST } = await import('../app/api/assignments/route');
    const req = makeRequest('POST', 'http://localhost/api/assignments', {
      subject: 'Math',
      dueDate: '2026-05-01',
      priority: 'low',
      status: 'pending',
    });
    const res = await POST(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.details).toBeDefined();
    expect(body.details.some((e: { field: string }) => e.field === 'title')).toBe(true);
  });

  it('[ERROR] returns 400 for invalid priority', async () => {
    const { POST } = await import('../app/api/assignments/route');
    const req = makeRequest('POST', 'http://localhost/api/assignments', {
      title: 'Test', subject: 'Math',
      dueDate: '2026-05-01', priority: 'urgent', status: 'pending',
    });
    const res = await POST(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.details.some((e: { field: string }) => e.field === 'priority')).toBe(true);
  });

  it('[ERROR] returns 400 for invalid date format', async () => {
    const { POST } = await import('../app/api/assignments/route');
    const req = makeRequest('POST', 'http://localhost/api/assignments', {
      title: 'Test', subject: 'Math',
      dueDate: '01/05/2026', priority: 'low', status: 'pending',
    });
    const res = await POST(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.details.some((e: { field: string }) => e.field === 'dueDate')).toBe(true);
  });

  it('[ERROR] returns 400 for malformed JSON', async () => {
    const { POST } = await import('../app/api/assignments/route');
    const req = new NextRequest('http://localhost/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {{{',
    });
    const res = await POST(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.message).toContain('Invalid JSON');
  });

  it('[ERROR] returns 400 when multiple fields are invalid', async () => {
    const { POST } = await import('../app/api/assignments/route');
    const req = makeRequest('POST', 'http://localhost/api/assignments', {
      title: '',
      subject: '',
      dueDate: 'not-a-date',
      priority: 'unknown',
      status: 'archived',
    });
    const res = await POST(req);
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.details.length).toBeGreaterThanOrEqual(4);
  });
});

// ── GET /api/assignments/[id] ──────────────────────────────────

describe('GET /api/assignments/[id]', () => {
  beforeEach(() => _resetStore([...seed]));

  it('[SUCCESS] returns assignment by ID', async () => {
    const { GET } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments/asgn-001');
    const res = await GET(req, { params: { id: 'asgn-001' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('asgn-001');
    expect(body.data.title).toBe('REST API Design');
  });

  it('[ERROR] returns 404 for non-existent ID', async () => {
    const { GET } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('GET', 'http://localhost/api/assignments/ghost');
    const res = await GET(req, { params: { id: 'ghost' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toContain('ghost');
  });
});

// ── PUT /api/assignments/[id] ──────────────────────────────────

describe('PUT /api/assignments/[id]', () => {
  beforeEach(() => _resetStore([...seed]));

  it('[SUCCESS] updates assignment fields', async () => {
    const { PUT } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('PUT', 'http://localhost/api/assignments/asgn-001', {
      status: 'completed',
      priority: 'low',
    });
    const res = await PUT(req, { params: { id: 'asgn-001' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('completed');
    expect(body.data.priority).toBe('low');
    expect(body.data.title).toBe('REST API Design'); // unchanged
  });

  it('[SUCCESS] partial update preserves other fields', async () => {
    const { PUT } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('PUT', 'http://localhost/api/assignments/asgn-002', {
      status: 'in-progress',
    });
    const res = await PUT(req, { params: { id: 'asgn-002' } });
    const body = await parseResponse(res);

    expect(body.data.status).toBe('in-progress');
    expect(body.data.subject).toBe('Database Systems');
  });

  it('[ERROR] returns 404 for non-existent ID', async () => {
    const { PUT } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('PUT', 'http://localhost/api/assignments/ghost', { title: 'X' });
    const res = await PUT(req, { params: { id: 'ghost' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('[ERROR] returns 400 for empty body', async () => {
    const { PUT } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('PUT', 'http://localhost/api/assignments/asgn-001', {});
    const res = await PUT(req, { params: { id: 'asgn-001' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('[ERROR] returns 400 for invalid status', async () => {
    const { PUT } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('PUT', 'http://localhost/api/assignments/asgn-001', { status: 'archived' });
    const res = await PUT(req, { params: { id: 'asgn-001' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(body.details.some((e: { field: string }) => e.field === 'status')).toBe(true);
  });
});

// ── DELETE /api/assignments/[id] ───────────────────────────────

describe('DELETE /api/assignments/[id]', () => {
  beforeEach(() => _resetStore([...seed]));

  it('[SUCCESS] deletes assignment and returns id', async () => {
    const { DELETE } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('DELETE', 'http://localhost/api/assignments/asgn-001');
    const res = await DELETE(req, { params: { id: 'asgn-001' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('asgn-001');
  });

  it('[SUCCESS] assignment no longer exists after deletion', async () => {
    const { DELETE } = await import('../app/api/assignments/[id]/route');
    const { GET } = await import('../app/api/assignments/[id]/route');

    await DELETE(makeRequest('DELETE', 'http://localhost/api/assignments/asgn-001'), { params: { id: 'asgn-001' } });

    const res = await GET(makeRequest('GET', 'http://localhost/api/assignments/asgn-001'), { params: { id: 'asgn-001' } });
    expect(res.status).toBe(404);
  });

  it('[ERROR] returns 404 for non-existent ID', async () => {
    const { DELETE } = await import('../app/api/assignments/[id]/route');
    const req = makeRequest('DELETE', 'http://localhost/api/assignments/ghost');
    const res = await DELETE(req, { params: { id: 'ghost' } });
    const body = await parseResponse(res);

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ── GET /api/assignments/stats ─────────────────────────────────

describe('GET /api/assignments/stats', () => {
  it('[SUCCESS] returns correct stats', async () => {
    _resetStore([
      { ...seed[0], status: 'pending', priority: 'high' },
      { ...seed[1], id: 'x', status: 'completed', priority: 'high' },
    ]);
    const { GET } = await import('../app/api/assignments/stats/route');
    const res = await GET();
    const body = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(2);
    expect(body.data.pending).toBe(1);
    expect(body.data.completed).toBe(1);
    expect(body.data.highPriority).toBe(2);
  });
});

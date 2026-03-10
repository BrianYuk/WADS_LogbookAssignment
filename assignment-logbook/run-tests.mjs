// run-tests.mjs - Standalone test runner using Node.js built-in test runner
// Usage: node --experimental-vm-modules run-tests.mjs

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── Inline store (pure JS, no imports needed) ─────────────────

let assignments = [];
let _idCounter = 0;

function _resetStore(data = []) { assignments = [...data]; }

function getAllAssignments(filters = {}) {
  let result = [...assignments];
  if (filters.status) result = result.filter(a => a.status === filters.status);
  if (filters.priority) result = result.filter(a => a.priority === filters.priority);
  if (filters.subject) result = result.filter(a => a.subject.toLowerCase().includes(filters.subject.toLowerCase()));
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function getAssignmentById(id) { return assignments.find(a => a.id === id); }
function createAssignment(data) {
  const now = new Date().toISOString();
  const a = { id: `asgn-${Date.now()}-${++_idCounter}`, ...data, createdAt: now, updatedAt: now };
  assignments.push(a);
  return a;
}
function updateAssignment(id, data) {
  const i = assignments.findIndex(a => a.id === id);
  if (i === -1) return undefined;
  assignments[i] = { ...assignments[i], ...data, id: assignments[i].id, createdAt: assignments[i].createdAt, updatedAt: new Date().toISOString() };
  return assignments[i];
}
function deleteAssignment(id) {
  const i = assignments.findIndex(a => a.id === id);
  if (i === -1) return false;
  assignments.splice(i, 1);
  return true;
}
function getStats() {
  return {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in-progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    highPriority: assignments.filter(a => a.priority === 'high').length,
  };
}

// ── Inline validation ─────────────────────────────────────────

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function validateCreateAssignment(body) {
  const errors = [];
  const data = body ?? {};
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0)
    errors.push({ field: 'title', message: 'Title is required.' });
  else if (data.title.trim().length > 200)
    errors.push({ field: 'title', message: 'Title too long.' });
  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length === 0)
    errors.push({ field: 'subject', message: 'Subject is required.' });
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') errors.push({ field: 'description', message: 'Must be string.' });
    else if (data.description.length > 2000) errors.push({ field: 'description', message: 'Too long.' });
  }
  if (!data.dueDate || typeof data.dueDate !== 'string')
    errors.push({ field: 'dueDate', message: 'Due date required.' });
  else if (!DATE_REGEX.test(data.dueDate) || isNaN(Date.parse(data.dueDate)))
    errors.push({ field: 'dueDate', message: 'Invalid date.' });
  if (!data.priority) errors.push({ field: 'priority', message: 'Priority required.' });
  else if (!VALID_PRIORITIES.includes(data.priority)) errors.push({ field: 'priority', message: 'Invalid priority.' });
  if (!data.status) errors.push({ field: 'status', message: 'Status required.' });
  else if (!VALID_STATUSES.includes(data.status)) errors.push({ field: 'status', message: 'Invalid status.' });
  return errors;
}

function validateUpdateAssignment(body) {
  const errors = [];
  const data = body ?? {};
  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length === 0))
    errors.push({ field: 'title', message: 'Title must be non-empty.' });
  if (data.title !== undefined && typeof data.title === 'string' && data.title.trim().length > 200)
    errors.push({ field: 'title', message: 'Title too long.' });
  if (data.subject !== undefined && (typeof data.subject !== 'string' || data.subject.trim().length === 0))
    errors.push({ field: 'subject', message: 'Subject must be non-empty.' });
  if (data.description !== undefined && typeof data.description !== 'string')
    errors.push({ field: 'description', message: 'Must be string.' });
  if (data.dueDate !== undefined && (!DATE_REGEX.test(data.dueDate) || isNaN(Date.parse(data.dueDate))))
    errors.push({ field: 'dueDate', message: 'Invalid date.' });
  if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority))
    errors.push({ field: 'priority', message: 'Invalid priority.' });
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status))
    errors.push({ field: 'status', message: 'Invalid status.' });
  return errors;
}

// ── Mock API handlers ─────────────────────────────────────────

function mockGetAll(query = {}) {
  const page = parseInt(query.page ?? '1');
  const limit = Math.min(parseInt(query.limit ?? '10'), 100);
  if (isNaN(page) || page < 1) return { status: 400, body: { success: false, message: 'Invalid page.' } };
  if (isNaN(limit) || limit < 1) return { status: 400, body: { success: false, message: 'Invalid limit.' } };
  if (query.status && !VALID_STATUSES.includes(query.status))
    return { status: 400, body: { success: false, message: 'Invalid status filter.' } };
  if (query.priority && !VALID_PRIORITIES.includes(query.priority))
    return { status: 400, body: { success: false, message: 'Invalid priority filter.' } };
  const all = getAllAssignments({ status: query.status, priority: query.priority, subject: query.subject });
  const total = all.length;
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);
  return { status: 200, body: { success: true, message: 'OK', data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 } } };
}

function mockPost(body) {
  if (!body || typeof body !== 'object') return { status: 400, body: { success: false, message: 'Invalid JSON body.' } };
  const errors = validateCreateAssignment(body);
  if (errors.length > 0) return { status: 400, body: { success: false, message: 'Validation failed.', details: errors } };
  const a = createAssignment({ title: body.title.trim(), subject: body.subject.trim(), description: (body.description ?? '').trim(), dueDate: body.dueDate, priority: body.priority, status: body.status });
  return { status: 201, body: { success: true, message: 'Created.', data: a } };
}

function mockGetOne(id) {
  const a = getAssignmentById(id);
  if (!a) return { status: 404, body: { success: false, message: `Assignment '${id}' not found.` } };
  return { status: 200, body: { success: true, data: a } };
}

function mockPut(id, body) {
  if (!getAssignmentById(id)) return { status: 404, body: { success: false, message: `Assignment '${id}' not found.` } };
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0)
    return { status: 400, body: { success: false, message: 'Empty body.' } };
  const errors = validateUpdateAssignment(body);
  if (errors.length > 0) return { status: 400, body: { success: false, message: 'Validation failed.', details: errors } };
  const updated = updateAssignment(id, body);
  return { status: 200, body: { success: true, data: updated } };
}

function mockDelete(id) {
  if (!getAssignmentById(id)) return { status: 404, body: { success: false, message: `Assignment '${id}' not found.` } };
  deleteAssignment(id);
  return { status: 200, body: { success: true, data: { id } } };
}

function mockStats() {
  return { status: 200, body: { success: true, data: getStats() } };
}

// ── Test data ─────────────────────────────────────────────────

const seed = [
  { id: 'asgn-001', title: 'REST API Design', subject: 'Web Development', description: '', dueDate: '2026-04-01', priority: 'high', status: 'in-progress', createdAt: '2026-03-02T00:00:00.000Z', updatedAt: '2026-03-02T00:00:00.000Z' },
  { id: 'asgn-002', title: 'Database Report', subject: 'Database Systems', description: '', dueDate: '2026-04-15', priority: 'medium', status: 'pending', createdAt: '2026-03-01T00:00:00.000Z', updatedAt: '2026-03-01T00:00:00.000Z' },
];

let pass = 0, fail = 0, total = 0;
function t(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS  ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ❌ FAIL  ${name}`);
    console.log(`         → ${e.message}`);
    fail++;
  }
}
function section(name) { console.log(`\n📦 ${name}`); }

// ════════════════════════════════════════════════════════════════
// STORE TESTS
// ════════════════════════════════════════════════════════════════

section('Store — getAllAssignments');
_resetStore([...seed]);
t('returns all assignments', () => { assert.equal(getAllAssignments().length, 2); });
t('filters by status=pending', () => {
  const r = getAllAssignments({ status: 'pending' });
  assert.equal(r.length, 1); assert.equal(r[0].id, 'asgn-002');
});
t('filters by priority=high', () => {
  const r = getAllAssignments({ priority: 'high' });
  assert.equal(r.length, 1); assert.equal(r[0].priority, 'high');
});
t('filters by subject partial match (case-insensitive)', () => {
  const r = getAllAssignments({ subject: 'web' });
  assert.equal(r.length, 1); assert.equal(r[0].subject, 'Web Development');
});
t('returns empty array when no match', () => {
  assert.equal(getAllAssignments({ status: 'completed' }).length, 0);
});
t('sorts by createdAt descending', () => {
  const r = getAllAssignments();
  assert.equal(r[0].id, 'asgn-001');
});

section('Store — getAssignmentById');
t('returns existing assignment', () => {
  const a = getAssignmentById('asgn-001');
  assert.ok(a); assert.equal(a.id, 'asgn-001');
});
t('returns undefined for non-existent ID', () => {
  assert.equal(getAssignmentById('ghost'), undefined);
});

section('Store — createAssignment');
t('creates assignment with generated id and timestamps', () => {
  _resetStore([]);
  const a = createAssignment({ title: 'New', subject: 'Math', description: '', dueDate: '2026-04-01', priority: 'low', status: 'pending' });
  assert.ok(a.id); assert.ok(a.createdAt); assert.ok(a.updatedAt);
});
t('stores assignment in list', () => {
  assert.equal(getAllAssignments().length, 1);
});
t('generates unique IDs', () => {
  const b = { title: 'X', subject: 'Y', description: '', dueDate: '2026-04-01', priority: 'low', status: 'pending' };
  const a1 = createAssignment(b); const a2 = createAssignment(b);
  assert.notEqual(a1.id, a2.id);
});

section('Store — updateAssignment');
_resetStore([...seed]);
t('updates specified fields', () => {
  const u = updateAssignment('asgn-001', { status: 'completed' });
  assert.equal(u.status, 'completed');
});
t('preserves unchanged fields', () => {
  assert.equal(getAssignmentById('asgn-001').title, 'REST API Design');
});
t('returns undefined for non-existent id', () => {
  assert.equal(updateAssignment('ghost', { status: 'completed' }), undefined);
});
t('does not overwrite createdAt', () => {
  const orig = getAssignmentById('asgn-001').createdAt;
  updateAssignment('asgn-001', { title: 'Changed' });
  assert.equal(getAssignmentById('asgn-001').createdAt, orig);
});

section('Store — deleteAssignment');
_resetStore([...seed]);
t('deletes assignment and returns true', () => {
  assert.equal(deleteAssignment('asgn-001'), true);
  assert.equal(getAssignmentById('asgn-001'), undefined);
});
t('returns false for non-existent ID', () => {
  assert.equal(deleteAssignment('ghost'), false);
});
t('does not affect other assignments', () => {
  assert.equal(getAllAssignments().length, 1);
  assert.equal(getAllAssignments()[0].id, 'asgn-002');
});

section('Store — getStats');
t('returns correct stats', () => {
  _resetStore([
    { ...seed[0], id: 'x1', status: 'pending', priority: 'high' },
    { ...seed[0], id: 'x2', status: 'pending', priority: 'low' },
    { ...seed[0], id: 'x3', status: 'in-progress', priority: 'high' },
    { ...seed[0], id: 'x4', status: 'completed', priority: 'medium' },
  ]);
  const s = getStats();
  assert.equal(s.total, 4); assert.equal(s.pending, 2);
  assert.equal(s.inProgress, 1); assert.equal(s.completed, 1);
  assert.equal(s.highPriority, 2);
});
t('returns zeros for empty store', () => {
  _resetStore([]);
  const s = getStats();
  assert.equal(s.total, 0); assert.equal(s.pending, 0);
});

// ════════════════════════════════════════════════════════════════
// VALIDATION TESTS
// ════════════════════════════════════════════════════════════════

const validBody = { title: 'Test', subject: 'CS', description: 'desc', dueDate: '2026-04-15', priority: 'high', status: 'pending' };

section('Validation — validateCreateAssignment (Success)');
t('no errors for valid complete body', () => assert.equal(validateCreateAssignment(validBody).length, 0));
t('accepts all valid priorities', () => {
  for (const p of ['low', 'medium', 'high'])
    assert.equal(validateCreateAssignment({ ...validBody, priority: p }).filter(e => e.field === 'priority').length, 0);
});
t('accepts all valid statuses', () => {
  for (const s of ['pending', 'in-progress', 'completed'])
    assert.equal(validateCreateAssignment({ ...validBody, status: s }).filter(e => e.field === 'status').length, 0);
});
t('allows empty description', () => assert.equal(validateCreateAssignment({ ...validBody, description: '' }).length, 0));

section('Validation — validateCreateAssignment (Errors)');
t('error when title missing', () => {
  const { title, ...b } = validBody;
  assert.ok(validateCreateAssignment(b).find(e => e.field === 'title'));
});
t('error when title is whitespace', () => assert.ok(validateCreateAssignment({ ...validBody, title: '   ' }).find(e => e.field === 'title')));
t('error when title > 200 chars', () => assert.ok(validateCreateAssignment({ ...validBody, title: 'A'.repeat(201) }).find(e => e.field === 'title')));
t('error when subject missing', () => {
  const { subject, ...b } = validBody;
  assert.ok(validateCreateAssignment(b).find(e => e.field === 'subject'));
});
t('error for invalid date format dd-mm-yyyy', () => assert.ok(validateCreateAssignment({ ...validBody, dueDate: '15-04-2026' }).find(e => e.field === 'dueDate')));
t('error for non-existent date', () => assert.ok(validateCreateAssignment({ ...validBody, dueDate: '2026-13-45' }).find(e => e.field === 'dueDate')));
t('error for invalid priority', () => assert.ok(validateCreateAssignment({ ...validBody, priority: 'urgent' }).find(e => e.field === 'priority')));
t('error for invalid status', () => assert.ok(validateCreateAssignment({ ...validBody, status: 'done' }).find(e => e.field === 'status')));
t('error for description > 2000 chars', () => assert.ok(validateCreateAssignment({ ...validBody, description: 'X'.repeat(2001) }).find(e => e.field === 'description')));
t('multiple errors at once', () => assert.ok(validateCreateAssignment({ title: '', subject: '', dueDate: 'bad', priority: 'urgent', status: 'unknown' }).length >= 4));
t('error for null body', () => assert.ok(validateCreateAssignment(null).length > 0));
t('error for non-string title', () => assert.ok(validateCreateAssignment({ ...validBody, title: 123 }).find(e => e.field === 'title')));

section('Validation — validateUpdateAssignment (Success)');
t('no errors for full valid update', () => assert.equal(validateUpdateAssignment(validBody).length, 0));
t('no errors for partial update (status only)', () => assert.equal(validateUpdateAssignment({ status: 'completed' }).length, 0));
t('no errors for empty body', () => assert.equal(validateUpdateAssignment({}).length, 0));

section('Validation — validateUpdateAssignment (Errors)');
t('error when title is empty string', () => assert.ok(validateUpdateAssignment({ title: '' }).find(e => e.field === 'title')));
t('error for invalid priority', () => assert.ok(validateUpdateAssignment({ priority: 'critical' }).find(e => e.field === 'priority')));
t('error for invalid status', () => assert.ok(validateUpdateAssignment({ status: 'archived' }).find(e => e.field === 'status')));
t('error for invalid date format', () => assert.ok(validateUpdateAssignment({ dueDate: '04/15/2026' }).find(e => e.field === 'dueDate')));
t('error for non-string description', () => assert.ok(validateUpdateAssignment({ description: 12345 }).find(e => e.field === 'description')));

// ════════════════════════════════════════════════════════════════
// API HANDLER TESTS
// ════════════════════════════════════════════════════════════════

section('API — GET /api/assignments (Success)');
_resetStore([...seed]);
t('200 with paginated data', () => {
  const r = mockGetAll({ page: '1', limit: '10' });
  assert.equal(r.status, 200); assert.equal(r.body.data.length, 2);
  assert.equal(r.body.meta.total, 2);
});
t('filters by status=pending', () => {
  const r = mockGetAll({ status: 'pending' });
  assert.equal(r.status, 200); assert.equal(r.body.data.length, 1);
});
t('filters by priority=high', () => {
  const r = mockGetAll({ priority: 'high' });
  assert.equal(r.body.data.length, 1); assert.equal(r.body.data[0].priority, 'high');
});
t('returns empty array for no match', () => {
  const r = mockGetAll({ status: 'completed' });
  assert.equal(r.body.data.length, 0);
});
t('pagination meta is correct', () => {
  _resetStore([...seed, { ...seed[0], id: 'asgn-003' }]);
  const r = mockGetAll({ page: '2', limit: '2' });
  assert.equal(r.body.meta.page, 2);
  assert.equal(r.body.meta.hasPrevPage, true);
});

section('API — GET /api/assignments (Errors)');
_resetStore([...seed]);
t('400 for invalid page=abc', () => assert.equal(mockGetAll({ page: 'abc' }).status, 400));
t('400 for invalid status filter', () => assert.equal(mockGetAll({ status: 'archived' }).status, 400));
t('400 for invalid priority filter', () => assert.equal(mockGetAll({ priority: 'critical' }).status, 400));

section('API — POST /api/assignments (Success)');
_resetStore([...seed]);
t('201 creates new assignment', () => {
  const r = mockPost({ title: 'New', subject: 'CS', description: '', dueDate: '2026-05-01', priority: 'medium', status: 'pending' });
  assert.equal(r.status, 201); assert.ok(r.body.data.id); assert.ok(r.body.data.createdAt);
});
t('trims whitespace from title', () => {
  const r = mockPost({ title: '  Trimmed  ', subject: 'CS', description: '', dueDate: '2026-05-01', priority: 'low', status: 'pending' });
  assert.equal(r.body.data.title, 'Trimmed');
});

section('API — POST /api/assignments (Errors)');
t('400 when title missing', () => {
  const r = mockPost({ subject: 'CS', dueDate: '2026-05-01', priority: 'low', status: 'pending' });
  assert.equal(r.status, 400);
  assert.ok(r.body.details.find(e => e.field === 'title'));
});
t('400 for invalid priority', () => {
  const r = mockPost({ title: 'T', subject: 'CS', dueDate: '2026-05-01', priority: 'urgent', status: 'pending' });
  assert.equal(r.status, 400);
});
t('400 for invalid date format', () => {
  const r = mockPost({ title: 'T', subject: 'CS', dueDate: '01/05/2026', priority: 'low', status: 'pending' });
  assert.equal(r.status, 400);
});
t('400 for multiple invalid fields', () => {
  const r = mockPost({ title: '', subject: '', dueDate: 'bad', priority: 'x', status: 'y' });
  assert.equal(r.status, 400); assert.ok(r.body.details.length >= 4);
});

section('API — GET /api/assignments/:id (Success & Error)');
_resetStore([...seed]);
t('200 returns assignment by id', () => {
  const r = mockGetOne('asgn-001');
  assert.equal(r.status, 200); assert.equal(r.body.data.id, 'asgn-001');
});
t('404 for non-existent id', () => {
  const r = mockGetOne('ghost');
  assert.equal(r.status, 404); assert.ok(r.body.message.includes('ghost'));
});

section('API — PUT /api/assignments/:id (Success & Error)');
_resetStore([...seed]);
t('200 updates assignment', () => {
  const r = mockPut('asgn-001', { status: 'completed' });
  assert.equal(r.status, 200); assert.equal(r.body.data.status, 'completed');
});
t('preserves unchanged fields on update', () => {
  assert.equal(getAssignmentById('asgn-001').title, 'REST API Design');
});
t('404 for non-existent id', () => assert.equal(mockPut('ghost', { status: 'completed' }).status, 404));
t('400 for empty body', () => assert.equal(mockPut('asgn-001', {}).status, 400));
t('400 for invalid status', () => {
  const r = mockPut('asgn-001', { status: 'archived' });
  assert.equal(r.status, 400);
});

section('API — DELETE /api/assignments/:id (Success & Error)');
_resetStore([...seed]);
t('200 deletes and returns id', () => {
  const r = mockDelete('asgn-001');
  assert.equal(r.status, 200); assert.equal(r.body.data.id, 'asgn-001');
});
t('assignment no longer exists after delete', () => {
  assert.equal(getAssignmentById('asgn-001'), undefined);
});
t('404 for non-existent id', () => assert.equal(mockDelete('ghost').status, 404));

section('API — GET /api/assignments/stats');
t('returns correct stats', () => {
  _resetStore([
    { ...seed[0], status: 'pending', priority: 'high' },
    { ...seed[1], id: 'x', status: 'completed', priority: 'high' },
  ]);
  const r = mockStats();
  assert.equal(r.status, 200);
  assert.equal(r.body.data.total, 2);
  assert.equal(r.body.data.highPriority, 2);
});

// ── Summary ───────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50));
console.log(`\n📊 TEST RESULTS`);
console.log(`   Total:   ${total}`);
console.log(`   ✅ Pass:  ${pass}`);
console.log(`   ❌ Fail:  ${fail}`);
if (fail === 0) {
  console.log('\n🎉 All tests passed!\n');
} else {
  console.log(`\n⚠️  ${fail} test(s) failed.\n`);
  process.exit(1);
}

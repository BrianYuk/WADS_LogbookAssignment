// __tests__/store.test.ts
import {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getStats,
  _resetStore,
  Assignment,
} from '../lib/store';

const sampleAssignment: Assignment = {
  id: 'test-001',
  title: 'Test Assignment',
  subject: 'Testing',
  description: 'A test assignment',
  dueDate: '2026-04-01',
  priority: 'medium',
  status: 'pending',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

beforeEach(() => {
  _resetStore([{ ...sampleAssignment }]);
});

// ── getAllAssignments ──────────────────────────────────────────

describe('getAllAssignments', () => {
  it('returns all assignments when no filter provided', () => {
    const result = getAllAssignments();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test-001');
  });

  it('filters by status correctly', () => {
    _resetStore([
      { ...sampleAssignment, id: 'a1', status: 'pending' },
      { ...sampleAssignment, id: 'a2', status: 'completed' },
      { ...sampleAssignment, id: 'a3', status: 'in-progress' },
    ]);
    const pending = getAllAssignments({ status: 'pending' });
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('a1');
  });

  it('filters by priority correctly', () => {
    _resetStore([
      { ...sampleAssignment, id: 'a1', priority: 'high' },
      { ...sampleAssignment, id: 'a2', priority: 'low' },
    ]);
    const high = getAllAssignments({ priority: 'high' });
    expect(high).toHaveLength(1);
    expect(high[0].priority).toBe('high');
  });

  it('filters by subject (case-insensitive partial match)', () => {
    _resetStore([
      { ...sampleAssignment, id: 'a1', subject: 'Web Development' },
      { ...sampleAssignment, id: 'a2', subject: 'Database Systems' },
    ]);
    const result = getAllAssignments({ subject: 'web' });
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('Web Development');
  });

  it('returns empty array when no matching filter', () => {
    const result = getAllAssignments({ status: 'completed' });
    expect(result).toHaveLength(0);
  });

  it('returns results sorted by createdAt descending', () => {
    _resetStore([
      { ...sampleAssignment, id: 'old', createdAt: '2026-01-01T00:00:00.000Z' },
      { ...sampleAssignment, id: 'new', createdAt: '2026-03-01T00:00:00.000Z' },
    ]);
    const result = getAllAssignments();
    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('old');
  });
});

// ── getAssignmentById ─────────────────────────────────────────

describe('getAssignmentById', () => {
  it('returns assignment when found', () => {
    const a = getAssignmentById('test-001');
    expect(a).toBeDefined();
    expect(a!.id).toBe('test-001');
  });

  it('returns undefined for non-existent ID', () => {
    const a = getAssignmentById('does-not-exist');
    expect(a).toBeUndefined();
  });
});

// ── createAssignment ──────────────────────────────────────────

describe('createAssignment', () => {
  it('creates a new assignment with generated ID and timestamps', () => {
    const input = {
      title: 'New Assignment',
      subject: 'Math',
      description: 'Solve problems',
      dueDate: '2026-04-10',
      priority: 'high' as const,
      status: 'pending' as const,
    };
    const created = createAssignment(input);

    expect(created.id).toBeDefined();
    expect(created.title).toBe('New Assignment');
    expect(created.priority).toBe('high');
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBeDefined();
  });

  it('stores the new assignment in the list', () => {
    createAssignment({ ...sampleAssignment, id: undefined as never, createdAt: undefined as never, updatedAt: undefined as never });
    expect(getAllAssignments()).toHaveLength(2);
  });

  it('generates unique IDs for multiple assignments', () => {
    const base = { title: 'X', subject: 'Y', description: '', dueDate: '2026-04-01', priority: 'low' as const, status: 'pending' as const };
    const a1 = createAssignment(base);
    const a2 = createAssignment(base);
    expect(a1.id).not.toBe(a2.id);
  });
});

// ── updateAssignment ──────────────────────────────────────────

describe('updateAssignment', () => {
  it('updates specified fields correctly', () => {
    const updated = updateAssignment('test-001', { status: 'completed', priority: 'high' });
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('completed');
    expect(updated!.priority).toBe('high');
  });

  it('preserves unchanged fields', () => {
    const updated = updateAssignment('test-001', { status: 'completed' });
    expect(updated!.title).toBe('Test Assignment');
    expect(updated!.subject).toBe('Testing');
  });

  it('returns undefined for non-existent ID', () => {
    const updated = updateAssignment('ghost-id', { status: 'completed' });
    expect(updated).toBeUndefined();
  });

  it('does not overwrite createdAt', () => {
    const original = getAssignmentById('test-001')!.createdAt;
    const updated = updateAssignment('test-001', { title: 'Changed' });
    expect(updated!.createdAt).toBe(original);
  });

  it('updates the updatedAt timestamp', async () => {
    const before = getAssignmentById('test-001')!.updatedAt;
    await new Promise(r => setTimeout(r, 5));
    const updated = updateAssignment('test-001', { title: 'Changed' });
    expect(updated!.updatedAt).not.toBe(before);
  });
});

// ── deleteAssignment ──────────────────────────────────────────

describe('deleteAssignment', () => {
  it('deletes assignment and returns true', () => {
    const result = deleteAssignment('test-001');
    expect(result).toBe(true);
    expect(getAllAssignments()).toHaveLength(0);
  });

  it('returns false for non-existent ID', () => {
    const result = deleteAssignment('nonexistent');
    expect(result).toBe(false);
  });

  it('does not affect other assignments', () => {
    _resetStore([
      { ...sampleAssignment, id: 'keep-me' },
      { ...sampleAssignment, id: 'delete-me' },
    ]);
    deleteAssignment('delete-me');
    expect(getAllAssignments()).toHaveLength(1);
    expect(getAllAssignments()[0].id).toBe('keep-me');
  });
});

// ── getStats ─────────────────────────────────────────────────

describe('getStats', () => {
  it('returns correct statistics', () => {
    _resetStore([
      { ...sampleAssignment, id: 'a1', status: 'pending', priority: 'high' },
      { ...sampleAssignment, id: 'a2', status: 'pending', priority: 'low' },
      { ...sampleAssignment, id: 'a3', status: 'in-progress', priority: 'medium' },
      { ...sampleAssignment, id: 'a4', status: 'completed', priority: 'high' },
    ]);
    const stats = getStats();
    expect(stats.total).toBe(4);
    expect(stats.pending).toBe(2);
    expect(stats.inProgress).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.highPriority).toBe(2);
  });

  it('returns zeros for empty store', () => {
    _resetStore([]);
    const stats = getStats();
    expect(stats.total).toBe(0);
    expect(stats.pending).toBe(0);
  });
});

// __tests__/validation.test.ts
import { validateCreateAssignment, validateUpdateAssignment } from '../lib/validation';

const validBody = {
  title: 'Test Assignment',
  subject: 'Computer Science',
  description: 'A valid assignment',
  dueDate: '2026-04-15',
  priority: 'high',
  status: 'pending',
};

// ── validateCreateAssignment ──────────────────────────────────

describe('validateCreateAssignment', () => {

  // ── SUCCESS SCENARIOS ──────────────────────────────────

  it('returns no errors for a valid complete body', () => {
    const errors = validateCreateAssignment(validBody);
    expect(errors).toHaveLength(0);
  });

  it('accepts all valid priority values', () => {
    for (const priority of ['low', 'medium', 'high']) {
      const errors = validateCreateAssignment({ ...validBody, priority });
      expect(errors.filter(e => e.field === 'priority')).toHaveLength(0);
    }
  });

  it('accepts all valid status values', () => {
    for (const status of ['pending', 'in-progress', 'completed']) {
      const errors = validateCreateAssignment({ ...validBody, status });
      expect(errors.filter(e => e.field === 'status')).toHaveLength(0);
    }
  });

  it('allows description to be empty string', () => {
    const errors = validateCreateAssignment({ ...validBody, description: '' });
    expect(errors).toHaveLength(0);
  });

  it('accepts valid date formats', () => {
    const errors = validateCreateAssignment({ ...validBody, dueDate: '2026-12-31' });
    expect(errors).toHaveLength(0);
  });

  // ── ERROR SCENARIOS ────────────────────────────────────

  it('returns error when title is missing', () => {
    const { title, ...body } = validBody;
    const errors = validateCreateAssignment(body);
    const titleErr = errors.find(e => e.field === 'title');
    expect(titleErr).toBeDefined();
  });

  it('returns error when title is empty string', () => {
    const errors = validateCreateAssignment({ ...validBody, title: '   ' });
    expect(errors.find(e => e.field === 'title')).toBeDefined();
  });

  it('returns error when title exceeds 200 characters', () => {
    const errors = validateCreateAssignment({ ...validBody, title: 'A'.repeat(201) });
    expect(errors.find(e => e.field === 'title')).toBeDefined();
  });

  it('returns error when subject is missing', () => {
    const { subject, ...body } = validBody;
    const errors = validateCreateAssignment(body);
    expect(errors.find(e => e.field === 'subject')).toBeDefined();
  });

  it('returns error for invalid dueDate format', () => {
    const errors = validateCreateAssignment({ ...validBody, dueDate: '15-04-2026' });
    expect(errors.find(e => e.field === 'dueDate')).toBeDefined();
  });

  it('returns error for non-existent date', () => {
    const errors = validateCreateAssignment({ ...validBody, dueDate: '2026-13-45' });
    expect(errors.find(e => e.field === 'dueDate')).toBeDefined();
  });

  it('returns error for invalid priority', () => {
    const errors = validateCreateAssignment({ ...validBody, priority: 'urgent' });
    expect(errors.find(e => e.field === 'priority')).toBeDefined();
  });

  it('returns error for invalid status', () => {
    const errors = validateCreateAssignment({ ...validBody, status: 'done' });
    expect(errors.find(e => e.field === 'status')).toBeDefined();
  });

  it('returns error when description exceeds 2000 characters', () => {
    const errors = validateCreateAssignment({ ...validBody, description: 'X'.repeat(2001) });
    expect(errors.find(e => e.field === 'description')).toBeDefined();
  });

  it('returns multiple errors at once for multiple invalid fields', () => {
    const errors = validateCreateAssignment({
      title: '',
      subject: '',
      dueDate: 'bad-date',
      priority: 'urgent',
      status: 'unknown',
    });
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });

  it('returns error for null body', () => {
    const errors = validateCreateAssignment(null);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error for non-string title type', () => {
    const errors = validateCreateAssignment({ ...validBody, title: 123 });
    expect(errors.find(e => e.field === 'title')).toBeDefined();
  });
});

// ── validateUpdateAssignment ──────────────────────────────────

describe('validateUpdateAssignment', () => {

  // ── SUCCESS SCENARIOS ──────────────────────────────────

  it('returns no errors for a full valid update body', () => {
    const errors = validateUpdateAssignment(validBody);
    expect(errors).toHaveLength(0);
  });

  it('returns no errors for a partial update (status only)', () => {
    const errors = validateUpdateAssignment({ status: 'completed' });
    expect(errors).toHaveLength(0);
  });

  it('returns no errors for priority update only', () => {
    const errors = validateUpdateAssignment({ priority: 'low' });
    expect(errors).toHaveLength(0);
  });

  it('returns no errors for empty body (no changes)', () => {
    // Validation itself doesn't reject empty — the route does
    const errors = validateUpdateAssignment({});
    expect(errors).toHaveLength(0);
  });

  // ── ERROR SCENARIOS ────────────────────────────────────

  it('returns error when title is explicitly set to empty string', () => {
    const errors = validateUpdateAssignment({ title: '' });
    expect(errors.find(e => e.field === 'title')).toBeDefined();
  });

  it('returns error for invalid priority in update', () => {
    const errors = validateUpdateAssignment({ priority: 'critical' });
    expect(errors.find(e => e.field === 'priority')).toBeDefined();
  });

  it('returns error for invalid status in update', () => {
    const errors = validateUpdateAssignment({ status: 'archived' });
    expect(errors.find(e => e.field === 'status')).toBeDefined();
  });

  it('returns error for invalid date format in update', () => {
    const errors = validateUpdateAssignment({ dueDate: '04/15/2026' });
    expect(errors.find(e => e.field === 'dueDate')).toBeDefined();
  });

  it('returns error when description type is invalid', () => {
    const errors = validateUpdateAssignment({ description: 12345 as never });
    expect(errors.find(e => e.field === 'description')).toBeDefined();
  });
});

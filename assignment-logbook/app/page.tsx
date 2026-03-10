'use client';

import { useState, useEffect, useCallback } from 'react';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const PRIORITY_COLORS = {
  low: { bg: '#d4f5e9', text: '#0a6640', dot: '#2ecc71' },
  medium: { bg: '#fff3cd', text: '#856404', dot: '#f39c12' },
  high: { bg: '#fde8e8', text: '#9b1c1c', dot: '#e74c3c' },
};

const STATUS_COLORS = {
  'pending': { bg: '#e8f0fe', text: '#1a56db', label: 'Pending' },
  'in-progress': { bg: '#fef3c7', text: '#92400e', label: 'In Progress' },
  'completed': { bg: '#d1fae5', text: '#065f46', label: 'Completed' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysDiff(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  return diff;
}

export default function HomePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Assignment | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const emptyForm = {
    title: '', subject: '', description: '',
    dueDate: '', priority: 'medium' as const, status: 'pending' as const,
  };
  const [form, setForm] = useState(emptyForm);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '8' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);

      const [asgnRes, statsRes] = await Promise.all([
        fetch(`/api/assignments?${params}`),
        fetch('/api/assignments/stats'),
      ]);
      const asgnData = await asgnRes.json();
      const statsData = await statsRes.json();

      if (asgnData.success) {
        setAssignments(asgnData.data);
        setMeta(asgnData.meta);
      }
      if (statsData.success) setStats(statsData.data);
    } catch {
      showToast('Failed to load assignments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterPriority]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    setFormErrors({});
    const url = editTarget ? `/api/assignments/${editTarget.id}` : '/api/assignments';
    const method = editTarget ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!data.success) {
      if (data.details) {
        const errs: Record<string, string> = {};
        data.details.forEach((e: { field: string; message: string }) => { errs[e.field] = e.message; });
        setFormErrors(errs);
      } else {
        showToast(data.message, 'error');
      }
      return;
    }

    showToast(editTarget ? 'Assignment updated!' : 'Assignment created!');
    setShowForm(false);
    setEditTarget(null);
    setForm(emptyForm);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Assignment deleted.');
      fetchData();
    } else {
      showToast(data.message, 'error');
    }
  };

  const openEdit = (a: Assignment) => {
    setEditTarget(a);
    setForm({ title: a.title, subject: a.subject, description: a.description, dueDate: a.dueDate, priority: a.priority, status: a.status });
    setFormErrors({});
    setShowForm(true);
  };

  const openNew = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f8', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        padding: '0 32px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', height: '64px', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            background: '#e94560', borderRadius: '10px',
            width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>📚</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '16px', lineHeight: 1.2 }}>
              Claude Assignment Log Book
            </div>
            <div style={{ color: '#a0aec0', fontSize: '11px' }}>REST API · Next.js 14</div>
          </div>
        </div>
        <a href="/docs" target="_blank" style={{
          color: '#a0aec0', textDecoration: 'none', fontSize: '13px',
          border: '1px solid rgba(255,255,255,0.15)', padding: '6px 14px',
          borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'all 0.2s',
        }}>
          📄 API Docs
        </a>
        <button onClick={openNew} style={{
          background: '#e94560', color: 'white', border: 'none',
          borderRadius: '8px', padding: '8px 18px', fontSize: '13px',
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          + New Assignment
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Stats ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '28px' }}>
            {[
              { label: 'Total', value: stats.total, icon: '📋', color: '#4361ee' },
              { label: 'Pending', value: stats.pending, icon: '⏳', color: '#f39c12' },
              { label: 'In Progress', value: stats.inProgress, icon: '🔄', color: '#3498db' },
              { label: 'Completed', value: stats.completed, icon: '✅', color: '#2ecc71' },
              { label: 'High Priority', value: stats.highPriority, icon: '🔥', color: '#e74c3c' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', borderRadius: '14px', padding: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                borderTop: `4px solid ${s.color}`,
                transition: 'transform 0.2s',
              }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{
          background: 'white', borderRadius: '12px', padding: '16px 20px',
          marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>Filter:</span>
          {(['', 'pending', 'in-progress', 'completed'] as const).map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
              borderColor: filterStatus === s ? '#4361ee' : '#e2e8f0',
              background: filterStatus === s ? '#4361ee' : 'white',
              color: filterStatus === s ? 'white' : '#666',
            }}>
              {s === '' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
          {(['', 'low', 'medium', 'high'] as const).map(p => (
            <button key={p} onClick={() => { setFilterPriority(p); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
              borderColor: filterPriority === p ? '#e94560' : '#e2e8f0',
              background: filterPriority === p ? '#e94560' : 'white',
              color: filterPriority === p ? 'white' : '#666',
            }}>
              {p === '' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Assignments List ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#888', fontSize: '16px' }}>
            Loading assignments…
          </div>
        ) : assignments.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: '14px', padding: '60px',
            textAlign: 'center', color: '#888',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '16px' }}>No assignments found. Create one!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {assignments.map(a => {
              const diff = daysDiff(a.dueDate);
              const overdue = diff < 0 && a.status !== 'completed';
              const pc = PRIORITY_COLORS[a.priority];
              const sc = STATUS_COLORS[a.status];
              return (
                <div key={a.id} style={{
                  background: 'white', borderRadius: '14px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                  overflow: 'hidden',
                  border: overdue ? '2px solid #e74c3c' : '2px solid transparent',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ padding: '18px 20px 14px' }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{
                        background: pc.bg, color: pc.text, borderRadius: '20px',
                        padding: '3px 10px', fontSize: '11px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pc.dot, display: 'inline-block' }} />
                        {a.priority.toUpperCase()}
                      </span>
                      <span style={{
                        background: sc.bg, color: sc.text, borderRadius: '20px',
                        padding: '3px 10px', fontSize: '11px', fontWeight: 600,
                      }}>
                        {sc.label}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#1a202c', lineHeight: 1.4 }}>
                      {a.title}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#4361ee', fontWeight: 600, marginBottom: '8px' }}>
                      {a.subject}
                    </div>
                    {a.description && (
                      <p style={{
                        margin: '0 0 12px', fontSize: '13px', color: '#64748b',
                        lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {a.description}
                      </p>
                    )}

                    {/* Due date */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '12px',
                      color: overdue ? '#e74c3c' : diff <= 3 ? '#f39c12' : '#64748b',
                      fontWeight: overdue || diff <= 3 ? 600 : 400,
                    }}>
                      📅 {formatDate(a.dueDate)}
                      {overdue
                        ? <span style={{ color: '#e74c3c' }}> · {Math.abs(diff)}d overdue!</span>
                        : diff === 0 ? <span> · Due today!</span>
                        : diff <= 3 ? <span> · {diff}d left</span>
                        : null
                      }
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    borderTop: '1px solid #f1f5f9',
                    padding: '10px 16px', display: 'flex', gap: '8px',
                  }}>
                    <button onClick={() => openEdit(a)} style={{
                      flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #e2e8f0',
                      background: 'white', color: '#4361ee', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(a.id)} style={{
                      flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid #fde8e8',
                      background: '#fff5f5', color: '#e74c3c', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: meta.hasPrevPage ? 'white' : '#f8fafc',
                color: meta.hasPrevPage ? '#1a202c' : '#cbd5e0',
                cursor: meta.hasPrevPage ? 'pointer' : 'default', fontWeight: 600,
              }}
            >← Prev</button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid',
                  borderColor: page === p ? '#4361ee' : '#e2e8f0',
                  background: page === p ? '#4361ee' : 'white',
                  color: page === p ? 'white' : '#1a202c',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >{p}</button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!meta.hasNextPage}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                background: meta.hasNextPage ? 'white' : '#f8fafc',
                color: meta.hasNextPage ? '#1a202c' : '#cbd5e0',
                cursor: meta.hasNextPage ? 'pointer' : 'default', fontWeight: 600,
              }}
            >Next →</button>
          </div>
        )}
      </main>

      {/* ── Modal Form ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a202c' }}>
                {editTarget ? '✏️ Edit Assignment' : '➕ New Assignment'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{
                background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b',
              }}>×</button>
            </div>

            {/* Form fields */}
            {[
              { key: 'title', label: 'Title *', type: 'text', placeholder: 'Assignment title' },
              { key: 'subject', label: 'Subject *', type: 'text', placeholder: 'e.g. Web Development' },
              { key: 'dueDate', label: 'Due Date *', type: 'date', placeholder: '' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: `1px solid ${formErrors[f.key] ? '#e74c3c' : '#e2e8f0'}`,
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {formErrors[f.key] && (
                  <div style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{formErrors[f.key]}</div>
                )}
              </div>
            ))}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                placeholder="Assignment description..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Priority *</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                  }}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Status *</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Assignment['status'] }))}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                  }}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                border: '1px solid #e2e8f0', background: 'white',
                color: '#64748b', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleSubmit} style={{
                flex: 2, padding: '12px', borderRadius: '10px',
                border: 'none', background: 'linear-gradient(135deg, #4361ee, #e94560)',
                color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              }}>
                {editTarget ? 'Save Changes' : 'Create Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 300,
          background: toast.type === 'success' ? '#1a202c' : '#e74c3c',
          color: 'white', padding: '12px 20px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

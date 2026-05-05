'use client';

import { useState, useMemo } from 'react';
import { useResumeStore, type ApplicationRecord } from '@/lib/resume-store';

const STATUS_OPTIONS: ApplicationRecord['status'][] = [
  '投递', '筛选中', '一面', '二面', '三面', 'OC', 'offer', '拒', '无回音',
];

const STATUS_CONFIG: Record<ApplicationRecord['status'], { color: string; bg: string; label: string }> = {
  '投递':    { color: '#6366f1', bg: '#eef2ff', label: '已投递' },
  '筛选中':  { color: '#f59e0b', bg: '#fffbeb', label: '筛选中' },
  '一面':    { color: '#3b82f6', bg: '#eff6ff', label: '一面' },
  '二面':    { color: '#8b5cf6', bg: '#f5f3ff', label: '二面' },
  '三面':    { color: '#ec4899', bg: '#fdf2f8', label: '三面' },
  'OC':      { color: '#10b981', bg: '#ecfdf5', label: 'OC' },
  'offer':   { color: '#059669', bg: '#d1fae5', label: 'Offer 🎉' },
  '拒':      { color: '#ef4444', bg: '#fef2f2', label: '已拒绝' },
  '无回音':  { color: '#9ca3af', bg: '#f9fafb', label: '无回音' },
};

const STATS_CONFIG = [
  { label: '投递总数', key: 'total' as const, bg: '#eef2ff', color: '#6366f1' },
  { label: '面试中', key: 'interviewing' as const, bg: '#fffbeb', color: '#f59e0b' },
  { label: 'Offer', key: 'offer' as const, bg: '#ecfdf5', color: '#10b981' },
  { label: '被拒', key: 'rejected' as const, bg: '#fef2f2', color: '#ef4444' },
];

export default function ApplicationTracker({ onClose }: { onClose: () => void }) {
  const { applications, addApplication, updateApplication, deleteApplication } = useResumeStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ApplicationRecord['status'] | '全部'>('全部');

  const [form, setForm] = useState({
    company: '',
    position: '',
    applicationLink: '',
    resumeVersion: '互联网大厂版',
    notes: '',
  });

  const resetForm = () => setForm({ company: '', position: '', applicationLink: '', resumeVersion: '互联网大厂版', notes: '' });

  const handleAdd = () => {
    if (!form.company.trim() || !form.position.trim()) return;
    addApplication({
      id: crypto.randomUUID(),
      company: form.company.trim(),
      position: form.position.trim(),
      applicationLink: form.applicationLink.trim(),
      resumeVersion: form.resumeVersion,
      appliedAt: new Date().toISOString().split('T')[0],
      status: '投递',
      updatedAt: new Date().toISOString(),
    });
    resetForm();
    setShowAdd(false);
  };

  const handleUpdateStatus = (id: string, status: ApplicationRecord['status']) => {
    updateApplication(id, { status });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除这条投递记录？')) {
      deleteApplication(id);
    }
  };

  const stats = useMemo(() => ({
    total: applications.length,
    interviewing: applications.filter(a => ['一面','二面','三面','OC'].includes(a.status)).length,
    offer: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === '拒').length,
  }), [applications]);

  const filtered = useMemo(() =>
    filterStatus === '全部'
      ? applications
      : applications.filter(a => a.status === filterStatus),
    [applications, filterStatus]
  );

  const sorted = useMemo(() => [...filtered].sort((a, b) =>
    new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
  ), [filtered]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 720,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', margin: 0 }}>📋 投递追踪</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>记录每一次投递，追踪面试进展</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', padding: 4 }}>×</button>
        </div>

        {/* Stats bar */}
        <div style={{ padding: '12px 28px', display: 'flex', gap: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0, overflowX: 'auto' }}>
          {STATS_CONFIG.map(s => (
            <div key={s.key} style={{ background: s.bg, borderRadius: 10, padding: '8px 16px', textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{stats[s.key]}</div>
              <div style={{ fontSize: 10, color: s.color, opacity: 0.8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
          {/* Filter + Add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilterStatus('全部')}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: '1px solid', cursor: 'pointer',
                  borderColor: filterStatus === '全部' ? '#6366f1' : '#e5e7eb',
                  background: filterStatus === '全部' ? '#eef2ff' : '#fff',
                  color: filterStatus === '全部' ? '#6366f1' : '#6b7280',
                }}
              >全部</button>
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    border: '1px solid', cursor: 'pointer',
                    borderColor: filterStatus === s ? STATUS_CONFIG[s].color : '#e5e7eb',
                    background: filterStatus === s ? STATUS_CONFIG[s].bg : '#fff',
                    color: filterStatus === s ? STATUS_CONFIG[s].color : '#6b7280',
                  }}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
              }}
            >
              + 添加投递
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div style={{ background: '#f9fafb', borderRadius: 14, padding: '20px 24px', marginBottom: 16, border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 14 }}>记录新投递</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>公司名称 *</label>
                  <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                    placeholder="例如：字节跳动"
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>岗位 *</label>
                  <input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                    placeholder="例如：前端开发工程师"
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>投递链接</label>
                  <input value={form.applicationLink} onChange={e => setForm({ ...form, applicationLink: e.target.value })}
                    placeholder="选填"
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>投递版本</label>
                  <select value={form.resumeVersion} onChange={e => setForm({ ...form, resumeVersion: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option>互联网大厂版</option>
                    <option>外企版</option>
                    <option>创业公司版</option>
                    <option>国企版</option>
                    <option>金融版</option>
                    <option>事业单位版</option>
                    <option>原始版本</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>备注</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="选填，例如：内推、优先级等"
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleAdd}
                  disabled={!form.company.trim() || !form.position.trim()}
                  style={{
                    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: !form.company.trim() || !form.position.trim() ? '#d1d5db' : '#4f46e5',
                    color: '#fff', border: 'none',
                    cursor: !form.company.trim() || !form.position.trim() ? 'not-allowed' : 'pointer',
                  }}>
                  保存记录
                </button>
                <button onClick={() => { setShowAdd(false); resetForm(); }}
                  style={{ padding: '8px 16px', fontSize: 13, color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {sorted.length === 0 && !showAdd && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>还没有投递记录</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>记录每一次投递，不错过任何一个机会</p>
            </div>
          )}

          {/* Application list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map(record => {
              const config = STATUS_CONFIG[record.status];
              return (
                <div key={record.id}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.color, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>{record.company}</span>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{record.position}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>投递于 {record.appliedAt}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>版本：{record.resumeVersion}</span>
                        {record.applicationLink && (
                          <a href={record.applicationLink} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#4f46e5', textDecoration: 'none' }}>投递链接 →</a>
                        )}
                      </div>
                      {record.notes && (
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' }}>{record.notes}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                      <button onClick={() => handleDelete(record.id)}
                        style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>
                        删除
                      </button>
                    </div>
                  </div>

                  {/* Status update */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s}
                        onClick={() => handleUpdateStatus(record.id, s)}
                        style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11,
                          border: '1px solid', cursor: 'pointer',
                          borderColor: record.status === s ? STATUS_CONFIG[s].color : '#e5e7eb',
                          background: record.status === s ? STATUS_CONFIG[s].bg : '#fff',
                          color: record.status === s ? STATUS_CONFIG[s].color : '#9ca3af',
                          fontWeight: record.status === s ? 600 : 400,
                        }}>
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

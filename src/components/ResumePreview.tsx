'use client';

import { useState, useRef, useCallback } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume } from '@/types/resume';

interface EditTarget {
  type: 'profile.name' | 'profile.titles' | 'profile.email' | 'profile.phone' | 'profile.location' | 'profile.summary'
    | 'work' | 'project' | 'education';
  id?: string;
  key?: string;
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
}

// 微型编辑气泡
function EditPopover({ target, onSave, onClose }: {
  target: EditTarget;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(target.value);
  const ref = useRef<HTMLTextAreaElement>(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 80,
    }}>
      {/* 遮罩 */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />

      {/* 气泡卡片 */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 480,
        background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>编辑：{target.label}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* 输入区 */}
        <div style={{ padding: '16px 20px' }}>
          {target.multiline ? (
            <textarea
              ref={ref}
              value={value}
              onChange={e => setValue(e.target.value)}
              rows={4}
              placeholder={target.placeholder}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', fontSize: 13, lineHeight: 1.7,
                border: '1.5px solid #2563eb', borderRadius: 10, outline: 'none',
                color: '#374151', background: '#f0f9ff',
                resize: 'vertical', fontFamily: 'inherit',
              }}
            />
          ) : (
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={target.placeholder}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 14px', fontSize: 13,
                border: '1.5px solid #2563eb', borderRadius: 10, outline: 'none',
                color: '#374151', background: '#f0f9ff',
                fontFamily: 'inherit',
              }}
            />
          )}
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
            {target.multiline ? '支持多行，回车换行' : 'Enter 确认，Esc 取消'}
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '9px', fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', color: '#6b7280' }}
          >
            取消
          </button>
          <button
            onClick={() => { onSave(value); onClose(); }}
            style={{ flex: 2, padding: '9px', fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}
          >
            ✓ 保存
          </button>
        </div>
      </div>
    </div>
  );
}

// 可点击的预览字段
function ClickField({ label, value, onClick, placeholder = '点击填写' }: {
  label: string;
  value: string;
  onClick: () => void;
  placeholder?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        padding: hover ? '2px 4px' : '0',
        borderRadius: 4,
        border: hover ? '1px solid #bfdbfe' : '1px solid transparent',
        transition: 'all 0.1s',
        display: 'inline',
      }}
      title={`点击编辑${label}`}
    >
      <span style={{ color: value ? 'inherit' : '#d1d5db', fontStyle: value ? 'normal' : 'italic' }}>
        {value || placeholder}
      </span>
    </div>
  );
}

export default function ResumePreview() {
  const { currentResume, selectedTemplate, jdAnalysis, updateResume } = useResumeStore();
  const resume: Resume | null = currentResume;
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  if (!resume) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', fontSize: 13 }}>
        左边填写内容，预览实时显示
      </div>
    );
  }

  const health = computeHealth(resume);
  const p = resume.profile || {};

  // 打开编辑
  const openEdit = (target: EditTarget) => setEditTarget(target);
  const closeEdit = () => setEditTarget(null);

  // 保存编辑
  const saveEdit = useCallback((newValue: string) => {
    if (!resume || !editTarget) return;
    if (editTarget.type === 'profile.name') {
      updateResume(resume.id, { profile: { ...p, name: newValue } });
    } else if (editTarget.type === 'profile.titles') {
      updateResume(resume.id, { profile: { ...p, titles: { ...p.titles, default: newValue } } });
    } else if (editTarget.type === 'profile.email') {
      updateResume(resume.id, { profile: { ...p, email: newValue } });
    } else if (editTarget.type === 'profile.phone') {
      updateResume(resume.id, { profile: { ...p, phone: newValue } });
    } else if (editTarget.type === 'profile.location') {
      updateResume(resume.id, { profile: { ...p, location: newValue } });
    } else if (editTarget.type === 'profile.summary') {
      updateResume(resume.id, { profile: { ...p, summary: newValue } });
    }
  }, [resume, editTarget, p, updateResume]);

  // 删除条目
  const deleteEntry = useCallback((type: 'work' | 'project' | 'education', id: string) => {
    if (!resume) return;
    if (type === 'work') updateResume(resume.id, { work: (resume.work || []).filter(w => w.id !== id) });
    if (type === 'project') updateResume(resume.id, { projects: (resume.projects || []).filter(p => p.id !== id) });
    if (type === 'education') updateResume(resume.id, { education: (resume.education || []).filter(e => e.id !== id) });
  }, [resume, updateResume]);

  // 添加条目
  const addEntry = useCallback((type: 'work' | 'project' | 'education') => {
    if (!resume) return;
    if (type === 'work') {
      const item = { id: crypto.randomUUID(), company: '', position: '', startDate: '', endDate: '', current: false, highlights: [], summary: '' };
      updateResume(resume.id, { work: [...(resume.work || []), item] });
    } else if (type === 'project') {
      const item = { id: crypto.randomUUID(), name: '', role: '', startDate: '', endDate: '', current: false, highlights: [], technologies: [], description: '' };
      updateResume(resume.id, { projects: [...(resume.projects || []), item] });
    } else if (type === 'education') {
      const item = { id: crypto.randomUUID(), institution: '', degree: '', field: '', startDate: '', endDate: '', current: false, summary: '' };
      updateResume(resume.id, { education: [...(resume.education || []), item] });
    }
  }, [resume, updateResume]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#e2e8f0', padding: '12px' }}>
      {/* 顶部状态 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>点击简历任意文字可直接编辑</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {health && (
            <div style={{
              padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: health.score >= 80 ? '#ecfdf5' : health.score >= 60 ? '#fffbeb' : '#fef2f2',
              color: health.score >= 80 ? '#10b981' : health.score >= 60 ? '#f59e0b' : '#ef4444',
            }}>
              健康度 {health.score}
            </div>
          )}
          {jdAnalysis && (
            <div style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#2563eb' }}>
              JD {jdAnalysis.score}%
            </div>
          )}
        </div>
      </div>

      {/* 简历主体 */}
      <div style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', borderRadius: 3, overflow: 'hidden', minHeight: 700 }}>
        {selectedTemplate === 'template-2' ? (
          <TemplateFinance resume={resume} p={p} openEdit={openEdit} addEntry={addEntry} deleteEntry={deleteEntry} />
        ) : selectedTemplate === 'template-3' ? (
          <TemplateMinimal resume={resume} p={p} openEdit={openEdit} addEntry={addEntry} deleteEntry={deleteEntry} />
        ) : selectedTemplate === 'template-4' ? (
          <TemplateGov resume={resume} p={p} openEdit={openEdit} addEntry={addEntry} deleteEntry={deleteEntry} />
        ) : selectedTemplate === 'template-5' ? (
          <TemplateCreative resume={resume} p={p} openEdit={openEdit} addEntry={addEntry} deleteEntry={deleteEntry} />
        ) : (
          <TemplateTech resume={resume} p={p} openEdit={openEdit} addEntry={addEntry} deleteEntry={deleteEntry} />
        )}
      </div>

      {/* 编辑气泡 */}
      {editTarget && (
        <EditPopover
          target={editTarget}
          onSave={saveEdit}
          onClose={closeEdit}
        />
      )}
    </div>
  );
}

// ──── 模板1：技术岗 ────
function TemplateTech({ resume, p, openEdit, addEntry, deleteEntry }: any) {
  return (
    <div style={{ display: 'flex', minHeight: 700, fontFamily: 'system-ui, sans-serif' }}>
      {/* 左侧栏 */}
      <div style={{ width: '30%', background: '#1e3a5f', color: '#fff', padding: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, cursor: 'pointer' }}
          onClick={() => openEdit({ type: 'profile.name', label: '姓名', value: p.name || '', placeholder: '输入姓名' })}>
          <span style={{ color: p.name ? '#fff' : '#64748b' }}>{p.name || '未填写姓名'}</span>
        </h1>
        <div style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.titles', label: '求职目标', value: p.titles?.default || '', placeholder: '输入求职目标' })}>
          <span style={{ fontSize: 13, color: '#93c5fd' }}>{p.titles?.default || '未填写求职目标'}</span>
        </div>
        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.8, marginTop: 12 }}>
          <div style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.email', label: '邮箱', value: p.email || '', placeholder: '输入邮箱' })}>
            <span style={{ color: p.email ? '#e2e8f0' : '#64748b' }}>{p.email || '点击填写邮箱'}</span>
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.phone', label: '电话', value: p.phone || '', placeholder: '输入电话' })}>
            <span style={{ color: p.phone ? '#e2e8f0' : '#64748b' }}>{p.phone || '点击填写电话'}</span>
          </div>
          <div style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.location', label: '所在地', value: p.location || '', placeholder: '输入所在地' })}>
            <span style={{ color: p.location ? '#e2e8f0' : '#64748b' }}>{p.location || '点击填写所在地'}</span>
          </div>
        </div>

        {(resume.skills || []).length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#93c5fd', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>技能</div>
            {(resume.skills || []).map((cat: any) => (
              <div key={cat.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{cat.category}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(cat.skills || []).map((s: any, i: number) => (
                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, color: '#e2e8f0' }}>{s.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右侧内容 */}
      <div style={{ flex: 1, padding: 28 }}>
        {p.summary && (
          <Section title="个人简介" onEdit={() => openEdit({ type: 'profile.summary', label: '个人简介', value: p.summary, placeholder: '输入个人简介', multiline: true })}>
            <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>{p.summary}</p>
          </Section>
        )}

        {(resume.work || []).length > 0 && (
          <Section title="工作经历" onAdd={() => addEntry('work')}>
            {(resume.work || []).map((job: any) => (
              <EntryCard key={job.id} onDelete={() => deleteEntry('work', job.id)}>
                <EntryHeader
                  company={job.company}
                  position={job.position}
                  start={job.startDate}
                  end={job.current ? '至今' : job.endDate}
                />
                {(job.highlights || []).map((h: string, i: number) => (
                  <Bullet key={i} text={h} />
                ))}
              </EntryCard>
            ))}
          </Section>
        )}

        {(resume.education || []).length > 0 && (
          <Section title="教育背景" onAdd={() => addEntry('education')}>
            {(resume.education || []).map((e: any) => (
              <EntryCard key={e.id} onDelete={() => deleteEntry('education', e.id)}>
                <EntryHeader company={e.institution} position={`${e.degree || ''} ${e.field || ''}`} start={e.startDate} end={e.endDate} />
              </EntryCard>
            ))}
          </Section>
        )}

        {(resume.projects || []).length > 0 && (
          <Section title="项目经历" onAdd={() => addEntry('project')}>
            {(resume.projects || []).map((proj: any) => (
              <EntryCard key={proj.id} onDelete={() => deleteEntry('project', proj.id)}>
                <EntryHeader company={proj.name} position={proj.role} />
                {(proj.highlights || []).map((h: string, i: number) => (
                  <Bullet key={i} text={h} />
                ))}
              </EntryCard>
            ))}
          </Section>
        )}

        {/* 空状态 */}
        {(resume.work || []).length === 0 && (resume.projects || []).length === 0 && (resume.education || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#d1d5db' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 13 }}>左侧「写经历」添加内容</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──── 模板2：金融 ────
function TemplateFinance({ resume, p, openEdit, addEntry, deleteEntry }: any) {
  return (
    <div style={{ padding: 32, background: '#fff', minHeight: 700, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #1e3a5f', paddingBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, cursor: 'pointer' }}
          onClick={() => openEdit({ type: 'profile.name', label: '姓名', value: p.name || '', placeholder: '输入姓名' })}>
          {p.name || '未填写姓名'}
        </h1>
        <div style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.titles', label: '求职目标', value: p.titles?.default || '', placeholder: '输入求职目标' })}>
          <span style={{ fontSize: 13, color: '#475569' }}>{p.titles?.default || '未填写求职目标'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 12, color: '#64748b' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.email', label: '邮箱', value: p.email || '', placeholder: '邮箱' })}>{p.email || '邮箱'}</span>
          <span style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.phone', label: '电话', value: p.phone || '', placeholder: '电话' })}>{p.phone || '电话'}</span>
        </div>
      </div>
      {p.summary && (
        <Section title="个人简介" onEdit={() => openEdit({ type: 'profile.summary', label: '个人简介', value: p.summary, placeholder: '输入个人简介', multiline: true })}>
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>{p.summary}</p>
        </Section>
      )}
      {(resume.work || []).length > 0 && (
        <Section title="工作经历" onAdd={() => addEntry('work')}>
          {(resume.work || []).map((job: any) => (
            <EntryCard key={job.id} onDelete={() => deleteEntry('work', job.id)}>
              <EntryHeader company={job.company} position={job.position} start={job.startDate} end={job.current ? '至今' : job.endDate} />
              {(job.highlights || []).map((h: string, i: number) => <Bullet key={i} text={h} />)}
            </EntryCard>
          ))}
        </Section>
      )}
      {(resume.education || []).length > 0 && (
        <Section title="教育背景" onAdd={() => addEntry('education')}>
          {(resume.education || []).map((e: any) => (
            <EntryCard key={e.id} onDelete={() => deleteEntry('education', e.id)}>
              <EntryHeader company={e.institution} position={`${e.degree || ''} ${e.field || ''}`} start={e.startDate} end={e.endDate} />
            </EntryCard>
          ))}
        </Section>
      )}
    </div>
  );
}

// ──── 模板3：简约 ────
function TemplateMinimal({ resume, p, openEdit, addEntry, deleteEntry }: any) {
  return (
    <div style={{ padding: 32, background: '#fff', minHeight: 700, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, cursor: 'pointer' }}
        onClick={() => openEdit({ type: 'profile.name', label: '姓名', value: p.name || '', placeholder: '输入姓名' })}>
        {p.name || '未填写姓名'}
      </h1>
      <div style={{ cursor: 'pointer', marginBottom: 20 }} onClick={() => openEdit({ type: 'profile.titles', label: '求职目标', value: p.titles?.default || '', placeholder: '输入求职目标' })}>
        <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>{p.titles?.default || '未填写求职目标'}</span>
      </div>
      {(resume.work || []).length > 0 && (
        <Section title="工作经历" onAdd={() => addEntry('work')}>
          {(resume.work || []).map((job: any) => (
            <EntryCard key={job.id} onDelete={() => deleteEntry('work', job.id)}>
              <EntryHeader company={job.company} position={job.position} start={job.startDate} end={job.current ? '至今' : job.endDate} />
              {(job.highlights || []).map((h: string, i: number) => <Bullet key={i} text={h} />)}
            </EntryCard>
          ))}
        </Section>
      )}
      {(resume.education || []).length > 0 && (
        <Section title="教育" onAdd={() => addEntry('education')}>
          {(resume.education || []).map((e: any) => (
            <EntryCard key={e.id} onDelete={() => deleteEntry('education', e.id)}>
              <EntryHeader company={e.institution} position={`${e.degree || ''} ${e.field || ''}`} start={e.startDate} end={e.endDate} />
            </EntryCard>
          ))}
        </Section>
      )}
    </div>
  );
}

// ──── 模板4：国企 ────
function TemplateGov({ resume, p, openEdit, addEntry, deleteEntry }: any) {
  return (
    <div style={{ padding: 24, background: '#fff', minHeight: 700, fontFamily: '宋体, serif' }}>
      <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 8, marginBottom: 16, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}
          onClick={() => openEdit({ type: 'profile.name', label: '姓名', value: p.name || '', placeholder: '输入姓名' })}>
          {p.name || '未填写'}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6, fontSize: 12, color: '#374151' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.phone', label: '电话', value: p.phone || '', placeholder: '电话' })}>电话：{p.phone || '—'}</span>
          <span style={{ cursor: 'pointer' }} onClick={() => openEdit({ type: 'profile.email', label: '邮箱', value: p.email || '', placeholder: '邮箱' })}>邮箱：{p.email || '—'}</span>
        </div>
      </div>
      {p.summary && (
        <Section title="个人评价" onEdit={() => openEdit({ type: 'profile.summary', label: '个人简介', value: p.summary, placeholder: '输入个人简介', multiline: true })}>
          <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.8 }}>{p.summary}</p>
        </Section>
      )}
      {(resume.work || []).length > 0 && (
        <Section title="主要学习及工作经历" onAdd={() => addEntry('work')}>
          {(resume.work || []).map((job: any) => (
            <EntryCard key={job.id} onDelete={() => deleteEntry('work', job.id)}>
              <EntryHeader company={job.company} position={job.position} start={job.startDate} end={job.current ? '至今' : job.endDate} />
              {(job.highlights || []).map((h: string, i: number) => <Bullet key={i} text={h} />)}
            </EntryCard>
          ))}
        </Section>
      )}
    </div>
  );
}

// ──── 模板5：创意 ────
function TemplateCreative({ resume, p, openEdit, addEntry, deleteEntry }: any) {
  return (
    <div style={{ display: 'flex', minHeight: 700, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
      <div style={{ width: 200, background: '#1e293b', color: '#fff', padding: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, cursor: 'pointer' }}
          onClick={() => openEdit({ type: 'profile.name', label: '姓名', value: p.name || '', placeholder: '输入姓名' })}>
          {p.name || '未填写'}
        </h1>
        <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16, cursor: 'pointer' }}
          onClick={() => openEdit({ type: 'profile.titles', label: '求职目标', value: p.titles?.default || '', placeholder: '输入求职目标' })}>
          {p.titles?.default || '未填写目标'}
        </div>
        {p.email && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{p.email}</div>}
        {p.phone && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{p.phone}</div>}
        {(resume.skills || []).length > 0 && (
          <div style={{ marginTop: 16 }}>
            {(resume.skills || []).map((cat: any) => (
              <div key={cat.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{cat.category}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {(cat.skills || []).map((s: any, i: number) => (
                    <span key={i} style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>{s.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: 24 }}>
        {p.summary && (
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, marginBottom: 16, padding: 12, background: '#f1f5f9', borderRadius: 8, cursor: 'pointer' }}
            onClick={() => openEdit({ type: 'profile.summary', label: '个人简介', value: p.summary, placeholder: '输入个人简介', multiline: true })}>
            {p.summary}
          </div>
        )}
        {(resume.work || []).length > 0 && (
          <Section title="工作经历" onAdd={() => addEntry('work')}>
            {(resume.work || []).map((job: any) => (
              <EntryCard key={job.id} onDelete={() => deleteEntry('work', job.id)}>
                <EntryHeader company={job.company} position={job.position} start={job.startDate} end={job.current ? '至今' : job.endDate} />
                {(job.highlights || []).map((h: string, i: number) => <Bullet key={i} text={h} />)}
              </EntryCard>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

// ──── 通用辅助组件 ────
function Section({ title, children, onEdit, onAdd }: { title: string; children: React.ReactNode; onEdit?: () => void; onAdd?: () => void }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #1e3a5f', paddingBottom: 4, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a5f', letterSpacing: 1 }}>{title}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onAdd && (
            <button onClick={onAdd} style={{ fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: 500, padding: '0 4px' }}>+ 添加</button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function EntryCard({ children, onDelete }: { children: React.ReactNode; onDelete?: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', marginBottom: 14 }}
    >
      {hover && onDelete && (
        <button
          onClick={onDelete}
          style={{
            position: 'absolute', top: -2, right: -2,
            fontSize: 10, background: '#fef2f2', color: '#ef4444',
            border: '1px solid #fecaca', borderRadius: 6,
            cursor: 'pointer', padding: '1px 6px', zIndex: 10,
          }}
        >
          删除
        </button>
      )}
      {children}
    </div>
  );
}

function EntryHeader({ company, position, start, end }: { company: string; position?: string; start?: string; end?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
      <div>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{company || '未填写'}</span>
        {position && <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>{position}</span>}
      </div>
      {(start || end) && <span style={{ fontSize: 11, color: '#94a3b8' }}>{start} - {end}</span>}
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
      <span style={{ color: '#94a3b8', flexShrink: 0, fontSize: 12 }}>•</span>
      <span style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ──── 健康度计算 ────
function computeHealth(resume: Resume) {
  if (!resume) return null;
  let score = 100;
  if (!resume.profile?.name?.trim()) score -= 15;
  if (!resume.profile?.summary?.trim()) score -= 10;
  if (!resume.work?.length) score -= 25;
  if (!resume.education?.length) score -= 15;
  if (!resume.skills?.length) score -= 10;
  const hasQuant = (resume.work || []).some((w: any) =>
    (w.highlights || []).some((h: string) => /\d+[%￥万科]/.test(h))
  );
  if (!hasQuant) score -= 15;
  return { score: Math.max(0, score) };
}

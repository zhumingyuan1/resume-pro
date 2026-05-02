'use client';
// @ts-nocheck

import { useCallback } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { JdAnalysis } from '@/types/resume';

// 粘贴劫持处理
function usePaste() {
  return useCallback((e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);
}

// 内容可编辑的文本组件（通用版，对深浅背景都清晰）
function EditableText({ value, onSave, editMode }: {
  value: string;
  onSave: (v: string) => void;
  editMode: boolean;
}) {
  const handleBlur = useCallback((e: React.FocusEvent<HTMLSpanElement>) => {
    if (!editMode) return;
    const newVal = e.currentTarget.textContent?.trim() ?? '';
    if (newVal !== value) onSave(newVal);
  }, [editMode, value, onSave]);
  const handlePaste = usePaste();

  if (!editMode) {
    return <span>{value || <span style={{ color: '#9ca3af', fontStyle: 'italic' as const }}>未填写</span>}</span>;
  }

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onPaste={handlePaste}
      style={{
        outline: '2px solid #2563eb',
        outlineOffset: '2px',
        borderRadius: 3,
        boxShadow: '0 0 0 3px rgba(37,99,235,0.15)',
        cursor: 'text',
        minWidth: 20,
        padding: '1px 3px',
        margin: '0 -3px',
        display: 'inline',
        color: 'inherit',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(4px)',
        fontWeight: 600,
        fontStyle: 'normal',
      }}
    >
      {value || <span style={{ color: '#64748b', fontStyle: 'italic' as const }}>点击填写</span>}
    </span>
  );
}

// 内容可编辑的列表项（描述类文字用这个）
function EditableHighlight({ value, onSave, editMode }: {
  value: string;
  onSave: (v: string) => void;
  editMode: boolean;
}) {
  const handleBlur = useCallback((e: React.FocusEvent<HTMLSpanElement>) => {
    if (!editMode) return;
    const newVal = e.currentTarget.textContent?.trim() ?? '';
    if (newVal !== value) onSave(newVal);
  }, [editMode, value, onSave]);
  const handlePaste = usePaste();

  if (!editMode) {
    return <span className="leading-relaxed">{value}</span>;
  }

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onPaste={handlePaste}
      style={{
        outline: '2px solid #f59e0b',
        outlineOffset: '2px',
        borderRadius: 3,
        boxShadow: '0 0 0 3px rgba(245,158,11,0.15)',
        cursor: 'text',
        minWidth: 60,
        padding: '1px 4px',
        margin: '0 -4px',
        display: 'block',
        color: '#374151',
        background: 'rgba(255,251,235,0.97)',
        backdropFilter: 'blur(4px)',
        fontWeight: 500,
        lineHeight: 1.65,
      }}
    >
      {value}
    </span>
  );
}

export default function ResumePreview() {
  const { currentResume, selectedTemplate, jdAnalysis, editMode, updateResume } = useResumeStore();
  const resume = currentResume;

  if (!resume) {
    return (
      <div className="flex items-center justify-center h-full min-h-[297mm] text-slate-400">
        <p>左边填写内容，预览会实时显示</p>
      </div>
    );
  }

  const health = computeHealth(resume, jdAnalysis);

  const patch = useCallback((updates: any) => {
    updateResume(resume.id, updates);
  }, [resume.id, updateResume]);

  const patchProfile = useCallback((key: string, value: any) => {
    patch({ profile: { ...resume.profile, [key]: value } });
  }, [patch, resume.profile]);

  const patchWork = useCallback((idx: number, key: string, value: string) => {
    const updated = (resume.work || []).map((w: any, i: number) =>
      i === idx ? { ...w, [key]: value } : w
    );
    patch({ work: updated });
  }, [patch, resume.work]);

  const patchWorkHighlight = useCallback((idx: number, hIdx: number, value: string) => {
    const updated = (resume.work || []).map((w: any, i: number) => {
      if (i !== idx) return w;
      const highlights = (w.highlights || []).map((h: string, hi: number) =>
        hi === hIdx ? value : h
      );
      return { ...w, highlights };
    });
    patch({ work: updated });
  }, [patch, resume.work]);

  const patchEdu = useCallback((idx: number, key: string, value: string) => {
    const updated = (resume.education || []).map((e: any, i: number) =>
      i === idx ? { ...e, [key]: value } : e
    );
    patch({ education: updated });
  }, [patch, resume.education]);

  const patchProj = useCallback((idx: number, key: string, value: string) => {
    const updated = (resume.projects || []).map((p: any, i: number) =>
      i === idx ? { ...p, [key]: value } : p
    );
    patch({ projects: updated });
  }, [patch, resume.projects]);

  const patchProjHighlight = useCallback((idx: number, hIdx: number, value: string) => {
    const updated = (resume.projects || []).map((p: any, i: number) => {
      if (i !== idx) return p;
      const highlights = (p.highlights || []).map((h: string, hi: number) =>
        hi === hIdx ? value : h
      );
      return { ...p, highlights };
    });
    patch({ projects: updated });
  }, [patch, resume.projects]);

  const patchSummary = useCallback((v: string) => {
    patch({ profile: { ...resume.profile, summary: v } });
  }, [patch, resume.profile]);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {editMode && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          color: '#fff', textAlign: 'center', padding: '6px 12px',
          fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          ✏️ 预览编辑模式 — 点击任意文字直接修改，支持粘贴
        </div>
      )}

      {health && (
        <div style={{
          position: 'absolute', top: editMode ? 36 : 8, right: 8, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        }}>
          {health.score !== null && (
            <div style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: health.score >= 80 ? '#ecfdf5' : health.score >= 60 ? '#fffbeb' : '#fef2f2',
              color: health.score >= 80 ? '#10b981' : health.score >= 60 ? '#f59e0b' : '#ef4444',
              border: `1px solid ${health.score >= 80 ? '#a7f3d0' : health.score >= 60 ? '#fde68a' : '#fecaca'}`,
            }}>
              健康度 {health.score}
            </div>
          )}
          {health.jdCoverage !== null && jdAnalysis && (
            <div style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: health.jdCoverage >= 50 ? '#eff6ff' : '#fef2f2',
              color: health.jdCoverage >= 50 ? '#2563eb' : '#ef4444',
              border: `1px solid ${health.jdCoverage >= 50 ? '#bfdbfe' : '#fecaca'}`,
            }}>
              JD覆盖 {health.jdCoverage}%
            </div>
          )}
        </div>
      )}

      <div style={{ paddingTop: editMode ? 36 : 0, transition: 'padding-top 0.2s' }}>
        {selectedTemplate === 'template-2' ? (
          <Template2Editable resume={resume} editMode={editMode} patchProfile={patchProfile} patchSummary={patchSummary} patchWork={patchWork} patchWorkHighlight={patchWorkHighlight} patchEdu={patchEdu} />
        ) : selectedTemplate === 'template-3' ? (
          <Template3Editable resume={resume} editMode={editMode} patchProfile={patchProfile} patchSummary={patchSummary} patchWork={patchWork} patchWorkHighlight={patchWorkHighlight} patchEdu={patchEdu} />
        ) : selectedTemplate === 'template-4' ? (
          <Template4Editable resume={resume} editMode={editMode} patchProfile={patchProfile} patchSummary={patchSummary} patchWork={patchWork} patchWorkHighlight={patchWorkHighlight} patchEdu={patchEdu} />
        ) : selectedTemplate === 'template-5' ? (
          <Template5Editable resume={resume} editMode={editMode} patchProfile={patchProfile} patchSummary={patchSummary} patchWork={patchWork} patchWorkHighlight={patchWorkHighlight} patchEdu={patchEdu} patchProj={patchProj} patchProjHighlight={patchProjHighlight} />
        ) : (
          <Template1Editable resume={resume} editMode={editMode} patchProfile={patchProfile} patchSummary={patchSummary} patchWork={patchWork} patchWorkHighlight={patchWorkHighlight} patchEdu={patchEdu} patchProj={patchProj} patchProjHighlight={patchProjHighlight} />
        )}
      </div>
    </div>
  );
}

// ──── 模板1：技术岗 ────
function Template1Editable({ resume, editMode, patchProfile, patchSummary, patchWork, patchWorkHighlight, patchEdu, patchProj, patchProjHighlight }: any) {
  const p = resume.profile || {};
  return (
    <div className="flex" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="w-[30%] bg-slate-800 text-white p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2"><EditableText value={p.name} onSave={(v) => patchProfile('name', v)} editMode={editMode} /></h1>
          <p className="text-base text-slate-300 mb-3"><EditableText value={p.titles?.default || ''} onSave={(v) => patchProfile('titles', { ...p.titles, default: v })} editMode={editMode} /></p>
          <div className="space-y-1 text-sm text-slate-300">
            <p><EditableText value={p.email || ''} onSave={(v) => patchProfile('email', v)} editMode={editMode} /></p>
            <p><EditableText value={p.phone || ''} onSave={(v) => patchProfile('phone', v)} editMode={editMode} /></p>
            <p><EditableText value={p.location || ''} onSave={(v) => patchProfile('location', v)} editMode={editMode} /></p>
          </div>
        </div>
        {(resume.skills || []).length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400">技能</h2>
            <div className="space-y-3">
              {(resume.skills || []).map((cat: any) => (
                <div key={cat.id}>
                  <p className="text-xs font-medium text-slate-300 mb-1">{cat.category}</p>
                  <div className="flex flex-wrap gap-1">
                    {(cat.skills || []).map((s: any, i: number) => <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">{s.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 p-6 bg-white">
        {p.summary && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-2 text-slate-800 border-b border-slate-200 pb-1">个人简介</h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-2"><EditableText value={p.summary} onSave={patchSummary} editMode={editMode} /></p>
          </div>
        )}
        {(resume.work || []).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-800 border-b border-slate-200 pb-1">工作经历</h2>
            <div className="space-y-4">
              {(resume.work || []).map((job: any, idx: number) => (
                <div key={job.id}>
                  <div className="flex justify-between items-baseline mb-1 flex-wrap gap-1">
                    <div>
                      <span className="font-semibold text-slate-900"><EditableText value={job.position} onSave={(v) => patchWork(idx, 'position', v)} editMode={editMode} /></span>
                      <span className="text-slate-500"> · </span>
                      <span className="text-slate-700"><EditableText value={job.company} onSave={(v) => patchWork(idx, 'company', v)} editMode={editMode} /></span>
                    </div>
                    <span className="text-xs text-slate-400">
                      <EditableText value={job.startDate} onSave={(v) => patchWork(idx, 'startDate', v)} editMode={editMode} />
                      {' - '}
                      <EditableText value={job.endDate === 'present' ? '至今' : (job.endDate || '')} onSave={(v) => patchWork(idx, 'endDate', v === '至今' ? 'present' : v)} editMode={editMode} />
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {(job.highlights || []).filter(Boolean).map((hl: string, hi: number) => (
                      <li key={hi} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <EditableHighlight value={hl} onSave={(v) => patchWorkHighlight(idx, hi, v)} editMode={editMode} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {(resume.education || []).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-800 border-b border-slate-200 pb-1">教育背景</h2>
            <div className="space-y-2">
              {(resume.education || []).map((e: any, idx: number) => (
                <div key={e.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline flex-wrap gap-1">
                    <div>
                      <span className="font-semibold text-slate-900"><EditableText value={e.institution} onSave={(v) => patchEdu(idx, 'institution', v)} editMode={editMode} /></span>
                      <span className="text-slate-500 ml-2">
                        <EditableText value={e.degree} onSave={(v) => patchEdu(idx, 'degree', v)} editMode={editMode} />
                        {' · '}
                        <EditableText value={e.field} onSave={(v) => patchEdu(idx, 'field', v)} editMode={editMode} />
                      </span>
                      {e.gpa && <span className="text-xs text-slate-400 ml-2">GPA {e.gpa}</span>}
                    </div>
                    <span className="text-xs text-slate-400">
                      <EditableText value={e.startDate} onSave={(v) => patchEdu(idx, 'startDate', v)} editMode={editMode} />
                      {' - '}
                      <EditableText value={e.endDate || ''} onSave={(v) => patchEdu(idx, 'endDate', v)} editMode={editMode} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {(resume.projects || []).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-800 border-b border-slate-200 pb-1">项目经历</h2>
            <div className="space-y-3">
              {(resume.projects || []).map((proj: any, idx: number) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-slate-900"><EditableText value={proj.name} onSave={(v) => patchProj(idx, 'name', v)} editMode={editMode} /></span>
                    {proj.role && <span className="text-xs text-slate-400"><EditableText value={proj.role} onSave={(v) => patchProj(idx, 'role', v)} editMode={editMode} /></span>}
                  </div>
                  {(proj.technologies || []).length > 0 && <p className="text-xs text-slate-400 mb-1">技术栈：{(proj.technologies || []).join(' / ')}</p>}
                  <ul className="space-y-1">
                    {(proj.highlights || []).filter(Boolean).map((hl: string, hi: number) => (
                      <li key={hi} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <EditableHighlight value={hl} onSave={(v) => patchProjHighlight(idx, hi, v)} editMode={editMode} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──── 模板2：金融 ────
function Template2Editable({ resume, editMode, patchProfile, patchSummary, patchWork, patchWorkHighlight, patchEdu }: any) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-white" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="text-center mb-4 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-1"><EditableText value={p.name} onSave={(v) => patchProfile('name', v)} editMode={editMode} /></h1>
        <p className="text-sm text-slate-600"><EditableText value={p.titles?.default || ''} onSave={(v) => patchProfile('titles', { ...p.titles, default: v })} editMode={editMode} /></p>
        <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
          <span><EditableText value={p.email || ''} onSave={(v) => patchProfile('email', v)} editMode={editMode} /></span>
          <span><EditableText value={p.phone || ''} onSave={(v) => patchProfile('phone', v)} editMode={editMode} /></span>
          <span><EditableText value={p.location || ''} onSave={(v) => patchProfile('location', v)} editMode={editMode} /></span>
        </div>
      </div>
      {p.summary && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">个人简介</h2>
          <p className="text-xs text-slate-600 leading-relaxed"><EditableText value={p.summary} onSave={patchSummary} editMode={editMode} /></p>
        </div>
      )}
      {(resume.work || []).length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">工作经历</h2>
          {(resume.work || []).map((job: any, idx: number) => (
            <div key={job.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-slate-900 text-sm"><EditableText value={job.company} onSave={(v) => patchWork(idx, 'company', v)} editMode={editMode} /></span>
                <span className="text-xs text-slate-400">
                  <EditableText value={job.startDate} onSave={(v) => patchWork(idx, 'startDate', v)} editMode={editMode} />
                  {' - '}
                  <EditableText value={job.endDate === 'present' ? '至今' : (job.endDate || '')} onSave={(v) => patchWork(idx, 'endDate', v === '至今' ? 'present' : v)} editMode={editMode} />
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-1"><EditableText value={job.position} onSave={(v) => patchWork(idx, 'position', v)} editMode={editMode} /></p>
              {(job.highlights || []).filter(Boolean).map((hl: string, hi: number) => (
                <p key={hi} className="text-xs text-slate-600 leading-relaxed">• <EditableHighlight value={hl} onSave={(v) => patchWorkHighlight(idx, hi, v)} editMode={editMode} /></p>
              ))}
            </div>
          ))}
        </div>
      )}
      {(resume.education || []).length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">教育背景</h2>
          {(resume.education || []).map((e: any, idx: number) => (
            <div key={e.id} className="flex justify-between text-xs">
              <span className="text-slate-900">
                <EditableText value={e.institution} onSave={(v) => patchEdu(idx, 'institution', v)} editMode={editMode} />
                {' '}<EditableText value={e.degree} onSave={(v) => patchEdu(idx, 'degree', v)} editMode={editMode} />
                {' · '}<EditableText value={e.field} onSave={(v) => patchEdu(idx, 'field', v)} editMode={editMode} />
              </span>
              <span className="text-slate-400">
                <EditableText value={e.startDate} onSave={(v) => patchEdu(idx, 'startDate', v)} editMode={editMode} />
                {' - '}<EditableText value={e.endDate || ''} onSave={(v) => patchEdu(idx, 'endDate', v)} editMode={editMode} />
              </span>
            </div>
          ))}
        </div>
      )}
      {(resume.skills || []).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">技能</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {(resume.skills || []).flatMap((cat: any) => (cat.skills || []).map((s: any, i: number) => <span key={i} className="text-slate-600">{s.name}</span>))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──── 模板3：快消 ────
function Template3Editable({ resume, editMode, patchProfile, patchSummary, patchWork, patchWorkHighlight, patchEdu }: any) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-orange-50" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-1"><EditableText value={p.name} onSave={(v) => patchProfile('name', v)} editMode={editMode} /></h1>
          <p className="text-base text-orange-600 font-medium mb-2"><EditableText value={p.titles?.default || ''} onSave={(v) => patchProfile('titles', { ...p.titles, default: v })} editMode={editMode} /></p>
          <div className="flex gap-3 text-xs text-slate-500">
            <span><EditableText value={p.email || ''} onSave={(v) => patchProfile('email', v)} editMode={editMode} /></span>
            <span><EditableText value={p.phone || ''} onSave={(v) => patchProfile('phone', v)} editMode={editMode} /></span>
            <span><EditableText value={p.location || ''} onSave={(v) => patchProfile('location', v)} editMode={editMode} /></span>
          </div>
        </div>
      </div>
      {p.summary && (
        <div className="mb-4 bg-white rounded-lg p-3">
          <p className="text-sm text-slate-600 leading-relaxed"><EditableText value={p.summary} onSave={patchSummary} editMode={editMode} /></p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4">
          <h2 className="text-sm font-bold text-orange-600 mb-3">工作经历</h2>
          {(resume.work || []).map((job: any, idx: number) => (
            <div key={job.id} className="mb-3">
              <p className="font-medium text-slate-900 text-sm"><EditableText value={job.company} onSave={(v) => patchWork(idx, 'company', v)} editMode={editMode} /> · <EditableText value={job.position} onSave={(v) => patchWork(idx, 'position', v)} editMode={editMode} /></p>
              <p className="text-xs text-slate-400 mb-1"><EditableText value={job.startDate} onSave={(v) => patchWork(idx, 'startDate', v)} editMode={editMode} /> - <EditableText value={job.endDate === 'present' ? '至今' : (job.endDate || '')} onSave={(v) => patchWork(idx, 'endDate', v === '至今' ? 'present' : v)} editMode={editMode} /></p>
              {(job.highlights || []).filter(Boolean).map((hl: string, hi: number) => (
                <p key={hi} className="text-xs text-slate-600 leading-relaxed">• <EditableHighlight value={hl} onSave={(v) => patchWorkHighlight(idx, hi, v)} editMode={editMode} /></p>
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h2 className="text-sm font-bold text-orange-600 mb-3">教育背景</h2>
            {(resume.education || []).map((e: any, idx: number) => (
              <div key={e.id} className="mb-2">
                <p className="font-medium text-slate-900 text-sm"><EditableText value={e.institution} onSave={(v) => patchEdu(idx, 'institution', v)} editMode={editMode} /></p>
                <p className="text-xs text-slate-500"><EditableText value={e.degree} onSave={(v) => patchEdu(idx, 'degree', v)} editMode={editMode} /> · <EditableText value={e.field} onSave={(v) => patchEdu(idx, 'field', v)} editMode={editMode} /></p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg p-4">
            <h2 className="text-sm font-bold text-orange-600 mb-3">技能</h2>
            {(resume.skills || []).map((cat: any) => (
              <div key={cat.id} className="mb-2">
                <p className="text-xs font-medium text-slate-700 mb-1">{cat.category}</p>
                <div className="flex flex-wrap gap-1">
                  {(cat.skills || []).map((s: any, i: number) => <span key={i} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">{s.name}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──── 模板4：国企 ────
function Template4Editable({ resume, editMode, patchProfile, patchSummary, patchWork, patchWorkHighlight, patchEdu }: any) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-white" style={{ minHeight: '297mm', fontFamily: '宋体, serif' }}>
      <table className="w-full text-xs mb-4 border-collapse">
        <tbody>
          <tr>
            <td className="border border-slate-800 p-1 w-16">姓名</td>
            <td className="border border-slate-800 p-1"><EditableText value={p.name} onSave={(v) => patchProfile('name', v)} editMode={editMode} /></td>
            <td className="border border-slate-800 p-1 w-16">性别</td>
            <td className="border border-slate-800 p-1 w-20"></td>
          </tr>
          <tr>
            <td className="border border-slate-800 p-1">民族</td>
            <td className="border border-slate-800 p-1"></td>
            <td className="border border-slate-800 p-1">出生年月</td>
            <td className="border border-slate-800 p-1"></td>
          </tr>
          <tr>
            <td className="border border-slate-800 p-1">籍贯</td>
            <td className="border border-slate-800 p-1"></td>
            <td className="border border-slate-800 p-1">政治面貌</td>
            <td className="border border-slate-800 p-1"></td>
          </tr>
          <tr>
            <td className="border border-slate-800 p-1">电话</td>
            <td className="border border-slate-800 p-1"><EditableText value={p.phone || ''} onSave={(v) => patchProfile('phone', v)} editMode={editMode} /></td>
            <td className="border border-slate-800 p-1">邮箱</td>
            <td className="border border-slate-800 p-1"><EditableText value={p.email || ''} onSave={(v) => patchProfile('email', v)} editMode={editMode} /></td>
          </tr>
        </tbody>
      </table>
      {p.summary && (
        <div className="mb-4 text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">个人评价</h2>
          <p className="text-slate-700 leading-relaxed"><EditableText value={p.summary} onSave={patchSummary} editMode={editMode} /></p>
        </div>
      )}
      {(resume.work || []).length > 0 && (
        <div className="mb-3 text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">主要学习及工作经历</h2>
          {(resume.work || []).map((job: any, idx: number) => (
            <div key={job.id} className="mb-2">
              <p className="text-slate-700">
                <EditableText value={job.startDate} onSave={(v) => patchWork(idx, 'startDate', v)} editMode={editMode} />
                {' - '}
                <EditableText value={job.endDate === 'present' ? '至今' : (job.endDate || '')} onSave={(v) => patchWork(idx, 'endDate', v === '至今' ? 'present' : v)} editMode={editMode} />
                {' '}
                <EditableText value={job.company} onSave={(v) => patchWork(idx, 'company', v)} editMode={editMode} />
                {' '}
                <EditableText value={job.position} onSave={(v) => patchWork(idx, 'position', v)} editMode={editMode} />
              </p>
              {(job.highlights || []).filter(Boolean).map((hl: string, hi: number) => (
                <p key={hi} className="text-slate-600">• <EditableHighlight value={hl} onSave={(v) => patchWorkHighlight(idx, hi, v)} editMode={editMode} /></p>
              ))}
            </div>
          ))}
        </div>
      )}
      {(resume.education || []).length > 0 && (
        <div className="mb-3 text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">教育背景</h2>
          {(resume.education || []).map((e: any, idx: number) => (
            <p key={e.id} className="text-slate-700 text-xs">
              <EditableText value={e.startDate} onSave={(v) => patchEdu(idx, 'startDate', v)} editMode={editMode} />
              {' - '}
              <EditableText value={e.endDate || ''} onSave={(v) => patchEdu(idx, 'endDate', v)} editMode={editMode} />
              {' '}
              <EditableText value={e.institution} onSave={(v) => patchEdu(idx, 'institution', v)} editMode={editMode} />
              {' '}
              <EditableText value={e.degree} onSave={(v) => patchEdu(idx, 'degree', v)} editMode={editMode} />
              {' '}
              <EditableText value={e.field} onSave={(v) => patchEdu(idx, 'field', v)} editMode={editMode} />
            </p>
          ))}
        </div>
      )}
      {(resume.skills || []).length > 0 && (
        <div className="text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">特长及其他</h2>
          <p className="text-slate-600">{(resume.skills || []).flatMap((cat: any) => (cat.skills || []).map((s: any) => s.name)).join('、')}</p>
        </div>
      )}
    </div>
  );
}

// ──── 模板5：创意 ────
function Template5Editable({ resume, editMode, patchProfile, patchSummary, patchWork, patchWorkHighlight, patchEdu, patchProj, patchProjHighlight }: any) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-slate-50" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="grid grid-cols-[200px_1fr] gap-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900"><EditableText value={p.name} onSave={(v) => patchProfile('name', v)} editMode={editMode} /></h1>
            <p className="text-sm text-indigo-600 italic"><EditableText value={p.titles?.default || ''} onSave={(v) => patchProfile('titles', { ...p.titles, default: v })} editMode={editMode} /></p>
          </div>
          {p.email && (
            <div className="text-xs text-slate-500">
              <p className="font-medium text-slate-700 mb-1">联系</p>
              <p><EditableText value={p.email} onSave={(v) => patchProfile('email', v)} editMode={editMode} /></p>
              <p><EditableText value={p.phone || ''} onSave={(v) => patchProfile('phone', v)} editMode={editMode} /></p>
              <p><EditableText value={p.location || ''} onSave={(v) => patchProfile('location', v)} editMode={editMode} /></p>
            </div>
          )}
          {(resume.skills || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">技能</p>
              {(resume.skills || []).map((cat: any) => (
                <div key={cat.id} className="mb-2">
                  <p className="text-xs font-medium text-slate-600 mb-1">{cat.category}</p>
                  <div className="flex flex-wrap gap-1">
                    {(cat.skills || []).map((s: any, i: number) => <span key={i} className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{s.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {(resume.education || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">教育</p>
              {(resume.education || []).map((e: any, idx: number) => (
                <div key={e.id} className="text-xs">
                  <p className="font-medium text-slate-700"><EditableText value={e.institution} onSave={(v) => patchEdu(idx, 'institution', v)} editMode={editMode} /></p>
                  <p className="text-slate-500"><EditableText value={e.degree} onSave={(v) => patchEdu(idx, 'degree', v)} editMode={editMode} /> · <EditableText value={e.field} onSave={(v) => patchEdu(idx, 'field', v)} editMode={editMode} /></p>
                  <p className="text-slate-400"><EditableText value={e.startDate} onSave={(v) => patchEdu(idx, 'startDate', v)} editMode={editMode} /> - <EditableText value={e.endDate || ''} onSave={(v) => patchEdu(idx, 'endDate', v)} editMode={editMode} /></p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          {p.summary && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed"><EditableText value={p.summary} onSave={patchSummary} editMode={editMode} /></p>
            </div>
          )}
          {(resume.work || []).length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-3">工作经历</h2>
              <div className="space-y-3">
                {(resume.work || []).map((job: any, idx: number) => (
                  <div key={job.id} className="border-l-2 border-indigo-200 pl-3">
                    <p className="font-medium text-slate-900 text-sm"><EditableText value={job.position} onSave={(v) => patchWork(idx, 'position', v)} editMode={editMode} /> · <EditableText value={job.company} onSave={(v) => patchWork(idx, 'company', v)} editMode={editMode} /></p>
                    <p className="text-xs text-slate-400 mb-1"><EditableText value={job.startDate} onSave={(v) => patchWork(idx, 'startDate', v)} editMode={editMode} /> - <EditableText value={job.endDate === 'present' ? '至今' : (job.endDate || '')} onSave={(v) => patchWork(idx, 'endDate', v === '至今' ? 'present' : v)} editMode={editMode} /></p>
                    {(job.highlights || []).filter(Boolean).map((hl: string, hi: number) => (
                      <p key={hi} className="text-xs text-slate-600 leading-relaxed">• <EditableHighlight value={hl} onSave={(v) => patchWorkHighlight(idx, hi, v)} editMode={editMode} /></p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(resume.projects || []).length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-3">项目作品</h2>
              <div className="grid grid-cols-2 gap-2">
                {(resume.projects || []).map((proj: any, idx: number) => (
                  <div key={proj.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                    <p className="font-medium text-slate-700"><EditableText value={proj.name} onSave={(v) => patchProj(idx, 'name', v)} editMode={editMode} /></p>
                    {(proj.highlights || []).filter(Boolean).slice(0, 1).map((hl: string, hi: number) => (
                      <p key={hi} className="text-slate-500"><EditableHighlight value={hl} onSave={(v) => patchProjHighlight(idx, hi, v)} editMode={editMode} /></p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──── 健康分计算 ────
function computeHealth(resume: any, jdAnalysis: JdAnalysis | null) {
  if (!resume) return null;
  let score = 100;
  let jdCoverage: number | null = null;
  const works = resume.work || [];
  works.forEach((w: any) => {
    const text = (w.highlights || []).join(' ');
    if (!/[\d]+%|\d+[万亿千万百万]/.test(text)) score -= 10;
  });
  if (!resume.profile?.summary?.trim()) score -= 8;
  if (jdAnalysis) {
    const { matchedKeywords, missingKeywords } = jdAnalysis;
    if (missingKeywords?.length > 0) {
      const allText = works.map((w: any) => (w.highlights || []).join(' ')).join(' ');
      const covered = matchedKeywords?.filter((k: string) => allText.includes(k)).length || 0;
      const total = matchedKeywords?.length + missingKeywords?.length;
      jdCoverage = total > 0 ? Math.round((covered / total) * 100) : null;
    }
  }
  return { score: Math.max(0, score), jdCoverage };
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { useResumeStore } from '@/lib/resume-store';

function ResumePrintContent({ resume }: { resume: any }) {
  if (!resume) return null;
  const p = resume.profile || {};
  const fmt = (d: string) => !d ? '' : d === 'present' ? '至今' : d;

  return (
    <div style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '16mm 18mm',
      fontFamily: '"PingFang SC", "Microsoft YaHei", "Source Han Sans SC", sans-serif',
      fontSize: '10.5pt',
      lineHeight: 1.65,
      color: '#1a1a1a',
      background: '#fff',
      boxSizing: 'border-box',
    }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: '18pt', fontWeight: 800, color: '#111' }}>{p.name || '姓名'}</div>
        <div style={{ fontSize: '11pt', color: '#555', marginBottom: 4 }}>{p.titles?.default || p.title || ''}</div>
        <div style={{ fontSize: '9.5pt', color: '#666', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {p.email && <span>📧 {p.email}</span>}
          {p.phone && <span>📱 {p.phone}</span>}
          {p.location && <span>📍 {p.location}</span>}
        </div>
      </div>

      {p.summary && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1.5px solid #1a1a1a' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 4 }}>个人简介</div>
          <div style={{ fontSize: '9.5pt', color: '#444', lineHeight: 1.8 }}>{p.summary}</div>
        </div>
      )}

      {(resume.work || []).length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1.5px solid #1a1a1a' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6 }}>工作经历</div>
          {(resume.work || []).map((job: any) => (
            <div key={job.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '10pt', color: '#1a1a1a' }}>{job.position || ''}</span>
                  {job.company && <span style={{ color: '#555', marginLeft: 6 }}>· {job.company}</span>}
                </div>
                <span style={{ fontSize: '9pt', color: '#777' }}>{fmt(job.startDate)} - {fmt(job.endDate)}</span>
              </div>
              {(job.highlights || []).filter(Boolean).map((h: string, i: number) => (
                <div key={i} style={{ fontSize: '9.5pt', color: '#444', lineHeight: 1.6, paddingLeft: 12 }}>• {h}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(resume.education || []).length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1.5px solid #1a1a1a' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6 }}>教育背景</div>
          {(resume.education || []).map((e: any) => (
            <div key={e.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '10pt', color: '#1a1a1a' }}>{e.institution || ''}</span>
                <span style={{ fontSize: '9pt', color: '#777' }}>{fmt(e.startDate)} - {fmt(e.endDate)}</span>
              </div>
              <div style={{ fontSize: '9.5pt', color: '#555' }}>
                {[e.degree, e.field].filter(Boolean).join(' · ')}{e.gpa ? ` · GPA ${e.gpa}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {(resume.projects || []).length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1.5px solid #1a1a1a' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6 }}>项目经历</div>
          {(resume.projects || []).map((proj: any) => (
            <div key={proj.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: '10pt', color: '#1a1a1a' }}>{proj.name || ''}</span>
                {proj.role && <span style={{ fontSize: '9pt', color: '#777' }}>{proj.role}</span>}
              </div>
              {(proj.technologies || []).length > 0 && (
                <div style={{ fontSize: '9pt', color: '#666', marginBottom: 2 }}>技术栈：{(proj.technologies || []).join(' / ')}</div>
              )}
              {(proj.highlights || []).filter(Boolean).map((h: string, i: number) => (
                <div key={i} style={{ fontSize: '9.5pt', color: '#444', lineHeight: 1.6, paddingLeft: 12 }}>• {h}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(resume.skills || []).length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1.5px solid #1a1a1a' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6 }}>技能特长</div>
          {(resume.skills || []).map((cat: any) => (
            <div key={cat.id} style={{ marginBottom: 5 }}>
              <span style={{ fontWeight: 600, fontSize: '9.5pt', color: '#1a1a1a' }}>{cat.category}：</span>
              <span style={{ fontSize: '9.5pt', color: '#444' }}>{(cat.skills || []).map((s: any) => s.name || '').join('、')}</span>
            </div>
          ))}
        </div>
      )}

      {(resume.certifications || []).length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1.5px solid #1a1a1a' }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, marginBottom: 6 }}>证书</div>
          {(resume.certifications || []).map((c: any) => (
            <div key={c.id} style={{ fontSize: '9.5pt', color: '#444', marginBottom: 3 }}>{c.name || ''}{c.issuer ? ` · ${c.issuer}` : ''}{c.date ? ` ${c.date}` : ''}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExportButton() {
  const { currentResume } = useResumeStore();
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!currentResume) return;
    setShowExport(true);
    setExporting(true);

    try {
      // 等 DOM 完全渲染
      await new Promise(resolve => setTimeout(resolve, 200));

      const html2pdf = (await import('html2pdf.js')).default;
      const el = exportRef.current;
      if (!el) throw new Error('Export element not found');

      const filename = `${currentResume.profile?.name || '简历'}_简历Pro.pdf`;

      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save();

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF 导出失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setShowExport(false);
      setExporting(false);
    }
  };

  return (
    <>
      {/* 导出用隐藏 DOM，on mount 时渲染一次 currentResume */}
      {showExport && (
        <div
          ref={exportRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '210mm',
            background: '#fff',
            zIndex: -1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <ResumePrintContent resume={currentResume} />
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={!currentResume || exporting}
        style={{
          padding: '7px 14px',
          fontSize: 13,
          fontWeight: 500,
          color: !currentResume || exporting ? '#9ca3af' : '#6b7280',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          cursor: !currentResume || exporting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {exporting ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            生成中...
          </>
        ) : '📄 导出PDF'}
      </button>
    </>
  );
}

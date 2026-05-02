'use client';

import { useState, useRef } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume } from '@/types/resume';

// 生成简历打印用 HTML（独立完整文档，不依赖任何外部样式）
function buildResumeHtml(resume: any): string {
  const p = resume.profile || {};
  const formatDate = (d: string) => {
    if (!d) return '';
    if (d === 'present') return '至今';
    return d;
  };

  const workItems = (resume.work || []).map((job: any) => `
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <span style="font-weight:700;font-size:10pt;color:#1a1a1a">${job.position || ''} · ${job.company || ''}</span>
        <span style="font-size:9pt;color:#777">${formatDate(job.startDate)} - ${formatDate(job.endDate)}</span>
      </div>
      ${(job.highlights || []).filter(Boolean).map((h: string) => `<li style="font-size:9.5pt;color:#444;line-height:1.6;margin-bottom:2px;padding-left:12pt">${h}</li>`).join('')}
    </div>
  `).join('');

  const eduItems = (resume.education || []).map((e: any) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-weight:700;font-size:10pt;color:#1a1a1a">${e.institution || ''} · ${e.degree || ''} · ${e.field || ''}</span>
        <span style="font-size:9pt;color:#777">${formatDate(e.startDate)} - ${formatDate(e.endDate)}</span>
      </div>
      ${e.gpa ? `<div style="font-size:9pt;color:#666;margin-top:2px">GPA ${e.gpa}</div>` : ''}
      ${(e.achievements || []).length ? `<div style="font-size:9pt;color:#555;margin-top:2px">${(e.achievements || []).join(' · ')}</div>` : ''}
    </div>
  `).join('');

  const skillItems = (resume.skills || []).map((cat: any) => `
    <div style="margin-bottom:8px">
      <span style="font-weight:600;font-size:9.5pt;color:#1a1a1a">${cat.category || ''}：</span>
      <span style="font-size:9.5pt;color:#444">${(cat.skills || []).map((s: any) => s.name || '').join('、')}</span>
    </div>
  `).join('');

  const projectItems = (resume.projects || []).map((proj: any) => `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
        <span style="font-weight:700;font-size:10pt;color:#1a1a1a">${proj.name || ''}</span>
        ${proj.role ? `<span style="font-size:9pt;color:#777">${proj.role}</span>` : ''}
      </div>
      ${(proj.technologies || []).length ? `<div style="font-size:9pt;color:#666;margin-bottom:3px">技术栈：${(proj.technologies || []).join(' / ')}</div>` : ''}
      ${(proj.highlights || []).filter(Boolean).map((h: string) => `<li style="font-size:9.5pt;color:#444;line-height:1.6;margin-bottom:2px;padding-left:12pt">${h}</li>`).join('')}
    </div>
  `).join('');

  const certItems = (resume.certifications || []).map((c: any) => `
    <div style="font-size:9.5pt;color:#444;margin-bottom:4px">${c.name || ''} · ${c.issuer || ''} ${c.date || ''}</div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", sans-serif;
  font-size: 10.5pt;
  line-height: 1.65;
  color: #1a1a1a;
  padding: 16mm 18mm;
  width: 210mm;
  min-height: 297mm;
}
h1 { font-size: 16pt; font-weight: 800; margin-bottom: 2pt; color: #111; }
.job-title { font-size: 10pt; color: #555; margin-bottom: 5pt; }
.contact { font-size: 9pt; color: #666; margin-bottom: 10pt; line-height: 1.6; }
.section { margin-bottom: 12pt; }
.section-title {
  font-size: 11pt;
  font-weight: 700;
  border-bottom: 1.5px solid #1a1a1a;
  padding-bottom: 3pt;
  margin-bottom: 8pt;
  color: #111;
}
.item { margin-bottom: 8pt; }
ul { padding-left: 14pt; margin-top: 4pt; }
li { margin-bottom: 3pt; }
.print-only { display: block; }
</style>
</head>
<body>
<h1>${p.name || '姓名'}</h1>
<p class="job-title">${p.titles?.default || p.title || '求职目标'}</p>
<p class="contact">
  ${p.email ? '📧 ' + p.email + ' &nbsp;|&nbsp; ' : ''}
  ${p.phone ? '📱 ' + p.phone + ' &nbsp;|&nbsp; ' : ''}
  ${p.location ? '📍 ' + p.location : ''}
</p>

${p.summary ? `
<div class="section">
  <div class="section-title">个人简介</div>
  <p style="font-size:9.5pt;line-height:1.75;color:#444">${p.summary}</p>
</div>
` : ''}

${(resume.work || []).length ? `
<div class="section">
  <div class="section-title">工作经历</div>
  ${workItems}
</div>
` : ''}

${(resume.education || []).length ? `
<div class="section">
  <div class="section-title">教育背景</div>
  ${eduItems}
</div>
` : ''}

${(resume.projects || []).length ? `
<div class="section">
  <div class="section-title">项目经历</div>
  ${projectItems}
</div>
` : ''}

${(resume.skills || []).length ? `
<div class="section">
  <div class="section-title">技能特长</div>
  ${skillItems}
</div>
` : ''}

${(resume.certifications || []).length ? `
<div class="section">
  <div class="section-title">证书</div>
  ${certItems}
</div>
` : ''}
</body>
</html>`;
}

export default function ExportButton() {
  const { currentResume } = useResumeStore();
  const [exporting, setExporting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleExport = async () => {
    if (!currentResume) return;
    setExporting(true);

    try {
      // 动态导入避免 SSR 报错
      const html2pdf = (await import('html2pdf.js')).default;

      const html = buildResumeHtml(currentResume);

      // 用 iframe 承载内容，隔离样式，避免污染主文档
      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeWindow = iframe.contentWindow;
      if (!iframeWindow) return;

      iframe.style.display = 'block';
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.width = '794'; // A4 @ 96dpi
      iframe.height = '1123';

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // 等待字体/内容渲染
      await new Promise(resolve => setTimeout(resolve, 600));

      const filename = `${currentResume.profile?.name || '简历'}_简历Pro.pdf`;

      const opt = {
        margin: 0,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
        },
        pagebreak: { mode: 'avoid-all' as const },
      };

      await html2pdf().set(opt).from(iframeDoc.body).save();

      // 清理
      iframe.style.display = 'none';
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF 导出失败，请重试。错误信息：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* 隐藏的 iframe 用于承载打印内容 */}
      <iframe
        ref={iframeRef}
        style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}
        title="简历打印内容"
      />

      <button
        onClick={handleExport}
        disabled={!currentResume || exporting}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
        ) : '导出PDF'}
      </button>
    </>
  );
}

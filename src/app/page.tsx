'use client';

import { useState, useRef, useEffect } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import HealthScore from '@/components/HealthScore';
import TemplateSelector from '@/components/TemplateSelector';
import ExportButton from '@/components/ExportButton';
import JDMatcher from '@/components/JDMatcher';
import AIGenerateButton from '@/components/AIGenerateButton';
import HistoryButtons from '@/components/HistoryButtons';
import MultiVersionPanel from '@/components/MultiVersionPanel';
import ApplicationTracker from '@/components/ApplicationTracker';
import FormSectionBasic from '@/components/form/FormSectionBasic';
import FormSectionEducation from '@/components/form/FormSectionEducation';
import FormSectionWork from '@/components/form/FormSectionWork';
import FormSectionProjects from '@/components/form/FormSectionProjects';
import FormSectionSkills from '@/components/form/FormSectionSkills';
import ResumePreview from '@/components/ResumePreview';
import ImpactAnalyzer from '@/components/form/ImpactAnalyzer';
import type { Resume } from '@/types/resume';

const NAV = [
  { id: 'basic', label: '基本信息', sub: '个人信息', icon: 'user' },
  { id: 'education', label: '教育背景', sub: '学校专业', icon: 'graduation' },
  { id: 'work', label: '工作经历', sub: '实践经验', icon: 'briefcase' },
  { id: 'project', label: '项目经历', sub: '技术能力', icon: 'rocket' },
  { id: 'impact', label: '成就量化', sub: 'AI挖掘', icon: 'spark' },
  { id: 'skills', label: '技能特长', sub: '技术/语言', icon: 'star' },
];

const ICONS: Record<string, string> = {
  user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  graduation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  rocket: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`,
  star: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.24 12 2"/></svg>`,
  spark: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 2"/></svg>`,
};

// 计算简历填写进度
function computeProgress(resume: Resume | null): number {
  if (!resume) return 0;
  const p = resume.profile || {};
  let score = 0;
  if (p.name?.trim()) score += 15;           // 姓名
  if (p.titles?.default?.trim()) score += 10; // 求职目标
  if ((resume.education || []).length > 0) score += 15; // 教育经历
  if ((resume.work || []).length > 0) score += 25;   // 工作经历
  if ((resume.projects || []).length > 0) score += 15; // 项目经历
  if ((resume.skills || []).length > 0) score += 10; // 技能
  if (p.summary?.trim()) score += 10;         // 个人简介
  return Math.min(100, score);
}

function makeEmpty(): Resume {
  return {
    id: crypto.randomUUID(), userId: '', title: '我的简历', slug: 'my-resume',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    profile: { name: '', titles: { default: '' } },
    work: [], education: [], skills: [], projects: [],
    certifications: [], languages: [], achievements: [], interests: [], references: [],
  };
}

export default function HomePage() {
  const [view, setView] = useState<'home' | 'editor'>('home');
  const [section, setSection] = useState('basic');
  const { setCurrentResume, currentResume, editMode, setEditMode } = useResumeStore();
  const { jdAnalysis } = useResumeStore();
  const progress = computeProgress(currentResume);
  const [navWidth, setNavWidth] = useState(160);
  const [navDragging, setNavDragging] = useState(false);
  const navStart = useRef({ x: 0, w: 160 });
  const [split, setSplit] = useState(0.35);
  const [splitDragging, setSplitDragging] = useState(false);
  const splitStart = useRef({ x: 0, s: 0.35 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMultiVersion, setShowMultiVersion] = useState(false);
  const [showApplicationTracker, setShowApplicationTracker] = useState(false);

  const onNavDown = (e: React.MouseEvent) => {
    setNavDragging(true);
    navStart.current = { x: e.clientX, w: navWidth };
  };
  useEffect(() => {
    if (!navDragging) return;
    const move = (ev: MouseEvent) => {
      const delta = ev.clientX - navStart.current.x;
      setNavWidth(Math.max(140, Math.min(200, navStart.current.w + delta)));
    };
    const up = () => setNavDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [navDragging]);

  const onSplitDown = (e: React.MouseEvent) => {
    setSplitDragging(true);
    splitStart.current = { x: e.clientX, s: split };
  };
  useEffect(() => {
    if (!splitDragging) return;
    const move = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const avail = rect.width - navWidth - 8;
      const ratio = (ev.clientX - rect.left - navWidth) / avail;
      setSplit(Math.max(0.25, Math.min(0.45, ratio)));
    };
    const up = () => setSplitDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [splitDragging, navWidth, split]);

  const handleStart = () => {
    const { userId } = useResumeStore.getState();
    const resume = makeEmpty();
    resume.userId = userId;
    setCurrentResume(resume);
    setView('editor');
  };

  const renderForm = () => {
    switch (section) {
      case 'basic': return <FormSectionBasic />;
      case 'education': return <FormSectionEducation />;
      case 'work': return <FormSectionWork />;
      case 'project': return <FormSectionProjects />;
      case 'impact': return <ImpactAnalyzer />;
      case 'skills': return <FormSectionSkills />;
      default: return <FormSectionBasic />;
    }
  };

  if (view === 'home') {
    return <JDMatcher onStart={handleStart} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>
      {/* 顶部导航 */}
      <header style={{ height: 56, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, boxShadow: '0 3px 10px rgba(37,99,235,0.3)' }}>R</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1f2937' }}>简历Pro</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flexShrink: 0 }}>
            <TemplateSelector />
          </div>
          <HistoryButtons />
          <AIGenerateButton />
          <button onClick={() => setShowMultiVersion(true)}
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#f9fafb'; el.style.borderColor = '#d1d5db'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; }}>
            ✨ 多版本
          </button>
          <button onClick={() => setShowApplicationTracker(true)}
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#f9fafb'; el.style.borderColor = '#d1d5db'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; }}>
            📋 投递追踪
          </button>
          <button onClick={() => setView('home')}
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#f9fafb'; el.style.borderColor = '#d1d5db'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; }}>
            返回首页
          </button>
          <ExportButton />
          <button
            onClick={() => setEditMode(!editMode)}
            style={{
              padding: '7px 14px', fontSize: 13, fontWeight: 500,
              color: editMode ? '#fff' : '#6b7280',
              background: editMode ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : '#fff',
              border: '1px solid', borderColor: editMode ? '#4f46e5' : '#e5e7eb',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: editMode ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
            }}
          >
            {editMode ? '✓ 完成编辑' : '✏️ 编辑预览'}
          </button>
          <a href="/health"
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#f9fafb'; el.style.borderColor = '#d1d5db'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; }}>
            📋 体检报告
          </a>
        </div>
      </header>

      {/* 主体 */}
      <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧导航 */}
        <div style={{ width: navWidth, flexShrink: 0, display: 'flex', overflow: 'hidden' }}>
          <nav style={{ flex: 1, overflow: 'hidden', background: '#fff', borderRight: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
              {NAV.map(item => {
                const active = section === item.id;
                return (
                  <button key={item.id} onClick={() => setSection(item.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, marginBottom: 2, background: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#6b7280', border: active ? '1px solid #bfdbfe' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#f9fafb'; el.style.color = '#374151'; }}}
                    onMouseLeave={e => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = '#6b7280'; }}}>
                    <span style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} dangerouslySetInnerHTML={{ __html: ICONS[item.icon] || '' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: 'inherit', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                      <div style={{ fontSize: 10, color: active ? '#2563eb' : '#9ca3af', lineHeight: 1.2, marginTop: 1 }}>{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* 进度 */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(0,0,0,0.04)', background: '#fafafa' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6 }}>填写进度</div>
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #2563eb, #6366f1)', borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>{progress}% 完成</div>
            </div>
          </nav>
          {/* 拖拽线 */}
          <div onMouseDown={onNavDown} style={{ width: 6, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: navDragging ? 'rgba(37,99,235,0.1)' : 'transparent', transition: 'background 0.15s' }}>
            <div style={{ width: 2, height: '60%', background: navDragging ? '#2563eb' : 'rgba(0,0,0,0.08)', borderRadius: 1, transition: 'background 0.15s' }} />
          </div>
        </div>

        {/* 中间表单 */}
        <main style={{ flex: `1 1 ${split * 100}%`, overflowY: 'auto', padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', background: '#f1f5f9', minWidth: 280 }}>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 14, padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HealthScore />
            {renderForm()}
          </div>
        </main>

        {/* 分割线 */}
        <div onMouseDown={onSplitDown} style={{ width: 8, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: splitDragging ? 'rgba(37,99,235,0.08)' : 'transparent', transition: 'background 0.15s', zIndex: 10 }}>
          <div style={{ width: 3, height: '70%', background: splitDragging ? '#2563eb' : 'rgba(0,0,0,0.08)', borderRadius: 2, transition: 'background 0.15s', boxShadow: splitDragging ? '0 0 8px rgba(37,99,235,0.3)' : 'none' }} />
        </div>

        {/* 右侧预览 */}
        <aside style={{ flex: `1 1 ${(1 - split) * 100}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'transparent', minWidth: 260, padding: '10px 0 0' }}>
          <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 12, fontWeight: 600, color: '#9ca3af', flexShrink: 0, letterSpacing: '0.5px' }}>
            实时预览 · A4
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', justifyContent: 'center', background: '#e2e8f0' }}>
            <div style={{ width: '100%', aspectRatio: '210 / 297', background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <ResumePreview />
            </div>
          </div>
        </aside>
      </div>

      {/* 多版本生成面板 */}
      {showMultiVersion && <MultiVersionPanel onClose={() => setShowMultiVersion(false)} />}
      {showApplicationTracker && <ApplicationTracker onClose={() => setShowApplicationTracker(false)} />}
    </div>
  );
}

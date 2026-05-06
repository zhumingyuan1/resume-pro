'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import { useSearchParams } from 'next/navigation';
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
import FormSectionSkills from '@/components/form/FormSectionSkills';
import ResumePreview from '@/components/ResumePreview';
import ExperienceBuilder from '@/components/form/ExperienceBuilder';
import CoverLetterEditor from '@/components/form/CoverLetterEditor';
import ShareResume from '@/components/form/ShareResume';
import ReferFriend from '@/components/form/ReferFriend';
import InterviewPredictor from '@/components/form/InterviewPredictor';
import type { Resume } from '@/types/resume';

const NAV = [
  { id: 'basic', label: '基本信息', sub: '姓名/电话/邮箱', icon: 'user' },
  { id: 'education', label: '教育背景', sub: '学校/专业/时间', icon: 'graduation' },
  { id: 'experience', label: '写经历', sub: '工作/项目/AI改写', icon: 'briefcase' },
  { id: 'skills', label: '技能证书', sub: '技术/语言/其他', icon: 'star' },
  { id: 'cover', label: '写求职信', sub: 'AI帮你写', icon: 'mail' },
  { id: 'interview', label: '面试练习', sub: 'AI预测+模拟', icon: 'chat' },
  { id: 'share', label: '邀请朋友', sub: '分享/内推奖励', icon: 'share' },
];

const ICONS: Record<string, string> = {
  user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  briefcase: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  graduation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  star: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.24 12 2"/></svg>`,
  mail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  chat: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  share: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
};

// 计算简历填写进度
function computeProgress(resume: Resume | null): number {
  if (!resume) return 0;
  const p = resume.profile || {};
  let score = 0;
  if (p.name?.trim()) score += 15;
  if (p.titles?.default?.trim()) score += 10;
  if ((resume.education || []).length > 0) score += 15;
  if ((resume.work || []).length > 0) score += 25;
  if ((resume.projects || []).length > 0) score += 15;
  if ((resume.skills || []).length > 0) score += 10;
  if (p.summary?.trim()) score += 10;
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

function EditorContent() {
  const [section, setSection] = useState('basic');
  const { setCurrentResume, currentResume, targetContext, setTargetContext, clearTargetContext } = useResumeStore();
  const jdAnalysis = useResumeStore(s => s.jdAnalysis);
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
  const [showJdAnalyzer, setShowJdAnalyzer] = useState(false);
  const searchParams = useSearchParams();

  // 初始化：如果URL有参数，解析目标上下文
  useEffect(() => {
    const type = searchParams.get('target');
    if (type === 'jd') {
      const jdText = searchParams.get('jd_text') || '';
      const jdJobName = searchParams.get('jd_job_name') || '';
      setTargetContext({ type: 'jd', jdText, jdJobName });
    } else if (type === 'job') {
      const jobCode = searchParams.get('job_code') || '';
      const jobName = searchParams.get('job_name') || '';
      setTargetContext({ type: 'job', jobCode, jobName });
    }
  }, []);

  const onNavDown = (e: React.MouseEvent) => {
    setNavDragging(true);
    navStart.current = { x: e.clientX, w: navWidth };
  };
  useEffect(() => {
    if (!navDragging) return;
    const move = (ev: MouseEvent) => {
      setNavWidth(Math.max(140, Math.min(200, navStart.current.w + ev.clientX - navStart.current.x)));
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

  // 如果没有简历数据，自动创建空简历
  useEffect(() => {
    if (!currentResume) {
      const { userId } = useResumeStore.getState();
      const resume = makeEmpty();
      resume.userId = userId;
      setCurrentResume(resume);
    }
  }, [currentResume, setCurrentResume]);

  const renderForm = () => {
    switch (section) {
      case 'basic': return <FormSectionBasic />;
      case 'education': return <FormSectionEducation />;
      case 'experience': return <ExperienceBuilder />;
      case 'skills': return <FormSectionSkills />;
      case 'cover': return <CoverLetterEditor />;
      case 'interview': return <InterviewPredictor />;
      case 'share': return (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>🔗 分享简历</h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>将简历分享给招聘方或朋友</p>
          </div>
          <ShareResume />
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>🎁 邀请好友</h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>邀请朋友使用，双方获得奖励</p>
          </div>
          <ReferFriend />
        </div>
      );
      default: return <FormSectionBasic />;
    }
  };

  // 目标上下文Banner
  const renderTargetBanner = () => {
    if (!targetContext.type) return null;

    if (targetContext.type === 'jd') {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
            🎯 当前目标：<strong>{targetContext.jdJobName || 'JD分析'}</strong>
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', flex: 1 }}>
            基于你粘贴的JD，正在针对性优化简历
          </span>
          <button
            onClick={() => setShowJdAnalyzer(true)}
            style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, cursor: 'pointer' }}
          >
            重新分析JD
          </button>
          <button
            onClick={clearTargetContext}
            style={{ fontSize: 11, padding: '4px 10px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}
          >
            ✕ 清除
          </button>
        </div>
      );
    }

    if (targetContext.type === 'job') {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
            🎯 当前目标：<strong>{targetContext.jobName || '未知岗位'}</strong>
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', flex: 1 }}>
            基于专业推荐，正在针对性优化简历
          </span>
          <a
            href="/major"
            style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, textDecoration: 'none' }}
          >
            重新选岗位
          </a>
          <button
            onClick={clearTargetContext}
            style={{ fontSize: 11, padding: '4px 10px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none', cursor: 'pointer' }}
          >
            ✕ 清除
          </button>
        </div>
      );
    }

    return null;
  };

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
          <TemplateSelector />
          <HistoryButtons />
          <AIGenerateButton />
          <button onClick={() => setShowMultiVersion(true)}
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
            ✨ 多版本
          </button>
          <button onClick={() => setShowApplicationTracker(true)}
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
            📋 投递追踪
          </button>
          <a href="/"
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            首页
          </a>
          <a href="/health"
            style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            📋 体检报告
          </a>
          <ExportButton />
        </div>
      </header>

      {/* 目标上下文Banner */}
      {renderTargetBanner()}

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

      {/* JD分析器弹窗 */}
      {showJdAnalyzer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>🎯 重新分析 JD</h2>
              <button onClick={() => setShowJdAnalyzer(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <JDMatcher onStart={() => { setShowJdAnalyzer(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280' }}>加载中...</div>}>
      <EditorContent />
    </Suspense>
  );
}

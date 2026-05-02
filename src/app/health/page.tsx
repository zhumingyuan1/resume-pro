'use client';

import { useResumeStore } from '@/lib/resume-store';

interface ScoreItem {
  label: string;
  score: number;
  max: number;
  missing: string[];
}

function calcScore(items: { label: string; check: (r: any) => boolean; weight: number; missingHint: string }[], resume: any): ScoreItem[] {
  return items.map(item => {
    const passed = item.check(resume);
    return { label: item.label, score: passed ? item.weight : 0, max: item.weight, missing: passed ? [] : [item.missingHint] };
  });
}

function getHealthReport(resume: any) {
  const items = [
    { label: '基本信息', weight: 20, check: (r: any) => !!(r.profile?.name && r.profile?.email && r.profile?.titles?.default), missingHint: '姓名、邮箱、求职目标未填全' },
    { label: '工作经历', weight: 25, check: (r: any) => !!(r.work && r.work.length > 0 && r.work.some((w: any) => w.highlights && w.highlights.length > 0)), missingHint: '工作经历缺少描述或STAR表达' },
    { label: '教育背景', weight: 15, check: (r: any) => !!(r.education && r.education.length > 0), missingHint: '未填写教育经历' },
    { label: '项目经历', weight: 20, check: (r: any) => !!(r.projects && r.projects.length > 0), missingHint: '缺少项目经历（课程设计/比赛/开源等）' },
    { label: '技能特长', weight: 10, check: (r: any) => !!(r.skills && r.skills.length > 0), missingHint: '未填写技能标签' },
    { label: '个人简介', weight: 10, check: (r: any) => !!(r.profile?.summary || r.summary), missingHint: '缺少个人简介/自我介绍' },
  ];
  const scored = calcScore(items, resume);
  const total = scored.reduce((sum, s) => sum + s.score, 0);
  return { total, items: scored };
}

function getDimensionAdvice(item: ScoreItem): string {
  if (item.score === item.max) return '✅ 已完成，继续保持';
  switch (item.label) {
    case '基本信息': return '填写完整的姓名、邮箱和求职目标，让HR一眼看出你是谁、你要做什么';
    case '工作经历': return '用STAR法则写工作描述（情境-任务-行动-结果），每条至少包含1个量化数字';
    case '教育背景': return '填写学校、专业、学历；GPA高的话一定要写，这是硬通货';
    case '项目经历': return '课程设计、比赛、开源项目都能写，重点说清楚你做了什么、用什么技术、结果如何';
    case '技能特长': return '分门别类写技术栈（如前端/后端/工具），用熟悉程度区分，不写"精通"等模糊词';
    case '个人简介': return '3-4句话：身份定位 + 核心技术能力 + 代表性成就 + 求职目标';
    default: return '完善这一部分可提升简历竞争力';
  }
}

export default function HealthPage() {
  const { currentResume } = useResumeStore();
  const resume = currentResume;

  if (!resume) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>还没有简历数据</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>请先在编辑器中填写简历，再查看体检报告</p>
          <a href="/" style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>去制作简历 →</a>
        </div>
      </div>
    );
  }

  const { total, items } = getHealthReport(resume);
  const missingAll = items.flatMap(i => i.missing);
  const passedItems = items.filter(i => i.score === i.max);
  const failedItems = items.filter(i => i.score < i.max);

  const statusConfig = total >= 80
    ? { label: '优秀', color: '#22c55e', bg: '#ecfdf5', border: '#bbf7d0', desc: '简历内容较为完整，可以开始投递了' }
    : total >= 60
    ? { label: '良好', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', desc: '简历框架完整，部分细节需要补充' }
    : { label: '需完善', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', desc: '简历骨架有了，但关键内容还不够充实' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ maxWidth: 680, margin: '0 auto', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1f2937', margin: 0 }}>📋 简历体检报告</h1>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
              {resume.profile?.name || '未填姓名'} · {resume.profile?.titles?.default || '未填求职目标'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#374151' }}
            >
              🖨️ 打印报告
            </button>
            <a href="/" style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: '#2563eb', textDecoration: 'none', color: '#fff' }}>
              ← 返回编辑
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 总体评分卡片 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0,06)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* 分数圆环 */}
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={statusConfig.color}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(total / 100) * 327} 327`}
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>/100 分</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}`, marginBottom: 10 }}>
                {statusConfig.label}
              </div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{statusConfig.desc}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                生成时间：{new Date().toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
        </div>

        {/* 维度评分 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 20 }}>各维度评分</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map(item => {
              const pct = Math.round((item.score / item.max) * 100);
              const color = pct === 100 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{item.label}</span>
                      {pct === 100 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#ecfdf5', color: '#22c55e', fontWeight: 600 }}>✓ 完成</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{item.score}/{item.max}</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, lineHeight: 1.6 }}>{getDimensionAdvice(item)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 缺失清单 */}
        {missingAll.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>💡 待完善项</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {missingAll.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>!</span>
                  <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{m}</span>
                </div>
              ))}
            </div>
            <a href="/" style={{ display: 'block', marginTop: 16, textAlign: 'center', padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
              去完善简历 →
            </a>
          </div>
        )}

        {/* 优秀项 */}
        {passedItems.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>✅ 已完成项</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {passedItems.map(item => (
                <span key={item.label} style={{ padding: '6px 14px', borderRadius: 20, background: '#ecfdf5', color: '#22c55e', fontSize: 13, fontWeight: 600, border: '1px solid #bbf7d0' }}>
                  ✓ {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 底部 */}
        <div style={{ textAlign: 'center', padding: '16px 0 32px' }}>
          <p style={{ fontSize: 12, color: '#d1d5db' }}>简历Pro · AI驱动的新一代简历工具</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          a { display: none !important; }
          button { display: none !important; }
          div[style*="border-radius: 20px"] { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>
    </div>
  );
}

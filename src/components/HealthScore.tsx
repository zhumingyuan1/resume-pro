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
    return {
      label: item.label,
      score: passed ? item.weight : 0,
      max: item.weight,
      missing: passed ? [] : [item.missingHint],
    };
  });
}

function getHealthScore(resume: any): { total: number; items: ScoreItem[] } {
  const items = [
    {
      label: '基本信息',
      weight: 20,
      check: (r: any) => !!(r.profile?.name && r.profile?.email && r.profile?.titles?.default),
      missingHint: '姓名、邮箱、求职目标',
    },
    {
      label: '工作经历',
      weight: 25,
      check: (r: any) => !!(r.work && r.work.length > 0 && r.work.some((w: any) => w.highlights && w.highlights.length > 0)),
      missingHint: '至少1段工作经历 + 工作描述',
    },
    {
      label: '教育背景',
      weight: 15,
      check: (r: any) => !!(r.education && r.education.length > 0),
      missingHint: '至少1段教育经历',
    },
    {
      label: '项目经历',
      weight: 20,
      check: (r: any) => !!(r.projects && r.projects.length > 0),
      missingHint: '至少1个项目经历',
    },
    {
      label: '技能特长',
      weight: 10,
      check: (r: any) => !!(r.skills && r.skills.length > 0),
      missingHint: '至少填写1项技能',
    },
    {
      label: '简历摘要',
      weight: 10,
      check: (r: any) => !!(r.profile?.summary || r.summary),
      missingHint: '添加一段自我介绍/简历摘要',
    },
  ];

  const scored = calcScore(items, resume);
  const total = scored.reduce((sum, s) => sum + s.score, 0);

  return { total, items: scored };
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>健康度</div>
      </div>
    </div>
  );
}

export default function HealthScore() {
  const { currentResume } = useResumeStore();

  if (!currentResume) return null;

  const { total, items } = getHealthScore(currentResume);
  const missingAll = items.flatMap(i => i.missing);

  const statusText = total >= 80 ? '优秀' : total >= 60 ? '良好' : total >= 40 ? '一般' : '需完善';
  const statusColor = total >= 80 ? '#22c55e' : total >= 60 ? '#f59e0b' : total >= 40 ? '#f97316' : '#ef4444';

  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid #e5e7eb',
      padding: 16,
    }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>简历健康度</div>
        <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${statusColor}15`, color: statusColor, fontWeight: 600 }}>
          {statusText}
        </div>
      </div>

      {/* 分数圆环 + 缺失列表 */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <ScoreRing score={total} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 各维度得分条 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10, color: '#6b7280', width: 48, flexShrink: 0 }}>{item.label}</div>
                <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(item.score / item.max) * 100}%`,
                    height: '100%',
                    background: item.score > 0 ? '#22c55e' : '#ef4444',
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 缺失提示 */}
      {missingAll.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 12px', background: '#fef3c7', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#b45309', marginBottom: 6 }}>💡 建议完善</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {missingAll.map((m, i) => (
              <div key={i} style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>• {m}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

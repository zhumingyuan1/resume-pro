'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';

export interface PredictedQuestion {
  id: string;
  type: '技术' | '业务' | '经历' | '场景' | '管理' | '动机';
  question: string;
  difficulty: 1 | 2 | 3;
  answer: string;
}

type InterviewType = 'HR面' | '技术面' | 'Manager面' | 'CEO面';

const INTERVIEW_TYPES: { id: InterviewType; icon: string; desc: string; color: string; bg: string }[] = [
  { id: 'HR面', icon: '👤', desc: 'HR综合素质、企业文化、薪资预期', color: '#6366f1', bg: '#eef2ff' },
  { id: '技术面', icon: '💻', desc: '专业知识、编程能力、系统设计', color: '#2563eb', bg: '#eff6ff' },
  { id: 'Manager面', icon: '📊', desc: '团队协作、项目管理、成长潜力', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'CEO面', icon: '🎯', desc: '战略思维、行业洞察、文化匹配', color: '#059669', bg: '#ecfdf5' },
];

const QUESTION_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  '技术': { color: '#2563eb', bg: '#eff6ff' },
  '业务': { color: '#7c3aed', bg: '#f5f3ff' },
  '经历': { color: '#059669', bg: '#ecfdf5' },
  '场景': { color: '#f59e0b', bg: '#fffbeb' },
  '管理': { color: '#ec4899', bg: '#fdf2f8' },
  '动机': { color: '#6b7280', bg: '#f9fafb' },
};

function DifficultyStars({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3].map(s => (
        <span key={s} style={{ fontSize: 10, color: s <= level ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </span>
  );
}

export default function InterviewPredictor() {
  const { applications, currentResume } = useResumeStore();

  const [step, setStep] = useState<'target' | 'type' | 'result'>('target');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [customPosition, setCustomPosition] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType>('技术面');
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<PredictedQuestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedApp = applications.find(a => a.id === selectedAppId);

  const getCompanyType = (company: string): string => {
    const c = company.toLowerCase();
    if (/腾讯|阿里|字节|百度|京东|美团|拼多多|滴滴|网易|快手|抖音|头条/i.test(c)) return '互联网大厂';
    if (/外资|博世|西门子|戴尔|IBM|谷歌|微软|亚马逊|苹果|特斯拉|安联|汇丰|摩根/i.test(c)) return '外企';
    if (/银行|证券|基金|保险|信托|资管|中金|中信|华泰/i.test(c)) return '金融';
    if (/国企|央企|中石油|中石化|国家电网|中国移动|中国烟草/i.test(c)) return '国企';
    return '互联网中厂';
  };

  const buildResumeSummary = (): string => {
    const r = currentResume;
    if (!r) return '';
    const parts: string[] = [];
    if (r.profile?.name) parts.push(`姓名：${r.profile.name}`);
    if (r.profile?.titles?.default) parts.push(`求职目标：${r.profile.titles.default}`);
    if (r.profile?.summary) parts.push(`简介：${r.profile.summary}`);
    if (r.work?.length) {
      parts.push('工作经历：');
      r.work.forEach(w => {
        const info = [w.company, w.position].filter(Boolean).join(' / ');
        if (info) parts.push(`• ${info}`);
        if (w.highlights?.length) parts.push(`  ${w.highlights.join('；')}`);
      });
    }
    if (r.projects?.length) {
      parts.push('项目经历：');
      r.projects.forEach(p => {
        const info = [p.name, p.role].filter(Boolean).join(' / ');
        if (info) parts.push(`• ${info}`);
        if (p.highlights?.length) parts.push(`  ${p.highlights.join('；')}`);
      });
    }
    if (r.skills?.length) {
      parts.push(`技能：${r.skills.flatMap(s => s.skills?.map(sk => sk.name) || []).join('、')}`);
    }
    return parts.join('\n');
  };

  const handleGenerate = async () => {
    const target = selectedAppId ? selectedApp : null;
    const position = target?.position || customPosition.trim();
    const company = target?.company || customCompany.trim();

    if (!position) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/interview-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position,
          company,
          companyType: company ? getCompanyType(company) : '互联网中厂',
          interviewType,
          resumeSummary: buildResumeSummary(),
        }),
      });
      const json = await res.json();
      if (json.questions && json.questions.length > 0) {
        setQuestions(json.questions);
        setStep('result');
      } else {
        alert('生成失败，请重试');
      }
    } catch {
      alert('网络错误，请重试');
    }
    setGenerating(false);
  };

  const copyAnswer = (q: PredictedQuestion) => {
    navigator.clipboard.writeText(q.answer).then(() => {
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: 680 }}>
      {/* 步骤指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {['选择目标', '选择面试', '预测题目'].map((label, i) => {
          const steps = ['target', 'type', 'result'];
          const active = steps.indexOf(step) >= i;
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: active ? '#2563eb' : '#e5e7eb',
                color: active ? '#fff' : '#9ca3af',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#1f2937' : '#9ca3af' }}>
                {label}
              </span>
              {i < 2 && (
                <div style={{ flex: 1, height: 2, background: active ? '#2563eb' : '#e5e7eb', minWidth: 20, margin: '0 4px', borderRadius: 1 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: 选择目标公司/岗位 */}
      {step === 'target' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            选择目标公司 &amp; 岗位
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
            从投递记录中快速选择，或手动输入目标岗位
          </p>

          {applications.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
                📋 从投递记录中选择
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {applications.map(app => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setCustomPosition('');
                      setCustomCompany('');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                      border: `2px solid ${selectedAppId === app.id ? '#2563eb' : '#e5e7eb'}`,
                      background: selectedAppId === app.id ? '#eff6ff' : '#fff',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedAppId === app.id ? '#2563eb' : '#d1d5db', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{app.company}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{app.position}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 12, color: '#9ca3af' }}>或手动输入</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>公司名称</label>
              <input
                value={selectedAppId ? (selectedApp?.company || '') : customCompany}
                onChange={e => { setSelectedAppId(''); setCustomCompany(e.target.value); }}
                placeholder="例如：字节跳动"
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>目标岗位 *</label>
              <input
                value={selectedAppId ? (selectedApp?.position || '') : customPosition}
                onChange={e => { setSelectedAppId(''); setCustomPosition(e.target.value); }}
                placeholder="例如：前端开发工程师"
                style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fafafa' }}
              />
            </div>
          </div>

          <button
            onClick={() => setStep('type')}
            disabled={!currentResume}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: !currentResume ? '#d1d5db' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff', border: 'none',
              cursor: !currentResume ? 'not-allowed' : 'pointer',
              boxShadow: !currentResume ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {!currentResume ? '请先创建简历' : '下一步 →'}
          </button>

          {!currentResume && (
            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              先完善简历，AI 才能生成更精准的面试题
            </p>
          )}
        </div>
      )}

      {/* Step 2: 选择面试类型 */}
      {step === 'type' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                选择面试类型
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                不同面试类型，题目侧重不同
              </p>
            </div>
            <button
              onClick={() => setStep('target')}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              ← 重新选择
            </button>
          </div>

          {/* 目标回顾 */}
          {(selectedApp || customPosition) && (
            <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '10px 16px', marginBottom: 20, border: '1px solid #bae6fd' }}>
              <span style={{ fontSize: 12, color: '#0369a1' }}>
                🎯 预测目标：{selectedApp?.company || customCompany || '—'} / {selectedApp?.position || customPosition}
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {INTERVIEW_TYPES.map(it => (
              <button
                key={it.id}
                onClick={() => setInterviewType(it.id)}
                style={{
                  padding: '18px 16px', borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${interviewType === it.id ? it.color : '#e5e7eb'}`,
                  background: interviewType === it.id ? it.bg : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{it.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: interviewType === it.id ? it.color : '#1f2937', marginBottom: 4 }}>
                  {it.id}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>{it.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: generating ? '#d1d5db' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff', border: 'none',
              cursor: generating ? 'not-allowed' : 'pointer',
              boxShadow: generating ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {generating ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                AI 生成预测题目中...
              </span>
            ) : '🔮 开始预测面试题'}
          </button>
        </div>
      )}

      {/* Step 3: 预测题目结果 */}
      {step === 'result' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                预测面试题
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                基于你的简历和岗位匹配度 AI 生成，点击卡片展开参考回答
              </p>
            </div>
            <button
              onClick={() => { setStep('type'); setQuestions([]); }}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← 重新生成
            </button>
          </div>

          {/* 统计信息 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: '预测题目', value: `${questions.length} 道` },
              { label: '面试类型', value: interviewType },
              { label: '目标', value: selectedApp?.position || customPosition },
            ].map((stat, i) => (
              <div key={i} style={{ flex: 1, background: '#f9fafb', borderRadius: 10, padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {questions.map((q, index) => {
              const typeConfig = QUESTION_TYPE_COLORS[q.type] || QUESTION_TYPE_COLORS['经历'];
              const isExpanded = expandedId === q.id;
              const isCopied = copiedId === q.id;

              return (
                <div
                  key={q.id}
                  style={{
                    border: `1.5px solid ${isExpanded ? '#2563eb' : '#e5e7eb'}`,
                    borderRadius: 14, overflow: 'hidden',
                    background: isExpanded ? '#f8faff' : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* 题目头部 */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    style={{
                      padding: '16px 20px', cursor: 'pointer',
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 8,
                      background: typeConfig.bg, color: typeConfig.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 10px',
                          borderRadius: 20, background: typeConfig.bg, color: typeConfig.color,
                        }}>
                          {q.type}
                        </span>
                        <DifficultyStars level={q.difficulty} />
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>难度</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', lineHeight: 1.5, margin: 0 }}>
                        {q.question}
                      </p>
                    </div>
                    <div style={{ color: isExpanded ? '#2563eb' : '#9ca3af', fontSize: 16, flexShrink: 0, marginTop: 2 }}>
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* 参考回答 */}
                  {isExpanded && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ paddingTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>💡 参考回答（STAR格式）</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); copyAnswer(q); }}
                            style={{
                              padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                              border: '1px solid', cursor: 'pointer',
                              borderColor: isCopied ? '#10b981' : '#e5e7eb',
                              background: isCopied ? '#ecfdf5' : '#fff',
                              color: isCopied ? '#10b981' : '#6b7280',
                              transition: 'all 0.15s',
                            }}
                          >
                            {isCopied ? '✓ 已复制' : '📋 复制'}
                          </button>
                        </div>
                        <div style={{
                          background: '#fafafa', borderRadius: 10, padding: '14px 16px',
                          fontSize: 13, color: '#374151', lineHeight: 1.8,
                          border: '1px solid #e5e7eb',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {q.answer}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 底部提示 */}
          <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '14px 20px', border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: 12, color: '#0369a1', fontWeight: 500, marginBottom: 6 }}>
              💡 使用建议
            </p>
            <p style={{ fontSize: 12, color: '#075985', lineHeight: 1.7, margin: 0 }}>
              先自己想一遍，再看参考答案效果更好。STAR格式的回答框架能让面试官更清晰地了解你的能力。
              遇到类似问题，多练习用自己的经历填充 STAR 结构。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

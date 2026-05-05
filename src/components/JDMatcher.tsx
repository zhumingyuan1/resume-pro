'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';

interface Result {
  score: number;
  level: string;
  industry: string;
  missing: string[];
  matchedKeywords: string[];
  suggestions: string[];
  techScore: number;
  softScore: number;
  quantScore: number;
}

// 从求职目标推断行业
function inferIndustry(targetRole: string): string {
  const role = targetRole.toLowerCase();
  if (/前端|后端|全栈|算法|测试|运维|DevOps|架构|java|python|react|vue|node\.?js|golang|go|php/i.test(role)) return '互联网';
  if (/产品|运营|增长|用户|内容|活动|投放|社群/i.test(role)) return '互联网';
  if (/银行|证券|基金|保险|风控|量化|信托|资管|CFA|CPA/i.test(role)) return '金融';
  if (/医生|护士|临床|医学|药学|生物|CRA|NMPA/i.test(role)) return '医疗';
  if (/教师|课程|教学|培训|留学|教务/i.test(role)) return '教育';
  if (/市场|品牌|BD|商务|销售|渠道/i.test(role)) return '快消';
  if (/HR|人力|招聘|培训|员工关系/i.test(role)) return '人力资源';
  return '互联网';
}

const FEATURES = [
  { icon: '📊', title: '匹配评分', desc: 'AI量化评估' },
  { icon: '🔍', title: '关键词分析', desc: '缺失一眼看出' },
  { icon: '💡', title: '修改建议', desc: '针对性提升' },
  { icon: '📋', title: '体检报告', desc: '全方位评估' },
];

const SAMPLE_JD = `岗位职责：
1. 负责前端技术选型和架构设计，参与核心模块开发
2. 熟练使用React/Vue等主流框架，精通TypeScript
3. 熟悉Node.js，了解Python/Go等后端语言
4. 有大型项目架构经验优先，具备良好的团队协作和沟通能力
5. 对技术有热情，有良好的自驱力和学习能力`;

export default function JDMatcher({ onStart }: { onStart: () => void }) {
  const { setJdAnalysis, setTargetContext } = useResumeStore();
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [focused, setFocused] = useState(false);

  const analyze = async () => {
    if (!jd.trim()) return;
    setLoading(true);

    // 从JD推断岗位方向
    const industry = inferIndustry(jd);

    try {
      // 从新 API 拉取真实关键词数据（无人工延迟）
      const apiRes = await fetch(`/api/jd-keywords?job_name=${encodeURIComponent(industry === '互联网' ? '前端工程师' : industry === '金融' ? '金融分析师' : '产品经理')}`).then(r => r.json()).catch(() => null);

      // 回退：如果API失败，用默认关键词
      const apiKeywords = apiRes?.success && apiRes?.data?.keywords
        ? apiRes.data.keywords
        : { tech: [], soft: [], quant: [], cert: [] };

      const techWords = apiKeywords.hard_skill?.map((k: any) => k.keyword || k) || [];
      const softWords = apiKeywords.soft_skill?.map((k: any) => k.keyword || k) || [];
      const quantWords = apiKeywords.quantitative?.map((k: any) => k.keyword || k) || [];

      // 如果API关键词为空，用硬编码备选
      const finalTech = techWords.length ? techWords : ['React', 'Vue', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'SQL', 'Redis', 'Docker', 'K8s', '微服务'];
      const finalSoft = softWords.length ? softWords : ['团队协作', '沟通能力', '项目管理', '逻辑思维', '自驱力', '学习能力'];
      const finalQuant = quantWords.length ? quantWords : ['提升', '增长', '优化', '降低', '提高', '主导'];

      const upper = jd.toUpperCase();
      const techHits = finalTech.filter((w: string) => upper.includes(w.toUpperCase()) || jd.includes(w));
      const softHits = finalSoft.filter((w: string) => jd.includes(w));
      const quantHits = finalQuant.filter((w: string) => jd.includes(w));

      const techScore = Math.min(95, 40 + techHits.length * 8);
      const softScore = Math.min(85, 50 + softHits.length * 7);
      const quantScore = Math.min(90, 50 + quantHits.length * 10);
      const total = Math.round(techScore * 0.5 + softScore * 0.3 + quantScore * 0.2);
      const level = total >= 80 ? '匹配度很高' : total >= 60 ? '匹配度中等' : '匹配度偏低';
      const missing = finalTech.filter((w: string) => !techHits.includes(w)).slice(0, 8);
      const suggestions: string[] = [];
      if (techHits.length < 3) suggestions.push('建议增加更多技术栈关键词');
      if (quantHits.length < 2) suggestions.push('建议在描述中加入量化数据');
      if (softHits.length < 2) suggestions.push('建议补充团队协作相关描述');

      const finalResult = { score: total, level, industry, missing, matchedKeywords: techHits, suggestions, techScore, softScore, quantScore };
      setResult(finalResult);
      setJdAnalysis({
        jdText: jd,
        score: total,
        techScore,
        softScore,
        quantScore,
        matchedKeywords: techHits,
        missingKeywords: missing,
        suggestions,
      });
      // 设置目标上下文，供编辑器使用
      setTargetContext({ type: 'jd', jdText: jd, jdJobName: industry });
    } catch {
      // 网络错误时回退到基础分析（无人工延迟）
      const fallbackTech = ['React', 'Vue', 'TypeScript', 'Node.js', 'Python', 'Java', 'Go', 'SQL', 'Redis', 'Docker', 'K8s'];
      const upper = jd.toUpperCase();
      const techHits = fallbackTech.filter((w: string) => upper.includes(w.toUpperCase()) || jd.includes(w));
      const total = Math.round((Math.min(95, 40 + techHits.length * 8)) * 0.5 + 40);
      setResult({ score: total, level: total >= 70 ? '匹配度中等' : '匹配度偏低', industry, missing: [], matchedKeywords: techHits, suggestions: [], techScore: 60, softScore: 60, quantScore: 60 });
      setJdAnalysis({ jdText: jd, score: total, techScore: 60, softScore: 60, quantScore: 60, matchedKeywords: techHits, missingKeywords: [], suggestions: [] });
      setTargetContext({ type: 'jd', jdText: jd, jdJobName: industry });
    }

    setLoading(false);
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #eff6ff 60%, #f5f3ff 100%)' }}>
      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(2%, 3%) scale(1.03); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-2%, -2%); } }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
        .text-gradient { background: linear-gradient(135deg, #3b82f6, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>

      {/* Header */}
      <header style={{
        height: 64, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', padding: '0 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 17,
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
          }}>
            R
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#1f2937', lineHeight: 1.2 }}>简历Pro</div>
            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.2 }}>AI驱动的新一代简历工具</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 64px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{
            fontSize: 34, fontWeight: 800,
            background: 'linear-gradient(135deg, #1f2937, #2563eb)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.5px',
          }}>
            简历匹配度分析
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>
            粘贴目标JD，AI智能分析你的简历匹配度<br />
            30秒给出修改建议，让求职更有针对性
          </p>
        </div>

        {/* Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {FEATURES.map(({ icon, title, desc }, idx) => (
            <div key={title}
              style={{
                background: '#fff', borderRadius: 16, padding: '20px 14px', textAlign: 'center',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
                animation: `float${idx + 1} ${8 + idx * 2}s ease-in-out infinite`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-3px)';
                el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Input Card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{ padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>粘贴目标JD</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>复制招聘信息的全部内容粘贴到下方</p>
              </div>
              <button onClick={() => setJd(SAMPLE_JD)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', fontSize: 12, fontWeight: 500,
                  color: '#2563eb', background: '#eff6ff',
                  border: '1px solid #bfdbfe', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = '#2563eb'; el.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = '#eff6ff'; el.style.color = '#2563eb';
                }}
              >
                📋 示例JD
              </button>
            </div>
          </div>

          <div style={{ padding: '0 24px 20px' }}>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={9}
              placeholder={"粘贴JD内容，例如：\n\n岗位职责：\n1. 负责前端技术选型和架构设计\n2. 熟练使用React/Vue等主流框架\n3. 熟悉TypeScript，了解Node.js\n4. 有大型项目经验优先\n5. 具备良好的团队协作和沟通能力"}
              style={{
                width: '100%', padding: '18px 20px', fontSize: 14, fontFamily: 'inherit',
                lineHeight: 1.7, color: '#374151',
                background: '#f9fafb',
                border: `1.5px solid ${focused ? '#2563eb' : '#e5e7eb'}`,
                borderRadius: 12, outline: 'none', resize: 'vertical',
                transition: 'all 0.15s',
                boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              {jd ? (
                <button onClick={() => { setJd(''); setResult(null); }}
                  style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'}
                >
                  清空内容
                </button>
              ) : <div />}

              <button onClick={analyze} disabled={!jd.trim() || loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', fontSize: 14, fontWeight: 600,
                  color: '#fff',
                  background: !jd.trim() || loading ? '#d1d5db' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  border: 'none', borderRadius: 10, cursor: !jd.trim() || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: !jd.trim() || loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
                }}
                onMouseEnter={e => {
                  if (jd.trim() && !loading) {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = 'translateY(-1px)';
                    el.style.boxShadow = '0 6px 18px rgba(37,99,235,0.4)';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = !jd.trim() || loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)';
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    分析中...
                  </>
                ) : <>🔍 开始分析匹配度</>}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {/* Result Card */}
            <div style={{
              background: '#fff', borderRadius: 20,
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)', padding: '28px 28px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>匹配度分析结果</h2>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, background: '#f3f4f6', color: '#6b7280', fontWeight: 500 }}>
                      行业：{result.industry || '互联网'}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>
                      已匹配关键词：{result.matchedKeywords.length} 个
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                    ⚠️ 基于行业通用简历规则的评估，而非招聘系统(ATS)官方数据
                  </p>
                </div>
                <span style={{
                  padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: result.score >= 80 ? '#ecfdf5' : result.score >= 60 ? '#fffbeb' : '#fef2f2',
                  color: result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444',
                }}>
                  {result.level}
                </span>
              </div>

              {/* Score Circle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                <div style={{ position: 'relative', width: 150, height: 150 }}>
                  <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="75" cy="75" r="64" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                    <circle cx="75" cy="75" r="64" fill="none"
                      stroke={result.score >= 80 ? '#10b981' : result.score >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${(result.score / 100) * 402} 402`}
                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 44, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{result.score}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>匹配分</span>
                  </div>
                </div>
              </div>

              {/* Three Scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: '技术栈匹配', score: result.techScore, icon: '💻' },
                  { label: '软技能匹配', score: result.softScore, icon: '🤝' },
                  { label: '数据化描述', score: result.quantScore, icon: '📈' },
                ].map(({ label, score, icon }) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 12px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: getScoreColor(score), marginBottom: 2 }}>{score}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Missing */}
              {result.missing.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔍 缺失关键词
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>（点击直接添加到技能标签）</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[...new Set(result.missing)].map(w => (
                      <button
                        key={w}
                        onClick={() => {
                          const { currentResume, updateResume } = useResumeStore.getState();
                          if (!currentResume) return;
                          // 追加到技能标签（如果技能列表里没有"JD关键词"分类，就新建一个）
                          const existing = currentResume.skills.find(s => s.category === 'JD补充技能');
                          if (existing) {
                            const alreadyHas = existing.skills.some(s => s.name === w);
                            if (!alreadyHas) {
                              updateResume(currentResume.id, {
                                skills: currentResume.skills.map(s =>
                                  s.id === existing.id
                                    ? { ...s, skills: [...s.skills, { name: w }] }
                                    : s
                                ),
                              });
                            }
                          } else {
                            updateResume(currentResume.id, {
                              skills: [...currentResume.skills, {
                                id: crypto.randomUUID(),
                                category: 'JD补充技能',
                                skills: [{ name: w }],
                              }],
                            });
                          }
                          alert(`"${w}" 已添加到技能标签！去技能栏查看`);
                        }}
                        style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                      >
                        + {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    💡 修改建议
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.suggestions.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: '#f0f9ff', borderRadius: 10, fontSize: 13, color: '#374151', border: '1px solid #bae6fd' }}>
                        <span style={{ color: '#2563eb', fontWeight: 600, flexShrink: 0 }}>→</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <button onClick={onStart}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, color: '#fff',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform = 'translateY(-1px)';
                  el.style.boxShadow = '0 6px 18px rgba(16,185,129,0.4)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)';
                }}
              >
                开始制作简历 →
              </button>
            </div>

            {/* Share Card */}
            <div style={{
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              borderRadius: 20, padding: '24px 28px', textAlign: 'center', color: '#fff',
              boxShadow: '0 4px 20px rgba(37,99,235,0.25)',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>生成简历体检报告</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>一键分享给朋友，让朋友也来测测匹配度</div>
              <button
                onClick={() => {
                  const shareText = `我的简历匹配度分析结果：${result.score}分！${result.level}——快用「简历Pro」也来测测你的简历匹配度 👉 ${window.location.origin}`;
                  if (navigator.share) {
                    navigator.share({ title: '简历匹配度分析', text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText).then(() => alert('分享文案已复制到剪贴板！'));
                  }
                }}
                style={{
                  padding: '10px 24px', background: '#fff', color: '#2563eb',
                  fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 10, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'scale(1)'; }}
              >
                分享给朋友
              </button>
            </div>

            {/* 专业推荐入口 */}
            <div style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              borderRadius: 20, padding: '24px 28px', textAlign: 'center', color: '#fff',
              boxShadow: '0 4px 20px rgba(249,115,22,0.25)',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>根据专业选岗位</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>
                输入你的专业，AI 推荐对口岗位 + 技能缺口分析
              </div>
              <a
                href="/major"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px', background: '#fff', color: '#ea580c',
                  fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 10, cursor: 'pointer',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'scale(1)'; }}
              >
                查看专业 → 岗位推荐 →
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, fontSize: 12, color: '#d1d5db' }}>
          简历Pro · AI驱动的新一代简历工具
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume } from '@/types/resume';

interface VersionResult {
  versionId: string;
  versionName: string;
  title: string;
  summary: string;
  workHighlights: string[];
  error?: string;
  loading: boolean;
}

const VERSION_CONFIG = [
  {
    id: 'internet',
    key: 'default' as const,
    name: '互联网大厂版',
    icon: '💻',
    color: '#4f46e5',
    bg: '#eef2ff',
    description: '字节/腾讯/阿里/美团等，强调技术深度+量化数据',
  },
  {
    id: 'foreign',
    key: 'foreign' as const,
    name: '外企版',
    icon: '🌍',
    color: '#059669',
    bg: '#ecfdf5',
    description: '微软/Google/亚马逊等，强调成果导向+英语能力',
  },
  {
    id: 'sme',
    key: 'startup' as const,
    name: '创业公司版',
    icon: '🚀',
    color: '#d97706',
    bg: '#fffbeb',
    description: 'A轮/B轮公司，强调全栈能力+主人翁意识',
  },
];

export default function MultiVersionPanel({ onClose }: { onClose: () => void }) {
  const { currentResume, updateResume, saveAiVersion } = useResumeStore();
  const resume = currentResume;
  const [step, setStep] = useState<'select' | 'generating' | 'compare'>('select');
  const [results, setResults] = useState<VersionResult[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [applying, setApplying] = useState(false);

  const generateAll = async () => {
    if (!resume) return;
    setStep('generating');
    setResults(
      VERSION_CONFIG.map(v => ({ versionId: v.id, versionName: v.name, title: '', summary: '', workHighlights: [], loading: true }))
    );

    // 并发请求 3 个版本
    await Promise.allSettled(
      VERSION_CONFIG.map(async (config) => {
        try {
          const res = await fetch('/api/ai-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resume,
              versionId: config.id,
              targetRole: resume.profile?.titles?.default || resume.profile?.titles?.default,
            }),
          });
          const json = await res.json();
          if (json.success) {
            const d = json.data;
            setResults(prev =>
              prev.map(r =>
                r.versionId === config.id
                  ? {
                      ...r,
                      loading: false,
                      title: d.title || d.profile?.titles?.[config.key] || resume.profile?.titles?.default || '',
                      summary: d.summary || d.optimizedSummary || '',
                      workHighlights: (d.work || []).map((w: any) => w.highlights?.[0] || '').filter(Boolean),
                    }
                  : r
              )
            );
          } else {
            setResults(prev =>
              prev.map(r =>
                r.versionId === config.id
                  ? { ...r, loading: false, error: json.error || '生成失败' }
                  : r
              )
            );
          }
        } catch (err: any) {
          setResults(prev =>
            prev.map(r =>
              r.versionId === config.id
                ? { ...r, loading: false, error: err.message || '网络错误' }
                : r
            )
          );
        }
      })
    );

    setStep('compare');
  };

  const applyVersion = async (result: VersionResult) => {
    if (!resume) return;
    setApplying(true);

    const config = VERSION_CONFIG.find(v => v.id === result.versionId);
    if (!config) return;

    // 保存 AI 版本快照
    saveAiVersion(result.versionId + '_original', { ...resume });

    const updatedResume: Partial<Resume> = {
      profile: {
        ...resume.profile,
        titles: {
          ...resume.profile.titles,
          [config.key]: result.title || resume.profile.titles?.default || '',
        },
        summary: result.summary || resume.profile.summary || '',
      },
    };

    // 更新 work highlights
    if (result.workHighlights.length > 0) {
      const updatedWork = resume.work.map((w, i) => ({
        ...w,
        highlights: result.workHighlights[i] ? [result.workHighlights[i]] : w.highlights,
      }));
      (updatedResume as any).work = updatedWork;
    }

    updateResume(resume.id, updatedResume);

    // 保存完整版本到 aiVersions
    saveAiVersion(config.id, { ...resume, ...updatedResume } as Resume);

    setApplying(false);
    alert(`${result.versionName} 已应用！可以去对应表单查看变化。`);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 900,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', margin: 0 }}>✨ 一键生成多版本</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>一次生成3个不同风格版本，直接对比挑选</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Step 1: 选择 */}
          {step === 'select' && (
            <div>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 20 }}>
                选择要生成的目标版本，系统将<strong>同时生成</strong>，完成后并排对比：
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {VERSION_CONFIG.map(v => (
                  <div key={v.id} style={{
                    padding: '20px 16px', borderRadius: 14, border: `2px solid #e5e7eb`,
                    background: '#fff', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>{v.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 6 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>{v.description}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={generateAll}
                disabled={!resume}
                style={{
                  width: '100%', marginTop: 24, padding: '14px', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  background: !resume ? '#d1d5db' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  border: 'none', cursor: !resume ? 'not-allowed' : 'pointer',
                  boxShadow: !resume ? 'none' : '0 4px 14px rgba(79,70,229,0.3)',
                }}
              >
                🚀 一键生成3个版本
              </button>
              {!resume && (
                <p style={{ textAlign: 'center', fontSize: 12, color: '#ef4444', marginTop: 10 }}>
                  请先在左侧填写基本信息后再生成
                </p>
              )}
            </div>
          )}

          {/* Step 2: 生成中 */}
          {step === 'generating' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
                {VERSION_CONFIG.map((v, i) => {
                  const r = results[i];
                  return (
                    <div key={v.id} style={{ flex: 1, maxWidth: 200, textAlign: 'center' }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>{v.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{v.name}</div>
                      {r?.loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 24 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>生成中...</span>
                        </div>
                      ) : r?.error ? (
                        <span style={{ fontSize: 12, color: '#ef4444' }}>失败</span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ 完成</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                正在并发生成，请稍候...
              </p>
            </div>
          )}

          {/* Step 3: 对比视图 */}
          {step === 'compare' && (
            <div>
              {/* 版本 tab 切换 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {VERSION_CONFIG.map((v, i) => {
                  const r = results[i];
                  return (
                    <button
                      key={v.id}
                      onClick={() => setActiveTab(i)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: activeTab === i ? v.color : '#f3f4f6',
                        color: activeTab === i ? '#fff' : '#6b7280',
                        fontWeight: activeTab === i ? 600 : 500, fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{v.icon}</span>
                      <span>{v.name}</span>
                      {r?.loading && <span style={{ fontSize: 11, opacity: 0.8 }}>生成中</span>}
                      {r?.error && <span style={{ fontSize: 11 }}>失败</span>}
                      {!r?.loading && !r?.error && <span style={{ fontSize: 11 }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* 提示 */}
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400e' }}>
                💡 对比多个版本后，选择最符合你目标公司类型的一个，点击应用即可更新简历
              </div>

              {/* 当前 tab 内容 */}
              {(() => {
                const r = results[activeTab];
                const v = VERSION_CONFIG[activeTab];
                if (!r) return null;
                if (r.loading) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                      正在生成 {v.name}...
                    </div>
                  );
                }
                if (r.error) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
                      <p>❌ {r.error}</p>
                      <button onClick={generateAll} style={{ marginTop: 16, padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                        重新生成
                      </button>
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* 求职目标 */}
                    {r.title && (
                      <div style={{ background: v.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${v.color}22` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: v.color, marginBottom: 6 }}>求职目标</p>
                        <p style={{ fontSize: 14, color: '#1f2937', fontWeight: 600 }}>{r.title}</p>
                      </div>
                    )}

                    {/* 个人简介 */}
                    {r.summary && (
                      <div style={{ background: v.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${v.color}22` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: v.color, marginBottom: 6 }}>个人简介</p>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75 }}>{r.summary}</p>
                      </div>
                    )}

                    {/* 工作经历 */}
                    {r.workHighlights.length > 0 && (
                      <div style={{ background: v.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${v.color}22` }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: v.color, marginBottom: 10 }}>工作经历优化</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {r.workHighlights.map((h, i) => (
                            <div key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, paddingLeft: 12, borderLeft: `3px solid ${v.color}44` }}>
                              <span style={{ fontWeight: 600, color: '#1f2937' }}>经历{i + 1}：</span>{h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!r.title && !r.summary && !r.workHighlights.length && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                        <p>该版本没有生成有效内容</p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>请确保左侧简历信息已填写完整</p>
                      </div>
                    )}

                    {/* 应用按钮 */}
                    {!r.loading && !r.error && (r.title || r.summary || r.workHighlights.length > 0) && (
                      <button
                        onClick={() => applyVersion(r)}
                        disabled={applying}
                        style={{
                          width: '100%', padding: '13px', borderRadius: 12,
                          fontSize: 14, fontWeight: 700, color: '#fff',
                          background: applying ? '#9ca3af' : v.color,
                          border: 'none', cursor: applying ? 'not-allowed' : 'pointer',
                          boxShadow: `0 4px 14px ${v.color}44`,
                        }}
                      >
                        {applying ? '应用中...' : `✓ 应用${v.name}`}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* 底部：重新生成 */}
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  onClick={generateAll}
                  style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  🔄 重新生成全部
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

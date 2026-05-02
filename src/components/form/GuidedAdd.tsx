'use client';

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/lib/resume-store';

type GuidedType = 'work' | 'project' | 'summary';

interface Props {
  type: GuidedType;
  onClose: () => void;
  /** 生成完成后回调，传入生成的内容供父组件写入 */
  onGenerated: (content: { highlights?: string[]; summary?: string }) => void;
}

interface JdCoverage {
  coverage: number;
  coveredKeywords: string[];
  remainingKeywords: string[];
}

const QUESTIONS: Record<GuidedType, string[]> = {
  work: [
    '你在这家公司/实习的具体岗位是什么？大概做了多久？',
    '你做过的最有成就感的一件事是什么？你具体是怎么做的？结果怎么样？',
    '工作中有没有用过什么技术栈或工具？哪怕是 Excel、微信排版也算。',
  ],
  project: [
    '这个项目是课程/比赛/自学还是实习里做的？背景是什么？',
    '你在项目里具体负责了什么？最有技术含量的部分是哪个？',
    '项目的结果怎么样？有没有可量化的成果（获奖/上线/性能提升/用户量等）？',
  ],
  summary: [
    '你的专业是什么？大概有什么样的技术背景？',
    '最有成就感的一件事是什么？哪怕不是技术相关的也行。',
    '你对未来的工作有什么期待？想去什么样的团队或方向？',
  ],
};

const TYPE_LABELS = { work: '工作经历', project: '项目经历', summary: '个人简介' };
const TYPE_PLACEHOLDERS = {
  work: '例如：在字节跳动实习3个月，负责用户调研，用Excel做了数据分析...',
  project: '例如：课程项目「校园二手平台」，我负责后端API设计，用Node.js实现...',
  summary: '例如：985计算机硕士，三段实习经验，熟悉React和Node.js...',
};

export default function GuidedAdd({ type, onClose, onGenerated }: Props) {
  const { jdAnalysis } = useResumeStore();
  const questions = QUESTIONS[type];
  const [step, setStep] = useState<'ask' | 'loading' | 'result' | 'error'>('ask');
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [generated, setGenerated] = useState('');
  const [jdCoverage, setJdCoverage] = useState<JdCoverage | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const hasContent = answers.some(a => a.trim().length > 0);
    if (!hasContent) return;
    setStep('loading');

    try {
      const res = await fetch('/api/guided-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          answers,
          jdAnalysis: jdAnalysis ? {
            matchedKeywords: jdAnalysis.matchedKeywords,
            missingKeywords: jdAnalysis.missingKeywords,
          } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '生成失败');

      setGenerated(data.generated);
      setJdCoverage(data.jdCoverage);
      setStep('result');
    } catch (err: any) {
      setError(err.message || '网络错误');
      setStep('error');
    }
  };

  const handleConfirm = () => {
    if (type === 'summary') {
      onGenerated({ summary: generated });
    } else {
      onGenerated({ highlights: [generated] });
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
              🤖 AI引导填写 · {TYPE_LABELS[type]}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              回答3个问题，AI帮你写出专业简历内容
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#f5f5f5', border: 'none', cursor: 'pointer',
            fontSize: 16, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {step === 'ask' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {questions.map((q, qi) => (
                <div key={qi}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: '#2563eb', flexShrink: 0 }}>Q{qi + 1}.</span>
                    <span>{q}</span>
                  </div>
                  <textarea
                    value={answers[qi]}
                    onChange={e => setAnswers(a => a.map((v, i) => i === qi ? e.target.value : v))}
                    rows={3}
                    placeholder={TYPE_PLACEHOLDERS[type]}
                    style={{
                      width: '100%', padding: '12px 14px', fontSize: 13,
                      border: '1.5px solid #e5e7eb', borderRadius: 12,
                      outline: 'none', resize: 'vertical', lineHeight: 1.6,
                      color: '#374151', background: '#fff',
                      transition: 'border-color 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#2563eb')}
                    onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                  />
                </div>
              ))}

              {/* JD 关键词提示 */}
              {jdAnalysis && jdAnalysis.missingKeywords.length > 0 && (
                <div style={{ padding: '12px 14px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 6 }}>💡 目标JD要求</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    建议在回答中尽量覆盖：<b>{jdAnalysis.missingKeywords.slice(0, 4).join('、')}</b>
                    {jdAnalysis.missingKeywords.length > 4 && ` 等`}
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!answers.some(a => a.trim())}
                style={{
                  padding: '12px',
                  fontSize: 14, fontWeight: 600,
                  background: answers.some(a => a.trim()) ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : '#d1d5db',
                  color: '#fff', border: 'none', borderRadius: 12,
                  cursor: answers.some(a => a.trim()) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                ✨ 生成简历内容
              </button>
            </div>
          )}

          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid #e5e7eb',
                borderTopColor: '#2563eb',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 14, color: '#6b7280' }}>AI正在根据你的经历生成内容...</div>
            </div>
          )}

          {step === 'result' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>✨ AI生成结果</div>
              <div style={{
                padding: '14px 16px', background: '#f9fafb',
                borderRadius: 12, border: '1px solid #e5e7eb',
                fontSize: 13, color: '#374151', lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {generated}
              </div>

              {/* JD 覆盖度反馈 */}
              {jdCoverage && (
                <div style={{ padding: '12px 14px', background: jdCoverage.coverage >= 50 ? '#ecfdf5' : '#fffbeb', borderRadius: 12, border: `1px solid ${jdCoverage.coverage >= 50 ? '#a7f3d0' : '#fde68a'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: jdCoverage.coverage >= 50 ? '#065f46' : '#92400e', marginBottom: 6 }}>
                    {jdCoverage.coverage >= 50 ? '✅ 已覆盖部分JD关键词' : '⚠️ JD覆盖不足'}
                  </div>
                  {jdCoverage.coveredKeywords.length > 0 && (
                    <div style={{ fontSize: 12, color: '#065f46', marginBottom: 4 }}>
                      已覆盖：{jdCoverage.coveredKeywords.join('、')}
                    </div>
                  )}
                  {jdCoverage.remainingKeywords.length > 0 && (
                    <div style={{ fontSize: 12, color: '#92400e' }}>
                      还差：{jdCoverage.remainingKeywords.slice(0, 3).join('、')}
                      {jdCoverage.remainingKeywords.length > 3 && ' 等'}
                    </div>
                  )}
                  {jdCoverage.coverage === 0 && !jdAnalysis && (
                    <div style={{ fontSize: 12, color: '#6b7280' }}>粘贴JD后，我可以帮你更好地匹配关键词</div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                可以直接使用，也可以修改后再确认
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('ask')} style={{
                  flex: 1, padding: '11px',
                  fontSize: 13, background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 12, cursor: 'pointer', color: '#374151',
                }}>
                  ← 重新编辑
                </button>
                <button onClick={handleConfirm} style={{
                  flex: 2, padding: '11px',
                  fontSize: 13, fontWeight: 600,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', borderRadius: 12, cursor: 'pointer', color: '#fff',
                }}>
                  ✅ 确认写入简历
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>❌</div>
              <div style={{ fontSize: 14, color: '#ef4444' }}>{error}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ padding: '10px 20px', fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer' }}>关闭</button>
                <button onClick={() => setStep('ask')} style={{ padding: '10px 20px', fontSize: 13, background: '#2563eb', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#fff' }}>重新回答</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

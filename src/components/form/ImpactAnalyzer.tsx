'use client';

import { useState, useRef } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume } from '@/types/resume';

interface QuantPrompt {
  label: string;
  question: string;
  hint: string;
}

interface QuantResult {
  dimension: string;
  value: string;
  source: string;
}

// 经历类型 → 量化维度提示库
const QUANT_PROMPTS: Record<string, QuantPrompt[]> = {
  job: [
    {
      label: '📊 规模',
      question: '你负责的工作影响到多少人/多少数据？',
      hint: '例如：日活用户 100 万、商品 SKU 10 万、订单量 5 万/天',
    },
    {
      label: '📈 增长/提升',
      question: '你做的事情带来了什么可衡量的变化？',
      hint: '例如：转化率提升 18%、接口响应从 800ms 降至 120ms、GMV 增长 30%',
    },
    {
      label: '💰 成本/收益',
      question: '你为公司省了多少钱或多赚了多少钱？',
      hint: '例如：优化缓存策略节省服务器成本 2 万/月、推进自动化工具提效 40%',
    },
    {
      label: '👥 团队规模',
      question: '你带领或协调多少人一起完成这件事？',
      hint: '例如：主导 5 人跨部门项目、协调 3 人小组完成重构',
    },
    {
      label: '🏗️ 技术难度',
      question: '这个工作用了什么有难度的技术？',
      hint: '例如：从 0 到 1 搭建推荐系统、设计高可用微服务架构（QPS 5 万）',
    },
  ],
  project: [
    {
      label: '🏆 成果',
      question: '项目最终结果是什么？获奖/上线/上线后的数据？',
      hint: '例如：获校级一等奖、上线后注册用户 5 万、GitHub 3k Star',
    },
    {
      label: '📊 规模',
      question: '这个项目处理多少数据/多少用户？',
      hint: '例如：日处理数据 1000W+、支撑双十一亿级流量、并发用户 10 万',
    },
    {
      label: '🔧 技术栈',
      question: '用了哪些技术/框架/工具？',
      hint: '例如：React + Node.js + MySQL、K8s + Docker 部署',
    },
    {
      label: '👥 角色',
      question: '你在项目中是什么角色？负责什么部分？',
      hint: '例如：独立负责前端架构设计、担任后端核心模块开发',
    },
  ],
  campus: [
    {
      label: '👥 参与规模',
      question: '活动/比赛有多少人参与？',
      hint: '例如：迎新晚会参与人数 500+、创业大赛参赛队伍 50 支',
    },
    {
      label: '🏆 成果',
      question: '你或团队获得了什么成绩或名次？',
      hint: '例如：获得校级一等奖、担任活动总负责人、获优秀干部称号',
    },
    {
      label: '📈 增长/贡献',
      question: '你负责的部分带来了什么可衡量的变化？',
      hint: '例如：招新人数同比增长 30%、活动参与率提升 25%',
    },
  ],
};

type ExperienceType = keyof typeof QUANT_PROMPTS;

export default function ImpactAnalyzer() {
  const { currentResume, updateResume } = useResumeStore();
  const resume: Resume | null = currentResume;

  const [step, setStep] = useState<'type' | 'input' | 'result'>('type');
  const [expType, setExpType] = useState<ExperienceType>('job');
  const [rawText, setRawText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<QuantResult[] | null>(null);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());

  // 对话式追问状态
  const [qaPairs, setQaPairs] = useState<{ q: string; a: string }[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [guidedGenerating, setGuidedGenerating] = useState(false);

  const prompts = QUANT_PROMPTS[expType];

  const startWithRaw = () => {
    if (!rawText.trim()) return;
    setGenerating(true);

    // 分析文本，提取可量化维度
    setTimeout(() => {
      const results = analyzeRawText(rawText.trim(), expType);
      setResult(results);
      setSelectedResults(new Set(results.map((_, i) => i)));
      setGenerating(false);
      setStep('result');
    }, 1800);
  };

  const startGuided = async () => {
    if (!rawText.trim()) return;
    setGenerating(true);

    // 第一步：AI 分析这段经历的类型和基础信息
    try {
      const res = await fetch('/api/guided-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: expType === 'job' ? 'work' : 'project',
          answers: [rawText.trim()],
        }),
      });
      const json = await res.json();
      if (json.success && json.generated) {
        // 把 AI 生成的内容作为第一条经历添加到简历
        const generatedText = json.generated;
        setResult([
          { dimension: '✨ AI 生成描述', value: generatedText, source: 'ai' },
        ]);
        setStep('result');
      }
    } catch {
      // 回退到规则分析
      const results = analyzeRawText(rawText.trim(), expType);
      setResult(results);
      setSelectedResults(new Set(results.map((_, i) => i)));
    }
    setGenerating(false);
  };

  const toggleResult = (index: number) => {
    const next = new Set(selectedResults);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedResults(next);
  };

  const applyToResume = () => {
    // 每次都从 store 读最新值，避免闭包捕获旧数据
    const { currentResume: liveResume, updateResume } = useResumeStore.getState();
    if (!liveResume || selectedResults.size === 0 || !result) return;

    const selectedTexts = Array.from(selectedResults)
      .map(i => result[i])
      .filter(r => r.source !== 'ai')
      .map(r => `• ${r.dimension}：${r.value}`);

    // 找到有实质内容的工作/项目条目（有公司名或职位名）
    const validWorkEntry = (liveResume.work || []).find(w => w.company?.trim() || w.position?.trim());
    const validProjectEntry = (liveResume.projects || []).find(p => p.name?.trim() || p.role?.trim());

    if (selectedTexts.length === 0) {
      alert('请至少选择一条有具体数据的量化结果');
      return;
    }

    // 根据经历类型添加到对应模块
    if (expType === 'job' && validWorkEntry) {
      const updated = [...liveResume.work];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        highlights: [...updated[updated.length - 1].highlights, ...selectedTexts],
      };
      updateResume(liveResume.id, { work: updated });
    } else if (expType === 'project' && validProjectEntry) {
      const updated = [...liveResume.projects];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        highlights: [...updated[updated.length - 1].highlights, ...selectedTexts],
      };
      updateResume(liveResume.id, { projects: updated });
    } else {
      // 没有现有条目或条目为空时，提示用户先添加
      alert('请先在对应模块添加一条经历（至少填写公司名或项目名称），再使用成就量化助手');
      return;
    }

    alert('已添加到简历！可以去"工作经历"或"项目经历"查看');
    // 重置
    setStep('type');
    setRawText('');
    setResult(null);
    setSelectedResults(new Set());
    setQaPairs([]);
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: 680 }}>
      {/* 步骤指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {['选择类型', '描述经历', '量化结果'].map((label, i) => {
          const steps = ['type', 'input', 'result'];
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

      {/* Step 1: 选择经历类型 */}
      {step === 'type' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            选择经历类型
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
            不同的经历类型，AI 会从不同的维度帮你挖掘量化数据
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
            {([
              { key: 'job', icon: '💼', title: '工作/实习', desc: '全职、实习、兼职' },
              { key: 'project', icon: '🚀', title: '项目经历', desc: '课程设计/比赛/开源' },
              { key: 'campus', icon: '🎓', title: '校园/社团', desc: '学生会/社团/志愿者' },
            ] as { key: ExperienceType; icon: string; title: string; desc: string }[]).map(item => (
              <button
                key={item.key}
                onClick={() => { setExpType(item.key); setStep('input'); }}
                style={{
                  padding: '20px 16px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${expType === item.key ? '#2563eb' : '#e5e7eb'}`,
                  background: expType === item.key ? '#eff6ff' : '#fff',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (expType !== item.key) (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd';
                }}
                onMouseLeave={e => {
                  if (expType !== item.key) (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.desc}</div>
              </button>
            ))}
          </div>

          <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '16px 20px', border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: 13, color: '#0369a1', fontWeight: 500, marginBottom: 6 }}>
              💡 怎么用效果最好？
            </p>
            <p style={{ fontSize: 12, color: '#075985', lineHeight: 1.7 }}>
              把你做过的事情用大白话写下来，不需要组织语言，不需要考虑格式。AI 会帮你分析哪些地方可以量化，以及具体可以填什么数字。
            </p>
          </div>
        </div>
      )}

      {/* Step 2: 输入经历 */}
      {step === 'input' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                描述你的{expType === 'job' ? '工作/实习' : expType === 'project' ? '项目' : '校园'}经历
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                用大白话写下来，越详细越好，不需要组织语言
              </p>
            </div>
            <button
              onClick={() => setStep('type')}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              ← 重新选择
            </button>
          </div>

          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={7}
            placeholder={
              expType === 'job'
                ? '例如：我在字节跳动商业产品部实习，做登录页重构。用 React 写的，处理了大概日活 500 万用户的登录模块。做的时候遇到浏览器兼容性问题，用 React Query 做了数据缓存，把接口响应从 2 秒降到了 300 毫秒。'
                : expType === 'project'
                ? '例如：做了一个课程设计，是用 Vue + Node.js 写的二手交易平台。我负责前端，用 Vue3 搭的，后来部署到了服务器上，有 200 多个同学注册使用了。'
                : '例如：我是学生会文体部的，大二的时候负责组织迎新晚会。联系了校外赞助，招募了 50 个志愿者，最后有 600 多人参加。'
            }
            style={{
              width: '100%', padding: '16px 18px', fontSize: 13, lineHeight: 1.75,
              border: '1.5px solid #d1d5db', borderRadius: 12, outline: 'none',
              resize: 'vertical', color: '#374151', background: '#fafafa',
              transition: 'all 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none'; }}
          />

          {/* 量化维度提示 */}
          <div style={{ marginTop: 16, marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
              📋 这些维度最能体现价值（AI 会重点分析）：
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {prompts.map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f9fafb', borderRadius: 20, border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 13 }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startWithRaw}
            disabled={!rawText.trim() || generating}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: !rawText.trim() || generating ? '#d1d5db' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff', border: 'none', cursor: !rawText.trim() || generating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: !rawText.trim() || generating ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
            }}
            onMouseEnter={e => {
              if (rawText.trim() && !generating) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(-1px)';
                el.style.boxShadow = '0 6px 18px rgba(37,99,235,0.4)';
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = !rawText.trim() || generating ? 'none' : '0 4px 14px rgba(37,99,235,0.3)';
            }}
          >
            {generating ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                分析中...
              </span>
            ) : '🚀 开始量化分析'}
          </button>
        </div>
      )}

      {/* Step 3: 量化结果 */}
      {step === 'result' && result && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                量化分析结果
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                以下是从你的描述中提取的量化维度，选择你要保留的 →
              </p>
            </div>
            <button
              onClick={() => { setStep('input'); setResult(null); }}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← 重新分析
            </button>
          </div>

          {/* 原始输入回顾 */}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 20, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>原始描述</p>
            <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{rawText.slice(0, 200)}{rawText.length > 200 ? '...' : ''}"
            </p>
          </div>

          {/* 量化结果列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {result.map((item, index) => (
              <div
                key={index}
                onClick={() => item.source !== 'ai' && toggleResult(index)}
                style={{
                  padding: '16px 20px', borderRadius: 12,
                  border: `2px solid ${selectedResults.has(index) ? '#2563eb' : '#e5e7eb'}`,
                  background: selectedResults.has(index) ? '#eff6ff' : '#fff',
                  cursor: item.source !== 'ai' ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {item.source !== 'ai' && (
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                      background: selectedResults.has(index) ? '#2563eb' : '#fff',
                      border: `2px solid ${selectedResults.has(index) ? '#2563eb' : '#d1d5db'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {selectedResults.has(index) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{item.dimension}</span>
                      {item.source === 'ai' && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#f3e8ff', color: '#7c3aed', fontWeight: 600 }}>
                          AI 生成
                        </span>
                      )}
                    </div>
                    {item.source !== 'ai' ? (
                      <input
                        type="text"
                        value={item.value}
                        onChange={e => {
                          const updated = [...result];
                          updated[index] = { ...updated[index], value: e.target.value };
                          setResult(updated);
                        }}
                        placeholder="填写具体数字或结果..."
                        style={{
                          width: '100%', padding: '8px 12px', fontSize: 13,
                          border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
                          color: '#374151', background: '#fff',
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>{item.value}</p>
                    )}
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                      💡 {getHintForDimension(item.dimension, expType)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={applyToResume}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 6px 18px rgba(16,185,129,0.4)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)'; }}
          >
            ✅ 应用到简历
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
            量化结果将追加到你的最新一条{expType === 'job' ? '工作经历' : expType === 'project' ? '项目经历' : '校园经历'}中
          </p>
        </div>
      )}
    </div>
  );
}

// 从原始文本提取可量化维度（规则引擎）
function analyzeRawText(text: string, type: ExperienceType): QuantResult[] {
  const results: QuantResult[] = [];

  // 提取数字类量化
  const numbers = text.match(/\d+[万亿千万百万千万]?[\s]*(?:用户|万|亿|人|次|条|天|月|年|元|%)/g) || [];
  const uniqueNumbers = [...new Set(numbers)];
  if (uniqueNumbers.length) {
    results.push({
      dimension: '📊 规模/数据',
      value: uniqueNumbers.slice(0, 3).join('、'),
      source: 'rule',
    });
  }

  // 提取性能提升类
  const perfMatch = text.match(/(?:从|由)[^，,。\n]*?(?:降至|降低到|减少到|优化到)[^，,。\n]*/);
  if (perfMatch) {
    results.push({
      dimension: '📈 性能/效率提升',
      value: perfMatch[0].trim().slice(0, 80),
      source: 'rule',
    });
  }

  // 提取增长类
  const growthMatch = text.match(/(?:提升|增长|提高|增加|减少|降低)[^，,。\n]{0,50}/g);
  if (growthMatch && growthMatch.length) {
    results.push({
      dimension: '📈 增长/提升',
      value: growthMatch.slice(0, 2).join('；').trim().slice(0, 80),
      source: 'rule',
    });
  }

  // 提取人数类
  const peopleMatch = text.match(/\d+[\s]*(?:人|位|名|员)/g);
  if (peopleMatch) {
    results.push({
      dimension: '👥 团队规模',
      value: peopleMatch.slice(0, 3).join('、'),
      source: 'rule',
    });
  }

  // 提取技术栈
  const techs = [
    'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'TypeScript',
    'Spring', 'Django', 'Flask', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Docker', 'K8s', 'Kubernetes', 'Linux', 'Git', 'Webpack', 'Vite',
    'TensorFlow', 'PyTorch', 'Pytorch', 'Pandas', 'NumPy', 'Kafka',
  ];
  const foundTechs = techs.filter(t => text.includes(t));
  if (foundTechs.length) {
    results.push({
      dimension: '🔧 技术栈',
      value: foundTechs.slice(0, 8).join(' / '),
      source: 'rule',
    });
  }

  // 如果没找到任何量化，返回默认提示
  if (results.length === 0) {
    results.push({
      dimension: '📌 建议补充',
      value: '（这段描述缺少具体数字，建议补充：影响规模、提升比例、时间周期等）',
      source: 'rule',
    });
  }

  return results;
}

function getHintForDimension(dimension: string, type: ExperienceType): string {
  const hints: Record<string, string> = {
    '📊 规模/数据': '可以填：日活用户数、日处理数据量、订单量、接口调用次数等',
    '📈 性能/效率提升': '可以填：从XX降至XX的响应时间/加载时间/QPS等',
    '📈 增长/提升': '可以填：转化率提升X%、DAU增长X%、收入增加X万等',
    '👥 团队规模': '可以填：你带领或协调的人数、团队总人数等',
    '🔧 技术栈': 'AI识别到的技术关键词，可以在简历里显式写出',
    '✨ AI 生成描述': '这是AI根据你的描述生成的优化版STAR表达，建议通读后应用',
    '📌 建议补充': '建议回忆这段经历中涉及的具体数字，或咨询有经验的人',
  };
  return hints[dimension] || '补充具体数字，让描述更有说服力';
}

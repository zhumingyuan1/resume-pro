'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume } from '@/types/resume';

type ExpType = 'job' | 'project' | 'campus';

interface ParsedExperience {
  type: ExpType;
  companyOrProject: string;
  positionOrRole: string;
  timeRange: string;
  highlights: string[];
  technologies: string[];
  rawText: string;
}

export default function ImpactAnalyzer() {
  const { currentResume, updateResume } = useResumeStore();
  const resume: Resume | null = currentResume;

  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [parsed, setParsed] = useState<ParsedExperience | null>(null);

  // 调 AI 分析大白话，提取结构化信息
  const analyze = async () => {
    if (!rawText.trim() || !currentResume) return;
    setLoading(true);

    try {
      const res = await fetch('/api/guided-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'extract', // 新的提取模式
          rawText: rawText.trim(),
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const data = json.data;
        // 自动判断类型
        const type: ExpType = data.type || detectType(rawText);
        setParsed({
          type,
          companyOrProject: data.companyOrProject || data.name || '',
          positionOrRole: data.positionOrRole || data.role || '',
          timeRange: data.timeRange || '',
          highlights: data.highlights || [rawText.trim()],
          technologies: data.technologies || [],
          rawText: rawText.trim(),
        });
        setStep('preview');
      } else {
        // API 失败时用规则引擎兜底
        const fallback = ruleBasedParse(rawText);
        setParsed(fallback);
        setStep('preview');
      }
    } catch {
      const fallback = ruleBasedParse(rawText);
      setParsed(fallback);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  // 规则引擎兜底（无 AI 时也能用）
  const detectType = (text: string): ExpType => {
    const t = text.toLowerCase();
    if (/实习|工作|全职|兼职|字节|腾讯|阿里|百度|美团|字节跳动|京东|网易|华为/i.test(t)) return 'job';
    if (/大赛|比赛|课程设计|毕业设计|开源|github|项目|创业|side project/i.test(t)) return 'project';
    return 'campus';
  };

  const ruleBasedParse = (text: string): ParsedExperience => {
    const type = detectType(text);
    // 提技术栈
    const techs = extractTechs(text);
    // 提数字
    const numbers = text.match(/\d+[万亿千万百万]?[人天月年万%]*/g) || [];
    return {
      type,
      companyOrProject: type === 'job' ? '（待填写公司名）' : '（待填写项目名）',
      positionOrRole: type === 'job' ? '（待填写岗位）' : type === 'project' ? '项目成员' : '参与者',
      timeRange: '（待填写）',
      highlights: numbers.length > 0
        ? [`根据描述提炼：${text.trim().slice(0, 60)}...`, `涉及规模：${numbers.slice(0, 3).join('、')}`]
        : [text.trim()],
      technologies: techs,
      rawText: text.trim(),
    };
  };

  const extractTechs = (text: string): string[] => {
    const techList = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'TypeScript',
      'Spring', 'Django', 'Flask', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
      'Docker', 'K8s', 'Kubernetes', 'Linux', 'Git', 'Webpack', 'Vite',
      'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Kafka', 'Flink', 'flask', 'express'];
    return techList.filter(t => text.includes(t));
  };

  // 应用到简历
  const applyToResume = () => {
    if (!parsed || !currentResume) return;
    const { updateResume } = useResumeStore.getState();
    const now = new Date().toISOString();

    if (parsed.type === 'job') {
      const newEntry = {
        id: crypto.randomUUID(),
        company: parsed.companyOrProject,
        position: parsed.positionOrRole,
        startDate: parsed.timeRange.split('-')[0]?.trim() || '',
        endDate: parsed.timeRange.includes('-') ? parsed.timeRange.split('-')[1]?.trim() || '' : '至今',
        current: !parsed.timeRange.includes('-'),
        highlights: parsed.highlights,
        summary: '',
        website: '',
      };
      updateResume(currentResume.id, { work: [...(currentResume.work || []), newEntry] });
    } else if (parsed.type === 'project') {
      const newEntry = {
        id: crypto.randomUUID(),
        name: parsed.companyOrProject,
        role: parsed.positionOrRole,
        startDate: parsed.timeRange.split('-')[0]?.trim() || '',
        endDate: parsed.timeRange.includes('-') ? parsed.timeRange.split('-')[1]?.trim() || '' : '',
        current: false,
        highlights: parsed.highlights,
        description: '',
        technologies: parsed.technologies,
        url: '',
        github: '',
        demo: '',
      };
      updateResume(currentResume.id, { projects: [...(currentResume.projects || []), newEntry] });
    } else {
      // campus → 追加到最后一个教育经历的备注，或者新建
      const eduList = currentResume.education || [];
      if (eduList.length > 0) {
        const lastEdu = { ...eduList[eduList.length - 1] };
        lastEdu.summary = (lastEdu.summary || '') + '\n' + parsed.highlights.join('；');
        updateResume(currentResume.id, {
          education: [...eduList.slice(0, -1), lastEdu],
        });
      }
    }

    alert('已添加到简历！去对应模块查看');
    setStep('input');
    setRawText('');
    setParsed(null);
  };

  const typeLabels: Record<ExpType, string> = {
    job: '💼 工作/实习经历',
    project: '🚀 项目经历',
    campus: '🎓 校园/社团经历',
  };

  return (
    <div style={{ padding: '24px 0', maxWidth: 680 }}>
      {step === 'input' && (
        <div>
          <div style={{ marginBottom: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>📝 描述你的经历</h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              不用考虑格式，不用想怎么写。就用大白话告诉我你做过什么。
            </p>
          </div>

          {/* 输入区 */}
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={6}
            placeholder={
              '例如：\n\n我在字节跳动商业产品部实习了3个月，做登录页重构。用 React 写的，日活大概 500 万用户登录模块。遇到浏览器兼容问题，用 React Query 做数据缓存，把接口响应从 2 秒降到了 300 毫秒。\n\n或者：\n\n我们小组3个人做了个二手交易平台课程设计，我负责前端 Vue3，用了 2 周时间，最后有 200 多人注册使用。'
            }
            style={{
              width: '100%', padding: '16px 18px', fontSize: 13, lineHeight: 1.75,
              border: '1.5px solid #d1d5db', borderRadius: 12, outline: 'none',
              resize: 'vertical', color: '#374151', background: '#fafafa',
              transition: 'all 0.15s',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#2563eb';
              e.target.style.background = '#fff';
              e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.background = '#fafafa';
              e.target.style.boxShadow = 'none';
            }}
          />

          {/* 提示 */}
          <div style={{ marginTop: 12, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', alignSelf: 'center' }}>💡 你可以提到：</div>
            {['公司/团队名称', '你负责什么', '用了什么技术', '结果怎么样', '带了多少人'].map(hint => (
              <span key={hint} style={{ fontSize: 11, padding: '3px 10px', background: '#f3f4f6', color: '#6b7280', borderRadius: 20 }}>{hint}</span>
            ))}
          </div>

          <button
            onClick={analyze}
            disabled={!rawText.trim() || loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: !rawText.trim() || loading
                ? '#d1d5db'
                : 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff', border: 'none',
              cursor: !rawText.trim() || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: !rawText.trim() || loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                AI 正在分析...
              </span>
            ) : '🚀 开始挖掘亮点'}
          </button>
        </div>
      )}

      {step === 'preview' && parsed && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>📋 即将添加的内容</h2>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>AI 判断这是一条「{typeLabels[parsed.type]}」，确认后直接添加到简历</p>
            </div>
            <button
              onClick={() => { setStep('input'); setParsed(null); }}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              ← 重新描述
            </button>
          </div>

          {/* 类型标签 */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, marginBottom: 16 }}>
            <span style={{ fontSize: 14 }}>{parsed.type === 'job' ? '💼' : parsed.type === 'project' ? '🚀' : '🎓'}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{typeLabels[parsed.type]}</span>
          </div>

          {/* 提取的信息卡片 */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            {/* 公司/项目名 */}
            {parsed.type !== 'campus' && (
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 12, color: '#9ca3af', width: 80, flexShrink: 0 }}>{parsed.type === 'job' ? '公司' : '项目'}</span>
                <input
                  value={parsed.companyOrProject}
                  onChange={e => setParsed({ ...parsed, companyOrProject: e.target.value })}
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                  placeholder={`输入${parsed.type === 'job' ? '公司' : '项目'}名称`}
                />
              </div>
            )}

            {/* 岗位/角色 */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 12, color: '#9ca3af', width: 80, flexShrink: 0 }}>{parsed.type === 'job' ? '岗位' : '角色'}</span>
              <input
                value={parsed.positionOrRole}
                onChange={e => setParsed({ ...parsed, positionOrRole: e.target.value })}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                placeholder={`输入${parsed.type === 'job' ? '岗位名称' : '你在项目中的角色'}`}
              />
            </div>

            {/* 时间 */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 12, color: '#9ca3af', width: 80, flexShrink: 0 }}>时间</span>
              <input
                value={parsed.timeRange}
                onChange={e => setParsed({ ...parsed, timeRange: e.target.value })}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                placeholder="例如：2024.03 - 2024.06"
              />
            </div>

            {/* 技术栈 */}
            {parsed.technologies.length > 0 && (
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <span style={{ fontSize: 12, color: '#9ca3af', width: 80, flexShrink: 0 }}>技术栈</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                  {parsed.technologies.map(t => (
                    <span key={t} style={{ fontSize: 12, padding: '2px 10px', background: '#f0f9ff', color: '#2563eb', borderRadius: 20, border: '1px solid #bfdbfe' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 经历描述（可编辑） */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>经历描述（点击修改）</div>
              <textarea
                value={parsed.highlights.join('\n')}
                onChange={e => setParsed({ ...parsed, highlights: e.target.value.split('\n').filter(Boolean) })}
                rows={Math.max(2, parsed.highlights.length)}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13, lineHeight: 1.7,
                  border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
                  color: '#374151', background: '#fafafa', resize: 'vertical',
                }}
              />
            </div>
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
          >
            ✅ 确认添加到简历
          </button>
        </div>
      )}
    </div>
  );
}

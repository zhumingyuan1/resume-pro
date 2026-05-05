'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume, WorkExperience, Project } from '@/types/resume';

type ExpType = 'job' | 'project';

interface RewriteResult {
  companyOrProject: string;
  positionOrRole: string;
  timeRange: string;
  highlights: string[];
  technologies: string[];
  raw: string;
}

export default function ExperienceBuilder() {
  const { currentResume, updateResume } = useResumeStore();
  const resume: Resume | null = currentResume;

  const [expType, setExpType] = useState<ExpType>('job');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [saving, setSaving] = useState(false);

  // AI 一键改写
  const handleRewrite = async () => {
    if (!rawText.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/guided-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'extract', rawText: rawText.trim() }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const data = json.data;
        setResult({
          companyOrProject: data.companyOrProject || (expType === 'job' ? '' : '新项目'),
          positionOrRole: data.positionOrRole || (expType === 'job' ? '' : '项目成员'),
          timeRange: data.timeRange || '',
          highlights: Array.isArray(data.highlights) && data.highlights.length > 0
            ? data.highlights
            : [rawText.trim()],
          technologies: Array.isArray(data.technologies) ? data.technologies : [],
          raw: rawText.trim(),
        });
      } else {
        // 规则引擎兜底
        setResult(ruleBasedResult(rawText.trim()));
      }
    } catch {
      setResult(ruleBasedResult(rawText.trim()));
    } finally {
      setLoading(false);
    }
  };

  const ruleBasedResult = (text: string): RewriteResult => {
    const techs = extractTechs(text);
    const numbers = text.match(/\d+[万亿千万百万]?[人天月年万%个]*/g) || [];
    return {
      companyOrProject: expType === 'job' ? '' : '新项目',
      positionOrRole: expType === 'job' ? '' : '项目成员',
      timeRange: '',
      highlights: numbers.length > 0
        ? [`根据描述提炼：${text.trim().slice(0, 50)}...`, ...(numbers.length > 0 ? [`涉及规模：${numbers.slice(0, 2).join('、')}`] : [])]
        : [text.trim()],
      technologies: techs,
      raw: text.trim(),
    };
  };

  const extractTechs = (text: string): string[] => {
    const list = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'TypeScript',
      'Spring', 'Django', 'Flask', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
      'Docker', 'K8s', 'Kubernetes', 'Linux', 'Git', 'Webpack', 'Vite',
      'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Kafka', 'Flink', 'React Query',
      'Redux', 'Vuex', 'Next.js', 'Nuxt', 'Spring Boot', 'Spring Cloud'];
    return list.filter(t => text.includes(t));
  };

  // 确认添加 → 写入简历
  const handleConfirm = () => {
    if (!result || !currentResume) return;
    setSaving(true);

    const now = currentResume;

    if (expType === 'job') {
      const item: WorkExperience = {
        id: crypto.randomUUID(),
        company: result.companyOrProject || '（待填写公司名）',
        position: result.positionOrRole || '（待填写岗位）',
        startDate: result.timeRange.split('-')[0]?.trim() || '',
        endDate: result.timeRange.includes('-') ? result.timeRange.split('-')[1]?.trim() || '' : 'present',
        current: !result.timeRange.includes('-'),
        highlights: result.highlights,
        summary: '',
        website: '',
      };
      updateResume(now.id, { work: [...(now.work || []), item] });
    } else {
      const item: Project = {
        id: crypto.randomUUID(),
        name: result.companyOrProject || '新项目',
        role: result.positionOrRole || '项目成员',
        startDate: result.timeRange.split('-')[0]?.trim() || '',
        endDate: result.timeRange.includes('-') ? result.timeRange.split('-')[1]?.trim() || '' : '',
        current: false,
        highlights: result.highlights,
        technologies: result.technologies,
        description: '',
        url: '',
        github: '',
        demo: '',
      };
      updateResume(now.id, { projects: [...(now.projects || []), item] });
    }

    setSaving(false);
    setRawText('');
    setResult(null);
    alert('已添加到简历！去右侧预览查看效果');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部说明 */}
      <div style={{ padding: '12px 16px', background: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', marginBottom: 4 }}>📝 写经历更简单</div>
        <div style={{ fontSize: 12, color: '#075985', lineHeight: 1.6 }}>
          先选类型 → 大白话描述 → 点「AI改写」→ 确认添加。不用想格式，直接说你做了什么。
        </div>
      </div>

      {/* 第一步：选类型 */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>第一步：选择经历类型</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={() => { setExpType('job'); setResult(null); }}
            style={{
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${expType === 'job' ? '#2563eb' : '#e5e7eb'}`,
              background: expType === 'job' ? '#eff6ff' : '#fff',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>💼</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: expType === 'job' ? '#2563eb' : '#374151', marginBottom: 2 }}>工作/实习经历</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>全职、实习、兼职</div>
          </button>
          <button
            onClick={() => { setExpType('project'); setResult(null); }}
            style={{
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${expType === 'project' ? '#7c3aed' : '#e5e7eb'}`,
              background: expType === 'project' ? '#f5f3ff' : '#fff',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>🚀</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: expType === 'project' ? '#7c3aed' : '#374151', marginBottom: 2 }}>项目经历</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>课程设计/比赛/开源/side project</div>
          </button>
        </div>
      </div>

      {/* 第二步：大白话输入 */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
          第二步：用大白话描述 {expType === 'job' ? '工作/实习' : '项目'}
        </div>
        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          rows={5}
          placeholder={
            expType === 'job'
              ? '例如：在字节跳动商业产品部实习了3个月，做登录页重构。用 React 写的，日活大概 500 万用户登录模块。遇到浏览器兼容问题，用 React Query 做数据缓存，把接口响应从 2 秒降到了 300 毫秒。'
              : '例如：我们小组3个人做了个校园二手交易平台课程设计，我负责前端 Vue3，用了 2 周时间，最后有 200 多人注册使用。GitHub 上 开源了，有 50 多个 star。'
          }
          style={{
            width: '100%', padding: '14px 16px', fontSize: 13, lineHeight: 1.75,
            border: '1.5px solid #d1d5db', borderRadius: 12, outline: 'none',
            resize: 'vertical', color: '#374151', background: '#fafafa',
            transition: 'all 0.15s', boxSizing: 'border-box',
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
      </div>

      {/* AI 改写按钮 */}
      <button
        onClick={handleRewrite}
        disabled={!rawText.trim() || loading}
        style={{
          padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          background: !rawText.trim() || loading
            ? '#d1d5db'
            : expType === 'job'
              ? 'linear-gradient(135deg, #2563eb, #4f46e5)'
              : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color: '#fff', border: 'none',
          cursor: !rawText.trim() || loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: !rawText.trim() || loading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: 'spin 0.8s linear infinite' }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            AI 改写中...
          </>
        ) : (
          <>✨ 用 AI 改写简历语言</>
        )}
      </button>

      {/* AI 改写结果预览 */}
      {result && (
        <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
          {/* 卡片Header */}
          <div style={{
            padding: '10px 16px', background: '#f9fafb',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>AI 改写结果</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>— 可编辑后再确认</span>
            </div>
            <button
              onClick={() => setResult(null)}
              style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              重新描述
            </button>
          </div>

          {/* 可编辑字段 */}
          <div style={{ background: '#fff' }}>
            {/* 公司/项目名 */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#9ca3af', width: 70, flexShrink: 0 }}>
                {expType === 'job' ? '公司' : '项目名'}
              </span>
              <input
                value={result.companyOrProject}
                onChange={e => setResult({ ...result, companyOrProject: e.target.value })}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                placeholder={expType === 'job' ? '输入公司/机构名称' : '输入项目名称'}
              />
            </div>

            {/* 岗位/角色 */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#9ca3af', width: 70, flexShrink: 0 }}>
                {expType === 'job' ? '岗位' : '角色'}
              </span>
              <input
                value={result.positionOrRole}
                onChange={e => setResult({ ...result, positionOrRole: e.target.value })}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                placeholder={expType === 'job' ? '输入岗位名称' : '输入你在项目中的角色'}
              />
            </div>

            {/* 时间 */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#9ca3af', width: 70, flexShrink: 0 }}>时间</span>
              <input
                value={result.timeRange}
                onChange={e => setResult({ ...result, timeRange: e.target.value })}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                placeholder="如：2024.03 - 2024.06"
              />
            </div>

            {/* 技术栈标签 */}
            {result.technologies.length > 0 && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#9ca3af', width: 70, flexShrink: 0, marginTop: 2 }}>技术栈</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.technologies.map(t => (
                    <span key={t} style={{ fontSize: 12, padding: '2px 10px', background: '#f0f9ff', color: '#2563eb', borderRadius: 20, border: '1px solid #bfdbfe' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 经历描述（可编辑） */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>经历描述（点击修改）</div>
              <textarea
                value={result.highlights.join('\n')}
                onChange={e => setResult({ ...result, highlights: e.target.value.split('\n').filter(Boolean) })}
                rows={Math.max(2, result.highlights.length)}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 13, lineHeight: 1.7,
                  border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
                  color: '#374151', background: '#fafafa', resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* 确认按钮 */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={handleConfirm}
              disabled={saving}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: saving ? '#d1d5db' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: saving ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              {saving ? '添加中...' : '✅ 确认添加到简历'}
            </button>
            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              添加后可去右侧预览查看，或继续添加下一条
            </div>
          </div>
        </div>
      )}

      {/* 已有条目快速入口 */}
      {(resume?.work?.length || resume?.projects?.length) ? (
        <div style={{ marginTop: 8, padding: '12px 16px', background: '#fef9ec', borderRadius: 12, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 8 }}>📋 已有的经历条目</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(resume?.work || []).map(w => (
              <div key={w.id} style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#2563eb', fontWeight: 600 }}>💼</span>
                <span style={{ fontWeight: 600 }}>{w.company}</span>
                <span style={{ color: '#9ca3af' }}>{w.position}</span>
              </div>
            ))}
            {(resume?.projects || []).map(p => (
              <div key={p.id} style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#7c3aed', fontWeight: 600 }}>🚀</span>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                {p.role && <span style={{ color: '#9ca3af' }}>{p.role}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

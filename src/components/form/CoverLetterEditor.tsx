'use client';

import { useState, useRef } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume } from '@/types/resume';

type StyleType = 'formal' | 'friendly' | 'concise';
type Step = 'style' | 'target' | 'reference' | 'result';

interface SelectedRef {
  id: string;
  type: 'work' | 'project';
  label: string;
  content: string;
  checked: boolean;
}

const STYLE_CARDS = [
  {
    key: 'formal' as StyleType,
    icon: '🏛️',
    title: '正式商务',
    desc: '严谨专业，行文规范，适合大厂/外企/国企',
  },
  {
    key: 'friendly' as StyleType,
    icon: '🤝',
    title: '热情友好',
    desc: '有温度有热情，表达真诚，适合创业公司/中型企业',
  },
  {
    key: 'concise' as StyleType,
    icon: '⚡',
    title: '简洁有力',
    desc: '开门见山，句句干货，适合互联网/技术岗',
  },
];

export default function CoverLetterEditor() {
  const { currentResume } = useResumeStore();
  const resume: Resume | null = currentResume;

  const [step, setStep] = useState<Step>('style');
  const [style, setStyle] = useState<StyleType>('formal');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // 简历数据
  const profile = resume?.profile;
  const workList = resume?.work || [];
  const projectList = resume?.projects || [];
  const educationList = resume?.education || [];
  const skillList = resume?.skills || [];

  // 简历引用状态
  const [selectedRefs, setSelectedRefs] = useState<SelectedRef[]>([]);

  const handleStyleSelect = (s: StyleType) => {
    setStyle(s);
    setStep('target');
  };

  const handleTargetNext = () => {
    if (!targetCompany.trim() || !targetPosition.trim()) return;

    // 收集可引用的简历内容
    const refs: SelectedRef[] = [];

    workList.forEach((w) => {
      if (w.company || w.position || w.highlights?.length) {
        const content = [
          w.position && `岗位：${w.position}`,
          w.company && `公司：${w.company}`,
          w.highlights?.length && `工作内容：${w.highlights.filter(Boolean).join('；')}`,
        ].filter(Boolean).join(' | ');
        refs.push({ id: w.id, type: 'work', label: `${w.position || '工作经历'} @ ${w.company || ''}`, content, checked: true });
      }
    });

    projectList.forEach((p) => {
      if (p.name || p.role || p.highlights?.length) {
        const content = [
          p.name && `项目：${p.name}`,
          p.role && `角色：${p.role}`,
          p.technologies?.length && `技术栈：${p.technologies.join('、')}`,
          p.highlights?.length && `项目描述：${p.highlights.filter(Boolean).join('；')}`,
        ].filter(Boolean).join(' | ');
        refs.push({ id: p.id, type: 'project', label: `${p.name || '项目'} ${p.role ? `@ ${p.role}` : ''}`, content, checked: true });
      }
    });

    setSelectedRefs(refs);
    setStep('reference');
  };

  const toggleRef = (id: string) => {
    setSelectedRefs(prev => prev.map(r => r.id === id ? { ...r, checked: !r.checked } : r));
  };

  const handleGenerate = async () => {
    setGenerating(true);

    const selectedWork = selectedRefs.filter(r => r.type === 'work' && r.checked).map(r => r.content);
    const selectedProjects = selectedRefs.filter(r => r.type === 'project' && r.checked).map(r => r.content);
    const selectedEdu = educationList.map(e =>
      [e.institution, e.field, e.degree].filter(Boolean).join(' - ')
    ).join('；');

    const skillsText = skillList.map(cat =>
      cat.skills.map(s => s.name).join('、')
    ).join('、');

    try {
      const res = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile?.name || '',
          targetCompany: targetCompany.trim(),
          targetPosition: targetPosition.trim(),
          style,
          selectedWork,
          selectedProjects,
          selectedEducation: selectedEdu,
          skills: skillsText,
          profile: profile?.summary || profile?.titles?.default || '',
        }),
      });

      const json = await res.json();
      if (json.success && json.content) {
        setGeneratedContent(json.content);
        setEditingContent(json.content);
        setStep('result');
      } else {
        alert(json.error || '生成失败，请稍后重试');
      }
    } catch {
      alert('网络错误，请重试');
    }

    setGenerating(false);
  };

  const handleCopy = async () => {
    const text = isEditing ? editingContent : generatedContent;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const content = isEditing ? editingContent : generatedContent;
      const name = profile?.name || '求职者';
      const date = new Date().toLocaleDateString('zh-CN');

      const element = document.createElement('div');
      element.innerHTML = `
        <div style="width:210mm;min-height:297mm;padding:20mm 22mm;box-sizing:border-box;font-family:'PingFang SC','Microsoft YaHei','Source Han Sans SC',sans-serif;font-size:11pt;line-height:1.8;color:#1a1a1a;background:#fff;">
          <div style="text-align:right;font-size:9pt;color:#888;margin-bottom:16mm;">${date}</div>
          <div style="font-size:12pt;font-weight:700;color:#1a1a1a;margin-bottom:4mm;">尊敬的招聘负责人：</div>
          <div style="margin-top:6mm;white-space:pre-wrap;line-height:2;color:#333;">${content}</div>
          <div style="margin-top:8mm;text-align:right;">
            <div style="font-size:11pt;font-weight:600;margin-bottom:2mm;">此致</div>
            <div style="font-size:11pt;font-weight:600;">敬礼</div>
          </div>
          <div style="margin-top:6mm;text-align:right;">
            <div style="font-size:11pt;font-weight:600;">${name}</div>
            ${profile?.phone ? `<div style="font-size:9pt;color:#666;">电话：${profile.phone}</div>` : ''}
            ${profile?.email ? `<div style="font-size:9pt;color:#666;">邮箱：${profile.email}</div>` : ''}
          </div>
        </div>
      `;

      document.body.appendChild(element);
      await html2pdf().set({
        margin: 0,
        filename: `求职信_${targetCompany}_${name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(element).save();
      document.body.removeChild(element);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('导出失败，请稍后重试');
    }
    setPdfLoading(false);
  };

  const getStepLabel = (s: Step) => ({
    style: '选择风格',
    target: '填写目标',
    reference: '引用简历',
    result: '编辑导出',
  }[s]);

  const stepIndex = ({ style: 0, target: 1, reference: 2, result: 3 } as Record<Step, number>)[step];

  return (
    <div style={{ padding: '24px 0', maxWidth: 720 }}>
      {/* 步骤指示器 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {(['选择风格', '填写目标', '引用简历', '编辑导出'] as string[]).map((label, i) => {
          const active = stepIndex >= i;
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
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#1f2937' : '#9ca3af', whiteSpace: 'nowrap' }}>
                {label}
              </span>
              {i < 3 && (
                <div style={{ flex: 1, height: 2, background: active ? '#2563eb' : '#e5e7eb', minWidth: 16, margin: '0 4px', borderRadius: 1 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: 选择风格 */}
      {step === 'style' && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 6 }}>
            选择求职信风格
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
            不同风格适合不同公司和岗位，选对了能给 HR 留下好印象
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
            {STYLE_CARDS.map(card => (
              <button
                key={card.key}
                onClick={() => handleStyleSelect(card.key)}
                style={{
                  padding: '22px 16px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                  border: `2px solid ${style === card.key ? '#2563eb' : '#e5e7eb'}`,
                  background: style === card.key ? '#eff6ff' : '#fff',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (style !== card.key) (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd';
                }}
                onMouseLeave={e => {
                  if (style !== card.key) (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 6 }}>{card.title}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>{card.desc}</div>
              </button>
            ))}
          </div>

          <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '16px 20px', border: '1px solid #bae6fd' }}>
            <p style={{ fontSize: 13, color: '#0369a1', fontWeight: 500, marginBottom: 6 }}>
              💡 不知道怎么选？
            </p>
            <p style={{ fontSize: 12, color: '#075985', lineHeight: 1.7 }}>
              <b>大厂/外企/国企</b> → 正式商务（推荐）
              <br />创业公司/中型企业 → 热情友好
              <br />互联网/技术岗/快速申请 → 简洁有力
            </p>
          </div>
        </div>
      )}

      {/* Step 2: 填写目标公司+岗位 */}
      {step === 'target' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                填写目标公司和岗位
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                AI 会根据这些信息为你的求职信做个性化开头
              </p>
            </div>
            <button
              onClick={() => setStep('style')}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
            >
              ← 重选风格
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                🏢 目标公司 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                placeholder="例如：字节跳动、腾讯、阿里巴巴..."
                style={{
                  width: '100%', padding: '12px 16px', fontSize: 13,
                  border: '1.5px solid #d1d5db', borderRadius: 10, outline: 'none',
                  color: '#374151', background: '#fafafa', boxSizing: 'border-box',
                  transition: 'all 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                💼 目标岗位 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={targetPosition}
                onChange={e => setTargetPosition(e.target.value)}
                placeholder="例如：前端开发工程师、产品经理..."
                style={{
                  width: '100%', padding: '12px 16px', fontSize: 13,
                  border: '1.5px solid #d1d5db', borderRadius: 10, outline: 'none',
                  color: '#374151', background: '#fafafa', boxSizing: 'border-box',
                  transition: 'all 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <button
            onClick={handleTargetNext}
            disabled={!targetCompany.trim() || !targetPosition.trim()}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: !targetCompany.trim() || !targetPosition.trim()
                ? '#d1d5db'
                : 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff', border: 'none', cursor: !targetCompany.trim() || !targetPosition.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: !targetCompany.trim() || !targetPosition.trim() ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
            }}
            onMouseEnter={e => {
              if (targetCompany.trim() && targetPosition.trim()) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(-1px)';
                el.style.boxShadow = '0 6px 18px rgba(37,99,235,0.4)';
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = !targetCompany.trim() || !targetPosition.trim() ? 'none' : '0 4px 14px rgba(37,99,235,0.3)';
            }}
          >
            下一步：引用简历内容 →
          </button>
        </div>
      )}

      {/* Step 3: 引用简历内容 */}
      {step === 'reference' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                引用简历内容
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                勾选要引用的经历，AI 会将它们融入求职信（默认全选）
              </p>
            </div>
            <button
              onClick={() => setStep('target')}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← 重填目标
            </button>
          </div>

          {selectedRefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
                你的简历还没有工作经历或项目经历
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                请先在「工作经历」或「项目经历」中添加内容，再来生成求职信
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {selectedRefs.map(ref => (
                <div
                  key={ref.id}
                  onClick={() => toggleRef(ref.id)}
                  style={{
                    padding: '16px 18px', borderRadius: 12,
                    border: `2px solid ${ref.checked ? '#2563eb' : '#e5e7eb'}`,
                    background: ref.checked ? '#eff6ff' : '#fff',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                      background: ref.checked ? '#2563eb' : '#fff',
                      border: `2px solid ${ref.checked ? '#2563eb' : '#d1d5db'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {ref.checked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>
                          {ref.type === 'work' ? '💼' : '🚀'} {ref.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, wordBreak: 'break-all' }}>
                        {ref.content.length > 120 ? ref.content.slice(0, 120) + '...' : ref.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || selectedRefs.filter(r => r.checked).length === 0}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: generating || selectedRefs.filter(r => r.checked).length === 0
                ? '#d1d5db'
                : 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff', border: 'none',
              cursor: generating || selectedRefs.filter(r => r.checked).length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: generating || selectedRefs.filter(r => r.checked).length === 0 ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
            }}
            onMouseEnter={e => {
              if (!generating && selectedRefs.filter(r => r.checked).length > 0) {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(-1px)';
                el.style.boxShadow = '0 6px 18px rgba(37,99,235,0.4)';
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = generating || selectedRefs.filter(r => r.checked).length === 0 ? 'none' : '0 4px 14px rgba(37,99,235,0.3)';
            }}
          >
            {generating ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                AI 正在生成求职信...
              </span>
            ) : (
              '✨ 开始生成求职信'
            )}
          </button>
        </div>
      )}

      {/* Step 4: 编辑 + 复制/导出 */}
      {step === 'result' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                求职信已生成 ✨
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                可以直接使用，也可以编辑后再复制或导出
              </p>
            </div>
            <button
              onClick={() => setStep('reference')}
              style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← 重新生成
            </button>
          </div>

          {/* 求职信内容展示/编辑 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                  {isEditing ? '✏️ 编辑模式' : '📄 求职信内容'}
                </span>
                <span style={{
                  fontSize: 10, padding: '2px 10px', borderRadius: 10,
                  background: style === 'formal' ? '#e0e7ff' : style === 'friendly' ? '#d1fae5' : '#fef3c7',
                  color: style === 'formal' ? '#4338ca' : style === 'friendly' ? '#065f46' : '#92400e',
                  fontWeight: 600,
                }}>
                  {style === 'formal' ? '正式' : style === 'friendly' ? '友好' : '简洁'}
                </span>
              </div>
              <button
                onClick={() => { setIsEditing(!isEditing); if (isEditing) setEditingContent(generatedContent); }}
                style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                {isEditing ? '👁️ 预览' : '✏️ 编辑'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editingContent}
                onChange={e => setEditingContent(e.target.value)}
                rows={14}
                style={{
                  width: '100%', padding: '16px 18px', fontSize: 13, lineHeight: 1.9,
                  border: '1.5px solid #2563eb', borderRadius: 12, outline: 'none',
                  resize: 'vertical', color: '#374151', background: '#fff',
                  boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <div style={{
                padding: '20px 22px', background: '#fafafa', borderRadius: 12,
                border: '1px solid #e5e7eb', fontSize: 13, lineHeight: 2, color: '#374151',
                whiteSpace: 'pre-wrap', minHeight: 200,
              }}>
                {generatedContent}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: copySuccess ? '#10b981' : '#fff',
                color: copySuccess ? '#fff' : '#374151',
                border: `1.5px solid ${copySuccess ? '#10b981' : '#e5e7eb'}`,
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {copySuccess ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  已复制！
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  复制全文
                </>
              )}
            </button>

            <button
              onClick={handleExportPdf}
              disabled={pdfLoading}
              style={{
                padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: pdfLoading ? '#d1d5db' : '#fff',
                color: pdfLoading ? '#9ca3af' : '#374151',
                border: '1.5px solid #e5e7eb',
                cursor: pdfLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {pdfLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  导出中...
                </span>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  导出 PDF
                </>
              )}
            </button>

            <button
              onClick={() => {
                const text = isEditing ? editingContent : generatedContent;
                const name = profile?.name || '求职者';
                const link = `/cover-letter-preview?text=${encodeURIComponent(text)}&name=${encodeURIComponent(name)}&company=${encodeURIComponent(targetCompany)}&position=${encodeURIComponent(targetPosition)}&style=${style}`;
                window.open(link, '_blank');
              }}
              style={{
                padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#f9fafb'; el.style.borderColor = '#d1d5db'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              新页面预览
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
            生成内容为 AI 辅助，请核对信息准确性后再使用
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Project } from '@/types/resume';
import HelpTip from '@/components/HelpTip';
import FreeEntry from '@/components/FreeEntry';
import GuidedAdd from './GuidedAdd';

export default function FormSectionProjects() {
  const { currentResume, updateResume, jdAnalysis } = useResumeStore();
  const [addOpen, setAddOpen] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    url: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    free: '',
  });
  const projects: Project[] = currentResume?.projects || [];

  const update = (list: Project[]) => {
    if (!currentResume) return;
    updateResume(currentResume.id, { projects: list });
  };

  const save = () => {
    if (!form.name) return;
    const item: Project = {
      id: crypto.randomUUID(),
      name: form.name,
      role: form.role || undefined,
      technologies: [],
      highlights: form.description ? [form.description] : [],
      url: form.url || undefined,
    };
    update([...projects, item]);
    setForm({ name: '', role: '', url: '', startDate: '', endDate: '', isCurrent: false, description: '', free: '' });
    setAddOpen(false);
  };

  const remove = (id: string) => update(projects.filter(p => p.id !== id));

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    fontSize: 14,
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    outline: 'none',
    color: '#374151',
    background: '#fff',
    transition: 'all 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: '#6b7280',
    display: 'block',
    marginBottom: 6,
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#2563eb';
    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#e5e7eb';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* JD 分析结果提示 */}
      {jdAnalysis && jdAnalysis.missingKeywords.length > 0 && (
        <div style={{ padding:'12px 16px', background:'#eff6ff', borderRadius:12, border:'1px solid #bfdbfe' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#2563eb', marginBottom:4 }}>💡 JD分析结果已关联</div>
          <div style={{ fontSize:12, color:'#6b7280' }}>
            目标岗位缺少：<b>{jdAnalysis.missingKeywords.slice(0, 3).join('、')}{jdAnalysis.missingKeywords.length > 3 ? ' 等' : ''}</b>
            — 填写项目经历时，AI引导会自动覆盖这些关键词
          </div>
        </div>
      )}
      {projects.map(p => (
        <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', wordBreak: 'break-word' }}>{p.name}</div>
              {p.role && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{p.role}</div>}
              {p.url && (
                <div style={{ fontSize: 12, color: '#2563eb', marginTop: 2, wordBreak: 'break-all' }}>
                  🔗 {p.url}
                </div>
              )}
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {p.startDate} ~ {p.current ? '至今' : p.endDate || '至今'}
              </div>
            </div>
            <button
              onClick={() => remove(p.id)}
              style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0, marginLeft: 8 }}
            >
              删除
            </button>
          </div>
          {p.highlights && p.highlights.length > 0 && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
              {p.highlights.map((h, i) => (
                <div key={i} style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, wordBreak: 'break-word' }}>{h}</div>
              ))}
            </div>
          )}
        </div>
      ))}

      {!addOpen ? (
        <>
        <button
          onClick={() => setAddOpen(true)}
          style={{ padding: 12, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'center', width: '100%' }}
        >
          ✨ 添加项目经历
        </button>
        <button onClick={() => setGuidedOpen(true)}
          style={{ padding: 10, fontSize: 12, fontWeight: 500, background: '#f0fdf4', color: '#15803d', border: '1.5px solid #bbf7d0', borderRadius: 10, cursor: 'pointer' }}>
          🤖 AI引导填写 — 先聊聊你的经历，我来帮你写
        </button>
        </>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#fff' }}>
          <HelpTip
            title="项目经历"
            tips={['项目名称和时间必填，其他自由写', '描述你解决了什么技术难题，带来了什么效果', 'GitHub/在线演示链接加分']}
            example="用户中心重构项目\n解决了React迁移中的状态管理难题\n采用Redux方案，用户转化率提升40%\nGitHub: github.com/xxx"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 项目名称 */}
              <div>
                <label style={labelStyle}>项目名称 *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="如：用户中心重构"
                  style={inputStyle}
                />
              </div>

              {/* 项目链接 */}
              <div>
                <label style={labelStyle}>项目链接（选填）</label>
                <input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="GitHub / 在线演示"
                  style={inputStyle}
                />
              </div>

              {/* 担任角色 */}
              <div>
                <label style={labelStyle}>担任角色（选填）</label>
                <input
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="前端负责人 / 全栈 / 独立开发"
                  style={inputStyle}
                />
              </div>

              {/* 时间段 */}
              <div>
                <label style={labelStyle}>时间</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="month"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    style={{ ...inputStyle, flex: '1 1 120px', minWidth: 0 }}
                  />
                  <span style={{ color: '#9ca3af', fontSize: 13, flexShrink: 0 }}>~</span>
                  {form.isCurrent ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 120px', minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>至今</span>
                      <input
                        type="checkbox"
                        checked={form.isCurrent}
                        onChange={e => setForm(f => ({ ...f, isCurrent: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  ) : (
                    <input
                      type="month"
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      style={{ ...inputStyle, flex: '1 1 120px', minWidth: 0 }}
                    />
                  )}
                </div>
              </div>

              {/* 项目描述 */}
              <div>
                <label style={labelStyle}>项目描述（选填）</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  rows={5}
                  placeholder="STAR法则：我在XX项目中，负责XX模块，使用XX技术，达成了XX结果（最好有数字）\n\n例：独立负责用户登录模块重构，采用React+Redux方案，上线后转化率提升18%"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* 自由填写 */}
              <FreeEntry
                placeholder="还有其他项目内容？直接写这里"
                value={form.free || ''}
                onChange={v => setForm(f => ({ ...f, free: v }))}
              />

              {/* 按钮 */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    setAddOpen(false);
                    setForm({ name: '', role: '', url: '', startDate: '', endDate: '', isCurrent: false, description: '', free: '' });
                  }}
                  style={{ padding: '10px 16px', fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer' }}
                >
                  取消
                </button>
                <button
                  onClick={save}
                  disabled={!form.name}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: form.name ? '#7c3aed' : '#d1d5db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    cursor: form.name ? 'pointer' : 'not-allowed',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </HelpTip>
        </div>
      )}

      {guidedOpen && (
        <GuidedAdd
          type="project"
          onClose={() => setGuidedOpen(false)}
          onGenerated={({ highlights }) => {
            if (!currentResume || !highlights) return;
            const item: Project = {
              id: crypto.randomUUID(),
              name: '新项目（点击编辑）',
              description: highlights[0] || '',
              highlights,
              technologies: [],
            };
            const updated = [...(currentResume.projects || []), item];
            updateResume(currentResume.id, { projects: updated });
            setGuidedOpen(false);
          }}
        />
      )}
    </div>
  );
}

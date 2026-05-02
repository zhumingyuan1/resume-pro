'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { SkillCategory } from '@/types/resume';
import HelpTip from '@/components/HelpTip';

export default function FormSectionSkills() {
  const { currentResume, updateResume } = useResumeStore();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ category: '', content: '' });

  // 正确读取 skills 字段（SkillCategory[]），而非 skills2
  const skills: SkillCategory[] = currentResume?.skills || [];

  const update = (list: SkillCategory[]) => {
    if (!currentResume) return;
    updateResume(currentResume.id, { skills: list });
  };

  const save = () => {
    if (!form.category.trim()) return;
    // 将自由文本按换行拆分为 skills 数组
    const skillNames = form.content
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const item: SkillCategory = {
      id: crypto.randomUUID(),
      category: form.category.trim(),
      skills: skillNames.map(name => ({ name })),
    };
    update([...skills, item]);
    setForm({ category: '', content: '' });
    setAddOpen(false);
  };

  const remove = (id: string) => update(skills.filter(s => s.id !== id));

  // 渲染时把 SkillCategory.skills[] 还原为换行文本，保持UI不变
  const getContent = (cat: SkillCategory) =>
    cat.skills.map(sk => sk.name).join('\n');

  const s: React.CSSProperties = { width:'100%', padding:'10px 14px', fontSize:14, border:'1.5px solid #e5e7eb', borderRadius:10, outline:'none', color:'#374151', background:'#fff', transition:'all 0.15s' };
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; };
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor='#e5e7eb'; e.target.style.boxShadow='none'; };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <HelpTip
        title="技能特长"
        tips={['写你最擅长的1-2个方向即可', '用一句话描述掌握程度，如"3年经验/精通/熟练掌握', '写完可以加一条个人总结']}
        example="前端：React/Vue 3年经验，熟练掌握\n后端：Node.js/MySQL\n软技能：团队协作/项目领导"
      >
        <div>
          <div style={{ fontSize:12, fontWeight:500, color:'#6b7280', marginBottom:6 }}>技能分类标题（如：技术栈/语言能力/证书/其他）</div>
          <input value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value }))}
            onFocus={onF} onBlur={onB}
            placeholder="如：技术栈 / 语言能力 / 证书认证"
            style={s} />
        </div>
      </HelpTip>

      {/* 已添加的技能 — UI完全不变，只改数据来源 */}
      {skills.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {skills.map(sk => (
            <div key={sk.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1f2937' }}>{sk.category}</div>
                <button onClick={() => remove(sk.id)} style={{ fontSize:12, background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}>删除</button>
              </div>
              {getContent(sk) && (
                <div style={{ marginTop:8, fontSize:13, color:'#6b7280', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{getContent(sk)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加技能 */}
      {!addOpen ? (
        <button onClick={() => setAddOpen(true)}
          style={{ padding:12, fontSize:13, fontWeight:600, background:'linear-gradient(135deg, #f59e0b, #d97706)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer' }}>
          ✨ 添加技能分类
        </button>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:20 }}>
          <HelpTip
            title="添加技能"
            tips={['分类标题+具体内容即可', '每行一条技能，如：React / Vue / MySQL', '可以写多条技能，用回车分隔']}
          >
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#6b7280', marginBottom:6 }}>技能分类标题 *</div>
                <input value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value }))}
                  onFocus={onF} onBlur={onB}
                  placeholder="如：前端技术 / 后端技术 / 语言能力"
                  style={s} />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#6b7280', marginBottom:6 }}>具体内容（每行一条技能）</div>
                <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value }))}
                  rows={4}
                  onFocus={onF} onBlur={onB}
                  placeholder={"例如：\nReact / Vue / TypeScript\nMySQL / Redis\n团队协作 / 项目管理"}
                  style={{ width:'100%', padding:'10px 14px', fontSize:14, border:'1.5px solid #e5e7eb', borderRadius:10, outline:'none', resize:'vertical', lineHeight:1.7, color:'#374151', background:'#fff', transition:'all 0.15s' }} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setAddOpen(false); setForm({category:'', content:''}); }}
                  style={{ padding:'10px 16px', fontSize:13, background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, cursor:'pointer' }}>
                  取消
                </button>
                <button onClick={save} disabled={!form.category.trim()}
                  style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, background: form.category.trim() ? '#f59e0b' : '#d1d5db', color:'#fff', border:'none', borderRadius:10, cursor: form.category.trim() ? 'pointer' : 'not-allowed' }}>
                  ✅ 保存
                </button>
              </div>
            </div>
          </HelpTip>
        </div>
      )}
    </div>
  );
}

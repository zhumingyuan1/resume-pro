'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { WorkExperience } from '@/types/resume';
import HelpTip from '@/components/HelpTip';
import FreeEntry from '@/components/FreeEntry';
import GuidedAdd from './GuidedAdd';

export default function FormSectionWork() {
  const { currentResume, updateResume, jdAnalysis } = useResumeStore();
  const [addOpen, setAddOpen] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [form, setForm] = useState({ company:'', position:'', startDate:'', endDate:'', isCurrent: false, highlights:'', free:'' });
  const [coveredKeywords, setCoveredKeywords] = useState<string[]>([]);
  const works: WorkExperience[] = currentResume?.work || [];

  const update = (list: WorkExperience[]) => { if (!currentResume) return; updateResume(currentResume.id, { work: list }); };

  const save = () => {
    if (!form.company || !form.position) return;
    const item: WorkExperience = {
      id: crypto.randomUUID(),
      company: form.company,
      position: form.position,
      startDate: form.startDate,
      endDate: form.isCurrent ? '' : form.endDate,
      current: form.isCurrent,
      highlights: form.highlights ? [form.highlights] : [],
    };
    update([...works, item]);
    setForm({ company:'', position:'', startDate:'', endDate:'', isCurrent: false, highlights:'', free:'' });
    setCoveredKeywords([]);
    setAddOpen(false);
  };

  const remove = (id: string) => update(works.filter(w => w.id !== id));

  // JD 关键词实时检测
  const handleHighlightsChange = (text: string) => {
    setForm(f => ({ ...f, highlights: text }));
    if (!jdAnalysis?.missingKeywords?.length) return;
    const covered = jdAnalysis.missingKeywords.filter(k => text.includes(k));
    setCoveredKeywords(covered);
  };

  const s: React.CSSProperties = { width:'100%', padding:'10px 14px', fontSize:14, border:'1.5px solid #e5e7eb', borderRadius:10, outline:'none', color:'#374151', background:'#fff', transition:'all 0.15s' };
  const onF = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; };
  const onB = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor='#e5e7eb'; e.target.style.boxShadow='none'; };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* JD 分析结果提示 */}
      {jdAnalysis && jdAnalysis.missingKeywords.length > 0 && (
        <div style={{ padding:'12px 16px', background:'#eff6ff', borderRadius:12, border:'1px solid #bfdbfe' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#2563eb', marginBottom:4 }}>💡 JD分析结果已关联</div>
          <div style={{ fontSize:12, color:'#6b7280' }}>
            目标岗位缺少：<b>{jdAnalysis.missingKeywords.slice(0, 3).join('、')}{jdAnalysis.missingKeywords.length > 3 ? ' 等' : ''}</b>
            — 填写工作经历时，AI引导会自动覆盖这些关键词
          </div>
        </div>
      )}
      {works.map(w => (
        <div key={w.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:16, background:'#fff' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'#1f2937' }}>{w.company}</div>
              <div style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>{w.position}</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{w.startDate} ~ {w.current ? '至今' : w.endDate || '至今'}</div>
            </div>
            <button onClick={() => remove(w.id)} style={{ fontSize:12, background:'none', border:'none', cursor:'pointer', color:'#ef4444' }}>删除</button>
          </div>
          {w.highlights && w.highlights.length > 0 && (
            <div style={{ marginTop:10, padding:'8px 12px', background:'#f9fafb', borderRadius:8 }}>
              {w.highlights.map((h, i) => <div key={i} style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>{h}</div>)}
            </div>
          )}
        </div>
      ))}

      {!addOpen && !guidedOpen ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => setAddOpen(true)}
            style={{ padding:12, fontSize:13, fontWeight:600, background:'linear-gradient(135deg, #2563eb, #4f46e5)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', textAlign:'center' }}>
            ✨ 添加工作经历
          </button>
          <button onClick={() => setGuidedOpen(true)}
            style={{ padding:10, fontSize:12, fontWeight:500, background:'#f0fdf4', color:'#15803d', border:'1.5px solid #bbf7d0', borderRadius:10, cursor:'pointer' }}>
            🤖 AI引导填写 — 先聊聊你的经历，我来帮你写
          </button>
        </div>
      ) : (
        <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:20, background:'#fff' }}>
          <HelpTip
            title="工作经历"
            tips={['公司名称+职位+时间必填，其他自由写', 'STAR法则：背景→任务→行动→结果', '量化成果最有说服力，如"转化率提升40%"']}
            example="字节跳动 | 前端工程师 | 2022.06~至今\n负责用户中心重构，采用React+Redux方案独立完成，转化率提升40%"
          >
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* 公司 + 职位 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#6b7280', marginBottom:6 }}>公司名称 *</div>
                  <input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value }))} onFocus={onF} onBlur={onB}
                    placeholder="如：字节跳动" style={s} />
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#6b7280', marginBottom:6 }}>职位 *</div>
                  <input value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value }))} onFocus={onF} onBlur={onB}
                    placeholder="如：前端开发工程师" style={s} />
                </div>
              </div>

              {/* 时间段 */}
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#6b7280', marginBottom:6 }}>工作时间</div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <input type="month" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value }))} onFocus={onF} onBlur={onB}
                    style={s} />
                  <span style={{ color:'#9ca3af', fontSize:13 }}>至</span>
                  <input type="month" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value }))} onFocus={onF} onBlur={onB}
                    disabled={form.isCurrent} placeholder="至今"
                    style={{ ...s, opacity: form.isCurrent ? 0.5 : 1 }} />
                  <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#6b7280', cursor:'pointer', whiteSpace:'nowrap' }}>
                    <input type="checkbox" checked={form.isCurrent} onChange={e => setForm(f => ({...f, isCurrent: e.target.checked }))} style={{ cursor:'pointer' }} />
                    至今
                  </label>
                </div>
              </div>

              {/* 描述 */}
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#6b7280', marginBottom:6 }}>工作描述（选填）</div>
                <textarea value={form.highlights} onChange={e => handleHighlightsChange(e.target.value)} onFocus={onF} onBlur={onB}
                  rows={4} placeholder="STAR法则：我负责XX项目，使用XX技术，达成了XX结果（最好有数字）"
                  style={{ ...s, resize:'vertical', lineHeight:1.7 }} />
                {/* JD关键词实时提示 */}
                {jdAnalysis && jdAnalysis.missingKeywords.length > 0 && (
                  <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'#9ca3af' }}>JD缺失词：</span>
                    {Array.from(new Set(jdAnalysis.missingKeywords)).map(k => {
                      const covered = coveredKeywords.includes(k);
                      return (
                        <span key={k} style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 11,
                          background: covered ? '#ecfdf5' : '#fef2f2',
                          color: covered ? '#10b981' : '#ef4444',
                          border: `1px solid ${covered ? '#a7f3d0' : '#fecaca'}`,
                        }}>
                          {covered ? '✓' : '+'} {k}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 自由填写 */}
              <FreeEntry placeholder="还有其他工作内容？直接写这里" value={form.free} onChange={v => setForm(f => ({...f, free: v }))} />

              {/* 操作按钮 */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setAddOpen(false); setForm({company:'',position:'',startDate:'',endDate:'',isCurrent:false,highlights:'',free:''}); }}
                  style={{ padding:'10px 16px', fontSize:13, background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, cursor:'pointer' }}>
                  取消
                </button>
                <button onClick={save} disabled={!form.company || !form.position}
                  style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, background:form.company && form.position ? '#2563eb' : '#d1d5db', color:'#fff', border:'none', borderRadius:10, cursor:form.company && form.position ? 'pointer' : 'not-allowed' }}>
                  ✅ 保存
                </button>
              </div>
            </div>
          </HelpTip>
        </div>
      )}

      {guidedOpen && (
        <GuidedAdd
          type="work"
          onClose={() => setGuidedOpen(false)}
          onGenerated={({ highlights }) => {
            if (!currentResume || !highlights) return;
            const item: WorkExperience = {
              id: crypto.randomUUID(),
              company: '新工作经历（点击编辑）',
              position: '请填写职位',
              startDate: '',
              endDate: '',
              current: false,
              highlights,
            };
            updateResume(currentResume.id, { work: [...works, item] });
            setGuidedOpen(false);
          }}
        />
      )}
    </div>
  );
}

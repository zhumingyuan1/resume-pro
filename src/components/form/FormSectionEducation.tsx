'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Education } from '@/types/resume';
import HelpTip from '@/components/HelpTip';
import FreeEntry from '@/components/FreeEntry';

export default function FormSectionEducation() {
  const { currentResume, updateResume } = useResumeStore();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    institution: '',
    field: '',
    degree: '本科',
    startDate: '',
    endDate: '',
    isGraduated: false,
    honors: '',
  });
  const edu: Education[] = currentResume?.education || [];

  const update = (list: Education[]) => {
    if (!currentResume) return;
    updateResume(currentResume.id, { education: list });
  };

  const save = () => {
    if (!form.institution || !form.field) return;
    const item: Education = {
      id: crypto.randomUUID(),
      institution: form.institution,
      field: form.field,
      degree: form.degree,
      startDate: form.startDate,
      endDate: form.isGraduated ? form.endDate : '',
      current: !form.isGraduated,
      achievements: form.honors ? form.honors.split(',').map(s => s.trim()).filter(Boolean) : [],
    };
    update([...edu, item]);
    setForm({ institution: '', field: '', degree: '本科', startDate: '', endDate: '', isGraduated: false, honors: '' });
    setAddOpen(false);
  };

  const remove = (id: string) => update(edu.filter(e => e.id !== id));

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

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#2563eb';
    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e5e7eb';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {edu.map(e => (
        <div key={e.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', wordBreak: 'break-word' }}>{e.institution}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{e.field} · {e.degree}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {e.startDate} ~ {e.current ? '在读' : e.endDate || '在读'}
              </div>
            </div>
            <button
              onClick={() => remove(e.id)}
              style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0, marginLeft: 8 }}
            >
              删除
            </button>
          </div>
          {e.achievements && e.achievements.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {e.achievements.map((a, i) => (
                <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#fef3c7', color: '#b45309', borderRadius: 20 }}>
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {!addOpen ? (
        <button
          onClick={() => setAddOpen(true)}
          style={{ padding: 12, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}
        >
          添加教育背景
        </button>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#fff' }}>
          <HelpTip
            title="教育背景"
            tips={['学校名称+专业+时间必填', '写你现在在读的学校或已毕业院校', '相关荣誉/成绩自由写']}
            example="清华大学 | 计算机科学与技术 | 2019~2023\nGPA: 3.8/4.0 | 国家奖学金 | ACM区域赛银奖"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 学校名称 */}
              <div>
                <label style={labelStyle}>学校名称 *</label>
                <input
                  value={form.institution}
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="如：清华大学"
                  style={inputStyle}
                />
              </div>

              {/* 专业 */}
              <div>
                <label style={labelStyle}>专业 *</label>
                <input
                  value={form.field}
                  onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="如：计算机科学与技术"
                  style={inputStyle}
                />
              </div>

              {/* 学位 */}
              <div>
                <label style={labelStyle}>学位</label>
                <select
                  value={form.degree}
                  onChange={e => setForm(f => ({ ...f, degree: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="本科">本科</option>
                  <option value="硕士">硕士</option>
                  <option value="博士">博士</option>
                  <option value="大专">大专</option>
                  <option value="MBA">MBA</option>
                </select>
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
                  <input
                    type="month"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    disabled={!form.isGraduated}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    style={{ ...inputStyle, flex: '1 1 120px', minWidth: 0, opacity: form.isGraduated ? 1 : 0.5 }}
                  />
                </div>
              </div>

              {/* 毕业 checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isGraduated}
                  onChange={e => setForm(f => ({ ...f, isGraduated: e.target.checked }))}
                  style={{ cursor: 'pointer' }}
                />
                我已毕业（勾选后填写毕业时间，否则显示"在读"）
              </label>

              {/* 荣誉自由写 */}
              <FreeEntry
                placeholder="其他荣誉/成绩（选填，直接写）"
                value={form.honors}
                onChange={v => setForm(f => ({ ...f, honors: v }))}
              />

              {/* 按钮 */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    setAddOpen(false);
                    setForm({ institution: '', field: '', degree: '本科', startDate: '', endDate: '', isGraduated: false, honors: '' });
                  }}
                  style={{ padding: '10px 16px', fontSize: 13, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, cursor: 'pointer' }}
                >
                  取消
                </button>
                <button
                  onClick={save}
                  disabled={!form.institution || !form.field}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: form.institution && form.field ? '#10b981' : '#d1d5db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    cursor: form.institution && form.field ? 'pointer' : 'not-allowed',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </HelpTip>
        </div>
      )}
    </div>
  );
}

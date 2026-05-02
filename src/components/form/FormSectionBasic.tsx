'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import { MAJOR_JOB_MAP, MAJORS } from './MAJOR_JOB_MAP';
import HelpTip from '@/components/HelpTip';

export default function FormSectionBasic() {
  const { currentResume, updateResume } = useResumeStore();
  const [selectedMajor, setSelectedMajor] = useState('');
  const profile = (currentResume?.profile || {}) as any;

  const update = (updates: any) => {
    if (!currentResume) return;
    updateResume(currentResume.id, { profile: { ...profile, ...updates } });
  };

  const jobs = selectedMajor ? (MAJOR_JOB_MAP[selectedMajor] || []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 姓名 */}
      <HelpTip
        title="姓名"
        tips={['姓名是简历的标识，让招聘方一眼认出你是谁', '直接写真名就好，不需要花哨的称呼']}
        example="张三 / 李思明"
      >
        <input
          type="text"
          value={profile.name || ''}
          onChange={e => update({ name: e.target.value })}
          placeholder="输入你的真实姓名"
          style={{
            width: '100%', padding: '10px 14px', fontSize: 14,
            border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
            transition: 'all 0.15s', color: '#374151', background: '#fff',
          }}
          onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
        />
      </HelpTip>

      {/* 求职目标 */}
      <HelpTip
        title="求职目标"
        tips={['好的求职目标 = 职位 + 经验/能力 + 价值主张', '让HR快速判断你是否符合他们的需求']}
        example="前端开发工程师 · 3年经验 · 字节跳动"
      >
        <input
          type="text"
          value={profile.titles?.default || ''}
          onChange={e => update({ titles: { default: e.target.value } })}
          placeholder="例如：前端开发工程师 · 3年经验"
          style={{
            width: '100%', padding: '10px 14px', fontSize: 14,
            border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
            transition: 'all 0.15s', color: '#374151', background: '#fff',
          }}
          onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
        />
      </HelpTip>

      {/* 专业 */}
      <HelpTip
        title="专业"
        tips={['专业对口能增加简历通过率', '如果专业不对口，可以不填，重点突出技能和经验']}
        example="计算机科学与技术 / 软件工程"
      >
        <div>
          <select
            value={selectedMajor}
            onChange={e => setSelectedMajor(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14,
              border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
              cursor: 'pointer', color: '#374151', background: '#fff',
            }}
            onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="">— 选择专业 —</option>
            {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {jobs.length > 0 && (
            <div style={{ marginTop: 10, padding: 12, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 8, fontWeight: 500 }}>✅ 根据专业推荐目标岗位</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {jobs.map(j => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => update({ titles: { default: j } })}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12,
                      background: '#fff', color: '#2563eb',
                      border: '1px solid #bfdbfe', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = '#2563eb'; }}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </HelpTip>

      {/* 联系方式 */}
      <HelpTip
        title="联系方式"
        tips={['确保邮箱和电话正确，避免错失面试机会', '最好用工作常用的邮箱']}
        example="邮箱：zhangsan@email.com | 手机：138-0000-0000"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 6 }}>邮箱</label>
            <input
              type="email"
              value={profile.email || ''}
              onChange={e => update({ email: e.target.value })}
              placeholder="zhangsan@example.com"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
                transition: 'all 0.15s', color: '#374151', background: '#fff',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 6 }}>手机</label>
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={e => update({ phone: e.target.value })}
              placeholder="138-0000-0000"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
                transition: 'all 0.15s', color: '#374151', background: '#fff',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </HelpTip>

      {/* 其他信息 */}
      <HelpTip
        title="其他信息（选填）"
        tips={['城市帮助判断通勤', '技术博客/Gitee展示你的技术实力']}
        example="北京 | blog.example.com | gitee.com/username"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 6 }}>所在城市</label>
            <input
              type="text"
              value={profile.location || ''}
              onChange={e => update({ location: e.target.value })}
              placeholder="北京"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
                transition: 'all 0.15s', color: '#374151', background: '#fff',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 6 }}>个人网站</label>
            <input
              type="text"
              value={profile.website || ''}
              onChange={e => update({ website: e.target.value })}
              placeholder="选填"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
                transition: 'all 0.15s', color: '#374151', background: '#fff',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 6 }}>Gitee（选填）</label>
            <input
              type="text"
              value={profile.gitee || ''}
              onChange={e => update({ gitee: e.target.value })}
              placeholder="选填"
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1.5px solid #e5e7eb', borderRadius: 10, outline: 'none',
                transition: 'all 0.15s', color: '#374151', background: '#fff',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563eb'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>
        </div>
      </HelpTip>
    </div>
  );
}

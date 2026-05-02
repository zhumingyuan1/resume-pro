'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';

const TEMPLATES = [
  { id: 'template-1', name: '极客风', desc: '深蓝科技感，技术氛围', colors: ['#1e3a5f', '#2563eb', '#0f172a'], category: '互联网技术' },
  { id: 'template-2', name: '代码风', desc: '深色背景，代码风格', colors: ['#0f172a', '#10b981', '#1e293b'], category: '互联网技术' },
  { id: 'template-3', name: '简约技术', desc: '黑白灰+蓝点睛', colors: ['#ffffff', '#374151', '#2563eb'], category: '互联网技术' },
  { id: 'template-4', name: '新锐科技', desc: '渐变蓝紫，年轻活力', colors: ['#1e293b', '#6366f1', '#8b5cf6'], category: '互联网技术' },
  { id: 'template-5', name: '金融精英', desc: '藏青稳重，专业严谨', colors: ['#1e3a5f', '#d4af37', '#0f172a'], category: '金融咨询' },
];

export default function TemplateSelector() {
  const { selectedTemplate, setSelectedTemplate } = useResumeStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', fontSize: 13, fontWeight: 500,
          color: '#6b7280', background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 8,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#f9fafb'; el.style.borderColor = '#d1d5db'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = '#fff'; el.style.borderColor = '#e5e7eb'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>模板</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 8,
            width: 280, background: '#fff', borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid rgba(0,0,0,0.08)', zIndex: 50,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>选择模板</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>点击直接切换，预览实时更新</div>
            </div>

            {/* Template List - 竖排滚动 */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
              {TEMPLATES.map(t => {
                const isSelected = selectedTemplate === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10,
                      background: isSelected ? '#eff6ff' : 'transparent',
                      border: isSelected ? '1.5px solid #2563eb' : '1.5px solid transparent',
                      cursor: 'pointer', transition: 'all 0.15s',
                      marginBottom: 4,
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    {/* 模板预览色块 */}
                    <div style={{
                      width: 48, height: 36, borderRadius: 6, flexShrink: 0,
                      background: t.colors[0],
                      display: 'flex', flexDirection: 'column',
                      padding: '6px 8px', position: 'relative',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: t.colors[1], borderRadius: '6px 0 0 6px' }} />
                      <div style={{ height: 3, background: t.colors[2], width: '60%', borderRadius: 1, marginBottom: 3, marginLeft: 10 }} />
                      <div style={{ height: 2, background: t.colors[1], width: '70%', borderRadius: 1, marginLeft: 10, opacity: 0.5 }} />
                      <div style={{ height: 2, background: t.colors[1], width: '45%', borderRadius: 1, marginLeft: 10, opacity: 0.3, marginTop: 2 }} />
                    </div>

                    {/* 模板信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{t.desc}</div>
                    </div>

                    {/* 选中标记 */}
                    {isSelected && (
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#2563eb', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

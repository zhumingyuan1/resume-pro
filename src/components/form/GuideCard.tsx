'use client';

import { useState } from 'react';

interface GuideCardProps {
  title: string;
  why: string;           // 为什么要填这个
  question: string;        // 引导问题
  example?: string;        // 示例内容（可折叠）
  children: React.ReactNode;
}

export default function GuideCard({ title, why, question, example, children }: GuideCardProps) {
  const [showExample, setShowExample] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{title}</h3>
      </div>

      {/* 为什么要填这个 */}
      <div style={{
        padding: '12px 14px', borderRadius: 10,
        background: '#f0f9ff', border: '1px solid #bae6fd',
      }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#0369a1', marginBottom: 4 }}>💡 为什么要填这个</div>
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{why}</div>
      </div>

      {/* 引导问题 */}
      <div style={{
        padding: '14px 16px', borderRadius: 10,
        background: '#f5f3ff', border: '1px solid #ddd6fe',
      }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#7c3aed', marginBottom: 6 }}>🤔 引导问题</div>
        <div style={{ fontSize: 14, color: '#4c1d95', lineHeight: 1.7, fontStyle: 'italic' }}>{question}</div>
      </div>

      {/* 示例内容 */}
      {example && (
        <div>
          <button
            onClick={() => setShowExample(!showExample)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 0', fontSize: 12, fontWeight: 500, color: '#6b7280',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <span style={{ color: '#9ca3af', transition: 'transform 0.15s', transform: showExample ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
            📋 查看优秀示例
          </button>
          {showExample && (
            <div style={{
              marginTop: 8, padding: '14px 16px', borderRadius: 10,
              background: '#fafafa', border: '1px solid #e5e7eb',
              fontSize: 13, color: '#6b7280', lineHeight: 1.7,
              fontStyle: 'italic',
            }}>
              {example}
            </div>
          )}
        </div>
      )}

      {/* 表单内容 */}
      <div>{children}</div>
    </div>
  );
}

// 块引用组件 - 用于显示引用/备注
export function BlockQuote({ children, type = 'tip' }: { children: React.ReactNode; type?: 'tip' | 'warning' | 'success' }) {
  const configs = {
    tip: { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1', icon: '💡' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: '⚠️' },
    success: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46', icon: '✅' },
  };
  const c = configs[type];
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: c.color, marginBottom: 4 }}>{c.icon}</div>
      <div style={{ fontSize: 13, color: c.color, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

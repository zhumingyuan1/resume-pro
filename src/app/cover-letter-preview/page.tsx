'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CoverLetterPreviewContent() {
  const params = useSearchParams();
  const text = params.get('text') || '';
  const name = params.get('name') || '求职者';
  const company = params.get('company') || '';
  const position = params.get('position') || '';
  const style = params.get('style') || 'formal';

  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
      {/* 操作栏 */}
      <div style={{ width: '100%', maxWidth: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #2563eb, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>R</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1f2937' }}>求职信预览</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.close()}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}
          >
            ← 关闭
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#fff', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            🖨️ 打印
          </button>
        </div>
      </div>

      {/* A4 求职信 */}
      <div style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '22mm 26mm',
        background: '#fff',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        fontFamily: '"PingFang SC", "Microsoft YaHei", "Source Han Sans SC", "SimSun", sans-serif',
        fontSize: '11pt',
        lineHeight: 2,
        color: '#1a1a1a',
        boxSizing: 'border-box',
      }}>
        {/* 日期 */}
        <div style={{ textAlign: 'right', fontSize: '9.5pt', color: '#888', marginBottom: 16 }}>
          {date}
        </div>

        {/* 称呼 */}
        <div style={{ fontSize: '11pt', fontWeight: 600, color: '#1a1a1a', marginBottom: 10 }}>
          尊敬的招聘负责人：
        </div>

        {/* 正文 */}
        <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 2, color: '#333', fontSize: '10.5pt' }}>
          {text}
        </div>

        {/* 结尾 */}
        <div style={{ marginTop: 10, textAlign: 'right' }}>
          <div style={{ fontSize: '11pt', fontWeight: 600, marginBottom: 2 }}>此致</div>
          <div style={{ fontSize: '11pt', fontWeight: 600, marginBottom: 8 }}>敬礼</div>
          <div style={{ fontSize: '11pt', fontWeight: 600 }}>{name}</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
        按 <kbd style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: 4, border: '1px solid #e5e7eb' }}>Ctrl+P</kbd> 可打印或另存为 PDF
      </p>
    </div>
  );
}

export default function CoverLetterPreviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>加载中...</div>}>
      <CoverLetterPreviewContent />
    </Suspense>
  );
}

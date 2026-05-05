'use client';

import { useEffect, useState } from 'react';
import type { Resume } from '@/types/resume';
import ResumePreview from '@/components/ResumePreview';
import { useResumeStore } from '@/lib/resume-store';

interface SharedResumeData {
  id: string;
  title: string;
  data: Resume;
  templateId: string;
  viewCount: number;
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<SharedResumeData | null>(null);
  const { setCurrentResume } = useResumeStore();

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    async function fetchResume() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || '加载失败');
          return;
        }
        const json = await res.json();
        setData(json.resume);
        setCurrentResume(json.resume.data);
      } catch {
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    }

    fetchResume();
  }, [token, setCurrentResume]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontSize: 14 }}>正在加载简历...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>链接无法访问</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>{error}</p>
          <a href="/" style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            制作我的简历
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '40px 20px' }}>
      {/* 顶部横幅 */}
      <div style={{ maxWidth: 800, margin: '0 auto 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#eff6ff', borderRadius: 20, marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: '#2563eb' }}>👁️ 已阅读 {data?.viewCount || 1} 次</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
          {data?.title || '一份简历'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>由 AIprimus 简历Pro 生成 · 仅供参考</p>
      </div>

      {/* 简历预览区 */}
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 14, padding: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 650, aspectRatio: '210 / 297', background: '#fff' }}>
              <ResumePreview />
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 800, margin: '32px auto 0', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', borderRadius: 16, padding: '32px 24px', color: '#fff', boxShadow: '0 8px 30px rgba(37,99,235,0.3)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>我也想制作这样的简历</h2>
          <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>AI 智能生成 · 精准匹配 JD · 面试预测</p>
          <a href="/" style={{ display: 'inline-block', padding: '12px 32px', background: '#fff', color: '#2563eb', borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
            免费制作我的简历 →
          </a>
        </div>

        <p style={{ marginTop: 24, fontSize: 12, color: '#9ca3af' }}>
          AIprimus 学院 · 简历Pro · 智能求职助手
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { Resume } from '@/types/resume';

interface ShareResult {
  shareUrl: string;
  token: string;
  expiresAt: string;
}

interface HealthScore {
  total: number;
  items: { label: string; score: number; max: number }[];
}

function calcHealthScore(resume: Resume): HealthScore {
  const p = resume.profile || {};
  let score = 0;
  let max = 100;
  const items: HealthScore['items'] = [];

  const basicPass = !!(p.name && p.email && p.titles?.default);
  score += basicPass ? 20 : 0;
  items.push({ label: '基本信息', score: basicPass ? 20 : 0, max: 20 });

  const workPass = !!(resume.work && resume.work.length > 0 && resume.work.some((w: any) => w.highlights?.length > 0));
  score += workPass ? 25 : 0;
  items.push({ label: '工作经历', score: workPass ? 25 : 0, max: 25 });

  const eduPass = !!(resume.education && resume.education.length > 0);
  score += eduPass ? 15 : 0;
  items.push({ label: '教育背景', score: eduPass ? 15 : 0, max: 15 });

  const projPass = !!(resume.projects && resume.projects.length > 0);
  score += projPass ? 20 : 0;
  items.push({ label: '项目经历', score: projPass ? 20 : 0, max: 20 });

  const skillPass = !!(resume.skills && resume.skills.length > 0);
  score += skillPass ? 10 : 0;
  items.push({ label: '技能特长', score: skillPass ? 10 : 0, max: 10 });

  const summaryPass = !!(p.summary);
  score += summaryPass ? 10 : 0;
  items.push({ label: '简历摘要', score: summaryPass ? 10 : 0, max: 10 });

  return { total: score, items };
}

type Tab = 'xiaohongshu' | 'wechat' | 'link' | 'image';

const REFERRAL_MESSAGES = [
  { type: 'job', label: '求职版', text: '我在用这个AI简历工具，效果超好，帮你免费优化简历 → [链接]' },
  { type: 'friend', label: '朋友版', text: '朋友推荐我一个简历神器，AI帮你写简历，还能预测面试题 → [链接]' },
  { type: 'career', label: '职场版', text: '发现一个宝藏简历工具，HR都在用，帮你校招/跳槽快人一步 → [链接]' },
];

export default function ShareResume() {
  const { currentResume } = useResumeStore();
  const [tab, setTab] = useState<Tab>('xiaohongshu');
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState('');
  const [msgType, setMsgType] = useState('job');
  const previewRef = useRef<HTMLDivElement>(null);

  const health = currentResume ? calcHealthScore(currentResume) : null;
  const name = currentResume?.profile?.name || '我的简历';
  const title = currentResume?.profile?.titles?.default || '待设置求职目标';
  const summary = currentResume?.profile?.summary || '';

  async function generateShareLink() {
    if (!currentResume?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: currentResume.id }),
      });
      const json = await res.json();
      if (json.shareUrl) {
        setShareResult(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    const url = shareResult?.shareUrl || '';
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generateShareCardImage() {
    // 创建一个离屏的分享卡片
    const card = document.createElement('div');
    card.style.cssText = `
      width: 540px; padding: 36px; background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #fff;
      border-radius: 16px; box-sizing: border-box;
    `;

    // 顶部：分数
    const scoreColor = (health?.total || 0) >= 80 ? '#22c55e' : (health?.total || 0) >= 60 ? '#eab308' : '#f97316';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
        <div>
          <div style="font-size:28px;font-weight:700;margin-bottom:4px">${name}</div>
          <div style="font-size:14px;opacity:0.8">${title}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:36px;font-weight:800;color:${scoreColor}">${health?.total || 0}</div>
          <div style="font-size:11px;opacity:0.6">健康度评分</div>
        </div>
      </div>
      ${summary ? `<div style="font-size:13px;opacity:0.75;line-height:1.6;margin-bottom:20px;border-left:3px solid rgba(255,255,255,0.3);padding-left:12px">${summary}</div>` : ''}
      <div style="height:1px;background:rgba(255,255,255,0.15);margin-bottom:16px"></div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:11px;opacity:0.5;margin-bottom:4px">扫描查看完整简历</div>
          <div style="font-size:11px;opacity:0.5">AIprimus 简历Pro</div>
        </div>
        <div style="width:72px;height:72px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center">
          <div style="font-size:11px;color:#1e3a5f;text-align:center">简历二维码</div>
        </div>
      </div>
    `;

    document.body.appendChild(card);

    try {
      // 动态导入 html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(card, { backgroundColor: null, scale: 2 });
      const url = canvas.toDataURL('image/png');
      setShareImageUrl(url);
    } catch (e) {
      console.error('生成图片失败:', e);
    } finally {
      document.body.removeChild(card);
    }
  }

  function downloadImage() {
    if (!shareImageUrl) return;
    const a = document.createElement('a');
    a.href = shareImageUrl;
    a.download = `简历分享_${name}.png`;
    a.click();
  }

  // 分享话术（带链接替换占位）
  function getShareText() {
    const url = shareResult?.shareUrl || 'https://resume.aiprimus.cn';
    return REFERRAL_MESSAGES.find(m => m.type === msgType)?.text.replace('[链接]', url) || '';
  }

  // 微信分享内容
  const wechatShareData = {
    title: `${name}的简历 - AIprimus简历Pro`,
    desc: summary || `求职目标：${title}`,
    link: shareResult?.shareUrl || '',
  };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Tab切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {([
          { id: 'xiaohongshu', label: '📕 小红书' },
          { id: 'wechat', label: '💬 微信' },
          { id: 'link', label: '🔗 链接' },
          { id: 'image', label: '🖼️ 图片' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: 600, border: '1.5px solid', borderColor: tab === t.id ? '#2563eb' : '#e5e7eb', background: tab === t.id ? '#eff6ff' : '#fff', color: tab === t.id ? '#2563eb' : '#6b7280', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 小红书 */}
      {tab === 'xiaohongshu' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>生成小红书图文卡片，保存图片发布</p>
            {!shareResult && (
              <button onClick={generateShareLink} disabled={loading}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '生成中...' : '📕 生成小红书分享卡片'}
              </button>
            )}
            {shareResult && (
              <div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px', marginBottom: 12, fontSize: 12, color: '#374151', wordBreak: 'break-all' }}>
                  {getShareText()}
                </div>
                <button onClick={generateShareCardImage}
                  style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  🖼️ 生成并下载分享图片
                </button>
              </div>
            )}
          </div>
          {shareImageUrl && (
            <div style={{ textAlign: 'center' }}>
              <img src={shareImageUrl} alt="分享卡片" style={{ width: '100%', maxWidth: 400, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginBottom: 12 }} />
              <button onClick={downloadImage}
                style={{ padding: '8px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                ⬇️ 保存图片
              </button>
            </div>
          )}
        </div>
      )}

      {/* 微信 */}
      {tab === 'wechat' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>复制分享内容到微信使用</p>
            {!shareResult && (
              <button onClick={generateShareLink} disabled={loading}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #07c160, #06ad56)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '生成中...' : '💬 生成微信分享内容'}
              </button>
            )}
            {shareResult && (
              <div>
                <div style={{ background: '#f0f9f4', borderRadius: 8, padding: 12, marginBottom: 12, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 6 }}>标题</div>
                  <div style={{ fontSize: 13, color: '#1f2937', marginBottom: 10 }}>{wechatShareData.title}</div>
                  <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 6 }}>描述</div>
                  <div style={{ fontSize: 12, color: '#4b5563' }}>{wechatShareData.desc}</div>
                </div>
                <button onClick={copyLink}
                  style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #07c160, #06ad56)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {copied ? '✅ 已复制！' : '📋 复制链接'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 链接 */}
      {tab === 'link' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>私密链接，可设置过期时间</p>
            {!shareResult && (
              <button onClick={generateShareLink} disabled={loading}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? '生成中...' : '🔗 生成分享链接'}
              </button>
            )}
            {shareResult && (
              <div>
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 12, color: '#374151', wordBreak: 'break-all' }}>{shareResult.shareUrl}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>
                  有效期至：{new Date(shareResult.expiresAt).toLocaleDateString('zh-CN')}
                </div>
                <button onClick={copyLink}
                  style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {copied ? '✅ 已复制！' : '📋 复制链接'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 图片 */}
      {tab === 'image' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>导出精美分享卡片图片</p>
            <button onClick={generateShareCardImage}
              style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              🖼️ 生成分享图片
            </button>
          </div>
          {shareImageUrl && (
            <div style={{ textAlign: 'center' }}>
              <img src={shareImageUrl} alt="分享卡片" style={{ width: '100%', maxWidth: 400, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginBottom: 12 }} />
              <button onClick={downloadImage}
                style={{ padding: '8px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                ⬇️ 保存图片
              </button>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>
        💡 提示：html2canvas 需安装 — 运行 <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 3 }}>npm install html2canvas</code>
      </p>
    </div>
  );
}

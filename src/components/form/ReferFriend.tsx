'use client';

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/lib/resume-store';

interface ReferralStats {
  totalInvites: number;
  activatedInvites: number;
  activationRate: number;
  aiBonus: number;
}

const REFERRAL_MESSAGES = [
  {
    type: 'job',
    label: '💼 求职版',
    title: '求职党必看',
    text: '我在用这个AI简历工具，效果超好，帮你免费优化简历',
  },
  {
    type: 'friend',
    label: '👥 朋友版',
    title: '朋友推荐',
    text: '朋友推荐我一个简历神器，AI帮你写简历，还能预测面试题',
  },
  {
    type: 'career',
    label: '🏢 职场版',
    title: 'HR推荐',
    text: '发现一个宝藏简历工具，HR都在用，帮你校招/跳槽快人一步',
  },
];

export default function ReferFriend() {
  const { userId } = useResumeStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msgType, setMsgType] = useState('job');
  const [posterUrl, setPosterUrl] = useState('');
  const [generatingPoster, setGeneratingPoster] = useState(false);

  // 生成邀请码
  function generateInviteCode() {
    const code = crypto.randomUUID().split('-')[0];
    return code;
  }

  // 初始化邀请码
  useEffect(() => {
    if (!userId) return;
    const code = generateInviteCode();
    setInviteCode(code);
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${code}`;
    setInviteLink(link);
  }, [userId]);

  // 获取统计数据
  useEffect(() => {
    if (!userId) return;
    async function fetchStats() {
      try {
        const res = await fetch(`/api/referral/stats?inviterId=${userId}`);
        if (res.ok) {
          const json = await res.json();
          setStats(json);
        }
      } catch (e) {
        console.error('获取邀请统计失败', e);
      }
    }
    fetchStats();
  }, [userId]);

  async function copyLink() {
    const text = `${REFERRAL_MESSAGES.find(m => m.type === msgType)?.text} → ${inviteLink}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generatePoster() {
    setGeneratingPoster(true);
    try {
      const msg = REFERRAL_MESSAGES.find(m => m.type === msgType)!;

      // 创建离屏海报
      const poster = document.createElement('div');
      poster.style.cssText = `
        width: 540px; padding: 0; background: linear-gradient(160deg, #1e3a5f 0%, #0f2744 50%, #1a4a7a 100%);
        font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #fff;
        border-radius: 16px; box-sizing: border-box; overflow: hidden;
      `;

      // 顶部装饰
      poster.innerHTML = `
        <div style="padding: 32px 32px 24px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#4f46e5);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;box-shadow:0 4px 14px rgba(37,99,235,0.4)">R</div>
            <div>
              <div style="font-size:16px;font-weight:700">AIprimus 简历Pro</div>
              <div style="font-size:11px;opacity:0.6">智能求职助手</div>
            </div>
          </div>
          <div style="font-size:22px;font-weight:800;margin-bottom:8px;line-height:1.3">${msg.title}</div>
          <div style="font-size:13px;opacity:0.8;line-height:1.6">${msg.text}</div>
        </div>
        <div style="margin: 0 32px;border-radius:12px;background:rgba(255,255,255,0.08);padding:20px;display:flex;align-items:center;gap:16px">
          <div style="width:72px;height:72px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <div style="font-size:10px;color:#1e3a5f;text-align:center;padding:8px">二维码区域<br/><br/>扫码注册</div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;opacity:0.5;margin-bottom:4px">我的专属邀请码</div>
            <div style="font-size:20px;font-weight:800;letter-spacing:2px;color:#60a5fa;font-family:monospace">${inviteCode}</div>
            <div style="font-size:11px;opacity:0.5;margin-top:4px">好友注册立得高级功能</div>
          </div>
        </div>
        <div style="padding:20px 32px 28px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;opacity:0.5">奖励</div>
            <div style="font-size:18px;font-weight:700;color:#fbbf24">邀请人+5次AI次数</div>
          </div>
          <div style="font-size:11px;opacity:0.5;text-align:right">
            <div>被邀请人</div>
            <div style="font-size:13px;font-weight:600;color:#f9fafb">首次免费高级功能</div>
          </div>
        </div>
      `;

      document.body.appendChild(poster);

      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(poster, { backgroundColor: null, scale: 2 });
        const url = canvas.toDataURL('image/png');
        setPosterUrl(url);
      } catch (e) {
        console.error('生成海报失败:', e);
      } finally {
        document.body.removeChild(poster);
      }
    } finally {
      setGeneratingPoster(false);
    }
  }

  function downloadPoster() {
    if (!posterUrl) return;
    const a = document.createElement('a');
    a.href = posterUrl;
    a.download = `邀请海报_${inviteCode}.png`;
    a.click();
  }

  return (
    <div style={{ padding: '0 4px' }}>
      {/* 奖励说明 */}
      <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>🎁 邀请奖励</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#fff', borderRadius: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>+5</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>AI次数(你)</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#fff', borderRadius: 8 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>免费</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>高级功能(朋友)</div>
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      {stats && (
        <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>我的邀请数据</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1f2937' }}>{stats.totalInvites}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>已邀请</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{stats.activatedInvites}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>已激活</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>{stats.activationRate}%</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>激活率</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>+{stats.aiBonus}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>AI奖励</div>
            </div>
          </div>
        </div>
      )}

      {/* 话术选择 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>邀请话术</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {REFERRAL_MESSAGES.map(msg => (
            <button key={msg.type} onClick={() => setMsgType(msg.type)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: msgType === msg.type ? '#eff6ff' : '#fff', border: '1.5px solid', borderColor: msgType === msg.type ? '#2563eb' : '#e5e7eb', borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: msgType === msg.type ? '#2563eb' : '#374151' }}>{msg.label}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{msg.text}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 邀请链接 */}
      {inviteLink && (
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', marginBottom: 8, fontSize: 12, color: '#374151', wordBreak: 'break-all' }}>
          {inviteLink}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={copyLink}
          style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {copied ? '✅ 已复制！' : '📋 复制邀请语+链接'}
        </button>
        <button onClick={generatePoster} disabled={generatingPoster}
          style={{ flex: 1, padding: '9px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {generatingPoster ? '生成中...' : '🎨 生成邀请海报'}
        </button>
      </div>

      {/* 海报预览 */}
      {posterUrl && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <img src={posterUrl} alt="邀请海报" style={{ width: '100%', maxWidth: 400, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginBottom: 12 }} />
          <button onClick={downloadPoster}
            style={{ padding: '8px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            ⬇️ 保存海报
          </button>
        </div>
      )}
    </div>
  );
}

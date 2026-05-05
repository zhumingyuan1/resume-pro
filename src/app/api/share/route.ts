import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

const admin = getAdminClient();

export async function POST(req: NextRequest) {
  try {
    const { resumeId } = await req.json();
    if (!resumeId) {
      return NextResponse.json({ error: '缺少 resumeId' }, { status: 400 });
    }

    // 生成随机 token
    const token = crypto.randomUUID();

    // 默认7天过期
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 写入数据库
    const { data, error } = await admin
      .from('share_links')
      .insert({ resume_id: resumeId, token, expires_at: expiresAt })
      .select('id, token, expires_at')
      .single();

    if (error) {
      console.error('创建分享链接失败:', error);
      return NextResponse.json({ error: '创建分享链接失败' }, { status: 500 });
    }

    const baseUrl = req.headers.get('origin') || 'https://resume.aiprimus.cn';
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      shareUrl,
      token: data.token,
      expiresAt: data.expires_at,
    });
  } catch (e) {
    console.error('分享API错误:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

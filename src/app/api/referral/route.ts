import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

const admin = getAdminClient();

// 追踪邀请关系
export async function POST(req: NextRequest) {
  try {
    const { inviterId, inviteeId, inviteCode } = await req.json();
    if (!inviterId || !inviteCode) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('referrals')
      .insert({
        inviter_id: inviterId,
        invitee_id: inviteeId || null,
        invite_code: inviteCode,
        activated: !!inviteeId,
        activated_at: inviteeId ? new Date().toISOString() : null,
      })
      .select('id, activated')
      .single();

    if (error) {
      console.error('记录邀请关系失败:', error);
      return NextResponse.json({ error: '记录失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, activated: data.activated });
  } catch (e) {
    console.error('邀请追踪API错误:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 获取邀请统计数据
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inviterId = searchParams.get('inviterId');
    if (!inviterId) {
      return NextResponse.json({ error: '缺少 inviterId' }, { status: 400 });
    }

    // 查询该用户的邀请记录
    const { data: referrals, error } = await admin
      .from('referrals')
      .select('id, activated, invited_at, activated_at')
      .eq('inviter_id', inviterId);

    if (error) {
      console.error('获取邀请统计失败:', error);
      return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
    }

    const total = referrals?.length || 0;
    const activated = referrals?.filter(r => r.activated).length || 0;
    const activationRate = total > 0 ? Math.round((activated / total) * 100) : 0;

    // 奖励：每成功邀请1人，邀请人+5次AI次数
    const aiBonus = activated * 5;

    return NextResponse.json({
      totalInvites: total,
      activatedInvites: activated,
      activationRate,
      aiBonus,
    });
  } catch (e) {
    console.error('邀请统计API错误:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

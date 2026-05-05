import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

const admin = getAdminClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // 查找分享链接
    const { data: link, error: linkError } = await admin
      .from('share_links')
      .select('id, resume_id, expires_at, view_count')
      .eq('token', token)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: '链接不存在或已失效' }, { status: 404 });
    }

    // 检查是否过期
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: '链接已过期' }, { status: 410 });
    }

    // 增加浏览次数
    await admin
      .from('share_links')
      .update({ view_count: (link.view_count || 0) + 1 })
      .eq('token', token);

    // 获取简历数据
    const { data: resume, error: resumeError } = await admin
      .from('resumes')
      .select('id, title, data, template_id')
      .eq('id', link.resume_id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: '简历不存在' }, { status: 404 });
    }

    return NextResponse.json({
      resume: {
        id: resume.id,
        title: resume.title,
        data: resume.data,
        templateId: resume.template_id,
      },
      viewCount: (link.view_count || 0) + 1,
    });
  } catch (e) {
    console.error('获取分享简历错误:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

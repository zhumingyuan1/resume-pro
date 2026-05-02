import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST() {
  const supabase = getAdminClient();

  // 读取所有关键词，按 (keyword, keyword_type) 分组，保留每组第一条（created_at 最大的）
  const { data: all } = await supabase
    .from('industry_keywords')
    .select('id, keyword, keyword_type, created_at')
    .order('created_at', { ascending: false });

  if (!all) {
    return NextResponse.json({ success: false, error: '查询失败' });
  }

  const seen = new Set<string>();
  const toDelete: string[] = [];
  for (const row of all) {
    const key = `${row.keyword}||${row.keyword_type}`;
    if (seen.has(key)) {
      toDelete.push(row.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    await supabase.from('industry_keywords').delete().in('id', toDelete);
  }

  return NextResponse.json({
    success: true,
    deleted: toDelete.length,
    remaining: all.length - toDelete.length,
  });
}

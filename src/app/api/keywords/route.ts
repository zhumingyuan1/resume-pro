import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get('industry');
  const keywordType = searchParams.get('type');
  const keyword = searchParams.get('keyword');

  const supabase = getAdminClient();

  let query = supabase
    .from('industry_keywords')
    .select('*')
    .order('frequency', { ascending: false });

  if (industry) query = query.eq('industry', industry);
  if (keywordType) query = query.eq('keyword_type', keywordType);
  if (keyword) query = query.ilike('keyword', `%${keyword}%`);

  const { data, error } = await query.limit(200);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const grouped = {
    tech: data?.filter(r => r.keyword_type === 'tech') || [],
    soft: data?.filter(r => r.keyword_type === 'soft') || [],
    quant: data?.filter(r => r.keyword_type === 'quant') || [],
    cert: data?.filter(r => r.keyword_type === 'cert') || [],
  };

  const industries = [...new Set(data?.map(r => r.industry) || [])];

  return NextResponse.json({
    success: true,
    data,
    grouped,
    industries,
    total: data?.length || 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    const { keywords } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'keywords 必须是数组' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('industry_keywords')
      .insert(keywords.map(k => ({
        industry: k.industry,
        sub_industry: k.sub_industry || null,
        keyword: k.keyword,
        keyword_type: k.keyword_type,
        frequency: k.frequency || 1,
        source: k.source || 'manual',
      })))
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: data?.length || 0, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

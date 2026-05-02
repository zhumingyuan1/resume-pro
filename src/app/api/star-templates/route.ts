import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get('industry');
  const dimension = searchParams.get('dimension');

  const supabase = getAdminClient();

  let query = supabase
    .from('star_templates')
    .select('*')
    .order('usage_count', { ascending: false });

  if (industry) query = query.eq('industry', industry);
  if (dimension) query = query.eq('dimension', dimension);

  const { data, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data, total: data?.length || 0 });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    const { industry, dimension, situation, task, action, result, example_verbatim } = body;

    if (!industry || !dimension || !action || !result) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('star_templates')
      .insert({
        industry,
        dimension,
        situation: situation || '',
        task: task || '',
        action,
        result,
        example_verbatim: example_verbatim || null,
        usage_count: 0,
      })
      .select();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

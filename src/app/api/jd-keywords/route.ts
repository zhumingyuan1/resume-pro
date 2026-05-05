/**
 * JD关键词查询 API
 *
 * GET /api/jd-keywords?job_name=前端工程师
 * GET /api/jd-keywords?job_code=JB-HGFMGW
 *
 * 数据来源：Supabase jd_keywords 表（由 sync-jd-keywords.ts 同步 D:盘数据）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobName = searchParams.get('job_name');
  const jobCode = searchParams.get('job_code');

  try {
    const supabase = getAdminClient();

    // 情况1：按岗位名模糊查询（支持中文名）
    if (jobName) {
      // 先找到匹配的岗位
      const { data: matchedJobs, error: jobError } = await supabase
        .from('jobs')
        .select('code, name, category, sub_category, required_skills, bonus_skills')
        .ilike('name', `%${jobName}%`)
        .limit(5);

      if (jobError) throw jobError;
      if (!matchedJobs || matchedJobs.length === 0) {
        return NextResponse.json({ success: false, error: '未找到该岗位' }, { status: 404 });
      }

      const primaryJob = matchedJobs[0];

      // 查询该岗位的所有关键词
      const { data: keywords, error: kwError } = await supabase
        .from('jd_keywords')
        .select('keyword_category, keyword, frequency')
        .eq('job_code', primaryJob.code)
        .order('frequency', { ascending: false });

      if (kwError) throw kwError;

      // 按分类聚合
      const grouped = {
        hard_skill: keywords?.filter(k => k.keyword_category === 'hard_skill').map(k => k.keyword) || [],
        soft_skill: keywords?.filter(k => k.keyword_category === 'soft_skill').map(k => k.keyword) || [],
        experience: keywords?.filter(k => k.keyword_category === 'experience').map(k => k.keyword) || [],
        quantitative: keywords?.filter(k => k.keyword_category === 'quantitative').map(k => k.keyword) || [],
      };

      return NextResponse.json({
        success: true,
        data: {
          job: primaryJob,
          keywords: grouped,
          total: keywords?.length || 0,
          source: 'supabase_jd_keywords',
        },
      });
    }

    // 情况2：按 job_code 精确查询
    if (jobCode) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('code, name, category, sub_category, required_skills, bonus_skills')
        .eq('code', jobCode)
        .single();

      if (jobError) throw jobError;

      const { data: keywords, error: kwError } = await supabase
        .from('jd_keywords')
        .select('keyword_category, keyword, frequency')
        .eq('job_code', jobCode)
        .order('frequency', { ascending: false });

      if (kwError) throw kwError;

      const grouped = {
        hard_skill: keywords?.filter(k => k.keyword_category === 'hard_skill').map(k => k.keyword) || [],
        soft_skill: keywords?.filter(k => k.keyword_category === 'soft_skill').map(k => k.keyword) || [],
        experience: keywords?.filter(k => k.keyword_category === 'experience').map(k => k.keyword) || [],
        quantitative: keywords?.filter(k => k.keyword_category === 'quantitative').map(k => k.keyword) || [],
      };

      return NextResponse.json({
        success: true,
        data: {
          job,
          keywords: grouped,
          total: keywords?.length || 0,
          source: 'supabase_jd_keywords',
        },
      });
    }

    // 无参数：返回所有岗位列表（用于下拉选择）
    const { data: allJobs, error: allError } = await supabase
      .from('jobs')
      .select('code, name, category, sub_category')
      .order('category')
      .order('name');

    if (allError) throw allError;

    return NextResponse.json({
      success: true,
      data: {
        jobs: allJobs || [],
        total: allJobs?.length || 0,
        source: 'supabase',
      },
    });

  } catch (error: any) {
    console.error('[jd-keywords API error]', error);
    return NextResponse.json({ success: false, error: error.message || '服务器错误' }, { status: 500 });
  }
}

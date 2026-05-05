/**
 * 专业-岗位映射 API
 * 
 * GET /api/major-mapping?major=计算机科学与技术
 * GET /api/major-mapping?major=计算机科学与技术&type=related
 * GET /api/major-mapping?job=前端开发工程师
 * 
 * 数据来源：D:盘同步到 Supabase（由 sync-major-mapping.ts 同步）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// ============================================
// GET — 查询专业对应的岗位推荐
// ============================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const major = searchParams.get('major');
  const job = searchParams.get('job');
  const type = searchParams.get('type') || 'all'; // 'all' | 'direct' | 'near' | 'cross' | 'related'

  try {
    const supabase = getAdminClient();

    // 情况1：按专业名查询（模糊匹配）
    if (major) {
      // 先用专业名模糊查找专业记录
      const { data: matchedMajors, error: majorError } = await supabase
        .from('majors')
        .select('code, name, category, sub_category, traits')
        .ilike('name', `%${major}%`)
        .limit(5);

      if (majorError) throw majorError;

      if (!matchedMajors || matchedMajors.length === 0) {
        // Fallback: 使用内存中的硬编码数据
        return NextResponse.json({
          success: false,
          error: '未找到该专业，请确认专业名称',
          fallback: true,
        }, { status: 404 });
      }

      const primaryMajor = matchedMajors[0];

      // 查询该专业的所有映射岗位
      const { data: mappings, error: mapError } = await supabase
        .from('major_job_mapping')
        .select(`
          match_level,
          match_score,
          skill_gap,
          note,
          job:jobs!job_code (
            code,
            name,
            category,
            sub_category,
            required_skills,
            bonus_skills,
            salary_range,
            job_count
          )
        `)
        .eq('major_code', primaryMajor.code);

      if (mapError) throw mapError;

      if (!mappings || mappings.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            major: primaryMajor,
            recommendations: [],
            source: 'supabase',
          },
        });
      }

      // 分类整理
      const recommendations = mappings
        .filter(m => m.job)
        .map(m => ({
          name: (m.job as any).name,
          code: (m.job as any).code,
          category: (m.job as any).category,
          sub_category: (m.job as any).sub_category,
          required_skills: (m.job as any).required_skills || [],
          bonus_skills: (m.job as any).bonus_skills || [],
          matchLevel: m.match_level,
          matchScore: m.match_score,
          skillGap: m.skill_gap || [],
          note: m.note,
          salary_range: (m.job as any).salary_range,
          job_count: (m.job as any).job_count,
        }));

      // 按 match_score 降序
      recommendations.sort((a, b) => b.matchScore - a.matchScore);

      // 如果请求 related，只返回 near + cross
      let filtered = recommendations;
      if (type === 'related') {
        filtered = recommendations.filter(r => r.matchLevel === 'near' || r.matchLevel === 'cross');
      } else if (type === 'direct') {
        filtered = recommendations.filter(r => r.matchLevel === 'direct');
      } else if (type === 'near') {
        filtered = recommendations.filter(r => r.matchLevel === 'near');
      } else if (type === 'cross') {
        filtered = recommendations.filter(r => r.matchLevel === 'cross');
      }

      return NextResponse.json({
        success: true,
        data: {
          major: primaryMajor,
          recommendations: filtered,
          total: recommendations.length,
          source: 'supabase',
        },
      });
    }

    // 情况2：按岗位名反向查找关联专业
    if (job) {
      const { data: matchedJobs, error: jobError } = await supabase
        .from('jobs')
        .select('code, name, category, sub_category, required_skills')
        .ilike('name', `%${job}%`)
        .limit(5);

      if (jobError) throw jobError;

      if (!matchedJobs || matchedJobs.length === 0) {
        return NextResponse.json({
          success: false,
          error: '未找到该岗位',
        }, { status: 404 });
      }

      const primaryJob = matchedJobs[0];

      // 查询关联该岗位的专业
      const { data: mappings, error: mapError } = await supabase
        .from('major_job_mapping')
        .select(`
          match_level,
          match_score,
          skill_gap,
          major:majors!major_code (
            code,
            name,
            category,
            sub_category
          )
        `)
        .eq('job_code', primaryJob.code)
        .order('match_score', { ascending: false });

      if (mapError) throw mapError;

      return NextResponse.json({
        success: true,
        data: {
          job: primaryJob,
          relatedMajors: (mappings || [])
            .filter(m => m.major)
            .map(m => ({
              name: (m.major as any).name,
              code: (m.major as any).code,
              category: (m.major as any).category,
              matchLevel: m.match_level,
              matchScore: m.match_score,
              skillGap: m.skill_gap || [],
            })),
          source: 'supabase',
        },
      });
    }

    // 无参数：返回所有专业列表
    const { data: allMajors, error: allError } = await supabase
      .from('majors')
      .select('code, name, category, sub_category')
      .order('category')
      .order('name');

    if (allError) throw allError;

    return NextResponse.json({
      success: true,
      data: {
        majors: allMajors || [],
        total: allMajors?.length || 0,
        source: 'supabase',
      },
    });

  } catch (error: any) {
    console.error('[major-mapping API error]', error);
    return NextResponse.json({
      success: false,
      error: error.message || '服务器错误',
    }, { status: 500 });
  }
}

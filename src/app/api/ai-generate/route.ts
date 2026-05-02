import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  RESUME_VERSIONS,
  type ResumeVersionId,
} from '@/lib/resume-prompts';

interface RewriteRequest {
  resume: any;
  versionId: ResumeVersionId;
  targetRole?: string;
  jdAnalysis?: {
    matchedKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
  };
}

// 从 Supabase 拉取行业关键词
async function fetchIndustryKeywords(industry: string) {
  try {
    const { data, error } = await supabase
      .from('industry_keywords')
      .select('keyword, keyword_type')
      .eq('industry', industry)
      .order('frequency', { ascending: false })
      .limit(60);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

// 从 Supabase 拉取 STAR 模板
async function fetchStarTemplates(industry: string, dimension?: string) {
  try {
    let query = supabase
      .from('star_templates')
      .select('*')
      .eq('industry', industry)
      .order('usage_count', { ascending: false })
      .limit(8);

    if (dimension) {
      query = query.eq('dimension', dimension);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

// 从求职目标推断行业
function inferIndustry(targetRole: string): string {
  const role = targetRole.toLowerCase();
  if (/前端|后端|全栈|算法|测试|运维|DevOps|架构|java|python|react|vue|node\.?js|golang|go|php/i.test(role)) return '互联网';
  if (/产品|运营|增长|用户|内容|活动|投放|社群/i.test(role)) return '互联网';
  if (/银行|证券|基金|保险|风控|量化|信托|资管|财务|CFA|CPA/i.test(role)) return '金融';
  if (/医生|护士|临床|医学|药学|生物|CRA|医学经理|NMPA/i.test(role)) return '医疗';
  if (/教师|课程|教学|培训|留学|教务|课程设计/i.test(role)) return '教育';
  if (/市场|品牌|BD|商务|销售|渠道|招商/i.test(role)) return '快消';
  if (/HR|人力|招聘|培训|员工关系|绩效考核/i.test(role)) return '人力资源';
  if (/机械|电气|自动化|PLC|嵌入式|工艺|ME|PE/i.test(role)) return '制造业';
  return '互联网';
}

// AI改写API - 支持6个版本，注入行业关键词和STAR模板
export async function POST(req: NextRequest) {
  try {
    const body: RewriteRequest = await req.json();
    const { resume, versionId = 'internet', targetRole, jdAnalysis } = body;

    const versionConfig = RESUME_VERSIONS[versionId];
    if (!versionConfig) {
      return NextResponse.json({ error: '无效的版本ID' }, { status: 400 });
    }

    const profile = resume?.profile || {};
    const role = targetRole || profile.titles?.default || '前端开发工程师';
    const industry = inferIndustry(role);

    // 并发拉取关键词和STAR模板
    const [keywords, starTemplates] = await Promise.all([
      fetchIndustryKeywords(industry),
      fetchStarTemplates(industry),
    ]);

    // 构造关键词注入文本
    const techKeywords = keywords
      .filter(k => k.keyword_type === 'tech')
      .map(k => k.keyword)
      .slice(0, 20);

    const softKeywords = keywords
      .filter(k => k.keyword_type === 'soft')
      .map(k => k.keyword)
      .slice(0, 10);

    const quantKeywords = keywords
      .filter(k => k.keyword_type === 'quant')
      .map(k => k.keyword)
      .slice(0, 10);

    // 构造STAR模板参考
    const starExamples = starTemplates.length > 0
      ? starTemplates.map(t => `【${t.dimension}】${t.example_verbatim || `${t.situation ? '背景：' + t.situation + '；' : ''}行动：${t.action}；结果：${t.result}`}`).join('\n')
      : '';

    const systemPrompt = `你是一位资深简历优化顾问，专门帮助中国应届生撰写求职简历。
你了解国内各类企业（互联网/国企/外企/金融/事业单位/私企）的招聘偏好。
写作原则：STAR法则、量化数据、动词开头、简洁有力。
每次输出必须是合法的JSON格式，不要输出额外说明。`;

    const userPrompt = `请帮我优化这份简历，目标是${versionConfig.description}方向。

【简历优化参考资料】

${techKeywords.length > 0 ? `【${industry}行业技术关键词】（优先使用）\n${techKeywords.join('、')}\n` : ''}
${softKeywords.length > 0 ? `【${industry}行业软技能关键词】\n${softKeywords.join('、')}\n` : ''}
${quantKeywords.length > 0 ? `【${industry}行业量化指标关键词】\n${quantKeywords.join('、')}\n` : ''}
${starExamples ? `【STAR表达参考】（借鉴结构，不要照抄内容）\n${starExamples}\n` : ''}

${jdAnalysis?.missingKeywords?.length ? `【目标JD缺失关键词 - 必须覆盖】\n已有：${jdAnalysis.matchedKeywords.join('、')}\n缺失（优先在经历中覆盖）：${jdAnalysis.missingKeywords.join('、')}\n` : ''}

【用户简历内容】
基本信息：
- 姓名：${profile.name || '未知'}
- 求职目标：${role}
- 个人简介：${profile.summary || '未填写'}

工作经历：
${JSON.stringify(resume?.work || [], null, 2)}

项目经历：
${JSON.stringify(resume?.projects || [], null, 2)}

技能：
${JSON.stringify(resume?.skills || [], null, 2)}

教育背景：
${JSON.stringify(resume?.education || [], null, 2)}

【优化要求】
1. 输出完整优化后的简历JSON
2. 所有字段遵循JSON Resume标准
3. 工作经历和项目经历必须包含量化数据
4. 优先在经历描述中使用【简历优化参考资料】中的行业关键词
5. JD缺失关键词必须被覆盖
6. 直接输出JSON，不要任何额外说明文字`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `API错误: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(clean);
      return NextResponse.json({
        success: true,
        versionId,
        versionName: versionConfig.name,
        data: result,
        meta: {
          industry,
          keywordsUsed: techKeywords.length + softKeywords.length + quantKeywords.length,
          starTemplatesUsed: starTemplates.length,
        },
      });
    } catch {
      return NextResponse.json({
        success: false,
        versionId,
        versionName: versionConfig.name,
        error: 'JSON解析失败',
        raw: content,
      }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '未知错误' }, { status: 500 });
  }
}

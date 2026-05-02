import { NextRequest, NextResponse } from 'next/server';
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

// AI改写API - 支持6个版本
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

    const systemPrompt = `你是一位资深简历优化顾问，专门帮助中国应届生撰写求职简历。
你了解国内各类企业（互联网/国企/外企/金融/事业单位/私企）的招聘偏好。
写作原则：STAR法则、量化数据、动词开头、简洁有力。
每次输出必须是合法的JSON格式，不要输出额外说明。`;

    const userPrompt = `请帮我优化这份简历，目标是${versionConfig.description}方向。

${jdAnalysis?.missingKeywords?.length ? `【目标JD关键词 - 必须使用】\n已匹配：${jdAnalysis.matchedKeywords.join('、')}\n缺失（必须优先覆盖）：${jdAnalysis.missingKeywords.join('、')}\n\n说明：每条工作/项目经历的描述中，必须包含至少一个缺失关键词。\n` : ''}
用户基本信息：
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

请严格按照以下版本要求优化：
${versionConfig.prompt}

要求：
1. 输出完整优化后的简历JSON
2. 所有字段遵循JSON Resume标准
3. 工作经历和项目经历必须包含量化数据
4. 直接输出JSON，不要任何额外说明文字`;

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

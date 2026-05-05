import { NextRequest, NextResponse } from 'next/server';

export interface CoverLetterRequest {
  name: string;
  targetCompany: string;
  targetPosition: string;
  style: 'formal' | 'friendly' | 'concise';
  selectedWork: string[];
  selectedProjects: string[];
  selectedEducation: string;
  skills: string;
  profile?: string;
}

const STYLE_PROMPTS = {
  formal: {
    system: `你是一位资深HR顾问，擅长撰写正式、专业的求职信。
写作风格：正式商务，语气诚恳但不卑微，用词精准，行文严谨。
结构：称呼 → 第一段（我是谁+我要应聘什么岗位+如何得知）→ 第二段（核心优势，对应岗位要求）→ 第三段（引用经历数据）→ 结尾（期待面试邀请）。
要求：400-500字，禁止口语化表达，禁止使用"小女子"等不正式用语，禁止感叹号结尾。`,
    temperature: 0.5,
  },
  friendly: {
    system: `你是一位热情友好的HR朋友，擅长撰写有温度的求职信。
写作风格：热情友好但不失专业，语气轻松，表达真诚的热情和对公司的了解。
结构：称呼 → 第一段（开门见山表达热情+我是谁+岗位）→ 第二段（为什么选这家公司+我能带来什么）→ 第三段（用经历讲故事）→ 结尾（很期待面聊！）。
要求：400-500字，可以适当口语化但不要过度，保持真诚，避免套话。`,
    temperature: 0.7,
  },
  concise: {
    system: `你是一位高效的职业顾问，擅长撰写简洁有力的求职信。
写作风格：简洁有力，开门见山，每句话都有信息量，不废话。
结构：称呼 → 第一段（3句话内交代我是谁+岗位+核心亮点）→ 第二段（1-2个最匹配的经历+量化数据）→ 结尾（简短有力地请求面试）。
要求：300-400字，越精炼越好，宁可少说不要多说，拒绝凑字数。`,
    temperature: 0.5,
  },
};

async function callDeepseek(messages: { role: string; content: string }[], temperature: number): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'sk-36f9180fc2244c4faf7914bf8909586f'}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 1200,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepseek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(req: NextRequest) {
  try {
    const body: CoverLetterRequest = await req.json();
    const { name, targetCompany, targetPosition, style, selectedWork, selectedProjects, selectedEducation, skills, profile } = body;

    if (!targetCompany.trim() || !targetPosition.trim()) {
      return NextResponse.json({ error: '请填写目标公司和岗位' }, { status: 400 });
    }

    if (!['formal', 'friendly', 'concise'].includes(style)) {
      return NextResponse.json({ error: '无效的风格类型' }, { status: 400 });
    }

    const styleConfig = STYLE_PROMPTS[style];

    // 构建引用内容摘要
    const references: string[] = [];
    if (selectedWork.length > 0) {
      references.push(`【工作/实习经历】\n${selectedWork.join('\n')}`);
    }
    if (selectedProjects.length > 0) {
      references.push(`【项目经历】\n${selectedProjects.join('\n')}`);
    }
    if (selectedEducation) {
      references.push(`【教育背景】\n${selectedEducation}`);
    }

    const referenceText = references.length > 0
      ? `\n\n【可引用的简历内容】\n${references.join('\n\n')}`
      : '';

    const userPrompt = `请为以下信息撰写一封求职信：

【候选人】${name || '（未填写姓名）'}
【目标公司】${targetCompany}
【目标岗位】${targetPosition}
【个人技能】${skills || '未填写'}
【个人简介/求职目标】${profile || '未填写'}
${referenceText}

要求：
1. 根据所选风格（${style === 'formal' ? '正式商务' : style === 'friendly' ? '热情友好' : '简洁有力'}）撰写
2. 开头要个性化提到目标公司，不要写成通用模板
3. 引用简历中的具体经历和数据，不要虚构
4. 结尾引导面试邀请，语气自然
5. 直接输出求职信正文，不需要任何前缀说明，不要用代码块包裹`;

    const content = await callDeepseek([
      { role: 'system', content: styleConfig.system },
      { role: 'user', content: userPrompt },
    ], styleConfig.temperature);

    return NextResponse.json({
      success: true,
      content: content.trim(),
      style,
      targetCompany,
      targetPosition,
    });
  } catch (err: any) {
    console.error('Cover letter generation error:', err);
    return NextResponse.json({ error: err.message || '生成失败，请稍后重试' }, { status: 500 });
  }
}

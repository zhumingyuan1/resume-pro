import { NextRequest, NextResponse } from 'next/server';

interface GuidedWriteRequest {
  type: 'work' | 'project' | 'summary' | 'extract';
  /** 用户的原始回答（口语化） */
  answers?: string[];
  /** type=extract 时使用：直接传入大白话 */
  rawText?: string;
  /** 如果有 JD 分析，一并传入以保证关键词命中 */
  jdAnalysis?: {
    matchedKeywords: string[];
    missingKeywords: string[];
  };
}

// 根据类型返回引导问题
function getQuestions(type: 'work' | 'project' | 'summary') {
  if (type === 'work') {
    return [
      '你在这家公司/实习的具体岗位是什么？大概做了多久？',
      '你做过的最有成就感的一件事是什么？具体是怎么做的？结果怎么样？',
      '工作中有没有用过什么技术栈或工具？哪怕是 Excel、微信排版也算。',
    ];
  }
  if (type === 'project') {
    return [
      '这个项目是课程/比赛/自学/还是实习里做的？背景是什么？',
      '你在项目里具体负责了什么？最有技术含量的部分是哪个？',
      '项目的结果怎么样？有没有什么可量化的成果（获奖/上线/性能提升/用户量等）？',
    ];
  }
  return [
    '你的专业是什么？大概有什么样的技术背景？',
    '最有成就感的一件事是什么？哪怕不是技术相关的也行。',
    '你对未来的工作有什么期待？想去什么样的团队或方向？',
  ];
}

// 把用户口语翻译成简历内容
async function translateToResume(
  type: 'work' | 'project' | 'summary',
  answers: string[],
  jdAnalysis?: { matchedKeywords: string[]; missingKeywords: string[] }
): Promise<string> {
  const jdHint = jdAnalysis?.missingKeywords?.length
    ? `\n【必须包含的关键词】:${jdAnalysis.missingKeywords.slice(0, 5).join('、')}。如果用户经历中没有这些内容，请如实描述，不要捏造。`
    : '';

  const typeInstruction = {
    work: '请将用户的口语回答改写为一段专业的简历工作经历描述。要求：STAR法则（情境-任务-行动-结果），包含量化数据（如果没有真实数据则标注"[待补充]），动词开头，2-4句话。禁止套话"负责XX工作"。',
    project: '请将用户的口语回答改写为一段专业的简历项目经历描述。要求：STAR法则，包含技术栈名称和量化结果，2-4句话。禁止"参与XX开发"这种被动句式。',
    summary: '请将用户的口语回答整合为一段2-4句的个人简介。要求：成果导向，体现能力和背景，第一句写身份定位，最后一句写目标。',
  }[type];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一位资深简历顾问，擅长通过对话引导用户挖掘经历，并把口语翻译成专业的简历语言。${typeInstruction}${jdHint}`,
        },
        {
          role: 'user',
          content: `用户回答：\n${answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 从大白话中提取结构化信息
async function extractFromRawText(rawText: string): Promise<any> {
  const prompt = `你是一个经历信息提取器。用户用大白话描述了一段经历，请从中提取结构化信息。

直接输出合法JSON，不要任何前缀说明，格式如下：
{
  "type": "job" | "project" | "campus",
  "companyOrProject": "公司/项目名称（如果从描述中能提取的话）",
  "positionOrRole": "岗位/角色",
  "timeRange": "时间范围，例如 2024.03-2024.06",
  "highlights": ["从经历中提炼出的STAR描述1", "描述2"],
  "technologies": ["识别到的技术栈"],
  "confidence": 0.0到1.0之间的置信度
}

分析这段经历：
"${rawText}"

规则：
- type判断：提到实习/工作/全职/兼职/公司名→job；提到课程设计/比赛/开源/side project→project；其他（学生会/社团/志愿等）→campus
- 如果描述中没有提到公司名或项目名，companyOrProject填"（待填写）"
- timeRange如果描述中没提到，填""
- highlights至少返回1条，长度控制在30-60字以内
- technologies如果没有识别到，返回空数组[]

直接输出JSON：`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一个结构化信息提取器，输出合法的JSON格式，不要输出任何解释。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // 解析失败，返回 null
  }
  return null;
}

// 评估经历对 JD 的覆盖度
function assessJdCoverage(
  content: string,
  jdAnalysis?: { matchedKeywords: string[]; missingKeywords: string[] }
) {
  if (!jdAnalysis?.missingKeywords?.length) return null;
  const covered = jdAnalysis.missingKeywords.filter(k => content.includes(k));
  const coverage = Math.round((covered.length / jdAnalysis.missingKeywords.length) * 100);
  return {
    coverage,
    coveredKeywords: covered,
    remainingKeywords: jdAnalysis.missingKeywords.filter(k => !covered.includes(k)),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: GuidedWriteRequest = await req.json();
    const { type, answers, rawText } = body;

    // extract 模式：从大白话直接提取结构化信息
    if (type === 'extract') {
      if (!rawText?.trim()) {
        return NextResponse.json({ error: '请输入经历描述' }, { status: 400 });
      }
      const data = await extractFromRawText(rawText.trim());
      if (!data) {
        return NextResponse.json({ success: false, error: 'AI解析失败，请重试' }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        type: 'extract',
        data: {
          type: data.type || 'job',
          companyOrProject: data.companyOrProject || '',
          positionOrRole: data.positionOrRole || '',
          timeRange: data.timeRange || '',
          highlights: Array.isArray(data.highlights) ? data.highlights : [rawText.trim()],
          technologies: Array.isArray(data.technologies) ? data.technologies : [],
        },
      });
    }

    // 原有模式
    if (!['work', 'project', 'summary'].includes(type)) {
      return NextResponse.json({ error: '无效的类型' }, { status: 400 });
    }
    if (!answers?.length) {
      return NextResponse.json({ error: '请至少回答一个问题' }, { status: 400 });
    }

    const jdAnalysis = body.jdAnalysis;
    const [generated, jdCoverage] = await Promise.all([
      translateToResume(type as 'work' | 'project' | 'summary', answers, jdAnalysis),
      Promise.resolve(assessJdCoverage(answers.join(' '), jdAnalysis)),
    ]);

    return NextResponse.json({
      success: true,
      type,
      generated: generated.trim(),
      jdCoverage,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '未知错误' }, { status: 500 });
  }
}

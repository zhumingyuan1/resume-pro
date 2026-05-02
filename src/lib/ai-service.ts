// AI 生成简历服务 - 使用 Deepseek API

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-36f9180fc2244c4faf7914bf8909586f';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 系统 Prompt
const SYSTEM_PROMPT = `你是一位资深 HR 顾问，专门帮助中国应届生撰写求职简历。
你了解国内互联网/金融/咨询等行业的招聘偏好。
写作原则：
1) STAR法则（情境-任务-行动-结果）
2) 每条工作/实习经历至少包含一个可量化数据
3) 动词开头（负责/主导/优化/设计/实现）
4) 简洁有力，避免套话
5) 应届生经历少，重点突出校内项目/实习/竞赛`;

export interface GenerateRequest {
  name: string;
  school?: string;
  major?: string;
  gpa?: string;
  targetPosition: string;
  targetCompanyType: '大厂' | '外企' | '创业公司' | '国企';
  workExperience?: string;
  projectExperience?: string;
  skills?: string;
  education?: string;
}

export interface GenerateResult {
  summary: string;
  workHighights: string[];
  projectHighlights: string[];
  suggestions: string[];
}

// 调用 Deepseek API
async function callDeepseek(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Deepseek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 生成简历内容
export async function generateResume(request: GenerateRequest): Promise<GenerateResult> {
  const userPrompt = `请为以下信息生成简历内容，直接输出 JSON 格式，不要输出额外说明：

{
  "summary": "个人简介，100字左右",
  "workHighights": ["经历1", "经历2", "经历3"],
  "projectHighlights": ["项目1", "项目2"],
  "suggestions": ["建议1", "建议2"]
}

基本信息：
- 姓名：${request.name}
- 学校：${request.school || '未填写'}
- 专业：${request.major || '未填写'}
- GPA：${request.gpa || '未填写'}
- 目标岗位：${request.targetPosition}
- 目标公司类型：${request.targetCompanyType}
- 工作/实习经历：${request.workExperience || '暂无'}
- 项目经历：${request.projectExperience || '暂无'}
- 技能：${request.skills || '未填写'}
- 教育背景：${request.education || '未填写'}`;

  try {
    const content = await callDeepseek([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        summary: result.summary || '',
        workHighights: result.workHighights || [],
        projectHighlights: result.projectHighlights || [],
        suggestions: result.suggestions || [],
      };
    }

    // JSON 解析失败，返回原始内容
    return {
      summary: content.slice(0, 200),
      workHighights: [content.slice(0, 100)],
      projectHighlights: [],
      suggestions: [],
    };
  } catch (err) {
    console.error('AI generation error:', err);
    throw err;
  }
}

// 改写简历为三个版本
export interface RewriteResult {
  version: 'default' | 'foreign' | 'startup';
  title: string;
  summary: string;
  workHighights: string[];
}

const VERSION_PROMPTS = {
  default: `强调规模感（百万级用户/千万级数据）、技术深度、团队协作，项目中使用的技术栈，使用行业专业术语。格式要求：每条经历用 STAR 法则，2-3句话，包含量化数据。`,
  foreign: `使用成果导向（impact/outcome）描述，突出独立工作能力，强调跨文化沟通、英语能力、国际化视野，部分专业术语用英文表示（如 A/B Testing, Growth Hacking）。语气专业但不死板。`,
  startup: `强调全栈能力和快速学习，突出主人翁意识（"独立负责"而非"参与"），强调在有限资源下的创造力，弱化团队规模。突出学习能力和成长性。`,
};

export async function rewriteResume(
  originalContent: string,
  version: 'default' | 'foreign' | 'startup'
): Promise<RewriteResult> {
  const prompt = `请将以下简历内容改写为${version === 'default' ? '大厂版' : version === 'foreign' ? '外企版' : '创业公司版'}：

要求：${VERSION_PROMPTS[version]}

直接输出 JSON 格式：
{
  "title": "改写后的求职目标",
  "summary": "改写后的个人简介",
  "workHighights": ["改写后的经历1", "改写后的经历2"]
}

原始内容：
${originalContent}`;

  try {
    const content = await callDeepseek([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        version,
        title: result.title || '',
        summary: result.summary || '',
        workHighights: result.workHighights || [],
      };
    }

    return {
      version,
      title: originalContent.slice(0, 50),
      summary: content.slice(0, 200),
      workHighights: [],
    };
  } catch (err) {
    console.error('AI rewrite error:', err);
    throw err;
  }
}

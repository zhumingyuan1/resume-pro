import { NextRequest, NextResponse } from 'next/server';

interface InterviewPredictRequest {
  position: string;
  company?: string;
  companyType?: string;
  interviewType: string;
  resumeSummary: string;
}

interface PredictedQuestion {
  id: string;
  type: '技术' | '业务' | '经历' | '场景' | '管理' | '动机';
  question: string;
  difficulty: 1 | 2 | 3;
  answer: string;
}

// 根据岗位关键字判断岗位类型
function classifyPosition(position: string): 'tech' | 'product' | 'management' | 'design' {
  const p = position.toLowerCase();
  if (/前端|后端|全栈|算法|测试|运维|DevOps|架构|Java|Python|Go|Node|React|Vue|数据|研发|开发/i.test(p)) return 'tech';
  if (/产品|运营|增长|用户|内容|活动|投放|社群|商务|销售/i.test(p)) return 'product';
  if (/主管|经理|总监|负责人|VP|Chief|Head/i.test(p)) return 'management';
  if (/设计|UI|UX|交互|视觉|平面/i.test(p)) return 'design';
  return 'tech';
}

// 生成题目库
function generateQuestions(
  positionType: ReturnType<typeof classifyPosition>,
  interviewType: string,
  resumeSummary: string,
  companyType: string,
): PredictedQuestion[] {
  const q: PredictedQuestion[] = [];

  const baseQuestions: Record<string, { question: string; type: PredictedQuestion['type']; difficulty: 1 | 2 | 3; answer: string }[]> = {
    tech: [
      {
        question: '请介绍一下你在最近项目中承担的角色和主要贡献？',
        type: '经历',
        difficulty: 1,
        answer: `【Situation】在我最近的XX项目中，我担任前端开发工程师，主要负责用户增长模块的开发。

【Task】团队需要在2周内完成登录页重构，我负责其中React组件开发和性能优化部分。

【Action】我使用React Query做数据缓存，优化了接口调用策略；同时重构了表单验证逻辑，统一使用自定义Hook管理。

【Result】最终将页面加载时间从2秒降至300毫秒，用户转化率提升约18%。`,

      },
      {
        question: '你最近项目中遇到的最大技术挑战是什么？怎么解决的？',
        type: '技术',
        difficulty: 2,
        answer: `【Situation】在XX项目中，我们遇到浏览器兼容性问题导致部分用户无法正常使用。

【Task】需要快速定位并解决IE11及Safari浏览器的兼容性问题。

【Action】我首先通过用户日志分析出问题的浏览器版本，然后逐一排查，发现是CSS Grid和某些ES6+语法导致的。使用了Babel polyfill和CSS Grid的Flexbox降级方案。

【Result】兼容性问题解决后，相关用户的技术支持工单减少了85%。`,

      },
      {
        question: '你能聊聊你对这本岗位的理解吗？为什么你觉得你适合这个岗位？',
        type: '动机',
        difficulty: 1,
        answer: `【理解】我认为这个岗位需要具备扎实的XX技术能力和项目经验，能够独立完成模块开发并与团队高效协作。

【匹配】根据我的经验，我在XX公司实习期间做的XX项目与贵司的XX业务高度相关。我熟练掌握React、TypeScript等核心技术，也具备良好的沟通能力和学习能力。

【热情】我对贵司的产品和文化非常认同，希望能在这个岗位上持续深耕。`,

      },
      {
        question: '系统设计：如果让你设计一个高并发的短链接系统，你会怎么考虑？',
        type: '技术',
        difficulty: 3,
        answer: `【核心需求】需要支持每日亿级短链接生成，支持千万级PV读取，延迟&lt;10ms。

【整体架构】采用分层设计：CDN+负载均衡 → API网关 → Redis集群 → 数据库。

【存储选型】Redis Cluster做缓存层（热点数据），MySQL做持久化存储（分库分表）。

【算法设计】使用哈希算法将长链接映射为短码，结合Redis SETNX保证唯一性。布隆过滤器过滤已存在的短码，减少数据库查询。

【容灾】多机房部署，主备自动切换。`,

      },
      {
        question: '你有遇到过和同事在技术方案上产生分歧的情况吗？怎么处理的？',
        type: '经历',
        difficulty: 2,
        answer: `【Situation】在XX项目中，我和同事在技术选型上产生了分歧——他想用jQuery，我认为应该上Vue3。

【分析】我们分别列出了自己方案的优势和劣势，从团队学习成本、项目时间线、长期维护成本三个维度评估。

【行动】最终我们邀请了Tech Lead参与讨论，用数据（社区活跃度、生态完善度）说话，并达成了共识：先上Vue3，同时安排内部培训。

【Result】项目后期新功能开发效率提升了约40%，同事也认可了这个技术升级。`,

      },
      {
        question: '你有什么想问我的吗？',
        type: '场景',
        difficulty: 1,
        answer: `谢谢您的提问！我有几个问题想了解：

1. 这个岗位日常面临的最大挑战是什么？团队目前最需要解决的技术问题是什么？

2. 团队的技术栈和技术氛围如何？有没有定期的技术分享或Code Review机制？

3. 公司对这个岗位的期望是什么？试用期内的考核标准是什么？

这些信息对我了解岗位很有帮助，谢谢！`,

      },
      {
        question: '你最近有在学习什么新技术？能分享一下吗？',
        type: '业务',
        difficulty: 2,
        answer: `【技术学习】最近在系统学习前端工程化相关的内容，包括Webpack/Vite的底层原理、微前端架构设计。

【学习方式】主要通过官方文档、源码阅读以及参与开源项目来学习。每周会写技术博客总结学习心得。

【实践应用】尝试将学到的Monorepo思路应用到个人项目中，显著提升了多项目协作效率。

【兴趣点】对AI辅助编程工具（如Copilot）也很关注，在探索如何将其融入日常开发流程。`,

      },
    ],
    product: [
      {
        question: '请用STAR法则介绍一下你最成功的一个项目？',
        type: '经历',
        difficulty: 1,
        answer: `【Situation】我负责的XX产品当时面临DAU增长停滞的问题，团队希望找到一个突破口。

【Task】我通过用户调研和数据分析，发现用户流失主要发生在新手引导阶段。

【Action】我主导设计了新的引导流程，优化了核心功能的展示逻辑，并协调开发和设计资源在2周内上线了A/B测试版本。

【Result】新版本上线后，新用户7日留存率提升了22%，DAU环比增长15%。`,

      },
      {
        question: '如果让你从零开始做一个新产品，你会怎么开展第一步工作？',
        type: '场景',
        difficulty: 2,
        answer: `【第一步：用户洞察】我会先做用户调研，了解目标用户的核心痛点和现有解决方案的不足。

【第二步：竞品分析】深入研究3-5个竞品，了解它们的优劣势，找到差异化切入点。

【第三步：需求优先级】用Kano模型或RICE评分对需求进行排序，确定MVP范围。

【第四步：跨部门对齐】和技术、设计、运营团队对齐，确保方案可落地。

【关键点】产品经理的核心是"取舍"，要敢于砍需求，聚焦核心价值。`,

      },
      {
        question: '你如何衡量一个功能上线后的成功与否？',
        type: '业务',
        difficulty: 2,
        answer: `【北极星指标】首先确定该功能对应的北极星指标，如留存率、转化率、GMV等。

【数据埋点】上线前完成核心指标埋点，设计数据看板。

【效果评估】从三个维度评估：1)数据是否达到预设目标 2)用户体验是否有正向影响 3)长期价值如何。

【复盘机制】建立两周/一月的复盘机制，收集用户反馈，为迭代提供依据。

【案例】之前做的登录优化功能，通过数据发现转化率提升15%，同时客服工单下降30%。`,

      },
      {
        question: '你为什么想离开现在的公司？/为什么想申请这个岗位？',
        type: '动机',
        difficulty: 1,
        answer: `【离职原因】目前公司的业务已趋稳定，我希望能接触更大规模的C端产品，挑战更高的增长目标。贵司的产品影响力和技术氛围非常吸引我。

【为什么是这家】我非常看好贵司的XX业务方向，这与我的职业规划高度契合。我过去的XX经验与这个岗位的要求非常匹配，希望能在这里发挥我的专长。

【职业规划】希望未来2-3年能成长为独当一面的产品经理，带更大的项目。`,

      },
      {
        question: '你和开发/设计团队出现分歧时怎么协调？',
        type: '经历',
        difficulty: 2,
        answer: `【分歧场景】之前和开发同学在需求优先级上有过分歧，我认为A功能更重要，开发觉得B功能更紧急。

【处理方式】1) 数据说话：拿出用户调研数据和预期收益来说服对方；2) 换位思考：了解开发同学的顾虑，协商折中方案；3) 引入上级：必要时请PMO或Tech Lead参与决策。

【结果】最终达成共识，先做A功能，但给B功能留出排期。大家都接受了决策，对执行没有影响。`,

      },
      {
        question: '你有什么想问我的吗？',
        type: '场景',
        difficulty: 1,
        answer: `谢谢您的提问！我有几个问题想了解：

1. 这个岗位负责的产品目前处于什么阶段？短期和中期的目标分别是什么？

2. 产品团队的配置是怎样的？日常工作是怎么协作的？

3. 对这个岗位的候选人最看重的特质是什么？

这些问题对我判断岗位匹配度很有帮助，谢谢！`,

      },
    ],
    management: [
      {
        question: '请介绍一下你带团队的经验，团队规模和结构是怎样的？',
        type: '经历',
        difficulty: 1,
        answer: `【团队背景】我目前负责的团队有8人，包括4名前端、2名后端和2名移动端工程师，向我汇报。

【管理方式】我采用OKR和周会结合的方式进行目标管理，每周固定1:1沟通，了解成员的状态和需求。

【培养机制】我会根据每个人的特长制定个人发展计划，每周组织技术分享，营造学习氛围。

【结果】团队稳定性保持在90%以上，核心成员离职率为0。`,

      },
      {
        question: '你怎么处理团队成员的绩效问题或表现不佳的情况？',
        type: '管理',
        difficulty: 3,
        answer: `【发现阶段】首先通过数据（如代码产出、协作反馈）客观了解情况，避免主观偏见。

【沟通阶段】私下与当事人沟通，了解背后的原因——是能力问题、态度问题还是外部因素（如家庭困难）。

【改进计划】如果是能力问题，制定30天改进计划，提供培训和辅导；如果是态度问题，明确期望和后果。

【跟踪与反馈】定期跟进改进效果，如果仍无改善，按公司制度处理，但保持尊重和公平。`,

      },
      {
        question: '你是怎么做年度规划/季度规划的？',
        type: '管理',
        difficulty: 2,
        answer: `【自上而下对齐】先和上级对齐公司级战略目标，确保团队目标与公司方向一致。

【自下而上拆解】收集各成员的输入，结合业务需求和历史数据，拆解出可量化的OKR。

【资源评估】评估现有资源和能力，识别风险点，确保目标可达。

【沟通对齐】向全员宣贯，让每个人知道自己的工作和团队/公司目标的关联。

【回顾迭代】每月回顾OKR完成情况，及时调整策略。`,

      },
      {
        question: '你为什么想申请这个管理岗位？你的管理风格是什么样的？',
        type: '动机',
        difficulty: 1,
        answer: `【动机】我在技术/业务一线深耕了X年，积累了扎实的专业能力，同时也发现自己擅长帮助他人成长。我希望从"个人贡献者"转变为"团队贡献者"，通过团队拿到更大的结果。

【管理风格】我信奉"教练式管理"——给方向但不替下属走路。我会设定清晰的目标，授权而不放权，及时反馈和辅导。

【差异化】我既有专业深度，又能理解业务的全局思维，能够在技术/业务和团队之间做好桥梁。`,

      },
      {
        question: '你在跨部门协作中是怎么推动项目落地的？',
        type: '经历',
        difficulty: 2,
        answer: `【背景】之前主导过一个跨5个部门的产品重构项目，涉及产品、设计、前端、后端、测试。

【拉齐对齐】项目启动前，我会组织Kickoff Meeting，让各方对目标、职责、节点达成共识。

【机制建设】建立项目群+周报机制，用飞书多维表格追踪进度，风险提前预警。

【推动解决】遇到卡点时，快速识别阻塞方，单独沟通或升级协调，不让问题悬而未决。

【结果】项目按时上线，且后续维护成本降低了30%。`,

      },
      {
        question: '你有什么想问我的吗？',
        type: '场景',
        difficulty: 1,
        answer: `谢谢您的提问！我有几个问题想了解：

1. 这个管理岗位向谁汇报？团队目前有多少人？有哪些短期目标需要优先推进？

2. 公司对管理岗的考核标准是什么？试用期内的期待是什么？

3. 团队目前最大的挑战是什么？我能发挥什么价值？

这些问题对我了解岗位和团队很有帮助，谢谢！`,

      },
    ],
    design: [
      {
        question: '请介绍一下你做过的最满意的一个设计作品？',
        type: '经历',
        difficulty: 1,
        answer: `【项目背景】这是我在XX公司做的App首页改版项目。

【设计目标】解决用户找不到核心功能的痛点，提升首页转化率。

【设计过程】通过用户访谈、竞品分析和数据埋点，梳理出信息优先级，设计了新的导航结构和视觉层级。

【结果】新版本上线后，核心功能点击率提升35%，用户满意度评分从3.2提升到4.5。`,

      },
      {
        question: '你如何平衡用户需求和业务需求的关系？',
        type: '业务',
        difficulty: 2,
        answer: `【核心观点】用户需求和业务需求不是对立的，优秀的产品设计应该让两者共赢。

【案例】比如业务要求增加广告位，但会影响用户体验。我的做法是：1) 用数据量化广告对用户体验的影响程度；2) 探索不影响体验的广告形式（如激励视频）；3) 和业务方沟通设定广告量上限。

【结果】最终找到一个双方都能接受的方案，广告收入增长20%的同时，用户投诉率没有上升。`,

      },
      {
        question: '你有遇到过和需求方在设计方向上产生分歧的情况吗？怎么处理的？',
        type: '经历',
        difficulty: 2,
        answer: `【分歧场景】之前业务方希望在活动页加很多促销信息，我觉得会干扰用户决策。

【沟通方式】我没有直接拒绝，而是先做了两版设计方案（一版克制、一版丰富），用A/B测试数据说话。

【结果】数据证明克制版转化率更高，业务方也接受了建议。之后我们建立了设计评审前置机制，减少类似分歧。`,

      },
    ],
  };

  // 根据岗位类型选择题目池
  const pool = baseQuestions[positionType] || baseQuestions.tech;

  // 根据面试类型调整题目
  let filtered = [...pool];

  if (interviewType === 'HR面') {
    filtered = pool.filter(q => q.type === '动机' || q.type === '经历');
  } else if (interviewType === 'Manager面') {
    filtered = pool.filter(q => q.type !== '技术');
    if (filtered.length < 3) filtered = pool;
  }

  return filtered.slice(0, 6).map((q, i) => ({
    id: `q-${i + 1}`,
    type: q.type,
    question: q.question,
    difficulty: q.difficulty,
    answer: q.answer,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body: InterviewPredictRequest = await req.json();
    const { position, company, companyType = '互联网中厂', interviewType, resumeSummary } = body;

    if (!position) {
      return NextResponse.json({ error: '缺少岗位信息' }, { status: 400 });
    }

    const positionType = classifyPosition(position);
    const questions = generateQuestions(positionType, interviewType, resumeSummary, companyType);

    return NextResponse.json({
      success: true,
      position,
      company,
      companyType,
      interviewType,
      positionType,
      questions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '未知错误' }, { status: 500 });
  }
}

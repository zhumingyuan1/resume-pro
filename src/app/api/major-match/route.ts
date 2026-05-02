// 专业-岗位推荐 API
import { NextRequest, NextResponse } from 'next/server';

// 专业→岗位映射数据（简化版，实际应从数据库读取
const MAJOR_JOB_MAPPING: Record<string, {
  direct: { name: string; skills: string[] }[];
  near: { name: string; skills: string[] }[];
  cross: { name: string; skills: string[] }[];
}> = {
  '计算机科学与技术': {
    direct: [
      { name: '前端开发工程师', skills: ['HTML/CSS', 'JavaScript', 'React', 'Vue', 'TypeScript'] },
      { name: '后端开发工程师', skills: ['Java', 'Go', 'Python', 'MySQL', 'Redis'] },
      { name: '软件测试工程师', skills: ['测试理论', 'Selenium', 'Jmeter', 'Postman'] },
      { name: '运维工程师', skills: ['Linux', 'Shell', 'Docker', 'K8s', 'Nginx'] },
      { name: '移动端开发工程师', skills: ['Android', 'iOS', 'Flutter', 'React Native'] },
    ],
    near: [
      { name: '数据分析师', skills: ['SQL', 'Python', 'Pandas', 'Tableau'] },
      { name: '算法工程师', skills: ['Python', '机器学习', '深度学习', 'TensorFlow'] },
      { name: '产品经理', skills: ['PRD', 'Axure', '数据分析', '项目管理'] },
      { name: '技术售前', skills: ['技术方案', '演示', '沟通'] },
    ],
    cross: [
      { name: 'UI设计师', skills: ['Figma', 'Sketch', '配色', '排版'] },
      { name: '新媒体运营', skills: ['文案', '运营', '数据分析'] },
      { name: '商务BD', skills: ['沟通', '谈判', '客户管理'] },
    ],
  },
  '软件工程': {
    direct: [
      { name: '前端开发工程师', skills: ['HTML/CSS', 'JavaScript', 'React', 'Vue'] },
      { name: '后端开发工程师', skills: ['Java', 'Spring Boot', 'MySQL', 'Git'] },
      { name: '软件测试工程师', skills: ['测试用例', '自动化测试', 'Jenkins'] },
      { name: 'QA工程师', skills: ['质量体系', '测试计划', '缺陷管理'] },
    ],
    near: [
      { name: '实施工程师', skills: ['ERP', 'Oracle', '项目管理'] },
      { name: '技术支持工程师', skills: ['远程支持', '问题诊断', '客户培训'] },
      { name: '项目经理', skills: ['项目管理', 'PMP', '沟通协调'] },
    ],
    cross: [
      { name: '产品经理', skills: ['需求分析', 'PRD', 'Axure'] },
      { name: '技术销售', skills: ['解决方案', '商务谈判'] },
    ],
  },
  '数据科学与大数据技术': {
    direct: [
      { name: '数据分析师', skills: ['SQL', 'Python', 'Pandas', 'Tableau', 'Excel'] },
      { name: '大数据开发工程师', skills: ['Hadoop', 'Spark', 'Hive', 'Kafka', 'Flink'] },
      { name: 'BI工程师', skills: ['Tableau', 'Power BI', 'SQL', '数据仓库'] },
      { name: 'ETL工程师', skills: ['SQL', 'Shell', 'Python', 'Kettle'] },
    ],
    near: [
      { name: '算法工程师', skills: ['Python', '机器学习', '深度学习'] },
      { name: '数据产品经理', skills: ['数据分析', '指标体系', '需求管理'] },
      { name: '风控建模工程师', skills: ['逻辑回归', 'Python', 'SQL', '风控规则'] },
    ],
    cross: [
      { name: '商业分析师', skills: ['Excel', 'PPT', '行业分析'] },
      { name: '运营专员', skills: ['数据分析', '运营指标', 'SQL'] },
    ],
  },
  '人工智能': {
    direct: [
      { name: '算法工程师', skills: ['Python', 'TensorFlow', 'PyTorch', '机器学习', '深度学习'] },
      { name: 'NLP工程师', skills: ['NLP', 'LLM', 'Transformer', 'Python'] },
      { name: 'CV工程师', skills: ['计算机视觉', 'OpenCV', '深度学习', 'Python'] },
      { name: 'AI产品经理', skills: ['AI产品', '需求分析', '模型评估'] },
    ],
    near: [
      { name: '数据分析师', skills: ['SQL', 'Python', '机器学习基础'] },
      { name: '大数据开发工程师', skills: ['Hadoop', 'Spark', 'Python'] },
      { name: 'AI售前工程师', skills: ['AI方案', '演示', '技术沟通'] },
    ],
    cross: [
      { name: 'AI培训讲师', skills: ['AI知识', '授课能力', '课程设计'] },
      { name: 'AI解决方案工程师', skills: ['AI行业', '解决方案', '商务'] },
    ],
  },
  '金融学': {
    direct: [
      { name: '银行柜员', skills: ['银行业务', '柜面操作', '服务意识'] },
      { name: '银行客户经理', skills: ['营销', '信贷', '客户关系'] },
      { name: '证券分析师', skills: ['行研', '财务分析', '估值建模'] },
      { name: '基金销售', skills: ['基金产品', '客户开发', '持续营销'] },
    ],
    near: [
      { name: '金融科技产品经理', skills: ['金融', '产品设计', '数据分析'] },
      { name: '风控专员', skills: ['风控模型', '数据分析', '规则引擎'] },
      { name: '量化分析师', skills: ['Python', '量化策略', '金融工程'] },
    ],
    cross: [
      { name: '互联网产品经理', skills: ['产品设计', '数据分析', '用户运营'] },
      { name: '商务BD', skills: ['商务谈判', '客户管理', '资源整合'] },
    ],
  },
  '会计学/财务管理': {
    direct: [
      { name: '会计', skills: ['会计准则', '财务报表', '金蝶/用友'] },
      { name: '审计专员', skills: ['审计理论', 'CPA', '风险评估'] },
      { name: '税务专员', skills: ['税法', '税务筹划', '申报'] },
      { name: '财务专员', skills: ['财务核算', 'Excel', 'SAP'] },
    ],
    near: [
      { name: '金融分析师', skills: ['财务建模', '行研', '估值'] },
      { name: '内控专员', skills: ['内控', '合规', '流程优化'] },
    ],
    cross: [
      { name: '运营专员', skills: ['数据分析', '项目管理'] },
      { name: '商务BD', skills: ['商务谈判', '客户管理'] },
    ],
  },
  '工商管理': {
    direct: [
      { name: '管培生', skills: ['轮岗', '业务理解', '管理基础'] },
      { name: '运营专员', skills: ['运营指标', '项目管理', 'Excel'] },
      { name: '行政专员', skills: ['行政事务', '日程管理', '沟通'] },
      { name: '人力资源专员', skills: ['招聘', '培训', '员工关系'] },
    ],
    near: [
      { name: '产品经理', skills: ['需求分析', 'PRD', '项目管理'] },
      { name: '市场专员', skills: ['市场活动', '策划', '文案'] },
      { name: '供应链专员', skills: ['采购', '仓储', '物流'] },
    ],
    cross: [
      { name: '商务BD', skills: ['商务谈判', '客户管理', '资源整合'] },
      { name: '新媒体运营', skills: ['内容运营', '文案', '活动策划'] },
    ],
  },
  '市场营销': {
    direct: [
      { name: '市场专员', skills: ['市场活动', '策划', '文案', '媒介'] },
      { name: '品牌专员', skills: ['品牌管理', '市场分析', '策划'] },
      { name: 'BD经理', skills: ['商务谈判', '客户开发', '合同'] },
      { name: '渠道专员', skills: ['渠道管理', '经销商', '销售跟进'] },
    ],
    near: [
      { name: '运营专员', skills: ['数据分析', '活动运营', '用户运营'] },
      { name: '产品经理助理', skills: ['协助PRD', '数据分析', '项目管理'] },
      { name: '电商运营', skills: ['电商平台', '数据运营', '推广'] },
    ],
    cross: [
      { name: '客户成功经理', skills: ['客户维护', '续费', '增值服务'] },
      { name: '商务拓展', skills: ['资源整合', '异业合作', '商务谈判'] },
    ],
  },
  '新闻传播学': {
    direct: [
      { name: '新媒体运营', skills: ['内容运营', '文案', '选题策划', '粉丝运营'] },
      { name: '编辑', skills: ['内容编辑', '选题', '审稿', '排版'] },
      { name: '记者', skills: ['采访', '写作', '新闻敏感度'] },
      { name: '编导', skills: ['内容策划', '拍摄统筹', '后期剪辑'] },
    ],
    near: [
      { name: '品牌专员', skills: ['品牌传播', '媒介投放', '文案'] },
      { name: '公关专员', skills: ['媒体关系', '危机公关', '新闻稿'] },
      { name: '内容运营', skills: ['内容矩阵', '选题策划', '数据运营'] },
    ],
    cross: [
      { name: '产品经理', skills: ['需求分析', '产品设计', '项目管理'] },
      { name: '运营专员', skills: ['用户运营', '活动策划', '数据分析'] },
    ],
  },
  '法学': {
    direct: [
      { name: '律师助理', skills: ['法律研究', '文书起草', '案件整理'] },
      { name: '法务专员', skills: ['合同审核', '法律咨询', '合规审查'] },
      { name: '合规专员', skills: ['合规体系', '风险管理', '监管要求'] },
      { name: '知识产权专员', skills: ['专利', '商标', '版权'] },
      { name: '书记员', skills: ['庭审记录', '文书送达', '案卷整理'] },
    ],
    near: [
      { name: '专利工程师', skills: ['专利撰写', '专利检索', '专利分析'] },
      { name: '律师事务所助理', skills: ['法律研究', '尽职调查', '文书'] },
    ],
    cross: [
      { name: '商务BD', skills: ['商务谈判', '合同管理', '客户关系'] },
      { name: '运营专员', skills: ['合规管理', '制度流程'] },
    ],
  },
  '视觉传达设计': {
    direct: [
      { name: '视觉设计师', skills: ['平面设计', '品牌设计', '广告设计'] },
      { name: 'UI设计师', skills: ['UI设计', 'Figma', 'Sketch', '配色'] },
      { name: '插画师', skills: ['商业插画', 'IP形象', '手绘'] },
      { name: '品牌设计师', skills: ['VI设计', 'Logo设计', '品牌规范'] },
    ],
    near: [
      { name: '电商设计师', skills: ['电商视觉', '详情页', '活动页'] },
      { name: '包装设计师', skills: ['包装结构', '印刷工艺', '材料'] },
      { name: '空间设计师', skills: ['展厅设计', '快闪店', '道具设计'] },
    ],
    cross: [
      { name: '产品经理', skills: ['需求分析', '项目管理', '用户体验'] },
      { name: '运营专员', skills: ['视觉运营', '活动策划'] },
    ],
  },
  '英语': {
    direct: [
      { name: '英语老师', skills: ['教学', '口语', '应试'] },
      { name: '翻译', skills: ['笔译', '口译', '专业领域翻译'] },
      { name: '外贸专员', skills: ['外贸函电', '客户开发', '跟单'] },
      { name: '跨境电商运营', skills: ['Amazon', 'eBay', 'Listing优化'] },
    ],
    near: [
      { name: '海外BD', skills: ['跨文化沟通', '商务谈判', '客户管理'] },
      { name: '内容运营', skills: ['内容策划', '文案', '社媒运营'] },
      { name: '英语编辑', skills: ['英文内容', '审校', '润色'] },
    ],
    cross: [
      { name: '项目协调', skills: ['项目管理', '跨部门沟通', '英文邮件'] },
      { name: '海外市场运营', skills: ['海外市场', '本地化', '数据分析'] },
    ],
  },
  '学前教育': {
    direct: [
      { name: '幼儿教师', skills: ['幼儿教学', '游戏设计', '家园沟通'] },
      { name: '幼教课程设计师', skills: ['课程设计', '教材编写', '教学研究'] },
      { name: '教学督导', skills: ['教学质量监控', '教师培训', '课程评估'] },
    ],
    near: [
      { name: '产品经理（教育方向）', skills: ['教育产品', '需求分析', '用户体验'] },
      { name: '内容运营（教育）', skills: ['教育内容', '课程策划', '用户运营'] },
    ],
    cross: [
      { name: '培训专员', skills: ['培训设计', '授课', '效果评估'] },
      { name: '运营专员', skills: ['用户运营', '活动策划'] },
    ],
  },
};

// JD关键词提取
function extractKeywords(jdText: string): { hard: string[]; soft: string[] } {
  const hardPatterns = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'C#',
    'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Django', 'Flask',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'ElasticSearch', 'Kafka',
    'Docker', 'K8s', 'Kubernetes', 'Linux', 'Nginx', 'Apache',
    'AWS', 'Azure', '阿里云', '腾讯云',
    'TensorFlow', 'PyTorch', 'Keras', '机器学习', '深度学习', 'NLP', 'CV',
    'SQL', 'NoSQL', 'GraphQL', 'RESTful', 'API',
    'Git', 'CI/CD', 'Jenkins', 'DevOps',
    'Figma', 'Sketch', 'Axure', 'Adobe', 'Photoshop', 'Illustrator',
    'Axure', 'PRD', '需求分析', '项目管理', 'Scrum', 'Agile',
    '数据分析', 'Excel', 'Tableau', 'Power BI', 'Python',
    '运营', '增长', 'AARRR', 'DAU', 'MAU', '留存', '转化率',
    '营销', '推广', '渠道', '品牌', '文案', '策划',
    '销售', 'BD', '客户', '商务', '谈判', '合同',
    '风控', '合规', '审计', '财务', '会计', '税法',
    '法律', '法学', '律师', '法务', '合规',
    '教学', '培训', '课程', '教育', '老师',
    '设计', 'UI', 'UX', '视觉', '插画', '平面',
  ];

  const softPatterns = [
    '团队协作', '沟通能力', '跨团队', '项目管理', '逻辑思维',
    '结构化思维', '执行力', '自驱力', '学习能力', '抗压能力',
    '责任心', '问题解决', '创新思维', '结果导向', 'owner意识',
    '主动', '细心', '耐心', '服务意识', '保密意识',
  ];

  const jdUpper = jdText.toUpperCase();
  const hard = hardPatterns.filter(k => jdUpper.includes(k.toUpperCase()));
  const soft = softPatterns.filter(k => jdText.includes(k));

  return { hard, soft };
}

// 计算JD匹配度
function calculateMatchScore(jdKeywords: string[], jobSkills: string[]): number {
  if (jdKeywords.length === 0) return 50;
  const matched = jdKeywords.filter(k => 
    jobSkills.some(s => s.toUpperCase().includes(k.toUpperCase()) || k.toUpperCase().includes(s.toUpperCase()))
  );
  return Math.round((matched.length / jdKeywords.length) * 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { major, majorName, jdText, userSkills } = body;

    let result: any = {};

    // 专业推荐
    if (major || majorName) {
      const key = majorName || major;
      const mapping = MAJOR_JOB_MAPPING[key] || MAJOR_JOB_MAPPING['计算机科学与技术'];

      const recommendations = [
        ...mapping.direct.map(j => ({ ...j, matchLevel: 'direct', matchScore: 95 })),
        ...mapping.near.map(j => ({ ...j, matchLevel: 'near', matchScore: 75 })),
        ...mapping.cross.map(j => ({ ...j, matchLevel: 'cross', matchScore: 55 })),
      ];

      // 如果有用户技能，计算精确匹配度
      if (userSkills && userSkills.length > 0) {
        recommendations.forEach(rec => {
          const userSkillNames = userSkills.map((s: any) => s.name);
          const matched = rec.skills.filter((s: string) => 
            userSkillNames.some((us: string) => 
              us.toUpperCase().includes(s.toUpperCase()) || s.toUpperCase().includes(us.toUpperCase()))
          );
          rec.matchScore = Math.round((matched.length / rec.skills.length) * 100);
          (rec as any).skillGap = rec.skills.filter((s: string) => 
            !userSkillNames.some((us: string) => 
              us.toUpperCase().includes(s.toUpperCase()) || s.toUpperCase().includes(us.toUpperCase()))
          );
        });
      }

      result.recommendations = recommendations;
    }

    // JD匹配
    if (jdText) {
      const { hard, soft } = extractKeywords(jdText);
      result.jdAnalysis = {
        keywords: { hard, soft },
      };

      // 匹配所有岗位的得分
      const allJobs = Object.values(MAJOR_JOB_MAPPING).flatMap(m => 
        [...m.direct, ...m.near, ...m.cross]
      );
      const scored = allJobs.map(job => ({
        name: job.name,
        score: calculateMatchScore(hard, job.skills),
        matchedSkills: job.skills.filter(s => 
          hard.some(k => k.toUpperCase().includes(s.toUpperCase()) || s.toUpperCase().includes(k.toUpperCase()))
        ),
      }));
      scored.sort((a, b) => b.score - a.score);

      result.jdAnalysis.topMatches = scored.slice(0, 5);
      result.jdAnalysis.missingKeywords = hard.filter(k => 
        !scored.some(j => 
          j.matchedSkills.some((ms: string) => 
            ms.toUpperCase().includes(k.toUpperCase()) || k.toUpperCase().includes(ms.toUpperCase()))
        )
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

export async function GET() {
  // 返回所有专业列表
  const majors = Object.keys(MAJOR_JOB_MAPPING).map(name => ({ name }));
  return NextResponse.json({ success: true, data: majors });
}

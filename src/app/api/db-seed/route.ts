import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

// 数据统计
export async function GET() {
  const supabase = getAdminClient();

  const [ik, st, rt] = await Promise.all([
    supabase.from('industry_keywords').select('id', { count: 'exact', head: true }),
    supabase.from('star_templates').select('id', { count: 'exact', head: true }),
    supabase.from('resume_templates').select('id', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    keywords: ik.count || 0,
    starTemplates: st.count || 0,
    resumeTemplates: rt.count || 0,
  });
}

// 批量插入初始数据
export async function POST() {
  const supabase = getAdminClient();

  const keywords = [
    // 互联网 tech
    '互联网','React','tech',50,'职位描述统计',
    '互联网','Vue','tech',45,'职位描述统计',
    '互联网','TypeScript','tech',42,'职位描述统计',
    '互联网','Node.js','tech',38,'职位描述统计',
    '互联网','Python','tech',50,'职位描述统计',
    '互联网','Java','tech',50,'职位描述统计',
    '互联网','Go','tech',35,'职位描述统计',
    '互联网','SQL','tech',48,'职位描述统计',
    '互联网','Redis','tech',40,'职位描述统计',
    '互联网','Docker','tech',42,'职位描述统计',
    '互联网','Kubernetes','tech',35,'职位描述统计',
    '互联网','微服务','tech',40,'职位描述统计',
    '互联网','分布式','tech',38,'职位描述统计',
    '互联网','MySQL','tech',48,'职位描述统计',
    '互联网','MongoDB','tech',30,'职位描述统计',
    '互联网','Kafka','tech',28,'职位描述统计',
    '互联网','Spring Boot','tech',40,'职位描述统计',
    '互联网','TensorFlow','tech',22,'职位描述统计',
    '互联网','PyTorch','tech',20,'职位描述统计',
    // 互联网 soft
    '互联网','团队协作','soft',50,'职位描述统计',
    '互联网','沟通能力','soft',48,'职位描述统计',
    '互联网','自驱力','soft',45,'职位描述统计',
    '互联网','学习能力','soft',50,'职位描述统计',
    '互联网','抗压能力','soft',42,'职位描述统计',
    '互联网','责任心','soft',40,'职位描述统计',
    '互联网','项目管理','soft',35,'职位描述统计',
    '互联网','逻辑思维','soft',38,'职位描述统计',
    '互联网','问题解决','soft',45,'职位描述统计',
    '互联网','跨团队协作','soft',30,'职位描述统计',
    // 互联网 quant
    '互联网','QPS','quant',35,'职位描述统计',
    '互联网','DAU','quant',40,'职位描述统计',
    '互联网','MAU','quant',35,'职位描述统计',
    '互联网','日活','quant',42,'职位描述统计',
    '互联网','转化率','quant',38,'职位描述统计',
    '互联网','响应时间','quant',30,'职位描述统计',
    '互联网','性能优化','quant',35,'职位描述统计',
    '互联网','亿级流量','quant',28,'职位描述统计',
    '互联网','弹性扩缩容','quant',25,'职位描述统计',
    '互联网','容灾备份','quant',20,'职位描述统计',
    // 互联网 cert
    '互联网','PMP','cert',20,'职位描述统计',
    '互联网','AWS认证','cert',18,'职位描述统计',
    '互联网','CKA','cert',15,'职位描述统计',
    '互联网','计算机二级','cert',30,'职位描述统计',
    '互联网','软考中级','cert',25,'职位描述统计',
    // 金融
    '金融','Python','tech',48,'职位描述统计',
    '金融','SQL','tech',50,'职位描述统计',
    '金融','Java','tech',45,'职位描述统计',
    '金融','Wind终端','tech',35,'职位描述统计',
    '金融','Bloomberg','tech',28,'职位描述统计',
    '金融','量化策略','tech',30,'职位描述统计',
    '金融','CFA','cert',35,'职位描述统计',
    '金融','CPA','cert',38,'职位描述统计',
    '金融','FRM','cert',25,'职位描述统计',
    '金融','风险控制','soft',45,'职位描述统计',
    '金融','合规意识','soft',40,'职位描述统计',
    '金融','财务分析','soft',42,'职位描述统计',
    '金融','数据敏感度','soft',38,'职位描述统计',
    '金融','逻辑严谨','soft',40,'职位描述统计',
    '金融','年化收益','quant',35,'职位描述统计',
    '金融','资产规模','quant',30,'职位描述统计',
    '金融','回撤控制','quant',28,'职位描述统计',
    '金融','夏普比率','quant',22,'职位描述统计',
    '金融','Alpha','quant',20,'职位描述统计',
    // 医疗
    '医疗','Python','tech',40,'职位描述统计',
    '医疗','数据分析','tech',42,'职位描述统计',
    '医疗','R语言','tech',30,'职位描述统计',
    '医疗','临床试验','tech',35,'职位描述统计',
    '医疗','GCP','cert',30,'职位描述统计',
    '医疗','NMPA','cert',25,'职位描述统计',
    '医疗','医学研究','soft',40,'职位描述统计',
    '医疗','数据解读','soft',38,'职位描述统计',
    '医疗','跨部门沟通','soft',32,'职位描述统计',
    // 教育
    '教育','Python','tech',38,'职位描述统计',
    '教育','数据可视化','tech',35,'职位描述统计',
    '教育','SQL','tech',40,'职位描述统计',
    '教育','教学设计','soft',42,'职位描述统计',
    '教育','课程开发','soft',40,'职位描述统计',
    '教育','沟通表达','soft',45,'职位描述统计',
    '教育','学员服务','soft',38,'职位描述统计',
    '教育','目标导向','soft',40,'职位描述统计',
  ];

  // 分批次插入关键词
  const keywordRows: { industry: string; keyword: string; keyword_type: string; frequency: number; source: string }[] = [];
  for (let i = 0; i < keywords.length; i += 5) {
    keywordRows.push({
      industry: String(keywords[i]),
      keyword: String(keywords[i + 1]),
      keyword_type: String(keywords[i + 2]),
      frequency: Number(keywords[i + 3]),
      source: String(keywords[i + 4]),
    });
  }

  const { error: ikErr } = await supabase.from('industry_keywords').insert(keywordRows);

  // STAR模板
  const { error: stErr } = await supabase.from('star_templates').insert([
    { industry: '互联网', dimension: '性能', situation: '电商大促期间登录接口响应时间过长（2s+）', task: '登录接口响应时间过长', action: '引入Redis缓存，使用HTTP/2压缩，将登录流程从同步改为半异步', result: '登录接口响应时间从2s降至300ms，用户流失率降低15%，双十一支撑峰值QPS 5万', example_verbatim: '主导登录模块重构，响应时间从2s降至300ms，转化率提升18%' },
    { industry: '互联网', dimension: '性能', situation: '内容平台列表页加载慢', task: '用户反馈页面首屏加载超过3秒', action: '对列表接口增加本地缓存，图片懒加载，后端增加数据库索引和连接池复用', result: '首屏加载时间从3.2s降至800ms，用户停留时长提升22%', example_verbatim: '优化内容详情接口，引入CDN缓存，接口响应时间降低60%' },
    { industry: '互联网', dimension: '规模', situation: '用户快速增长，日活从50万增长到200万', task: '现有架构无法支撑用户增长', action: '设计并实现数据库读写分离方案，引入Redis集群，非核心计算异步化', result: '平稳支撑日活200万，系统可用性保持99.95%以上', example_verbatim: '从0到1搭建用户增长平台，支撑DAU从50W增长到200W' },
    { industry: '互联网', dimension: '增长', situation: '新用户转化率低，注册转化率仅3%', task: '注册转化率远低于行业均值8%', action: '通过A/B测试发现落地页问题，优化注册流程（减少1个步骤），新增社交账号登录', result: '注册转化率从3%提升至9%，新增注册用户月增长40%', example_verbatim: '通过简化注册流程+社交登录，转化率从3%提升至9%，拉新成本降低35%' },
    { industry: '互联网', dimension: '团队', situation: '跨部门项目协调困难，延期率50%', task: '产品迭代涉及3个部门，沟通成本高', action: '制定跨团队协作流程，引入项目管理工具（飞书任务），建立周同步机制和里程碑评审', result: '项目交付准时率从50%提升至85%，跨团队沟通时间减少30%', example_verbatim: '主导跨5人团队项目管理系统，交付准时率提升至90%' },
    { industry: '互联网', dimension: '质量', situation: '线上故障频发，平均每周2-3次P2级以上故障', task: '故障恢复时间过长，影响用户体验', action: '建立灰度发布机制，引入自动化回归测试，编写故障响应SOP', result: '故障率降低70%，P2故障恢复时间从45分钟缩短至15分钟', example_verbatim: '搭建自动化测试体系，覆盖率从30%提升至85%，线上故障率降低70%' },
    { industry: '金融', dimension: '风控', situation: '信贷业务逾期率从2.3%升至3.8%', task: '需要控制信贷资产质量', action: '引入机器学习风控模型，整合多维度用户行为数据，建立实时预警和人工复核机制', result: '信贷逾期率从3.8%回落至2.1%，坏账拨备减少约200万/月', example_verbatim: '设计并上线风控评分系统，逾期率从3.8%降至2.1%，月坏账减少200W' },
    { industry: '金融', dimension: '合规', situation: '新版资管规定要求额外披露信息', task: '需在规定时间内完成合规整改', action: '协调产品、技术、合规部门，重新设计产品信息披露模板，升级后台数据统计模块', result: '提前5天完成监管整改，通过率100%', example_verbatim: '主导合规系统改造项目，提前完成监管整改上线' },
    { industry: '教育', dimension: '规模', situation: 'VIP学员咨询量增长300%，客服响应严重滞后', task: '人工客服无法支撑高速增长的咨询量', action: '引入智能客服机器人（FAQ+意图识别），人工客服专注处理复杂问题，建立知识库', result: '客服响应时间从30分钟降至3分钟，复杂问题解决率保持92%', example_verbatim: '搭建在线客服系统，响应时间从30分钟缩短至3分钟，用户满意度提升至96%' },
    { industry: '通用', dimension: '学习', situation: '团队技术栈为Vue2，缺少现代前端工程化能力', task: '需要完成技术栈升级以提升开发效率', action: '主动学习Vue3+TypeScript+Vite，编写内部培训文档，组织4次技术分享', result: '团队技术升级顺利完成，新项目开发效率提升25%', example_verbatim: '主导前端架构升级，引入TypeScript和微前端，新项目效率提升40%' },
  ]);

  // 模板元数据
  const { error: rtErr } = await supabase.from('resume_templates').insert([
    { template_key: 'template-1', name: '技术岗-左侧深色', description: '左侧深色信息栏，右侧白色内容区，适合技术/研发类简历', target_industry: ['互联网', '金融'], target_experience: ['应届生', '1-3年'], is_active: true },
    { template_key: 'template-2', name: '金融/咨询-传统严谨', description: '传统上下结构，严谨正式，适合金融、咨询、四大会计师事务所', target_industry: ['金融'], target_experience: ['应届生', '1-3年'], is_active: true },
    { template_key: 'template-3', name: '快消/运营-活泼现代', description: '橙色点缀，模块化两栏布局，适合快消、运营、市场类', target_industry: ['快消', '运营', '市场营销'], target_experience: ['应届生', '1-3年'], is_active: true },
    { template_key: 'template-4', name: '国企/体制内-公文表格', description: '传统表格样式，黑白正式，适合国企、事业单位、公务员', target_industry: ['国企', '事业单位', '公务员'], target_experience: ['应届生'], is_active: true },
    { template_key: 'template-5', name: '创意/设计-视觉突出', description: '左右分栏，色彩鲜明，适合设计师、创意类岗位', target_industry: ['设计', '创意'], target_experience: ['应届生', '1-3年'], is_active: true },
  ]);

  // 统计结果
  const [ikCount, stCount, rtCount] = await Promise.all([
    supabase.from('industry_keywords').select('id', { count: 'exact', head: true }),
    supabase.from('star_templates').select('id', { count: 'exact', head: true }),
    supabase.from('resume_templates').select('id', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    success: !ikErr && !stErr && !rtErr,
    counts: {
      keywords: ikCount.count || 0,
      starTemplates: stCount.count || 0,
      resumeTemplates: rtCount.count || 0,
    },
    errors: { keywords: ikErr?.message, starTemplates: stErr?.message, resumeTemplates: rtErr?.message },
  });
}

-- ═══════════════════════════════════════════════════════
-- 简历Pro 数据基础设施建表 SQL
-- 运行位置：Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- ① 行业JD关键词库 (industry_keywords)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS industry_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(100) NOT NULL,         -- 行业：互联网/金融/医疗/教育
  sub_industry VARCHAR(100),             -- 子类：前端/后端/数据分析
  keyword VARCHAR(255) NOT NULL,         -- 具体关键词
  keyword_type VARCHAR(50) NOT NULL,     -- tech | soft | quant | cert
  frequency INT DEFAULT 1,               -- JD中出现频率
  source VARCHAR(255),                   -- 来源描述
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ik_industry ON industry_keywords(industry);
CREATE INDEX IF NOT EXISTS idx_ik_type ON industry_keywords(keyword_type);
CREATE INDEX IF NOT EXISTS idx_ik_keyword ON industry_keywords(keyword);

-- RLS
ALTER TABLE industry_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON industry_keywords FOR SELECT USING (true);
CREATE POLICY "authenticated_insert" ON industry_keywords FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- ② STAR表达模板库 (star_templates)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS star_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(100) NOT NULL,         -- 适用行业
  dimension VARCHAR(100) NOT NULL,       -- 量化维度：性能/规模/增长/团队/质量
  situation TEXT,                        -- S（背景）模板
  task TEXT,                             -- T（任务）模板
  action TEXT NOT NULL,                  -- A（行动）模板
  result TEXT NOT NULL,                  -- R（结果）模板
  example_verbatim TEXT,                  -- 真实案例原文
  usage_count INT DEFAULT 0,             -- 被使用次数
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_st_industry ON star_templates(industry);
CREATE INDEX IF NOT EXISTS idx_st_dimension ON star_templates(dimension);

ALTER TABLE star_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON star_templates FOR SELECT USING (true);
CREATE POLICY "authenticated_insert" ON star_templates FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- ③ 简历模板元数据 (resume_templates)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(50) UNIQUE NOT NULL,  -- template-1 / template-2
  name VARCHAR(100) NOT NULL,                  -- 模板名称
  description TEXT,                            -- 适用场景描述
  target_industry TEXT[] DEFAULT '{}',         -- 适用行业数组
  target_experience TEXT[] DEFAULT '{}',       -- 适用经验：应届生/1-3年/3-5年
  preview_url TEXT,                          -- 预览图URL
  usage_count INT DEFAULT 0,                 -- 被使用次数
  is_active BOOLEAN DEFAULT true,            -- 是否启用
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON resume_templates FOR SELECT USING (true);
CREATE POLICY "admin_all" ON resume_templates FOR ALL USING (true);

-- ─────────────────────────────────────────────
-- 填充初始行业关键词数据
-- 覆盖互联网/金融/医疗/教育 4大行业，每行业50条核心关键词
-- ─────────────────────────────────────────────

INSERT INTO industry_keywords (industry, keyword, keyword_type, frequency, source) VALUES
-- 互联网 - 技术栈
('互联网', 'React', 'tech', 50, '职位描述统计'),
('互联网', 'Vue', 'tech', 45, '职位描述统计'),
('互联网', 'TypeScript', 'tech', 42, '职位描述统计'),
('互联网', 'Node.js', 'tech', 38, '职位描述统计'),
('互联网', 'Python', 'tech', 50, '职位描述统计'),
('互联网', 'Java', 'tech', 50, '职位描述统计'),
('互联网', 'Go', 'tech', 35, '职位描述统计'),
('互联网', 'SQL', 'tech', 48, '职位描述统计'),
('互联网', 'Redis', 'tech', 40, '职位描述统计'),
('互联网', 'Docker', 'tech', 42, '职位描述统计'),
('互联网', 'Kubernetes', 'tech', 35, '职位描述统计'),
('互联网', '微服务', 'tech', 40, '职位描述统计'),
('互联网', '分布式', 'tech', 38, '职位描述统计'),
('互联网', 'MySQL', 'tech', 48, '职位描述统计'),
('互联网', 'MongoDB', 'tech', 30, '职位描述统计'),
('互联网', 'Kafka', 'tech', 28, '职位描述统计'),
('互联网', 'Flask', 'tech', 25, '职位描述统计'),
('互联网', 'Spring Boot', 'tech', 40, '职位描述统计'),
('互联网', 'TensorFlow', 'tech', 22, '职位描述统计'),
('互联网', 'PyTorch', 'tech', 20, '职位描述统计'),
-- 互联网 - 软技能
('互联网', '团队协作', 'soft', 50, '职位描述统计'),
('互联网', '沟通能力', 'soft', 48, '职位描述统计'),
('互联网', '自驱力', 'soft', 45, '职位描述统计'),
('互联网', '学习能力', 'soft', 50, '职位描述统计'),
('互联网', '抗压能力', 'soft', 42, '职位描述统计'),
('互联网', '责任心', 'soft', 40, '职位描述统计'),
('互联网', '项目管理', 'soft', 35, '职位描述统计'),
('互联网', '逻辑思维', 'soft', 38, '职位描述统计'),
('互联网', '问题解决', 'soft', 45, '职位描述统计'),
('互联网', '跨团队协作', 'soft', 30, '职位描述统计'),
-- 互联网 - 量化指标
('互联网', 'QPS', 'quant', 35, '职位描述统计'),
('互联网', 'DAU', 'quant', 40, '职位描述统计'),
('互联网', 'MAU', 'quant', 35, '职位描述统计'),
('互联网', '日活', 'quant', 42, '职位描述统计'),
('互联网', '转化率', 'quant', 38, '职位描述统计'),
('互联网', '响应时间', 'quant', 30, '职位描述统计'),
('互联网', '性能优化', 'quant', 35, '职位描述统计'),
('互联网', '亿级流量', 'quant', 28, '职位描述统计'),
('互联网', '弹性扩缩容', 'quant', 25, '职位描述统计'),
('互联网', '容灾备份', 'quant', 20, '职位描述统计'),
-- 互联网 - 证书
('互联网', 'PMP', 'cert', 20, '职位描述统计'),
('互联网', 'AWS认证', 'cert', 18, '职位描述统计'),
('互联网', 'CKA', 'cert', 15, '职位描述统计'),
('互联网', '计算机二级', 'cert', 30, '职位描述统计'),
('互联网', '软考中级', 'cert', 25, '职位描述统计'),
-- 金融 - 技术栈
('金融', 'Python', 'tech', 48, '职位描述统计'),
('金融', 'SQL', 'tech', 50, '职位描述统计'),
('金融', 'Java', 'tech', 45, '职位描述统计'),
('金融', 'Wind终端', 'tech', 35, '职位描述统计'),
('金融', 'Bloomberg', 'tech', 28, '职位描述统计'),
('金融', 'MATLAB', 'tech', 22, '职位描述统计'),
('金融', '量化策略', 'tech', 30, '职位描述统计'),
('金融', 'CFA', 'cert', 35, '职位描述统计'),
('金融', 'CPA', 'cert', 38, '职位描述统计'),
('金融', 'FRM', 'cert', 25, '职位描述统计'),
-- 金融 - 软技能
('金融', '风险控制', 'soft', 45, '职位描述统计'),
('金融', '合规意识', 'soft', 40, '职位描述统计'),
('金融', '财务分析', 'soft', 42, '职位描述统计'),
('金融', '数据敏感度', 'soft', 38, '职位描述统计'),
('金融', '逻辑严谨', 'soft', 40, '职位描述统计'),
-- 金融 - 量化
('金融', '年化收益', 'quant', 35, '职位描述统计'),
('金融', '资产规模', 'quant', 30, '职位描述统计'),
('金融', '回撤控制', 'quant', 28, '职位描述统计'),
('金融', '夏普比率', 'quant', 22, '职位描述统计'),
('金融', 'Alpha', 'quant', 20, '职位描述统计'),
-- 医疗 - 技术栈
('医疗', 'Python', 'tech', 40, '职位描述统计'),
('医疗', '数据分析', 'tech', 42, '职位描述统计'),
('医疗', 'R语言', 'tech', 30, '职位描述统计'),
('医疗', '临床试验', 'tech', 35, '职位描述统计'),
('医疗', 'GCP', 'cert', 30, '职位描述统计'),
('医疗', 'NMPA', 'cert', 25, '职位描述统计'),
-- 医疗 - 软技能
('医疗', '医学研究', 'soft', 40, '职位描述统计'),
('医疗', '数据解读', 'soft', 38, '职位描述统计'),
('医疗', '跨部门沟通', 'soft', 32, '职位描述统计'),
-- 教育 - 技术栈
('教育', 'Python', 'tech', 38, '职位描述统计'),
('教育', '数据可视化', 'tech', 35, '职位描述统计'),
('教育', 'SQL', 'tech', 40, '职位描述统计'),
('教育', '教学设计', 'soft', 42, '职位描述统计'),
('教育', '课程开发', 'soft', 40, '职位描述统计'),
-- 教育 - 软技能
('教育', '沟通表达', 'soft', 45, '职位描述统计'),
('教育', '学员服务', 'soft', 38, '职位描述统计'),
('教育', '目标导向', 'soft', 40, '职位描述统计');

-- ─────────────────────────────────────────────
-- 填充STAR模板初始数据
-- ─────────────────────────────────────────────

INSERT INTO star_templates (industry, dimension, situation, task, action, result, example_verbatim) VALUES
-- 互联网 - 性能优化
('互联网', '性能', '电商大促期间', '登录接口响应时间过长（2s+）', '引入Redis缓存用户会话数据，同时使用HTTP/2压缩请求头，将登录流程从同步改为半异步', '登录接口响应时间从2s降至300ms，用户流失率降低15%，双十一当天支撑峰值QPS 5万', '主导登录模块重构，响应时间从2s降至300ms，转化率提升18%'),
('互联网', '性能', '内容平台列表页加载慢', '用户反馈页面首屏加载超过3秒', '对列表接口增加本地缓存（localStorage），图片懒加载，同时在后端对数据库查询增加索引和连接池复用', '首屏加载时间从3.2s降至800ms，用户停留时长提升22%', '优化内容详情接口，引入CDN缓存，接口响应时间降低60%'),
-- 互联网 - 规模
('互联网', '规模', '用户快速增长', '日活从50万增长到200万，现有架构无法支撑', '设计并实现数据库读写分离方案，引入Redis集群做缓存层，同时将非核心计算异步化', '平稳支撑日活200万，系统可用性保持99.95%以上，零故障', '从0到1搭建用户增长平台，支撑DAU从50W增长到200W，QPS峰值5万'),
-- 互联网 - 增长
('互联网', '增长', '新用户转化率低', '注册转化率仅3%，远低于行业均值8%', '通过A/B测试发现落地页文案问题，优化注册流程（减少1个步骤），新增社交账号登录', '注册转化率从3%提升至9%，新增注册用户月增长40%', '通过简化注册流程+社交登录，转化率从3%提升至9%，拉新成本降低35%'),
-- 互联网 - 团队
('互联网', '团队', '跨部门项目协调困难', '产品迭代涉及3个部门，沟通成本高，延期率50%', '制定跨团队协作流程，引入项目管理工具（飞书任务），建立周同步机制和里程碑评审', '项目交付准时率从50%提升至85%，跨团队沟通时间减少30%', '主导跨5人团队项目管理系统搭建，交付准时率提升至90%'),
-- 互联网 - 质量
('互联网', '质量', '线上故障频发', '平均每周发生2-3次P2级以上故障', '建立灰度发布机制，引入自动化回归测试覆盖核心路径，编写SOP故障响应流程', '故障率降低70%，P2故障恢复时间从平均45分钟缩短至15分钟', '搭建自动化测试体系，覆盖率从30%提升至85%，线上故障率降低70%'),
-- 金融 - 风控
('金融', '风控', '信贷业务逾期率上升', 'Q2季度信贷逾期率从2.3%升至3.8%', '引入机器学习风控模型，整合多维度用户行为数据，建立实时预警和人工复核机制', '信贷逾期率从3.8%回落至2.1%，坏账拨备减少约200万/月', '设计并上线风控评分系统，逾期率从3.8%降至2.1%，月坏账减少200W'),
-- 金融 - 合规
('金融', '合规', '监管要求变更', '新版资管规定要求额外披露信息', '协调产品、技术、合规部门，重新设计产品信息披露模板，升级后台数据统计模块', '提前5天完成监管整改，通过率100%', '主导合规系统改造项目，提前完成监管整改上线'),
-- 教育 - 规模
('教育', '规模', '课程服务能力有限', 'VIP学员咨询量增长300%，客服响应严重滞后', '引入智能客服机器人（FAQ+意图识别），人工客服专注处理复杂问题，建立知识库', '客服响应时间从30分钟降至3分钟，复杂问题解决率保持92%', '搭建在线客服系统，响应时间从30分钟缩短至3分钟，用户满意度提升至96%'),
-- 通用 - 学习成长
('通用', '学习', '技术栈陈旧', '团队技术栈为Vue2，缺少现代前端工程化能力', '主动学习Vue3+TypeScript+ Vite，编写内部培训文档，组织4次技术分享', '团队技术升级顺利完成，新项目开发效率提升25%', '主导前端架构升级，引入TypeScript和微前端，新项目交付效率提升40%');

-- ─────────────────────────────────────────────
-- 填充模板元数据（当前5套模板）
-- ─────────────────────────────────────────────

INSERT INTO resume_templates (template_key, name, description, target_industry, target_experience, is_active) VALUES
('template-1', '技术岗-左侧深色', '左侧深色信息栏，右侧白色内容区，适合技术/研发类简历', ARRAY['互联网','金融'], ARRAY['应届生','1-3年'], true),
('template-2', '金融/咨询-传统严谨', '传统上下结构，严谨正式，适合金融、咨询、四大会计师事务所', ARRAY['金融'], ARRAY['应届生','1-3年'], true),
('template-3', '快消/运营-活泼现代', '橙色点缀，模块化两栏布局，适合快消、运营、市场类', ARRAY['快消','运营','市场营销'], ARRAY['应届生','1-3年'], true),
('template-4', '国企/体制内-公文表格', '传统表格样式，黑白正式，适合国企、事业单位、公务员', ARRAY['国企','事业单位','公务员'], ARRAY['应届生'], true),
('template-5', '创意/设计-视觉突出', '左右分栏，色彩鲜明，适合设计师、创意类岗位', ARRAY['设计','创意'], ARRAY['应届生','1-3年'], true);

-- Done
SELECT '建表完成！共创建3张新表，填充了' || 
  (SELECT COUNT(*) FROM industry_keywords)::text || '条关键词，' ||
  (SELECT COUNT(*) FROM star_templates)::text || '条STAR模板，' ||
  (SELECT COUNT(*) FROM resume_templates)::text || '套模板元数据' AS message;

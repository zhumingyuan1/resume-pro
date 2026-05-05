#!/usr/bin/env node
/**
 * sync-major-mapping.ts
 * 
 * 同步 D:盘「专业岗位映射」数据到 Supabase
 * 
 * 数据来源：D:\简历Pro-数据资产\07-专业岗位映射\
 * 同步目标：Supabase 表 majors / jobs / major_job_mapping / learning_paths
 * 
 * 使用方式：
 *   npx tsx scripts/sync-major-mapping.ts
 *   或
 *   ts-node scripts/sync-major-mapping.ts
 * 
 * 环境变量（可选，读取 .env.local）：
 *   SUPABASE_URL       - Supabase 项目 URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service Role Key（必须有写权限）
 *   DATA_ASSET_PATH    - D:盘根路径（默认 D:\简历Pro-数据资产\）
 */

import * as fs from 'fs';
import * as path from 'path';

// 使用 require 避免泛型类型问题（同 sync-jd-keywords.ts）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');

// ============================================
// 类型定义
// ============================================

interface Major {
  code: string;
  name: string;
  category: string;
  sub_category: string;
  traits: string[];
}

interface Job {
  code: string;
  name: string;
  category: string;
  sub_category: string;
  required_skills: string[];
  bonus_skills: string[];
  salary_range?: string;
  job_count?: number;
}

interface JobMapping {
  major_code: string;
  job_code: string;
  match_level: 'direct' | 'near' | 'cross';
  match_score: number;
  skill_gap: string[];
  note?: string;
}

interface LearningPathEntry {
  job_code: string;
  skill_name: string;
  priority: number;
  learning_time: string;
  resources_free: string[];
  resources_paid: string[];
  week_number: number;
}

// ============================================
// 路径配置（兼容 Windows）
// ============================================

const DATA_ROOT = process.env.DATA_ASSET_PATH || 'D:\\简历Pro-数据资产\\';
const MAPPING_DIR = path.join(DATA_ROOT, '07-专业岗位映射');
const MAPPING_FILE = path.join(MAPPING_DIR, '02-专业岗位映射表.md');
const LEARNING_FILE = path.join(MAPPING_DIR, '03-学习路径数据库.md');
const MAJOR_DB_DIR = path.join(MAPPING_DIR, '专业数据库');

// ============================================
// Supabase Client
// ============================================

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || 'https://bgrrhvtqonltskrqchvo.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ============================================
// 工具函数
// ============================================

function trimLines(lines: string[]): string[] {
  return lines.map(l => l.trimEnd());
}

function parseStarScore(stars: string): number {
  // ★★★★★ → 95, ★★★★☆ → 85, ★★★☆☆ → 65, ★★☆☆☆ → 45, ★☆☆☆☆ → 25
  const starMap: Record<string, number> = {
    '★★★★★': 95,
    '★★★★☆': 85,
    '★★★☆☆': 65,
    '★★☆☆☆': 45,
    '★☆☆☆☆': 25,
  };
  return starMap[stars] ?? 50;
}

function extractParens(text: string): { main: string; note?: string } {
  const match = text.match(/^(.+?)（(.+?)）$/);
  if (match) {
    return { main: match[1].trim(), note: match[2].trim() };
  }
  return { main: text.trim() };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/--+/g, '-');
}

function generateCode(name: string, prefix: string = 'M'): string {
  // 简单hash生成固定长度code
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return `${prefix}-${Math.abs(hash).toString(36).padStart(4, '0').toUpperCase()}`;
}

// ============================================
// 解析：专业-岗位映射表
// ============================================

interface ParsedMappingData {
  majors: Major[];
  jobs: Job[];
  jobMappings: JobMapping[];
}

function parseMajorJobMapping(content: string): ParsedMappingData {
  const lines = trimLines(content.split('\n'));
  const majors: Major[] = [];
  const allJobs: Map<string, Job> = new Map();
  const jobMappings: JobMapping[] = [];

  let currentCategory = '';
  let currentSubCategory = '';
  let currentMajor: string | null = null;
  let currentMajorCode = '';
  let currentSection: 'direct' | 'near' | 'cross' | null = null;

  const categoryMap: Record<string, string> = {
    '计算机类': '计算机类', '电子信息类': '电子信息类', '机械类': '机械类',
    '经济管理类': '经济管理类', '法学类': '法学类', '语言文学类': '语言文学类',
    '教育学类': '教育学类', '设计类': '设计类', '医学类': '医学类', '管理学': '管理学',
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测学科大类，如 "一、计算机类"
    const categoryMatch = line.match(/^[\u4e00-\u9fa5]+、(.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      currentSubCategory = categoryMap[currentCategory] || currentCategory;
      continue;
    }

    // 检测专业，如 "【计算机科学与技术】"（排除 preamble 里的【直接对口】等）
    const majorMatch = line.match(/^【(.+?)】$/);
    if (majorMatch) {
      const inner = majorMatch[1];
      if (inner.includes('直接对口') || inner.includes('邻近相关') || inner.includes('跨界转换')) continue;
      currentMajor = inner;
      currentMajorCode = generateCode(inner, 'MJ');
      currentSection = null; // 新专业重置 section
      majors.push({
        code: currentMajorCode,
        name: inner,
        category: getCategoryByMajor(inner),
        sub_category: currentSubCategory || '其他',
        traits: getMajorTraits(inner),
      });
      continue;
    }

    // 只有在已知专业后才处理 section 切换
    if (currentMajor) {
      if (line.includes('直接对口：')) { currentSection = 'direct'; continue; }
      if (line.includes('邻近相关：')) { currentSection = 'near'; continue; }
      if (line.includes('跨界转换：')) { currentSection = 'cross'; continue; }
    }

    // 解析岗位行
    if ((currentSection === 'direct' || currentSection === 'near' || currentSection === 'cross') && line.startsWith('- ')) {
      const jobName = line.slice(2).trim();
      if (!jobName || jobName.includes('接口') || jobName.includes('说明') || jobName.includes('其他')) continue;

      const { main: cleanJobName, note } = extractParens(jobName);
      const jobCode = generateCode(cleanJobName, 'JB');

      // 建立映射（match_score 范围 1-5）
      const scoreMap: Record<string, number> = {
        direct: 5,
        near: 4,
        cross: 3,
      };
      jobMappings.push({
        major_code: currentMajorCode,
        job_code: jobCode,
        match_level: currentSection,
        match_score: scoreMap[currentSection],
        skill_gap: note ? [note.replace('需补充', '').trim()] : [],
        note: note || undefined,
      });

      // 注册岗位
      if (!allJobs.has(cleanJobName)) {
        const jobCategory = getJobCategory(cleanJobName);
        allJobs.set(cleanJobName, {
          code: jobCode,
          name: cleanJobName,
          category: jobCategory,
          sub_category: jobCategory,
          required_skills: getJobRequiredSkills(cleanJobName),
          bonus_skills: getJobBonusSkills(cleanJobName),
        });
      }
    }
  }

  return {
    majors,
    jobs: Array.from(allJobs.values()),
    jobMappings,
  };
}

function getCategoryByMajor(name: string): string {
  const map: Record<string, string> = {
    '计算机科学与技术': '工学', '软件工程': '工学', '网络工程': '工学',
    '信息安全': '工学', '物联网工程': '工学', '数字媒体技术': '工学',
    '数据科学与大数据技术': '工学', '人工智能': '工学', '通信工程': '工学',
    '电子信息工程': '工学', '自动化': '工学', '机械工程': '工学',
    '机械设计制造及其自动化': '工学', '车辆工程': '工学', '工业设计': '工学',
    '金融学': '经济学', '会计学': '管理学', '财务管理': '管理学',
    '工商管理': '管理学', '市场营销': '管理学', '电子商务': '管理学',
    '物流管理': '管理学', '人力资源管理': '管理学', '信息管理与信息系统': '管理学',
    '法学': '法学', '知识产权': '法学', '英语': '文学', '翻译': '文学',
    '汉语言文学': '文学', '新闻传播学': '文学', '教育学': '教育学',
    '学前教育': '教育学', '视觉传达设计': '艺术学', '环境设计': '艺术学',
    '产品设计': '艺术学', '临床医学': '医学', '护理学': '医学',
    '药学': '医学',
  };
  return map[name] || '其他';
}

function getMajorTraits(name: string): string[] {
  const traits: Record<string, string[]> = {
    '计算机科学与技术': ['编程', '逻辑思维', '数学', '系统设计'],
    '软件工程': ['编程', '软件架构', '项目管理', '代码质量'],
    '数据科学与大数据技术': ['数据分析', 'Python', '统计学', '机器学习'],
    '人工智能': ['深度学习', 'Python', '算法', '数学'],
    '金融学': ['金融理论', '财务分析', '风险管理', '数据分析'],
    '会计学': ['会计准则', '财务报表', '税务', '审计'],
    '工商管理': ['管理', '市场营销', '战略', '沟通'],
    '市场营销': ['市场分析', '文案', '策划', '数字营销'],
    '法学': ['法律分析', '文书起草', '逻辑思维', '辩护'],
    '英语': ['口语', '写作', '翻译', '跨文化沟通'],
    '新闻传播学': ['写作', '编辑', '内容策划', '媒体运营'],
    '视觉传达设计': ['设计', '色彩', '排版', '创意'],
  };
  return traits[name] || ['逻辑思维', '学习能力'];
}

function getJobCategory(name: string): string {
  const catMap: Record<string, string> = {
    '前端开发工程师': '互联网', '后端开发工程师': '互联网', '移动端开发工程师': '互联网',
    '算法工程师': '互联网', '数据分析师': '互联网', '产品经理': '互联网',
    'UI设计师': '互联网', '视觉设计师': '互联网', '交互设计师': '互联网',
    '运维工程师': '互联网', '测试工程师': '互联网', '项目经理': '互联网',
    '运营专员': '互联网', '新媒体运营': '互联网', '内容运营': '互联网',
    '银行柜员': '金融', '银行客户经理': '金融', '证券分析师': '金融',
    '基金销售': '金融', '风控专员': '金融', '量化分析师': '金融',
    '会计': '财务', '审计专员': '财务', '税务专员': '财务', '财务专员': '财务',
    'HR专员': '人力资源', '招聘专员': '人力资源', '培训专员': '人力资源',
    '英语老师': '教育', '翻译': '语言服务', '外贸专员': '外贸',
    '跨境电商运营': '电商', '律师助理': '法律', '法务专员': '法律',
    '幼儿教师': '教育', '编辑': '媒体', '记者': '媒体',
  };
  return catMap[name] || '互联网';
}

function getJobRequiredSkills(jobName: string): string[] {
  const skills: Record<string, string[]> = {
    '前端开发工程师': ['HTML/CSS', 'JavaScript', 'React/Vue', 'Git'],
    '后端开发工程师': ['Java/Go/Python', 'MySQL', 'Redis', 'Git'],
    '算法工程师': ['Python', '机器学习', '深度学习', 'LeetCode'],
    '数据分析师': ['SQL', 'Python', 'Pandas', 'Tableau'],
    '产品经理': ['PRD', 'Axure', '数据分析', '竞品分析'],
    'UI设计师': ['Figma', 'Sketch', '设计规范', '配色'],
    '测试工程师': ['测试理论', 'Selenium', 'Jmeter', 'Postman'],
    '运维工程师': ['Linux', 'Shell', 'Docker', 'K8s'],
    '运营专员': ['数据分析', '活动策划', '文案', 'Excel'],
    '新媒体运营': ['内容运营', '文案', '选题策划', '粉丝运营'],
    '银行柜员': ['银行业务', '柜面操作', '服务意识'],
    '证券分析师': ['行研', '财务建模', '估值', 'Wind终端'],
    '会计': ['会计准则', '财务报表', '金蝶/用友'],
    '审计专员': ['审计理论', 'CPA', '风险评估'],
    '英语老师': ['教学', '口语', '应试辅导'],
    '翻译': ['笔译', '口译', '专业领域词汇'],
    '外贸专员': ['外贸函电', '客户开发', '跟单'],
    '法学': ['法律研究', '文书起草', '案件整理'],
  };
  return skills[jobName] || ['沟通', '学习能力'];
}

function getJobBonusSkills(jobName: string): string[] {
  const bonus: Record<string, string[]> = {
    '前端开发工程师': ['TypeScript', 'Node.js', 'SSR', '性能优化'],
    '后端开发工程师': ['微服务', '消息队列', '分布式', 'K8s'],
    '算法工程师': ['论文复现', 'Kaggle', '模型部署', '大数据'],
    '数据分析师': ['Hive', 'Spark', 'AB测试', '统计学'],
    '产品经理': ['技术背景', 'PMP', '行业资源'],
    'UI设计师': ['AE动效', 'C4D', '前端基础'],
    '运营专员': ['SQL', '短视频', '私域运营', '直播运营'],
  };
  return bonus[jobName] || [];
}

// ============================================
// 解析：学习路径
// ============================================

function parseLearningPaths(content: string): LearningPathEntry[] {
  const lines = trimLines(content.split('\n'));
  const entries: LearningPathEntry[] = [];

  let currentJobName = '';
  let currentJobCode = '';
  let currentStep = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测岗位标题，如 "【计算机→前端开发工程师】"
    const jobMatch = line.match(/^【.+?→(.+?)】$/);
    if (jobMatch) {
      currentJobName = jobMatch[1].trim();
      currentJobCode = generateCode(currentJobName, 'JB');
      currentStep = 0;
      continue;
    }

    // 检测第N步
    const stepMatch = line.match(/^第(\d+)步：(.+)/);
    if (stepMatch) {
      currentStep = parseInt(stepMatch[1], 10);
      const skillName = stepMatch[2].trim();
      if (skillName && currentJobCode) {
        entries.push({
          job_code: currentJobCode,
          skill_name: skillName,
          priority: currentStep <= 2 ? 1 : currentStep <= 4 ? 2 : 3,
          learning_time: guessLearningTime(currentStep),
          resources_free: ['B站教程', 'MDN文档'],
          resources_paid: ['极客时间', '拉勾教育'],
          week_number: currentStep,
        });
      }
      continue;
    }

    // 检测必备/加分技能块
    const skillsMatch = line.match(/^必备技能：(.+)/) || line.match(/^加分技能：(.+)/);
    if (skillsMatch && currentJobCode) {
      const skills = skillsMatch[1].split(/[,，]/).map(s => s.trim()).filter(Boolean);
      skills.forEach((skill, idx) => {
        entries.push({
          job_code: currentJobCode,
          skill_name: skill,
          priority: 1,
          learning_time: '1-2个月',
          resources_free: ['B站', 'GitHub'],
          resources_paid: ['极客时间'],
          week_number: currentStep || idx + 1,
        });
      });
    }
  }

  return entries;
}

function guessLearningTime(step: number): string {
  const times: Record<number, string> = {
    1: '1-2个月', 2: '2-3个月', 3: '1-2个月', 4: '1-2个月',
  };
  return times[step] || '1个月';
}

// ============================================
// 同步主逻辑
// ============================================

async function upsertMajor(supabase: ReturnType<typeof createClient>, m: Major) {
  const { error } = await supabase.rpc('upsert_major', {
    p_code: m.code,
    p_name: m.name,
    p_category: m.category,
    p_sub_category: m.sub_category,
    p_traits: m.traits,
  });
  if (error) throw new Error(`upsert_major(${m.name}) failed: ${error.message}`);
}

async function upsertJob(supabase: ReturnType<typeof createClient>, j: Job) {
  const { error } = await supabase.rpc('upsert_job', {
    p_code: j.code,
    p_name: j.name,
    p_category: j.category,
    p_sub_category: j.sub_category,
    p_required_skills: j.required_skills,
    p_bonus_skills: j.bonus_skills,
    p_salary_range: j.salary_range || null,
    p_job_count: j.job_count || null,
  });
  if (error) throw new Error(`upsert_job(${j.name}) failed: ${error.message}`);
}

async function upsertMapping(supabase: ReturnType<typeof createClient>, m: JobMapping) {
  const { error } = await supabase.rpc('upsert_major_job_mapping', {
    p_major_code: m.major_code,
    p_job_code: m.job_code,
    p_match_level: m.match_level,
    p_match_score: m.match_score,
    p_skill_gap: m.skill_gap,
    p_note: m.note || null,
  });
  if (error) throw new Error(`upsert_mapping failed: ${error.message}`);
}

async function upsertLearningPath(supabase: ReturnType<typeof createClient>, lp: LearningPathEntry) {
  const { error } = await supabase.rpc('upsert_learning_path', {
    p_job_code: lp.job_code,
    p_skill_name: lp.skill_name,
    p_priority: lp.priority,
    p_learning_time: lp.learning_time,
    p_resources_free: lp.resources_free,
    p_resources_paid: lp.resources_paid,
    p_week_number: lp.week_number,
  });
  if (error) throw new Error(`upsert_learning_path(${lp.skill_name}) failed: ${error.message}`);
}

async function main() {
  console.log('🚀 开始同步专业-岗位映射数据...\n');
  console.log(`📂 数据源目录: ${MAPPING_DIR}`);

  // 1. 读取文件
  if (!fs.existsSync(MAPPING_FILE)) {
    console.error(`❌ 映射文件不存在: ${MAPPING_FILE}`);
    console.error('   请确认 D:盘路径正确，或设置 DATA_ASSET_PATH 环境变量');
    process.exit(1);
  }

  const mappingContent = fs.readFileSync(MAPPING_FILE, 'utf-8');
  const learningContent = fs.existsSync(LEARNING_FILE)
    ? fs.readFileSync(LEARNING_FILE, 'utf-8')
    : '';

  console.log(`✅ 已读取映射文件: ${path.basename(MAPPING_FILE)}`);

  // 2. 解析数据
  console.log('\n📊 正在解析数据...');
  const { majors, jobs, jobMappings } = parseMajorJobMapping(mappingContent);
  const learningPaths = parseLearningPaths(learningContent);

  console.log(`   专业数量: ${majors.length}`);
  console.log(`   岗位数量: ${jobs.length}`);
  console.log(`   映射数量: ${jobMappings.length}`);
  console.log(`   学习路径: ${learningPaths.length}`);

  // 3. 连接 Supabase
  console.log('\n🔌 连接 Supabase...');
  const supabase = getSupabaseAdmin();

  // 4. 写入数据
  console.log('\n💾 正在写入 Supabase...\n');

  // Majors
  let majorCount = 0;
  for (const m of majors) {
    await upsertMajor(supabase, m);
    majorCount++;
    process.stdout.write(`\r   专业: ${majorCount}/${majors.length}`);
  }
  console.log(`\n   ✅ 已同步 ${majorCount} 个专业`);

  // Jobs
  let jobCount = 0;
  for (const j of jobs) {
    await upsertJob(supabase, j);
    jobCount++;
    process.stdout.write(`\r   岗位: ${jobCount}/${jobs.length}`);
  }
  console.log(`\n   ✅ 已同步 ${jobCount} 个岗位`);

  // Mappings
  let mapCount = 0;
  for (const m of jobMappings) {
    await upsertMapping(supabase, m);
    mapCount++;
    process.stdout.write(`\r   映射: ${mapCount}/${jobMappings.length}`);
  }
  console.log(`\n   ✅ 已同步 ${mapCount} 条映射`);

  // Learning Paths
  if (learningPaths.length > 0) {
    let lpCount = 0;
    for (const lp of learningPaths) {
      await upsertLearningPath(supabase, lp);
      lpCount++;
      process.stdout.write(`\r   学习路径: ${lpCount}/${learningPaths.length}`);
    }
    console.log(`\n   ✅ 已同步 ${lpCount} 条学习路径`);
  }

  console.log('\n🎉 同步完成！');
  console.log('\n📋 下一步：');
  console.log('   1. 运行迁移脚本（如果 upsert 函数不存在）');
  console.log('   2. 重启 Next.js 开发服务器');
  console.log('   3. 访问 /major 页面测试 API');
  console.log('\n   迁移 SQL: supabase/migrations/003_major_job_mapping_sync.sql');
}

main().catch(err => {
  console.error('\n❌ 同步失败:', err.message);
  process.exit(1);
});

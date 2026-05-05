#!/usr/bin/env node
/**
 * sync-jd-keywords.ts
 * 
 * 同步 D:盘「JD关键词库」数据到 Supabase
 * 
 * 数据来源：D:\简历Pro-数据资产\01-JD关键词库\
 * 同步目标：Supabase 表 jd_keywords + jobs
 * 
 * 使用方式：
 *   npx tsx scripts/sync-jd-keywords.ts
 * 
 * 环境变量：
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATA_ASSET_PATH    - D:盘根路径（默认 D:\简历Pro-数据资产\）
 */

import * as fs from 'fs';
import * as path from 'path';

// 不使用泛型，避免 Database 类型缺失导致 never 类型问题
// 同步脚本独立运行，不需要完整项目类型
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');

// ============================================
// 类型定义
// ============================================

type KeywordCategory = 'hard_skill' | 'soft_skill' | 'experience' | 'quantitative';

interface JdKeyword {
  job_code: string;
  keyword_category: KeywordCategory;
  keyword: string;
  frequency: number;
}

interface Job {
  code: string;
  name: string;
  category: string;
  sub_category: string;
  required_skills: string[];
  bonus_skills: string[];
}

// ============================================
// 路径配置
// ============================================

const DATA_ROOT = process.env.DATA_ASSET_PATH || 'D:\\简历Pro-数据资产\\';
const JD_KEYWORD_ROOT = path.join(DATA_ROOT, '01-JD关键词库');

// ============================================
// Supabase Client（使用 any 绕过类型推断问题）
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabaseAdmin(): any {
  const url = process.env.SUPABASE_URL || 'https://bgrrhvtqonltskrqchvo.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
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

/** 从文件名提取岗位名，如 "前端工程师-关键词.txt" → "前端工程师" */
function extractJobName(filename: string): string {
  return filename.replace(/[-－].*$/, '').trim();
}

/** 从目录名推断行业分类 */
function inferCategory(dirName: string): string {
  const map: Record<string, string> = {
    '01-技术岗': '互联网',
    '02-产品岗': '互联网',
    '03-运营岗': '互联网',
    '04-市场金融岗': '金融/市场',
    '05-设计岗': '互联网',
  };
  return map[dirName] || '互联网';
}

/** 统一处理section名称映射 */
function normalizeCategory(sectionName: string): KeywordCategory | null {
  const s = sectionName.trim();
  if (s.includes('硬性') || s.includes('必须关键词') || s.includes('技术技能')) return 'hard_skill';
  if (s.includes('软性') || s.includes('加分关键词')) return 'soft_skill';
  if (s.includes('量化') || s.includes('简历中常用') || s.includes('量化指标')) return 'quantitative';
  if (s.includes('经验') || s.includes('项目')) return 'experience';
  return null;
}

/** 解析单个关键词文件 */
function parseKeywordFile(
  filePath: string,
  jobCode: string,
  jobName: string
): { keywords: JdKeyword[]; allSkills: string[] } {
  // 文件是 UTF-8 with BOM 编码
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trimEnd());

  const keywords: JdKeyword[] = [];
  let currentCategory: KeywordCategory | null = null;
  const allSkills: string[] = [];

  for (const line of lines) {
    // 检测分类头，如 【硬性技术技能 - 必须关键词】
    const sectionMatch = line.match(/^【(.+?)】$/);
    if (sectionMatch) {
      const cat = normalizeCategory(sectionMatch[1]);
      if (cat) currentCategory = cat;
      continue;
    }

    // 跳过元数据行
    if (line.startsWith('===') || line.includes('JD关键词库') || line.includes('来源：') ||
        line.includes('整理时间') || line.includes('下次更新') || line.includes('总计：')) {
      continue;
    }

    // 关键词行：所有分类下，词条都是纯文本（无 - 前缀）
    if (currentCategory) {
      const kw = line.trim();
      if (!kw || kw.match(/^[【】=]/) || kw.length === 0) continue;
      keywords.push({ job_code: jobCode, keyword_category: currentCategory, keyword: kw, frequency: 1 });
      allSkills.push(kw);
    }
  }

  return { keywords, allSkills };
}

// ============================================
// 解析整个目录
// ============================================

function parseAllKeywordDirs(): {
  jobs: Job[];
  keywords: JdKeyword[];
  jobNameToCode: Map<string, string>;
} {
  const jobs: Job[] = [];
  const keywords: JdKeyword[] = [];
  const jobNameToCode = new Map<string, string>();

  // 目录顺序决定行业分类
  const dirOrder = ['01-技术岗', '02-产品岗', '03-运营岗', '04-市场金融岗', '05-设计岗'];

  for (const dirName of dirOrder) {
    const dirPath = path.join(JD_KEYWORD_ROOT, dirName);
    if (!fs.existsSync(dirPath)) {
      console.warn(`   ⚠️ 目录不存在: ${dirPath}`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.txt'));
    const category = inferCategory(dirName);

    for (const file of files) {
      const jobName = extractJobName(file);
      const jobCode = generateCode(jobName, 'JB');

      jobNameToCode.set(jobName, jobCode);

      const filePath = path.join(dirPath, file);
      const { keywords: kws, allSkills } = parseKeywordFile(filePath, jobCode, jobName);

      // 判断硬性/软性技能（简单 heuristic：常见技术栈为硬性）
      const hardSkillSet = new Set([
        'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js',
        'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin',
        'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'ElasticSearch',
        'Docker', 'K8s', 'Kubernetes', 'AWS', 'Azure', 'GCP',
        'Git', 'Linux', 'Shell', 'Nginx', 'Kafka', 'RabbitMQ',
        'HTML', 'CSS', 'Sass', 'Less', 'Webpack', 'Vite', 'Tailwind',
        'React Native', 'Flutter', 'Uni-app', 'Taro',
        'Axure', 'Sketch', 'Figma', '墨刀',
        'TensorFlow', 'PyTorch', 'Keras', 'PaddlePaddle',
        'Spark', 'Hadoop', 'Hive', 'Flink',
      ]);

      keywords.push(...kws);
      jobs.push({
        code: jobCode,
        name: jobName,
        category,
        sub_category: dirName.replace(/^\d+-/, ''),
        required_skills: allSkills.filter(s => hardSkillSet.has(s)).slice(0, 10),
        bonus_skills: allSkills.filter(s => !hardSkillSet.has(s)).slice(0, 10),
      });
    }
  }

  return { jobs, keywords, jobNameToCode };
}

// ============================================
// 简单 hash 生成固定 code
// ============================================

function generateCode(name: string, prefix: string = 'JB'): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return `${prefix}-${Math.abs(hash).toString(36).padStart(4, '0').toUpperCase()}`;
}

// ============================================
// 写入 Supabase
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertJob(supabase: any, j: Job) {
  const { error } = await supabase
    .from('jobs')
    .upsert({
      code: j.code,
      name: j.name,
      category: j.category,
      sub_category: j.sub_category,
      required_skills: j.required_skills,
      bonus_skills: j.bonus_skills,
    }, {
      onConflict: 'code',
    });
  if (error) throw new Error(`upsert_job(${j.name}) failed: ${error.message}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertKeywords(supabase: any, keywords: JdKeyword[]) {
  if (keywords.length === 0) return;

  // 去重：同一个 job_code + keyword_category + keyword 只保留一条
  const seen = new Set<string>();
  const unique = keywords.filter(k => {
    const key = `${k.job_code}::${k.keyword_category}::${k.keyword}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 分小批次写入（每批 50 条），避免一次写入行太多
  const BATCH = 50;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const { error } = await supabase
      .from('jd_keywords')
      .upsert(
        batch.map(k => ({
          job_code: k.job_code,
          keyword_category: k.keyword_category,
          keyword: k.keyword,
          frequency: k.frequency,
        })),
        { onConflict: 'job_code,keyword_category,keyword' }
      );
    if (error) throw new Error(`insert_keywords batch ${i / BATCH} failed: ${error.message}`);
  }
}

// ============================================
// 主逻辑
// ============================================

async function main() {
  console.log('🚀 开始同步 JD关键词库...\n');
  console.log(`📂 数据源目录: ${JD_KEYWORD_ROOT}`);

  // 1. 解析所有文件
  console.log('\n📊 正在解析文件...');
  const { jobs, keywords, jobNameToCode } = parseAllKeywordDirs();

  console.log(`   发现岗位: ${jobs.length}`);
  console.log(`   发现关键词: ${keywords.length}`);
  console.log('\n   岗位列表:');
  for (const j of jobs) {
    const kwCount = keywords.filter(k => k.job_code === j.code).length;
    console.log(`   - ${j.name} (${j.category}) [${kwCount} 个关键词]`);
  }

  // 2. 连接 Supabase
  console.log('\n🔌 连接 Supabase...');
  const supabase = getSupabaseAdmin();

  // 3. 写入 Jobs
  console.log('\n💾 正在写入 jobs 表...');
  let jobCount = 0;
  for (const j of jobs) {
    await upsertJob(supabase, j);
    jobCount++;
    process.stdout.write(`\r   ${jobCount}/${jobs.length} 个岗位`);
  }
  console.log(`\n   ✅ 已写入 ${jobCount} 个岗位`);

  // 4. 写入 Keywords（按 job_code 分批，每批 200 条）
  console.log('\n💾 正在写入 jd_keywords 表...');
  const BATCH_SIZE = 200;
  let totalInserted = 0;

  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    await insertKeywords(supabase, batch);
    totalInserted += batch.length;
    process.stdout.write(`\r   ${totalInserted}/${keywords.length} 条关键词`);
  }
  console.log(`\n   ✅ 已写入 ${totalInserted} 条关键词`);

  console.log('\n🎉 JD关键词库同步完成！');
  console.log('\n📋 下一步：');
  console.log('   1. 重启 Next.js 开发服务器');
  console.log('   2. 访问 /major 或 /api 页面测试数据');
}

main().catch(err => {
  console.error('\n❌ 同步失败:', err.message);
  process.exit(1);
});

const fs = require('fs');

function generateCode(name, prefix) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = ((hash << 5) - hash) + name.charCodeAt(i); hash |= 0; }
  return prefix + '-' + Math.abs(hash).toString(36).padStart(4, '0').toUpperCase();
}

const content = fs.readFileSync('D:/简历Pro-数据资产/07-专业岗位映射/02-专业岗位映射表.md', 'utf-8');
const lines = content.split('\n').map(l => l.trimEnd());

let currentCategory = '', currentSubCategory = '', currentMajor = null, currentMajorCode = '', currentSection = null;
let majors = [], allJobs = new Map(), jobMappings = [];

const categoryMap = { '计算机类':'计算机类','电子信息类':'电子信息类','机械类':'机械类','经济管理类':'经济管理类','法学类':'法学类','语言文学类':'语言文学类','教育学类':'教育学类','设计类':'设计类','医学类':'医学类','管理学':'管理学' };

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 学科大类标题，如 "一、计算机类"
  const catMatch = line.match(/^[\u4e00-\u9fa5]+、(.+)$/);
  if (catMatch) {
    currentCategory = catMatch[1];
    currentSubCategory = categoryMap[currentCategory] || currentCategory;
    continue;
  }

  // 专业名行，如 "【计算机科学与技术】"（排除 preamble 里的【直接对口】等）
  const majorMatch = line.match(/^【(.+?)】$/);
  if (majorMatch) {
    const inner = majorMatch[1];
    // 如果包含映射类型关键词，说明是 preamble 里的示例，不是真实专业
    if (inner.includes('直接对口') || inner.includes('邻近相关') || inner.includes('跨界转换')) continue;
    currentMajor = inner;
    currentMajorCode = generateCode(inner, 'MJ');
    majors.push({ code: currentMajorCode, name: inner, sub_category: currentSubCategory || '其他' });
    currentSection = null; // 新专业，重置 section
    continue;
  }

  // 只有在已确定专业后，才处理 section 切换
  if (currentMajor) {
    if (line.includes('直接对口：')) { currentSection = 'direct'; continue; }
    if (line.includes('邻近相关：')) { currentSection = 'near'; continue; }
    if (line.includes('跨界转换：')) { currentSection = 'cross'; continue; }

    // 岗位行
    if (currentSection && line.startsWith('- ')) {
      const jobName = line.slice(2).trim();
      if (!jobName || jobName.includes('接口') || jobName.includes('说明') || jobName.includes('其他')) continue;
      const jobCode = generateCode(jobName, 'JB');
      const scoreMap = { direct: 5, near: 4, cross: 3 };
      jobMappings.push({ major_code: currentMajorCode, job_code: jobCode, match_level: currentSection, match_score: scoreMap[currentSection] });
      if (!allJobs.has(jobName)) allJobs.set(jobName, { code: jobCode, name: jobName });
    }
  }
}

console.log('Majors:', majors.length);
console.log('Jobs:', allJobs.size);
console.log('Mappings:', jobMappings.length);
console.log('First 3 majors:', JSON.stringify(majors.slice(0, 3)));
if (jobMappings.length > 0) console.log('First mapping:', JSON.stringify(jobMappings[0]));
if (majors.length > 0) console.log('Last major:', JSON.stringify(majors[majors.length - 1]));

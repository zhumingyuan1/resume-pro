const fs = require('fs');

function normalizeCategory(sectionName) {
  const s = sectionName.trim();
  if (s.includes('硬性') || s.includes('必须关键词') || s.includes('技术技能')) return 'hard_skill';
  if (s.includes('软性') || s.includes('加分关键词')) return 'soft_skill';
  if (s.includes('量化') || s.includes('简历中常用') || s.includes('量化指标')) return 'quantitative';
  if (s.includes('经验') || s.includes('项目')) return 'experience';
  return null;
}

const content = fs.readFileSync('D:/简历Pro-数据资产/01-JD关键词库/01-技术岗/前端工程师-关键词.txt', 'utf-8');
const lines = content.split('\n');

let currentCategory = null;
let count = { hard_skill: 0, soft_skill: 0, experience: 0, quantitative: 0 };

for (const line of lines) {
  const trimmed = line.trimEnd();
  
  // Detect section header
  const sectionMatch = trimmed.match(/^【(.+?)】$/);
  if (sectionMatch) {
    const raw = sectionMatch[1];
    const cat = normalizeCategory(raw);
    console.log(`HEADER: "${raw}" -> ${cat}`);
    if (cat) { currentCategory = cat; }
    continue;
  }

  // Skip meta lines
  if (trimmed.startsWith('===') || trimmed.includes('JD关键词库') || trimmed.includes('来源') || trimmed.includes('整理时间') || trimmed.includes('下次更新') || trimmed.includes('总计')) continue;

  if (currentCategory) {
    let kw;
    if (trimmed.startsWith('- ')) {
      kw = trimmed.slice(2).trim();
    } else {
      kw = trimmed.trim();
    }
    if (!kw || kw.match(/^[【】=]/) || kw.length === 0) continue;
    count[currentCategory]++;
  }
}

console.log('\nCounts:', count);
console.log('Total:', Object.values(count).reduce((a, b) => a + b, 0));

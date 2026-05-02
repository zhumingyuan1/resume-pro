'use client';
// @ts-nocheck

import { useResumeStore } from '@/lib/resume-store';
import type { JdAnalysis } from '@/types/resume';

export default function ResumePreview() {
  const { currentResume, selectedTemplate, jdAnalysis } = useResumeStore();

  if (!currentResume) {
    return (
      <div className="flex items-center justify-center h-full min-h-[297mm] text-slate-400">
        <p>左边填写内容，预览会实时显示</p>
      </div>
    );
  }

  const resume: any = currentResume;

  // 根据 JD 分析计算健康分和问题（不改变模板渲染逻辑）
  const health = computeHealth(resume, jdAnalysis);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* 健康分浮动徽章 — 叠加在预览右上角（兄弟元素，不改模板） */}
      {health && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        }}>
          {health.score !== null && (
            <div style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: health.score >= 80 ? '#ecfdf5' : health.score >= 60 ? '#fffbeb' : '#fef2f2',
              color: health.score >= 80 ? '#10b981' : health.score >= 60 ? '#f59e0b' : '#ef4444',
              border: `1px solid ${health.score >= 80 ? '#a7f3d0' : health.score >= 60 ? '#fde68a' : '#fecaca'}`,
            }}>
              健康度 {health.score}
            </div>
          )}
          {health.jdCoverage !== null && jdAnalysis && (
            <div style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: health.jdCoverage >= 50 ? '#eff6ff' : '#fef2f2',
              color: health.jdCoverage >= 50 ? '#2563eb' : '#ef4444',
              border: `1px solid ${health.jdCoverage >= 50 ? '#bfdbfe' : '#fecaca'}`,
            }}>
              JD覆盖 {health.jdCoverage}%
            </div>
          )}
        </div>
      )}

      {/* 渲染选中的模板（health prop 去掉，避免 TS 报错） */}
      {selectedTemplate === 'template-2' ? <Template2 resume={resume} /> :
       selectedTemplate === 'template-3' ? <Template3 resume={resume} /> :
       selectedTemplate === 'template-4' ? <Template4 resume={resume} /> :
       selectedTemplate === 'template-5' ? <Template5 resume={resume} /> :
       <Template1 resume={resume} />}
    </div>
  );
}

/** 计算简历健康分 + JD覆盖度 */
function computeHealth(resume: any, jdAnalysis: JdAnalysis | null) {
  if (!resume) return null;

  const issues: string[] = [];
  let score = 100;
  let jdCoverage: number | null = null;

  // 工作经历检查
  const works = resume.work || [];
  works.forEach((w: any) => {
    const text = (w.highlights || []).join(' ');
    const hasQuant = /[\d]+%|\d+[万亿千万百万]/.test(text);
    const hasAction = /通过|实现|优化|主导|负责|搭建|设计|完成|提升|降低/.test(text);
    if (!hasQuant) { issues.push('工作经历缺少量化数据'); score -= 10; }
    if (!hasAction) { issues.push('工作经历缺少行动描述'); score -= 5; }
  });

  // 个人简介检查
  if (!resume.profile?.summary?.trim()) {
    issues.push('缺少个人简介'); score -= 8;
  } else if (resume.profile.summary.trim().length < 30) {
    issues.push('个人简介过短'); score -= 4;
  }

  // JD 覆盖度
  if (jdAnalysis) {
    const { matchedKeywords, missingKeywords } = jdAnalysis;
    if (missingKeywords?.length > 0) {
      const allText = works.map((w: any) => (w.highlights || []).join(' ')).join(' ');
      const covered = matchedKeywords?.filter((k: string) => allText.includes(k)).length || 0;
      const total = matchedKeywords?.length + missingKeywords?.length;
      jdCoverage = total > 0 ? Math.round((covered / total) * 100) : null;
    }
  }

  return {
    score: Math.max(0, score),
    issues: issues.slice(0, 5),
    jdCoverage,
  };
}

// 模板1：技术岗 - 左侧栏深色
function Template1({ resume }: { resume: any }) {
  const p = resume.profile || {};
  return (
    <div className="flex" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="w-[30%] bg-slate-800 text-white p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{p.name || '姓名'}</h1>
          <p className="text-base text-slate-300 mb-3">{p.titles?.default || '求职目标'}</p>
          <div className="space-y-1 text-sm text-slate-300">
            {p.email && <p>{p.email}</p>}
            {p.phone && <p>{p.phone}</p>}
            {p.location && <p>{p.location}</p>}
            {p.website && <p className="truncate">{p.website}</p>}
          </div>
        </div>
        {(resume.skills || []).length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400">技能</h2>
            <div className="space-y-3">
              {(resume.skills || []).map((cat) => (
                <div key={cat.id}>
                  <p className="text-xs font-medium text-slate-300 mb-1">{cat.category}</p>
                  <div className="flex flex-wrap gap-1">
                    {(cat.skills || []).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                        {s.name}
                        {s.level && <span className="text-slate-400 ml-0.5">{['☆','★','★★','★★★','★★★★','★★★★★'][s.level-1] || ''}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 p-6 bg-white">
        {p.summary && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-2 text-slate-800 border-b border-slate-200 pb-1">个人简介</h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">{p.summary}</p>
          </div>
        )}
        {(resume.work || []).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-800 border-b border-slate-200 pb-1">工作经历</h2>
            <div className="space-y-4">
              {(resume.work || []).map((job) => (
                <div key={job.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div>
                      <span className="font-semibold text-slate-900">{job.position}</span>
                      <span className="text-slate-500"> · {job.company}</span>
                    </div>
                    <span className="text-xs text-slate-400">{job.startDate} - {job.endDate === 'present' ? '至今' : job.endDate}</span>
                  </div>
                  <ul className="space-y-1">
                    {(job.highlights || []).filter(Boolean).map((hl, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span className="leading-relaxed">{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {(resume.education || []).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-800 border-b border-slate-200 pb-1">教育背景</h2>
            <div className="space-y-2">
              {(resume.education || []).map((e) => (
                <div key={e.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline flex-wrap gap-1">
                    <div>
                      <span className="font-semibold text-slate-900">{e.institution}</span>
                      <span className="text-slate-500 ml-2">{e.degree} · {e.field}</span>
                      {e.gpa && <span className="text-xs text-slate-400 ml-2">GPA {e.gpa}</span>}
                    </div>
                    <span className="text-xs text-slate-400">{e.startDate} - {e.endDate}</span>
                  </div>
                  {(e.achievements || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(e.achievements || []).map((a: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {(resume.projects || []).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3 text-slate-800 border-b border-slate-200 pb-1">项目经历</h2>
            <div className="space-y-3">
              {(resume.projects || []).map((proj) => (
                <div key={proj.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-slate-900">{proj.name}</span>
                    {proj.role && <span className="text-xs text-slate-400">{proj.role}</span>}
                  </div>
                  {(proj.technologies || []).length > 0 && (
                    <p className="text-xs text-slate-400 mb-1">技术栈：{(proj.technologies || []).join(' / ')}</p>
                  )}
                  <ul className="space-y-1">
                    {(proj.highlights || []).filter(Boolean).map((hl, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        <span className="leading-relaxed">{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 模板2：金融/咨询 - 传统严谨
function Template2({ resume }: { resume: any }) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-white" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="text-center mb-4 border-b border-slate-300 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{p.name || '姓名'}</h1>
        <p className="text-sm text-slate-600">{p.titles?.default || '求职目标'}</p>
        <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
        </div>
      </div>
      {p.summary && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">个人简介</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{p.summary}</p>
        </div>
      )}
      {(resume.work || []).length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">工作经历</h2>
          {(resume.work || []).map((job) => (
            <div key={job.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-slate-900 text-sm">{job.company}</span>
                <span className="text-xs text-slate-400">{job.startDate} - {job.endDate === 'present' ? '至今' : job.endDate}</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">{job.position}</p>
              {(job.highlights || []).filter(Boolean).map((hl, i) => (
                <p key={i} className="text-xs text-slate-600 leading-relaxed">• {hl}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      {(resume.education || []).length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">教育背景</h2>
          {(resume.education || []).map((e) => (
            <div key={e.id} className="flex justify-between text-xs">
              <span className="text-slate-900">{e.institution} {e.degree} · {e.field}</span>
              <span className="text-slate-400">{e.startDate} - {e.endDate}</span>
            </div>
          ))}
        </div>
      )}
      {(resume.skills || []).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">技能</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {(resume.skills || []).flatMap((cat) =>
              (cat.skills || []).map((s, i) => (
                <span key={i} className="text-slate-600">{s.name}{s.level ? ` ${['☆','★','★★','★★★','★★★★','★★★★★'][s.level-1] || ''}` : ''}</span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 模板3：快消/运营 - 活泼现代
function Template3({ resume }: { resume: any }) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-orange-50" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{p.name || '姓名'}</h1>
          <p className="text-base text-orange-600 font-medium mb-2">{p.titles?.default || '求职目标'}</p>
          <div className="flex gap-3 text-xs text-slate-500">
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>{p.phone}</span>}
            {p.location && <span>{p.location}</span>}
          </div>
        </div>
      </div>
      {p.summary && (
        <div className="mb-4 bg-white rounded-lg p-3">
          <p className="text-sm text-slate-600 leading-relaxed">{p.summary}</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4">
          <h2 className="text-sm font-bold text-orange-600 mb-3">工作经历</h2>
          {(resume.work || []).map((job) => (
            <div key={job.id} className="mb-3">
              <p className="font-medium text-slate-900 text-sm">{job.company} · {job.position}</p>
              <p className="text-xs text-slate-400 mb-1">{job.startDate} - {job.endDate === 'present' ? '至今' : job.endDate}</p>
              {(job.highlights || []).filter(Boolean).map((hl, i) => (
                <p key={i} className="text-xs text-slate-600 leading-relaxed">• {hl}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h2 className="text-sm font-bold text-orange-600 mb-3">教育背景</h2>
            {(resume.education || []).map((e) => (
              <div key={e.id} className="mb-2">
                <p className="font-medium text-slate-900 text-sm">{e.institution}</p>
                <p className="text-xs text-slate-500">{e.degree} · {e.field}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg p-4">
            <h2 className="text-sm font-bold text-orange-600 mb-3">技能</h2>
            {(resume.skills || []).map((cat) => (
              <div key={cat.id} className="mb-2">
                <p className="text-xs font-medium text-slate-700 mb-1">{cat.category}</p>
                <div className="flex flex-wrap gap-1">
                  {(cat.skills || []).map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">{s.name}{s.level ? ` ${['☆','★','★★','★★★','★★★★','★★★★★'][s.level-1] || ''}` : ''}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 模板4：国企/体制内 - 正式传统表格
function Template4({ resume }: { resume: any }) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-white" style={{ minHeight: '297mm', fontFamily: '宋体, serif' }}>
      <table className="w-full text-xs mb-4 border-collapse">
        <tbody>
          <tr>
            <td className="border border-slate-800 p-1 w-16">姓名</td>
            <td className="border border-slate-800 p-1">{p.name || ''}</td>
            <td className="border border-slate-800 p-1 w-16">性别</td>
            <td className="border border-slate-800 p-1 w-20"></td>
          </tr>
          <tr>
            <td className="border border-slate-800 p-1">民族</td>
            <td className="border border-slate-800 p-1"></td>
            <td className="border border-slate-800 p-1">出生年月</td>
            <td className="border border-slate-800 p-1"></td>
          </tr>
          <tr>
            <td className="border border-slate-800 p-1">籍贯</td>
            <td className="border border-slate-800 p-1"></td>
            <td className="border border-slate-800 p-1">政治面貌</td>
            <td className="border border-slate-800 p-1"></td>
          </tr>
          <tr>
            <td className="border border-slate-800 p-1">电话</td>
            <td className="border border-slate-800 p-1">{p.phone || ''}</td>
            <td className="border border-slate-800 p-1">邮箱</td>
            <td className="border border-slate-800 p-1">{p.email || ''}</td>
          </tr>
        </tbody>
      </table>
      {p.summary && (
        <div className="mb-4 text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">个人评价</h2>
          <p className="text-slate-700 leading-relaxed">{p.summary}</p>
        </div>
      )}
      {(resume.work || []).length > 0 && (
        <div className="mb-3 text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">主要学习及工作经历</h2>
          {(resume.work || []).map((job) => (
            <div key={job.id} className="mb-2">
              <p className="text-slate-700">
                {job.startDate} - {job.endDate === 'present' ? '至今' : job.endDate} {job.company} {job.position}
              </p>
              {(job.highlights || []).filter(Boolean).map((hl, i) => (
                <p key={i} className="text-slate-600">• {hl}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      {(resume.education || []).length > 0 && (
        <div className="mb-3 text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">教育背景</h2>
          {(resume.education || []).map((e) => (
            <p key={e.id} className="text-slate-700 text-xs">
              {e.startDate} - {e.endDate} {e.institution} {e.degree} {e.field}
            </p>
          ))}
        </div>
      )}
      {(resume.skills || []).length > 0 && (
        <div className="text-xs">
          <h2 className="font-bold border-b border-slate-800 pb-1 mb-1">特长及其他</h2>
          <p className="text-slate-600">
            {(resume.skills || []).flatMap((cat) => (cat.skills || []).map((s) => s.name)).join('、')}
          </p>
        </div>
      )}
    </div>
  );
}

// 模板5：创意/设计 - 视觉突出
function Template5({ resume }: { resume: any }) {
  const p = resume.profile || {};
  return (
    <div className="p-6 bg-slate-50" style={{ minHeight: '297mm', fontFamily: 'system-ui, sans-serif' }}>
      <div className="grid grid-cols-[200px_1fr] gap-4">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{p.name || '姓名'}</h1>
            <p className="text-sm text-indigo-600 italic">{p.titles?.default || '求职目标'}</p>
          </div>
          {p.email && (
            <div className="text-xs text-slate-500">
              <p className="font-medium text-slate-700 mb-1">联系</p>
              <p>{p.email}</p>
              {p.phone && <p>{p.phone}</p>}
              {p.location && <p>{p.location}</p>}
            </div>
          )}
          {(resume.skills || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">技能</p>
              {(resume.skills || []).map((cat) => (
                <div key={cat.id} className="mb-2">
                  <p className="text-xs font-medium text-slate-600 mb-1">{cat.category}</p>
                  <div className="flex flex-wrap gap-1">
                    {(cat.skills || []).map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{s.name}{s.level ? ` ${['☆','★','★★','★★★','★★★★','★★★★★'][s.level-1] || ''}` : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {(resume.education || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">教育</p>
              {(resume.education || []).map((e) => (
                <div key={e.id} className="text-xs">
                  <p className="font-medium text-slate-700">{e.institution}</p>
                  <p className="text-slate-500">{e.degree} · {e.field}</p>
                  <p className="text-slate-400">{e.startDate}-{e.endDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          {p.summary && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed">{p.summary}</p>
            </div>
          )}
          {(resume.work || []).length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-3">工作经历</h2>
              <div className="space-y-3">
                {(resume.work || []).map((job) => (
                  <div key={job.id} className="border-l-2 border-indigo-200 pl-3">
                    <p className="font-medium text-slate-900 text-sm">{job.position} · {job.company}</p>
                    <p className="text-xs text-slate-400 mb-1">{job.startDate} - {job.endDate === 'present' ? '至今' : job.endDate}</p>
                    {(job.highlights || []).filter(Boolean).map((hl, i) => (
                      <p key={i} className="text-xs text-slate-600 leading-relaxed">• {hl}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {(resume.projects || []).length > 0 && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-3">项目作品</h2>
              <div className="grid grid-cols-2 gap-2">
                {(resume.projects || []).map((proj) => (
                  <div key={proj.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                    <p className="font-medium text-slate-700">{proj.name}</p>
                    {(proj.highlights || []).filter(Boolean).slice(0, 1).map((hl, i) => (
                      <p key={i} className="text-slate-500">{hl}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

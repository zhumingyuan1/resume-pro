'use client';

import { useState } from 'react';

interface Job {
  name: string;
  skills: string[];
  matchLevel: 'direct' | 'near' | 'cross';
  matchScore: number;
  skillGap?: string[];
}

interface MajorMatchResult {
  recommendations: Job[];
  jdAnalysis?: {
    keywords: { hard: string[]; soft: string[] };
    topMatches: { name: string; score: number; matchedSkills: string[] }[];
    missingKeywords: string[];
  };
}

const PRESET_MAJORS = [
  '计算机科学与技术',
  '软件工程',
  '数据科学与大数据技术',
  '人工智能',
  '网络工程',
  '信息安全',
  '物联网工程',
  '通信工程',
  '电子信息工程',
  '自动化',
  '机械工程',
  '车辆工程',
  '工业设计',
  '金融学',
  '会计学/财务管理',
  '工商管理',
  '市场营销',
  '电子商务',
  '物流管理',
  '人力资源管理',
  '信息管理与信息系统',
  '法学',
  '英语',
  '新闻传播学',
  '视觉传达设计',
  '环境设计',
  '产品设计',
  '学前教育',
  '教育学',
  '临床医学',
  '护理学',
];

const MATCH_LEVEL_LABEL: Record<string, { label: string; color: string }> = {
  direct: { label: '直接对口', color: 'bg-green-100 text-green-800' },
  near: { label: '邻近相关', color: 'bg-blue-100 text-blue-800' },
  cross: { label: '跨界转换', color: 'bg-purple-100 text-purple-800' },
};

export default function MajorSelector() {
  const [major, setMajor] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MajorMatchResult | null>(null);
  const [jdText, setJdText] = useState('');

  const handleSearch = async () => {
    if (!major) return;
    setLoading(true);
    try {
      const res = await fetch('/api/major-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ majorName: major }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJDMatch = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/major-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ majorName: major, jdText, userSkills: [] }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">专业 → 岗位推荐</h1>
          <p className="text-slate-500 mt-2">输入你的专业，系统推荐对口岗位 + JD匹配</p>
        </div>

        {/* 专业输入 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">第一步：选择你的专业</h2>
          
          {/* 热门专业快捷选择 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_MAJORS.slice(0, 12).map(m => (
              <button
                key={m}
                onClick={() => setMajor(m)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  major === m 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* 下拉选择 */}
          <div className="flex gap-3">
            <select
              value={major}
              onChange={e => setMajor(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">-- 选择专业 --</option>
              {PRESET_MAJORS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              disabled={!major || loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '分析中...' : '推荐岗位'}
            </button>
          </div>
        </div>

        {/* JD粘贴 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">第二步（可选）：粘贴目标JD</h2>
          <p className="text-sm text-slate-500 mb-3">粘贴招聘信息的JD，获取精准匹配分析</p>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder={"粘贴JD内容，例如：\n- 熟练使用React/Vue\n- 熟悉TypeScript\n- 有大型项目经验优先\n- 团队协作能力强..."}
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
          <button
            onClick={handleJDMatch}
            disabled={!major || !jdText.trim() || loading}
            className="mt-3 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            JD智能匹配
          </button>
        </div>

        {/* 推荐结果 */}
        {result && (
          <div className="space-y-4">
            {/* 岗位推荐 */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  推荐岗位（按匹配度排序）
                </h2>
                <div className="space-y-3">
                  {result.recommendations.map((job, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{job.name}</h3>
                          <div className="flex gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${MATCH_LEVEL_LABEL[job.matchLevel].color}`}>
                              {MATCH_LEVEL_LABEL[job.matchLevel].label}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                              匹配度 {job.matchScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-slate-500 mb-1">岗位技能：</p>
                        <div className="flex flex-wrap gap-1">
                          {job.skills.map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      {job.skillGap && job.skillGap.length > 0 && (
                        <div>
                          <p className="text-xs text-orange-600 mb-1">建议补充：</p>
                          <div className="flex flex-wrap gap-1">
                            {job.skillGap.map(skill => (
                              <span key={skill} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JD分析结果 */}
            {result.jdAnalysis && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">JD智能分析</h2>
                
                {result.jdAnalysis.keywords && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">识别到的关键词：</p>
                    <div className="flex flex-wrap gap-1">
                      {result.jdAnalysis.keywords.hard.map(k => (
                        <span key={k} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.jdAnalysis.missingKeywords && result.jdAnalysis.missingKeywords.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-orange-700 mb-2">缺失的关键词（建议补充）：</p>
                    <div className="flex flex-wrap gap-1">
                      {result.jdAnalysis.missingKeywords.map(k => (
                        <span key={k} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.jdAnalysis.topMatches && result.jdAnalysis.topMatches.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">最匹配的岗位：</p>
                    <div className="space-y-2">
                      {result.jdAnalysis.topMatches.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-800">{m.name}</span>
                          <span className="text-lg font-bold text-blue-600">{m.score}分</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

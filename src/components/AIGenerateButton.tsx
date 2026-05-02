'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import VersionSelector from './VersionSelector';

export default function AIGenerateButton() {
  const { currentResume, updateResume, jdAnalysis } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [versionId, setVersionId] = useState('internet');
  const [showPanel, setShowPanel] = useState(false);

  const handleOptimize = async () => {
    if (!currentResume) return;
    setLoading(true);
    setResult(null);
    setShowPanel(true);

    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: currentResume,
          versionId,
          targetRole: currentResume.profile?.titles?.default,
          jdAnalysis: jdAnalysis ? {
            matchedKeywords: jdAnalysis.matchedKeywords,
            missingKeywords: jdAnalysis.missingKeywords,
            suggestions: jdAnalysis.suggestions,
          } : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setResult({ error: data.error || '优化失败' });
        return;
      }

      const d = data.data;
      // 更新各模块
      if (d.work) {
        updateResume(currentResume.id, { work: d.work });
      }
      if (d.projects) {
        updateResume(currentResume.id, { projects: d.projects });
      }
      if (d.skills) {
        updateResume(currentResume.id, { skills: d.skills });
      }
      if (d.education) {
        const newEdu = (currentResume.education || []).map((e, i) => i === 0 ? { ...e, ...d.education[0] } : e);
        updateResume(currentResume.id, { education: newEdu });
      }
      if (d.summary || d.optimizedSummary) {
        updateResume(currentResume.id, {
          profile: { ...currentResume.profile, summary: d.summary || d.optimizedSummary },
        });
      }

      setResult({
        versionName: data.versionName,
        score: d.overallScore || d.resumeScore || null,
        suggestions: d.overallSuggestions || d.suggestions || [],
      });
    } catch (err: any) {
      setResult({ error: err.message || '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      {/* 版本选择 */}
      <div className="flex items-center gap-2">
        <VersionSelector value={versionId} onChange={setVersionId} />
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? '⏳ 优化中...' : '✨ AI优化'}
        </button>
      </div>

      {/* 结果浮层 */}
      {showPanel && result && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">
              {result.error ? '优化失败' : `✨ ${result.versionName || '简历'}优化完成`}
            </p>
            <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>

          {result.error ? (
            <p className="text-sm text-red-600">{result.error}</p>
          ) : (
            <div className="space-y-3">
              {result.score && (
                <div className="text-center">
                  <div className={`text-3xl font-bold ${
                    result.score >= 70 ? 'text-green-600' :
                    result.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.score}
                  </div>
                  <p className="text-xs text-slate-500">分</p>
                </div>
              )}

              {result.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">改进建议：</p>
                  <ul className="space-y-1">
                    {result.suggestions.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                        <span className="text-purple-500">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!result.score && !result.suggestions?.length && (
                <p className="text-sm text-slate-600">简历已按所选版本优化完成。</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

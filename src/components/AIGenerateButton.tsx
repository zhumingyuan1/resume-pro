'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import VersionSelector from './VersionSelector';

interface ChangeItem {
  field: string;
  before: string;
  after: string;
  type: 'work' | 'project' | 'skill' | 'summary' | 'education';
}

export default function AIGenerateButton() {
  const { currentResume, updateResume, jdAnalysis } = useResumeStore();
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [versionId, setVersionId] = useState('internet');
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!currentResume) return;
    setLoading(true);
    setError(null);
    setChanges([]);
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
        setError(data.error || '优化失败，请稍后重试');
        return;
      }

      const d = data.data;
      if (!d) {
        setError('AI 返回格式异常，请重试');
        return;
      }

      // 记录变更，供用户确认
      const detectedChanges: ChangeItem[] = [];

      // 比对 summary
      const oldSummary = currentResume.profile?.summary || '';
      const newSummary = d.summary || d.optimizedSummary || '';
      if (newSummary && newSummary !== oldSummary) {
        detectedChanges.push({ field: '个人简介', before: oldSummary.slice(0, 40) + (oldSummary.length > 40 ? '...' : ''), after: newSummary.slice(0, 40) + (newSummary.length > 40 ? '...' : ''), type: 'summary' });
        updateResume(currentResume.id, { profile: { ...currentResume.profile, summary: newSummary } });
      }

      // 比对工作经历
      if (d.work?.length > 0) {
        const oldWork = currentResume.work || [];
        if (JSON.stringify(d.work) !== JSON.stringify(oldWork)) {
          detectedChanges.push({
            field: `工作经历（${d.work.length}条）`,
            before: oldWork.length > 0 ? `${oldWork.length}条经历` : '（空）',
            after: `${d.work.length}条经历，已按${data.versionName || '目标版本'}优化`,
            type: 'work',
          });
          updateResume(currentResume.id, { work: d.work });
        }
      }

      // 比对项目经历
      if (d.projects?.length > 0) {
        const oldProj = currentResume.projects || [];
        if (JSON.stringify(d.projects) !== JSON.stringify(oldProj)) {
          detectedChanges.push({
            field: `项目经历（${d.projects.length}条）`,
            before: oldProj.length > 0 ? `${oldProj.length}条项目` : '（空）',
            after: `${d.projects.length}条项目，已优化表达`,
            type: 'project',
          });
          updateResume(currentResume.id, { projects: d.projects });
        }
      }

      // 比对技能
      if (d.skills?.length > 0) {
        const oldSkills = currentResume.skills || [];
        if (JSON.stringify(d.skills) !== JSON.stringify(oldSkills)) {
          detectedChanges.push({
            field: '技能标签',
            before: oldSkills.length > 0 ? `${oldSkills.length}个分类` : '（空）',
            after: `${d.skills.length}个分类，已按行业关键词补充`,
            type: 'skill',
          });
          updateResume(currentResume.id, { skills: d.skills });
        }
      }

      // 比对教育
      if (d.education?.length > 0 && currentResume.education?.length > 0) {
        const newEdu0 = d.education[0];
        const oldEdu0 = currentResume.education[0];
        if (newEdu0 && JSON.stringify(newEdu0) !== JSON.stringify(oldEdu0)) {
          detectedChanges.push({
            field: '教育背景',
            before: `${oldEdu0.institution || ''} ${oldEdu0.degree || ''}`,
            after: `${newEdu0.institution || ''} ${newEdu0.degree || ''}`,
            type: 'education',
          });
          updateResume(currentResume.id, { education: currentResume.education.map((e, i) => i === 0 ? { ...e, ...newEdu0 } : e) });
        }
      }

      // 如果没有任何变更，给提示
      if (detectedChanges.length === 0) {
        setError('简历内容已较完整，AI 未做大幅修改。建议：先完善工作/项目经历的描述，AI 优化空间更大。');
        return;
      }

      setChanges(detectedChanges);
    } catch (err: any) {
      setError('网络错误，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <VersionSelector value={versionId} onChange={setVersionId} />
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              AI 优化中...
            </>
          ) : '✨ AI优化简历'}
        </button>
      </div>

      {/* 结果浮层 */}
      {showPanel && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: error ? '#ef4444' : changes.length > 0 ? '#10b981' : '#f59e0b' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
                {loading ? '优化中...' : error ? '优化未完成' : changes.length > 0 ? '✅ 优化完成' : '⚠️ 无变更'}
              </span>
            </div>
            <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', padding: 0, lineHeight: 1 }}>×</button>
          </div>

          {/* Content */}
          <div style={{ padding: '16px 18px' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>AI 正在分析简历并按所选版本优化...</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>请稍等，通常需要 5-10 秒</div>
              </div>
            )}

            {!loading && error && (
              <div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, marginBottom: 4 }}>⚠️ {error}</div>
                  <div style={{ fontSize: 12, color: '#ef4444' }}>提示：确保简历中已有工作/项目经历，AI 需要有内容才能优化</div>
                </div>
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: '#0369a1', fontWeight: 500, marginBottom: 6 }}>💡 优化建议</div>
                  <ul style={{ fontSize: 12, color: '#075985', paddingLeft: 16, lineHeight: 1.8 }}>
                    <li>先在「工作经历」或「项目经历」中添加1-2条经历</li>
                    <li>经历描述越详细，AI 优化效果越好</li>
                    <li>先跑一遍 JD 分析，AI 会更有针对性</li>
                  </ul>
                </div>
              </div>
            )}

            {!loading && changes.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  AI 对以下 {changes.length} 个部分做了优化：
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {changes.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginBottom: 2 }}>{c.field}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                          <span style={{ color: '#9ca3af' }}>变更前：</span>{c.before}
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.5, marginTop: 2 }}>
                          <span style={{ color: '#10b981' }}>变更后：</span>{c.after}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
                  已自动保存到简历，右侧预览实时更新
                </div>
              </div>
            )}

            {!loading && !error && changes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '12px 0', color: '#6b7280', fontSize: 13 }}>
                未检测到变更
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

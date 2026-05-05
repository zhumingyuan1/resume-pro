'use client';

import { useState, useEffect } from 'react';

interface Job {
  name: string;
  matchLevel: string;
  matchScore: number;
}

interface Props {
  value: string;
  onChange: (major: string) => void;
}

export default function MajorSelector({ value, onChange }: Props) {
  const [majors, setMajors] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  // 初始化：从 API 加载专业列表
  useEffect(() => {
    fetch('/api/major-mapping')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.majors) {
          setMajors(json.data.majors.map((m: any) => m.name));
        }
      })
      .catch(() => {});
  }, []);

  // 选专业后从 API 拉岗位推荐
  useEffect(() => {
    if (!value) { setJobs([]); return; }
    setLoading(true);
    fetch(`/api/major-mapping?major=${encodeURIComponent(value)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.recommendations) {
          setJobs(json.data.recommendations.slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [value]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          专业 <span className="text-red-500">*</span>
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">选择专业</option>
          {majors.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-xs text-slate-400">加载岗位推荐...</p>}

      {jobs.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-blue-700">根据专业推荐岗位（来自数据库）：</p>
          <div className="flex flex-wrap gap-1">
            {jobs.map((j, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {j.name} {j.matchScore && `(${j.matchScore}分)`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

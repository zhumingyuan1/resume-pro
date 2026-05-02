'use client';

import { useState } from 'react';
import { RESUME_VERSIONS, VERSION_LIST } from '@/lib/resume-prompts';

interface VersionSelectorProps {
  value: string;
  onChange: (versionId: string) => void;
}

export default function VersionSelector({ value, onChange }: VersionSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = RESUME_VERSIONS[value as keyof typeof RESUME_VERSIONS];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded text-white text-xs flex items-center justify-center font-bold">
          {current?.icon || 'IT'}
        </span>
        <span className="font-medium text-slate-700">{current?.name || '选择版本'}</span>
        <span className="text-slate-400">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">选择简历优化版本</p>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {VERSION_LIST.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { onChange(v.id); setOpen(false); }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    value === v.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${
                    v.id === 'internet' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
                    v.id === 'state_owned' ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                    v.id === 'foreign' ? 'bg-gradient-to-br from-green-500 to-teal-500' :
                    v.id === 'civil_service' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                    v.id === 'financial' ? 'bg-gradient-to-br from-indigo-500 to-blue-500' :
                    'bg-gradient-to-br from-pink-500 to-rose-500'
                  }`}>
                    {v.icon}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{v.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                  </div>
                  {value === v.id && (
                    <span className="ml-auto text-blue-500 text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400">
                不同版本针对不同企业类型优化，侧重点不同
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

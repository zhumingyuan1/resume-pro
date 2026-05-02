'use client';

import { useResumeStore } from '@/lib/resume-store';

export default function HistoryButtons() {
  const { undo, redo, historyIndex, history } = useResumeStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ↩
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title="重做 (Ctrl+Y)"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ↻
      </button>
    </div>
  );
}

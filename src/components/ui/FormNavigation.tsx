'use client';

import { cn } from '@/lib/utils';

interface Props {
  currentStep: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function FormNavigation({ currentStep, totalSteps, onPrev, onNext }: Props) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={onPrev}
        disabled={isFirst}
        className={cn(
          'px-6 py-3 rounded-lg font-medium transition-colors',
          isFirst
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        )}
      >
        ← 上一步
      </button>

      <span className="text-sm text-slate-500">
        第 {currentStep + 1} / {totalSteps} 步
      </span>

      <button
        onClick={onNext}
        disabled={isLast}
        className={cn(
          'px-6 py-3 rounded-lg font-medium transition-colors',
          isLast
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        )}
      >
        {isLast ? '完成 ✓' : '下一步 →'}
      </button>
    </div>
  );
}

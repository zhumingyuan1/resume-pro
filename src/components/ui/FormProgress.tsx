'use client';

import { cn } from '@/lib/utils';

interface Step {
  id: number;
  name: string;
  description?: string;
}

interface FormProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function FormProgress({ steps, currentStep, onStepClick }: FormProgressProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onStepClick && (isCompleted || index === currentStep + 1);
            
            return (
              <div key={step.id} className="flex items-center">
                {/* 步骤圆圈 */}
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                    isCompleted && 'bg-blue-600 text-white',
                    isCurrent && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    !isCompleted && !isCurrent && 'bg-slate-100 text-slate-400',
                    isClickable && !isCurrent && 'cursor-pointer hover:bg-blue-50',
                    !isClickable && 'cursor-default'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>

                {/* 步骤名称 */}
                <div className="hidden sm:block ml-3">
                  <p className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  )}>
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="text-xs text-slate-400 hidden md:block">{step.description}</p>
                  )}
                </div>

                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-4 min-w-[40px] max-w-[80px]',
                    index < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

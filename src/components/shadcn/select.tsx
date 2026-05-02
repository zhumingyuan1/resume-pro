'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './button';

interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

function Select({ value, onChange, placeholder, children, className }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          'w-full appearance-none h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm',
          'shadow-sm transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400',
          'hover:border-slate-300'
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ===== Dropdown Menu =====
interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface DropdownProps {
  trigger?: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute z-20 top-full mt-1.5 min-w-[160px] rounded-xl border border-slate-200 bg-white p-1 shadow-lg',
              'animate-in fade-in slide-in-from-top-2 duration-150',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <style>{`
              @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
              @keyframes slide-in-from-top-2 { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
              .animate-in { animation: fade-in 0.12s ease-out, slide-in-from-top-2 0.12s ease-out; }
            `}</style>
            {items.map((item, i) =>
              item.separator ? (
                <div key={`sep-${i}`} className="h-px bg-slate-100 my-1" />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.onClick?.(); setOpen(false); }}
                  disabled={item.disabled}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors duration-100',
                    item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-slate-700 hover:bg-slate-50',
                    item.disabled && 'opacity-50 cursor-not-allowed',
                    !item.disabled && item.danger && 'hover:bg-red-50',
                    !item.disabled && !item.danger && 'hover:bg-slate-50'
                  )}
                >
                  {item.icon && <span className="w-4 h-4 flex items-center justify-center text-base">{item.icon}</span>}
                  {item.label}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ===== Tabs =====
interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  className?: string;
}

function Tabs({ value, onChange, tabs, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-slate-100 rounded-xl', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
            value === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {tab.icon && <span className="text-base">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ===== Tooltip =====
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [show, setShow] = React.useState(false);

  const posMap = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 rounded-md bg-slate-900 text-white text-xs whitespace-nowrap pointer-events-none',
            'animate-in fade-in zoom-in-95 duration-100',
            posMap[side]
          )}
        >
          {content}
          <style>{`
            @keyframes zoom-in-95 { from { opacity:0; transform: translateX(-50%) scale(0.96) } to { opacity:1; transform: translateX(-50%) scale(1) } }
          `}</style>
        </div>
      )}
    </div>
  );
}

export {
  Select,
  Dropdown,
  Tabs,
  Tooltip,
};

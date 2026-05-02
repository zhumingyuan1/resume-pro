import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class 合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化日期
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 生成 slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
}

// 计算经历时长
export function calculateDuration(startDate: string, endDate: string | 'present'): string {
  const start = new Date(startDate);
  const end = endDate === 'present' ? new Date() : new Date(endDate);
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${remainingMonths}个月`;
  } else if (remainingMonths === 0) {
    return `${years}年`;
  } else {
    return `${years}年${remainingMonths}个月`;
  }
}

// 估算字数
export function countCharacters(text: string): number {
  return text.replace(/\s/g, '').length;
}

// 截断文本
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

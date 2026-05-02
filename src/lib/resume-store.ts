'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Resume, JdAnalysis } from '@/types/resume';


export interface ResumeStore {
  userId: string;
  currentResume: Resume | null;
  resumes: Resume[];
  currentStep: number;
  aiVersions: Record<string, Resume | undefined>;
  selectedTemplate: string;
  atsResult: {
    score: number;
    breakdown: { format: number; keywords: number; competitiveness: number };
    missingKeywords: string[];
    suggestions: string[];
  } | null;
  jdAnalysis: JdAnalysis | null;   // JD分析结果
  history: Resume[];
  historyIndex: number;
  // 投递追踪
  applications: ApplicationRecord[];
  // 预览编辑模式
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  setCurrentResume: (resume: Resume | null) => void;
  setCurrentStep: (step: number) => void;
  setSelectedTemplate: (template: string) => void;
  setAtsResult: (result: ResumeStore['atsResult'] | null) => void;
  setJdAnalysis: (analysis: JdAnalysis | null) => void;  // 新增
  addResume: (resume: Resume) => void;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
  saveAiVersion: (tone: string, resume: Resume) => void;
  // 投递追踪
  addApplication: (record: ApplicationRecord) => void;
  updateApplication: (id: string, updates: Partial<ApplicationRecord>) => void;
  deleteApplication: (id: string) => void;
  // 快照操作
  pushHistory: (resume: Resume) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export interface ApplicationRecord {
  id: string;
  company: string;
  position: string;
  applicationLink?: string;
  jdSummary?: string;
  resumeVersion: string; // 用哪个版本投递的
  appliedAt: string;
  status: '投递' | '筛选中' | '一面' | '二面' | '三面' | 'OC' | 'offer' | '拒' | '无回音';
  interviewQuestions?: string[]; // 记录面试问题
  notes?: string;
  updatedAt: string;
}

export const emptyResume: Resume = {
  id: '',
  userId: '',
  title: '我的简历',
  slug: 'my-resume',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  profile: { name: '', titles: { default: '' } },
  work: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  achievements: [],
  interests: [],
  references: [],
};

// 生成游客 userId（存 localStorage，保证重启后 ID 不变）
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'resume-pro-user-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const newId = crypto.randomUUID();
  localStorage.setItem(key, newId);
  return newId;
}

const initialState = {
  userId: getOrCreateUserId(),
  currentResume: null as Resume | null,
  resumes: [] as Resume[],
  currentStep: 0,
  aiVersions: {} as Record<string, Resume | undefined>,
  selectedTemplate: 'template-1',
  atsResult: null,
  jdAnalysis: null,
  history: [] as Resume[],
  historyIndex: -1,
  applications: [] as ApplicationRecord[],
  editMode: false,
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentResume: (resume) => {
        const state = get();
        if (resume) {
          set({ currentResume: resume });
          // 新建简历时清空历史
          set({ history: [resume], historyIndex: 0 });
        } else {
          set({ currentResume: null, history: [], historyIndex: -1 });
        }
      },

      setCurrentStep: (step) => set({ currentStep: step }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setAtsResult: (result) => set({ atsResult: result }),
      setJdAnalysis: (analysis) => set({ jdAnalysis: analysis }),

      addResume: (resume) => set((state) => ({
        resumes: [...state.resumes, resume],
      })),

      updateResume: (id, updates) => {
        const state = get();
        const newResume = state.currentResume?.id === id
          ? { ...state.currentResume!, ...updates, updatedAt: new Date().toISOString() }
          : state.currentResume;

        set({
          resumes: state.resumes.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
          currentResume: newResume,
        });

        // 自动保存快照
        if (newResume) {
          get().pushHistory(newResume);
        }
      },

      deleteResume: (id) => set((state) => ({
        resumes: state.resumes.filter((r) => r.id !== id),
        currentResume: state.currentResume?.id === id ? null : state.currentResume,
      })),

      saveAiVersion: (tone, resume) => set((state) => ({
        aiVersions: { ...state.aiVersions, [tone]: resume },
      })),

      // 保存快照（最多50个）
      pushHistory: (resume) => {
        const state = get();
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        const truncated = newHistory.slice(-49); // 最多保留50个
        const updated = [...truncated, resume];
        set({ history: updated, historyIndex: updated.length - 1 });
      },

      // 撤销
      undo: () => {
        const state = get();
        if (state.historyIndex <= 0) return;
        const newIndex = state.historyIndex - 1;
        const previous = state.history[newIndex];
        if (!previous) return;
        set({
          currentResume: previous,
          historyIndex: newIndex,
          resumes: state.resumes.map(r => r.id === previous.id ? previous : r),
        });
      },

      // 重做
      redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;
        const newIndex = state.historyIndex + 1;
        const next = state.history[newIndex];
        if (!next) return;
        set({
          currentResume: next,
          historyIndex: newIndex,
          resumes: state.resumes.map(r => r.id === next.id ? next : r),
        });
      },

      // 投递追踪
      addApplication: (record) => set((state) => ({
        applications: [...state.applications, record],
      })),

      updateApplication: (id, updates) => {
        set((state) => ({
          applications: state.applications.map(a =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },

      deleteApplication: (id) => set((state) => ({
        applications: state.applications.filter(a => a.id !== id),
      })),

      setEditMode: (on) => set({ editMode: on }),

      reset: () => set(initialState),
    }),
    { name: 'resume-storage' }
  )
);

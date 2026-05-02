// ==========================================
// 简历数据模型 - 参考 reactive-resume
// ==========================================

export interface Resume {
  id: string;
  userId: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  
  // 基本信息
  profile: Profile;
  
  // 工作经历
  work: WorkExperience[];
  
  // 教育经历
  education: Education[];
  
  // 技能
  skills: SkillCategory[];
  
  // 项目
  projects: Project[];
  
  // 证书
  certifications: Certification[];
  
  // 语言
  languages: Language[];
  
  // 成就/奖项
  achievements: Achievement[];
  
  // 兴趣爱好
  interests: string[];
  
  // 引用/推荐
  references: Reference[];
  
  // 附加信息
  summary?: string;
  website?: string;
  phone?: string;
  email?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
}

export interface Profile {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  gitee?: string;
  github?: string;
  linkedin?: string;
  summary?: string;
  avatar?: string;
  // 职业标题（多个，用于不同版本）
  titles: {
    default: string;
    foreign?: string;
    startup?: string;
  };
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string | 'present';
  current: boolean;
  summary?: string;
  highlights: string[];
  website?: string;
}

export interface Education {
  id: string;
  institution: string;
  field: string;
  degree: string;
  startDate: string;
  endDate: string;
  current: boolean;
  summary?: string;
  gpa?: string;
  achievements?: string[];
  website?: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: {
    name: string;
    level?: number; // 1-5
    keywords?: string[];
  }[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  highlights: string[];
  technologies: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  role?: string;
  github?: string;
  demo?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
  summary?: string;
}

export interface Language {
  id: string;
  language: string;
  fluency?: string; // e.g., "Native", "Fluent", "Professional"
  level?: number; // 1-5
}

export interface Achievement {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  summary?: string;
  url?: string;
}

export interface Reference {
  id: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  summary?: string;
  available?: boolean;
}

// ==========================================
// 模板相关
// ==========================================

export interface Template {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string;
  category: 'simple' | 'professional' | 'creative' | 'modern';
  tags: string[];
  isPremium: boolean;
  css: string;
  component: string; // React 组件路径
}

// ==========================================
// 用户相关
// ==========================================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  plan: 'free' | 'monthly' | 'yearly';
  createdAt: string;
  
  // 使用统计
  usage: {
    generationsUsed: number;
    generationsLimit: number;
    atsChecksUsed: number;
    atsChecksLimit: number;
    pdfExportsUsed: number;
    pdfExportsLimit: number;
  };
}

// ==========================================
// 订单相关
// ==========================================

export interface Order {
  id: string;
  userId: string;
  plan: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'wechat' | 'alipay' | 'stripe';
  paidAt?: string;
  createdAt: string;
}

// ==========================================
// JD 分析相关
// ==========================================

export interface JdAnalysis {
  jdText: string;
  score: number;
  techScore: number;
  softScore: number;
  quantScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

// ==========================================
// AI 生成相关
// ==========================================

export interface AIGenerationRequest {
  profile: Profile;
  work: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  targetRole?: string;
  tone: 'default' | 'foreign' | 'startup';
}

export interface AIGenerationResult {
  optimizedWork: WorkExperience[];
  optimizedSummary: string;
  suggestions: string[];
}

export interface ATSAnalysisResult {
  score: number; // 0-100
  breakdown: {
    format: number;
    keywords: number;
    competitiveness: number;
  };
  missingKeywords: string[];
  suggestions: string[];
  atsFriendly: boolean;
}

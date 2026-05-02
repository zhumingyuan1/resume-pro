// Supabase Database Types for ResumePro

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'monthly' | 'yearly';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'monthly' | 'yearly';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'monthly' | 'yearly';
          updated_at?: string;
        };
      };

      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          slug: string;
          data: Json; // JSON Resume format
          template_id: string;
          is_public: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          slug?: string;
          data?: Json;
          template_id?: string;
          is_public?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          slug?: string;
          data?: Json;
          template_id?: string;
          is_public?: boolean;
          view_count?: number;
          updated_at?: string;
        };
      };

      resume_versions: {
        Row: {
          id: string;
          resume_id: string;
          version_number: number;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          version_number: number;
          data: Json;
          created_at?: string;
        };
        Update: never;
      };

      templates: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: 'tech' | 'finance' | 'marketing' | 'government' | 'creative';
          thumbnail_url: string | null;
          css: string;
          is_premium: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category: 'tech' | 'finance' | 'marketing' | 'government' | 'creative';
          thumbnail_url?: string | null;
          css?: string;
          is_premium?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          category?: 'tech' | 'finance' | 'marketing' | 'government' | 'creative';
          thumbnail_url?: string | null;
          css?: string;
          is_premium?: boolean;
          is_active?: boolean;
        };
      };

      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'monthly' | 'yearly';
          status: 'active' | 'cancelled' | 'expired';
          started_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: 'monthly' | 'yearly';
          status?: 'active' | 'cancelled' | 'expired';
          started_at?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          plan?: 'monthly' | 'yearly';
          status?: 'active' | 'cancelled' | 'expired';
          expires_at?: string;
        };
      };

      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          action: 'generate' | 'rewrite_default' | 'rewrite_foreign' | 'rewrite_startup' | 'ats_check';
          tokens_used: number;
          cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          action: 'generate' | 'rewrite_default' | 'rewrite_foreign' | 'rewrite_startup' | 'ats_check';
          tokens_used: number;
          cost: number;
          created_at?: string;
        };
        Update: never;
      };

      // 行业JD关键词库
      industry_keywords: {
        Row: {
          id: string;
          industry: string;
          sub_industry: string | null;
          keyword: string;
          keyword_type: 'tech' | 'soft' | 'quant' | 'cert';
          frequency: number;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          industry: string;
          sub_industry?: string | null;
          keyword: string;
          keyword_type: 'tech' | 'soft' | 'quant' | 'cert';
          frequency?: number;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          industry?: string;
          sub_industry?: string | null;
          keyword?: string;
          keyword_type?: 'tech' | 'soft' | 'quant' | 'cert';
          frequency?: number;
          source?: string | null;
        };
      };

      // STAR表达模板库
      star_templates: {
        Row: {
          id: string;
          industry: string;
          dimension: string;
          situation: string;
          task: string;
          action: string;
          result: string;
          example_verbatim: string | null;
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          industry: string;
          dimension: string;
          situation: string;
          task: string;
          action: string;
          result: string;
          example_verbatim?: string | null;
          usage_count?: number;
          created_at?: string;
        };
        Update: {
          industry?: string;
          dimension?: string;
          situation?: string;
          task?: string;
          action?: string;
          result?: string;
          example_verbatim?: string | null;
          usage_count?: number;
        };
      };

      // 简历模板元数据
      resume_templates: {
        Row: {
          id: string;
          template_key: string;
          name: string;
          description: string;
          target_industry: string[];
          target_experience: string[];
          preview_url: string | null;
          usage_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_key: string;
          name: string;
          description?: string;
          target_industry?: string[];
          target_experience?: string[];
          preview_url?: string | null;
          usage_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          template_key?: string;
          name?: string;
          description?: string;
          target_industry?: string[];
          target_experience?: string[];
          preview_url?: string | null;
          usage_count?: number;
          is_active?: boolean;
        };
      };
    };
  };
}

-- ==========================================
-- 简历Pro - JD关键词库同步
-- 迁移脚本 v4.0
-- 在 Supabase SQL Editor 中执行
-- ==========================================

-- 1. 确保 jobs 表存在（如 002 未执行，先建它）
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  required_skills TEXT[],
  bonus_skills TEXT[],
  salary_range TEXT,
  job_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 确保 jd_keywords 表存在
CREATE TABLE IF NOT EXISTS public.jd_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_code TEXT NOT NULL,
  keyword_category TEXT NOT NULL CHECK (keyword_category IN ('hard_skill', 'soft_skill', 'experience', 'quantitative')),
  keyword TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_code, keyword_category, keyword)
);

-- 3. 创建索引（如尚不存在）
CREATE INDEX IF NOT EXISTS idx_jd_keywords_job_code ON public.jd_keywords(job_code);
CREATE INDEX IF NOT EXISTS idx_jd_keywords_category ON public.jd_keywords(keyword_category);
CREATE INDEX IF NOT EXISTS idx_jobs_code ON public.jobs(code);

-- 4. 开放读取权限（公开数据）
DROP POLICY IF EXISTS "Anyone can view jobs" ON public.jobs;
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view jd_keywords" ON public.jd_keywords;
CREATE POLICY "Anyone can view jd_keywords" ON public.jd_keywords FOR SELECT USING (true);

-- 5. 验证
SELECT 'jobs table row count: ' || COUNT(*) FROM public.jobs;
SELECT 'jd_keywords table row count: ' || COUNT(*) FROM public.jd_keywords;

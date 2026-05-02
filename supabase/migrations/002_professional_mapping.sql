-- ==========================================
-- 简历Pro - 专业岗位映射数据库
-- 建表脚本 v2.0
-- ==========================================

-- 1. 专业表
CREATE TABLE IF NOT EXISTS public.majors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,        -- 专业代码，如 080901
  name TEXT NOT NULL,               -- 专业名称，如 计算机科学与技术
  category TEXT NOT NULL,           -- 学科门类，如 工学
  sub_category TEXT NOT NULL,        -- 专业大类，如 计算机类
  traits TEXT[],                   -- 学科特征，如 ['逻辑思维','编程','数学']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 岗位表
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,        -- 岗位代码
  name TEXT NOT NULL,               -- 岗位名称
  category TEXT NOT NULL,            -- 行业分类，如 互联网
  sub_category TEXT NOT NULL,       -- 岗位分类，如 前端开发
  required_skills TEXT[],            -- 必备技能
  bonus_skills TEXT[],              -- 加分技能
  salary_range TEXT,                -- 薪资范围，如 15-30K
  job_count INTEGER,                -- 年均岗位数
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 专业-岗位映射表
CREATE TABLE IF NOT EXISTS public.major_job_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  major_code TEXT REFERENCES public.majors(code) ON DELETE CASCADE,
  job_code TEXT REFERENCES public.jobs(code) ON DELETE CASCADE,
  match_level TEXT NOT NULL CHECK (match_level IN ('direct', 'near', 'cross')),
  match_score INTEGER NOT NULL CHECK (match_score >= 1 AND match_score <= 5),
  skill_gap TEXT[],                -- 需要补充的技能
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(major_code, job_code)
);

-- 4. 学习路径表
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_code TEXT REFERENCES public.jobs(code) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,          -- 技能名称
  priority INTEGER DEFAULT 1,        -- P0/P1/P2
  learning_time TEXT,                -- 预估学习时间
  resources_free TEXT[],            -- 免费资源
  resources_paid TEXT[],            -- 付费资源
  week_number INTEGER,              -- 建议第几周学习
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 学长学姐去向表
CREATE TABLE IF NOT EXISTS public.alumni_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_tier TEXT NOT NULL CHECK (school_tier IN ('985', '211', '普通本科', '专科')),
  major_code TEXT REFERENCES public.majors(code) ON DELETE CASCADE,
  top_companies JSONB DEFAULT '[]',  -- [{"name": "字节跳动", "ratio": 18}, ...]
  industry_distribution JSONB DEFAULT '[]',  -- [{"name": "互联网", "ratio": 65}, ...]
  city_distribution JSONB DEFAULT '[]',  -- [{"name": "一线", "ratio": 60}, ...]
  avg_salary TEXT,                  -- 平均薪资
  salary_by_company JSONB DEFAULT '{}',  -- {"字节跳动": "30-45K", ...}
  sample_size INTEGER,              -- 样本量
  year INTEGER,                     -- 数据年份，如 2024
  source TEXT,                      -- 数据来源
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. JD关键词库表
CREATE TABLE IF NOT EXISTS public.jd_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_code TEXT REFERENCES public.jobs(code) ON DELETE CASCADE,
  keyword_category TEXT NOT NULL CHECK (keyword_category IN ('hard_skill', 'soft_skill', 'experience', 'quantitative')),
  keyword TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,      -- 出现频率
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_code, keyword_category, keyword)
);

-- 7. JD匹配记录表（用于分析）
CREATE TABLE IF NOT EXISTS public.jd_match_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  jd_text TEXT,                    -- 用户粘贴的原始JD
  matched_job_code TEXT,
  match_score INTEGER,             -- 匹配度 0-100
  missing_keywords TEXT[],         -- 缺失关键词
  suggestions TEXT[],             -- 建议
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_major_job_mapping_major ON public.major_job_mapping(major_code);
CREATE INDEX IF NOT EXISTS idx_major_job_mapping_job ON public.major_job_mapping(job_code);
CREATE INDEX IF NOT EXISTS idx_learning_paths_job ON public.learning_paths(job_code);
CREATE INDEX IF NOT EXISTS idx_alumni_stats_major ON public.alumni_stats(major_code);
CREATE INDEX IF NOT EXISTS idx_jd_keywords_job ON public.jd_keywords(job_code);
CREATE INDEX IF NOT EXISTS idx_jd_match_logs_user ON public.jd_match_logs(user_id);

-- RLS
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_job_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jd_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jd_match_logs ENABLE ROW LEVEL SECURITY;

-- 公开读取（不需要登录）
CREATE POLICY "Anyone can view majors" ON public.majors FOR SELECT USING (true);
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can view job mappings" ON public.major_job_mapping FOR SELECT USING (true);
CREATE POLICY "Anyone can view learning paths" ON public.learning_paths FOR SELECT USING (true);
CREATE POLICY "Anyone can view alumni stats" ON public.alumni_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view jd keywords" ON public.jd_keywords FOR SELECT USING (true);

-- 写入需要登录
CREATE POLICY "Users can insert match logs" ON public.jd_match_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

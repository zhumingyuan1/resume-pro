-- ==========================================
-- ResumePro 数据库建表脚本
-- 在 Supabase SQL Editor 中执行
-- ==========================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 简历表
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT '我的简历',
  slug TEXT DEFAULT '',
  data JSONB DEFAULT '{}',
  template_id TEXT DEFAULT 'template-1',
  is_public BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 简历版本快照
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 模板表
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT DEFAULT 'tech' CHECK (category IN ('tech', 'finance', 'marketing', 'government', 'creative')),
  thumbnail_url TEXT,
  css TEXT DEFAULT '',
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 订阅表
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI使用日志
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('generate', 'rewrite_default', 'rewrite_foreign', 'rewrite_startup', 'ats_check')),
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 索引
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON public.resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的数据
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 简历：用户只能看自己的
CREATE POLICY "Users can view own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

-- 简历版本跟随简历
CREATE POLICY "Users can view own resume versions" ON public.resume_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.resumes WHERE id = resume_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own resume versions" ON public.resume_versions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.resumes WHERE id = resume_id AND user_id = auth.uid())
  );

-- 模板：所有人可看
CREATE POLICY "Anyone can view active templates" ON public.templates
  FOR SELECT USING (is_active = TRUE);

-- 订阅
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI日志
CREATE POLICY "Users can view own AI logs" ON public.ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI logs" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 插入默认模板
-- ==========================================
INSERT INTO public.templates (id, name, slug, category, is_premium, css) VALUES
  ('template-1', '简约白', 'jian-yue-bai', 'tech', FALSE, ''),
  ('template-2', '经典蓝', 'jing-dian-lan', 'tech', FALSE, ''),
  ('template-3', '创意绿', 'chuang-yi-lu', 'marketing', FALSE, ''),
  ('template-4', '商务灰', 'shang-wu-hui', 'finance', FALSE, ''),
  ('template-5', '活力橙', 'huo-li-cheng', 'marketing', FALSE, '')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 开启 Realtime（可选）
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.resumes;

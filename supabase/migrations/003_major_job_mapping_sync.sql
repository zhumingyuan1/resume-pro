-- ==========================================
-- 简历Pro - 专业-岗位映射数据同步
-- 将 D:盘 07-专业岗位映射 数据同步到 Supabase
-- 执行方式：在 Supabase SQL Editor 中执行，或由 sync-major-mapping.ts 脚本调用
-- ==========================================

-- 说明：
-- 002_professional_mapping.sql 已定义了以下核心表：
--   majors, jobs, major_job_mapping, learning_paths, alumni_stats, jd_keywords
-- 本文件定义辅助结构（视图、函数），方便前端查询

-- ==========================================
-- 视图：专业完整信息（含映射岗位）
-- ==========================================
CREATE OR REPLACE VIEW public.v_major_full_info AS
SELECT
  m.id,
  m.code AS major_code,
  m.name AS major_name,
  m.category AS major_category,
  m.sub_category,
  m.traits,
  (
    SELECT COALESCE(json_agg(jm_row), '[]'::json)
    FROM (
      SELECT
        jm.job_code,
        j.name AS job_name,
        j.category AS job_category,
        jm.match_level,
        jm.match_score,
        jm.skill_gap,
        jm.note
      FROM public.major_job_mapping jm
      JOIN public.jobs j ON j.code = jm.job_code
      WHERE jm.major_code = m.code
    ) AS jm_row
  ) AS job_mappings,
  (
    SELECT COALESCE(json_agg(lp_row), '[]'::json)
    FROM (
      SELECT lp.skill_name, lp.priority, lp.learning_time, lp.resources_free, lp.week_number
      FROM public.learning_paths lp
      JOIN public.jobs j ON j.code = lp.job_code
      JOIN public.major_job_mapping jm ON jm.job_code = j.code
      WHERE jm.major_code = m.code
      ORDER BY lp.week_number, lp.priority
      LIMIT 20
    ) AS lp_row
  ) AS learning_paths
FROM public.majors m;

-- ==========================================
-- 视图：岗位完整信息（含关联专业）
-- ==========================================
CREATE OR REPLACE VIEW public.v_job_full_info AS
SELECT
  j.id,
  j.code AS job_code,
  j.name AS job_name,
  j.category AS job_category,
  j.sub_category,
  j.required_skills,
  j.bonus_skills,
  j.salary_range,
  j.job_count,
  (
    SELECT COALESCE(json_agg(m_row), '[]'::json)
    FROM (
      SELECT m.code AS major_code, m.name AS major_name, jm.match_level, jm.match_score
      FROM public.major_job_mapping jm
      JOIN public.majors m ON m.code = jm.major_code
      WHERE jm.job_code = j.code
      ORDER BY jm.match_score DESC
    ) AS m_row
  ) AS related_majors
FROM public.jobs j;

-- ==========================================
-- 函数：upsert 专业数据（用于同步脚本）
-- ==========================================
CREATE OR REPLACE FUNCTION public.upsert_major(
  p_code TEXT,
  p_name TEXT,
  p_category TEXT,
  p_sub_category TEXT,
  p_traits TEXT[]
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.majors (code, name, category, sub_category, traits)
  VALUES (p_code, p_name, p_category, p_sub_category, p_traits)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    traits = EXCLUDED.traits;
END;
$$;

-- ==========================================
-- 函数：upsert 岗位数据（用于同步脚本）
-- ==========================================
CREATE OR REPLACE FUNCTION public.upsert_job(
  p_code TEXT,
  p_name TEXT,
  p_category TEXT,
  p_sub_category TEXT,
  p_required_skills TEXT[],
  p_bonus_skills TEXT[],
  p_salary_range TEXT,
  p_job_count INTEGER
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.jobs (code, name, category, sub_category, required_skills, bonus_skills, salary_range, job_count)
  VALUES (p_code, p_name, p_category, p_sub_category, p_required_skills, p_bonus_skills, p_salary_range, p_job_count)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    required_skills = EXCLUDED.required_skills,
    bonus_skills = EXCLUDED.bonus_skills,
    salary_range = EXCLUDED.salary_range,
    job_count = EXCLUDED.job_count;
END;
$$;

-- ==========================================
-- 函数：upsert 专业-岗位映射（用于同步脚本）
-- ==========================================
CREATE OR REPLACE FUNCTION public.upsert_major_job_mapping(
  p_major_code TEXT,
  p_job_code TEXT,
  p_match_level TEXT,
  p_match_score INTEGER,
  p_skill_gap TEXT[],
  p_note TEXT
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.major_job_mapping
    (major_code, job_code, match_level, match_score, skill_gap, note)
  VALUES (p_major_code, p_job_code, p_match_level, p_match_score, p_skill_gap, p_note)
  ON CONFLICT (major_code, job_code) DO UPDATE SET
    match_level = EXCLUDED.match_level,
    match_score = EXCLUDED.match_score,
    skill_gap = EXCLUDED.skill_gap,
    note = EXCLUDED.note;
END;
$$;

-- ==========================================
-- 函数：upsert 学习路径（用于同步脚本）
-- ==========================================
CREATE OR REPLACE FUNCTION public.upsert_learning_path(
  p_job_code TEXT,
  p_skill_name TEXT,
  p_priority INTEGER,
  p_learning_time TEXT,
  p_resources_free TEXT[],
  p_resources_paid TEXT[],
  p_week_number INTEGER
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.learning_paths
    (job_code, skill_name, priority, learning_time, resources_free, resources_paid, week_number)
  VALUES (p_job_code, p_skill_name, p_priority, p_learning_time, p_resources_free, p_resources_paid, p_week_number)
  ON CONFLICT (job_code, skill_name) DO UPDATE SET
    priority = EXCLUDED.priority,
    learning_time = EXCLUDED.learning_time,
    resources_free = EXCLUDED.resources_free,
    resources_paid = EXCLUDED.resources_paid,
    week_number = EXCLUDED.week_number;
END;
$$;

-- ==========================================
-- 授予 public 访问权限（sync脚本用 service_role key）
-- ==========================================
GRANT EXECUTE ON FUNCTION public.upsert_major TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_job TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_major_job_mapping TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_learning_path TO anon, authenticated, service_role;

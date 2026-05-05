-- ==========================================
-- 简历Pro - 专业映射同步脚本 + RPC函数
-- 在 Supabase SQL Editor 中执行
-- ==========================================

-- 1. RPC函数（同步脚本依赖这些函数）
CREATE OR REPLACE FUNCTION public.upsert_major(
  p_code TEXT, p_name TEXT, p_category TEXT, p_sub_category TEXT, p_traits TEXT[]
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.majors (code, name, category, sub_category, traits)
  VALUES (p_code, p_name, p_category, p_sub_category, p_traits)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category, traits = EXCLUDED.traits;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_job(
  p_code TEXT, p_name TEXT, p_category TEXT, p_sub_category TEXT,
  p_required_skills TEXT[], p_bonus_skills TEXT[],
  p_salary_range TEXT, p_job_count INTEGER
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.jobs (code, name, category, sub_category, required_skills, bonus_skills, salary_range, job_count)
  VALUES (p_code, p_name, p_category, p_sub_category, p_required_skills, p_bonus_skills, p_salary_range, p_job_count)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, category = EXCLUDED.category, sub_category = EXCLUDED.sub_category,
    required_skills = EXCLUDED.required_skills, bonus_skills = EXCLUDED.bonus_skills,
    salary_range = EXCLUDED.salary_range, job_count = EXCLUDED.job_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_major_job_mapping(
  p_major_code TEXT, p_job_code TEXT, p_match_level TEXT,
  p_match_score INTEGER, p_skill_gap TEXT[], p_note TEXT
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.major_job_mapping (major_code, job_code, match_level, match_score, skill_gap, note)
  VALUES (p_major_code, p_job_code, p_match_level, p_match_score, p_skill_gap, p_note)
  ON CONFLICT (major_code, job_code) DO UPDATE SET
    match_level = EXCLUDED.match_level, match_score = EXCLUDED.match_score,
    skill_gap = EXCLUDED.skill_gap, note = EXCLUDED.note;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_learning_path(
  p_job_code TEXT, p_skill_name TEXT, p_priority INTEGER,
  p_learning_time TEXT, p_resources_free TEXT[], p_resources_paid TEXT[], p_week_number INTEGER
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.learning_paths (job_code, skill_name, priority, learning_time, resources_free, resources_paid, week_number)
  VALUES (p_job_code, p_skill_name, p_priority, p_learning_time, p_resources_free, p_resources_paid, p_week_number)
  ON CONFLICT (job_code, skill_name) DO UPDATE SET
    priority = EXCLUDED.priority, learning_time = EXCLUDED.learning_time,
    resources_free = EXCLUDED.resources_free, resources_paid = EXCLUDED.resources_paid, week_number = EXCLUDED.week_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_major TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_job TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_major_job_mapping TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_learning_path TO anon, authenticated, service_role;

# 简历Pro — D:盘数据资产与 Supabase 联动方案

> 版本：v1.0  
> 日期：2026-05-03  
> 状态：**推荐方案已确定，MVP已实现**

---

## 一、现状分析

### 1.1 D:盘数据资产结构

| 目录 | 内容 | 文件格式 | 体积 |
|------|------|----------|------|
| `01-JD关键词库\` | 5个岗位的JD关键词 | `.md` / `.json` | 小 |
| `02-Prompt库\` | 大厂/外企/创业版Prompt | `.md` | 中 |
| `03-模板资源\` | 4个开源模板 + 5套设计规范 | `.html` / `.css` / `.md` | 大 |
| `04-数据结构参考\` | JSON Resume 标准格式 | `.json` | 小 |
| `07-专业岗位映射\` | 专业数据库 + 映射表 + 学习路径 | `.md` | 中 |

**D:盘优点：**
- 人类可读，便于版本控制（直接 Git 管理）
- 可在任意编辑器中修改，无需工具链
- 不依赖网络，随时可用
- 完全可控，无供应商锁定

**D:盘缺点：**
- 无法提供 API 查询，只能整文件读取
- 无权限控制，任何人都能改
- 无变更历史记录
- 无法实时协作
- 跨设备同步困难（依赖网盘/硬盘）

### 1.2 Supabase 现有表结构

已在 `001_initial_schema.sql` + `002_professional_mapping.sql` 中建好以下表：

```
public.users           — 用户表
public.resumes         — 简历主表
public.resume_versions  — 简历快照
public.templates       — 模板表
public.subscriptions    — 订阅表
public.ai_usage_logs    — AI使用日志
public.majors           — 专业表（含代码/分类/特征）
public.jobs             — 岗位表（含技能/薪资/数量）
public.major_job_mapping — 专业-岗位映射（匹配度/技能差距）
public.learning_paths   — 学习路径（技能/资源/时间）
public.alumni_stats     — 学长学姐去向
public.jd_keywords      — JD关键词库
public.jd_match_logs    — JD匹配记录
```

**Supabase 优点：**
- RESTful API 开箱即用
- 支持 Row Level Security（RLS）
- 有 Realtime、Edge Functions 等扩展
- 跨设备、跨平台一致访问
- 支持复杂查询、关联查询

**Supabase 缺点：**
- 需要网络连接（离线不可用）
- 免费额度有限（Hibernate 后需确认）
- 结构变更（Schema Migration）需要流程
- 字段类型约束严格，灵活度低于 JSON 文件

---

## 二、联动策略（三种方案对比）

### 方案A：D:盘为主，Supabase 做缓存

**原理：** D:盘 JSON/MD 文件作为 Source of Truth，启动时（或手动）解析导入 Supabase，Supabase 仅作只读查询缓存。

```
D:盘(.md/.json)  →  解析脚本  →  Supabase表（只写一次）
                                   ↓
                              前端读API（只读）
```

**优点：**  
- D:盘是人类编辑的唯一真相，便于版本控制  
- Supabase 查询性能好，支持复杂关联查询  
- 数据更新可通过脚本幂等重跑，不影响D:盘  

**缺点：**  
- 需要手动/定时运行同步脚本  
- 数据更新有延迟（不是实时）  
- 如果 Supabase 被清空，需要完整重建  

**适用场景：** 结构化的、经常查询的数据（如专业-岗位映射、JD关键词库）

---

### 方案B：Supabase 为主，D:盘做离线备份

**原理：** 所有写入走 Supabase，定期将指定表导出为 JSON 文件备份到 D:盘。

```
用户操作  →  Supabase写入  →  定时Job  →  D:盘.json备份
```

**优点：**  
- 写入实时，用户操作立即生效  
- D:盘备份保障数据安全（可版本化为 Git 提交）  
- 符合"数据库是真相"的现代架构  

**缺点：**  
- D:盘备份是单向的（数据库坏了不能直接拿D:盘恢复）  
- 需要额外 Job 保障备份频率  
- 多人同时写 D:盘备份可能冲突  

**适用场景：** 用户生成的简历数据、AI使用日志等用户内容

---

### 方案C：混合模式（推荐）

**原理：** 按数据性质决定存储位置：

| 数据类型 | 存储位置 | 原因 |
|----------|----------|------|
| 简历内容（用户生成） | Supabase | 实时写入、权限控制、多设备同步 |
| 专业/岗位/映射（参考数据） | D:盘 → Supabase | 人类编辑为主，查询为主 |
| Prompt模板（内容文件） | D:盘 | 人类编辑，体积大 |
| 设计模板（CSS/HTML） | D:盘 → CDN | 静态资源，版本化 |
| AI使用日志 | Supabase | 机器生成，结构化，需要分析 |
| 学习路径数据 | D:盘 → Supabase | 人类编辑，查询为主 |

**实施策略：**
- D:盘作为**内容编辑源**（内容团队直接修改 .md 文件）
- 同步脚本将 D:盘内容**发布到 Supabase**（类似 CMS 的 Publish 流程）
- 前端只从 Supabase 读取（统一 API，降低耦合）
- D:盘文件通过 Git 做版本历史

---

## 三、推荐方案：混合模式（方案C）

**理由：**

1. **符合现状** — D:盘数据已经存在，且是人工维护的
2. **最小破坏** — 不改变现有 Supabase 表结构，只新增表
3. **可渐进** — 可以先只同步专业-岗位映射这个 MVP，后续逐步扩展
4. **职责清晰** — D:盘管内容，Supabase 管服务，前端只依赖 API

---

## 四、落地步骤

### 第一步（已完成 ✅）：MVP — 专业-岗位映射同步

**目标：** 把 D:盘 `07-专业岗位映射\` 下的数据同步到 Supabase。

**交付物：**
- `supabase/migrations/003_major_job_mapping.sql` — 已在 002 中定义，新建辅助视图
- `scripts/sync-major-mapping.ts` — Node.js 同步脚本
- `src/app/api/major-mapping/route.ts` — API 路由（替换硬编码数据）
- `src/app/major/page.tsx` — 已接入 API

---

### 第二步（待做）：扩展 — JD关键词库同步

**目标：** 把 `01-JD关键词库\` 同步到 `jd_keywords` 表。

**脚本逻辑：** 读取 D:盘 JD关键词文件 → 解析岗位 + 关键词 + 频率 → 写入 Supabase

---

### 第三步（待做）：Prompt 库 + 模板资源

**目标：** 
- Prompt 库：作为静态资源，在 Next.js 中直接 import
- 设计模板：发布到 CDN 或存入 `public/templates/`

---

### 第四步（待做）：离线备份 Job

**目标：** 定期将 Supabase 中用户数据（简历、AI日志）备份到 D:盘。

**实现方式：** 在 Supabase Edge Function 或外部 cron job 中运行 `pg_dump` + 写入 D:盘

---

## 五、数据迁移 SQL 摘要

```sql
-- 003_migration.sql（新增辅助结构）

-- 视图：方便前端查询专业+映射+学习路径
CREATE OR REPLACE VIEW v_major_full_info AS
SELECT 
  m.id,
  m.code,
  m.name,
  m.category,
  m.sub_category,
  m.traits,
  COALESCE(
    json_agg(
      json_build_object(
        'job_code', jm.job_code,
        'match_level', jm.match_level,
        'match_score', jm.match_score,
        'skill_gap', jm.skill_gap
      )
    ) FILTER (WHERE jm.id IS NOT NULL),
    '[]'
  ) as job_mappings
FROM majors m
LEFT JOIN major_job_mapping jm ON jm.major_code = m.code
GROUP BY m.id, m.code, m.name, m.category, m.sub_category, m.traits;

-- 同步用的 upsert 函数（由脚本调用）
CREATE OR REPLACE FUNCTION sync_major_mapping(
  p_major_code TEXT,
  p_major_name TEXT,
  p_category TEXT,
  p_sub_category TEXT,
  p_target_jobs JSONB,
  p_related_jobs JSONB,
  p_learning_path JSONB,
  p_source TEXT DEFAULT 'D:盘同步'
) RETURNS void AS $$
BEGIN
  INSERT INTO major_job_mapping_raw 
    (major_code, major_name, category, sub_category, target_jobs, related_jobs, learning_path, source)
  VALUES (p_major_code, p_major_name, p_category, p_sub_category, p_target_jobs, p_related_jobs, p_learning_path, p_source)
  ON CONFLICT (major_code) DO UPDATE SET
    target_jobs = EXCLUDED.target_jobs,
    related_jobs = EXCLUDED.related_jobs,
    learning_path = EXCLUDED.learning_path,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 六、跨盘符路径兼容性说明

在 Windows 系统上，D:盘路径直接写 `D:\简历Pro-数据资产\` 即可。  
Node.js 的 `fs` 模块在 Windows 上原生支持该路径。

如需在 Linux/Mac 环境运行（未来可能），需做路径兼容处理：

```typescript
const DATA_ROOT = process.env.DATA_ASSET_PATH 
  || (process.platform === 'win32' ? 'D:\\简历Pro-数据资产\\' : '/mnt/data/简历Pro-数据资产/');
```

MVP 阶段只需兼容 Windows，路径写死在脚本中。

'use client';

const MAJOR_JOB_MAP: Record<string, { jobs: string[]; skills: string[] }> = {
  '计算机科学与技术': {
    jobs: ['前端开发工程师', '后端开发工程师', '算法工程师', '测试工程师', '运维工程师', '全栈工程师'],
    skills: ['React/Vue', 'TypeScript', 'Node.js', 'SQL', 'Git'],
  },
  '软件工程': {
    jobs: ['前端开发工程师', '后端开发工程师', '软件测试工程师', '实施工程师', '技术支持工程师'],
    skills: ['Java/Python', 'Git', 'SQL', '软件工程基础'],
  },
  '数据科学与大数据技术': {
    jobs: ['数据分析师', '大数据开发工程师', 'BI工程师', 'ETL工程师', '数据产品经理'],
    skills: ['Python', 'SQL', 'Hive', 'Spark', 'Tableau'],
  },
  '人工智能': {
    jobs: ['算法工程师', 'NLP工程师', 'CV工程师', 'AI产品经理', 'AI工程师'],
    skills: ['Python', 'TensorFlow/PyTorch', '机器学习', '深度学习', '论文阅读'],
  },
  '金融学': {
    jobs: ['银行柜员', '银行客户经理', '证券分析师', '基金销售', '金融科技产品经理'],
    skills: ['金融知识', 'Excel', 'PPT', 'Wind终端'],
  },
  '会计学/财务管理': {
    jobs: ['会计', '审计专员', '税务专员', '财务专员', '风控专员'],
    skills: ['会计准则', '金蝶/用友', 'Excel', 'SAP'],
  },
  '工商管理': {
    jobs: ['管培生', '运营专员', '行政专员', 'HR专员', '产品经理助理'],
    skills: ['PPT', 'Excel', '项目管理', '沟通表达'],
  },
  '市场营销': {
    jobs: ['市场专员', '品牌专员', 'BD经理', '运营专员', '电商运营'],
    skills: ['文案写作', '活动策划', '数据分析', '媒介投放'],
  },
  '新闻传播学': {
    jobs: ['新媒体运营', '编辑', '编导', '内容运营', '品牌专员'],
    skills: ['内容策划', '文案写作', '社交媒体运营', '数据分析'],
  },
  '视觉传达设计': {
    jobs: ['UI设计师', '视觉设计师', '平面设计师', '插画师', '品牌设计师'],
    skills: ['Figma', 'Photoshop', 'Illustrator', '配色/排版'],
  },
  '法学': {
    jobs: ['律师助理', '法务专员', '合规专员', '知识产权专员', '书记员'],
    skills: ['法律研究', '文书起草', '合同审核', '尽职调查'],
  },
  '英语': {
    jobs: ['英语老师', '翻译', '外贸专员', '跨境电商运营', '海外BD'],
    skills: ['英语专八/雅思', '跨文化沟通', '商务英语', '文稿撰写'],
  },
  '学前教育': {
    jobs: ['幼儿教师', '课程设计师', '教学督导', '培训专员'],
    skills: ['幼儿教学', '游戏设计', '家园沟通', '课件制作'],
  },
};

const MAJORS = Object.keys(MAJOR_JOB_MAP);

interface Props {
  value: string;
  onChange: (major: string) => void;
}

export default function MajorSelector({ value, onChange }: Props) {
  const entry = value ? MAJOR_JOB_MAP[value] : null;
  const jobs = entry?.jobs || [];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          专业 <span className="text-red-500">*</span>
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">选择专业</option>
          {MAJORS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {jobs.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium text-blue-700">根据专业推荐岗位：</p>
          <div className="flex flex-wrap gap-1">
            {jobs.map(j => (
              <span key={j} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{j}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed';
export type TicketPriority = 'high' | 'medium' | 'low';

export type TicketEscalationMeta = {
  level: 1 | 2 | 3;
  reason: string;
  at: string;
};

export type Ticket = {
  id: string;
  title: string;
  customerId: string;
  customer: string;
  category: string;
  owner: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  dueAt: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  summary: string;
  escalation?: TicketEscalationMeta;
};

export type CustomerTier = 'A' | 'B' | 'C';

export type Customer = {
  id: string;
  name: string;
  industry: string;
  tier: CustomerTier;
  owner: string;
  contact: string;
  phone: string;
  email: string;
  satisfaction: number;
};

export type Agent = {
  id: string;
  name: string;
  team: string;
  status: 'online' | 'busy' | 'offline';
  avgResponseMinutes: number;
  handledToday: number;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  tags: string[];
  updatedAt: string;
  content: string;
};

export const agents: Agent[] = [
  { id: 'AG-01', name: '林冉', team: '一线支持', status: 'online', avgResponseMinutes: 12, handledToday: 9 },
  { id: 'AG-02', name: '周岚', team: '一线支持', status: 'busy', avgResponseMinutes: 14, handledToday: 11 },
  { id: 'AG-03', name: '吴桥', team: '一线支持', status: 'online', avgResponseMinutes: 10, handledToday: 8 },
  { id: 'AG-04', name: '许诺', team: '二线支持', status: 'busy', avgResponseMinutes: 16, handledToday: 7 },
  { id: 'AG-05', name: '孟晨', team: '二线支持', status: 'online', avgResponseMinutes: 15, handledToday: 6 },
  { id: 'AG-06', name: '顾庭', team: '二线支持', status: 'offline', avgResponseMinutes: 18, handledToday: 0 },
  { id: 'AG-07', name: '唐澄', team: '质检组', status: 'online', avgResponseMinutes: 20, handledToday: 5 },
  { id: 'AG-08', name: '梁朴', team: '质检组', status: 'busy', avgResponseMinutes: 19, handledToday: 4 },
  { id: 'AG-09', name: '苏黎', team: '值班组', status: 'online', avgResponseMinutes: 13, handledToday: 10 },
  { id: 'AG-10', name: '季安', team: '值班组', status: 'busy', avgResponseMinutes: 17, handledToday: 8 },
];

export const customers: Customer[] = [
  { id: 'CU-01', name: '恒星教育', industry: '教育', tier: 'A', owner: '林冉', contact: '郑青', phone: '021-8001-0001', email: 'ops@hxedu.com', satisfaction: 92 },
  { id: 'CU-02', name: '云桥物流', industry: '物流', tier: 'A', owner: '周岚', contact: '沈衍', phone: '021-8001-0002', email: 'it@yqlogi.com', satisfaction: 88 },
  { id: 'CU-03', name: '星舟金融', industry: '金融', tier: 'A', owner: '吴桥', contact: '程昕', phone: '021-8001-0003', email: 'tech@xzbank.com', satisfaction: 90 },
  { id: 'CU-04', name: '晨光零售', industry: '零售', tier: 'B', owner: '许诺', contact: '何清', phone: '021-8001-0004', email: 'support@cgrt.com', satisfaction: 85 },
  { id: 'CU-05', name: '海平制造', industry: '制造', tier: 'A', owner: '林冉', contact: '严述', phone: '021-8001-0005', email: 'ops@hpfab.com', satisfaction: 89 },
  { id: 'CU-06', name: '北辰医药', industry: '医药', tier: 'B', owner: '孟晨', contact: '卢宸', phone: '021-8001-0006', email: 'service@bcyy.com', satisfaction: 84 },
  { id: 'CU-07', name: '河洛能源', industry: '能源', tier: 'B', owner: '周岚', contact: '鲁景', phone: '021-8001-0007', email: 'ops@hlny.com', satisfaction: 80 },
  { id: 'CU-08', name: '蓝域科技', industry: '互联网', tier: 'A', owner: '苏黎', contact: '章然', phone: '021-8001-0008', email: 'infra@lytech.com', satisfaction: 93 },
  { id: 'CU-09', name: '启元文旅', industry: '文旅', tier: 'C', owner: '季安', contact: '秦陌', phone: '021-8001-0009', email: 'it@qytravel.com', satisfaction: 78 },
  { id: 'CU-10', name: '远山电商', industry: '电商', tier: 'B', owner: '唐澄', contact: '田予', phone: '021-8001-0010', email: 'ops@ysmall.com', satisfaction: 83 },
  { id: 'CU-11', name: '光年通信', industry: '通信', tier: 'A', owner: '吴桥', contact: '白言', phone: '021-8001-0011', email: 'noc@gytel.com', satisfaction: 91 },
  { id: 'CU-12', name: '森穗农业', industry: '农业', tier: 'C', owner: '梁朴', contact: '骆木', phone: '021-8001-0012', email: 'it@shagri.com', satisfaction: 76 },
  { id: 'CU-13', name: '岚峰出行', industry: '出行', tier: 'B', owner: '许诺', contact: '杨律', phone: '021-8001-0013', email: 'support@lftrip.com', satisfaction: 82 },
  { id: 'CU-14', name: '曦石物业', industry: '物业', tier: 'C', owner: '顾庭', contact: '陈桥', phone: '021-8001-0014', email: 'ops@yswy.com', satisfaction: 75 },
  { id: 'CU-15', name: '临海传媒', industry: '传媒', tier: 'B', owner: '苏黎', contact: '张衣', phone: '021-8001-0015', email: 'it@lhmedia.com', satisfaction: 86 },
];

const ticketTemplates = [
  { category: '系统集成', title: '会话同步失败', summary: '三方回调重试次数异常升高。' },
  { category: '报表导出', title: '导出字段缺失', summary: '导出模板升级后关键字段未映射。' },
  { category: '权限管理', title: '门户权限异常', summary: '组织树映射缺失二级部门授权。' },
  { category: '自动化', title: '机器人规则误触发', summary: '关键词分词版本冲突导致命中异常。' },
  { category: '通知告警', title: '告警重复发送', summary: '任务调度并发导致重复通知。' },
  { category: '支付对账', title: '对账明细不一致', summary: '账单流水时间窗配置错误。' },
];

const statusCycle: TicketStatus[] = ['open', 'processing', 'open', 'resolved', 'processing', 'closed'];
const priorityCycle: TicketPriority[] = ['high', 'medium', 'low', 'high', 'medium', 'low'];

export const tickets: Ticket[] = Array.from({ length: 36 }).map((_, index) => {
  const customer = customers[index % customers.length]!;
  const tpl = ticketTemplates[index % ticketTemplates.length]!;
  const owner = agents[index % agents.length]!.name;
  const status = statusCycle[index % statusCycle.length]!;
  const priority = priorityCycle[index % priorityCycle.length]!;

  const day = 10 + (index % 20);
  const createdAt = `2026-03-${String(day).padStart(2, '0')} ${String(9 + (index % 8)).padStart(2, '0')}:20`;
  const dueAt = `2026-04-${String(1 + (index % 18)).padStart(2, '0')} ${String(10 + (index % 9)).padStart(2, '0')}:00`;

  return {
    id: `TK-${String(1001 + index)}`,
    title: `${customer.name} - ${tpl.title}`,
    customerId: customer.id,
    customer: customer.name,
    category: tpl.category,
    owner,
    priority,
    status,
    createdAt,
    dueAt,
    firstResponseAt: status === 'open' ? undefined : createdAt,
    resolvedAt: status === 'resolved' || status === 'closed' ? `2026-04-${String(2 + (index % 16)).padStart(2, '0')} 18:30` : undefined,
    summary: tpl.summary,
    escalation:
      index % 9 === 0
        ? {
            level: ((index % 3) + 1) as 1 | 2 | 3,
            reason: '客户反馈影响核心业务流程，需要升级处理。',
            at: `2026-04-${String(2 + (index % 16)).padStart(2, '0')} 11:15`,
          }
        : undefined,
  };
});

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: 'KB-01',
    title: '工单状态机说明与流转规则',
    tags: ['工单', '流程'],
    updatedAt: '2026-03-20',
    content: '定义 open/processing/resolved/closed 的切换前后置条件。',
  },
  {
    id: 'KB-02',
    title: 'SLA 超时判定与预警策略',
    tags: ['SLA', '告警'],
    updatedAt: '2026-03-18',
    content: '基于首次响应与最终解决时限，按阈值触发预警。',
  },
  {
    id: 'KB-03',
    title: '导出报表字段映射清单',
    tags: ['报表', '导出'],
    updatedAt: '2026-03-15',
    content: '维护导出列与数据库字段映射关系，避免字段缺失。',
  },
  {
    id: 'KB-04',
    title: '机器人关键词库维护流程',
    tags: ['自动化', '机器人'],
    updatedAt: '2026-03-10',
    content: '关键词发布前需走灰度验证与回滚预案。',
  },
  {
    id: 'KB-05',
    title: '高优先工单升级标准',
    tags: ['工单', '升级'],
    updatedAt: '2026-03-22',
    content: '定义 P1/P2 升级等级、SLA 要求与跨团队响应机制。',
  },
  {
    id: 'KB-06',
    title: '客户满意度回访模板',
    tags: ['客户', '质检'],
    updatedAt: '2026-03-25',
    content: '统一回访话术、评分规则与改进建议闭环流程。',
  },
];

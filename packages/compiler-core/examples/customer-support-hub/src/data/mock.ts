export type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed';
export type TicketPriority = 'high' | 'medium' | 'low';

export type Ticket = {
  id: string;
  title: string;
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
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  tags: string[];
  updatedAt: string;
  content: string;
};

export const agents = ['林冉', '周岩', '吴楠', '许诺'];

export const tickets: Ticket[] = [
  {
    id: 'TK-1001',
    title: '无法同步客服会话记录',
    customer: '恒星教育',
    category: '系统集成',
    owner: '林冉',
    priority: 'high',
    status: 'processing',
    createdAt: '2026-03-27 09:20',
    dueAt: '2026-03-29 12:00',
    firstResponseAt: '2026-03-27 09:40',
    summary: '三方 IM 回调失败，重试队列堆积。',
  },
  {
    id: 'TK-1002',
    title: '工单导出 Excel 缺少列',
    customer: '云桥物流',
    category: '报表',
    owner: '周岩',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-03-28 10:05',
    dueAt: '2026-03-30 18:00',
    summary: '导出模板升级后，联系人电话字段丢失。',
  },
  {
    id: 'TK-1003',
    title: '机器人回复规则触发异常',
    customer: '星舟金融',
    category: '自动化',
    owner: '吴楠',
    priority: 'high',
    status: 'resolved',
    createdAt: '2026-03-26 14:12',
    dueAt: '2026-03-28 17:00',
    firstResponseAt: '2026-03-26 14:30',
    resolvedAt: '2026-03-28 11:15',
    summary: '关键词匹配库旧版本缓存未清空。',
  },
  {
    id: 'TK-1004',
    title: 'SLA 报警邮件重复发送',
    customer: '晨光零售',
    category: '通知',
    owner: '许诺',
    priority: 'low',
    status: 'closed',
    createdAt: '2026-03-24 08:50',
    dueAt: '2026-03-26 20:00',
    firstResponseAt: '2026-03-24 09:06',
    resolvedAt: '2026-03-25 16:42',
    summary: '告警合并任务 cron 并发配置重复。',
  },
  {
    id: 'TK-1005',
    title: '客户门户无法查看历史工单',
    customer: '海平制造',
    category: '权限',
    owner: '林冉',
    priority: 'medium',
    status: 'processing',
    createdAt: '2026-03-28 16:40',
    dueAt: '2026-03-30 09:00',
    firstResponseAt: '2026-03-28 17:00',
    summary: '组织树权限映射缺失二级部门。',
  },
];

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
];

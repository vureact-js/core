export type TicketStatus = 'open' | 'processing' | 'resolved' | 'closed';
export type TicketPriority = 'high' | 'medium' | 'low';
export type ChannelType = 'chat' | 'email' | 'phone' | 'social';
export type ConversationStatus = 'unassigned' | 'processing' | 'pending' | 'escalated';
export type ConversationQueue = 'vip' | 'billing' | 'integration' | 'retention';
export type InternalNoteType = 'sync' | 'risk' | 'follow-up';

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
  healthScore: number;
};

export type Agent = {
  id: string;
  name: string;
  team: string;
  status: 'online' | 'busy' | 'offline';
  avgResponseMinutes: number;
  handledToday: number;
  skills: ChannelType[];
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  tags: string[];
  updatedAt: string;
  content: string;
};

export type Conversation = {
  id: string;
  channel: ChannelType;
  queue: ConversationQueue;
  status: ConversationStatus;
  subject: string;
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  ownerId?: string;
  ownerName?: string;
  priority: TicketPriority;
  latestAt: string;
  createdAt: string;
  unread: number;
  tags: string[];
  summary: string;
  latestMessage: string;
  contact: string;
  linkedTicketId?: string;
  waitingReason?: string;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  sender: 'customer' | 'agent' | 'system';
  author: string;
  sentAt: string;
  content: string;
  attachments?: string[];
};

export type InternalNote = {
  id: string;
  ticketId: string;
  author: string;
  createdAt: string;
  type: InternalNoteType;
  content: string;
  mentions: string[];
};

export type EscalationRecord = {
  id: string;
  ticketId: string;
  level: 1 | 2 | 3;
  reason: string;
  createdAt: string;
  owner: string;
  channel?: ChannelType;
  conversationId?: string;
};

export type DraftReply = {
  conversationId: string;
  content: string;
  pendingReason: string;
  mentions: string[];
  internalOnly: boolean;
};

export const agents: Agent[] = [
  {
    id: 'AG-01',
    name: '林冉',
    team: '一线支持',
    status: 'online',
    avgResponseMinutes: 12,
    handledToday: 9,
    skills: ['chat', 'email', 'social'],
  },
  {
    id: 'AG-02',
    name: '周岚',
    team: '一线支持',
    status: 'busy',
    avgResponseMinutes: 14,
    handledToday: 11,
    skills: ['email', 'phone'],
  },
  {
    id: 'AG-03',
    name: '吴桥',
    team: '一线支持',
    status: 'online',
    avgResponseMinutes: 10,
    handledToday: 8,
    skills: ['chat', 'phone'],
  },
  {
    id: 'AG-04',
    name: '许诺',
    team: '二线支持',
    status: 'busy',
    avgResponseMinutes: 16,
    handledToday: 7,
    skills: ['email', 'social'],
  },
  {
    id: 'AG-05',
    name: '孟晨',
    team: '二线支持',
    status: 'online',
    avgResponseMinutes: 15,
    handledToday: 6,
    skills: ['chat', 'email', 'phone'],
  },
  {
    id: 'AG-06',
    name: '顾庭',
    team: '二线支持',
    status: 'offline',
    avgResponseMinutes: 18,
    handledToday: 0,
    skills: ['phone', 'social'],
  },
  {
    id: 'AG-07',
    name: '唐澄',
    team: '质检组',
    status: 'online',
    avgResponseMinutes: 20,
    handledToday: 5,
    skills: ['email', 'chat'],
  },
  {
    id: 'AG-08',
    name: '梁朴',
    team: '质检组',
    status: 'busy',
    avgResponseMinutes: 19,
    handledToday: 4,
    skills: ['social', 'chat'],
  },
  {
    id: 'AG-09',
    name: '苏黎',
    team: '值班组',
    status: 'online',
    avgResponseMinutes: 13,
    handledToday: 10,
    skills: ['phone', 'email', 'chat'],
  },
  {
    id: 'AG-10',
    name: '季安',
    team: '值班组',
    status: 'busy',
    avgResponseMinutes: 17,
    handledToday: 8,
    skills: ['social', 'phone'],
  },
];

export const customers: Customer[] = [
  {
    id: 'CU-01',
    name: '恒星教育',
    industry: '教育',
    tier: 'A',
    owner: '林冉',
    contact: '郑青',
    phone: '021-8001-0001',
    email: 'ops@hxedu.com',
    satisfaction: 92,
    healthScore: 90,
  },
  {
    id: 'CU-02',
    name: '云桥物流',
    industry: '物流',
    tier: 'A',
    owner: '周岚',
    contact: '沈衍',
    phone: '021-8001-0002',
    email: 'it@yqlogi.com',
    satisfaction: 88,
    healthScore: 84,
  },
  {
    id: 'CU-03',
    name: '星舟金融',
    industry: '金融',
    tier: 'A',
    owner: '吴桥',
    contact: '程昕',
    phone: '021-8001-0003',
    email: 'tech@xzbank.com',
    satisfaction: 90,
    healthScore: 87,
  },
  {
    id: 'CU-04',
    name: '晨光零售',
    industry: '零售',
    tier: 'B',
    owner: '许诺',
    contact: '何清',
    phone: '021-8001-0004',
    email: 'support@cgrt.com',
    satisfaction: 85,
    healthScore: 80,
  },
  {
    id: 'CU-05',
    name: '海平制造',
    industry: '制造',
    tier: 'A',
    owner: '林冉',
    contact: '严述',
    phone: '021-8001-0005',
    email: 'ops@hpfab.com',
    satisfaction: 89,
    healthScore: 85,
  },
  {
    id: 'CU-06',
    name: '北辰医药',
    industry: '医药',
    tier: 'B',
    owner: '孟晨',
    contact: '卢宸',
    phone: '021-8001-0006',
    email: 'service@bcyy.com',
    satisfaction: 84,
    healthScore: 79,
  },
  {
    id: 'CU-07',
    name: '河洛能源',
    industry: '能源',
    tier: 'B',
    owner: '周岚',
    contact: '鲁景',
    phone: '021-8001-0007',
    email: 'ops@hlny.com',
    satisfaction: 80,
    healthScore: 76,
  },
  {
    id: 'CU-08',
    name: '蓝域科技',
    industry: '互联网',
    tier: 'A',
    owner: '苏黎',
    contact: '章然',
    phone: '021-8001-0008',
    email: 'infra@lytech.com',
    satisfaction: 93,
    healthScore: 92,
  },
  {
    id: 'CU-09',
    name: '启元文旅',
    industry: '文旅',
    tier: 'C',
    owner: '季安',
    contact: '秦陌',
    phone: '021-8001-0009',
    email: 'it@qytravel.com',
    satisfaction: 78,
    healthScore: 71,
  },
  {
    id: 'CU-10',
    name: '远山电商',
    industry: '电商',
    tier: 'B',
    owner: '唐澄',
    contact: '田予',
    phone: '021-8001-0010',
    email: 'ops@ysmall.com',
    satisfaction: 83,
    healthScore: 78,
  },
  {
    id: 'CU-11',
    name: '光年通信',
    industry: '通信',
    tier: 'A',
    owner: '吴桥',
    contact: '白言',
    phone: '021-8001-0011',
    email: 'noc@gytel.com',
    satisfaction: 91,
    healthScore: 90,
  },
  {
    id: 'CU-12',
    name: '森穗农业',
    industry: '农业',
    tier: 'C',
    owner: '梁朴',
    contact: '骆木',
    phone: '021-8001-0012',
    email: 'it@shagri.com',
    satisfaction: 76,
    healthScore: 69,
  },
  {
    id: 'CU-13',
    name: '岚峰出行',
    industry: '出行',
    tier: 'B',
    owner: '许诺',
    contact: '杨律',
    phone: '021-8001-0013',
    email: 'support@lftrip.com',
    satisfaction: 82,
    healthScore: 77,
  },
  {
    id: 'CU-14',
    name: '曦石物业',
    industry: '物业',
    tier: 'C',
    owner: '顾庭',
    contact: '陈桥',
    phone: '021-8001-0014',
    email: 'ops@yswy.com',
    satisfaction: 75,
    healthScore: 66,
  },
  {
    id: 'CU-15',
    name: '临海传媒',
    industry: '传媒',
    tier: 'B',
    owner: '苏黎',
    contact: '张衣',
    phone: '021-8001-0015',
    email: 'it@lhmedia.com',
    satisfaction: 86,
    healthScore: 82,
  },
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
    resolvedAt:
      status === 'resolved' || status === 'closed'
        ? `2026-04-${String(2 + (index % 16)).padStart(2, '0')} 18:30`
        : undefined,
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

const conversationSubjects = [
  '账单明细与工单状态不一致',
  '机器人回复命中错误话术',
  '回呼请求未进入排队池',
  '社媒私信咨询升级排期',
  'Webhook 推送延迟告警',
  '培训账号批量创建失败',
  '高优先客户要求当天修复',
  '对接方接口签名校验异常',
];

const channelCycle: ChannelType[] = ['chat', 'email', 'phone', 'social'];
const queueCycle: ConversationQueue[] = ['vip', 'billing', 'integration', 'retention'];
const conversationStatusCycle: ConversationStatus[] = [
  'unassigned',
  'processing',
  'pending',
  'escalated',
  'processing',
  'unassigned',
];

const channelTags: Record<ChannelType, string[]> = {
  chat: ['在线会话', '实时回复'],
  email: ['邮件沟通', '附件核对'],
  phone: ['电话回呼', '录音复核'],
  social: ['社媒触达', '品牌关注'],
};

export const conversations: Conversation[] = Array.from({ length: 40 }).map((_, index) => {
  const customer = customers[index % customers.length]!;
  const channel = channelCycle[index % channelCycle.length]!;
  const queue = queueCycle[index % queueCycle.length]!;
  const status = conversationStatusCycle[index % conversationStatusCycle.length]!;
  const agent = status === 'unassigned' ? null : agents[(index + 2) % agents.length]!;
  const linkedTicket = index % 3 === 0 ? tickets[index % tickets.length] : undefined;
  const subject = `${customer.name} - ${conversationSubjects[index % conversationSubjects.length]!}`;
  const createdDay = 5 + (index % 18);
  const createdAt = `2026-04-${String(createdDay).padStart(2, '0')} ${String(8 + (index % 9)).padStart(2, '0')}:10`;
  const latestAt = `2026-04-${String(createdDay).padStart(2, '0')} ${String(9 + (index % 9)).padStart(2, '0')}:4${index % 10}`;
  const waitingReason =
    status === 'pending'
      ? ['等待客户补充日志', '等待财务确认账单', '等待二线支持回查'][index % 3]
      : undefined;

  return {
    id: `CV-${String(2001 + index)}`,
    channel,
    queue,
    status,
    subject,
    customerId: customer.id,
    customerName: customer.name,
    customerTier: customer.tier,
    ownerId: agent?.id,
    ownerName: agent?.name,
    priority: linkedTicket?.priority || priorityCycle[index % priorityCycle.length]!,
    latestAt,
    createdAt,
    unread: status === 'processing' ? 0 : 1 + (index % 4),
    tags: [...channelTags[channel], customer.tier === 'A' ? '重点客户' : '常规跟进'],
    summary: `${customer.contact} 反馈“${conversationSubjects[index % conversationSubjects.length]!}”，需要客服协同跟进。`,
    latestMessage:
      channel === 'email'
        ? '附件中补充了导出样例，请一起核对。'
        : channel === 'phone'
          ? '客户希望 30 分钟内得到回呼确认。'
          : channel === 'social'
            ? '用户在社媒反馈影响门店运营，需要尽快回应。'
            : '客户继续补充了复现路径和截图说明。',
    contact: channel === 'phone' ? customer.phone : customer.email,
    linkedTicketId: linkedTicket?.id,
    waitingReason,
  };
});

export const conversationMessages: ConversationMessage[] = conversations.flatMap((conversation, index) => {
  const createdHour = 8 + (index % 7);
  return [
    {
      id: `MSG-${conversation.id}-1`,
      conversationId: conversation.id,
      sender: 'customer',
      author: conversation.customerName,
      sentAt: `2026-04-${String(5 + (index % 18)).padStart(2, '0')} ${String(createdHour).padStart(2, '0')}:12`,
      content: `${conversation.subject}。我们已在生产环境复现，请协助排查。`,
      attachments: conversation.channel === 'email' ? ['error-log.xlsx'] : undefined,
    },
    {
      id: `MSG-${conversation.id}-2`,
      conversationId: conversation.id,
      sender: 'agent',
      author: conversation.ownerName || '系统待分配',
      sentAt: `2026-04-${String(5 + (index % 18)).padStart(2, '0')} ${String(createdHour + 1).padStart(2, '0')}:05`,
      content:
        conversation.status === 'unassigned'
          ? '当前会话进入待分配队列，预计 10 分钟内有坐席接入。'
          : '已收到反馈，正在比对配置与上下游日志。',
    },
    {
      id: `MSG-${conversation.id}-3`,
      conversationId: conversation.id,
      sender: conversation.status === 'escalated' ? 'system' : 'customer',
      author: conversation.status === 'escalated' ? '系统' : conversation.customerName,
      sentAt: `2026-04-${String(5 + (index % 18)).padStart(2, '0')} ${String(createdHour + 2).padStart(2, '0')}:20`,
      content:
        conversation.status === 'escalated'
          ? '系统已自动升级为高优先协同会话，并同步到值班主管。'
          : conversation.latestMessage,
    },
  ];
});

export const internalNotes: InternalNote[] = tickets
  .filter((ticket, index) => index < 14)
  .map((ticket, index) => ({
    id: `NOTE-${3001 + index}`,
    ticketId: ticket.id,
    author: agents[index % agents.length]!.name,
    createdAt: `2026-04-${String(8 + (index % 12)).padStart(2, '0')} ${String(10 + (index % 6)).padStart(2, '0')}:18`,
    type: (['sync', 'risk', 'follow-up'][index % 3] as InternalNoteType),
    content:
      index % 3 === 0
        ? '已与研发同步日志链路，等待网关侧确认最新部署批次。'
        : index % 3 === 1
          ? '客户情绪波动较大，建议今天 18:00 前给出阶段性结论。'
          : '建议明早补发回访摘要，并在知识库补一条 FAQ。',
    mentions: [agents[(index + 1) % agents.length]!.name, agents[(index + 2) % agents.length]!.name],
  }));

export const escalationRecords: EscalationRecord[] = tickets
  .filter((ticket) => !!ticket.escalation)
  .map((ticket, index) => {
    const relatedConversation = conversations.find((item) => item.linkedTicketId === ticket.id);
    return {
      id: `ESC-${4001 + index}`,
      ticketId: ticket.id,
      level: ticket.escalation!.level,
      reason: ticket.escalation!.reason,
      createdAt: ticket.escalation!.at,
      owner: ticket.owner,
      channel: relatedConversation?.channel,
      conversationId: relatedConversation?.id,
    };
  });

export const draftReplies: DraftReply[] = conversations
  .filter((item, index) => index < 8)
  .map((item, index) => ({
    conversationId: item.id,
    content:
      index % 2 === 0
        ? '我们已定位到相关链路，正在补充最新影响范围，稍后会同步处理计划。'
        : '草稿：已安排值班同学回拨，请确认可接听时间。',
    pendingReason: item.waitingReason || '',
    mentions: [agents[(index + 3) % agents.length]!.name],
    internalOnly: index % 3 === 0,
  }));

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
  {
    id: 'KB-07',
    title: '多渠道会话合并到工单的处理约定',
    tags: ['会话', '流程'],
    updatedAt: '2026-04-04',
    content: '邮件、在线会话和电话回呼统一按客户与问题域合并，避免重复升级。',
  },
  {
    id: 'KB-08',
    title: '内部协同备注书写规范',
    tags: ['协同', '质检'],
    updatedAt: '2026-04-08',
    content: '备注需包含影响范围、下一动作和责任人，避免只记录结论不记录上下文。',
  },
];

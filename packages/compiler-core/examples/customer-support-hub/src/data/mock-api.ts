import dayjs from 'dayjs';
import Fuse from 'fuse.js';
import { appStore } from '../store/useAppStore';
import {
  agents as seedAgents,
  customers as seedCustomers,
  knowledgeBase as seedKb,
  tickets as seedTickets,
  type Agent,
  type Customer,
  type KnowledgeArticle,
  type Ticket,
  type TicketEscalationMeta,
} from './mock';

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const store = {
  tickets: clone(seedTickets),
  customers: clone(seedCustomers),
  agents: clone(seedAgents),
  knowledgeBase: clone(seedKb),
};

const authKey = 'support-hub-user';

export type User = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export type TicketQuery = {
  keyword?: string;
  status?: string;
  priority?: string;
  owner?: string;
  page?: number;
  pageSize?: number;
  sortField?: 'dueAt' | 'priority' | 'createdAt';
  sortOrder?: 'ascend' | 'descend';
};

export type KnowledgeQuery = {
  keyword?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
};

export type CustomerQuery = {
  keyword?: string;
  owner?: string;
  tier?: 'all' | 'A' | 'B' | 'C';
  page?: number;
  pageSize?: number;
};

export type CustomerDetail = Customer & {
  activeTickets: number;
  recentTickets: Ticket[];
  satisfactionHistory: Array<{ month: string; score: number }>;
};

type TicketTimelineItem = {
  id: string;
  time: string;
  title: string;
  detail?: string;
  kind: 'created' | 'response' | 'status' | 'escalation' | 'assign';
};

const makeTimelineId = () => Math.random().toString(36).slice(2, 10);

const ticketTimelineStore: Record<string, TicketTimelineItem[]> = {};

const toStatusLabel = (status: Ticket['status']) => {
  if (status === 'open') return '待处理';
  if (status === 'processing') return '处理中';
  if (status === 'resolved') return '已解决';
  return '已关闭';
};

const seedTimelineForTicket = (ticket: Ticket): TicketTimelineItem[] => {
  const items: TicketTimelineItem[] = [
    {
      id: makeTimelineId(),
      time: ticket.createdAt,
      title: '工单创建',
      detail: '工单已进入待处理队列',
      kind: 'created',
    },
  ];

  if (ticket.firstResponseAt) {
    items.push({
      id: makeTimelineId(),
      time: ticket.firstResponseAt,
      title: '首次响应',
      detail: `${ticket.owner} 已开始处理`,
      kind: 'response',
    });
  }

  if (ticket.escalation) {
    items.push({
      id: makeTimelineId(),
      time: ticket.escalation.at,
      title: `工单升级 L${ticket.escalation.level}`,
      detail: ticket.escalation.reason,
      kind: 'escalation',
    });
  }

  if (ticket.resolvedAt) {
    items.push({
      id: makeTimelineId(),
      time: ticket.resolvedAt,
      title: `状态变更：${toStatusLabel(ticket.status)}`,
      detail: '处理流程进入收尾阶段',
      kind: 'status',
    });
  }

  return items;
};

store.tickets.forEach((ticket) => {
  ticketTimelineStore[ticket.id] = seedTimelineForTicket(ticket);
});

const appendTicketTimeline = (
  ticketId: string,
  entry: Omit<TicketTimelineItem, 'id' | 'time'> & { time?: string },
) => {
  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const list = ticketTimelineStore[ticketId] || [];
  list.push({
    id: makeTimelineId(),
    time: entry.time || now,
    title: entry.title,
    detail: entry.detail,
    kind: entry.kind,
  });
  ticketTimelineStore[ticketId] = list;
};

function setUser(user: User | null) {
  if (typeof localStorage !== 'undefined') {
    if (user) localStorage.setItem(authKey, JSON.stringify(user));
    else localStorage.removeItem(authKey);
  }

  if (user) appStore.getState().login(user);
  else appStore.getState().logout();
}

export function getAuthUser(): User | null {
  const stateUser = appStore.getState().session.user as User | null;
  if (stateUser) return stateUser;

  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(authKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as User;
    appStore.getState().login(parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function login(payload: { email: string; password: string }) {
  await delay();
  if (!payload.email || payload.password.length < 3) {
    throw new Error('账号或密码不正确');
  }

  const name = payload.email.split('@')[0] || '客服主管';
  const user: User = {
    id: `U-${name}`,
    name,
    role: '客服主管',
    email: payload.email,
  };

  setUser(user);
  return clone(user);
}

export async function logout() {
  await delay(80);
  setUser(null);
}

function ticketCountByAgent(agentName: string) {
  return store.tickets.filter((t) => t.owner === agentName && (t.status === 'open' || t.status === 'processing')).length;
}

export async function fetchDashboardSummary() {
  await delay();

  const openCount = store.tickets.filter((t) => t.status === 'open').length;
  const processingCount = store.tickets.filter((t) => t.status === 'processing').length;
  const resolvedToday = store.tickets.filter(
    (t) => t.resolvedAt && dayjs(t.resolvedAt).isAfter(dayjs().subtract(1, 'day')),
  ).length;

  const now = dayjs();
  const slaRisk = store.tickets.filter((ticket) => {
    const due = dayjs(ticket.dueAt);
    if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
    return due.diff(now, 'minute') <= 120;
  }).length;

  const todoTickets = [...store.tickets]
    .filter((t) => t.status === 'open' || t.status === 'processing')
    .sort((a, b) => dayjs(a.dueAt).valueOf() - dayjs(b.dueAt).valueOf())
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      owner: item.owner,
      dueAt: item.dueAt,
      status: item.status,
    }));

  const agentWorkload = store.agents
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      load: ticketCountByAgent(agent.name),
      avgResponseMinutes: agent.avgResponseMinutes,
      handledToday: agent.handledToday,
    }))
    .sort((a, b) => b.load - a.load)
    .slice(0, 8);

  return clone({
    openCount,
    processingCount,
    resolvedToday,
    slaRisk,
    todoTickets,
    agentWorkload,
    recentActivities: appStore.getState().activities,
  });
}

function sortTickets(rows: Ticket[], sortField?: TicketQuery['sortField'], sortOrder?: TicketQuery['sortOrder']) {
  if (!sortField) return rows;
  const dir = sortOrder === 'ascend' ? 1 : -1;

  if (sortField === 'priority') {
    const map: Record<Ticket['priority'], number> = { high: 3, medium: 2, low: 1 };
    return [...rows].sort((a, b) => (map[a.priority] - map[b.priority]) * dir);
  }

  if (sortField === 'dueAt') {
    return [...rows].sort((a, b) => (dayjs(a.dueAt).valueOf() - dayjs(b.dueAt).valueOf()) * dir);
  }

  return [...rows].sort((a, b) => (dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()) * dir);
}

export async function fetchTickets(query?: TicketQuery) {
  await delay();
  let result = [...store.tickets];

  if (query?.status && query.status !== 'all') {
    result = result.filter((item) => item.status === query.status);
  }

  if (query?.priority && query.priority !== 'all') {
    result = result.filter((item) => item.priority === query.priority);
  }

  if (query?.owner && query.owner !== 'all') {
    result = result.filter((item) => item.owner === query.owner);
  }

  const keyword = (query?.keyword || '').trim();
  if (keyword) {
    const fuse = new Fuse(result, {
      threshold: 0.32,
      keys: ['id', 'title', 'customer', 'summary', 'owner', 'category'],
    });
    result = fuse.search(keyword).map((item) => item.item);
  }

  result = sortTickets(result, query?.sortField, query?.sortOrder);

  const page = Math.max(1, query?.page || 1);
  const pageSize = Math.max(1, query?.pageSize || 8);
  const total = result.length;
  const start = (page - 1) * pageSize;
  const list = result.slice(start, start + pageSize);

  return clone({ list, total, page, pageSize });
}

export async function fetchTicketDetail(id: string) {
  await delay(120);
  const ticket = store.tickets.find((item) => item.id === id);
  if (!ticket) throw new Error('工单不存在');
  return clone(ticket);
}

export async function fetchTicketTimeline(id: string) {
  await delay(80);
  const list = ticketTimelineStore[id] || [];
  return clone(
    [...list].sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()),
  ) as TicketTimelineItem[];
}

export async function fetchTicketSlaSnapshot(id: string) {
  await delay(60);
  const ticket = store.tickets.find((item) => item.id === id);
  if (!ticket) throw new Error('工单不存在');

  const createdAt = dayjs(ticket.createdAt);
  const dueAt = dayjs(ticket.dueAt);
  const endAt = ticket.resolvedAt ? dayjs(ticket.resolvedAt) : dayjs();
  const totalMinutes = Math.max(1, dueAt.diff(createdAt, 'minute'));
  const spentMinutes = Math.max(0, endAt.diff(createdAt, 'minute'));
  const remainMinutes = dueAt.diff(endAt, 'minute');
  const progressPercent = Math.min(100, Math.max(0, Math.round((spentMinutes / totalMinutes) * 100)));
  const overdueMinutes = Math.max(0, endAt.diff(dueAt, 'minute'));
  const isDone = ticket.status === 'resolved' || ticket.status === 'closed';
  const isOverdue = !isDone && remainMinutes < 0;

  return clone({
    id: ticket.id,
    isDone,
    isOverdue,
    totalMinutes,
    spentMinutes,
    remainMinutes: isDone ? 0 : remainMinutes,
    overdueMinutes,
    progressPercent,
  });
}

export async function updateTicketStatus(id: string, status: Ticket['status']) {
  await delay(120);
  const index = store.tickets.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('工单不存在');

  const next: Ticket = {
    ...store.tickets[index],
    status,
    resolvedAt: status === 'resolved' || status === 'closed' ? dayjs().format('YYYY-MM-DD HH:mm') : undefined,
  };
  store.tickets[index] = next;

  appendTicketTimeline(next.id, {
    kind: 'status',
    title: `状态变更：${toStatusLabel(status)}`,
    detail: `执行人：${getAuthUser()?.name || '系统'}`,
  });
  appStore.getState().appendActivity(`工单 ${next.id} 状态更新为 ${status}`);
  return clone(next);
}

export async function claimTicket(payload: { ticketId: string; agentId?: string }) {
  await delay(120);
  const index = store.tickets.findIndex((item) => item.id === payload.ticketId);
  if (index === -1) throw new Error('工单不存在');

  const user = getAuthUser();
  const agent = payload.agentId ? store.agents.find((item) => item.id === payload.agentId) : null;
  const owner = agent?.name || user?.name || store.tickets[index]!.owner;

  const current = store.tickets[index]!;
  const next: Ticket = {
    ...current,
    owner,
    status: current.status === 'open' ? 'processing' : current.status,
    firstResponseAt: current.firstResponseAt || dayjs().format('YYYY-MM-DD HH:mm'),
  };

  store.tickets[index] = next;
  appendTicketTimeline(next.id, {
    kind: 'assign',
    title: '工单接单',
    detail: `${owner} 已接单处理`,
  });
  appStore.getState().appendActivity(`工单 ${next.id} 已由 ${owner} 接单处理`);
  return clone(next);
}

export async function escalateTicket(payload: {
  ticketId: string;
  level?: 1 | 2 | 3;
  reason?: string;
}) {
  await delay(120);
  const index = store.tickets.findIndex((item) => item.id === payload.ticketId);
  if (index === -1) throw new Error('工单不存在');

  const current = store.tickets[index]!;
  const escalation: TicketEscalationMeta = {
    level: payload.level || 2,
    reason: payload.reason || '升级处理：影响核心业务流程。',
    at: dayjs().format('YYYY-MM-DD HH:mm'),
  };

  const next: Ticket = {
    ...current,
    priority: 'high',
    escalation,
  };

  store.tickets[index] = next;
  appendTicketTimeline(next.id, {
    kind: 'escalation',
    time: escalation.at,
    title: `工单升级 L${escalation.level}`,
    detail: escalation.reason,
  });
  appStore.getState().appendActivity(`工单 ${next.id} 已升级（L${escalation.level}）`);
  return clone(next);
}

export async function assignTicket(payload: { ticketId: string; agentId: string }) {
  await delay(120);
  const agent = store.agents.find((item) => item.id === payload.agentId);
  if (!agent) throw new Error('坐席不存在');

  const next = await claimTicket({ ticketId: payload.ticketId, agentId: payload.agentId });
  appendTicketTimeline(next.id, {
    kind: 'assign',
    title: '工单分配',
    detail: `工单已分配给 ${agent.name}`,
  });
  appStore.getState().appendActivity(`工单 ${next.id} 已分配给 ${agent.name}`);
  return clone(next);
}

export async function fetchKnowledgeArticles(query?: KnowledgeQuery) {
  await delay();
  const keyword = (query?.keyword || '').trim();
  const tag = query?.tag || 'all';

  let result = [...store.knowledgeBase];
  if (tag !== 'all') {
    result = result.filter((item) => item.tags.includes(tag));
  }

  if (keyword) {
    const fuse = new Fuse(result, {
      threshold: 0.3,
      keys: ['title', 'content', 'tags'],
    });
    result = fuse.search(keyword).map((item) => item.item);
  }

  const page = Math.max(1, query?.page || 1);
  const pageSize = Math.max(1, query?.pageSize || 8);
  const total = result.length;
  const start = (page - 1) * pageSize;
  const list = result.slice(start, start + pageSize);

  return clone({ list, total, page, pageSize });
}

export async function fetchSlaBoard(): Promise<{
  config: {
    firstResponseMinutes: number;
    resolveMinutes: number;
    warningThresholdPercent: number;
  };
  rows: Array<{
    id: string;
    title: string;
    owner: string;
    status: Ticket['status'];
    dueAt: string;
    remainMinutes: number;
    progressPercent: number;
    risk: 'risk' | 'safe' | 'done';
    escalationLevel?: number;
    riskText: string;
    escalationText: string;
  }>;
}> {
  await delay();
  const cfg = appStore.getState().slaConfig;
  const now = dayjs();

  const rows = store.tickets.map((ticket) => {
    const due = dayjs(ticket.dueAt);
    const total = dayjs(ticket.dueAt).diff(dayjs(ticket.createdAt), 'minute');
    const spent = now.diff(dayjs(ticket.createdAt), 'minute');
    const ratio = total > 0 ? Math.min(100, Math.max(0, Math.round((spent / total) * 100))) : 0;

    const isDone = ticket.status === 'resolved' || ticket.status === 'closed';
    const risk: 'risk' | 'safe' | 'done' = isDone ? 'done' : ratio >= cfg.warningThresholdPercent || !!ticket.escalation ? 'risk' : 'safe';

    return {
      id: ticket.id,
      title: ticket.title,
      owner: ticket.owner,
      status: ticket.status,
      dueAt: ticket.dueAt,
      remainMinutes: isDone ? 0 : due.diff(now, 'minute'),
      progressPercent: ratio,
      risk,
      escalationLevel: ticket.escalation?.level,
      riskText: risk === 'risk' ? '风险' : risk === 'done' ? '已完成' : '正常',
      escalationText: ticket.escalation?.level ? `L${ticket.escalation.level}` : '-',
    };
  });

  return clone({ config: cfg, rows }) as {
    config: {
      firstResponseMinutes: number;
      resolveMinutes: number;
      warningThresholdPercent: number;
    };
    rows: Array<{
      id: string;
      title: string;
      owner: string;
      status: Ticket['status'];
      dueAt: string;
      remainMinutes: number;
      progressPercent: number;
      risk: 'risk' | 'safe' | 'done';
      escalationLevel?: number;
      riskText: string;
      escalationText: string;
    }>;
  };
}

export async function updateSlaConfig(patch: {
  firstResponseMinutes?: number;
  resolveMinutes?: number;
  warningThresholdPercent?: number;
}) {
  await delay(80);
  appStore.getState().setSlaConfig(patch);
  appStore.getState().appendActivity('SLA 配置已更新');
  return clone(appStore.getState().slaConfig);
}

export async function fetchCustomers(query?: CustomerQuery) {
  await delay(100);
  let result = [...store.customers];

  if (query?.owner && query.owner !== 'all') {
    result = result.filter((item) => item.owner === query.owner);
  }

  if (query?.tier && query.tier !== 'all') {
    result = result.filter((item) => item.tier === query.tier);
  }

  const keyword = (query?.keyword || '').trim();
  if (keyword) {
    const fuse = new Fuse(result, {
      threshold: 0.32,
      keys: ['name', 'industry', 'contact', 'owner'],
    });
    result = fuse.search(keyword).map((item) => item.item);
  }

  const page = Math.max(1, query?.page || 1);
  const pageSize = Math.max(1, query?.pageSize || 8);
  const total = result.length;
  const start = (page - 1) * pageSize;

  const list = result.slice(start, start + pageSize).map((item) => ({
    ...item,
    activeTicketCount: store.tickets.filter(
      (t) => t.customerId === item.id && (t.status === 'open' || t.status === 'processing'),
    ).length,
  }));

  return clone({ list, total, page, pageSize });
}

export async function fetchCustomerDetail(id: string): Promise<CustomerDetail> {
  await delay(100);
  const customer = store.customers.find((item) => item.id === id);
  if (!customer) throw new Error('客户不存在');

  const recentTickets = store.tickets
    .filter((item) => item.customerId === id)
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
    .slice(0, 6);

  const detail: CustomerDetail = {
    ...customer,
    activeTickets: recentTickets.filter((item) => item.status === 'open' || item.status === 'processing').length,
    recentTickets,
    satisfactionHistory: [
      { month: '2025-12', score: customer.satisfaction - 4 },
      { month: '2026-01', score: customer.satisfaction - 2 },
      { month: '2026-02', score: customer.satisfaction - 1 },
      { month: '2026-03', score: customer.satisfaction },
    ],
  };

  return clone(detail);
}

export async function fetchCustomerRiskScore(customerId: string) {
  await delay(80);
  const customer = store.customers.find((item) => item.id === customerId);
  if (!customer) throw new Error('客户不存在');

  const relatedTickets = store.tickets.filter((item) => item.customerId === customerId);
  const activeTickets = relatedTickets.filter(
    (item) => item.status === 'open' || item.status === 'processing',
  );
  const highPriorityOpen = activeTickets.filter((item) => item.priority === 'high').length;
  const overdueOpen = activeTickets.filter((item) => dayjs(item.dueAt).isBefore(dayjs())).length;

  const satisfactionRisk = Math.max(0, 100 - customer.satisfaction);
  const activeRisk = activeTickets.length * 6;
  const highRisk = highPriorityOpen * 8;
  const overdueRisk = overdueOpen * 10;
  const score = Math.min(100, satisfactionRisk + activeRisk + highRisk + overdueRisk);

  let level: 'low' | 'medium' | 'high' = 'low';
  if (score >= 70) level = 'high';
  else if (score >= 40) level = 'medium';

  return clone({
    score,
    level,
    factors: [
      { label: '满意度风险', value: satisfactionRisk },
      { label: '活跃工单压力', value: activeRisk },
      { label: '高优先工单压力', value: highRisk },
      { label: '逾期工单压力', value: overdueRisk },
    ],
  });
}

export async function createTicketFromCustomer(payload: {
  customerId: string;
  title: string;
  category: string;
  priority?: Ticket['priority'];
  summary?: string;
}) {
  await delay(120);
  const customer = store.customers.find((item) => item.id === payload.customerId);
  if (!customer) throw new Error('客户不存在');

  const id = `TK-${1001 + store.tickets.length}`;
  const now = dayjs();

  const ticket: Ticket = {
    id,
    title: payload.title,
    customerId: customer.id,
    customer: customer.name,
    category: payload.category,
    owner: customer.owner,
    priority: payload.priority || 'medium',
    status: 'open',
    createdAt: now.format('YYYY-MM-DD HH:mm'),
    dueAt: now.add(36, 'hour').format('YYYY-MM-DD HH:mm'),
    summary: payload.summary || '客户侧新提交问题，待客服跟进。',
  };

  store.tickets.unshift(ticket);
  ticketTimelineStore[ticket.id] = [
    {
      id: makeTimelineId(),
      time: ticket.createdAt,
      title: '工单创建',
      detail: '由客户页快捷入口发起',
      kind: 'created',
    },
  ];
  appStore.getState().appendActivity(`客户 ${customer.name} 新建工单 ${ticket.id}`);

  return clone(ticket);
}

export async function fetchAgents(query?: { status?: 'all' | Agent['status']; keyword?: string }) {
  await delay(100);

  let result = [...store.agents].map((agent) => ({
    ...agent,
    currentLoad: ticketCountByAgent(agent.name),
  }));

  if (query?.status && query.status !== 'all') {
    result = result.filter((item) => item.status === query.status);
  }

  const keyword = (query?.keyword || '').trim();
  if (keyword) {
    const fuse = new Fuse(result, { threshold: 0.32, keys: ['name', 'team'] });
    result = fuse.search(keyword).map((item) => item.item);
  }

  return clone(result);
}

export async function fetchAgentPerformanceBands() {
  await delay(80);

  const rows = [
    {
      band: 'S',
      title: '高绩效',
      desc: '处理量高且响应快',
      filter: (item: Agent) => item.handledToday >= 10 && item.avgResponseMinutes <= 13,
    },
    {
      band: 'A',
      title: '稳定输出',
      desc: '处理量与时效达标',
      filter: (item: Agent) => item.handledToday >= 7 && item.avgResponseMinutes <= 16,
    },
    {
      band: 'B',
      title: '待提升',
      desc: '需要优化响应效率',
      filter: (_item: Agent) => true,
    },
  ];

  const consumed = new Set<string>();
  const result = rows.map((rule) => {
    const members = store.agents.filter((item) => {
      if (consumed.has(item.id)) return false;
      if (!rule.filter(item)) return false;
      consumed.add(item.id);
      return true;
    });

    const count = members.length;
    const avgHandled = count
      ? Math.round(members.reduce((sum, item) => sum + item.handledToday, 0) / count)
      : 0;
    const avgResponse = count
      ? Math.round(members.reduce((sum, item) => sum + item.avgResponseMinutes, 0) / count)
      : 0;

    return {
      band: rule.band,
      title: rule.title,
      desc: rule.desc,
      count,
      avgHandled,
      avgResponse,
      coverage: Math.round((count / store.agents.length) * 100),
    };
  });

  return clone(result);
}

export async function fetchAgentWeeklyTrend(agentId: string) {
  await delay(80);
  const agent = store.agents.find((item) => item.id === agentId);
  if (!agent) throw new Error('坐席不存在');

  const days = Array.from({ length: 7 }).map((_, offset) => {
    const date = dayjs().subtract(6 - offset, 'day').format('MM-DD');
    const handled = Math.max(1, agent.handledToday - 3 + (offset % 4));
    const response = Math.max(6, agent.avgResponseMinutes + ((offset % 3) - 1) * 2);
    const qualityScore = Math.max(60, Math.min(98, 100 - response + handled));
    const efficiency = Math.max(40, Math.min(100, Math.round((handled / 14) * 100)));

    return {
      date,
      handled,
      response,
      qualityScore,
      efficiency,
    };
  });

  return clone({
    agentId: agent.id,
    agentName: agent.name,
    team: agent.team,
    days,
  });
}

export async function fetchOwners() {
  await delay(80);
  return clone(store.agents.map((item) => item.name));
}

export async function fetchTags(): Promise<string[]> {
  await delay(80);
  const tags = new Set<string>();
  store.knowledgeBase.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).map((tag) => String(tag));
}

export type {
  Ticket,
  KnowledgeArticle,
  Customer,
  Agent,
  TicketEscalationMeta,
};

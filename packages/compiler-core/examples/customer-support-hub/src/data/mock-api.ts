import dayjs from 'dayjs';
import Fuse from 'fuse.js';
import { appStore } from '../store/useAppStore';
import { knowledgeBase as seedKb, tickets as seedTickets, type KnowledgeArticle, type Ticket } from './mock';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const store = {
  tickets: clone(seedTickets),
  knowledgeBase: clone(seedKb),
};

const authKey = 'support-hub-user';

export type User = {
  id: string;
  name: string;
  role: string;
  email: string;
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
    return due.diff(now, 'minute') <= 60;
  }).length;

  return clone({
    openCount,
    processingCount,
    resolvedToday,
    slaRisk,
    recentActivities: appStore.getState().activities,
  });
}

export async function fetchTickets(query?: {
  keyword?: string;
  status?: string;
  priority?: string;
  owner?: string;
}) {
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
      keys: ['id', 'title', 'customer', 'summary', 'owner'],
    });
    result = fuse.search(keyword).map((item) => item.item);
  }

  return clone(result);
}

export async function fetchTicketDetail(id: string) {
  await delay(120);
  const ticket = store.tickets.find((item) => item.id === id);
  if (!ticket) throw new Error('工单不存在');
  return clone(ticket);
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

  appStore.getState().appendActivity(`工单 ${next.id} 状态更新为 ${status}`);
  return clone(next);
}

export async function fetchKnowledgeArticles(query?: { keyword?: string; tag?: string }) {
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

  return clone(result);
}

export async function fetchSlaBoard() {
  await delay();
  const cfg = appStore.getState().slaConfig;
  const now = dayjs();

  const rows = store.tickets.map((ticket) => {
    const due = dayjs(ticket.dueAt);
    const total = dayjs(ticket.dueAt).diff(dayjs(ticket.createdAt), 'minute');
    const spent = now.diff(dayjs(ticket.createdAt), 'minute');
    const ratio = total > 0 ? Math.min(100, Math.max(0, Math.round((spent / total) * 100))) : 0;

    const isDone = ticket.status === 'resolved' || ticket.status === 'closed';
    const risk = isDone ? 'done' : ratio >= cfg.warningThresholdPercent ? 'risk' : 'safe';

    return {
      id: ticket.id,
      title: ticket.title,
      owner: ticket.owner,
      status: ticket.status,
      dueAt: ticket.dueAt,
      remainMinutes: isDone ? 0 : due.diff(now, 'minute'),
      progressPercent: ratio,
      risk,
    };
  });

  return clone({
    config: cfg,
    rows,
  });
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

export async function fetchOwners() {
  await delay(80);
  return clone(Array.from(new Set(store.tickets.map((item) => item.owner))));
}

export async function fetchTags() {
  await delay(80);
  const tags = new Set<string>();
  store.knowledgeBase.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
  return clone(Array.from(tags));
}

export type { Ticket, KnowledgeArticle };

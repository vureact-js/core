import {
  workspaceStats as seedWorkspaceStats,
  kpis as seedKpis,
  activities as seedActivities,
  alerts as seedAlerts,
  teamLoad as seedTeamLoad,
  customers as seedCustomers,
  leads as seedLeads,
  tasks as seedTasks,
  stages as seedStages,
} from './mock';

type Workspace = { name: string; region: string; plan: string };

type Customer = (typeof seedCustomers)[0];
type Lead = (typeof seedLeads)[0];
type Task = (typeof seedTasks)[0];

type User = { name: string; role: string; email: string };

type CustomerNote = {
  id: string;
  customerId: string;
  author: string;
  content: string;
  time: string;
};

type Settings = {
  preferences: {
    dailyDigest: boolean;
    slaAlert: boolean;
    pipelineNotify: boolean;
  };
  sla: {
    firstReply: number;
    followUp: number;
    silentDays: number;
  };
};

export type NotificationType = 'approval' | 'task' | 'lead' | 'system';
export type NotificationStatus = 'unread' | 'archived';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  createdAt: string;
  relatedId?: string;
};

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ApprovalItem = {
  id: string;
  title: string;
  type: string;
  target: string;
  amount?: number;
  reason: string;
  status: ApprovalStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalHistoryItem = {
  id: string;
  approvalId: string;
  action: 'create' | 'approve' | 'reject';
  operator: string;
  comment?: string;
  createdAt: string;
};

const authKey = 'crm-ops-auth-user';
let memoryUser: User | null = null;

const LEAD_APPROVAL_THRESHOLD = 100;

const delay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const nowLabel = () => '刚刚';

const store = {
  workspaceStats: clone(seedWorkspaceStats),
  kpis: clone(seedKpis),
  activities: clone(seedActivities),
  alerts: clone(seedAlerts),
  teamLoad: clone(seedTeamLoad),
  customers: clone(seedCustomers),
  customerNotes: [
    {
      id: 'N-01',
      customerId: 'C-1001',
      author: '张琳',
      content: '确认物流系统对接范围，等待技术确认。',
      time: '今天 10:30',
    },
    {
      id: 'N-02',
      customerId: 'C-1001',
      author: '王琪',
      content: '已发送季度复盘材料，安排下周回访。',
      time: '昨天 16:20',
    },
    {
      id: 'N-03',
      customerId: 'C-1002',
      author: '李晨',
      content: '客户连续两周未响应，需要升级跟进。',
      time: '前天 09:15',
    },
  ] as CustomerNote[],
  leads: clone(seedLeads),
  tasks: clone(seedTasks),
  stages: clone(seedStages),
  notifications: [
    {
      id: 'NT-01',
      type: 'system',
      title: '周会提醒',
      content: '请在今天 17:00 前更新本周项目进展。',
      status: 'unread',
      createdAt: '今天 09:30',
    },
    {
      id: 'NT-02',
      type: 'approval',
      title: '审批已通过',
      content: '“信航数据年度续约折扣”审批已通过。',
      status: 'unread',
      createdAt: '昨天 14:18',
      relatedId: 'AP-01',
    },
  ] as NotificationItem[],
  approvals: [
    {
      id: 'AP-01',
      title: '信航数据年度续约折扣',
      type: '折扣审批',
      target: '信航数据',
      amount: 128,
      reason: '关键客户续约，需给予阶段折扣提升成交率。',
      status: 'approved',
      createdBy: '李晨',
      createdAt: '昨天 10:20',
      updatedAt: '昨天 14:18',
    },
    {
      id: 'AP-02',
      title: '海辰科技扩容方案预算',
      type: '预算审批',
      target: '海辰科技',
      amount: 156,
      reason: '客户希望提前扩容，需确认预算可用。',
      status: 'pending',
      createdBy: '张琳',
      createdAt: '今天 11:05',
      updatedAt: '今天 11:05',
    },
  ] as ApprovalItem[],
  approvalHistory: [
    {
      id: 'AH-01',
      approvalId: 'AP-01',
      action: 'create',
      operator: '李晨',
      comment: '提交折扣审批。',
      createdAt: '昨天 10:20',
    },
    {
      id: 'AH-02',
      approvalId: 'AP-01',
      action: 'approve',
      operator: '运营主管',
      comment: '同意，限本季度执行。',
      createdAt: '昨天 14:18',
    },
  ] as ApprovalHistoryItem[],
  workspace: {
    name: '星河科技',
    region: '华东',
    plan: 'Growth',
  } as Workspace,
  settings: {
    preferences: {
      dailyDigest: true,
      slaAlert: true,
      pipelineNotify: false,
    },
    sla: {
      firstReply: 4,
      followUp: 3,
      silentDays: 14,
    },
  } as Settings,
};

function setAuthUser(user: User | null) {
  memoryUser = user;
  if (typeof localStorage === 'undefined') return;
  if (!user) {
    localStorage.removeItem(authKey);
    return;
  }
  localStorage.setItem(authKey, JSON.stringify(user));
}

function createNotification(payload: {
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
}) {
  const id = `NT-${(store.notifications.length + 1).toString().padStart(2, '0')}`;
  const next: NotificationItem = {
    id,
    status: 'unread',
    createdAt: nowLabel(),
    ...payload,
  };
  store.notifications.unshift(next);
  return next;
}

function createApprovalRecord(payload: {
  title: string;
  type: string;
  target: string;
  amount?: number;
  reason: string;
  createdBy: string;
}) {
  const id = `AP-${(store.approvals.length + 1).toString().padStart(2, '0')}`;
  const next: ApprovalItem = {
    id,
    title: payload.title,
    type: payload.type,
    target: payload.target,
    amount: payload.amount,
    reason: payload.reason,
    status: 'pending',
    createdBy: payload.createdBy,
    createdAt: nowLabel(),
    updatedAt: nowLabel(),
  };
  store.approvals.unshift(next);

  const historyId = `AH-${(store.approvalHistory.length + 1).toString().padStart(2, '0')}`;
  store.approvalHistory.unshift({
    id: historyId,
    approvalId: next.id,
    action: 'create',
    operator: payload.createdBy,
    comment: payload.reason,
    createdAt: nowLabel(),
  });

  return next;
}

function createLeadApprovalIfNeeded(payload: { lead: Lead; actor: string }) {
  if (payload.lead.value < LEAD_APPROVAL_THRESHOLD) {
    return null;
  }

  const existed = store.approvals.find(
    (item) => item.target === payload.lead.name && item.status === 'pending',
  );
  if (existed) {
    return existed;
  }

  const approval = createApprovalRecord({
    title: `高价值线索审批：${payload.lead.name}`,
    type: '高价值线索',
    target: payload.lead.name,
    amount: payload.lead.value,
    reason: `线索金额达到 ${payload.lead.value} 万，需审批资源投入。`,
    createdBy: payload.actor,
  });

  createNotification({
    type: 'approval',
    title: '新增待审批事项',
    content: `${approval.title} 已提交，请尽快处理。`,
    relatedId: approval.id,
  });

  return approval;
}

export function getAuthUser(): User | null {
  if (memoryUser) return memoryUser;
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(authKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    memoryUser = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function isAuthed(): boolean {
  return !!getAuthUser();
}

export async function login(payload: { email: string; password: string }) {
  await delay();
  if (!payload.email || payload.password.length < 3) {
    throw new Error('账号或密码错误');
  }

  const name = payload.email.split('@')[0] || '运营负责人';
  const user: User = { name, role: '运营主管', email: payload.email };
  setAuthUser(user);
  return clone(user);
}

export async function register(payload: { name: string; email: string; password: string }) {
  await delay();
  if (!payload.name || !payload.email || payload.password.length < 3) {
    throw new Error('请填写完整注册信息');
  }
  const user: User = { name: payload.name, role: '运营主管', email: payload.email };
  setAuthUser(user);
  return clone(user);
}

export async function logout() {
  await delay(120);
  setAuthUser(null);
}

export async function fetchWorkspace() {
  await delay();
  return clone(store.workspace);
}

export async function updateWorkspace(next: Workspace) {
  await delay();
  store.workspace = { ...next };
  return clone(store.workspace);
}

export async function fetchWorkspaceStats() {
  await delay();
  return clone(store.workspaceStats);
}

export async function fetchDashboard() {
  await delay();
  return {
    kpis: clone(store.kpis),
    activities: clone(store.activities),
    alerts: clone(store.alerts),
    teamLoad: clone(store.teamLoad),
    leads: clone(store.leads),
    stages: clone(store.stages),
  };
}

export async function fetchCollabSummary() {
  await delay(120);
  const unreadCount = store.notifications.filter((item) => item.status === 'unread').length;
  const pendingApprovals = store.approvals.filter((item) => item.status === 'pending').length;
  const handledToday = store.approvalHistory.filter(
    (item) => (item.action === 'approve' || item.action === 'reject') && item.createdAt.includes('今天'),
  ).length;

  return clone({ unreadCount, pendingApprovals, handledToday });
}

export async function fetchTeamLoad() {
  await delay();
  return clone(store.teamLoad);
}

export async function fetchStages() {
  await delay();
  return clone(store.stages);
}

export async function addActivity(action: { who: string; action: string; target: string }) {
  await delay(120);
  const id = store.activities.length + 1;
  store.activities.unshift({ id, ...action, time: nowLabel() });
  return clone(store.activities[0]);
}

export async function fetchCustomers() {
  await delay();
  return clone(store.customers);
}

export async function fetchCustomerNotes(customerId: string) {
  await delay();
  return clone(store.customerNotes.filter((note) => note.customerId === customerId));
}

export async function addCustomerNote(payload: Omit<CustomerNote, 'id' | 'time'>) {
  await delay(120);
  const id = `N-${(store.customerNotes.length + 1).toString().padStart(2, '0')}`;
  const note: CustomerNote = {
    id,
    time: nowLabel(),
    ...payload,
  };
  store.customerNotes.unshift(note);
  return clone(note);
}

export async function createCustomer(payload: Omit<Customer, 'id' | 'lastTouch' | 'score'>) {
  await delay();
  const id = `C-${1000 + store.customers.length + 1}`;
  const next: Customer = {
    id,
    score: 72,
    lastTouch: '今天',
    ...payload,
  };
  store.customers.unshift(next);
  return clone(next);
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  await delay();
  const index = store.customers.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('客户不存在');
  store.customers[index] = { ...store.customers[index], ...patch } as Customer;
  return clone(store.customers[index]);
}

export async function fetchLeads() {
  await delay();
  return clone(store.leads);
}

export async function createLead(payload: Partial<Lead>) {
  await delay();
  const id = `L-${2000 + store.leads.length + 1}`;
  const next: Lead = {
    id,
    name: payload.name || '新线索',
    value: payload.value ?? 24,
    stage: payload.stage || '新线索',
    owner: payload.owner || '张琳',
    probability: payload.probability || '15%',
    daysInStage: payload.daysInStage ?? 0,
    source: payload.source || '新建',
    nextAction: payload.nextAction || '安排首轮沟通',
  };
  store.leads.unshift(next);

  createNotification({
    type: 'lead',
    title: '新增线索',
    content: `${next.owner} 新增了线索「${next.name}」。`,
    relatedId: next.id,
  });

  const actor = getAuthUser()?.name || next.owner;
  createLeadApprovalIfNeeded({ lead: next, actor });

  return clone(next);
}

export async function moveLead(id: string, direction: 'next' | 'prev') {
  await delay(120);
  const order = store.stages.map((stage) => stage.key);
  const index = store.leads.findIndex((lead) => lead.id === id);
  if (index === -1) throw new Error('线索不存在');
  const current = store.leads[index];
  const position = order.indexOf(current.stage);
  const nextIndex = direction === 'next' ? position + 1 : position - 1;
  const nextStage = order[nextIndex] ?? current.stage;
  store.leads[index] = { ...current, stage: nextStage, daysInStage: 0 };

  createNotification({
    type: 'lead',
    title: '线索阶段更新',
    content: `线索「${current.name}」已更新为「${nextStage}」。`,
    relatedId: current.id,
  });

  const actor = getAuthUser()?.name || current.owner;
  createLeadApprovalIfNeeded({ lead: store.leads[index], actor });

  return clone(store.leads[index]);
}

export async function triggerLeadApprovalByThreshold(id: string) {
  await delay(80);
  const lead = store.leads.find((item) => item.id === id);
  if (!lead) {
    throw new Error('线索不存在');
  }
  const actor = getAuthUser()?.name || lead.owner;
  const approval = createLeadApprovalIfNeeded({ lead, actor });
  return clone({ triggered: !!approval, approval: approval ? approval.id : null });
}

export async function resetLeads() {
  await delay();
  store.leads = clone(seedLeads);
  return clone(store.leads);
}

export async function fetchTasks() {
  await delay();
  return clone(store.tasks);
}

export async function createTask(payload: Partial<Task>) {
  await delay();
  const id = `T-${(store.tasks.length + 1).toString().padStart(2, '0')}`;
  const next: Task = {
    id,
    title: payload.title || '新任务',
    owner: payload.owner || '王琪',
    status: payload.status || '待开始',
    priority: payload.priority || '中',
    due: payload.due || '本周',
    customer: payload.customer || '待分配',
    type: payload.type || '跟进',
  };
  store.tasks.unshift(next);
  return clone(next);
}

export async function updateTaskStatus(id: string, status: Task['status']) {
  await delay(120);
  const index = store.tasks.findIndex((task) => task.id === id);
  if (index === -1) throw new Error('任务不存在');
  store.tasks[index] = { ...store.tasks[index], status } as Task;
  return clone(store.tasks[index]);
}

export async function notifyTaskBlocked(payload: {
  id: string;
  title: string;
  owner: string;
  reason?: string;
}) {
  await delay(80);
  createNotification({
    type: 'task',
    title: '任务进入阻塞',
    content: `${payload.owner} 的任务「${payload.title}」进入阻塞。${payload.reason ? `原因：${payload.reason}` : ''}`,
    relatedId: payload.id,
  });
  return clone({ success: true });
}

export async function fetchSettings() {
  await delay();
  return clone(store.settings);
}

export async function updateSettings(next: Settings) {
  await delay();
  store.settings = clone(next);
  return clone(store.settings);
}

export async function fetchNotifications(params?: {
  status?: 'all' | 'unread' | 'archived';
  keyword?: string;
  type?: string;
}) {
  await delay(160);
  const status = params?.status || 'all';
  const keyword = (params?.keyword || '').trim();
  const type = params?.type || 'all';

  return clone(
    store.notifications.filter((item) => {
      const hitStatus = status === 'all' || item.status === status;
      const hitType = type === 'all' || item.type === type;
      const hitKeyword = !keyword || item.title.includes(keyword) || item.content.includes(keyword);
      return hitStatus && hitType && hitKeyword;
    }),
  );
}

export async function markNotificationRead(id: string) {
  await delay(80);
  const index = store.notifications.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('通知不存在');
  store.notifications[index] = { ...store.notifications[index], status: 'archived' };
  return clone(store.notifications[index]);
}

export async function markAllNotificationsRead() {
  await delay(120);
  store.notifications = store.notifications.map((item) => ({ ...item, status: 'archived' }));
  return clone({ success: true });
}

export async function archiveNotification(id: string) {
  await delay(80);
  const index = store.notifications.findIndex((item) => item.id === id);
  if (index === -1) throw new Error('通知不存在');
  store.notifications[index] = { ...store.notifications[index], status: 'archived' };
  return clone(store.notifications[index]);
}

export async function fetchApprovals(params?: {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  keyword?: string;
}) {
  await delay(160);
  const status = params?.status || 'all';
  const keyword = (params?.keyword || '').trim();

  const approvals = store.approvals.filter((item) => {
    const hitStatus = status === 'all' || item.status === status;
    const hitKeyword = !keyword || item.title.includes(keyword) || item.target.includes(keyword);
    return hitStatus && hitKeyword;
  });

  return clone(approvals);
}

export async function fetchApprovalHistory(approvalId: string) {
  await delay(120);
  return clone(store.approvalHistory.filter((item) => item.approvalId === approvalId));
}

export async function createApproval(payload: {
  title: string;
  type: string;
  target: string;
  amount?: number;
  reason: string;
}) {
  await delay(160);
  const actor = getAuthUser()?.name || '运营主管';
  const approval = createApprovalRecord({
    ...payload,
    createdBy: actor,
  });

  createNotification({
    type: 'approval',
    title: '新增审批单',
    content: `${approval.title} 已由 ${actor} 发起。`,
    relatedId: approval.id,
  });

  return clone(approval);
}

export async function reviewApproval(payload: {
  id: string;
  action: 'approve' | 'reject';
  comment?: string;
}) {
  await delay(160);
  const index = store.approvals.findIndex((item) => item.id === payload.id);
  if (index === -1) throw new Error('审批单不存在');

  const targetStatus: ApprovalStatus = payload.action === 'approve' ? 'approved' : 'rejected';
  const operator = getAuthUser()?.name || '运营主管';

  store.approvals[index] = {
    ...store.approvals[index],
    status: targetStatus,
    updatedAt: nowLabel(),
  };

  const historyId = `AH-${(store.approvalHistory.length + 1).toString().padStart(2, '0')}`;
  store.approvalHistory.unshift({
    id: historyId,
    approvalId: payload.id,
    action: payload.action,
    operator,
    comment: payload.comment,
    createdAt: nowLabel(),
  });

  createNotification({
    type: 'approval',
    title: targetStatus === 'approved' ? '审批已通过' : '审批已驳回',
    content: `${store.approvals[index].title} ${targetStatus === 'approved' ? '已通过' : '已驳回'}。`,
    relatedId: payload.id,
  });

  return clone(store.approvals[index]);
}

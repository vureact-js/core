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

const authKey = 'crm-ops-auth-user';
let memoryUser: User | null = null;

const delay = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

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
  store.activities.unshift({ id, ...action, time: '刚刚' });
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
    time: '刚刚',
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
  return clone(store.leads[index]);
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

export async function fetchSettings() {
  await delay();
  return clone(store.settings);
}

export async function updateSettings(next: Settings) {
  await delay();
  store.settings = clone(next);
  return clone(store.settings);
}

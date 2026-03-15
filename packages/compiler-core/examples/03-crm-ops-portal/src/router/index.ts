import { createRouter, createWebHashHistory } from 'vue-router';
import Dashboard from '../pages/Dashboard.vue';
import Customers from '../pages/Customers.vue';
import LeadsPipeline from '../pages/LeadsPipeline.vue';
import TasksBoard from '../pages/TasksBoard.vue';
import Settings from '../pages/Settings.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard, meta: { title: '仪表盘' } },
    { path: '/customers', name: 'customers', component: Customers, meta: { title: '客户' } },
    { path: '/leads', name: 'leads', component: LeadsPipeline, meta: { title: '线索管道' } },
    { path: '/tasks', name: 'tasks', component: TasksBoard, meta: { title: '任务看板' } },
    { path: '/settings', name: 'settings', component: Settings, meta: { title: '设置' } },
  ],
});

export default router;

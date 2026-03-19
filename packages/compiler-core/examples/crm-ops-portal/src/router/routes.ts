import type { RouteRecordRaw } from 'vue-router';
import App from '../App.vue';
import Customers from '../pages/Customers.vue';
import Dashboard from '../pages/Dashboard.vue';
import LeadsPipeline from '../pages/LeadsPipeline.vue';
import Settings from '../pages/Settings.vue';
import TasksBoard from '../pages/TasksBoard.vue';
import Login from '../pages/auth/Login.vue';
import Register from '../pages/auth/Register.vue';

export default [
  {
    path: '/',
    component: App,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: Dashboard, meta: { title: '仪表盘' } },
      { path: 'customers', name: 'customers', component: Customers, meta: { title: '客户' } },
      { path: 'leads', name: 'leads', component: LeadsPipeline, meta: { title: '线索管道' } },
      { path: 'tasks', name: 'tasks', component: TasksBoard, meta: { title: '任务看板' } },
      { path: 'settings', name: 'settings', component: Settings, meta: { title: '设置' } },
      { path: 'login', name: 'login', component: Login, meta: { public: true, title: '登录' } },
      {
        path: 'register',
        name: 'register',
        component: Register,
        meta: { public: true, title: '注册' },
      },
    ],
  },
] as RouteRecordRaw[];

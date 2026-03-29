import type { RouteRecordRaw } from 'vue-router';
import App from '../App.vue';
import Dashboard from '../pages/Dashboard.vue';
import KnowledgeBase from '../pages/KnowledgeBase.vue';
import SlaBoard from '../pages/SlaBoard.vue';
import Settings from '../pages/Settings.vue';
import TicketDetail from '../pages/TicketDetail.vue';
import TicketsList from '../pages/TicketsList.vue';
import Login from '../pages/auth/Login.vue';

export default [
  {
    path: '/',
    component: App,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: Dashboard, meta: { title: '总览' } },
      { path: 'tickets', name: 'tickets', component: TicketsList, meta: { title: '工单列表' } },
      { path: 'tickets/:id', name: 'ticket-detail', component: TicketDetail, meta: { title: '工单详情' } },
      { path: 'knowledge', name: 'knowledge', component: KnowledgeBase, meta: { title: '知识库' } },
      { path: 'sla', name: 'sla', component: SlaBoard, meta: { title: 'SLA 看板' } },
      { path: 'settings', name: 'settings', component: Settings, meta: { title: '设置' } },
      { path: 'login', name: 'login', component: Login, meta: { title: '登录', public: true } },
    ],
  },
] as RouteRecordRaw[];

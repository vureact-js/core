import { createRouter, createWebHashHistory } from 'vue-router';
import routes from './routes';
import { appStore } from '../store/useAppStore';

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    next();
    return;
  }

  const session = appStore.getState().session;
  if (!session.user) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  next();
});

export default router;

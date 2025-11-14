import RouterLink from './components/RouterLink';
import RouterView from './components/RouterView';

export { RouterLink, RouterView };

export * from './components/RouterLink';
export * from './components/RouterView';
export * from './creator/createRouter';
export * from './hooks/useRoute';
export * from './hooks/useRouter';

export {
  createMemoryHistory,
  createWebHashHistory,
  createWebHistory,
} from './creator/createHistory';

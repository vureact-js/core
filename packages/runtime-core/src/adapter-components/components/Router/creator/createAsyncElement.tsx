import { lazy, ReactNode, Suspense } from 'react';

export type ComponentLoader = () => Promise<{ default: React.ComponentType }>;

const _lazyComponentCache = new WeakMap<ComponentLoader, React.ComponentType>();

export const createAsyncElement = (componentLoader: ComponentLoader, fallback?: ReactNode) => {
  const LazyComponent = getLazyComponent(componentLoader);
  return (
    <Suspense fallback={fallback ?? <div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
};

function getLazyComponent(loader: ComponentLoader) {
  let Comp = _lazyComponentCache.get(loader);
  if (!Comp) {
    Comp = lazy(loader);
    _lazyComponentCache.set(loader, Comp);
  }
  return Comp;
}

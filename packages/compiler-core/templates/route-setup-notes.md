# Router Setup Notes (Manual Steps Required)

If your Vue project uses Vue Router, the compiler will:

- Inject `@vureact/router` into the output dependencies
- Convert `<router-link>` / `<router-view>` and related APIs
- Generate React code in the output project

However, the router **configuration file** and **entry mounting** still need a small manual adjustment. Follow the steps below in the output project (the `react-app` folder):

## 1. Verify dependencies

`@vureact/router` should already be present in `package.json` (auto-injected).

## 2. Update the entry file (`src/main.tsx`)

The entry should only render the router provider. Do not render `<App />` here, because `App` should be wired in the router config.

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import router from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <router.RouterProvider />
  </StrictMode>,
);
```

## 3. Convert the router config to JSX/TSX

Your router file should be `.tsx`/`.jsx` so that route components can be expressed as JSX elements.

Checklist:

- Rename `src/router/index.ts` to `src/router/index.tsx` (or `.jsx`)
- Export `createRouter` instance
- Import route components as React components
- Such as replace `component: Foo` with `component: <Foo />`
- Move `App` into the route tree as the root component (if applicable)

Example:

```tsx
import { createRouter, createWebHashHistory } from '@vureact/router';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import Customers from '../pages/Customers';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: <App />,
      children: [
        { path: '', component: <Dashboard /> },
        { path: 'customers', component: <Customers /> },
      ],
    },
  ],
});

export default router;
```

## 4. Quick sanity checks

- `App` should contain your layout and a `<RouterView />` where pages are rendered.
- If you use route guards or custom meta fields, confirm they still match your runtime expectations.

## 5. Protect the Adjusted Files

> Warning: If this step is not performed, the page will crash because the `.ts` / `.js` files migrated from the Vue router configuration cannot run directly in React.

After the initial compilation, it is recommended to add the Vue router configuration file and the root component `<App />` to the `exclude` option in `vureact.config.js`. This prevents subsequent recompilations from overwriting the already adjusted router configuration. If you need to modify these files later, you must **manually synchronize** the changes.

示例：

```js
export default defineConfig({
  exclude: ['src/main.ts', 'src/App.vue', 'src/router/**'],
});
```

## 6. Run the app

```bash
npm install
npm run dev
```

This note is copied into the output directory whenever the compiler detects router usage.

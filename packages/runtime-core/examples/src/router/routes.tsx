import { RouteObject } from 'react-router-dom';
import App from '../App';
import { routeConfigForComponents } from './component-config';
import { routeConfigForHooks } from './hook-config';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [routeConfigForComponents, routeConfigForHooks],
  },
];

export default routes;

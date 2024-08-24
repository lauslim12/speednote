import '@fontsource-variable/inter';
import './index.css';

import { Route, Router } from '@solidjs/router';
import { lazy } from 'solid-js';
import { render } from 'solid-js/web';

import App from './App';

const NotFound = lazy(() => import('./NotFound'));

render(
  () => (
    <Router>
      <Route path="/" component={App} />
      <Route path="*" component={NotFound} />
    </Router>
  ),
  document.getElementById('root')!,
);

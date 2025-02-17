import '@fontsource-variable/inter';
import './index.css';

import { Route, Router } from '@solidjs/router';
import { lazy } from 'solid-js';
import { render } from 'solid-js/web';

import App from './app';

const NotFound = lazy(() => import('./not-found'));

const root = document.getElementById('root');
if (!root) {
	throw new Error('Root of the application is not defined.');
}

render(
	() => (
		<Router>
			<Route path="/" component={App} />
			<Route path="*" component={NotFound} />
		</Router>
	),
	root,
);

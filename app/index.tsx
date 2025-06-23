import '@fontsource-variable/inter';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { App } from '~/app';

const root = document.getElementById('root');
if (!root) {
	throw new Error('Root element is not defined.');
}

createRoot(root).render(
	<StrictMode>
		<Toaster
			closeButton
			position="bottom-right"
			toastOptions={{
				duration: 2000,
				className:
					'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100',
			}}
		/>
		<App />
	</StrictMode>,
);

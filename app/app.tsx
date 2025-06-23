import { Editor } from '~/editor';
import { Header } from '~/header';

/**
 * Speednote application.
 */
export const App = () => (
	<div className="mx-auto flex min-h-screen max-w-7xl flex-col p-5">
		<Header />

		<main className="flex flex-1 flex-col px-0 py-8 sm:px-2 md:px-6 lg:px-12 xl:px-20">
			<Editor />
		</main>

		<footer className="mt-auto text-center text-gray-500 text-xs transition-colors duration-300 dark:text-gray-600">
			<p>Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan</p>
			<p className="mt-1.5 text-[0.5rem] opacity-60">
				{import.meta.env.VITE_APP_VERSION}
			</p>
		</footer>
	</div>
);

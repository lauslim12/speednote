import { Editor } from '~/editor';
import { Header } from '~/header';

/**
 * Speednote application.
 */
export const App = () => (
	<div className="max-w-7xl min-h-screen p-5 mx-auto flex flex-col">
		<Header />

		<main className="flex flex-1 flex-col px-0 py-8 sm:px-2 md:px-6 lg:px-12 xl:px-20">
			<Editor />
		</main>

		<footer className="text-center text-xs text-gray-500 dark:text-gray-600 mt-auto transition-colors duration-300">
			<p>Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan</p>
			<p className="mt-1.5 opacity-60 text-[0.5rem]">
				{import.meta.env.VITE_APP_VERSION}
			</p>
		</footer>
	</div>
);

import { Editor } from "~/editor";
import { Header } from "~/header";

/**
 * Speednote application.
 *
 * There is a known Chrome/Blink rendering bug on specific MacOS hardware profiles
 * (notably i9 Intel/AMD GPUs) where transparent, stretched flex containers (`flex-1`)
 * fail to composite correctly.
 *
 * The GPU attempts to optimize by skipping the paint for the empty stretched area,
 * resulting in dead, uninitialized tiles that render as solid black horizontal bands.
 *
 * By explicitly declaring the background colors (`bg-gray-50 dark:bg-stone-900`)
 * on this flex container, we force the hardware compositor to paint the tiles,
 * bypassing the optimization glitch.
 */
export const App = () => (
	<div className="mx-auto flex min-h-screen max-w-7xl flex-col bg-gray-50 p-5 transition-colors duration-300 dark:bg-stone-900">
		<Header />

		<main className="flex flex-1 flex-col px-0 py-8 sm:px-4 md:px-10 lg:px-20 xl:px-32">
			<Editor />
		</main>

		<footer className="mt-auto text-center text-[0.5rem] text-gray-400 opacity-60 transition-colors duration-300 dark:text-gray-600">
			<p>
				{import.meta.env.VITE_APP_VERSION} (
				{import.meta.env.VITE_GIT_SHORT_SHA ?? "local"})
			</p>
		</footer>
	</div>
);

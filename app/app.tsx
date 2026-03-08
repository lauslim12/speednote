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
 * By explicitly declaring the background colors (`bg-gray-50 dark:bg-slate-950`)
 * on this flex container, we force the hardware compositor to paint the tiles,
 * bypassing the optimization glitch.
 */
export const App = () => (
	<div className="mx-auto flex min-h-screen max-w-7xl flex-col bg-gray-50 p-5 transition-colors duration-300 dark:bg-gray-950">
		<Header />

		<main className="flex flex-1 flex-col px-0 py-8 sm:px-2 md:px-6 lg:px-12 xl:px-20">
			<Editor />
		</main>

		<footer className="mt-auto text-center text-gray-500 text-xs transition-colors duration-300 dark:text-gray-600">
			<p>Thank you so much for using Speednote! Made with ♥ in Tokyo, Japan</p>
			<p className="mt-1.5 text-[0.5rem] opacity-60">
				{import.meta.env.VITE_APP_VERSION} (
				{import.meta.env.VITE_GIT_SHORT_SHA ?? "local"})
			</p>
		</footer>
	</div>
);

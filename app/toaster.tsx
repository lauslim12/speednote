import { Toaster } from "sonner";
import { useDarkTheme } from "./use-dark-mode.ts";

export const ThemedToaster = () => {
	const { isDark } = useDarkTheme();

	return (
		<Toaster
			closeButton
			position="bottom-right"
			theme={isDark ? "dark" : "light"}
			toastOptions={{
				className:
					"bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100",
				duration: 2000,
			}}
		/>
	);
};

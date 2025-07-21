import { Store, useStore } from "@tanstack/react-store";

/**
 * Color theme store. For now, the store is named dark theme store
 * since it's the only thing being stored right now. This is not made
 * as a state for synchronization if it gets called in other components.
 */
const DarkThemeStore = new Store(
	document.documentElement.classList.contains("dark"),
);

/**
 * Hook to use the dark theme. May be upgraded to include other
 * themes in the future.
 */
export const useDarkTheme = () => {
	const isDark = useStore(DarkThemeStore);

	const setColorTheme = (isDark: boolean) => {
		DarkThemeStore.setState(isDark);

		if (isDark) {
			document.documentElement.classList.add("dark");
			return;
		}

		document.documentElement.classList.remove("dark");
	};

	return { isDark, setColorTheme };
};

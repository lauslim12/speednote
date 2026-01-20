import { Store, useStore } from "@tanstack/react-store";
import { useEffect } from "react";

/**
 * Color theme store. For now, the store is named dark theme store
 * since it's the only thing being stored right now. This is not made
 * as a state for synchronization if it gets called in other components.
 */
const DarkThemeStore = new Store(
	window.matchMedia("(prefers-color-scheme: dark)").matches,
);

/**
 * Subscribe to changes in the dark theme store to ensure only one
 * listener updates the DOM, regardless of how many components use the hook.
 */
DarkThemeStore.subscribe(() => {
	// Read state directly from the store.
	const isDark = DarkThemeStore.state;

	if (isDark) {
		document.documentElement.classList.add("dark");
		return;
	}

	document.documentElement.classList.remove("dark");
});

/**
 * Hook to use the dark theme. May be upgraded to include other
 * themes in the future.
 */
export const useDarkTheme = () => {
	const isDark = useStore(DarkThemeStore);

	// Sync the theme with system preference.
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleMediaQueryUpdate = (e: MediaQueryListEvent) => {
			DarkThemeStore.setState(() => e.matches);
		};

		// Listen to changes, and cleanup on unmount.
		mediaQuery.addEventListener("change", handleMediaQueryUpdate);
		return () => {
			mediaQuery.removeEventListener("change", handleMediaQueryUpdate);
		};
	}, []);

	const toggleColorTheme = () => {
		DarkThemeStore.setState((previous) => !previous);
	};

	return { isDark, toggleColorTheme };
};

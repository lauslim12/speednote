import { useState } from "react";
import { Button } from "~/button";
import { Link } from "~/link";

/**
 * Header of the application.
 */
export const Header = () => {
	// Initializer pattern since this state should only be initialized once.
	const [isDark, setIsDark] = useState(() =>
		document.documentElement.classList.contains("dark"),
	);

	const handleThemeToggle = () => {
		if (isDark) {
			setIsDark(false);
			document.documentElement.classList.remove("dark");
			return;
		}

		setIsDark(true);
		document.documentElement.classList.add("dark");
	};

	return (
		<header className="flex justify-end gap-2">
			<Button
				aria-label="Color mode switch"
				onClick={handleThemeToggle}
				variant="secondary"
			>
				{isDark ? "Lighten" : "Darken"}
			</Button>

			<Link
				href="https://github.com/lauslim12/speednote"
				rel="noopener noreferrer"
				target="_blank"
			>
				About ↗
			</Link>
		</header>
	);
};

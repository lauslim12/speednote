import { Button } from "~/button";
import { Link } from "~/link";
import { useDarkTheme } from "./use-dark-mode";

/**
 * Header of the application.
 */
export const Header = () => {
	const { isDark, setColorTheme } = useDarkTheme();

	return (
		<header className="flex justify-end gap-2">
			<Button
				aria-label="Color mode switch"
				onClick={() => setColorTheme(!isDark)}
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

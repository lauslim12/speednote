import { createSignal, onMount } from 'solid-js';

import Button from './Button';

const Configuration = () => {
	const root = document.documentElement;
	const isDarkMedia = window.matchMedia('(prefers-color-scheme: dark)');
	const [isDark, setIsDark] = createSignal(isDarkMedia.matches);

	onMount(() => {
		if (isDarkMedia.matches) {
			root.classList.add('dark');
			return;
		}

		root.classList.remove('dark');
	});

	const handleThemeChange = () => {
		if (isDark()) {
			root.classList.remove('dark');
			setIsDark(false);
			return;
		}

		root.classList.add('dark');
		setIsDark(true);
	};

	return (
		<>
			<Button aria-label="Color mode switch" onClick={handleThemeChange}>
				{isDark() ? 'Lighten' : 'Darken'}
			</Button>
		</>
	);
};

export default Configuration;

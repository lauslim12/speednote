import defaultTheme from 'tailwindcss/defaultTheme';
import type { Config } from 'tailwindcss/types/config';

export default {
	content: ['./src/**/*.{js,jsx,ts,tsx}', 'index.html'],
	darkMode: ['selector'],
	theme: {
		fontFamily: {
			sans: ['Inter Variable', ...defaultTheme.fontFamily.sans],
		},
		extend: {
			colors: {
				link: '#0984e3',
				thanks: '#ee5a24',
				time: '#636e72',
				frozen: '#808e9b',
				selection: '#f1c40f',
				gradient: {
					start: 'rgba(214, 219, 220, 1)',
					end: 'rgba(255, 255, 255, 1)',
				},
			},
			boxShadow: {
				emboss: '0 1rem 4rem rgba(0, 0, 0, 0.25)',
			},
		},
	},
	plugins: [],
} satisfies Config;

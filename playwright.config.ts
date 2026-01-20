import { defineConfig, devices } from "@playwright/test";

const PLAYWRIGHT_BASE_URL = "http://localhost:3000";

export default defineConfig({
	forbidOnly: !!process.env.CI,
	fullyParallel: true,
	projects: [
		{
			name: "Desktop Chrome",
			use: {
				...devices["Desktop Chrome"],
			},
		},
		{
			name: "Desktop Firefox",
			use: {
				...devices["Desktop Firefox"],
			},
		},
		{
			name: "Desktop Safari",
			use: {
				...devices["Desktop Safari"],
			},
		},
		{
			name: "Desktop Edge",
			use: {
				...devices["Desktop Edge"],
			},
		},
		{
			name: "Mobile Safari",
			use: {
				...devices["iPhone 15"],
			},
		},
		{
			name: "Mobile Chrome",
			use: {
				...devices["Pixel 7"],
			},
		},
		{
			name: "Desktop Chrome HiDPI",
			use: {
				...devices["Desktop Chrome HiDPI"],
			},
		},
		{
			name: "Desktop Firefox HiDPI",
			use: {
				...devices["Desktop Firefox HiDPI"],
			},
		},
		{
			name: "Desktop Edge HiDPI",
			use: {
				...devices["Desktop Edge HiDPI"],
			},
		},
	],
	reporter: [["list"], ["html"]],
	testDir: "e2e",
	use: {
		baseURL: PLAYWRIGHT_BASE_URL,
		colorScheme: "light",
		trace: "on-first-retry",
	},
	webServer: {
		command: process.env.PRODUCTION_READY ? "pnpm preview" : "pnpm dev", // In production ready environments, use `pnpm preview` to simulate production environments.
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
		url: PLAYWRIGHT_BASE_URL,
	},
	workers: process.env.CI ? 1 : undefined,
});

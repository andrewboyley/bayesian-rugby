import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	outputDir: 'test-results/artifacts',
	timeout: 60_000,
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
	use: {
		baseURL: 'http://127.0.0.1:4173',
		browserName: 'chromium',
		viewport: { width: 1440, height: 900 },
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure'
	},
	webServer: {
		command: 'pnpm exec vite build && pnpm exec vite preview --host 127.0.0.1 --port 4173',
		url: 'http://127.0.0.1:4173',
		timeout: 120_000,
		reuseExistingServer: !process.env.CI
	}
});

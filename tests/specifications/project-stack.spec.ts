import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('OpenSpec project-stack: toolchain, runes, aliases, and favicon stay configured', async () => {
	const [packageJson, viteConfig, tsconfig, page, layout, favicon] = await Promise.all([
		readFile(new URL('../../package.json', import.meta.url), 'utf8'),
		readFile(new URL('../../vite.config.ts', import.meta.url), 'utf8'),
		readFile(new URL('../../tsconfig.json', import.meta.url), 'utf8'),
		readFile(new URL('../../src/routes/+page.svelte', import.meta.url), 'utf8'),
		readFile(new URL('../../src/routes/+layout.svelte', import.meta.url), 'utf8'),
		readFile(new URL('../../src/lib/assets/favicon.svg', import.meta.url), 'utf8')
	]);
	const manifest = JSON.parse(packageJson) as { devDependencies: Record<string, string>; imports: Record<string, string>; scripts: Record<string, string> };

	expect(manifest.devDependencies).toMatchObject({
		'@sveltejs/adapter-auto': expect.stringMatching(/^8\./),
		'@sveltejs/kit': expect.stringMatching(/^3\./),
		'@sveltejs/vite-plugin-svelte': expect.stringMatching(/^7\./),
		svelte: expect.stringMatching(/^5\.(5[7-9]|[6-9]\d)\./)
	});
	expect(manifest.imports['#lib/*']).toBe('./src/lib/*');
	expect(manifest.scripts).toMatchObject({ check: expect.any(String), lint: expect.any(String), build: expect.any(String) });
	expect(viteConfig).toContain('compilerOptions: { runes: true }');
	expect(tsconfig).toContain('"extends": "$app/tsconfig"');
	expect(page).toContain("import GraphViewer from '#lib/components/GraphViewer.svelte'");
	expect(layout).toContain("import favicon from '#lib/assets/favicon.svg'");
	expect(layout).toContain('<link rel="icon" href={favicon} />');
	expect(favicon).toContain('<svg');
});

test('OpenSpec project-stack: production server serves the application', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByLabel('Graph viewer')).toBeVisible();
	await expect(page.getByLabel('Graph viewer').getByText('ready')).toBeVisible({ timeout: 30_000 });
});

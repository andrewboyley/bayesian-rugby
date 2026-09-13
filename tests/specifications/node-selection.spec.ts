import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

interface SelectionSnapshot {
	primaryNode: string | null;
	secondaryNode: string | null;
	activeNodes: string[];
	primaryEdges: string[];
	selectedEdges: string[];
	focusedNode: string | null;
}

interface SelectionCandidates {
	primary: string;
	neighbor: string;
	nonNeighbor: string;
}

interface SelectionTestController {
	candidates: () => SelectionCandidates;
	clickNode: (node: string) => void;
	clickStage: () => void;
	snapshot: () => SelectionSnapshot;
}

declare global {
	interface Window {
		rugbyGraphSelectionTest?: SelectionTestController;
	}
}

async function openSelectionHarness(page: import('@playwright/test').Page) {
	await page.goto('/?test=selection');
	await expect(page.getByLabel('Graph viewer').getByText('ready')).toBeVisible({ timeout: 30_000 });
}

async function candidates(page: import('@playwright/test').Page) {
	return page.evaluate(() => window.rugbyGraphSelectionTest!.candidates() as SelectionCandidates);
}

async function clickNode(page: import('@playwright/test').Page, node: string) {
	return page.evaluate((nodeKey) => {
		window.rugbyGraphSelectionTest!.clickNode(nodeKey);
		return window.rugbyGraphSelectionTest!.snapshot() as SelectionSnapshot;
	}, node);
}

async function clickStage(page: import('@playwright/test').Page) {
	return page.evaluate(() => {
		window.rugbyGraphSelectionTest!.clickStage();
		return window.rugbyGraphSelectionTest!.snapshot() as SelectionSnapshot;
	});
}

test('OpenSpec node-selection: primary, secondary, replacement, clear, and promotion transitions', async ({ page }) => {
	await openSelectionHarness(page);
	const { primary, neighbor, nonNeighbor } = await candidates(page);

	let snapshot = await clickNode(page, primary);
	expect(snapshot).toMatchObject({ primaryNode: primary, secondaryNode: null, focusedNode: primary });
	expect(snapshot.activeNodes).toEqual(expect.arrayContaining([primary, neighbor]));

	snapshot = await clickNode(page, neighbor);
	expect(snapshot).toMatchObject({ primaryNode: primary, secondaryNode: neighbor });
	expect(snapshot.primaryEdges.length).toBeGreaterThan(0);
	expect(snapshot.selectedEdges.length).toBe(1);

	snapshot = await clickNode(page, neighbor);
	expect(snapshot).toMatchObject({ primaryNode: neighbor, secondaryNode: null, focusedNode: neighbor });

	snapshot = await clickNode(page, primary);
	expect(snapshot).toMatchObject({ primaryNode: neighbor, secondaryNode: primary });

	snapshot = await clickNode(page, neighbor);
	expect(snapshot).toMatchObject({ primaryNode: neighbor, secondaryNode: null });

	snapshot = await clickNode(page, neighbor);
	expect(snapshot).toMatchObject({ primaryNode: null, secondaryNode: null });

	snapshot = await clickNode(page, primary);
	expect(snapshot.primaryNode).toBe(primary);
	snapshot = await clickNode(page, nonNeighbor);
	expect(snapshot).toMatchObject({ primaryNode: nonNeighbor, secondaryNode: null, focusedNode: nonNeighbor });

	snapshot = await clickStage(page);
	expect(snapshot).toMatchObject({ primaryNode: null, secondaryNode: null, activeNodes: [], selectedEdges: [] });
});

test('OpenSpec node-selection: hover styles retain labels and backdrops', async () => {
	const source = await readFile(new URL('../../src/lib/components/GraphViewer.svelte', import.meta.url), 'utf8');

	expect(source).toContain("whenState: 'isHovered'");
	expect(source).toContain("whenState: 'isLabelHovered'");
	expect(source).toContain("labelVisibility: 'visible'");
	expect(source).toContain("backdropVisibility: 'visible'");
	expect(source).toContain("labelVisibility: 'hidden'");
});

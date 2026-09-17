import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

interface SelectionSnapshot {
  primaryNode: string | null;
  secondaryNode: string | null;
  activeNodes: string[];
  primaryEdges: string[];
  selectedEdges: string[];
  focusedNode: string | null;
  camera: { x: number; y: number; ratio: number };
}

interface SelectionCandidates {
  primary: string;
  neighbor: string;
  nonNeighbor: string;
}

interface SelectionTestController {
  candidates: () => SelectionCandidates;
  clickNode: (node: string) => void;
  doubleClickNode: (node: string) => void;
  clickStage: () => void;
  snapshot: () => SelectionSnapshot;
  setCamera: (state: { x: number; y: number; ratio: number }) => void;
  nodePosition: (node: string) => { x: number; y: number };
  displayedLabels: () => string[];
}

declare global {
  interface Window {
    rugbyGraphSelectionTest?: SelectionTestController;
  }
}

async function openSelectionHarness(page: import("@playwright/test").Page) {
  await page.goto("/?test=selection");
  await expect(page.getByLabel("Graph viewer").getByText("ready")).toBeVisible({ timeout: 30_000 });
}

async function candidates(page: import("@playwright/test").Page) {
  return page.evaluate(() => window.rugbyGraphSelectionTest!.candidates() as SelectionCandidates);
}

async function clickNode(page: import("@playwright/test").Page, node: string) {
  return page.evaluate((nodeKey) => {
    window.rugbyGraphSelectionTest!.clickNode(nodeKey);
    return window.rugbyGraphSelectionTest!.snapshot() as SelectionSnapshot;
  }, node);
}

async function clickStage(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    window.rugbyGraphSelectionTest!.clickStage();
    return window.rugbyGraphSelectionTest!.snapshot() as SelectionSnapshot;
  });
}

async function selectionSnapshot(page: import("@playwright/test").Page) {
  return page.evaluate(() => window.rugbyGraphSelectionTest!.snapshot() as SelectionSnapshot);
}

test("OpenSpec node-selection: primary, secondary, replacement, clear, and promotion transitions", async ({
  page,
}) => {
  await openSelectionHarness(page);
  const { primary, neighbor, nonNeighbor } = await candidates(page);

  let snapshot = await clickNode(page, primary);
  expect(snapshot).toMatchObject({
    primaryNode: primary,
    secondaryNode: null,
    focusedNode: primary,
  });
  expect(snapshot.activeNodes).toEqual(expect.arrayContaining([primary, neighbor]));

  snapshot = await clickNode(page, neighbor);
  expect(snapshot).toMatchObject({ primaryNode: primary, secondaryNode: neighbor });
  expect(snapshot.primaryEdges.length).toBeGreaterThan(0);
  expect(snapshot.selectedEdges.length).toBe(1);

  snapshot = await clickNode(page, neighbor);
  expect(snapshot).toMatchObject({
    primaryNode: neighbor,
    secondaryNode: null,
    focusedNode: neighbor,
  });

  snapshot = await clickNode(page, primary);
  expect(snapshot).toMatchObject({ primaryNode: neighbor, secondaryNode: primary });

  snapshot = await clickNode(page, neighbor);
  expect(snapshot).toMatchObject({ primaryNode: neighbor, secondaryNode: null });

  snapshot = await clickNode(page, neighbor);
  expect(snapshot).toMatchObject({ primaryNode: null, secondaryNode: null });

  snapshot = await clickNode(page, primary);
  expect(snapshot.primaryNode).toBe(primary);
  snapshot = await clickNode(page, nonNeighbor);
  expect(snapshot).toMatchObject({
    primaryNode: nonNeighbor,
    secondaryNode: null,
    focusedNode: nonNeighbor,
  });

  snapshot = await clickStage(page);
  expect(snapshot).toMatchObject({
    primaryNode: null,
    secondaryNode: null,
    activeNodes: [],
    selectedEdges: [],
  });
});

test("OpenSpec node-selection: clicking a node fits its neighborhood", async ({ page }) => {
  await openSelectionHarness(page);
  await page.waitForTimeout(500);
  const before = await selectionSnapshot(page);
  await clickNode(page, "covariant derivative");
  await page.waitForTimeout(650);
  const snapshot = await selectionSnapshot(page);

  expect(snapshot.focusedNode).toBe("covariant derivative");
  expect(snapshot.camera).not.toEqual(before.camera);
  expect(snapshot.camera.ratio).toBeGreaterThan(0);
});

test("OpenSpec node-selection: deep zooming onto an active node displays its label", async ({
  page,
}) => {
  await openSelectionHarness(page);

  // The user repro: select "data mining", then zoom onto the active node
  // "intention mining". Its label must appear at deep zoom (regression for
  // labels hidden in negative label-grid cells).
  await clickNode(page, "data mining");
  // The click fits the neighborhood; let that animation settle before zooming.
  await page.waitForTimeout(750);
  const position = await page.evaluate(() => {
    const { x, y } = window.rugbyGraphSelectionTest!.nodePosition("intention mining");
    return { x, y };
  });
  await page.evaluate((pos) => {
    window.rugbyGraphSelectionTest!.setCamera({ x: pos.x, y: pos.y, ratio: 0.05 });
  }, position);
  await page.waitForTimeout(700);

  const labels = await page.evaluate(
    () => window.rugbyGraphSelectionTest!.displayedLabels() as string[],
  );
  expect(labels).toContain("intention mining");
});

test("OpenSpec node-selection: hover styles retain labels and backdrops", async () => {
  const source = await readFile(
    new URL("../../src/lib/components/GraphViewer.svelte", import.meta.url),
    "utf8",
  );

  expect(source).toContain("whenState: 'isHovered'");
  expect(source).toContain("whenState: 'isLabelHovered'");
  expect(source).toContain("labelVisibility: 'visible'");
  expect(source).toContain("backdropVisibility: 'visible'");
  expect(source).toContain("labelVisibility: 'hidden'");
});

test("OpenSpec node-selection: label visibility on click follows Sigma's default size threshold", async () => {
  const source = await readFile(
    new URL("../../src/lib/components/GraphViewer.svelte", import.meta.url),
    "utf8",
  );

  const activeLabelRule =
    /graphState\.hasPrimarySelection && state\.isActive[\s\S]*?then: \{ label: \{ attribute: 'label' \}, labelVisibility: '(auto|visible)' \}/;
  const match = source.match(activeLabelRule);
  expect(match).not.toBeNull();
  expect(match![1]).toBe("auto");
  expect(source).not.toContain("labelRenderedSizeThreshold: 0");
});

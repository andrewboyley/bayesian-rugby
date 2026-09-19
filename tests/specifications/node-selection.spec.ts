import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

interface SelectionSnapshot {
  primaryNode: string | null;
  secondaryNode: string | null;
  activeNodes: string[];
  primaryEdges: string[];
  selectedEdges: string[];
  focusedNode: string | null;
  rings: { visible: boolean; color: string | null };
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
  stopLayout: () => void;
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

/** Resolve a node's cluster color directly from the dataset. */
async function nodeColorFromDataset(page: import("@playwright/test").Page, nodeKey: string) {
  return page.evaluate(async (key) => {
    const dataset = (await (await fetch("/wikipedia.json")).json()) as {
      nodes: { key: string; cluster: string }[];
      clusters: { key: string; color: string }[];
    };
    const node = dataset.nodes.find((candidate) => candidate.key === key);
    if (!node) throw new Error(`node not found: ${key}`);
    const cluster = dataset.clusters.find((candidate) => candidate.key === node.cluster);
    return cluster?.color ?? null;
  }, nodeKey);
}

/** Center of the rings overlay anchor in client coordinates. */
async function ringCenter(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const anchor = document.querySelector(".ring-anchor")?.getBoundingClientRect();
    if (!anchor) return null;
    return { x: anchor.x + anchor.width / 2, y: anchor.y + anchor.height / 2 };
  });
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

test("OpenSpec node-selection: rings appear, persist, match the node color, and clear", async ({
  page,
}) => {
  await openSelectionHarness(page);
  const { primary, neighbor } = await candidates(page);

  const overlay = page.locator("[data-rings]");
  await expect(overlay).toHaveCount(0);
  let snapshot = await selectionSnapshot(page);
  expect(snapshot.rings).toEqual({ visible: false, color: null });

  // Selecting a primary node shows two spinning rings in the node's color.
  snapshot = await clickNode(page, primary);
  expect(snapshot.rings.visible).toBe(true);
  const expectedColor = await nodeColorFromDataset(page, primary);
  expect(snapshot.rings.color).toBe(expectedColor);
  await expect(overlay).toHaveAttribute("data-rings-state", "visible");
  await expect(overlay).toHaveAttribute("data-ring-color", expectedColor ?? "");
  await expect(page.locator("[data-rings] svg.ring-spin")).toHaveCount(2);
  const strokeColors = await page
    .locator("[data-rings] svg.ring-spin circle")
    .evaluateAll((circles) => circles.map((circle) => circle.getAttribute("stroke")));
  expect(strokeColors).toEqual([expectedColor, expectedColor]);

  // Selecting a secondary node keeps the rings around the primary node.
  snapshot = await clickNode(page, neighbor);
  expect(snapshot).toMatchObject({ primaryNode: primary, secondaryNode: neighbor });
  expect(snapshot.rings.visible).toBe(true);
  expect(snapshot.rings.color).toBe(expectedColor);

  // Clearing the pair half-way (click primary) keeps the rings.
  snapshot = await clickNode(page, primary);
  expect(snapshot).toMatchObject({ primaryNode: primary, secondaryNode: null });
  expect(snapshot.rings.visible).toBe(true);

  // Clicking the active primary without a secondary clears selection and rings.
  snapshot = await clickNode(page, primary);
  expect(snapshot).toMatchObject({ primaryNode: null, secondaryNode: null });
  expect(snapshot.rings.visible).toBe(false);
  await expect(overlay).toHaveCount(0);

  // Empty-space click also clears the rings.
  snapshot = await clickNode(page, primary);
  expect(snapshot.rings.visible).toBe(true);
  snapshot = await clickStage(page);
  expect(snapshot.rings).toEqual({ visible: false, color: null });
  await expect(overlay).toHaveCount(0);
});

test("OpenSpec node-selection: rings track the camera and do not block interaction", async ({
  page,
}) => {
  await openSelectionHarness(page);
  const { primary } = await candidates(page);

  await clickNode(page, primary);
  // Let the neighborhood-focus camera animation settle before measuring.
  await page.waitForTimeout(900);
  const overlay = page.locator("[data-rings]");
  await expect(overlay).toHaveAttribute("data-rings-state", "visible");

  const before = await ringCenter(page);
  expect(before).not.toBeNull();

  // Freeze the layout so node movement cannot pollute the camera-tracking
  // measurement (FA2 otherwise drifts node positions a few px per frame).
  await page.evaluate(() => window.rugbyGraphSelectionTest!.stopLayout());
  await page.waitForTimeout(300);

  // The rings re-project with a camera move, staying centered on the node:
  // a pure X camera shift must move the rings in X while Y stays fixed.
  const camera = (await selectionSnapshot(page)).camera;
  await page.evaluate(
    (state) =>
      window.rugbyGraphSelectionTest!.setCamera({ x: state.x + 2, y: state.y, ratio: state.ratio }),
    camera,
  );
  await page.waitForTimeout(400);
  const afterMove = await selectionSnapshot(page);
  expect(afterMove.rings.visible).toBe(true);
  const moved = await ringCenter(page);
  expect(moved).not.toBeNull();
  expect(Math.abs(moved!.x - before!.x)).toBeGreaterThan(50);
  expect(Math.abs(moved!.y - before!.y)).toBeLessThan(2);

  // The overlay must not intercept pointer input: a trusted mouse click at
  // the ring center (the node position) reaches the node and clears the
  // selection, exactly as it would without the rings.
  await page.evaluate((state) => {
    window.rugbyGraphSelectionTest!.setCamera(state);
  }, camera);
  await page.waitForTimeout(900);
  expect((await selectionSnapshot(page)).primaryNode).toBe("cytoscape");
  expect((await selectionSnapshot(page)).rings.visible).toBe(true);
  const pointerEvents = await page
    .locator("[data-rings]")
    .evaluate((element) => getComputedStyle(element).pointerEvents);
  expect(pointerEvents).toBe("none");
  const clickPoint = await ringCenter(page);
  expect(clickPoint).not.toBeNull();
  await page.mouse.click(clickPoint!.x, clickPoint!.y);
  await page.waitForTimeout(300);
  expect((await selectionSnapshot(page)).primaryNode).toBeNull();
  expect((await selectionSnapshot(page)).rings.visible).toBe(false);
});

test("OpenSpec node-selection: rings stay inside the graph area when zoomed deep", async ({
  page,
}) => {
  await openSelectionHarness(page);
  const { primary } = await candidates(page);

  await clickNode(page, primary);
  await page.waitForTimeout(900);
  await page.evaluate(() => window.rugbyGraphSelectionTest!.stopLayout());
  await page.waitForTimeout(300);

  // Deep zoom onto the node. The ring pixel radii balloon far past the
  // canvas; the overlay must clip them at the graph area's edge.
  const position = await page.evaluate(
    (nodeKey) => window.rugbyGraphSelectionTest!.nodePosition(nodeKey),
    primary,
  );
  await page.evaluate((pos) => {
    window.rugbyGraphSelectionTest!.setCamera({ x: pos.x, y: pos.y, ratio: 0.02 });
  }, position);
  await page.waitForTimeout(900);

  const geometry = await page.evaluate(() => {
    const overlay = document.querySelector("[data-rings]")!;
    const svg = overlay.querySelector("svg.ring-spin")!;
    const overlayRect = overlay.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    // A probe point above the canvas but inside the ring's layout box.
    const probeX = overlayRect.x + overlayRect.width / 2;
    const probeY = overlayRect.y - 40;
    const probeInsideSvgLayout =
      probeX >= svgRect.x &&
      probeX <= svgRect.x + svgRect.width &&
      probeY >= svgRect.y &&
      probeY <= svgRect.y + svgRect.height;
    const hit = document.elementFromPoint(probeX, probeY);
    return {
      overflow: getComputedStyle(overlay).overflow,
      svgExtendsAboveCanvas: svgRect.y < overlayRect.y,
      probeInsideSvgLayout,
      hitIsRing: Boolean(hit?.closest?.("[data-rings]")),
    };
  });

  // The ballooned ring's layout box really does extend above the canvas,
  // so this is a meaningful clip test rather than a vacuous pass.
  expect(geometry.svgExtendsAboveCanvas).toBe(true);
  expect(geometry.probeInsideSvgLayout).toBe(true);
  // But the overlay clips it: the probe meets the page, never the ring.
  expect(geometry.overflow).toBe("hidden");
  expect(geometry.hitIsRing).toBe(false);
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

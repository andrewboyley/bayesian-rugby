import { expect, test } from "@playwright/test";

interface ViewerSnapshot {
  autoFit: boolean;
  fitCount: number;
  camera: { x: number; y: number; ratio: number };
}

interface ProjectionSnapshot extends ViewerSnapshot {
  visibleNodes: number;
}

interface ProjectionTestController {
  showFirstNode: () => void;
  showEmptyGraph: () => void;
  addNode: () => void;
  nodeViewports: () => { px: number; py: number }[];
  firstNodeViewport: () => { x: number; y: number };
  setCamera: (state: { x: number; y: number; ratio: number }) => void;
  setAutoFit: (value: boolean) => void;
  resetFitCount: () => void;
  stopLayout: () => void;
  snapshot: () => ProjectionSnapshot;
}

interface SelectionTestController {
  setAutoFit: (value: boolean) => void;
  snapshot: () => ViewerSnapshot;
}

interface ViewerGlobals {
  rugbyGraphProjectionTest?: ProjectionTestController;
  rugbyGraphSelectionTest?: SelectionTestController;
}

async function openProjectionHarness(page: import("@playwright/test").Page, empty = false) {
  await page.goto(empty ? "/?test=projection&empty" : "/?test=projection");
  await expect(page.getByLabel("Graph viewer").getByText("ready")).toBeVisible({
    timeout: 30_000,
  });
}

async function openSelectionHarness(page: import("@playwright/test").Page) {
  await page.goto("/?test=selection");
  await expect(page.getByLabel("Graph viewer").getByText("ready")).toBeVisible({
    timeout: 30_000,
  });
}

async function projectionSnapshot(
  page: import("@playwright/test").Page,
): Promise<ProjectionSnapshot> {
  return page.evaluate(
    () =>
      (
        window as unknown as ViewerGlobals
      ).rugbyGraphProjectionTest!.snapshot() as ProjectionSnapshot,
  );
}

async function selectionSnapshot(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      (window as unknown as ViewerGlobals).rugbyGraphSelectionTest!.snapshot() as ViewerSnapshot,
  );
}

test("OpenSpec auto-fit-view: the checkbox is checked by default and the controller tracks it", async ({
  page,
}) => {
  await openSelectionHarness(page);

  await expect(page.getByLabel("auto fit")).toBeChecked();
  await expect.poll(async () => (await selectionSnapshot(page)).autoFit).toBe(true);

  await page.getByLabel("auto fit").uncheck();
  await expect.poll(async () => (await selectionSnapshot(page)).autoFit).toBe(false);

  await page.getByLabel("auto fit").check();
  await expect.poll(async () => (await selectionSnapshot(page)).autoFit).toBe(true);
});

test("OpenSpec auto-fit-view: the camera fits continuously while auto-fit is enabled", async ({
  page,
}) => {
  await openProjectionHarness(page, true);
  await page.evaluate(() => {
    const viewer = (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!;
    viewer.showEmptyGraph();
    viewer.setAutoFit(true);
    viewer.stopLayout();
    viewer.resetFitCount();
  });

  await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.addNode(),
  );
  await expect
    .poll(async () => (await projectionSnapshot(page)).fitCount)
    .toBeGreaterThanOrEqual(1);
  const singleFit = (await projectionSnapshot(page)).camera;

  await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.addNode(),
  );
  await expect
    .poll(async () => (await projectionSnapshot(page)).fitCount)
    .toBeGreaterThanOrEqual(2);
  const pairFit = (await projectionSnapshot(page)).camera;

  // Wider bounds force a new fit: the camera ratio reacts to the second node.
  expect(pairFit.ratio).not.toBe(singleFit.ratio);
});

test("OpenSpec auto-fit-view: an empty graph keeps the camera and does no work", async ({
  page,
}) => {
  await openProjectionHarness(page, true);
  await page.evaluate(() => {
    const viewer = (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!;
    viewer.showEmptyGraph();
    viewer.setAutoFit(true);
  });
  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(true);

  await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.resetFitCount(),
  );
  const before = await projectionSnapshot(page);
  await page.waitForTimeout(700);
  const after = await projectionSnapshot(page);

  expect(after.camera).toEqual(before.camera);
  expect(after.fitCount).toBe(0);
});

test("OpenSpec auto-fit-view: panning disables auto-fit and keeps the camera", async ({ page }) => {
  await openProjectionHarness(page);
  await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.stopLayout(),
  );
  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(true);

  const viewerBox = await page.locator("#graph-viewer-panel").boundingBox();
  expect(viewerBox).not.toBeNull();
  await page.mouse.move(viewerBox!.x + viewerBox!.width / 2, viewerBox!.y + viewerBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    viewerBox!.x + viewerBox!.width / 2 + 120,
    viewerBox!.y + viewerBox!.height / 2 + 60,
    { steps: 8 },
  );
  await page.mouse.up();

  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(false);
  const settled = await projectionSnapshot(page);
  await page.waitForTimeout(400);
  expect((await projectionSnapshot(page)).camera).toEqual(settled.camera);
});

test("OpenSpec auto-fit-view: wheel zoom disables auto-fit and keeps the zoom", async ({
  page,
}) => {
  await openProjectionHarness(page);
  await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.stopLayout(),
  );
  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(true);
  const before = await projectionSnapshot(page);

  const viewerBox = await page.locator("#graph-viewer-panel").boundingBox();
  expect(viewerBox).not.toBeNull();
  await page.mouse.move(viewerBox!.x + viewerBox!.width / 2, viewerBox!.y + viewerBox!.height / 2);
  await page.mouse.wheel(0, -120);

  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(false);
  await expect
    .poll(async () => (await projectionSnapshot(page)).camera.ratio)
    .toBeLessThan(before.camera.ratio);
  const settled = await projectionSnapshot(page);
  await page.waitForTimeout(400);
  expect((await projectionSnapshot(page)).camera).toEqual(settled.camera);
});

test("OpenSpec auto-fit-view: clicking a node disables auto-fit and keeps the camera", async ({
  page,
}) => {
  await openProjectionHarness(page);
  await page.evaluate(() => {
    const viewer = (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!;
    viewer.showFirstNode();
    viewer.stopLayout();
  });
  await expect.poll(async () => (await projectionSnapshot(page)).visibleNodes).toBe(1);

  const viewerBox = await page.locator("#graph-viewer-panel").boundingBox();
  expect(viewerBox).not.toBeNull();
  const viewport = await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.firstNodeViewport(),
  );
  await page.mouse.click(viewerBox!.x + viewport.x, viewerBox!.y + viewport.y);

  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(false);
  const settled = await projectionSnapshot(page);
  await page.waitForTimeout(400);
  expect((await projectionSnapshot(page)).camera).toEqual(settled.camera);
});

test("OpenSpec auto-fit-view: double-clicking empty canvas enables auto-fit and refits", async ({
  page,
}) => {
  await openProjectionHarness(page);
  await page.evaluate(() => {
    const viewer = (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!;
    viewer.showFirstNode();
    viewer.stopLayout();
  });
  await expect.poll(async () => (await projectionSnapshot(page)).visibleNodes).toBe(1);

  const clear = await page.evaluate(() => {
    const grid = document.querySelector("#graph-grid")!.getBoundingClientRect();
    const nodes = (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.nodeViewports();
    for (let localY = 40; localY < grid.height - 40; localY += 60) {
      for (let localX = 40; localX < grid.width - 40; localX += 60) {
        const far = nodes.every((node) => Math.hypot(node.px - localX, node.py - localY) > 40);
        if (far) return { x: grid.x + localX, y: grid.y + localY };
      }
    }
    return null;
  });
  expect(clear).not.toBeNull();

  // Pan away so the re-enabling double-click has a visible refit to perform.
  await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.setCamera({
      x: 0.42,
      y: 0.4,
      ratio: 0.33,
    }),
  );
  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(false);

  await page.mouse.dblclick(clear!.x, clear!.y);

  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(true);
  await expect
    .poll(async () => {
      const camera = (await projectionSnapshot(page)).camera;
      return Math.abs(camera.x - 0.5) + Math.abs(camera.y - 0.5);
    })
    .toBeLessThan(0.01);
});

test("OpenSpec auto-fit-view: a stable graph does no bounds work or camera set", async ({
  page,
}) => {
  await openProjectionHarness(page);
  await page.evaluate(() => {
    const viewer = (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!;
    viewer.showFirstNode();
    viewer.stopLayout();
  });
  await expect.poll(async () => (await projectionSnapshot(page)).visibleNodes).toBe(1);
  await expect.poll(async () => (await projectionSnapshot(page)).autoFit).toBe(true);
  // Let the settle fit run and the loop suspend before counting.
  await page.waitForTimeout(300);
  await page.evaluate(() =>
    (window as unknown as ViewerGlobals).rugbyGraphProjectionTest!.resetFitCount(),
  );

  const before = await projectionSnapshot(page);
  await page.waitForTimeout(700);
  const after = await projectionSnapshot(page);

  expect(after.fitCount).toBe(0);
  expect(after.camera).toEqual(before.camera);
});

test("OpenSpec auto-fit-view: fits run at most once per animation frame while the graph changes", async ({
  page,
}) => {
  await openSelectionHarness(page);
  await expect.poll(async () => (await selectionSnapshot(page)).autoFit).toBe(true);

  const sample = await page.evaluate(async () => {
    const controller = (window as unknown as ViewerGlobals).rugbyGraphSelectionTest!;
    const start = performance.now();
    const startCount = controller.snapshot().fitCount;
    await new Promise((resolve) => setTimeout(resolve, 800));
    const endCount = controller.snapshot().fitCount;
    return { fits: endCount - startCount, elapsed: performance.now() - start };
  });

  expect(sample.fits).toBeGreaterThan(0);
  expect(sample.fits).toBeLessThanOrEqual(Math.ceil(sample.elapsed / 16.7) + 3);
});

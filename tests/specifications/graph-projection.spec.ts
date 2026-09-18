import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

interface ProjectionSnapshot {
  visibleNodes: number;
  visibleEdges: number;
  layoutRunning: boolean;
  layoutActiveNodes: number;
  autoFit: boolean;
  fitCount: number;
  camera: { x: number; y: number; ratio: number };
}

interface ProjectionTestController {
  reveal: () => void;
  showFirstNode: () => void;
  showEmptyGraph: () => void;
  firstNodeViewport: () => { x: number; y: number };
  firstNodeSize: () => number;
  firstNodePixelRadius: () => number;
  firstTwoNodeClearance: () => number;
  nodeViewports: () => { rawX: number; rawY: number; size: number; px: number; py: number }[];
  stopLayout: () => void;
  addNode: () => void;
  setCamera: (state: { x: number; y: number; ratio: number }) => void;
  setAutoFit: (value: boolean) => void;
  resetFitCount: () => void;
  snapshot: () => ProjectionSnapshot;
}

declare global {
  interface Window {
    rugbyGraphProjectionTest?: ProjectionTestController;
  }
}

async function openProjectionHarness(page: import("@playwright/test").Page, empty = false) {
  await page.goto(empty ? "/?test=projection&empty" : "/?test=projection");
  await expect(page.getByLabel("Graph viewer").getByText("ready")).toBeVisible({ timeout: 30_000 });
}

async function snapshot(page: import("@playwright/test").Page): Promise<ProjectionSnapshot> {
  return page.evaluate(() => window.rugbyGraphProjectionTest!.snapshot() as ProjectionSnapshot);
}

async function gridSnapshot(page: import("@playwright/test").Page) {
  return page.locator("#graph-grid").evaluate((grid) => ({
    step: Number(grid.getAttribute("data-grid-step")),
    yStep: Number(grid.getAttribute("data-grid-y-step")),
    cellWidth: Number(grid.getAttribute("data-grid-cell-width")),
    cellHeight: Number(grid.getAttribute("data-grid-cell-height")),
    originX: Number(grid.getAttribute("data-grid-origin-x")),
    originY: Number(grid.getAttribute("data-grid-origin-y")),
    xLabels: Number(grid.getAttribute("data-grid-x-label-count")),
    yLabels: Number(grid.getAttribute("data-grid-y-label-count")),
    width: grid.getBoundingClientRect().width,
    height: grid.getBoundingClientRect().height,
  }));
}

test("OpenSpec graph-projection: reveal operates on deltas while native FA2 remains active", async ({
  page,
}) => {
  await openProjectionHarness(page);

  await expect
    .poll(async () => (await snapshot(page)).layoutActiveNodes, { timeout: 30_000 })
    .toBe(2085);
  const before = await snapshot(page);

  expect(before.visibleNodes).toBe(2085);
  expect(before.visibleEdges).toBe(4906);
  expect(before.layoutActiveNodes).toBe(2085);
  expect(before.layoutRunning).toBe(true);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.reveal();
  });

  let sawPartialState = false;
  await expect
    .poll(
      async () => {
        const visibleNodes = (await snapshot(page)).visibleNodes;
        if (visibleNodes > 0 && visibleNodes < 2085) sawPartialState = true;
        return visibleNodes;
      },
      { timeout: 30_000 },
    )
    .toBe(2085);
  expect(sawPartialState).toBe(true);

  const after = await snapshot(page);
  expect(after.visibleEdges).toBe(4906);
  expect(after.layoutActiveNodes).toBe(2085);
  expect(after.layoutRunning).toBe(true);
});

test("OpenSpec graph-projection: reveal tracks rendered state for the full dataset", async ({
  page,
}) => {
  await openProjectionHarness(page);

  await expect
    .poll(async () => (await snapshot(page)).layoutActiveNodes, { timeout: 30_000 })
    .toBe(2085);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.reveal();
  });

  await expect
    .poll(async () => (await snapshot(page)).visibleNodes, { timeout: 30_000 })
    .toBe(2085);
  await expect(page.getByText("nodes 2085 · edges 4906")).toBeVisible();

  const after = await snapshot(page);
  expect(after.layoutActiveNodes).toBe(2085);
  expect(after.layoutRunning).toBe(true);
});

test("OpenSpec graph-projection: adding the first node leaves the camera unchanged", async ({
  page,
}) => {
  await openProjectionHarness(page);
  // Auto-fit is checked by default and would re-frame the camera for the
  // first node; pin manual camera behavior for this test's premise.
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.setAutoFit(false);
  });
  const before = await snapshot(page);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.showFirstNode();
  });

  await expect.poll(async () => (await snapshot(page)).visibleNodes).toBe(1);
  await page.waitForTimeout(250);
  expect((await snapshot(page)).camera).toEqual(before.camera);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.setCamera({ x: 0.6, y: 0.55, ratio: 0.25 });
  });
  await expect
    .poll(async () => (await snapshot(page)).camera)
    .toEqual({
      x: 0.6,
      y: 0.55,
      ratio: 0.25,
    });
});

test("OpenSpec graph-projection: base node radius is one graph unit", async ({ page }) => {
  await openProjectionHarness(page, true);
  const initialCamera = (await snapshot(page)).camera;
  expect(initialCamera.x).toBe(0.5);
  expect(initialCamera.y).toBe(0.5);
  expect(initialCamera.ratio).toBeGreaterThan(0);

  const unitSpan = async () => {
    const grid = await gridSnapshot(page);
    return grid.cellWidth / grid.step;
  };

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.showFirstNode();
  });
  await expect.poll(async () => (await snapshot(page)).visibleNodes, { timeout: 15_000 }).toBe(1);

  await expect
    .poll(async () => page.evaluate(() => window.rugbyGraphProjectionTest!.firstNodeSize()))
    .toBe(1);

  await expect
    .poll(async () => {
      const radiusPx = await page.evaluate(() =>
        window.rugbyGraphProjectionTest!.firstNodePixelRadius(),
      );
      return Math.abs(radiusPx - (await unitSpan()));
    })
    .toBeLessThan(1);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.setCamera({ x: 0.6, y: 0.55, ratio: 8 });
  });
  await expect
    .poll(async () => page.evaluate(() => window.rugbyGraphProjectionTest!.firstNodeSize()))
    .toBe(1);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.addNode();
  });
  await expect.poll(async () => (await snapshot(page)).visibleNodes).toBe(2);
  await expect
    .poll(
      async () => page.evaluate(() => window.rugbyGraphProjectionTest!.firstTwoNodeClearance()),
      {
        timeout: 15_000,
      },
    )
    .toBeGreaterThanOrEqual(0);
  await expect
    .poll(async () => {
      const radiusPx = await page.evaluate(() =>
        window.rugbyGraphProjectionTest!.firstNodePixelRadius(),
      );
      return Math.abs(radiusPx - (await unitSpan()));
    })
    .toBeLessThan(1);
  const source = await readFile(
    new URL("../../src/lib/components/GraphViewer.svelte", import.meta.url),
    "utf8",
  );
  expect(source).toContain("itemSizesReference: 'positions'");
  expect(source).toContain("zoomToSizeRatioFunction: (ratio) => ratio");
});

test("OpenSpec graph-projection: double-clicking the first node fits it to the viewer", async ({
  page,
}) => {
  await openProjectionHarness(page, true);
  const initialCamera = (await snapshot(page)).camera;
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.showFirstNode();
  });
  await expect.poll(async () => (await snapshot(page)).visibleNodes).toBe(1);

  const viewer = page.locator("#graph-viewer-panel");
  const viewerBox = await viewer.boundingBox();
  expect(viewerBox).not.toBeNull();
  const node = await page.evaluate(() => window.rugbyGraphProjectionTest!.firstNodeViewport());
  await page.mouse.dblclick(viewerBox!.x + node.x, viewerBox!.y + node.y);

  await expect
    .poll(async () => {
      const camera = (await snapshot(page)).camera;
      return (
        Math.abs(camera.x - 0.5) +
        Math.abs(camera.y - 0.5) +
        Math.abs(camera.ratio - initialCamera.ratio)
      );
    })
    .toBeLessThan(0.01);
});

test("OpenSpec graph-projection: double-clicking the canvas fits visible nodes", async ({
  page,
}) => {
  await openProjectionHarness(page, true);
  const initialCamera = (await snapshot(page)).camera;
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.showFirstNode();
  });
  await expect.poll(async () => (await snapshot(page)).visibleNodes).toBe(1);

  const viewerBox = await page.locator("#graph-viewer-panel").boundingBox();
  expect(viewerBox).not.toBeNull();
  await page.mouse.dblclick(
    viewerBox!.x + viewerBox!.width / 2 + 100,
    viewerBox!.y + viewerBox!.height / 2,
  );

  await expect
    .poll(async () => {
      const camera = (await snapshot(page)).camera;
      return (
        Math.abs(camera.x - 0.5) +
        Math.abs(camera.y - 0.5) +
        Math.abs(camera.ratio - initialCamera.ratio)
      );
    })
    .toBeLessThan(0.01);
});

test("OpenSpec graph-projection: double-clicking the canvas fits every visible node", async ({
  page,
}) => {
  await openProjectionHarness(page, true);
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.showFirstNode();
  });
  await expect.poll(async () => (await snapshot(page)).visibleNodes).toBe(1);
  await page.evaluate(() => {
    const add = window.rugbyGraphProjectionTest!.addNode;
    for (let i = 0; i < 5; i++) add();
  });
  await expect.poll(async () => (await snapshot(page)).visibleNodes).toBe(6);
  await page.waitForTimeout(2500);

  const spread = await page.evaluate(() => {
    const views = window.rugbyGraphProjectionTest!.nodeViewports();
    const keys = new Set(views.map((node) => `${node.rawX.toFixed(6)}|${node.rawY.toFixed(6)}`));
    return { total: views.length, distinct: keys.size };
  });
  expect(spread.total).toBe(6);
  expect(spread.distinct).toBe(6);

  const before = await snapshot(page);
  const zoomedRatio = before.camera.ratio * 0.01;
  // Auto-fit is checked by default, so the camera already frames every node.
  // Zoom well away from that fit first so the double-click's immediate refit
  // is observable; the camera change also disables auto-fit (manual behavior).
  await page.evaluate((ratio) => {
    window.rugbyGraphProjectionTest!.setCamera({ x: 0.5, y: 0.5, ratio });
  }, zoomedRatio);
  await expect.poll(async () => (await snapshot(page)).autoFit).toBe(false);

  const gridBox = await page.locator("#graph-grid").boundingBox();
  expect(gridBox).not.toBeNull();
  const clear = await page.evaluate(() => {
    const grid = document.querySelector("#graph-grid")!.getBoundingClientRect();
    const nodes = window.rugbyGraphProjectionTest!.nodeViewports();
    for (let localY = 40; localY < grid.height - 40; localY += 60) {
      for (let localX = 40; localX < grid.width - 40; localX += 60) {
        const far = nodes.every((node) => Math.hypot(node.px - localX, node.py - localY) > 40);
        if (far) return { x: grid.x + localX, y: grid.y + localY };
      }
    }
    return null;
  });
  expect(clear).not.toBeNull();
  await page.mouse.dblclick(clear!.x, clear!.y);

  await expect
    .poll(async () => (await snapshot(page)).camera.ratio)
    .toBeGreaterThan(zoomedRatio * 1.5);
  await expect.poll(async () => (await snapshot(page)).autoFit).toBe(true);
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.stopLayout();
  });
  await page.waitForTimeout(200);

  const viewports = await page.evaluate(() => window.rugbyGraphProjectionTest!.nodeViewports());
  expect(viewports.length).toBe(6);
  for (const node of viewports) {
    expect(node.px).toBeGreaterThanOrEqual(-2);
    expect(node.px).toBeLessThanOrEqual(gridBox!.width + 2);
    expect(node.py).toBeGreaterThanOrEqual(-2);
    expect(node.py).toBeLessThanOrEqual(gridBox!.height + 2);
  }
});

test("OpenSpec graph-projection: FA2 stays running and separates nodes while adds continue", async ({
  page,
}) => {
  await openProjectionHarness(page, true);
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.showFirstNode();
  });
  await expect.poll(async () => (await snapshot(page)).visibleNodes).toBe(1);
  for (let batch = 0; batch < 3; batch++) {
    await page.evaluate(() => {
      const add = window.rugbyGraphProjectionTest!.addNode;
      for (let i = 0; i < 20; i++) add();
    });
    await page.waitForTimeout(400);
    const state = await page.evaluate(() => {
      const views = window.rugbyGraphProjectionTest!.nodeViewports();
      const distinct = new Set(
        views.map((node) => `${node.rawX.toFixed(4)}|${node.rawY.toFixed(4)}`),
      ).size;
      const far = views.filter((node) => Math.hypot(node.rawX, node.rawY) > 4).length;
      return {
        total: views.length,
        distinct,
        far,
        layoutRunning: window.rugbyGraphProjectionTest!.snapshot().layoutRunning,
      };
    });
    expect(state.layoutRunning).toBe(true);
    expect(state.distinct).toBe(state.total);
    expect(state.far).toBeGreaterThanOrEqual(state.total / 2);
  }
});

test("OpenSpec graph-projection: camera grid follows pan and recomputes on zoom", async ({
  page,
}) => {
  await openProjectionHarness(page);
  // Auto-fit is checked by default and reframes the camera, shifting the grid
  // origin away from the viewport center. Pin the classic default camera so
  // this test's center-based grid expectations hold.
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.setAutoFit(false);
    window.rugbyGraphProjectionTest!.setCamera({ x: 0.5, y: 0.5, ratio: 1 });
  });
  await expect
    .poll(async () => {
      const grid = await gridSnapshot(page);
      return Math.abs(grid.originX - grid.width / 2) + Math.abs(grid.originY - grid.height / 2);
    })
    .toBeLessThan(1);

  const initialGrid = await gridSnapshot(page);
  const initialCamera = (await snapshot(page)).camera;
  expect(initialGrid.step).toBeGreaterThan(0);
  expect(Math.abs(initialGrid.cellWidth - initialGrid.cellHeight)).toBeLessThan(0.01);
  expect(Math.abs(initialGrid.originX - initialGrid.width / 2)).toBeLessThan(1);
  expect(Math.abs(initialGrid.originY - initialGrid.height / 2)).toBeLessThan(1);
  expect(initialGrid.xLabels).toBeGreaterThan(0);
  expect(initialGrid.yLabels).toBeGreaterThan(0);

  await page.evaluate((camera) => {
    window.rugbyGraphProjectionTest!.setCamera({ ...camera, ratio: camera.ratio / 10 });
  }, initialCamera);
  await expect.poll(async () => (await gridSnapshot(page)).step).not.toBe(initialGrid.step);
  await expect
    .poll(async () => Math.abs((await gridSnapshot(page)).originX - initialGrid.width / 2))
    .toBeLessThan(1);
  await expect
    .poll(async () => Math.abs((await gridSnapshot(page)).originY - initialGrid.height / 2))
    .toBeLessThan(1);

  const zoomedCamera = (await snapshot(page)).camera;
  await page.evaluate((camera) => {
    window.rugbyGraphProjectionTest!.setCamera({ ...camera, x: camera.x + 0.2, y: camera.y + 0.1 });
  }, zoomedCamera);
  await expect
    .poll(async () => Math.abs((await gridSnapshot(page)).originX - initialGrid.originX))
    .toBeGreaterThan(1);
  await expect
    .poll(async () => Math.abs((await gridSnapshot(page)).originY - initialGrid.originY))
    .toBeGreaterThan(1);
});

test("OpenSpec graph-projection: mouse zoom keeps the initial origin under the cursor", async ({
  page,
}) => {
  await openProjectionHarness(page);
  // Auto-fit is checked by default and reframes the camera; pin the classic
  // default camera so the zoom-origin expectations below hold.
  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.setAutoFit(false);
    window.rugbyGraphProjectionTest!.setCamera({ x: 0.5, y: 0.5, ratio: 1 });
  });

  const viewer = page.locator("#graph-viewer-panel");
  const viewerBox = await viewer.boundingBox();
  expect(viewerBox).not.toBeNull();
  const before = await snapshot(page);
  expect(before.camera).toEqual({ x: 0.5, y: 0.5, ratio: 1 });

  await page.mouse.move(viewerBox!.x + viewerBox!.width / 2, viewerBox!.y + viewerBox!.height / 2);
  await page.mouse.wheel(0, -120);

  await expect
    .poll(async () => (await snapshot(page)).camera.ratio)
    .toBeLessThan(before.camera.ratio);
  const after = await snapshot(page);
  expect(Math.abs(after.camera.x - 0.5)).toBeLessThan(0.005);
  expect(Math.abs(after.camera.y - 0.5)).toBeLessThan(0.005);
  const grid = await gridSnapshot(page);
  expect(Math.abs(grid.originX - grid.width / 2)).toBeLessThan(1);
  expect(Math.abs(grid.originY - grid.height / 2)).toBeLessThan(1);
});

test("OpenSpec graph-projection: double-clicking an empty viewer returns to the origin", async ({
  page,
}) => {
  await openProjectionHarness(page);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.showEmptyGraph();
  });
  const initialCamera = (await snapshot(page)).camera;
  const emptyGrid = await gridSnapshot(page);
  expect(Math.abs(emptyGrid.originX - emptyGrid.width / 2)).toBeLessThan(1);
  expect(Math.abs(emptyGrid.originY - emptyGrid.height / 2)).toBeLessThan(1);

  await page.evaluate(() => {
    window.rugbyGraphProjectionTest!.setCamera({ x: 0.4, y: 0.3, ratio: 0.25 });
  });
  const viewerBox = await page.locator("#graph-viewer-panel").boundingBox();
  expect(viewerBox).not.toBeNull();
  await page.mouse.dblclick(
    viewerBox!.x + viewerBox!.width / 2,
    viewerBox!.y + viewerBox!.height / 2,
  );

  await expect.poll(async () => (await snapshot(page)).camera).toEqual(initialCamera);
});

test("OpenSpec graph-projection: reveal button populates in size order without a full rebuild", async () => {
  const source = await readFile(
    new URL("../../src/lib/components/GraphViewer.svelte", import.meta.url),
    "utf8",
  );

  expect(source).toContain("createGraphModel");
  expect(source).toContain("new GraphProjection");
  expect(source).toContain("new ForceAtlas2Layout");
  expect(source).toContain("projection.applyDelta");
  expect(source).toContain("nodesByDescendingScore");
  expect(source).not.toContain("for (const node of dataset.nodes)");
});

test("OpenSpec graph-projection: reveal is driven by explicit edge deltas and native FA2", async () => {
  const projection = await readFile(
    new URL("../../src/lib/graph/graph-projection.ts", import.meta.url),
    "utf8",
  );
  const layout = await readFile(
    new URL("../../src/lib/graph/force-atlas2-layout.ts", import.meta.url),
    "utf8",
  );

  expect(projection).toContain("applyDelta");
  expect(projection).toContain("dropNode");
  expect(projection).toContain("updateEachNodeAttributes");
  expect(projection).toContain("visible");
  expect(layout).toContain("graphology-layout-forceatlas2/worker");
  expect(layout).toContain("barnesHutOptimize");
});

test("OpenSpec graph-projection: incremental nodes scale from visible connections", async () => {
  const projection = await readFile(
    new URL("../../src/lib/graph/graph-projection.ts", import.meta.url),
    "utf8",
  );
  const viewer = await readFile(
    new URL("../../src/lib/components/GraphViewer.svelte", import.meta.url),
    "utf8",
  );

  expect(projection).toContain("rescaleVisibleSizes");
  expect(projection).toContain("visibleDegree");
  expect(projection).toContain("DEGREE_SIZE_SLOPE");
  expect(projection).not.toContain("degreeForMaximumSize");
  expect(projection).not.toContain("Math.min(this.visibleDegree");
  expect(projection).toContain("size: 1");
  expect(projection).toContain("1 + scale * 3");
  expect(projection).toContain('"size"');
  expect(viewer).not.toContain("attribute: 'displayScore'");
  expect(viewer).not.toContain("scheduleNodeSizeRescale");
  expect(viewer).not.toContain("requestNodeSizeRescale");
  expect(viewer).toContain("itemSizesReference: 'positions'");
});

test("OpenSpec graph-projection: automatic addition is rate-limited and cleaned up", async () => {
  const viewer = await readFile(
    new URL("../../src/lib/components/GraphViewer.svelte", import.meta.url),
    "utf8",
  );
  const controls = await readFile(
    new URL("../../src/lib/components/GraphViewerControls.svelte", import.meta.url),
    "utf8",
  );

  expect(viewer).toContain("setInterval(addNodesBatch, ADD_NODES_CADENCE_MS)");
  expect(viewer).toContain("stopRepeatingNodes();");
  expect(controls).toContain("'Auto add'");
  expect(controls).toContain("Nodes added per second");
});

test("OpenSpec graph-projection: ForceAtlas2 uses the Layout tab without moving the camera", async () => {
  const viewer = await readFile(
    new URL("../../src/lib/components/GraphViewer.svelte", import.meta.url),
    "utf8",
  );
  const controls = await readFile(
    new URL("../../src/lib/components/GraphViewerControls.svelte", import.meta.url),
    "utf8",
  );
  const tabs = await readFile(
    new URL("../../src/lib/components/WorkspaceTabs.svelte", import.meta.url),
    "utf8",
  );

  expect(controls).toContain("let activeTab = $state<Tab>('graph')");
  expect(controls).toContain("<WorkspaceTabs");
  expect(tabs).toContain("id={`${tab.id}-tab`}");
  expect(viewer).not.toContain("focusPrimaryNeighborhood(model.nodes[index].key)");
  expect(viewer).toContain("renderer.on('doubleClickNode'");
  expect(viewer).toContain("renderer.on('doubleClickNodeLabel'");
  expect(viewer).toContain("renderer.on('doubleClickStage'");
  expect(viewer).toContain("autoRescale: false");
  expect(viewer).toContain("itemSizesReference: 'positions'");
  expect(viewer).toContain("zoomToSizeRatioFunction: (ratio) => ratio");
  expect(viewer).not.toContain("renderer.setSetting('autoRescale'");
});

test("OpenSpec graph-projection: ForceAtlas2 gravity has hundredth-step precision", async () => {
  const controls = await readFile(
    new URL("../../src/lib/components/GraphViewerControls.svelte", import.meta.url),
    "utf8",
  );

  expect(controls).toContain("gravity {settings.gravity.toFixed(2)}");
  expect(controls).toContain('aria-label="Gravity" type="range" min="0" max="5" step="0.01"');
});

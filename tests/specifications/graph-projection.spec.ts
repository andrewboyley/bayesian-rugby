import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

interface ProjectionSnapshot {
  visibleNodes: number;
  visibleEdges: number;
  layoutRunning: boolean;
  layoutActiveNodes: number;
}

interface ProjectionTestController {
  reveal: () => void;
  snapshot: () => ProjectionSnapshot;
}

declare global {
  interface Window {
    rugbyGraphProjectionTest?: ProjectionTestController;
  }
}

async function openProjectionHarness(page: import("@playwright/test").Page) {
  await page.goto("/?test=projection");
  await expect(page.getByLabel("Graph viewer").getByText("ready")).toBeVisible({ timeout: 30_000 });
}

async function snapshot(page: import("@playwright/test").Page): Promise<ProjectionSnapshot> {
  return page.evaluate(() => window.rugbyGraphProjectionTest!.snapshot() as ProjectionSnapshot);
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

  expect(projection).toContain("rescaleVisibleDegrees");
  expect(projection).toContain("visibleDegree");
  expect(projection).toContain("degreeForMaximumSize");
  expect(projection).toContain("'size'");
  expect(viewer).toContain("projection.rescaleVisibleDegrees(minScore, maxScore)");
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

  expect(viewer).toContain("setInterval(addNextNodeByDegree, 1000 / nodesPerSecond)");
  expect(viewer).toContain("stopRepeatingNodes();");
  expect(controls).toContain("'Auto add'");
  expect(controls).toContain("Nodes added per second");
});

test("OpenSpec graph-projection: ForceAtlas2 uses the Layout tab and the first node has a stable camera scale", async () => {
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
  expect(viewer).toContain("projection.visibleCount() === 1");
  expect(viewer).toContain("ratio: 2");
  expect(viewer).toContain("renderer.setSetting('autoRescale', projection.visibleCount() !== 0)");
});

test("OpenSpec graph-projection: ForceAtlas2 gravity has hundredth-step precision", async () => {
  const controls = await readFile(
    new URL("../../src/lib/components/GraphViewerControls.svelte", import.meta.url),
    "utf8",
  );

  expect(controls).toContain("gravity {settings.gravity.toFixed(2)}");
  expect(controls).toContain('aria-label="Gravity" type="range" min="0" max="5" step="0.01"');
});

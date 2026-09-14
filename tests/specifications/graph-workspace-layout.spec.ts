import { expect, test } from "@playwright/test";

async function openWorkspace(
  page: import("@playwright/test").Page,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "[ graph ]" })).toBeVisible();
}

test("OpenSpec graph-workspace-layout: desktop keeps the graph before a right sidebar", async ({
  page,
}) => {
  await openWorkspace(page, { width: 1280, height: 900 });

  const graph = page.getByLabel("Graph viewer");
  const controls = page.getByRole("complementary", { name: "Graph controls" });
  const graphTab = page.getByRole("tab", { name: "[ graph ]" });
  const layoutTab = page.getByRole("tab", { name: "[ layout ]" });
  const graphBox = await graph.boundingBox();
  const controlsBox = await controls.boundingBox();
  const graphTabBox = await graphTab.boundingBox();
  const layoutTabBox = await layoutTab.boundingBox();

  expect(graphBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(graphTabBox).not.toBeNull();
  expect(layoutTabBox).not.toBeNull();
  expect(controlsBox!.x).toBeGreaterThan(graphBox!.x + graphBox!.width / 2);
  expect(Math.abs(controlsBox!.y - graphBox!.y)).toBeLessThan(2);
  expect(layoutTabBox!.y).toBeGreaterThan(graphTabBox!.y);
  expect(Math.abs(layoutTabBox!.x - graphTabBox!.x)).toBeLessThan(2);
  expect(await graphTab.evaluate((tab) => getComputedStyle(tab).writingMode)).toBe("vertical-rl");
});

test("OpenSpec graph-workspace-layout: narrow view stacks controls after the graph", async ({
  page,
}) => {
  await openWorkspace(page, { width: 390, height: 844 });

  const graphBox = await page.getByLabel("Graph viewer").boundingBox();
  const controlsBox = await page
    .getByRole("complementary", { name: "Graph controls" })
    .boundingBox();

  expect(graphBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(controlsBox!.y).toBeGreaterThan(graphBox!.y + graphBox!.height - 2);
});

test("OpenSpec graph-workspace-layout: collapsed graph gives its narrow-screen space to controls", async ({
  page,
}) => {
  await openWorkspace(page, { width: 390, height: 844 });
  await page.getByLabel("Graph viewer").getByRole("button").click();

  const graphBox = await page.getByLabel("Graph viewer").boundingBox();
  const controlsBox = await page
    .getByRole("complementary", { name: "Graph controls" })
    .boundingBox();

  expect(graphBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(controlsBox!.y).toBeLessThan(graphBox!.y + graphBox!.height + 10);
  expect(controlsBox!.height).toBeGreaterThan(700);
});

test("OpenSpec graph-workspace-layout: two collapsed narrow-screen panels stay together", async ({
  page,
}) => {
  await openWorkspace(page, { width: 390, height: 844 });
  await page.getByRole("tab", { name: "[ graph ]" }).click();
  await page.getByLabel("Graph viewer").getByRole("button").click();

  const graphBox = await page.getByLabel("Graph viewer").boundingBox();
  const controlsBox = await page
    .getByRole("complementary", { name: "Graph controls" })
    .boundingBox();

  expect(graphBox).not.toBeNull();
  expect(controlsBox).not.toBeNull();
  expect(controlsBox!.y).toBeLessThan(graphBox!.y + graphBox!.height + 10);
});

test("OpenSpec graph-workspace-layout: panel bars and tabs show hover feedback", async ({
  page,
}) => {
  await openWorkspace(page, { width: 1280, height: 900 });

  const graphBar = page.locator("#graph-viewer > button");
  const controlsBar = page.locator("#graph-control-marker");
  const graphTab = page.getByRole("tab", { name: "[ graph ]" });
  await expect(graphBar.locator("span").first()).toHaveText("− graph");
  await expect(controlsBar).toHaveText("− controls");
  const graphBarColor = await graphBar.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const controlsBarColor = await controlsBar.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const tabColor = await graphTab.evaluate((element) => getComputedStyle(element).backgroundColor);

  await graphBar.hover();
  expect(await graphBar.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    graphBarColor,
  );
  await controlsBar.hover();
  expect(
    await controlsBar.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe(controlsBarColor);
  await graphTab.hover();
  expect(await graphTab.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    tabColor,
  );
});

test("OpenSpec graph-workspace-layout: clicking the active tab collapses controls and a tab restores them", async ({
  page,
}) => {
  await openWorkspace(page, { width: 1280, height: 900 });

  const graphTab = page.getByRole("tab", { name: "[ graph ]" });
  await graphTab.click();
  await expect(page.locator("#graph-panel")).toBeHidden();
  await page.getByRole("tab", { name: "[ layout ]" }).click();
  await expect(page.locator("#layout-panel")).toBeVisible();
});

test("OpenSpec graph-workspace-layout: panel headers restore the graph, selected tab, and setting", async ({
  page,
}) => {
  await openWorkspace(page, { width: 1280, height: 900 });

  await page.getByRole("tab", { name: "[ graph ]" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "[ layout ]" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("slider", { name: "Gravity" }).fill("0.12");
  await expect(page.getByText("gravity 0.12")).toBeVisible();

  const controls = page.getByRole("complementary", { name: "Graph controls" });
  const controlsHeader = page.locator("#graph-control-marker");
  const graphHeader = page.getByLabel("Graph viewer").getByRole("button");
  await page.locator("#graph-control-toggle-surface").click();
  await expect(page.locator("#layout-panel")).toBeHidden();
  const collapsedControls = await controls.boundingBox();
  expect(collapsedControls!.width).toBeLessThan(50);
  expect(
    await page
      .locator("#graph-control-marker")
      .evaluate((marker) => getComputedStyle(marker).writingMode),
  ).toBe("vertical-rl");
  await page.getByRole("tab", { name: "[ layout ]" }).click();
  await expect(page.locator("#layout-panel")).toBeVisible();
  await controlsHeader.click();
  await expect(page.locator("#layout-panel")).toBeHidden();
  await page.locator("#graph-control-marker").click();
  await graphHeader.click();
  await expect(page.locator("#graph-viewer-panel")).toBeHidden();
  const collapsedGraph = await page.getByLabel("Graph viewer").boundingBox();
  expect(collapsedGraph!.width).toBeLessThan(50);
  expect(await graphHeader.evaluate((header) => getComputedStyle(header).writingMode)).toBe(
    "vertical-rl",
  );
  await graphHeader.click();

  await expect(page.getByRole("tab", { name: "[ layout ]" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("slider", { name: "Gravity" })).toHaveValue("0.12");
});

test("OpenSpec graph-workspace-layout: auto add starts at 10 nodes per second and supports 60", async ({
  page,
}) => {
  await openWorkspace(page, { width: 1280, height: 900 });

  const automaticAdd = page.getByRole("region", { name: "[ automatic add ]" });
  const rate = page.getByRole("slider", { name: "Nodes added per second" });
  await expect(page.getByRole("heading", { name: "[ manual add ]" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add node" })).toBeVisible();
  await expect(automaticAdd.getByRole("button", { name: "Auto add" })).toBeVisible();
  await expect(automaticAdd.getByRole("slider", { name: "Nodes added per second" })).toBeVisible();
  await expect(rate).toHaveValue("10");
  await expect(rate).toHaveAttribute("max", "60");
});

test("OpenSpec graph-workspace-layout: the Layout panel scrolls within a bounded controls area", async ({
  page,
}) => {
  await openWorkspace(page, { width: 390, height: 400 });
  await page.getByRole("tab", { name: "[ layout ]" }).click();

  const metrics = await page.locator("#layout-panel").evaluate((panel) => {
    const scrollArea = panel.parentElement!;
    return {
      overflowY: getComputedStyle(scrollArea).overflowY,
      scrollHeight: scrollArea.scrollHeight,
      clientHeight: scrollArea.clientHeight,
    };
  });

  expect(metrics.overflowY).toBe("auto");
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
});

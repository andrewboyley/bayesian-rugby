import { expect, test } from "@playwright/test";

async function openSettingsPanel(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByRole("tab", { name: "[ graph ]" })).toBeVisible();
  await page.getByRole("tab", { name: "[ settings ]" }).click();
  await expect(page.locator("#settings-panel")).toBeVisible();
}

test("OpenSpec settings-panel: renderer tuning values stay hidden", async ({ page }) => {
  await openSettingsPanel(page);

  await expect(page.getByRole("slider", { name: "Coarse picking" })).toHaveCount(0);
  await expect(page.getByRole("slider", { name: "Normal picking" })).toHaveCount(0);
  await expect(page.getByText("golden angle", { exact: false })).toHaveCount(0);
});

test("OpenSpec settings-panel: user settings stay visible", async ({ page }) => {
  await openSettingsPanel(page);

  const cameraFraming = [
    "radius",
    "ratio",
    "center X",
    "center Y",
    "focus min",
    "focus max",
    "focus factor",
    "min span",
    "duration",
  ];
  for (const name of cameraFraming) {
    await expect(page.getByRole("slider", { name, exact: true })).toBeVisible();
  }

  const renderingAppearance = [
    "edge",
    "edge opaque",
    "edge inactive",
    "node inactive",
    "node active",
    "node pair",
    "edge pair",
    "label font",
    "label pad",
    "backdrop pad",
    "backdrop radius",
    "backdrop border",
    "backdrop blur",
  ];
  for (const name of renderingAppearance) {
    await expect(page.getByRole("slider", { name, exact: true })).toBeVisible();
  }

  const layoutRate = [
    "pop duration",
    "initial offset",
    "reveal scale",
    "reveal batch",
    "reveal timeout",
    "cadence",
    "nodes/s",
  ];
  for (const name of layoutRate) {
    await expect(page.getByRole("slider", { name, exact: true })).toBeVisible();
  }
});

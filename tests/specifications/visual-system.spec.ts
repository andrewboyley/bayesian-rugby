import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const requiredThemeTokens = [
  "--font-sans",
  "--color-canvas",
  "--color-ink",
  "--color-primary",
  "--color-surface-dark",
  "--color-hairline",
  "--color-accent",
  "--color-warning",
  "--color-danger",
  "--color-success",
  "--radius-sm",
  "--spacing-section",
  "--text-display-xl",
  "--text-caption",
];

test("OpenSpec visual-system: Tailwind theme contains required design tokens without daisyUI", async () => {
  const [stylesheet, viteConfig, packageJson] = await Promise.all([
    readFile(new URL("../../src/app.css", import.meta.url), "utf8"),
    readFile(new URL("../../vite.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../../package.json", import.meta.url), "utf8"),
  ]);

  expect(stylesheet).toContain("@import 'tailwindcss'");
  for (const token of requiredThemeTokens) expect(stylesheet).toContain(token);
  expect(viteConfig).toContain("import tailwindcss from '@tailwindcss/vite'");
  expect(viteConfig).toContain("tailwindcss()");
  expect(packageJson.toLowerCase()).not.toContain("daisyui");
});

test("OpenSpec visual-system: app shell resolves canvas, mono, and graph-panel tokens", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/");
  await expect(page.getByLabel("Graph viewer").getByText("ready")).toBeVisible({ timeout: 30_000 });

  await expect(page).toHaveTitle("Rugby Graph | Wikipedia concept network");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Explore the Wikipedia concept network as an interactive graph.",
  );
  const tokens = await page.evaluate(() => {
    const viewer = document.querySelector<HTMLElement>("#graph-viewer")!;
    const graphSurface = viewer.querySelector<HTMLElement>(".bg-surface-dark")!;
    const headerStatus = document.querySelector<HTMLElement>("main header span:last-child")!;
    return {
      background: getComputedStyle(document.body).backgroundColor,
      font: getComputedStyle(document.documentElement).fontFamily,
      panel: getComputedStyle(viewer).backgroundColor,
      graphSurface: getComputedStyle(graphSurface).backgroundColor,
      mutedText: getComputedStyle(headerStatus).color,
      darkSurfacesStayInViewer: Array.from(document.querySelectorAll<HTMLElement>("*"))
        .filter((element) => getComputedStyle(element).backgroundColor === "rgb(32, 29, 29)")
        .every((element) => viewer.contains(element)),
    };
  });

  expect(tokens).toMatchObject({
    background: "rgb(253, 252, 252)",
    panel: "rgb(253, 252, 252)",
    graphSurface: "rgb(32, 29, 29)",
    mutedText: "rgb(100, 98, 98)",
    darkSurfacesStayInViewer: true,
  });
  expect(tokens.font).toMatch(/Berkeley Mono.*monospace/);
  expect(pageErrors).toEqual([]);
});

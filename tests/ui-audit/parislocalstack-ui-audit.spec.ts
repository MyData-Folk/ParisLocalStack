import AxeBuilder from "@axe-core/playwright";
import { test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDir = path.join(process.cwd(), "node_modules", ".cache", "parislocalstack-ui-audit");
const surfaces = [
  { name: "guest-demo", path: "/h/demo-paris-local/welcome" },
  { name: "reception", path: "/reception" },
  { name: "hotel-admin", path: "/hotel-admin" }
];

test.describe("ParisLocalStack UI audit", () => {
  for (const surface of surfaces) {
    test(`${surface.name} screenshot and accessibility scan`, async ({ page }, testInfo) => {
      await mkdir(outputDir, { recursive: true });

      await page.goto(surface.path, { waitUntil: "domcontentloaded" });
      await page.screenshot({
        fullPage: true,
        path: path.join(outputDir, `${surface.name}-${testInfo.project.name}.png`)
      });

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      await writeFile(
        path.join(outputDir, `${surface.name}-${testInfo.project.name}-axe.json`),
        JSON.stringify(accessibilityScanResults.violations, null, 2),
        "utf8"
      );

      testInfo.annotations.push({
        type: "ui-audit",
        description: `${accessibilityScanResults.violations.length} accessibility violation(s) recorded. This audit is intentionally non-blocking.`
      });
    });
  }
});

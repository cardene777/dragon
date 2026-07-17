import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const panelState = await page.evaluate(() => {
  const badge = document.querySelector(".v4-editor-warnings-badge");
  const hint = document.querySelector(".v4-editor-warnings-hint");
  const items = document.querySelectorAll(".v4-editor-warnings-list li");
  const button = document.querySelector(".v4-editor-warnings-apply");
  return {
    badgeText: badge?.textContent?.trim() ?? null,
    hintText: hint?.textContent?.trim() ?? null,
    itemCount: items.length,
    itemAxes: Array.from(items).map((li) => li.textContent?.match(/^([\w-]+):/)?.[1] ?? null),
    buttonText: button?.textContent?.trim() ?? null,
    buttonDisabled: button?.hasAttribute("disabled") ?? null,
  };
});

console.log("=== warning panel state ===");
console.log(JSON.stringify(panelState, null, 2));

const subpixelInList = panelState.itemAxes.includes("subpixel-precision");
const subpixelInHint = panelState.hintText?.includes("subpixel") ?? false;
console.log("\n=== filter check ===");
console.log("subpixel-precision in list:", subpixelInList, "(expected: false)");
console.log("subpixel in hint text:", subpixelInHint, "(expected: false)");

await browser.close();
process.exit(subpixelInList || subpixelInHint ? 1 : 0);

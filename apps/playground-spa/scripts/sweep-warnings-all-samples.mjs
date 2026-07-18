import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/dragon-sample-sweep", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const detailsToggle = await page.$("details.v4-editor-side-samples summary");
if (detailsToggle) {
  await detailsToggle.click();
  await page.waitForTimeout(500);
}

const sampleButtons = await page.$$(".v4-editor-side-item");
console.log(`found ${sampleButtons.length} sample buttons\n`);

const results = [];
for (let i = 0; i < sampleButtons.length; i++) {
  const buttons = await page.$$(".v4-editor-side-item");
  const btn = buttons[i];
  const label = await btn.textContent();
  await btn.click();
  await page.waitForTimeout(2500);

  const state = await page.evaluate(() => {
    const panel = document.querySelector(".v4-editor-warnings");
    if (!panel) return { visible: false };
    const badge = panel.querySelector(".v4-editor-warnings-badge")?.textContent?.trim() ?? null;
    const hint = panel.querySelector(".v4-editor-warnings-hint")?.textContent?.trim() ?? null;
    const items = Array.from(panel.querySelectorAll(".v4-editor-warnings-list li"));
    const axes = items.map((li) => {
      const t = li.textContent ?? "";
      const m = t.match(/([\w-]+):/);
      return m ? m[1] : null;
    });
    const button = panel.querySelector(".v4-editor-warnings-apply");
    return {
      visible: true,
      badge,
      hint,
      itemCount: items.length,
      axes,
      buttonText: button?.textContent?.trim() ?? null,
      buttonDisabled: button?.hasAttribute("disabled") ?? null,
    };
  });

  results.push({ label: label?.trim(), state });
  console.log(`${i + 1}. ${label?.trim()}`);
  if (state.visible) {
    const axisSummary = state.axes.reduce((acc, ax) => {
      acc[ax ?? "unknown"] = (acc[ax ?? "unknown"] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`   badge = ${state.badge}`);
    console.log(`   axes = ${JSON.stringify(axisSummary)}`);
    console.log(`   button = ${state.buttonText} (disabled=${state.buttonDisabled})`);
  } else {
    console.log(`   panel = hidden (0 warnings)`);
  }
}

console.log("\n=== summary ===");
const visibleCount = results.filter((r) => r.state.visible).length;
console.log(`visible panels: ${visibleCount}/${results.length}`);

const allAxes = new Set();
const problemSamples = [];
for (const r of results) {
  if (!r.state.visible) continue;
  for (const ax of r.state.axes) allAxes.add(ax);
  if (r.state.buttonDisabled) problemSamples.push({ label: r.label, axes: r.state.axes });
}
console.log(`unique axes across all samples: ${JSON.stringify(Array.from(allAxes))}`);
console.log(`samples with "対応可なし" button: ${problemSamples.length}`);
for (const p of problemSamples) {
  const axisSummary = p.axes.reduce((acc, ax) => {
    acc[ax ?? "unknown"] = (acc[ax ?? "unknown"] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  - ${p.label}: ${JSON.stringify(axisSummary)}`);
}

await browser.close();

import { chromium } from "playwright";
const dir = "/Users/cardene/Desktop/projects/dragon/.context/scratch/pr-screenshots-car-1646";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
await p.goto("http://localhost:4323/editor", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
// Shot 1 = default samples tab
await p.screenshot({ path: `${dir}/01-samples-tab.png`, fullPage: false });
// Click parts tab
await p.click('[data-testid="editor-parts-tab"]');
await p.waitForSelector('[data-testid="editor-part-item-parts-wave-gauge"]', { timeout: 5000 });
await p.waitForTimeout(400);
// Shot 2 = parts tab open with 80 parts visible
await p.screenshot({ path: `${dir}/02-parts-tab-80items.png`, fullPage: false });
// Click first part = trigger REPLACE
await p.click('[data-testid="editor-part-item-parts-bind-counter-radius"]');
await p.waitForTimeout(1000);
// Shot 3 = editor with #!parts marker text + preview render
await p.screenshot({ path: `${dir}/03-drop-replace-result.png`, fullPage: false });
await b.close();
console.log("3 screenshots saved to", dir);

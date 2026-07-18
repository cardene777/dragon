import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto("http://localhost:4323/editor", { waitUntil: "domcontentloaded" });
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(3000);
// Get parent g transforms for node-body
const gs = await page.locator("g:has(> rect[data-cdl-role='node-body']) g, g[data-cdl-role='node-body']").evaluateAll(els =>
  els.slice(0, 12).map(el => {
    return {
      tag: el.tagName,
      role: el.getAttribute("data-cdl-role"),
      transform: el.getAttribute("transform") || el.parentElement?.getAttribute("transform"),
      parentTransform: el.parentElement?.getAttribute("transform"),
    };
  })
);
console.log("group transforms:");
gs.slice(0, 8).forEach(g => console.log(`  ${g.tag}[${g.role}] transform=${g.transform} parent=${g.parentTransform}`));
// Look up via node id container
const nodeContainers = await page.locator("g[data-cdl-node-id]").evaluateAll(els =>
  els.slice(0, 12).map(el => ({
    id: el.getAttribute("data-cdl-node-id"),
    transform: el.getAttribute("transform"),
    dataX: el.getAttribute("data-cdl-node-x"),
    dataY: el.getAttribute("data-cdl-node-y"),
  }))
);
console.log("node containers:");
nodeContainers.forEach(n => console.log(`  ${n.id}: transform=${n.transform} dataY=${n.dataY}`));
await browser.close();

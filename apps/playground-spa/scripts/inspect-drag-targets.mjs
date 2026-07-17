import { chromium } from "playwright";

const BASE = "http://localhost:4323";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto(`${BASE}/editor?nocache=${Date.now()}`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

// SVG 全 element の data-cdl-* attribute を列挙 (ユーザー lane / header / footer に注目)
const targets = await page.$$eval("svg [data-cdl-node], svg [data-cdl-lane]", (nodes) =>
  nodes.map((n) => ({
    tag: n.tagName,
    node: n.getAttribute("data-cdl-node"),
    lane: n.getAttribute("data-cdl-lane"),
    text: n.textContent?.slice(0, 30) ?? "",
    rect: (() => {
      const r = n.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    })(),
  })),
);
console.log("=== data-cdl-node / data-cdl-lane elements ===");
for (const t of targets.slice(0, 30)) {
  console.log(JSON.stringify(t));
}

// text 要素 (data 属性なし) も確認 = lane label 判別
const textOnly = await page.$$eval("svg text", (nodes) =>
  nodes.filter((n) => !n.closest("[data-cdl-node], [data-cdl-lane]")).map((n) => ({
    text: n.textContent,
    x: n.getAttribute("x"),
    y: n.getAttribute("y"),
    parent: n.parentElement?.tagName,
    parentAttrs: Array.from(n.parentElement?.attributes ?? []).map((a) => `${a.name}=${a.value}`).join(" "),
  })).slice(0, 10),
);
console.log("=== SVG text (no data-cdl-* ancestor) ===");
for (const t of textOnly) {
  console.log(JSON.stringify(t));
}

await browser.close();

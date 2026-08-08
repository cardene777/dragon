/**
 * 全 page を明るい画面 / 暗い画面 / 携帯の幅で撮る (#1094)。
 *
 * 元は `tests/audit-3vp.spec.ts` で 33 件 (11 経路 × 3) の検査として置かれていたが、 `expect` を
 * 1 つも持たない。 判定を持たない以上これは検査ではなく目視用の道具なので、 script として持つ。
 *
 * 起動 = `pnpm shoot:3vp` (開発サーバーが立っていること)。
 * 出力 = `test-results/audit/{light,dark,mobile}/<slug>.png`。
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:4323";
const OUT = "test-results/audit";
for (const d of ["light", "dark", "mobile"]) mkdirSync(`${OUT}/${d}`, { recursive: true });

const ROUTES = [
  { path: "/", slug: "home" },
  { path: "/docs", slug: "docs" },
  { path: "/editor", slug: "editor" },
  { path: "/catalog", slug: "catalog" },
  { path: "/catalog/presets", slug: "cat-presets" },
  { path: "/catalog/text-dsl", slug: "cat-text-dsl" },
  { path: "/catalog/primitives", slug: "cat-primitives" },
  { path: "/preset/swimlane", slug: "preset-swim" },
  { path: "/release-notes", slug: "release" },
  { path: "/contribute", slug: "contribute" },
  { path: "/does-not-exist", slug: "404" },
]

/** 撮り方 3 種。 名前が出力先の dir になる */
const 撮り方 = [
  { 名前: "light", 幅: 1440, 高さ: 900, 暗い: false },
  { 名前: "dark", 幅: 1440, 高さ: 900, 暗い: true },
  { 名前: "mobile", 幅: 375, 高さ: 667, 暗い: false },
];

const browser = await chromium.launch();
let 撮った = 0;

for (const 形 of 撮り方) {
  const ctx = await browser.newContext();
  if (形.暗い) await ctx.addInitScript(() => localStorage.setItem("v4-theme", "dark"));
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 形.幅, height: 形.高さ });
  for (const r of ROUTES) {
    await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${形.名前}/${r.slug}.png`, fullPage: true });
    撮った += 1;
  }
  await ctx.close();
  console.log(`${形.名前} を ${ROUTES.length} 件撮影`);
}

await browser.close();
console.log(`\n合計 ${撮った} 枚を ${OUT} に出力`);

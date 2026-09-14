import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "../src/lib/catalog";

const OUT = "test-results/regression";
mkdirSync(OUT, { recursive: true });

const ここ = dirname(fileURLToPath(import.meta.url));

/** 開く画面と、その画面が当たる行き先の型 (`main.tsx` の `<Route path>`) */
type 画面 = { path: string; slug: string; 行き先: string; expectSelector: string };

/**
 * 行き先の型ごとに 1 つ以上の画面と、カタログの全ての分類の画面を開く (#1950)。
 *
 * 分類の画面は `CATEGORIES` から導く。 手で並べていた間、11 分類のうち 4 つ (`ethereum` / `charts` /
 * `parts` / `interactive`) を 1 度も開いていなかった。 行き先の型に開く画面が対応していることは、
 * 下の検査が `main.tsx` を読んで確かめる。
 *
 * 経路は base 相対で書く (先頭 `/` を付けると base が落ちる、 #1438)。
 */
const 決まった画面: 画面[] = [
  { path: "", slug: "home", 行き先: "/", expectSelector: "h1" },
  { path: "docs", slug: "docs", 行き先: "/docs", expectSelector: "h1" },
  { path: "editor", slug: "editor", 行き先: "/editor", expectSelector: ".v4-editor, main" },
  {
    path: "editor/diagram.yml",
    slug: "editor-filename",
    行き先: "/editor/:filename",
    expectSelector: ".v4-editor, main",
  },
  { path: "catalog", slug: "catalog-index", 行き先: "/catalog", expectSelector: "h1" },
  { path: "preset/swimlane", slug: "preset-swimlane", 行き先: "/preset/:id", expectSelector: "h1" },
  { path: "release-notes", slug: "release-notes", 行き先: "/release-notes", expectSelector: "h1" },
  { path: "contribute", slug: "contribute", 行き先: "/contribute", expectSelector: "h1" },
  { path: "does-not-exist", slug: "404", 行き先: "*", expectSelector: ".v4-404-code" },
];

const ROUTES: 画面[] = [
  ...決まった画面,
  ...CATEGORIES.map((c) => ({
    path: `catalog/${c.slug}`,
    slug: `catalog-${c.slug}`,
    行き先: "/catalog/:slug",
    expectSelector: "h1",
  })),
];

/** 開かない行き先の型と、その理由 */
const 開かない行き先: Record<string, string> = {
  "/__render":
    "開発用の画面でだけ組み込む検査用の頁で、公開の画面には無い。 見本に無い形の図を通す検査が自分で開く",
};

/** 定義 (`main.tsx`) の行き先の型のうち、開く画面も外す理由も持たないもの */
function 開かない行き先を探す(
  定義: string,
  画面たち: readonly 画面[],
  外す: Record<string, string>,
): { 抜け: string[]; 読んだ: number } {
  const 行き先たち = [...定義.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]!);
  const 開く = new Set(画面たち.map((r) => r.行き先));
  return {
    抜け: 行き先たち.filter((p) => !開く.has(p) && !Object.hasOwn(外す, p)),
    読んだ: 行き先たち.length,
  };
}

test("画面の行き先の型のどれにも、開く画面か外す理由がある", () => {
  const 定義 = readFileSync(join(ここ, "../src/main.tsx"), "utf8");
  const { 抜け, 読んだ } = 開かない行き先を探す(定義, ROUTES, 開かない行き先);
  expect(読んだ, "行き先の型を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
  expect(抜け).toEqual([]);
});

test("植え込み対照: 行き先の型を 1 つ足した定義では、その行き先を抜けとして見つける", () => {
  const 定義 = `<Route path="/" element={<A />} />\n<Route path="/新しい画面" element={<B />} />`;
  expect(開かない行き先を探す(定義, ROUTES, 開かない行き先).抜け).toEqual(["/新しい画面"]);
});

for (const r of ROUTES) {
  test(`route ${r.slug}`, async ({ page }) => {
    const errs: string[] = [];
    page.on("pageerror", (e) => errs.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error") errs.push(m.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(r.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/${r.slug}.png`, fullPage: false });
    await expect(page.locator(r.expectSelector).first()).toBeVisible();
    // 端末の誤りは 1 件でも落とす。 以前は 1 画面 2 件まで通しており、誤りが出始めても気付けなかった
    expect(errs, `${r.slug} で端末の誤りが出た`).toEqual([]);
  });
}

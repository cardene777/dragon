/** 凡例が舞台の外側まで含めて各形式へ残ることを確かめる (#2834)。 */
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { PNG } from "pngjs";

import { 編集画面の字 } from "../../src/lib/editor-text";
import { openEditorTheme, samplesByType } from "../helpers/fixed-theme-checks";

const 書き出しの札 = 編集画面の字("ja");
const 見本 = samplesByType().get("flow");
if (見本 === undefined) throw new Error("flow の見本が無く、凡例の書き出し検査を組み立てられない");

const 凡例 = `legend:
  - { mark: diamond, text: "分かれ道" }
  - { mark: filled-circle, text: "始まり" }
  - { mark: double-circle, text: "終わり" }
`;
const 凡例つき = `${見本.trimEnd()}\n\n${凡例}`;
const 色を保つ凡例つき = `${見本.trimEnd()}

legend:
  - { mark: filled-circle, text: "始まり" }
  - { mark: dotted-line, text: "点線 = 前の段へ戻る" }
`;
const 期待する字 = ["分かれ道", "始まり", "終わり"];

async function 書き出す(
  page: Page,
  testInfo: TestInfo,
  札: string,
  拡張子: "svg" | "png",
  名前: string,
): Promise<string> {
  const menu = page.getByTestId("editor-export");
  await menu.hover();
  const button = page.locator(".v4-editor-export-menu button").filter({
    has: page.locator("strong", { hasText: 札 }),
  });
  await expect(button, `${札} の札が書き出し menu に無い`).toHaveCount(1);
  const 待受 = page.waitForEvent("download");
  await button.click();
  const download = await 待受;
  const file = testInfo.outputPath(`${名前}.${拡張子}`);
  await download.saveAs(file);
  return file;
}

async function 凡例を調べる(page: Page): Promise<void> {
  const 項目 = page.locator('[data-cdl-role="legend-item"]');
  await expect(項目).toHaveCount(3);
  await expect(page.locator('[data-cdl-role="legend-text"]')).toHaveText(期待する字);

  const 位置 = await page.locator("svg[data-cdl-stage]").evaluate((stage) => {
    const boxes = [...stage.querySelectorAll<SVGGraphicsElement>("[data-cdl-node]")].map((node) =>
      node.getBBox(),
    );
    const bottom = Math.max(...boxes.map((box) => box.y + box.height));
    const ys = [...stage.querySelectorAll<SVGElement>('[data-cdl-role="legend-item"]')].map(
      (item) => Number(item.getAttribute("data-cdl-y")),
    );
    return { bottom, ys };
  });
  expect(位置.ys, "凡例の基準線が数として読めない").toHaveLength(3);
  expect(位置.ys.every((y) => Number.isFinite(y) && y > 位置.bottom)).toBe(true);

  const 未解決 = await page.locator(":root").evaluate((root) => {
    const ids = new Set<string>();
    for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
      for (const attribute of element.getAttributeNames()) {
        const value = element.getAttribute(attribute) ?? "";
        for (const match of value.matchAll(/url\(\s*["']?#([^\s)'"]+)["']?\s*\)/g)) {
          const id = match[1];
          if (id) ids.add(id);
        }
        if ((attribute === "href" || attribute === "xlink:href") && value.startsWith("#"))
          ids.add(value.slice(1));
      }
    }
    return [...ids].filter((id) => document.getElementById(id) === null);
  });
  expect(未解決).toEqual([]);
}

async function 凡例の印色を読む(page: Page): Promise<{ filled: string; dotted: string }> {
  return page.locator("svg[data-cdl-stage]").evaluate((stage) => {
    const filled = stage.querySelector<SVGElement>(
      '[data-cdl-legend-mark="filled-circle"] circle',
    );
    const dotted = stage.querySelector<SVGElement>('[data-cdl-legend-mark="dotted-line"] path');
    if (filled === null || dotted === null) throw new Error("凡例の塗った丸または点線が無い");
    return {
      filled: getComputedStyle(filled).fill,
      dotted: getComputedStyle(dotted).stroke,
    };
  });
}

async function 図録の基準色を読む(page: Page): Promise<{ filled: string; dotted: string }> {
  return page.locator("svg[data-cdl-stage]").evaluate((stage) => {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const 墨 = document.createElementNS(SVG_NS, "circle");
    const 戻る線 = document.createElementNS(SVG_NS, "circle");
    // 属性に残る custom property の文字列でなく、画面で使われる色へ解決して比べる。
    墨.style.fill = "var(--d-text-primary)";
    戻る線.style.fill = "var(--er-own)";
    stage.append(墨, 戻る線);
    try {
      return {
        filled: getComputedStyle(墨).fill,
        dotted: getComputedStyle(戻る線).fill,
      };
    } finally {
      墨.remove();
      戻る線.remove();
    }
  });
}

test("凡例が静止 SVG・動く SVG・PNG の図の下へ残る (#2834)", async ({
  page,
  context,
}, testInfo) => {
  await openEditorTheme(page, 凡例つき, "kinari", false);
  const 静止file = await 書き出す(page, testInfo, 書き出しの札.静止SVG, "svg", "legend-still");
  const 動くfile = await 書き出す(page, testInfo, 書き出しの札.動くSVG, "svg", "legend-animated");
  const 凡例PNGfile = await 書き出す(page, testInfo, "PNG", "png", "legend");

  for (const [名前, file] of [
    ["静止 SVG", 静止file],
    ["動く SVG", 動くfile],
  ] as const) {
    const single = await context.newPage();
    try {
      await single.goto(pathToFileURL(file).href);
      await 凡例を調べる(single);
    } finally {
      await single.close();
    }
    console.log(`${名前}: 凡例 3 項目、文字、位置、参照を確認`);
  }

  const 凡例PNG = PNG.sync.read(await readFile(凡例PNGfile));
  await openEditorTheme(page, 見本, "kinari", false);
  const 通常PNGfile = await 書き出す(page, testInfo, "PNG", "png", "without-legend");
  const 通常PNG = PNG.sync.read(await readFile(通常PNGfile));
  expect(凡例PNG.height, "凡例を含む PNG の下側が広がっていない").toBeGreaterThan(通常PNG.height);
});

test("図録の静止 SVG を単独で開いても凡例の印色を保つ (#2834)", async ({
  page,
  context,
}, testInfo) => {
  await openEditorTheme(page, 色を保つ凡例つき, "catalog", false);
  const 画面の色 = await 凡例の印色を読む(page);
  expect(画面の色).toEqual(await 図録の基準色を読む(page));
  const file = await 書き出す(page, testInfo, 書き出しの札.静止SVG, "svg", "legend-colors");

  const single = await context.newPage();
  try {
    await single.goto(pathToFileURL(file).href);
    expect(await 凡例の印色を読む(single)).toEqual(画面の色);
  } finally {
    await single.close();
  }
});

/**
 * 書き出した意匠が単独の file でも画面と同じに見えることを検証する (#2800)。
 * 完了条件の file 指定が `e2e/export-theme.spec.ts` に当たるため、この検査は `e2e/` の下に置く。
 * 画面で使う CSS と舞台外の defs を持ち出せているかを、書き出し後の file から独立に測る。
 */
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { THEMES } from "@cardenelabs/dragon";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { PNG } from "pngjs";

import { 編集画面の字 } from "../../src/lib/editor-text";
import { openEditorTheme, samplesByType } from "../helpers/fixed-theme-checks";

type 色 = readonly [number, number, number];

const SVG_NS = "http://www.w3.org/2000/svg";
const 書き出しの札 = 編集画面の字("ja");
const 図の見本 = samplesByType();

function 見本(type: "flow" | "sequence"): string {
  const source = 図の見本.get(type);
  if (source === undefined) throw new Error(`${type} の見本が無く、意匠の検査が空振りしている`);
  return source;
}

async function 画面の地(page: Page): Promise<string> {
  const 色 = await page
    .locator(".v4-editor-preview svg[data-cdl-stage]")
    .evaluate((stage) => getComputedStyle(stage).backgroundColor);
  expect(色, "舞台の地が透明で、書き出しの期待値を持てない").not.toBe("transparent");
  expect(色, "舞台の地が透明で、書き出しの期待値を持てない").not.toBe("rgba(0, 0, 0, 0)");
  return 色;
}

async function 書き出す(
  page: Page,
  testInfo: TestInfo,
  札: string,
  拡張子: "svg" | "png",
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
  const file = testInfo.outputPath(`export-${札.replaceAll(/\s/g, "-")}.${拡張子}`);
  await download.saveAs(file);
  return file;
}

function rgb(色: string): 色 {
  const match = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(色);
  if (!match) throw new Error(`rgb として読めない地の色: ${色}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function 最頻色(png: PNG, x: number, y: number, width: number, height: number): 色 {
  const 件数 = new Map<string, number>();
  const 右 = Math.min(png.width, Math.max(0, Math.floor(x + width)));
  const 下 = Math.min(png.height, Math.max(0, Math.floor(y + height)));
  for (let py = Math.max(0, Math.floor(y)); py < 下; py += 1) {
    for (let px = Math.max(0, Math.floor(x)); px < 右; px += 1) {
      const index = (py * png.width + px) * 4;
      const key = `${png.data[index]},${png.data[index + 1]},${png.data[index + 2]}`;
      件数.set(key, (件数.get(key) ?? 0) + 1);
    }
  }
  const 最多 = [...件数.entries()].sort(([, a], [, b]) => b - a)[0]?.[0];
  if (!最多) throw new Error("地の色を読む帯に画素が無い");
  const parts = 最多.split(",").map(Number);
  if (parts.length !== 3) throw new Error("最頻色を RGB の三成分に分けられない");
  return [parts[0]!, parts[1]!, parts[2]!];
}

function 同じ色(実測: 色, 期待: string): void {
  const 期待rgb = rgb(期待);
  expect(
    実測.every((value, index) => Math.abs(value - 期待rgb[index]!) <= 1),
    `地 ${実測.join(",")} / 画面 ${期待}`,
  ).toBe(true);
}

async function 単独のSVGを開く(
  page: Page,
  file: string,
): Promise<{ backgroundColor: string; 帯: 色 }> {
  await page.setViewportSize({ width: 2200, height: 900 });
  await page.goto(pathToFileURL(file).href);
  const { 根, viewport } = await page.evaluate(() => {
    const rect = document.documentElement.getBoundingClientRect();
    return {
      根: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
  const clip = {
    x: Math.max(0, 根.x),
    y: Math.max(0, 根.y + 根.height - 4),
    width: Math.min(根.width, viewport.width),
    height: 6,
  };
  if (clip.width <= 0 || clip.height <= 0) throw new Error("単独 SVG の根の帯を撮れない");
  const image = PNG.sync.read(await page.screenshot({ clip }));
  return {
    backgroundColor: await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    ),
    帯: 最頻色(image, 0, 0, image.width, image.height),
  };
}

async function PNGの地(file: string): Promise<色> {
  const image = PNG.sync.read(await readFile(file));
  return 最頻色(image, 0, Math.max(0, image.height - 16), image.width, Math.min(16, image.height));
}

function file内の参照を調べる(): { unresolved: string[]; ids: string[] } {
  const ids = new Set<string>();
  for (const element of document.querySelectorAll<HTMLElement>("*")) {
    for (const attribute of element.getAttributeNames()) {
      const value = element.getAttribute(attribute) ?? "";
      for (const match of value.matchAll(
        /url\(\s*["']?#([^\s)'"]+)["']?\s*\)|(?:xlink:)?href\s*=\s*["']?#([^\s)'"]+)/g,
      )) {
        const id = match[1] ?? match[2];
        if (id) ids.add(id);
      }
      if ((attribute === "href" || attribute === "xlink:href") && value.startsWith("#"))
        ids.add(value.slice(1));
    }
  }
  return {
    ids: [...ids],
    unresolved: [...ids].filter((id) => document.getElementById(id) === null),
  };
}

async function fileの参照(page: Page): Promise<{ unresolved: string[]; ids: string[] }> {
  return await page.evaluate(file内の参照を調べる);
}

async function 画面が使う定義(page: Page): Promise<string[]> {
  return await page.locator(".v4-editor-preview svg[data-cdl-stage]").evaluate((stage) => {
    const ids = new Set<string>();
    for (const element of [stage, ...stage.querySelectorAll<SVGElement>("*")]) {
      const style = getComputedStyle(element);
      for (const value of [
        style.filter,
        style.fill,
        style.stroke,
        style.markerStart,
        style.markerMid,
        style.markerEnd,
        style.clipPath,
        style.mask,
      ]) {
        for (const match of value.matchAll(/url\(\s*["']?#([^\s)'"]+)["']?\s*\)/g))
          ids.add(match[1]!);
      }
    }
    return [...ids];
  });
}

for (const theme of THEMES) {
  test(`静止SVG: ${theme} を単独で開いた時の地が画面と同じ (#2800)`, async ({
    page,
    context,
  }, testInfo) => {
    await openEditorTheme(page, 見本("flow"), theme, false);
    const 期待 = await 画面の地(page);
    const file = await 書き出す(page, testInfo, 書き出しの札.静止SVG, "svg");
    const single = await context.newPage();
    try {
      const 実測 = await 単独のSVGを開く(single, file);
      expect(実測.backgroundColor).toBe(期待);
      同じ色(実測.帯, 期待);
      console.log(`静止SVG ${theme}: 地 ${実測.帯.join(",")} / 画面 ${期待} 一致`);
    } finally {
      await single.close();
    }
  });

  test(`静止SVG: ${theme} を暗い画面で書き出しても地が画面と同じ (#2800)`, async ({
    page,
    context,
  }, testInfo) => {
    await openEditorTheme(page, 見本("flow"), theme, true);
    const 期待 = await 画面の地(page);
    const file = await 書き出す(page, testInfo, 書き出しの札.静止SVG, "svg");
    const single = await context.newPage();
    try {
      const 実測 = await 単独のSVGを開く(single, file);
      expect(実測.backgroundColor).toBe(期待);
      同じ色(実測.帯, 期待);
      console.log(`静止SVG ${theme}: 地 ${実測.帯.join(",")} / 画面 ${期待} 一致`);
    } finally {
      await single.close();
    }
  });

  test(`動くSVG: ${theme} を単独で開いた時の地が画面と同じ (#2800)`, async ({
    page,
    context,
  }, testInfo) => {
    await openEditorTheme(page, 見本("flow"), theme, false);
    const 期待 = await 画面の地(page);
    const file = await 書き出す(page, testInfo, 書き出しの札.動くSVG, "svg");
    const single = await context.newPage();
    try {
      const 実測 = await 単独のSVGを開く(single, file);
      expect(実測.backgroundColor).toBe(期待);
      同じ色(実測.帯, 期待);
      console.log(`動くSVG ${theme}: 地 ${実測.帯.join(",")} / 画面 ${期待} 一致`);
    } finally {
      await single.close();
    }
  });

  test(`PNG: ${theme} の紙の色が意匠の地の色になる (#2800)`, async ({ page }, testInfo) => {
    await openEditorTheme(page, 見本("flow"), theme, false);
    const 期待 = await 画面の地(page);
    const file = await 書き出す(page, testInfo, "PNG", "png");
    const 実測 = await PNGの地(file);
    同じ色(実測, 期待);
    console.log(`PNG ${theme}: 地 ${実測.join(",")} / 画面 ${期待} 一致`);
  });

  for (const type of ["flow", "sequence"] as const) {
    test(`参照: ${theme} の ${type} を書き出した SVG に解けない url(#…) が無い (#2800)`, async ({
      page,
      context,
    }, testInfo) => {
      await openEditorTheme(page, 見本(type), theme, false);
      const 使う定義 = await 画面が使う定義(page);
      const 静止file = await 書き出す(page, testInfo, 書き出しの札.静止SVG, "svg");
      const 動くfile = await 書き出す(page, testInfo, 書き出しの札.動くSVG, "svg");
      const 静止 = await context.newPage();
      const 動く = await context.newPage();
      try {
        await 静止.goto(pathToFileURL(静止file).href);
        await 動く.goto(pathToFileURL(動くfile).href);
        const 静止の参照 = await fileの参照(静止);
        const 動くの参照 = await fileの参照(動く);
        expect(静止の参照.unresolved).toEqual([]);
        expect(動くの参照.unresolved).toEqual([]);
        for (const id of 使う定義) {
          expect(
            await 静止.locator(`[id="${id}"]`).count(),
            `静止 SVG に ${id} が無い`,
          ).toBeGreaterThan(0);
          expect(
            await 動く.locator(`[id="${id}"]`).count(),
            `動く SVG に ${id} が無い`,
          ).toBeGreaterThan(0);
        }
        console.log(
          `参照 ${theme} ${type}: 静止 未解決 ${静止の参照.unresolved.length} / 動く 未解決 ${動くの参照.unresolved.length} / 画面が使う定義 ${使う定義.length} 件`,
        );
      } finally {
        await 静止.close();
        await 動く.close();
      }
    });
  }
}

test("副作用: 書き出しの名前空間と動きの扱いが従来どおり (#2800)", async ({
  page,
  context,
}, testInfo) => {
  await openEditorTheme(page, 見本("flow"), "sketch", false);
  const 期待 = await 画面の地(page);
  await page.locator(".v4-editor-preview svg[data-cdl-stage]").evaluate((stage, namespace) => {
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("id", "export-check-route");
    path.setAttribute("d", "M 0 0 L 40 0");
    path.setAttribute("fill", "none");
    const smil = document.createElementNS(namespace, "circle");
    smil.setAttribute("data-export-check", "smil");
    smil.setAttribute("r", "4");
    smil.setAttribute("cx", "10");
    smil.setAttribute("cy", "10");
    smil.innerHTML =
      '<animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />';
    const motion = document.createElementNS(namespace, "circle");
    motion.setAttribute("data-export-check", "motion");
    motion.setAttribute("r", "3");
    motion.innerHTML =
      '<animateMotion dur="2s" repeatCount="indefinite"><mpath href="#export-check-route" /></animateMotion>';
    stage.append(path, smil, motion);
  }, SVG_NS);
  const 動くfile = await 書き出す(page, testInfo, 書き出しの札.動くSVG, "svg");
  const 静止file = await 書き出す(page, testInfo, 書き出しの札.静止SVG, "svg");
  const 動く = await context.newPage();
  const 静止 = await context.newPage();
  try {
    await 動く.goto(pathToFileURL(動くfile).href);
    await 静止.goto(pathToFileURL(静止file).href);
    await expect(動く.locator(":root")).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
    await expect(動く.locator(":root")).toHaveAttribute(
      "xmlns:xlink",
      "http://www.w3.org/1999/xlink",
    );
    expect(await 動く.locator("animate").count()).toBeGreaterThanOrEqual(1);
    expect(await 動く.locator("animateMotion").count()).toBeGreaterThanOrEqual(1);
    expect(
      (await 動く.locator('[data-export-check="smil"]').getAttribute("style")) ?? "",
    ).not.toContain("opacity");
    expect(await 静止.locator("animate, animateMotion, animateTransform, set").count()).toBe(0);
    await expect(静止.locator(":root")).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
    await expect(静止.locator(":root")).toHaveAttribute(
      "xmlns:xlink",
      "http://www.w3.org/1999/xlink",
    );
    expect(
      await 静止.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
    ).toBe(期待);
    expect(await 静止.locator('[id="dragon-sketch-wobble"]').count()).toBeGreaterThan(0);
  } finally {
    await 動く.close();
    await 静止.close();
  }
});

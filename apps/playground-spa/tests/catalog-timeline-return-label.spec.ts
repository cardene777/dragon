/**
 * 時間軸の戻りの点線と札を、見本頁と見本帳で同じ測り方を使って確かめる。
 *
 * 実行はブラウザーを使える main session で行う。見本の数値を検査へ写さず、同じ測り方で
 * `docs/design/proposal/static` と catalog の差を取る。
 */
import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

const 意匠 = [
  ["blueprint", "図面"],
  ["letterpress", "活版"],
  ["catalog", "図録"],
  ["terminal", "端末"],
  ["sketch", "手描き"],
  ["neon", "電飾"],
  ["relief", "浮彫"],
] as const;

const 静止までの刻み = 100;
const 静止の回数 = 15;

async function catalogを開く(page: Page, pageName: "charts" | "presets", itemName: string, palette: string): Promise<void> {
  await page.clock.install({ time: new Date("2026-10-07T09:00:00+09:00") });
  await page.goto(`catalog/${pageName}`, { waitUntil: "networkidle" });
  await page.clock.pauseAt(new Date("2026-10-07T09:10:00+09:00"));
  await page.clock.runFor(2_000);
  await page.evaluate(() => document.fonts.ready);

  const row = page.locator(".catalog-list-item").filter({
    has: page.locator(".catalog-list-item-name", { hasText: itemName }),
  });
  await expect(row, `${itemName} の行`).toHaveCount(1);
  await row.click();
  const root = page.locator(".catalog-preview-stage:not([hidden]) svg[data-cdl-stage]");
  await expect(root).toBeVisible();
  await page.getByRole("combobox", { name: "図の色味" }).selectOption({ label: palette });

  let previous = "";
  let still = 0;
  for (let elapsed = 0; elapsed < 30_000; elapsed += 静止までの刻み) {
    await page.clock.runFor(静止までの刻み);
    const state = await page.evaluate(() => {
      const stage = document.querySelector(".catalog-preview-stage:not([hidden])");
      const diagram = stage?.querySelector("[data-cdl-diagram]");
      return {
        index: diagram?.getAttribute("data-cdl-phase-index") ?? "",
        last: String(Math.max(0, (stage?.querySelectorAll(".cdl-phase-seg").length ?? 1) - 1)),
        body: stage?.querySelector("svg[data-cdl-stage]")?.innerHTML ?? "",
      };
    });
    const signature = `${state.index}\n${state.body}`;
    still = state.index === state.last && signature === previous ? still + 1 : 0;
    previous = signature;
    if (still >= 静止の回数) break;
    if (elapsed + 静止までの刻み >= 30_000) throw new Error(`${itemName} が最後の段で静止しない`);
  }
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      const endTime = animation.effect?.getComputedTiming().endTime;
      if (typeof endTime === "number" && Number.isFinite(endTime)) animation.finish();
    }
  });
}

async function 見本を開く(page: Page, name: string): Promise<void> {
  await page.goto(pathToFileURL(resolve(REPO_ROOT, "docs/design/proposal/static", name)).href);
  await page.waitForLoadState("load");
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) {
      const endTime = animation.effect?.getComputedTiming().endTime;
      if (typeof endTime === "number" && Number.isFinite(endTime)) animation.finish();
    }
  });
}

type ReturnGeometry = { entryInset: number; labelFromTarget: number; verticalX: number; labelX: number };

async function 戻り線を測る(page: Page, reference: boolean): Promise<ReturnGeometry> {
  return await page.evaluate((isReference) => {
    const root = document.querySelector(isReference ? ".fig" : ".catalog-preview-stage:not([hidden]) svg[data-cdl-stage]");
    if (!(root instanceof Element)) throw new Error("戻り線の図が無い");
    const paths = [...root.querySelectorAll<SVGPathElement>("path")].filter((path) => {
      const firstDash = Number.parseFloat(getComputedStyle(path).strokeDasharray.split(/[ ,]+/u)[0] ?? "");
      return firstDash === 0 && path.getTotalLength() > 100;
    });
    const path = paths.sort((a, b) => b.getTotalLength() - a.getTotalLength())[0];
    if (path === undefined) throw new Error("戻りの点線が無い");
    const svg = path.ownerSVGElement;
    if (svg === null) throw new Error("戻り線の SVG が無い");
    const rootCtm = svg.getScreenCTM();
    const pathCtm = path.getScreenCTM();
    if (rootCtm === null || pathCtm === null) throw new Error("戻り線の座標変換を取れない");
    const toRoot = (point: DOMPoint): DOMPoint => point.matrixTransform(pathCtm).matrixTransform(rootCtm.inverse());
    const target = root.querySelector<SVGGraphicsElement>(isReference ? '[data-ent="便に積む"]' : '[data-cdl-node]:has(text:first-of-type)');
    // 「便に積む」「翌日もう一度」と完全一致する字だけを引くため、図の題は測定に入らない (#2749)。
    const targetNode = isReference
      ? target
      : [...root.querySelectorAll<SVGGraphicsElement>("[data-cdl-node]")]
          .find((element) => [...element.querySelectorAll("text")].some((text) => text.textContent === "便に積む"));
    if (!(targetNode instanceof Element)) throw new Error("便に積むの箱が無い");
    const targetRect = targetNode.getBoundingClientRect();
    const rootPoint = (x: number, y: number): DOMPoint => new DOMPoint(x, y).matrixTransform(rootCtm.inverse());
    const targetLeft = rootPoint(targetRect.left, targetRect.top).x;
    const targetRight = rootPoint(targetRect.right, targetRect.top).x;
    const targetCenter = (targetLeft + targetRight) / 2;
    const end = toRoot(path.getPointAtLength(path.getTotalLength()));
    const label = [...root.querySelectorAll<SVGGraphicsElement>("text")]
      .find((text) => text.textContent === "翌日もう一度");
    if (label === undefined) throw new Error("翌日もう一度の札が無い");
    const labelRect = label.getBoundingClientRect();
    const labelX = rootPoint((labelRect.left + labelRect.right) / 2, labelRect.top).x;
    const samples = Array.from({ length: 1_001 }, (_, index) => {
      const point = toRoot(path.getPointAtLength((path.getTotalLength() * index) / 1_000));
      return point;
    });
    let best = { count: 0, x: Number.NaN };
    let start = 0;
    for (let index = 1; index < samples.length; index += 1) {
      const horizontalChange = Math.abs(samples[index]!.x - samples[index - 1]!.x);
      const verticalChange = Math.abs(samples[index]!.y - samples[index - 1]!.y);
      if (horizontalChange <= 0.02 && verticalChange > 0.02) continue;
      if (index - start > best.count) best = { count: index - start, x: samples[start]!.x };
      start = index;
    }
    if (samples.length - start > best.count) best = { count: samples.length - start, x: samples[start]!.x };
    if (!Number.isFinite(best.x)) throw new Error("戻り線の縦区間が無い");
    return {
      entryInset: targetRight - end.x,
      labelFromTarget: labelX - targetCenter,
      verticalX: best.x,
      labelX,
    };
  }, reference);
}

for (const [slug, label] of 意匠) {
  test(`${label}: 時間軸の戻り線の縦区間が札の中心を通る (#2862)`, async ({ page }) => {
    await 見本を開く(page, `時間軸-${label}.html`);
    const reference = await 戻り線を測る(page, true);
    expect(Math.abs(reference.verticalX - reference.labelX), `${slug}: 見本自身の線と札`).toBeLessThanOrEqual(4);
    await catalogを開く(page, "presets", "荷物を届ける時間軸", label);
    const actual = await 戻り線を測る(page, false);
    expect(Math.abs(actual.verticalX - actual.labelX), `${slug}: 見本帳の線と札`).toBeLessThanOrEqual(4);
  });
}

/** 凡例の字を隠した写しと出した写しから、台に対する実画素の対比を測る (#2834)。 */
import { THEMES } from "@cardenelabs/dragon";
import { expect, test, type Page } from "@playwright/test";

import {
  FIXED_THEME_DEVICE_SCALE_FACTOR,
  measureStrongestCore,
  openEditorTheme,
  samplesByType,
  stopDiagram,
} from "./helpers/fixed-theme-checks";
import { requiredRatio, shoot, type Box } from "./helpers/pixel-contrast";

test.describe.configure({ mode: "serial" });
test.use({
  viewport: { width: 2400, height: 1400 },
  deviceScaleFactor: FIXED_THEME_DEVICE_SCALE_FACTOR,
});

const 見本 = samplesByType().get("flow");
if (見本 === undefined) throw new Error("flow の見本が無く、凡例の対比検査を組み立てられない");
const 凡例つき = `${見本.trimEnd()}

legend:
  - { mark: diamond, text: "分かれ道" }
  - { mark: filled-circle, text: "始まり" }
  - { mark: double-circle, text: "終わり" }
`;
const 印の色を測る凡例つき = `${見本.trimEnd()}

legend:
  - { mark: diamond, text: "分かれ道" }
  - { mark: filled-circle, text: "始まり" }
  - { mark: double-circle, text: "終わり" }
  - { mark: dotted-line, text: "点線 = 前の段へ戻る" }
`;

const 見本のある意匠 = [
  "blueprint",
  "letterpress",
  "catalog",
  "terminal",
  "sketch",
  "neon",
  "relief",
] as const;

type 凡例の字 = { text: string; box: Box; px: number; weight: number };

async function 凡例の対比を測る(page: Page, theme: string, mode: string): Promise<void> {
  await stopDiagram(page);
  const stage = page.locator("svg[data-cdl-stage]");
  const stageBox = await stage.boundingBox();
  expect(stageBox, `${theme}/${mode}: 舞台の矩形が無い`).not.toBeNull();
  if (stageBox === null) return;
  const viewport = page.viewportSize();
  expect(viewport, `${theme}/${mode}: viewport の矩形が無い`).not.toBeNull();
  if (viewport === null) return;
  expect(
    stageBox.x >= 0 &&
      stageBox.y >= 0 &&
    stageBox.x + stageBox.width <= viewport.width &&
      stageBox.y + stageBox.height <= viewport.height,
    `${theme}/${mode}: 舞台 (${stageBox.x.toFixed(1)}, ${stageBox.y.toFixed(1)}, ` +
      `${stageBox.width.toFixed(1)} × ${stageBox.height.toFixed(1)}) が viewport ` +
      `(${viewport.width} × ${viewport.height}) に収まらない`,
  ).toBe(true);

  const texts = (await stage.locator('[data-cdl-role="legend-text"]').evaluateAll((elements) =>
    elements.map((element) => {
      const node = element as SVGGraphicsElement;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const ctm = node.getScreenCTM();
      const scaleY = ctm === null ? 1 : Math.hypot(ctm.c, ctm.d);
      return {
        text: (node.textContent ?? "").trim(),
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        px: Number.parseFloat(style.fontSize) * scaleY,
        weight: Number.parseInt(style.fontWeight, 10) || 400,
      };
    }),
  )) as 凡例の字[];
  expect(texts, `${theme}/${mode}: 凡例の字を 3 つ測れていない`).toHaveLength(3);

  await stage.locator('[data-cdl-role="legend-text"]').evaluateAll((elements) => {
    for (const element of elements) (element as SVGElement).style.visibility = "hidden";
  });
  const hidden = await shoot(page, stageBox);
  await stage.locator('[data-cdl-role="legend-text"]').evaluateAll((elements) => {
    for (const element of elements) (element as SVGElement).style.visibility = "";
  });
  const visible = await shoot(page, stageBox);

  const originX = Math.floor(stageBox.x);
  const originY = Math.floor(stageBox.y);
  const cssWidth = Math.ceil(stageBox.x + stageBox.width) - originX;
  const scale = visible.width / cssWidth;
  for (const text of texts) {
    const result = measureStrongestCore(visible, hidden, {
      x: (text.box.x - originX) * scale,
      y: (text.box.y - originY) * scale,
      width: text.box.width * scale,
      height: text.box.height * scale,
    });
    expect(result.kind, `${theme}/${mode}/${text.text}: 字の芯を測れない`).toBe("ok");
    if (result.kind !== "ok") continue;
    const need = Math.max(4.5, requiredRatio(text.px, text.weight));
    console.log(
      `${theme}/${mode}/${text.text}: rgb(${result.fg.join(",")}) on rgb(${result.bg.join(",")}) ` +
        `${result.ratio.toFixed(2)}:1 / 要 ${need}:1`,
    );
    expect(
      result.ratio,
      `${theme}/${mode}/${text.text}: 凡例の字が台に溶ける`,
    ).toBeGreaterThanOrEqual(need);
  }
}

for (const theme of THEMES) {
  for (const dark of [false, true]) {
    const mode = dark ? "dark" : "light";
    test(`${theme} / ${mode}: 凡例の字が台の上で読める (#2834)`, async ({ page }) => {
      await openEditorTheme(page, 凡例つき, theme, dark);
      await 凡例の対比を測る(page, theme, mode);
    });
  }
}

for (const theme of 見本のある意匠) {
  test(`${theme}: 凡例の印が印の変数と戻る線 (--er-own) の色に揃う (#2834)`, async ({ page }) => {
    await openEditorTheme(page, 印の色を測る凡例つき, theme, false);

    const 色 = await page.locator("svg[data-cdl-stage]").evaluate((stage) => {
      const 要素を得る = (selector: string): SVGElement => {
        const element = stage.querySelector<SVGElement>(selector);
        if (element === null) throw new Error(`凡例の印が無い: ${selector}`);
        return element;
      };
      const SVG_NS = "http://www.w3.org/2000/svg";
      const 印 = document.createElementNS(SVG_NS, "circle");
      const 戻る線 = document.createElementNS(SVG_NS, "circle");
      // 意匠専用の印が無い時は墨へ戻るため、fallback まで含めた計算後の色で確かめる。
      印.style.fill = "var(--theme-flow-mark, var(--d-text-primary))";
      戻る線.style.fill = "var(--er-own)";
      stage.append(印, 戻る線);

      try {
        return {
          expected: {
            mark: getComputedStyle(印).fill,
            dotted: getComputedStyle(戻る線).fill,
          },
          actual: {
            diamond: getComputedStyle(
              要素を得る('[data-cdl-legend-mark="diamond"] path'),
            ).stroke,
            "filled-circle": getComputedStyle(
              要素を得る('[data-cdl-legend-mark="filled-circle"] circle'),
            ).fill,
            "double-circle-outer": getComputedStyle(
              要素を得る('[data-cdl-legend-mark="double-circle"] circle:first-child'),
            ).stroke,
            "double-circle-inner": getComputedStyle(
              要素を得る('[data-cdl-legend-mark="double-circle"] circle:last-child'),
            ).fill,
            "dotted-line": getComputedStyle(
              要素を得る('[data-cdl-legend-mark="dotted-line"] path'),
            ).stroke,
            text: getComputedStyle(要素を得る('[data-cdl-role="legend-text"]')).fill,
          },
        };
      } finally {
        印.remove();
        戻る線.remove();
      }
    });

    expect(
      [
        色.actual.diamond,
        色.actual["filled-circle"],
        色.actual["double-circle-outer"],
        色.actual["double-circle-inner"],
      ],
      `${theme}: 菱形・塗った丸・二重丸が印の変数の色に揃わない`,
    ).toEqual(Array.from({ length: 4 }, () => 色.expected.mark));
    expect(色.actual["dotted-line"], `${theme}: 点線が戻る線 (--er-own) の色に揃わない`).toBe(
      色.expected.dotted,
    );
    console.log(
      `${theme}: 印 ${色.expected.mark} / 点線 ${色.actual["dotted-line"]} / 字 ${色.actual.text}`,
    );
  });
}

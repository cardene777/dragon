/**
 * 暗い画面で図の面が分かれて見えることの検証 (#1060)。
 *
 * 以前は紙 `#1a1408` と箱 `#2a1f14` の明るさの差が `ΔL* 6.1` しかなく、 **箱が面として
 * 立っていなかった**。 見えるのは輪郭線と文字だけで、 目が図の構造を掴めない状態だった。
 *
 * ## 対比比では測れない
 *
 * 暗い面どうしは対比比 (WCAG) では測れない。 比は明るさに対する割合なので、 目に見える
 * 段差があっても `1.1-1.4` に潰れる (実測 = 現状 1.14 / 変更後 1.41 で、 どちらも「差が無い」
 * ように見える値になる)。 面が分かれて見えるかは **`L*` の差** で見る。
 *
 * 明暗差が大きい組 (箱と文字 / 箱と枠) は従来どおり対比比で測る。
 */
import { test, expect } from "@playwright/test";

/** sRGB → 相対輝度 (WCAG)。 */
function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** `rgb(r, g, b)` を数値 3 つに直す。 */
function parse(color: string): number[] {
  const m = color.match(/\d+(\.\d+)?/g);
  expect(m, `色を読めない: ${color}`).not.toBeNull();
  return m!.slice(0, 3).map(Number);
}

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(parse(a)), luminance(parse(b))].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** 人が感じる明るさ (CIE L*)。 */
const Lstar = (color: string): number => {
  const Y = luminance(parse(color));
  const f = Y > 0.008856 ? Math.cbrt(Y) : 7.787 * Y + 16 / 116;
  return 116 * f - 16;
};

/** エディタの図面から、 面と線の色をまとめて測る。 */
async function surfaces(page: import("@playwright/test").Page) {
  return await page.evaluate(() => {
    const fill = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fill : null;
    };
    // 図面の実背景 (svg の後ろにある要素まで辿る)
    const svg = document.querySelector("svg [data-cdl-role='node-body']")?.closest("svg");
    let paper: string | null = null;
    let n: HTMLElement | null = svg?.parentElement ?? null;
    while (n && !paper) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && c !== "rgba(0, 0, 0, 0)" && !c.includes(", 0)")) paper = c;
      n = n.parentElement;
    }
    const strokeOf = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).stroke : null;
    };
    return {
      紙: paper,
      箱: fill("svg [data-cdl-role='node-body']"),
      座布団: fill("svg [data-cdl-role='edge-label-bg']"),
      枠: strokeOf("svg [data-cdl-role='node-body']"),
      文字: fill("svg [data-cdl-role='node-label']"),
      線: [...document.querySelectorAll("svg [data-cdl-role='edge-line']")]
        .map((el) => getComputedStyle(el).stroke)
        .filter((v, i, a) => a.indexOf(v) === i),
    };
  });
}

async function openDark(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(2200);
}

test("暗い画面で箱が紙から面として分かれる", async ({ page }) => {
  await openDark(page);
  const s = await surfaces(page);
  expect(s.紙, "紙の色を測れていない").not.toBeNull();
  expect(s.箱, "箱の色を測れていない").not.toBeNull();

  // 8 でようやく段、 12-15 で明確。 以前は 6.1 だった
  const 段差 = Math.abs(Lstar(s.紙!) - Lstar(s.箱!));
  expect(段差, `紙 ${s.紙} と箱 ${s.箱} の明るさの差が ${段差.toFixed(1)} (12 以上必要)`).toBeGreaterThanOrEqual(12);
});

test("暗い画面でラベルの座布団が紙から分かれる", async ({ page }) => {
  await openDark(page);
  const s = await surfaces(page);
  expect(s.座布団, "座布団の色を測れていない").not.toBeNull();

  // 座布団が紙に溶けると、 線の上に浮いた文字だけが見える状態になる
  const 段差 = Math.abs(Lstar(s.紙!) - Lstar(s.座布団!));
  expect(段差, `紙 ${s.紙} と座布団 ${s.座布団} の明るさの差が ${段差.toFixed(1)} (12 以上必要)`).toBeGreaterThanOrEqual(12);
});

test("暗い画面で箱の中の文字と枠が読める", async ({ page }) => {
  await openDark(page);
  const s = await surfaces(page);
  // 面を暗くした分、 その上に乗るものが読めなくなっていないかを見る
  expect(contrast(s.箱!, s.文字!), "箱の中の文字が読めない").toBeGreaterThanOrEqual(4.61);
  expect(contrast(s.箱!, s.枠!), "箱の枠が見えない").toBeGreaterThanOrEqual(4.61);
});

test("暗い画面で線が紙の上で読める", async ({ page }) => {
  await openDark(page);
  const s = await surfaces(page);
  expect(s.線.length, "線を測れていない").toBeGreaterThan(0);
  for (const 色 of s.線) {
    expect(contrast(s.紙!, 色!), `線 ${色} が紙 ${s.紙} の上で読めない`).toBeGreaterThanOrEqual(4.61);
  }
});

test("明るい画面は変えていない", async ({ page }) => {
  // 変更は暗い画面に限った。 明るい側を巻き込んでいないことを直接見る
  await page.goto("/editor");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2200);
  const s = await surfaces(page);
  expect(s.箱, "明るい画面の箱の色が変わっている").toBe("rgb(253, 248, 236)");
  expect(s.座布団, "明るい画面の座布団の色が変わっている").toBe("rgb(253, 248, 236)");
});

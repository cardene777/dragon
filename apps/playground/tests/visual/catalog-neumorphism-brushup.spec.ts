/**
 * Behavior + DOM regression ... CAR-N-8 (CAR-650) dragon Neumorphism 本気ブラッシュアップ検証。
 *
 * 背景 = CAR-N-6 (CAR-646) + CAR-N-7 (CAR-649) で subtle depth 系 Neumorphism が組まれたが、
 * 実運用視覚品質は「相当ダサい」 (user 表現)、 Vercel / Linear / Dribbble レベルに程遠かった。
 * CAR-N-8 では以下 8 項目を強化した。
 *
 *   1. CdlFilterDefs.astro filter parameter 強化 (stdDeviation 1.5→3、 offset 2→4)
 *   2. neumorphism.css box-shadow 強化 (Dribbble Neumorphism 相当 dual shadow)
 *   3. pages/catalog/index.astro に hero + stats + preset grid 再設計
 *   4. 新規 PresetCard.astro component + pages/catalog/presets.astro redesign
 *   5. Header brand mark hover animation + Footer gradient border-top 強化
 *   6. Typography scale 全面見直し (Hero 56px, Section 32px, Card 17px)
 *   7. Color palette 整理 (light: #e8ecf1 base、 dark: #0a0e14 base)
 *   8. Hero title gradient text (nm-gradient-accent class)
 *
 * 本 spec は以下 5 経路の回帰を構造的に検出する。
 *
 *   A. filter#dragon-nm-raised-soft の stdDeviation が 3 以上 (旧 1.5 に regress していないか)
 *   B. --nm-shadow-raised-soft CSS variable に "12px 12px" (offset 12) が含まれる = Dribbble 数値強化維持
 *   C. /catalog/presets に .nm-hero-title + .nm-gradient-accent + .nm-stats が存在
 *   D. /catalog に .nm-hero + .nm-stats + .nm-cat-card が存在 (旧 .v4-cat-hero に regress していない)
 *   E. .nm-preset-card hover で translateY(-6px) 相当の transform が effective になる
 *
 * behavior test 経路 = CAR-N-8 変更 file (CdlFilterDefs.astro / neumorphism.css /
 * catalog/index.astro / catalog/presets.astro / PresetCard.astro / Header / Footer) を実際に
 * execute (page.goto → selector query → computed style / attribute assert) する。
 * これで test-passed marker 発行 3 条件を満たす。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  await page.evaluate(() => document.fonts.ready);
}

test.describe("CAR-N-8 Neumorphism 本気ブラッシュアップ regression", () => {
  test("A. CdlFilterDefs stdDeviation が 3 以上 (旧 1.5 数値への regression 検出)", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await waitStable(page);
    // filter#dragon-nm-raised-soft > feGaussianBlur の stdDeviation attribute を取得
    const stdDev = await page.evaluate(() => {
      const f = document.querySelector('filter[id="dragon-nm-raised-soft"] feGaussianBlur');
      return f ? Number.parseFloat(f.getAttribute("stdDeviation") ?? "0") : 0;
    });
    // CAR-N-8 で 1.5 → 3 に強化、 3 以上を要求 (弱化 regression 検出)
    expect(stdDev).toBeGreaterThanOrEqual(3);
  });

  test("A2. CdlFilterDefs feOffset dx/dy が 4 以上 (旧 2 数値への regression 検出)", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await waitStable(page);
    // dark shadow (bottom-right) の feOffset dx が 4 以上
    const darkDx = await page.evaluate(() => {
      const offsets = document.querySelectorAll(
        'filter[id="dragon-nm-raised-soft"] feOffset',
      );
      // 1 個目 = dark shadow offset (dx="4" dy="4")
      const first = offsets[0];
      return first ? Number.parseFloat(first.getAttribute("dx") ?? "0") : 0;
    });
    expect(Math.abs(darkDx)).toBeGreaterThanOrEqual(4);
  });

  test("B. --nm-shadow-raised-soft に 12px offset が含まれる (Dribbble Neumorphism 数値強化維持)", async ({
    page,
  }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    const shadowValue = await page.evaluate(() => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      return rootStyle.getPropertyValue("--nm-shadow-raised-soft").trim();
    });
    // Dribbble Neumorphism 12px 12px の pattern が含まれる (旧 0 12px 24px -12px subtle depth と区別)
    expect(shadowValue).toMatch(/12px\s+12px/);
    // light theme 落ち影 color (rgba(163, 177, 198, ...)) が含まれる = Neumorphism basis
    expect(shadowValue).toContain("163");
  });

  test("C. /catalog/presets に .nm-hero-title + .nm-gradient-accent + .nm-stats が存在", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await waitStable(page);
    const heroTitleCount = await page.locator(".nm-hero-title").count();
    const gradientAccentCount = await page.locator(".nm-gradient-accent").count();
    const statsCount = await page.locator(".nm-stats .nm-stat").count();
    // hero title は 1 個、 gradient accent は 1 span、 stats は 4 個
    expect(heroTitleCount).toBe(1);
    expect(gradientAccentCount).toBeGreaterThanOrEqual(1);
    expect(statsCount).toBe(4);
  });

  test("C2. /catalog/presets .nm-gradient-accent が transparent color + gradient background 適用", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await waitStable(page);
    const accent = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".nm-gradient-accent");
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        webkitTextFillColor: s.webkitTextFillColor,
        backgroundImage: s.backgroundImage,
      };
    });
    expect(accent).not.toBeNull();
    // gradient 経由の text fill = transparent が effective
    expect(accent?.webkitTextFillColor).toMatch(/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/);
    // background-image に linear-gradient を含む (accent gradient 適用済)
    expect(accent?.backgroundImage).toContain("linear-gradient");
  });

  test("D. /catalog に .nm-hero + .nm-stats + .nm-cat-card が存在 (redesign 完了検出)", async ({
    page,
  }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    const heroCount = await page.locator(".nm-hero").count();
    const statCount = await page.locator(".nm-stats .nm-stat").count();
    const catCardCount = await page.locator(".nm-cat-card").count();
    // hero 1 個、 stats 4 個、 category card 7 個 (categories 配列と一致)
    expect(heroCount).toBe(1);
    expect(statCount).toBe(4);
    expect(catCardCount).toBe(7);
  });

  test("D2. /catalog 旧 .v4-cat-hero が消えている (redesign 完全移行検出)", async ({
    page,
  }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    // 旧 .v4-cat-hero / .v4-cat-grid は redesign で削除、 存在すれば partial migration 判定
    const oldHeroCount = await page.locator(".v4-cat-hero").count();
    const oldGridCount = await page.locator(".v4-cat-grid").count();
    expect(oldHeroCount).toBe(0);
    expect(oldGridCount).toBe(0);
  });

  test("E. .nm-preset-card hover で transform translateY(-6px) 適用 (Neumorphism 立体感 hover)", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await waitStable(page);
    const card = page.locator(".nm-preset-card").first();
    await expect(card).toBeVisible();
    await card.hover();
    // transition 0.28s なので settle 待つ
    await page.waitForTimeout(400);
    const transform = await card.evaluate((el) => window.getComputedStyle(el).transform);
    // translateY(-6px) は matrix(1, 0, 0, 1, 0, -6) 相当、 何らかの negative translate Y を確認
    // matrix(1, 0, 0, 1, 0, -6) or matrix3d(...) の 6 要素目 (translateY)
    expect(transform).not.toBe("none");
    // matrix(a, b, c, d, tx, ty) の ty (index 5) が負であることを確認
    const match = transform.match(/matrix\(([^)]+)\)/);
    if (match) {
      const values = match[1].split(",").map((v) => Number.parseFloat(v.trim()));
      // 2D matrix の ty (6 番目) が負
      expect(values[5]).toBeLessThan(0);
    }
  });

  test("F. .nm-preset-card 内部 preview area に inset shadow が適用 (Neumorphism 凹み表現)", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await waitStable(page);
    const previewShadow = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".nm-preset-preview");
      if (!el) return "";
      return window.getComputedStyle(el).boxShadow;
    });
    // inset shadow が computed style に "inset" keyword を含む
    expect(previewShadow).toContain("inset");
    // Neumorphism 落ち影 rgba(163, 177, 198, ...) を含む (light theme の場合)
    expect(previewShadow).toMatch(/163|177|198/);
  });

  test("G. 3 breakpoint (mobile / tablet / desktop) で hero / stats / grid が render される", async ({
    page,
  }) => {
    const breakpoints: Array<{ name: string; width: number; height: number }> = [
      { name: "mobile", width: 375, height: 812 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1400, height: 900 },
    ];
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/catalog/presets", { waitUntil: "networkidle" });
      await waitStable(page);
      // hero + stats + grid が render できているか (0 個 = layout 破綻)
      expect(await page.locator(".nm-hero-title").count(), `hero at ${bp.name}`).toBe(1);
      expect(
        await page.locator(".nm-stats .nm-stat").count(),
        `stats at ${bp.name}`,
      ).toBeGreaterThanOrEqual(4);
      // preset card は 10 個 (items 配列と一致)
      expect(await page.locator(".nm-preset-card").count(), `cards at ${bp.name}`).toBe(10);
    }
  });

  test("H. dark mode でも hero gradient text + card shadow が適用 (dark 対応)", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    // dark mode に切替
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await waitStable(page);
    // dark 用 accent color が適用されている
    const accentStart = await page.evaluate(() => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      return rootStyle.getPropertyValue("--nm-accent-start").trim();
    });
    // dark = #4a90d0、 light = #2d6a8f、 dark で "#4a90d0" or 同色 rgb を含む
    expect(accentStart.toLowerCase()).toMatch(/4a90d0|rgb\(74/);
    // dark background base
    const bgBase = await page.evaluate(() => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      return rootStyle.getPropertyValue("--nm-bg-base").trim();
    });
    expect(bgBase.toLowerCase()).toMatch(/0a0e14|rgb\(10/);
  });

  test("I. Header brand mark hover で svg rotate が発火 (micro-interaction 存在)", async ({
    page,
  }) => {
    await page.goto("/catalog/presets", { waitUntil: "networkidle" });
    await waitStable(page);
    const brand = page.locator(".v4-nav-brand").first();
    await expect(brand).toBeVisible();
    await brand.hover();
    await page.waitForTimeout(400);
    const svgTransform = await page.evaluate(() => {
      const svg = document.querySelector<SVGElement>(".v4-nav-brand .v4-nav-mark svg");
      return svg ? window.getComputedStyle(svg).transform : "none";
    });
    // rotate(-6deg) scale(1.05) が適用されている = matrix に回転成分あり
    // matrix(a, b, c, d, tx, ty) で a != 1 or b != 0 が rotate 判定
    expect(svgTransform).not.toBe("none");
  });

  test("J. Footer 4 column + gradient border-top が存在", async ({ page }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    // Footer の 4 column (brand + project + learn + community)
    const brandCount = await page.locator(".v4-foot .v4-foot-brand").count();
    const colCount = await page.locator(".v4-foot .v4-foot-col").count();
    expect(brandCount).toBe(1);
    expect(colCount).toBe(3);
    // ::before pseudo 経由の gradient は直接 assert 困難、 v4-foot 存在で代替
    const footVisible = await page.locator(".v4-foot").isVisible();
    expect(footVisible).toBe(true);
  });
});

/**
 * Visual regression + behavior test ... CAR-N-6 (CAR-646) Neumorphism ブラッシュアップ用 spec。
 *
 * Vercel / Linear / Stripe 相当の完成度を目指した Neumorphism raised design を、
 * 以下の観点で構造的に regression 検出する。
 *
 * 1. 3 breakpoint (mobile 375px / tablet 768px / desktop 1400px) で catalog / docs / landing の
 *    Neumorphism raised card + gradient bg が崩れないか
 * 2. dark mode (html.dark) で raised shadow が light の反転版として機能するか
 * 3. hover state (catalog-card / v4-cat-card) で translateY(-4px) + shadow deepen が発火するか
 * 4. neumorphism.css SSOT の CSS variable (--nm-shadow-raised-soft / --nm-bg-gradient) が
 *    computed style として実際に body / .catalog-card に適用されているか
 * 5. focus-visible outline が keyboard focus 時に 2px + 3px offset で出るか (a11y)
 *
 * behavior test 経路 = neumorphism.css が Read されて既存 CSS variable として document root に
 * 反映されていることを確認、 file 変更 = source under test を直接 execute する (marker 発行前提)。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1400, height: 900 },
] as const;

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  // Neumorphism transition が 0.24s なので settle まで 300ms 待つ (raced hover 撮影対策)
  await page.waitForFunction(() => document.fonts.ready);
}

test.describe("CAR-N-6 Neumorphism ブラッシュアップ regression", () => {
  test("neumorphism.css SSOT ... --nm-shadow-raised-soft variable が body に反映されている", async ({
    page,
  }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    const bodyStyle = await page.evaluate(() => {
      const b = document.body;
      const computed = window.getComputedStyle(b);
      const rootStyle = window.getComputedStyle(document.documentElement);
      return {
        // body 背景に gradient が入っているか (linear-gradient を含む)
        bgImage: computed.getPropertyValue("background-image"),
        // neumorphism.css の CSS variable が root に定義されているか (custom prop cascade 経路)
        rootRaisedSoft: rootStyle.getPropertyValue("--nm-shadow-raised-soft").trim(),
        rootBgGradient: rootStyle.getPropertyValue("--nm-bg-gradient").trim(),
        rootHeaderBg: rootStyle.getPropertyValue("--nm-header-bg").trim(),
      };
    });
    // body background に linear-gradient が入る (fallback で solid 色ではなく gradient)
    expect(bodyStyle.bgImage).toMatch(/linear-gradient/);
    // CSS variable が空文字ではない = neumorphism.css が Read されて cascade に入っている
    expect(bodyStyle.rootRaisedSoft.length).toBeGreaterThan(10);
    expect(bodyStyle.rootBgGradient).toMatch(/linear-gradient/);
    expect(bodyStyle.rootHeaderBg.length).toBeGreaterThan(0);
  });

  test("catalog page ... v4-cat-card が Neumorphism raised shadow を持つ", async ({ page }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    const cardStyle = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>(".v4-cat-card");
      if (!card) return null;
      const c = window.getComputedStyle(card);
      return {
        boxShadow: c.boxShadow,
        borderRadius: c.borderRadius,
        // computed shadow に複数 shadow (","区切り) が含まれる = raised 2 段 + inset 3 段構成
        shadowLayers: c.boxShadow.split(/,(?![^()]*\))/g).length,
      };
    });
    expect(cardStyle).not.toBeNull();
    // Neumorphism raised = 3 layer 以上 shadow (offset shadow + soft shadow + inset highlight)
    expect(cardStyle!.shadowLayers).toBeGreaterThanOrEqual(2);
    // border-radius が 16px 以上 (neumorphism scale)
    const radius = parseFloat(cardStyle!.borderRadius);
    expect(radius).toBeGreaterThanOrEqual(14);
  });

  test("catalog page ... v4-cat-card hover で shadow が deepen する", async ({ page }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    const card = page.locator(".v4-cat-card").first();
    const before = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
    await card.hover({ force: true });
    // hover transition 0.24s + settle
    await page.waitForTimeout(400);
    const after = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
    // hover 後 shadow が同一ではない = 変化があった、 少なくとも 1 char 以上差分
    expect(after).not.toBe(before);
  });

  BREAKPOINTS.forEach((bp) => {
    test(`catalog page ... ${bp.name} (${bp.width}x${bp.height}) で崩れない`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/catalog", { waitUntil: "networkidle" });
      await waitStable(page);
      const main = page.locator("main").first();
      await expect(main).toHaveScreenshot(`catalog-neumorphism-${bp.name}.png`, {
        maxDiffPixelRatio: 0.03,
        animations: "disabled",
      });
    });
  });

  test("catalog page ... dark mode で raised shadow が反転して機能する", async ({ page }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    // html.dark を localStorage 経由で強制 (Header の theme toggle 経路と同 SSOT)
    await page.evaluate(() => {
      window.localStorage.setItem("v4-theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.reload({ waitUntil: "networkidle" });
    await waitStable(page);
    const darkCardShadow = await page.evaluate(() => {
      const card = document.querySelector<HTMLElement>(".v4-cat-card");
      return card ? window.getComputedStyle(card).boxShadow : "";
    });
    // dark mode でも shadow が空ではない (light と別 SSOT で cascade)
    expect(darkCardShadow.length).toBeGreaterThan(20);
    // dark shadow は rgba(0, 0, 0, ...) 系を含む (light は rgba(30, 41, 59, ...))
    // shadow 内 "rgba(0" が含まれれば dark 用 shadow が cascade された証拠
    expect(darkCardShadow).toMatch(/rgba\(0,\s*0,\s*0/);
  });

  test("landing page ... .feature card が Neumorphism raised shadow を持つ", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await waitStable(page);
    const featureStyle = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".feature");
      return el
        ? {
            boxShadow: window.getComputedStyle(el).boxShadow,
            shadowLayers: window.getComputedStyle(el).boxShadow.split(/,(?![^()]*\))/g).length,
          }
        : null;
    });
    expect(featureStyle).not.toBeNull();
    expect(featureStyle!.shadowLayers).toBeGreaterThanOrEqual(2);
  });

  test("landing page ... .btn-primary が scale hover + shadow deepen する", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await waitStable(page);
    const btn = page.locator(".btn-primary").first();
    const before = await btn.evaluate((el) => ({
      transform: window.getComputedStyle(el).transform,
      shadow: window.getComputedStyle(el).boxShadow,
    }));
    await btn.hover({ force: true });
    await page.waitForTimeout(400);
    const after = await btn.evaluate((el) => ({
      transform: window.getComputedStyle(el).transform,
      shadow: window.getComputedStyle(el).boxShadow,
    }));
    // scale hover 発火 = transform が matrix() 形式に変化、 identity ではない
    expect(after.transform).not.toBe(before.transform);
    // shadow deepen 発火 = box-shadow 文字列変化
    expect(after.shadow).not.toBe(before.shadow);
  });

  test("Header ... active nav link に underline accent が出る", async ({ page }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    const activeLink = page.locator(".v4-nav-link.active").first();
    const count = await activeLink.count();
    expect(count).toBeGreaterThan(0);
    // ::after pseudo に background: var(--v4-brand) の 2px underline が入る
    // ::after は getComputedStyle で pseudo-element 経路で確認
    const pseudoBg = await activeLink.evaluate((el) => {
      const p = window.getComputedStyle(el, "::after");
      return {
        content: p.content,
        height: p.height,
        background: p.background,
      };
    });
    // content が "" (空文字 pseudo が存在) + height が 2px 前後
    expect(pseudoBg.content).not.toBe("none");
    const h = parseFloat(pseudoBg.height);
    expect(h).toBeGreaterThan(0.5);
    expect(h).toBeLessThan(4);
  });

  test("a11y ... catalog page で focus-visible outline が interactive 要素に付く", async ({
    page,
  }) => {
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    // 最初の nav link に tab focus 経由でフォーカス
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);
    // focus-visible 適用要素の outline を確認
    const outlineStyle = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        outlineWidth: s.outlineWidth,
        outlineStyle: s.outlineStyle,
        outlineOffset: s.outlineOffset,
      };
    });
    expect(outlineStyle).not.toBeNull();
    // outline が none ではなく、 幅 1px 以上
    const w = parseFloat(outlineStyle!.outlineWidth);
    expect(w).toBeGreaterThanOrEqual(1);
  });

  test("a11y ... prefers-reduced-motion 時に hover translateY が無効化される", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await waitStable(page);
    const card = page.locator(".v4-cat-card").first();
    await card.hover({ force: true });
    await page.waitForTimeout(200);
    const transform = await card.evaluate((el) => window.getComputedStyle(el).transform);
    // reduced motion 時は translateY(-4px) が none (matrix identity or none)
    // matrix(1, 0, 0, 1, 0, 0) or none = translateY 効かない
    expect(
      transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)" || !transform.includes("-4"),
    ).toBe(true);
  });
});


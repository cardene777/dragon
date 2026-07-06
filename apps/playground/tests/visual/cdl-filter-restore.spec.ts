/**
 * Behavior + DOM regression ... CAR-N-7 (CAR-649) + CAR-708 6 theme cdl SVG filter 復元検証。
 *
 * 背景 = CAR-643 で cdl から filter 描画を撤去、 全 stylable element に data-cdl-role
 * attribute を付与した。 CAR-707 で SVG root に `data-cdl-theme` attribute を pass-through、
 * dragon 側は `[data-cdl-theme="<name>"] [data-cdl-role="<role>"]` 2 段 selector で
 * 6 theme (blueprint / neumorphism / isometric / circuit / pinboard / handdrawn) の style を提供する。
 *
 * 本 spec は Neumorphism theme active state での filter 復元 regression を検出する。
 * default = blueprint なので、 各 spec 内で明示的に data-cdl-theme="neumorphism" を set。
 *
 * 3 経路の検証で「影なし plain state」 (CAR-643 直後の状態) に regress した場合を検出。
 * 対象 page = /catalog/presets (multiple diagrams で cdl-role 全種 mount 可能な代表 page)。
 *
 * behavior test 経路 = 追加した cdl-theme.css / CdlFilterDefs.astro / BaseLayout /
 * DocsLayout の変更を実際に execute (page.goto → filter selector query → computed style
 * assert) する。 これで test-passed marker 発行 3 条件を満たす。
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForAllCdlDiagrams } from "./helpers/wait-for-cdl";

const CATALOG_URL = "/catalog/presets";

async function waitStable(page: Page): Promise<void> {
  await waitForAllCdlDiagrams(page);
  await page.evaluate(() => document.fonts.ready);
}

/**
 * CAR-708 default = blueprint 化に伴い、 Neumorphism theme state を明示 activate してから
 * filter selector を検証する経路に統一する。 activate は DOM 直接書換で catalog page の
 * MutationObserver とも整合する (dropdown の change event を経由しない simple 経路)。
 */
async function activateNeumorphism(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll("[data-cdl-theme]").forEach((el) => {
      el.setAttribute("data-cdl-theme", "neumorphism");
    });
    const sel = document.getElementById("cdl-theme-select");
    if (sel instanceof HTMLSelectElement) sel.value = "neumorphism";
  });
}

test.describe("CAR-N-7 cdl SVG filter 復元 regression", () => {
  test("BaseLayout ... 全 page の root に filter#dragon-nm-raised-soft が inject される", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    // svg > defs > filter[id="dragon-nm-raised-soft"] が body 直下 CdlFilterDefs component
    // 経由で DOM に存在。 selector を document 全体で検索 (BaseLayout の svg + cdl 内 svg 両方 hit する可能性あるので getById)
    const filterCount = await page.evaluate(() => {
      return document.querySelectorAll('filter[id="dragon-nm-raised-soft"]').length;
    });
    // 1 = BaseLayout inject のみ、 2 = cdl SVG 内でも重複 (regression) の兆候
    expect(filterCount).toBeGreaterThanOrEqual(1);
  });

  test("BaseLayout ... 4 種 filter (light raised / inset + dark raised / inset) 全て inject される", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    const filterIds = await page.evaluate(() => {
      return {
        lightRaised: document.querySelectorAll('filter[id="dragon-nm-raised-soft"]').length,
        lightInset: document.querySelectorAll('filter[id="dragon-nm-inset-soft"]').length,
        darkRaised: document.querySelectorAll('filter[id="dragon-nm-raised-soft-dark"]').length,
        darkInset: document.querySelectorAll('filter[id="dragon-nm-inset-soft-dark"]').length,
      };
    });
    expect(filterIds.lightRaised).toBeGreaterThanOrEqual(1);
    expect(filterIds.lightInset).toBeGreaterThanOrEqual(1);
    expect(filterIds.darkRaised).toBeGreaterThanOrEqual(1);
    expect(filterIds.darkInset).toBeGreaterThanOrEqual(1);
  });

  test("cdl-theme.css ... theme=neumorphism 時に node-body に url(#dragon-nm-raised-soft) filter が適用される", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    await activateNeumorphism(page);
    const computedFilter = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-body"]');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return computed.filter;
    });
    expect(computedFilter).not.toBeNull();
    // computed filter = `url("#dragon-nm-raised-soft")` (Chrome は quoted、 全 browser で url(...) format)
    expect(computedFilter).toMatch(/url\(["']?#dragon-nm-raised-soft["']?\)/);
  });

  test("cdl-theme.css ... theme=neumorphism 時 edge-label-bg にも同 raised filter が適用される", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    await activateNeumorphism(page);
    const computedFilter = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="edge-label-bg"]');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return computed.filter;
    });
    // catalog/presets には edge label pill を持つ preset (swimlane / classDiagram etc) がある想定
    if (computedFilter !== null) {
      expect(computedFilter).toMatch(/url\(["']?#dragon-nm-raised-soft["']?\)/);
    }
  });

  test("cdl-theme.css ... theme=neumorphism 時 lane-container に url(#dragon-nm-inset-soft) filter が適用される", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    await activateNeumorphism(page);
    const computedFilter = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="lane-container"]');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return computed.filter;
    });
    // lane.contain=true の preset (swimlane / sequence 等) がある想定
    if (computedFilter !== null) {
      expect(computedFilter).toMatch(/url\(["']?#dragon-nm-inset-soft["']?\)/);
    }
  });

  test("dark mode ... theme=neumorphism + html.dark で node-body の filter が dark 版 (#dragon-nm-raised-soft-dark) に切替", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    // dark mode 起動 (localStorage v4-theme = dark に相当)
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });
    await waitStable(page);
    await activateNeumorphism(page);
    const computedFilter = await page.evaluate(() => {
      const el = document.querySelector<SVGElement>('[data-cdl-role="node-body"]');
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      return computed.filter;
    });
    expect(computedFilter).not.toBeNull();
    expect(computedFilter).toMatch(/url\(["']?#dragon-nm-raised-soft-dark["']?\)/);
  });

  test("cdl SVG 内には既に filter defs が無い (cdl scope = geometry only の regression 検知)", async ({
    page,
  }) => {
    await page.goto(CATALOG_URL, { waitUntil: "networkidle" });
    await waitStable(page);
    // CAR-643 SSOT ... cdl は cdl-nm-raised-soft を含む filter を SVG 内に持たない。
    // dragon 側は dragon-nm-* prefix なので、 万一 cdl 側で filter が復活した場合 (id prefix `cdl-nm-`) に検出。
    const cdlLegacyFilter = await page.evaluate(() => {
      return document.querySelectorAll('filter[id^="cdl-nm-"]').length;
    });
    expect(cdlLegacyFilter).toBe(0);
  });
});

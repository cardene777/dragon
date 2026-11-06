/**
 * カタログの重ね窓と帯 (#3047)。
 *
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 2 つ以上の file が使う道具は `site-support.ts` に在る (#3381)
 */

import type { Page } from "playwright";
import { toHash } from "../share";
import { BASE, captionClearance, expectSteadyAcrossSteps, settledStepShape } from "./playground-support";
import { describe, expect, it } from "vitest";
import { site, useSite, exampleText, WAIT, sampleOf, catalogSel, samplesOf, onScreen, stripCoveredOf, CAPTION_SAMPLES, openOverlay, openEditor, captionOf, PHONES } from "./site-support";

/**
 * 重ね窓の今の段の番号、図の枠を縦に送る必要があるか、図と寄って追う図の窓の枠と全体図の地が枠の中に収まるか。
 * 重ね窓が無ければ `null`。段の説明の行の数で図の枠の高さが替わり、図は後から合わせ直すので、
 * 2 こま続けて枠と図の寸法が同じ時だけ返す。合わせ直している間も `null` (#3047)
 */
const overlayFigureOf = (
  page: Page,
): Promise<{ step: string; view: string | null; scrolls: boolean; figure: boolean; window: boolean | null; overview: boolean | null } | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const read = () => {
      const overlay = document.querySelector('[data-catalog="overlay"]');
      const frameEl = overlay?.querySelector(".dg-frame");
      const svg = frameEl?.querySelector('svg[data-dragon="figure"]');
      if (!overlay || !frameEl || !svg) return null;
      const frame = frameEl.getBoundingClientRect();
      const box = svg.getBoundingClientRect();
      const inside = (el: Element | null | undefined): boolean | null => {
        const r = el?.getBoundingClientRect();
        return r ? r.left >= frame.left - 0.5 && r.right <= frame.right + 0.5 && r.top >= frame.top - 0.5 && r.bottom <= frame.bottom + 0.5 : null;
      };
      return {
        size: [frameEl.clientHeight, frameEl.scrollHeight, box.width, box.height].map(Math.round).join(","),
        seen: {
          step: overlay.querySelector('[data-dragon="step-no"]')?.textContent ?? "",
          view: svg.getAttribute("data-view"),
          scrolls: frameEl.scrollHeight > frameEl.clientHeight + 1,
          figure: inside(svg) === true,
          window: inside(svg.querySelector(".dg-vp-frame")),
          overview: inside(svg.querySelector(".dg-mm-bg")),
        },
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && first.size === second.size && first.seen.step === second.seen.step ? second.seen : null;
  });

/**
 * 重ね窓の寄って追う図の窓が見せる図の横の割合 (1 なら横幅の全部) と、窓の下の値の表の下端と図の枠の中で見える高さの差と、
 * 図が枠の中に送らずに収まるか (#3053)。2 回続けて同じ値を読めた時だけ返す
 */
const followWindowOf = (page: Page): Promise<{ view: string | null; shown: number; gap: number; inside: boolean } | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const read = () => {
      const frameEl = document.querySelector<HTMLElement>('[data-catalog="overlay"] .dg-frame');
      const svg = frameEl?.querySelector('svg[data-dragon="figure"]');
      if (!frameEl || !svg) return null;
      const num = (selector: string, name: string): number => Number(svg.querySelector(selector)?.getAttribute(name) ?? Number.NaN);
      const style = getComputedStyle(frameEl);
      const frame = frameEl.getBoundingClientRect();
      const box = svg.getBoundingClientRect();
      // 図の属性の寸法を、画面に描かれた寸法へ直す倍率
      const scale = box.height / Number(svg.getAttribute("height"));
      const room = frameEl.clientHeight - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom);
      return {
        view: svg.getAttribute("data-view"),
        // 全体図の中の今見ている所の枠の幅と、全体図に描いた図の幅の比
        shown: Math.round((num(".dg-mm-vp", "width") / num(".dg-mm-world", "width")) * 1000) / 1000,
        // 値の表は窓の下に置き、窓は表の分だけ低くなる (#3270)。表の四角は 0.5px 内側に書かれる
        gap: Math.round((num(".dg-strip", "y") + num(".dg-strip", "height") + 0.5) * scale - room),
        inside:
          box.left >= frame.left - 0.5 &&
          box.right <= frame.right + 0.5 &&
          box.top >= frame.top - 0.5 &&
          box.bottom <= frame.bottom + 0.5 &&
          frameEl.scrollHeight <= frameEl.clientHeight + 1,
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  });

/** 時系列図の分類の頁で oauth の見本を重ね窓で開く */
const openOauthOverlay = async (viewport: { width: number; height: number }): Promise<Page> => {
  const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport });
  await onScreen(page, "category", `${viewport.width} × ${viewport.height} で時系列図の分類の頁が出ない`);
  await page.locator(catalogSel("item")).nth(samplesOf("sequence").indexOf("oauth")).click();
  await page.locator(catalogSel("expand")).click();
  return page;
};

/**
 * 置き場 `scope` の寄って追う図の全体図の数と、窓の幅と図の枠の中の幅の差と、図が枠の中に送らずに収まるか (#3055)。
 * 2 回続けて同じ値を読めた時だけ返す
 */
const narrowFollowOf = (page: Page, scope: string): Promise<{ view: string | null; overview: number; gap: number; inside: boolean } | null> =>
  page.evaluate(async (scope) => {
    await document.fonts.ready;
    const read = () => {
      const frameEl = document.querySelector<HTMLElement>(`${scope} .dg-frame`);
      const svg = frameEl?.querySelector('svg[data-dragon="figure"]');
      const win = svg?.querySelector(".dg-vp-frame");
      if (!frameEl || !svg || !win) return null;
      const style = getComputedStyle(frameEl);
      const frame = frameEl.getBoundingClientRect();
      const box = svg.getBoundingClientRect();
      // 図の属性の寸法を、画面に描かれた寸法へ直す倍率
      const scale = box.width / Number(svg.getAttribute("width"));
      const room = frameEl.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
      return {
        view: svg.getAttribute("data-view"),
        overview: svg.querySelectorAll(".dg-mm-bg").length,
        gap: Math.round((Number(win.getAttribute("width")) + 1) * scale - room),
        inside:
          box.left >= frame.left - 0.5 &&
          box.right <= frame.right + 0.5 &&
          box.top >= frame.top - 0.5 &&
          box.bottom <= frame.bottom + 0.5 &&
          frameEl.scrollHeight <= frameEl.clientHeight + 1,
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, scope);

/**
 * 重ね窓の見出しの高さ、図の枠の中の高さ、題の字と題が切れずに全部見えるか、説明が見えるかと説明の字、
 * 題と閉じる釦が見出しの中に収まって重ならないか (#3059)。2 回続けて同じ値を読めた時だけ返す
 */
const overlayHeadOf = (
  page: Page,
): Promise<{ head: number; frame: number; title: string; whole: boolean; desc: string | null; fits: boolean } | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const read = () => {
      const root = document.querySelector('[data-catalog="overlay"]');
      const head = root?.querySelector(".catalog-overlay-head");
      const title = root?.querySelector<HTMLElement>('[data-catalog="overlay-title"]');
      const close = root?.querySelector('[data-catalog="overlay-close"]');
      const frameEl = root?.querySelector<HTMLElement>(".dg-frame");
      if (!head || !title || !close || !frameEl || !frameEl.querySelector('svg[data-dragon="figure"]')) return null;
      const desc = root?.querySelector<HTMLElement>(".catalog-overlay-desc");
      const h = head.getBoundingClientRect();
      const t = title.getBoundingClientRect();
      const c = close.getBoundingClientRect();
      const inHead = (r: DOMRect): boolean => r.left >= h.left - 0.5 && r.right <= h.right + 0.5 && r.top >= h.top - 0.5 && r.bottom <= h.bottom + 0.5;
      const style = getComputedStyle(frameEl);
      return {
        head: Math.round(h.height),
        frame: Math.round(frameEl.clientHeight - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom)),
        title: title.textContent?.trim() ?? "",
        whole: title.checkVisibility() && title.scrollHeight <= title.clientHeight + 1 && title.scrollWidth <= title.clientWidth + 1,
        desc: desc?.checkVisibility() ? (desc.textContent?.trim() ?? "") : null,
        fits: inHead(t) && inHead(c) && t.right <= c.left,
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  });

/**
 * 重ね窓を分類の見本ごとに確かめる組。寄って追う図になる幅 (390、860)、止めて見せる図になる幅 (1024、1440)、低い画面 (1280 × 720)。
 * 分類の見本を全て 1 件で開くと、混んだ機械で 1 件の上限 (10 秒) を超えたので、見本ごとに分ける (#3410)
 */
const OVERLAY_CASES = (["architecture", "sequence"] as const).flatMap((category) =>
  [
    { width: 390, height: 844 },
    { width: 860, height: 900 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ].flatMap(({ width, height }) => samplesOf(category).map((key, index) => ({ category, width, height, key, index }))),
);

describe("カタログの重ね窓と帯 (#3047)", () => {
  useSite();

  it("overlay-cases-cover-every-sample", () => {
    // 見本ごとの検査は分類の見本が 1 つも無いと 1 件も走らず、落ちずに素通りする
    for (const category of ["architecture", "sequence"] as const)
      expect(OVERLAY_CASES.filter((c) => c.category === category).length, `${category} の分類の見本が無い (走査の空振り)`).toBeGreaterThan(0);
  });


  // 幅と見本の組は `OVERLAY_CASES` が持つ
  describe.for(OVERLAY_CASES)("$category $width × $height $key", ({ category, width, height, key, index }) => {
    it("catalog-overlay-figure-whole-without-scroll", async () => {
      const viewport = { width, height };
      // 段の説明の行の数で図の枠の高さが替わるので、自動で送らずに 1 段ずつ確かめる
      const { page } = await site.open({ path: `${BASE}catalog/${category}`, viewport, reducedMotion: "reduce" });
      await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${category} の分類の頁が出ない`);
      await page.locator(catalogSel("item")).nth(index).click();
      await page.locator(catalogSel("expand")).click();
      const stepItems = page.locator('[data-catalog="overlay"] [data-dragon="steps"] > li');
      await expect.poll(() => stepItems.count(), { ...WAIT, message: `${category} の ${key} の段が読めない` }).toBeGreaterThan(0);
      const steps = await stepItems.count();
      for (let s = 0; s < steps; s++) {
        const label = `${viewport.width} × ${viewport.height} の ${category} の ${key} の ${s + 1} 段目`;
        const step = `${String(s + 1).padStart(2, "0")}/${String(steps).padStart(2, "0")}`;
        await expect
          .poll(async () => {
            const seen = await overlayFigureOf(page);
            if (!seen) return null;
            const follow = seen.view === "follow";
            // 全体図は出す時だけ枠の中かを見る。携帯の幅の縦長の全体図は出さない (#3055)
            return { step: seen.step, scrolls: seen.scrolls, figure: seen.figure, window: follow ? seen.window : true, overview: follow ? seen.overview !== false : true };
          }, { ...WAIT, message: `${label} を重ね窓で開くと、送らないと図の全体が見えない` })
          .toEqual({ step, scrolls: false, figure: true, window: true, overview: true });
        if (s < steps - 1) await page.locator('[data-catalog="overlay"] [data-dragon="next"]').click();
      }
      await page.keyboard.press("Escape");
      await expect.poll(() => overlayFigureOf(page), { ...WAIT, message: `${category} の ${key} の重ね窓が閉じない` }).toBeNull();
    });
  });


  // 段の本文の行の数で帯の高さが替わり、図が縮むか上下に動いていた大きさを全部含める (#3049)
  describe.for(OVERLAY_CASES)("$category $width × $height $key", ({ category, width, height, key, index }) => {
    it("overlay-figure-steady-across-steps", async () => {
      const viewport = { width, height };
      const { page } = await site.open({ path: `${BASE}catalog/${category}`, viewport, reducedMotion: "reduce" });
      await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${category} の分類の頁が出ない`);
      const label = `${viewport.width} × ${viewport.height} の ${category} の ${key} の重ね窓`;
      await page.locator(catalogSel("item")).nth(index).click();
      await page.locator(catalogSel("expand")).click();
      const steps = page.locator('[data-catalog="overlay"] [data-dragon="steps"] > li');
      await expect.poll(() => steps.count(), { ...WAIT, message: `${label} が開かない` }).toBeGreaterThan(0);
      // 段が 1 つだけの見本は送る先が無い
      if ((await steps.count()) > 1) await expectSteadyAcrossSteps(page, '[data-catalog="overlay"]', label);
      await page.keyboard.press("Escape");
      await expect.poll(() => page.locator('[data-catalog="overlay"]').count(), { ...WAIT, message: `${label} が閉じない` }).toBe(0);
    });
  });


  // 頭の列を 2 段にした時、携帯の幅の編集画面で前の図を出している旨の札が頭の列の箱に重なった (#3120)。
  // カタログの見本の枠と重ね窓でも、頭の列が出る全部の幅と段で、頭の列に頁の部品が重ならない (#3124)。
  // 860 × 960 の重ね窓は、時系列図の行を詰めて図が低くなり、全体が収まって寄って追わない (#3177)。頭の列を出さないことを確かめる
  describe.for([
    { width: 360, height: 780, frame: true },
    { width: 390, height: 844, frame: true },
    { width: 430, height: 932, frame: true },
    { width: 860, height: 960, frame: false, fits: true },
    { width: 1440, height: 900, frame: false },
  ])("$width × $height", ({ frame, fits, ...viewport }) => {
    it("catalog-heads-strip-uncovered", async () => {
      const oauth = samplesOf("sequence").indexOf("oauth");
      expect(oauth, "時系列図のカタログに oauth が無い").toBeGreaterThanOrEqual(0);
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport, reducedMotion: "reduce" });
      await onScreen(page, "category", `${viewport.width} × ${viewport.height} で時系列図の分類の頁が出ない`);
      await page.locator(catalogSel("item")).nth(oauth).click();
      const places = [...(frame ? [{ where: "見本の枠", scope: catalogSel("stage") }] : []), { where: "重ね窓", scope: catalogSel("overlay") }];
      for (const { where, scope } of places) {
        if (scope === catalogSel("overlay")) await page.locator(catalogSel("expand")).click();
        else await page.locator(scope).scrollIntoViewIfNeeded();
        const stepItems = page.locator(`${scope} [data-dragon="steps"] > li`);
        await expect.poll(() => stepItems.count(), { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の${where}の段が読めない` }).toBeGreaterThan(1);
        if (fits) {
          const figure = page.locator(`${scope} svg[data-dragon="figure"]`);
          await expect.poll(() => figure.getAttribute("data-view"), { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の${where}が全体を止めて見せない` }).toBe("fixed");
          await expect.poll(() => figure.locator("g.dg-hd").count(), { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の${where}に頭の列が出る` }).toBe(0);
        } else {
          const steps = await stepItems.count();
          for (let s = 0; s < steps; s++) {
            const step = `${String(s + 1).padStart(2, "0")}/${String(steps).padStart(2, "0")}`;
            await expect
              .poll(() => stripCoveredOf(page, scope), { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の${where}の ${s + 1} 段目で、頭の列が無いか、画面の外に出るか、頭の列に頁の部品が重なる` })
              .toEqual({ step, points: 39, covered: [] });
            if (s < steps - 1) await page.locator(`${scope} [data-dragon="next"]`).click();
          }
        }
        if (scope === catalogSel("overlay")) {
          await page.keyboard.press("Escape");
          await expect.poll(() => page.locator(scope).count(), { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の重ね窓が閉じない` }).toBe(0);
        }
      }
    });
  });


  // 段の本文の帯の下に余白が無く、本文の最後の行が重ね窓の札の縁に接していた (#3051)
  describe.for((["architecture", "sequence"] as const).flatMap((category) => [
    { width: 390, height: 844 },
    { width: 860, height: 900 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ].map(({ width, height }) => ({ category, width, height }))))("$category $width × $height", ({ category, width, height }) => {
    it("overlay-caption-clear-of-bottom-edge", async () => {
      const viewport = { width, height };
      const count = samplesOf(category).length;
      const { page } = await site.open({ path: `${BASE}catalog/${category}`, viewport });
      await onScreen(page, "category", `${viewport.width} × ${viewport.height} で ${category} の分類の頁が出ない`);
      for (let i = 0; i < count; i++) {
        const label = `${viewport.width} × ${viewport.height} の ${category} の ${i + 1} 番目の見本の重ね窓`;
        await page.locator(catalogSel("item")).nth(i).click();
        await page.locator(catalogSel("expand")).click();
        // 帯の下の余白は 10px で、本文の行の下の空きと合わせて 11px。広がると図の枠が低くなる (#3101)
        await expect
          .poll(async () => {
            const clearance = await captionClearance(page, '[data-catalog="overlay"]', ".catalog-overlay-card");
            return clearance === null ? null : Math.round(clearance);
          }, { ...WAIT, message: `${label} で、本文の最後の行と札の下の縁の間が 11px でない` })
          .toBe(11);
        await page.keyboard.press("Escape");
        await expect.poll(() => page.locator('[data-catalog="overlay"]').count(), { ...WAIT, message: `${label} が閉じない` }).toBe(0);
      }
    });
  });


  it(
    "overlay-low-screen-keeps-whole-figure",
    async () => {
      // 帯に余白を足して図の枠を低くすると、低い画面で構成図の全体が見えず寄って追う図に替わる (#3051)
      const { page } = await site.open({ path: `${BASE}catalog/architecture`, viewport: { width: 1280, height: 720 } });
      await onScreen(page, "category", "1280 × 720 で構成図の分類の頁が出ない");
      await page.locator(catalogSel("item")).first().click();
      await page.locator(catalogSel("expand")).click();
      const shape = await settledStepShape(page, '[data-catalog="overlay"]', "1280 × 720 の構成図の 1 番目の見本の重ね窓");
      expect(shape.view, "1280 × 720 の構成図の重ね窓が、全体を止めて見せる図でない").toBe("fixed");
    },
  );


  // 窓と全体図を図の原寸の幅に収めていたため、枠が余っても右端の API の札が窓で切れていた (#3053)
  describe.for([
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ])("$width × $height", (viewport) => {
    it("overlay-follow-window-shows-whole-width", async () => {
      const page = await openOauthOverlay(viewport);
      await expect
        .poll(async () => {
          const seen = await followWindowOf(page);
          return seen && { view: seen.view, shown: seen.shown };
        }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の重ね窓で、窓が図の横幅の全部を見せない` })
        .toEqual({ view: "follow", shown: 1 });
    });
  });


  it(
    "overlay-follow-window-fills-frame-height",
    async () => {
      // 窓の高さが幅から決めた高さで止まり、枠の下が空いていた (#3053)。窓と窓の下の値の表で見える高さを埋める (#3270)
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 1440, height: 900 },
      ]) {
        const page = await openOauthOverlay(viewport);
        await expect
          .poll(async () => {
            const seen = await followWindowOf(page);
            return seen && { view: seen.view, gap: Math.abs(seen.gap) <= 1 ? 0 : seen.gap, inside: seen.inside };
          }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の oauth の重ね窓で、窓の高さが図の枠の中で見える高さと合わないか、図が枠に収まらない` })
          .toEqual({ view: "follow", gap: 0, inside: true });
      }
    },
  );


  // 携帯の幅では縦長の全体図の列が枠の幅の 3 割を取り、窓が oauth の横の 3 割ほどしか見せなかった (#3055)
  describe.for(PHONES)("$width × $height", (viewport) => {
    it("narrow-follow-window-fills-frame-width", async () => {
      const oauth = exampleText("oauth", "ja");
      const size = `${viewport.width} × ${viewport.height}`;
      const expectWide = async (page: Page, scope: string, where: string): Promise<void> => {
        await expect
          .poll(async () => {
            const seen = await narrowFollowOf(page, scope);
            return seen && { view: seen.view, overview: seen.overview, gap: Math.abs(seen.gap) <= 1 ? 0 : seen.gap, inside: seen.inside };
          }, { ...WAIT, message: `${size} の${where}の oauth で、全体図が残るか、窓が枠の幅いっぱいでないか、図が枠に収まらない` })
          .toEqual({ view: "follow", overview: 0, gap: 0, inside: true });
      };
      const { page } = await site.open({ path: `${BASE}catalog/sequence`, viewport });
      await onScreen(page, "category", `${size} で時系列図の分類の頁が出ない`);
      await page.locator(catalogSel("item")).nth(samplesOf("sequence").indexOf("oauth")).click();
      await expectWide(page, '[data-catalog="stage"]', "カタログの頁の見本の枠");
      await page.locator(catalogSel("expand")).click();
      await expectWide(page, '[data-catalog="overlay"]', "拡大の重ね窓");
      const editor = await site.open({ path: `${BASE}editor${toHash(oauth)}`, viewport });
      await expectWide(editor.page, '[data-playground="stage"]', "編集画面");
    });
  });


  it(
    "narrow-overlay-caption-lower",
    async () => {
      // 携帯の幅では釦と番号と題と本文を横 1 列に並べ、本文の欄が細って帯が高くなり、重ね窓の図の枠を押し下げていた (#3057)
      const before = {
        "360 × 780": { oauth: { bar: 191, frame: 398 }, ccip: { bar: 211, frame: 355 } },
        "390 × 844": { oauth: { bar: 151, frame: 502 }, ccip: { bar: 191, frame: 462 } },
      } as const;
      // 今の帯の高さ。題と本文の間や帯の下の余白が広がると帯が高くなる (#3101)
      const bars = { oauth: 140, ccip: 160 } as const;
      for (const viewport of [
        { width: 360, height: 780 },
        { width: 390, height: 844 },
      ]) {
        const size = `${viewport.width} × ${viewport.height}` as keyof typeof before;
        for (const sample of CAPTION_SAMPLES) {
          const page = await openOverlay(viewport, sample);
          const now = before[size][sample.key];
          await expect
            .poll(async () => {
              const seen = await captionOf(page, '[data-catalog="overlay"]');
              return seen && { bar: Math.round(seen.bar), taller: seen.frame > now.frame };
            }, { ...WAIT, message: `${size} の ${sample.key} の重ね窓で、帯が ${bars[sample.key]}px でないか、図の枠の中が ${now.frame}px より高くならない` })
            .toEqual({ bar: bars[sample.key], taller: true });
        }
      }
    },
  );


  // 携帯の幅で帯の並べ方を替えても、段を送った時に帯と図が動かず、題と本文が帯からはみ出さない (#3049、#3057)
  // 置き場ごとに分ける (#3410)。重ね窓と編集画面を 1 件で開くと、混んだ機械で 1 件の上限 (10 秒) に迫った
  describe.for(
    PHONES.flatMap(({ width, height }) =>
      CAPTION_SAMPLES.flatMap((sample) => (["重ね窓", "編集画面"] as const).map((where) => ({ width, height, sample, name: sample.key, where }))),
    ),
  )("$width × $height $name $where", ({ width, height, sample, where }) => {
    it("narrow-caption-steady-and-inside", async () => {
      const viewport = { width, height };
      const size = `${viewport.width} × ${viewport.height}`;
      const scope = where === "重ね窓" ? '[data-catalog="overlay"]' : '[data-playground="stage"]';
      const page = where === "重ね窓" ? await openOverlay(viewport, sample, true) : await openEditor(viewport, sample.key, true);
      const label = `${size} の${where}の ${sample.key}`;
      await expect.poll(async () => (await captionOf(page, scope))?.inside, { ...WAIT, message: `${label} で、題か本文が帯の中身の幅からはみ出す` }).toBe(true);
      await expectSteadyAcrossSteps(page, scope, label);
    });
  });


  // 帯の中身の幅が 440px 以上の時は、釦と番号と題と本文を横 1 列に並べる今の形のまま (#3057)
  describe.for(
    [
      { width: 560, height: 900 },
      { width: 1440, height: 900 },
    ].flatMap(({ width, height }) => CAPTION_SAMPLES.map((sample) => ({ width, height, sample, name: sample.key }))),
  )("$width × $height $name", ({ width, height, sample }) => {
    it("wide-caption-stays-one-row", async () => {
      const viewport = { width, height };
      const size = `${viewport.width} × ${viewport.height}`;
      for (const [where, scope, page] of [
        ["重ね窓", '[data-catalog="overlay"]', await openOverlay(viewport, sample)],
        ["編集画面", '[data-playground="stage"]', await openEditor(viewport, sample.key)],
      ] as const) {
        await expect
          .poll(async () => {
            const seen = await captionOf(page, scope);
            if (!seen) return null;
            const { buttons, no, title, body } = seen;
            return {
              titleBesideButtons: title.left > buttons.right && title.top < buttons.bottom,
              noBesideButtons: no.left > buttons.right && no.right <= title.left && no.top < buttons.bottom,
              bodyUnderTitle: body.top >= title.bottom && Math.abs(body.left - title.left) <= 1,
              // 釦の右 10px に番号、番号の右 10px に題を置き、題は釦の上端にそろえる (#3099)。本文は題のすぐ下に置く (#3101)
              gaps: {
                no: Math.round(no.left) - Math.round(buttons.right),
                title: Math.round(title.left) - Math.round(no.right),
                top: Math.round(title.top) - Math.round(buttons.top),
                body: Math.round(body.top) - Math.round(title.bottom),
              },
            };
          }, { ...WAIT, message: `${size} の${where}の ${sample.key} で、帯が横 1 列でないか、釦と番号と題と本文の間が今と違う` })
          .toEqual({ titleBesideButtons: true, noBesideButtons: true, bodyUnderTitle: true, gaps: { no: 10, title: 10, top: 0, body: 0 } });
      }
    });
  });


  // 携帯の幅では重ね窓の見出しに題と説明を折り返して出し、見出しが 107 から 156px を取って図の枠を押し下げていた (#3059)
  describe.for(PHONES)("$width × $height", (viewport) => {
    it("narrow-overlay-head-title-only", async () => {
      for (const sample of CAPTION_SAMPLES) {
        const page = await openOverlay(viewport, sample);
        const title = sampleOf(exampleText(sample.key, "ja"))?.title;
        await expect
          .poll(async () => {
            const seen = await overlayHeadOf(page);
            return seen && { title: seen.title, whole: seen.whole, desc: seen.desc };
          }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の ${sample.key} の重ね窓で、見出しに説明が見えるか、題が切れる` })
          .toEqual({ title, whole: true, desc: null });
      }
    });
  });


  // 携帯の幅の重ね窓では、見出しが低くなった分だけ図の枠が高くなる (#3059)
  describe.for(PHONES.slice(0, 2))("$width × $height", (viewport) => {
    it("narrow-overlay-head-lower", async () => {
      const before = {
        "360 × 780": { oauth: { head: 133, frame: 472 }, ccip: { head: 156, frame: 435 } },
        "390 × 844": { oauth: { head: 133, frame: 542 }, ccip: { head: 133, frame: 522 } },
      } as const;
      const size = `${viewport.width} × ${viewport.height}` as keyof typeof before;
      for (const sample of CAPTION_SAMPLES) {
        const page = await openOverlay(viewport, sample);
        const now = before[size][sample.key];
        await expect
          .poll(async () => {
            const seen = await overlayHeadOf(page);
            // 今の見出しは上下の余白 14px と題の 1 行で 80px。余白が広がると図の枠が低くなる (#3101)
            return seen && { head: Math.round(seen.head), taller: seen.frame > now.frame };
          }, { ...WAIT, message: `${size} の ${sample.key} の重ね窓で、見出しが 80px でないか、図の枠の中が ${now.frame}px より高くならない` })
          .toEqual({ head: 80, taller: true });
      }
    });
  });


  // 携帯の幅で見出しを替えても、題と閉じる釦が見出しに収まり、閉じる釦で閉じる (#3059)
  describe.for(PHONES)("$width × $height", (viewport) => {
    it("narrow-overlay-head-close-works", async () => {
      for (const sample of CAPTION_SAMPLES) {
        const page = await openOverlay(viewport, sample);
        const label = `${viewport.width} × ${viewport.height} の ${sample.key} の重ね窓`;
        await expect.poll(async () => (await overlayHeadOf(page))?.fits, { ...WAIT, message: `${label} で、題か閉じる釦が見出しからはみ出すか、2 つが重なる` }).toBe(true);
        await page.locator(catalogSel("overlay-close")).click();
        await expect.poll(() => page.locator(catalogSel("overlay")).count(), { ...WAIT, message: `${label} が閉じる釦で閉じない` }).toBe(0);
      }
    });
  });


  it(
    "wide-overlay-head-keeps-description",
    async () => {
      // 560px 以上の画面の重ね窓は、今と同じく見出しに題と説明を出す (#3059)
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openOverlay(viewport, sample);
          await expect
            .poll(async () => {
              const seen = await overlayHeadOf(page);
              return seen && { title: seen.title.length > 0, desc: (seen.desc ?? "").length > 0 };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の ${sample.key} の重ね窓で、見出しに題か説明が見えない` })
            .toEqual({ title: true, desc: true });
        }
      }
    },
  );
});

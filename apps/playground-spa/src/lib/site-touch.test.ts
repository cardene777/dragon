/**
 * 頁と再生と帯の指の操作 (#3075)。
 *
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 2 つ以上の file が使う道具は `site-support.ts` に在る (#3381)
 */

import type { Page } from "playwright";
import { BASE } from "./playground-support";
import { describe, expect, it } from "vitest";
import { site, useSite, WAIT, siteSel, SCREENS, DESTINATIONS, catalogSel, onScreen, navOf, CAPTION_SAMPLES, openOverlay, openEditor, captionOf, PHONES, expectSizes, openSequence, WIDE_CAPTION, wideCaptionShape } from "./site-support";

/**
 * 指で触る時に確かめる概要と使い方の頁の本文の部品 (#3079)。`targets` は枠のある釦と字だけの札、`links` はそのうち字だけの札。
 * 概要は呼びかけの釦 2 つ、用例の下のカタログで図を見る、最後の呼びかけの釦 2 つ。使い方は呼びかけの釦 2 つと、節ごとの終わりの札と、箱の節の部品「絵」の頁への案内 (#3172)。
 * `touchSizes` は指で触る 768 × 1024 での `targets` の部品ごとの大きさ (#3095)
 */
const BODY_PAGES = [
  { path: "", screen: "home", targets: '[data-home="hero"] a, [data-home="uses-more"] a, [data-home="closing"] a', links: '[data-home="uses-more"] a', count: 5, touchSizes: ["編集画面を開く → 149x44", "使い方を読む 119x44", "カタログで図を見る → 143x44", "編集画面を開く → 149x44", "GitHub ↗ 100x44"] },
  {
    path: "docs",
    screen: "docs",
    targets: '[data-docs="cta"] a, a[data-docs="section-cta"], a[data-docs="icon-link"]',
    links: 'a[data-docs="section-cta"], a[data-docs="icon-link"]',
    count: 25,
    touchSizes: [
      "5 分で始める → 133x44",
      "カタログで図を見る 160x44",
      "編集画面で書いてみる → 151x46",
      // 省いて書く節の出口 (#3438)
      "編集画面で書いてみる → 151x46",
      "続き → 箱 60x46",
      "使える絵柄を部品「絵」の頁で全て見る → 259x46",
      "続き → 線 60x46",
      "続き → 区画 74x46",
      "構成図の見本を見る → 138x46",
      "状態遷移図の見本を見る → 165x46",
      "枝分かれの図の見本を見る → 179x46",
      "時間軸の図の見本を見る → 165x46",
      "木の図の見本を見る → 138x46",
      "試す図の見本を見る → 138x46",
      "量の図の見本を見る → 138x46",
      "手順の図の見本を見る → 152x46",
      "配管の図の見本を見る → 152x46",
      // ブロックを足す節の出口 (#3407)
      "編集画面で書いてみる → 151x46",
      "続き → 帯 60x46",
      "時系列図の見本を見る → 152x46",
      "続き → JSON 82x46",
      "編集画面で JSON を取り込む → 193x46",
      "続き → 書き出し 101x46",
      "編集画面から書き出す → 152x46",
      "編集画面で書き直す → 138x46",
    ],
  },
] as const;

/** 指で触る端末を模して 2 つの頁を確かめる画面の大きさ (#3079) */
const TOUCH_PAGE_SIZES = [
  { width: 360, height: 780 },
  { width: 768, height: 1024 },
  { width: 1366, height: 1024 },
] as const;

/** 頁 `body` を開く。`touch` の時は指で触る端末を模す (#3079) */
const openBodyPage = async (viewport: { width: number; height: number }, body: (typeof BODY_PAGES)[number], touch = false): Promise<Page> => {
  const { page } = await site.open({ path: `${BASE}${body.path}`, viewport, touch });
  await onScreen(page, body.screen, `${viewport.width} × ${viewport.height} で${body.screen === "home" ? "概要" : "使い方"}の頁が出ない`);
  return page;
};

/**
 * `sel` に当たる部品ごとの字、四捨五入しない幅と高さ (#3085)、部品を画面に入れてから四隅の 2px 内側を押した時にその部品に当たるか (#3079)。
 * 2 回続けて同じ値を読めた時だけ返す
 */
const bodyTargetsOf = (page: Page, sel: string): Promise<{ name: string; width: number; height: number; corners: boolean }[] | null> =>
  page.evaluate(async (sel) => {
    await document.fonts.ready;
    const read = (): { name: string; width: number; height: number; corners: boolean }[] =>
      [...document.querySelectorAll<HTMLElement>(sel)]
        .filter((el) => el.checkVisibility())
        .map((el) => {
          el.scrollIntoView({ block: "center" });
          const r = el.getBoundingClientRect();
          const points: [number, number][] = [
            [r.left + 2, r.top + 2],
            [r.right - 2, r.top + 2],
            [r.left + 2, r.bottom - 2],
            [r.right - 2, r.bottom - 2],
          ];
          const corners = points.every(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return hit !== null && el.contains(hit);
          });
          return { name: (el.textContent ?? "").trim(), width: r.width, height: r.height, corners };
        });
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, sel);

/** `sel` に当たる部品の数と、四捨五入しない幅か高さが 44px に届かないか四隅が外れる部品 (#3079、#3085) */
const bodyShortOf = async (page: Page, sel: string): Promise<{ count: number; small: string[] } | null> => {
  const parts = await bodyTargetsOf(page, sel);
  return (
    parts && {
      count: parts.length,
      small: parts.filter((p) => p.width < 44 || p.height < 44 || !p.corners).map((p) => `${p.name} ${p.width}x${p.height}${p.corners ? "" : " 隅が外れる"}`),
    }
  );
};

/**
 * 字だけの札ごとに、すぐ上の部品の下端から字の上端までと、字の下端から札を持つ区画の下端まで (#3079)。
 * 区画の高さでは比べない。指で触る時は区画の中の図の段を送る釦が大きくなり (#3076)、札と関係なく区画が高くなる
 */
const textLinkPlacesOf = (page: Page, sel: string): Promise<{ above: number; below: number }[]> =>
  page.evaluate(async (sel) => {
    await document.fonts.ready;
    const half = (v: number): number => Math.round(v * 2) / 2;
    return [...document.querySelectorAll<HTMLElement>(sel)]
      .filter((el) => el.checkVisibility())
      .map((el) => {
        const section = el.closest("section");
        let node: Element | null = el;
        while (node && node !== section && !node.previousElementSibling) node = node.parentElement;
        const prev = node?.previousElementSibling?.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(el);
        const text = range.getBoundingClientRect();
        // 札より下にある再生の帯は、指で触る時に操作の段の釦が 44px になる分だけ高くなる (#3076、#3398)。その帯の高さを除いて比べる
        const bars = [...(section?.querySelectorAll(".dg-bar") ?? [])]
          .map((bar) => bar.getBoundingClientRect())
          .filter((bar) => bar.top >= text.bottom)
          .reduce((sum, bar) => sum + bar.height, 0);
        return { above: half(text.top - (prev?.bottom ?? Number.NaN)), below: half((section?.getBoundingClientRect().bottom ?? Number.NaN) - text.bottom - bars) };
      });
  }, sel);

/** 段を送る釦を確かめる置き場。oauth の編集画面、時系列図のカタログの見本の枠と重ね窓、使い方の頁 (#3069) */
const PLAYER_PLACES = ["editor", "catalog", "overlay", "docs"] as const;

/**
 * 置き場 `place` を開き、段を送る釦を探す範囲と一緒に返す。カタログの見本の枠と重ね窓は時系列図の最初の見本 (#3069)。
 * `touch` の時は指で触る端末を模す (#3076)
 */
const openPlayerPlace = async (
  viewport: { width: number; height: number },
  place: (typeof PLAYER_PLACES)[number],
  touch = false,
): Promise<{ page: Page; scope: string }> => {
  if (place === "editor") return { page: await openEditor(viewport, "oauth", true, touch), scope: '[data-playground="stage"]' };
  if (place === "docs") {
    const { page } = await site.open({ path: `${BASE}docs`, viewport, touch });
    await onScreen(page, "docs", `${viewport.width} × ${viewport.height} で使い方の頁が出ない`);
    return { page, scope: "body" };
  }
  const page = await openSequence(viewport, touch);
  if (place === "catalog") return { page, scope: catalogSel("preview") };
  await page.locator(catalogSel("expand")).click();
  return { page, scope: catalogSel("overlay") };
};

/**
 * 置き場 `scope` に見える段を送る釦 (#3069)。釦ごとに名前 (`data-dragon`)、四捨五入しない幅と高さ (#3085)、
 * 画面に入れてから四隅の 4px 内側 (角の丸み 12px の外を避ける) を押した時にその釦に当たるか
 */
const playerButtonsOf = (page: Page, scope: string): Promise<{ name: string; width: number; height: number; corners: boolean }[]> =>
  page.evaluate(async (scope) => {
    await document.fonts.ready;
    const root = document.querySelector(scope);
    return [...(root?.querySelectorAll<HTMLElement>(".dg-btn") ?? [])]
      .filter((el) => el.checkVisibility())
      .map((el) => {
        el.scrollIntoView({ block: "center" });
        const r = el.getBoundingClientRect();
        const points: [number, number][] = [
          [r.left + 4, r.top + 4],
          [r.right - 4, r.top + 4],
          [r.left + 4, r.bottom - 4],
          [r.right - 4, r.bottom - 4],
        ];
        const corners = points.every(([x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return hit !== null && el.contains(hit);
        });
        return { name: el.dataset.dragon ?? "", width: r.width, height: r.height, corners };
      });
  }, scope);

/** 指で触る端末を模して段を送る釦を確かめる画面の大きさ。768 は縦のタブレット、1024 と 1366 は帯の中身が 440px 以上ある幅 (#3076) */
const TOUCH_PLAYER_SIZES = [
  { width: 768, height: 1024 },
  { width: 1024, height: 1366 },
  { width: 1366, height: 1024 },
] as const;

/**
 * 見出しの帯か開いた一覧 `scope` の押せる部品 (#3071)。
 * 部品ごとに `data-site` の名前 (無ければ見えている字の 1 行目)、四捨五入しない幅と高さ (#3085)、四隅の 2px 内側を押した時にその部品に当たるか。
 * 2 回続けて同じ値を読めた時だけ返す
 */
const headerTargetsOf = (page: Page, scope: string): Promise<{ name: string; width: number; height: number; corners: boolean }[] | null> =>
  page.evaluate(async (scope) => {
    await document.fonts.ready;
    const read = () => {
      const root = document.querySelector(scope);
      if (!root) return null;
      return [...root.querySelectorAll<HTMLElement>("button, a[href]")]
        .filter((el) => el.checkVisibility())
        .map((el) => {
          const r = el.getBoundingClientRect();
          const points: [number, number][] = [
            [r.left + 2, r.top + 2],
            [r.right - 2, r.top + 2],
            [r.left + 2, r.bottom - 2],
            [r.right - 2, r.bottom - 2],
          ];
          const corners = points.every(([x, y]) => {
            const hit = document.elementFromPoint(x, y);
            return hit !== null && el.contains(hit);
          });
          return { name: el.dataset.site ?? el.innerText.trim().split("\n")[0] ?? "", width: r.width, height: r.height, corners };
        });
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  }, scope);

/** `scope` の押せる部品の数と、44px に届かないか四隅が外れる部品 (#3071) */
const headerShortOf = async (page: Page, scope: string): Promise<{ count: number; small: string[] } | null> => {
  const parts = await headerTargetsOf(page, scope);
  return parts && { count: parts.length, small: parts.filter((p) => p.width < 44 || p.height < 44 || !p.corners).map((p) => `${p.name} ${p.width}x${p.height}${p.corners ? "" : " 隅が外れる"}`) };
};

/**
 * 指で触る端末を模して開く画面の大きさ (#3075)。
 * 600 は一覧を開く釦が出る幅、768 は 900px 以下、1024 と 1366 は行き先を帯に並べる幅
 */
const TOUCH_SIZES = [
  { width: 600, height: 960 },
  { width: 768, height: 1024 },
  { width: 1024, height: 1366 },
  { width: 1366, height: 1024 },
] as const;

/** 帯の行き先と色味の切替が見えているか、一覧を開く釦が見えているか (#3075) */
const headerFoldOf = async (page: Page): Promise<{ nav: boolean; palette: boolean; menu: boolean }> => ({
  nav: (await navOf(page)).some((n) => n.visible),
  palette: await page.locator(siteSel("palette")).isVisible(),
  menu: await page.locator(siteSel("menu")).isVisible(),
});

/** 帯の行き先のうち、字の幅と左右の余白の和より枠が狭い (縮んで隣と字が詰まる) 物の名前 (#3075) */
const squeezedOf = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('[data-site="nav"] a')]
      .filter((a) => a.getClientRects().length > 0)
      .filter((a) => {
        const range = document.createRange();
        range.selectNodeContents(a);
        const style = getComputedStyle(a);
        const room = range.getBoundingClientRect().width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        return a.getBoundingClientRect().width + 0.5 < room;
      })
      .map((a) => (a.textContent ?? "").trim()),
  );

describe("頁と再生と帯の指の操作 (#3075)", () => {
  useSite();


  it(
    "coarse-pages-touch-targets",
    async () => {
      // 指で触る時、概要と使い方の頁の釦は高さ 40px、字だけの札は 30px で指で押し違えやすかった (#3079)。
      // 釦は見た目ごと、字だけの札は押せる範囲だけを 44px にする
      for (const viewport of TOUCH_PAGE_SIZES) {
        for (const body of BODY_PAGES) {
          const page = await openBodyPage(viewport, body, true);
          await expect
            .poll(() => bodyShortOf(page, body.targets), { ...WAIT, message: `指で触る ${viewport.width} × ${viewport.height} の${body.screen === "home" ? "概要" : "使い方"}の頁で、釦か札が揃わないか、44px に届かない` })
            .toEqual({ count: body.count, small: [] });
          if (viewport === TOUCH_PAGE_SIZES[1]) {
            await expectSizes(() => bodyTargetsOf(page, body.targets), `指で触る ${viewport.width} × ${viewport.height} の${body.screen === "home" ? "概要" : "使い方"}の頁`, body.touchSizes);
          }
        }
      }
    },
  );


  // 字だけの札は見た目と並びを変えずに押せる範囲だけを広げる。指で触る時も字の位置と区画の高さはマウスで使う時と同じ (#3079)。
  // 区画の高さは、指で触る時に釦の分だけ高くなる再生の帯 (#3076、#3398) を除いて比べる
  describe.for((TOUCH_PAGE_SIZES).flatMap((viewport) => (BODY_PAGES).map((body) => ({ viewport, body }))))("$viewport.width × $viewport.height $body", ({ viewport, body }) => {
    it("coarse-pages-text-links-keep-place", async () => {
      const mouse = await textLinkPlacesOf(await openBodyPage(viewport, body), body.links);
      expect(mouse.length, `${viewport.width} × ${viewport.height} の${body.screen === "home" ? "概要" : "使い方"}の頁に字だけの札が無い`).toBeGreaterThan(0);
      expect(
        mouse.every((p) => Number.isFinite(p.above) && Number.isFinite(p.below)),
        `${viewport.width} × ${viewport.height} の${body.screen === "home" ? "概要" : "使い方"}の頁で、字だけの札の上の部品か区画が見つからない`,
      ).toBe(true);
      const touch = await openBodyPage(viewport, body, true);
      await expect
        .poll(() => textLinkPlacesOf(touch, body.links), {
          ...WAIT,
          message: `指で触る ${viewport.width} × ${viewport.height} の${body.screen === "home" ? "概要" : "使い方"}の頁で、字だけの札の字の位置か区画の高さがマウスで使う時と違う`,
        })
        .toEqual(mouse);
    });
  });


  it(
    "coarse-pages-links-work",
    async () => {
      // 指で触る時に釦と札を大きくしても、押した時の行き先は今と同じ (#3079)
      const viewport = { width: 768, height: 1024 };
      const [home, docs] = BODY_PAGES;
      const go = async (body: (typeof BODY_PAGES)[number], sel: string, want: string, what: string): Promise<void> => {
        const page = await openBodyPage(viewport, body, true);
        const link = page.locator(sel).first();
        const href = await link.getAttribute("href");
        await link.click();
        const where = want === "hash" ? new URL(href ?? "", "http://x").hash : want;
        await expect
          .poll(() => page.evaluate((hash) => (hash ? location.hash : location.pathname), want === "hash"), { ...WAIT, message: `指で触る 768 × 1024 で、${what}を押しても行き先へ移らない` })
          .toBe(where);
      };
      await go(home, '[data-home="hero"] a', `${BASE}editor`, "概要の呼びかけの編集画面を開く");
      await go(home, '[data-home="uses-more"] a', `${BASE}catalog`, "用例の下のカタログで図を見る");
      await go(docs, '[data-docs="cta"] a', `${BASE}editor`, "使い方の呼びかけの 5 分で始める");
      await go(docs, 'a[data-docs="section-cta"][href^="#"]', "hash", "使い方の節の終わりの続きの札");
    },
  );


  it(
    "mouse-tablet-pages-keep-size",
    async () => {
      // マウスで使う時は、768px でも概要と使い方の頁の釦と札は今の大きさのまま (#3079)
      for (const viewport of [
        { width: 768, height: 1024 },
        { width: 1440, height: 900 },
      ]) {
        for (const body of BODY_PAGES) {
          const page = await openBodyPage(viewport, body);
          await expect
            .poll(
              () =>
                page.evaluate(
                  async ({ targets, links }) => {
                    await document.fonts.ready;
                    const heights = (els: Element[]): number[] => [...new Set(els.filter((el) => el.checkVisibility()).map((el) => Math.round(el.getBoundingClientRect().height)))];
                    const text = [...document.querySelectorAll(links)];
                    return { buttons: heights([...document.querySelectorAll(targets)].filter((el) => !text.includes(el))), links: heights(text) };
                  },
                  { targets: body.targets, links: body.links },
                ),
              { ...WAIT, message: `マウスで使う ${viewport.width} × ${viewport.height} の${body.screen === "home" ? "概要" : "使い方"}の頁で、釦か字だけの札の高さが今と違う` },
            )
            .toEqual({ buttons: [40], links: [30] });
        }
      }
    },
  );


  // 段を送る釦は 36px で間が 5px しか無く、携帯の幅では前と次を押し違えやすかった (#3069)。指で押す的の目安は 44 × 44px
  describe.for((PHONES).flatMap((viewport) => (PLAYER_PLACES).map((place) => ({ viewport, place }))))("$viewport.width × $viewport.height $place", ({ viewport, place }) => {
    it("narrow-player-buttons-touch-targets", async () => {
      const { page, scope } = await openPlayerPlace(viewport, place);
      await expect
        .poll(
          async () => {
            const buttons = await playerButtonsOf(page, scope);
            return {
              some: buttons.length >= 3,
              small: buttons.filter((b) => b.width < 44 || b.height < 44 || !b.corners).map((b) => `${b.name} ${b.width}x${b.height}${b.corners ? "" : " 隅が外れる"}`),
            };
          },
          { ...WAIT, message: `${viewport.width} × ${viewport.height} の ${place} で、段を送る釦が無いか、44px に届かない釦がある` },
        )
        .toEqual({ some: true, small: [] });
    });
  });


  it(
    "narrow-player-buttons-work",
    async () => {
      // 携帯の幅で段を送る釦を 44px にし、題を釦の下の段に置いても、前と次と再生の働きは今と同じ (#3069)。再生の釦は印と名前を持つ (#3398)
      for (const viewport of PHONES) {
        const page = await openEditor(viewport, "oauth", true);
        const where = `${viewport.width} × ${viewport.height} の oauth の編集画面`;
        const stage = '[data-playground="stage"]';
        const no = async (): Promise<string> => (await page.locator(`${stage} [data-dragon="step-no"]`).textContent()) ?? "";
        const toggle = async (): Promise<string> => (await page.locator(`${stage} [data-dragon="toggle"]`).textContent()) ?? "";
        await expect.poll(no, { ...WAIT, message: `${where} で、1 段目から始まらない` }).toMatch(/^01\//);
        await page.locator(`${stage} [data-dragon="next"]`).click();
        await expect.poll(no, { ...WAIT, message: `${where} で、次の釦で段が進まない` }).toMatch(/^02\//);
        await page.locator(`${stage} [data-dragon="prev"]`).click();
        await expect.poll(no, { ...WAIT, message: `${where} で、前の釦で段が戻らない` }).toMatch(/^01\//);
        expect(await toggle(), `${where} で、動きを嫌う設定なのに再生の釦が出ない`).toBe("▶ 動かす");
        await page.locator(`${stage} [data-dragon="toggle"]`).click();
        await expect.poll(toggle, { ...WAIT, message: `${where} で、再生の釦で動き出さない` }).toBe("❚❚ 止める");
      }
    },
  );


  it(
    "wide-player-buttons-keep-size",
    async () => {
      // 広い帯の段を送る釦は、今と同じ 36px のまま (#3069)。名前の付いた再生の釦 (#3398) は名前の分だけ横に長く、高さは同じ 36px
      const viewport = { width: 1440, height: 900 };
      for (const place of PLAYER_PLACES) {
        const { page, scope } = await openPlayerPlace(viewport, place);
        await expect
          .poll(async () => {
            const buttons = await playerButtonsOf(page, scope);
            return {
              square: [...new Set(buttons.filter((b) => b.name !== "toggle").map((b) => `${Math.round(b.width)}x${Math.round(b.height)}`))],
              toggle: [...new Set(buttons.filter((b) => b.name === "toggle").map((b) => Math.round(b.height)))],
            };
          }, {
            ...WAIT,
            message: `1440 × 900 の ${place} で、段を送る釦の大きさが今と違う`,
          })
          .toEqual({ square: ["36x36"], toggle: [36] });
      }
    },
  );


  // 指で触るタブレットでは、広い帯の段を送る釦が 36px のままで押しにくかった (#3076)。指で触る時は帯の幅に関わらず 44 × 44px にする
  describe.for((TOUCH_PLAYER_SIZES).flatMap((viewport) => (PLAYER_PLACES).map((place) => ({ viewport, place }))))("$viewport.width × $viewport.height $place", ({ viewport, place }) => {
    it("coarse-player-buttons-touch-targets", async () => {
      const { page, scope } = await openPlayerPlace(viewport, place, true);
      await expect
        .poll(
          async () => {
            const buttons = await playerButtonsOf(page, scope);
            return {
              some: buttons.length >= 3,
              small: buttons.filter((b) => b.width < 44 || b.height < 44 || !b.corners).map((b) => `${b.name} ${b.width}x${b.height}${b.corners ? "" : " 隅が外れる"}`),
            };
          },
          { ...WAIT, message: `指で触る ${viewport.width} × ${viewport.height} の ${place} で、段を送る釦が無いか、44px に届かない釦がある` },
        )
        .toEqual({ some: true, small: [] });
    });
  });


  it(
    "coarse-player-buttons-work",
    async () => {
      // 指で触る時に広い帯の釦を 44px にしても、前と次と再生の働きと、段を送っても変わらない帯の高さは今と同じ (#3076)
      const viewport = { width: 1366, height: 1024 };
      const page = await openEditor(viewport, "oauth", true, true);
      const where = "指で触る 1366 × 1024 の oauth の編集画面";
      const stage = '[data-playground="stage"]';
      const no = async (): Promise<string> => (await page.locator(`${stage} [data-dragon="step-no"]`).textContent()) ?? "";
      const toggle = async (): Promise<string> => (await page.locator(`${stage} [data-dragon="toggle"]`).textContent()) ?? "";
      const bar = (): Promise<number> => page.evaluate((s) => Math.round(document.querySelector(`${s} .dg-bar`)?.getBoundingClientRect().height ?? -1), stage);
      await expect.poll(no, { ...WAIT, message: `${where} で、1 段目から始まらない` }).toMatch(/^01\//);
      await page.locator(`${stage} [data-dragon="next"]`).click();
      await expect.poll(no, { ...WAIT, message: `${where} で、次の釦で段が進まない` }).toMatch(/^02\//);
      await page.locator(`${stage} [data-dragon="prev"]`).click();
      await expect.poll(no, { ...WAIT, message: `${where} で、前の釦で段が戻らない` }).toMatch(/^01\//);

      const count = Number((await no()).split("/")[1]);
      expect(count, `${where} で、段の数が読めない`).toBeGreaterThan(1);
      const first = await bar();
      const heights: string[] = [];
      for (let step = 2; step <= count; step++) {
        await page.locator(`${stage} [data-dragon="next"]`).click();
        await expect.poll(no, { ...WAIT, message: `${where} で、${step} 段目へ進まない` }).toMatch(new RegExp(`^${String(step).padStart(2, "0")}/`));
        const height = await bar();
        if (height !== first) heights.push(`${step} 段目 ${height}px`);
      }
      expect(heights, `${where} で、帯の高さが 1 段目 (${first}px) と違う段がある`).toEqual([]);

      expect(await toggle(), `${where} で、動きを嫌う設定なのに再生の釦が出ない`).toBe("▶ 動かす");
      await page.locator(`${stage} [data-dragon="toggle"]`).click();
      await expect.poll(toggle, { ...WAIT, message: `${where} で、再生の釦で動き出さない` }).toBe("❚❚ 止める");
    },
  );


  // 指で触る時も、帯の中身の幅が 440px 以上の帯は広い帯の並べ方のまま (#3076、#3398)
  describe.for(([
    { width: 1024, height: 1366 },
    { width: 1366, height: 1024 },
  ]).flatMap((viewport) => (CAPTION_SAMPLES).map((sample) => ({ viewport, sample }))))("$viewport.width × $viewport.height $sample.key", ({ viewport, sample }) => {
    it("coarse-caption-stays-one-row", async () => {
      const size = `指で触る ${viewport.width} × ${viewport.height}`;
      for (const [where, scope, page] of [
        ["重ね窓", '[data-catalog="overlay"]', await openOverlay(viewport, sample, false, true)],
        ["編集画面", '[data-playground="stage"]', await openEditor(viewport, sample.key, false, true)],
      ] as const) {
        await expect
          .poll(async () => {
            const seen = await captionOf(page, scope);
            if (!seen) return null;
            return wideCaptionShape(seen);
          }, { ...WAIT, message: `${size} の${where}の ${sample.key} で、帯が広い帯の並べ方でないか、番号と題と釦と本文の間が今と違う` })
          .toEqual(WIDE_CAPTION);
      }
    });
  });


  it(
    "narrow-header-touch-targets",
    async () => {
      // 携帯の幅の見出しの帯は、部品が 25 から 29px で、日本語と英語の切替は間が 1px しか無く、指で押し違えやすかった (#3071)。
      // 指で押す的の目安は 44 × 44px。帯に残る部品は名前の札、日本語と英語の切替、明暗の釦、一覧を開く釦の 5 つ
      for (const viewport of PHONES) {
        const { page } = await site.open({ path: BASE, viewport });
        await onScreen(page, "home", "概要の頁が出ない");
        await expect
          .poll(() => headerShortOf(page, siteSel("header")), { ...WAIT, message: `${viewport.width} × ${viewport.height} の見出しの帯で、部品が 5 つ無いか、44px に届かない部品がある` })
          .toEqual({ count: 5, small: [] });
        if (viewport === PHONES[1]) await expectSizes(() => headerTargetsOf(page, siteSel("header")), `${viewport.width} × ${viewport.height} の見出しの帯`, ["dragon 85x44", "lang-ja 44x44", "lang-en 44x44", "theme 44x44", "menu 44x44"]);
      }
    },
  );


  it(
    "narrow-header-sheet-touch-targets",
    async () => {
      // 一覧の中の色味の札は高さ 32px、編集画面を開く釦は 42px だった (#3071)。行き先 6 つ、色味の札 5 つ (#3341、#3398)、編集画面を開く釦の 12 個
      for (const viewport of PHONES) {
        const { page } = await site.open({ path: BASE, viewport });
        await onScreen(page, "home", "概要の頁が出ない");
        await page.locator(siteSel("menu")).click();
        await expect
          .poll(() => headerShortOf(page, ".site-sheet"), { ...WAIT, message: `${viewport.width} × ${viewport.height} の開いた一覧で、部品が 12 個無いか、44px に届かない部品がある` })
          .toEqual({ count: 12, small: [] });
        if (viewport === PHONES[1]) {
          await expectSizes(() => headerTargetsOf(page, ".site-sheet"), `${viewport.width} × ${viewport.height} の開いた一覧`, [
            "概要 374x44",
            "カタログ 374x44",
            "編集画面 374x44",
            "使い方 374x44",
            "更新履歴 374x44",
            "GitHub ↗ 374x44",
            "palette-clear 64x66",
            "palette-paper 64x66",
            "palette-night 64x66",
            "palette-arcade 64x66",
            "palette-sea 64x66",
            "編集画面を開く → 374x44",
          ]);
        }
      }
    },
  );


  it(
    "narrow-header-controls-work",
    async () => {
      // 部品を大きくしても、言葉、明暗、一覧、色味の切替が今と同じに働く (#3071)
      const surface = (page: Page): Promise<string> => page.evaluate(() => getComputedStyle(document.querySelector('[data-site="header"]') as Element).backgroundColor);
      for (const viewport of PHONES) {
        const where = `${viewport.width} × ${viewport.height} の概要の頁`;
        const { page } = await site.open({ path: BASE, viewport });
        await onScreen(page, "home", "概要の頁が出ない");

        await page.locator(siteSel("lang-en")).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where} で、英語に切り替わらない` }).toBe("en");
        await page.locator(siteSel("lang-ja")).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where} で、日本語に戻らない` }).toBe("ja");

        const label = await page.locator(siteSel("theme")).getAttribute("aria-label");
        const light = await surface(page);
        await page.locator(siteSel("theme")).click();
        await expect
          .poll(async () => ({ label: (await page.locator(siteSel("theme")).getAttribute("aria-label")) !== label, surface: (await surface(page)) !== light }), {
            ...WAIT,
            message: `${where} で、明暗の釦を押しても明暗が替わらない`,
          })
          .toEqual({ label: true, surface: true });

        await page.locator(siteSel("menu")).click();
        await expect.poll(async () => (await navOf(page, "sheet")).length, { ...WAIT, message: `${where} で、一覧を開く釦で一覧が開かない` }).toBe(DESTINATIONS.length);
        await page.locator(siteSel("menu")).click();
        await expect.poll(async () => (await navOf(page, "sheet")).length, { ...WAIT, message: `${where} で、一覧を開く釦をもう一度押しても一覧が閉じない` }).toBe(0);

        await page.locator(siteSel("menu")).click();
        const before = await surface(page);
        await page.locator(`${siteSel("sheet-palette")} ${siteSel("palette-night")}`).click();
        await expect.poll(() => surface(page), { ...WAIT, message: `${where} で、一覧の色味の札で色味が替わらない` }).not.toBe(before);
      }
    },
  );


  it(
    "wide-header-keeps-size",
    async () => {
      // 440px 以上の見出しの帯の部品は今の大きさのまま (#3071)
      const expected = {
        "560 × 900": ["dragon 85x27", "lang-ja 31x25", "lang-en 32x25", "theme 29x27", "menu 29x27"],
        "1440 × 900": [
          "dragon 250x27",
          "概要 48x35",
          "カタログ 74x35",
          "編集画面 74x35",
          "使い方 61x35",
          "更新履歴 74x35",
          "GitHub ↗ 81x35",
          "lang-ja 31x25",
          "lang-en 32x25",
          "palette-clear 23x21",
          "palette-paper 23x21",
          "palette-night 23x21",
          "palette-arcade 23x21",
          "palette-sea 23x21",
          "theme 29x27",
          "open-editor 131x31",
        ],
      } as const;
      for (const viewport of [
        { width: 560, height: 900 },
        { width: 1440, height: 900 },
      ]) {
        const size = `${viewport.width} × ${viewport.height}` as keyof typeof expected;
        const { page } = await site.open({ path: BASE, viewport });
        await onScreen(page, "home", "概要の頁が出ない");
        await expect
          .poll(async () => (await headerTargetsOf(page, siteSel("header")))?.map((p) => `${p.name} ${Math.round(p.width)}x${Math.round(p.height)}`), { ...WAIT, message: `${size} の見出しの帯の部品の大きさが今と違う` })
          .toEqual(expected[size]);
      }
    },
  );


  it(
    "coarse-header-touch-targets",
    async () => {
      // 指で触るタブレットの見出しの帯は、部品が 21 から 35px で指で押し違えやすかった (#3075)。指で触る時は幅に関わらず 44 × 44px にする。幅 1024 では外側の編集画面を開く釦を隠す (#3398)
      for (const viewport of TOUCH_SIZES) {
        const { page } = await site.open({ path: BASE, viewport, touch: true });
        await onScreen(page, "home", "概要の頁が出ない");
        await expect
          .poll(async () => {
            const short = await headerShortOf(page, siteSel("header"));
            return short && { some: short.count > 0, small: short.small };
          }, { ...WAIT, message: `指で触る ${viewport.width} × ${viewport.height} の見出しの帯で、部品が無いか、44px に届かない部品がある` })
          .toEqual({ some: true, small: [] });
        if (viewport === TOUCH_SIZES[2]) {
          await expectSizes(() => headerTargetsOf(page, siteSel("header")), `指で触る ${viewport.width} × ${viewport.height} の見出しの帯`, [
            "dragon 85x44",
            "概要 44x44",
            "カタログ 70x44",
            "編集画面 70x44",
            "使い方 57x44",
            "更新履歴 70x44",
            "GitHub ↗ 77x44",
            "lang-ja 44x44",
            "lang-en 44x44",
            "palette-clear 44x44",
            "palette-paper 44x44",
            "palette-night 44x44",
            "palette-arcade 44x44",
            "palette-sea 44x44",
            "theme 44x44",
          ]);
        }
      }
    },
  );


  // 指で触る時、920px 以下では行き先と色味の切替を一覧に畳み、携帯の幅と同じ形にする (#3075、#3398)。
  // 921 から 1056px では 44px の部品が 1 行に収まらず行き先が縮むので、外側の編集画面を開く釦から隠す。
  // 色味が 4 つになって境が 1000px から 1016px に上がった (#3341)。5 つになって畳む境が 900px から 920px に、釦を隠す境が 1056px に上がった (#3398)
  describe.for([
    { viewport: { width: 768, height: 1024 }, expected: { nav: false, palette: false, menu: true, cta: false, squeezed: [] } },
    { viewport: { width: 920, height: 1200 }, expected: { nav: false, palette: false, menu: true, cta: false, squeezed: [] } },
    { viewport: { width: 921, height: 1200 }, expected: { nav: true, palette: true, menu: false, cta: false, squeezed: [] } },
    { viewport: { width: 1024, height: 1366 }, expected: { nav: true, palette: true, menu: false, cta: false, squeezed: [] } },
    { viewport: { width: 1056, height: 1200 }, expected: { nav: true, palette: true, menu: false, cta: false, squeezed: [] } },
    { viewport: { width: 1057, height: 1200 }, expected: { nav: true, palette: true, menu: false, cta: true, squeezed: [] } },
  ])("$viewport.width × $viewport.height", ({ viewport, expected }) => {
    it("coarse-header-folds-below-900", async () => {
      const { page } = await site.open({ path: BASE, viewport, touch: true });
      await onScreen(page, "home", "概要の頁が出ない");
      await expect
        .poll(async () => ({ ...(await headerFoldOf(page)), cta: await page.locator(`${siteSel("header")} ${siteSel("open-editor")}`).isVisible(), squeezed: await squeezedOf(page) }), {
          ...WAIT,
          message: `指で触る ${viewport.width} × ${viewport.height} で、行き先と色味の切替の畳み方か、編集画面を開く釦の出し方が違うか、行き先が縮んでいる`,
        })
        .toEqual(expected);
    });
  });


  it(
    "coarse-header-sheet-touch-targets",
    async () => {
      // 指で触る時の一覧の部品も 44 × 44px にする (#3075)。行き先 6 つ、色味の札 5 つ (#3341、#3398)、編集画面を開く釦の 12 個
      for (const viewport of [
        { width: 600, height: 960 },
        { width: 768, height: 1024 },
      ]) {
        const where = `指で触る ${viewport.width} × ${viewport.height} の一覧`;
        const { page } = await site.open({ path: BASE, viewport, touch: true });
        await onScreen(page, "home", "概要の頁が出ない");
        await page.locator(siteSel("menu")).click();
        await expect
          .poll(() => headerShortOf(page, ".site-sheet"), { ...WAIT, message: `${where}で、部品が 12 個無いか、44px に届かない部品がある` })
          .toEqual({ count: 12, small: [] });
        if (viewport.width === 768) {
          await expectSizes(() => headerTargetsOf(page, ".site-sheet"), where, [
            "概要 752x44",
            "カタログ 752x44",
            "編集画面 752x44",
            "使い方 752x44",
            "更新履歴 752x44",
            "GitHub ↗ 752x44",
            "palette-clear 140x49",
            "palette-paper 140x49",
            "palette-night 140x49",
            "palette-arcade 140x49",
            "palette-sea 140x49",
            "編集画面を開く → 752x44",
          ]);
        }
        await page.locator(`${siteSel("sheet")} a`, { hasText: "使い方" }).click();
        await onScreen(page, "docs", `${where}から使い方の頁へ移れない`);
        await expect.poll(async () => (await navOf(page, "sheet")).length, { ...WAIT, message: `${where}が、移った後も開いたまま` }).toBe(0);
      }
    },
  );


  // 一覧の行き先の行は、字 14px × 1.4 と上下 12px の余白を border-box の最小 44px に収めて 44px にする (#3085)。
  // box-sizing を外すと 44px が字の部分に掛かり、行が 68px に伸びる (#3093)
  describe.for([
    ...PHONES.map((viewport) => ({ viewport, touch: false })),
    { viewport: { width: 600, height: 960 }, touch: true },
    { viewport: { width: 768, height: 1024 }, touch: true },
  ])("$viewport.width × $viewport.height $touch", ({ viewport, touch }) => {
    it("header-sheet-links-stay-44", async () => {
      const where = `${touch ? "指で触る " : ""}${viewport.width} × ${viewport.height} の一覧`;
      const { page } = await site.open({ path: BASE, viewport, touch });
      await onScreen(page, "home", "概要の頁が出ない");
      await page.locator(siteSel("menu")).click();
      await expect
        .poll(() => page.evaluate(() => [...document.querySelectorAll(".site-sheet-link")].map((e) => e.getBoundingClientRect().height)), {
          ...WAIT,
          message: `${where}で、行き先の行が行き先の数だけ無いか、高さが 44px でない`,
        })
        .toEqual(DESTINATIONS.map(() => 44));
    });
  });


  it(
    "coarse-header-controls-work",
    async () => {
      // 指で触る時も、行き先を帯に並べる幅で言葉、明暗、色味の切替と行き先が今と同じに働く (#3075)
      const surface = (page: Page): Promise<string> => page.evaluate(() => getComputedStyle(document.querySelector('[data-site="header"]') as Element).backgroundColor);
      const where = "指で触る 1366 × 1024 の概要の頁";
      const { page } = await site.open({ path: BASE, viewport: { width: 1366, height: 1024 }, touch: true });
      await onScreen(page, "home", "概要の頁が出ない");

      await page.locator(siteSel("lang-en")).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where}で、英語に切り替わらない` }).toBe("en");
      await page.locator(siteSel("lang-ja")).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where}で、日本語に戻らない` }).toBe("ja");

      const label = await page.locator(siteSel("theme")).getAttribute("aria-label");
      const light = await surface(page);
      await page.locator(siteSel("theme")).click();
      await expect
        .poll(async () => ({ label: (await page.locator(siteSel("theme")).getAttribute("aria-label")) !== label, surface: (await surface(page)) !== light }), {
          ...WAIT,
          message: `${where}で、明暗の釦を押しても明暗が替わらない`,
        })
        .toEqual({ label: true, surface: true });

      const before = await surface(page);
      await page.locator(`${siteSel("palette")} ${siteSel("palette-night")}`).click();
      await expect.poll(() => surface(page), { ...WAIT, message: `${where}で、帯の色味の切替で色味が替わらない` }).not.toBe(before);

      await page.locator(`${siteSel("nav")} a`, { hasText: "使い方" }).click();
      await onScreen(page, "docs", `${where}の行き先から使い方の頁へ移れない`);
    },
  );


  describe.for([
    { width: 600, height: 960 },
    { width: 768, height: 1024 },
    { width: 1366, height: 1024 },
  ])("$width × $height", (viewport) => {
    it("coarse-screens-no-overflow", async () => {
      // 指で触る時に部品を大きくしても、どの画面も横にあふれない (#3075)
      const { page } = await site.open({ path: BASE, viewport, touch: true });
      for (const [screen, path] of SCREENS) {
        await page.goto(`${site.origin}${path}`);
        await onScreen(page, screen, `${path} を開いても ${screen} の画面が出ない`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(over, `指で触る ${viewport.width} × ${viewport.height} で ${screen} を開くと ${over}px 横にあふれる`).toBeLessThanOrEqual(0);
      }
    });
  });


  it(
    "mouse-tablet-header-keeps-size",
    async () => {
      // マウスで使う時は、768px でも見出しの帯は今の並びと大きさのまま (#3075)
      const { page } = await site.open({ path: BASE, viewport: { width: 768, height: 1024 } });
      await onScreen(page, "home", "概要の頁が出ない");
      await expect
        .poll(() => headerFoldOf(page), { ...WAIT, message: "マウスで使う 768 × 1024 で、行き先か色味の切替が畳まれている" })
        .toEqual({ nav: true, palette: true, menu: false });
      await expect
        .poll(async () => (await headerTargetsOf(page, siteSel("header")))?.map((p) => `${p.name} ${Math.round(p.width)}x${Math.round(p.height)}`), { ...WAIT, message: "マウスで使う 768 × 1024 の見出しの帯の部品の大きさが今と違う" })
        .toEqual([
          "dragon 85x27",
          "概要 38x33",
          "カタログ 62x33",
          "編集画面 62x33",
          "使い方 50x33",
          "更新履歴 62x33",
          "GitHub ↗ 68x33",
          "lang-ja 31x25",
          "lang-en 32x25",
          "palette-clear 23x21",
          "palette-paper 23x21",
          "palette-night 23x21",
          "palette-arcade 23x21",
          "palette-sea 23x21",
          "theme 29x27",
        ]);
    },
  );
});

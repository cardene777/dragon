/**
 * 編集画面の幅と指の操作 (#3061)。
 *
 * 頁は build して GitHub Pages と同じ形で配り、画面なしの Chromium で開く (`playground-support.ts`)。
 * 2 つ以上の file が使う道具は `site-support.ts` に在る (#3381)
 */

import { parseNotation, renderDiagram } from "@cardenelabs/dragon";
import type { Page } from "playwright";
import { EXAMPLE_KEYS, type ExampleKey } from "../examples";
import { toHash } from "../share";
import { TEXT } from "../text";
import { BASE, example } from "./playground-support";
import { afterAll, describe, expect, it, type TestContext } from "vitest";
import { countOpens, expectOneOpenPerSetting, openKeptEditor, type PageGroups, pageGroups, showInEditor, site, useSite, exampleText, WAIT, siteSel, PALETTE_IDS, figureLook, figureLooks, KINDS, samplesOf, onScreen, stripCoveredOf, CAPTION_SAMPLES, openItem, openEditor, PHONES, expectSizes } from "./site-support";

/**
 * 編集画面の図の側の上の部分 (#3061)。段の札が見える時はその字、図の枠の上の余白、道具の帯と図の枠の中の間、
 * 最初の画面に見える記法の欄の高さ、道具の帯に重なる箱と図の枠の中の上端より上に出る箱の数、前の図を出している旨の札が見えるかと、
 * その札に重なる箱の数。寄って追う窓は窓の外を切り抜いて見せないので、箱は窓の中に見える部分だけを数える。
 * 図の頭の箱は窓の上の頭の列の裏で窓の上端より上に出る (#3120) が、切り抜かれて見えない。
 * 重なりは 0.5px までを許す。2 回続けて同じ値を読めた時だけ返す
 */
const editorTopOf = (
  page: Page,
): Promise<{ badge: string | null; pad: number; above: number; code: number; underTools: number; overTop: number; kept: boolean; covered: number } | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const read = () => {
      const stage = document.querySelector('[data-playground="stage"]');
      const tools = stage?.querySelector(".pg-stage-bar");
      const frameEl = stage?.querySelector<HTMLElement>(".dg-frame");
      const foot = stage?.querySelector(".pg-stage-foot");
      const svg = frameEl?.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
      const clip = svg?.querySelector('clipPath[id^="dg-vp-"] rect');
      const ctm = svg?.getScreenCTM();
      const corner = (x: number, y: number): DOMPoint => new DOMPoint(x, y).matrixTransform(ctm ?? undefined);
      const win = clip && ctm ? [corner(0, 0), corner(Number(clip.getAttribute("width")), Number(clip.getAttribute("height")))] : null;
      const seenPart = (b: DOMRect): DOMRect => {
        if (!win) return b;
        const [a, z] = win as [DOMPoint, DOMPoint];
        const left = Math.max(b.left, a.x);
        const top = Math.max(b.top, a.y);
        return new DOMRect(left, top, Math.min(b.right, z.x) - left, Math.min(b.bottom, z.y) - top);
      };
      const boxes = [...(svg?.querySelectorAll("rect.dg-st") ?? [])].map((r) => seenPart(r.getBoundingClientRect())).filter((b) => b.width > 0 && b.height > 0);
      if (!tools || !frameEl || !foot || boxes.length === 0) return null;
      const badge = stage?.querySelector<HTMLElement>('[data-playground="phase-badge"]');
      const kept = stage?.querySelector(".pg-kept");
      const t = tools.getBoundingClientRect();
      const f = frameEl.getBoundingClientRect();
      const pad = Number.parseFloat(getComputedStyle(frameEl).paddingTop);
      const hit = (a: DOMRect, b: DOMRect): boolean => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      const keptBox = kept?.checkVisibility() ? kept.getBoundingClientRect() : null;
      return {
        badge: badge?.checkVisibility() ? (badge.textContent?.trim() ?? "") : null,
        pad: Math.round(pad),
        above: Math.round(f.top + pad - t.bottom),
        code: Math.round(innerHeight - foot.getBoundingClientRect().bottom),
        underTools: boxes.filter((b) => hit(b, t)).length,
        overTop: boxes.filter((b) => b.top < f.top + pad - 0.5).length,
        kept: keptBox !== null,
        covered: keptBox ? boxes.filter((b) => hit(b, keptBox)).length : 0,
      };
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  });

/** 段の札の字が、見本 `key` のどれかの段の `段 {N} / {全体} · {題}` と同じか */
const badgeOfSample = (text: string | null | undefined, key: ExampleKey): boolean => {
  const parsed = parseNotation(exampleText(key, "ja"));
  const titles = parsed.ok ? parsed.diagram.steps.map((s) => s.title) : [];
  return titles.length > 1 && titles.some((title, i) => TEXT.ja.stage.phase(i + 1, titles.length, title) === text);
};

/** 編集画面の道具の帯の道具。左から今の並び (#3063) */
const STAGE_TOOLS = ["font-down", "font-up", "grid", "fullscreen", "fit", "zoom-out", "zoom-in", "zoom-level"] as const;

/** 携帯の幅の道具の帯の道具。合わせるの釦を出さず、倍率を縮小と拡大の間の釦にする (#3065) */
const PHONE_TOOLS = ["font-down", "font-up", "grid", "fullscreen", "zoom-out", "zoom-level", "zoom-in"] as const;

/** 記法の欄の上の帯の部品。左から今の並び (#3065) */
const CODE_PARTS = ["shelf-toggle", "tab-notation", "tab-json", "file-name", "import", "export", "fold"] as const;

/** 道具の帯を確かめる見本。図を枠に合わせて描く intro と、携帯の幅で寄って追う窓で描く oauth */
const TOOL_SAMPLES = ["intro", "oauth"] as const satisfies readonly ExampleKey[];

/**
 * 編集画面の道具の帯 (#3063)。帯を横に送る分の幅、見えている部品の名前の並び (実況表示の札は `live`、色味の丸と道具は `data-playground` の名前)、
 * 見えていて帯の中に収まらない部品、倍率の字。2 回続けて同じ値を読めた時だけ返す
 */
const toolsOf = (page: Page): Promise<{ hidden: number; shown: string[]; cut: string[]; level: string } | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const read = () => {
      const stage = document.querySelector('[data-playground="stage"]');
      const bar = stage?.querySelector(".pg-stage-bar");
      if (!bar || !stage?.querySelector('svg[data-dragon="figure"]')) return null;
      const b = bar.getBoundingClientRect();
      const parts = [...bar.querySelectorAll<HTMLElement>(".pg-live, [data-playground]")].filter((el) => el.checkVisibility());
      const name = (el: HTMLElement): string => (el.classList.contains("pg-live") ? "live" : (el.dataset.playground ?? ""));
      return {
        hidden: bar.scrollWidth - bar.clientWidth,
        shown: parts.map(name),
        cut: parts
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left < b.left - 0.5 || r.right > b.right + 0.5;
          })
          .map(name),
        level: bar.querySelector('[data-playground="zoom-level"]')?.textContent?.trim() ?? "",
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
 * 編集画面の 2 つの帯 (道具の帯と記法の欄の上の帯) の押せる部品 (#3065)。部品ごとに `data-playground` の名前、四捨五入しない幅と高さ (#3085)、
 * 四隅から 2px 内側 (角の丸み 3px の外を避ける) を押した時にその部品に当たるか。帯を画面に入れてから読み、2 回続けて同じ値を読めた時だけ返す
 */
const targetsOf = (page: Page): Promise<{ name: string; width: number; height: number; corners: boolean }[] | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const bars = [...document.querySelectorAll<HTMLElement>(".pg-stage-bar, .pg-bar")];
    const read = () => {
      if (bars.length !== 2 || !document.querySelector('[data-playground="stage"] svg[data-dragon="figure"]')) return null;
      return bars.flatMap((bar) => {
        // 一番近い端へ送ると、図が高く頁が送れる時に、画面の上に貼り付く上の帯の下に入る (#3270)
        bar.scrollIntoView({ block: "center" });
        return [...bar.querySelectorAll<HTMLElement>("button[data-playground], input[data-playground]")]
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
            return { name: el.dataset.playground ?? "", width: r.width, height: r.height, corners };
          });
      });
    };
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return first && second && JSON.stringify(first) === JSON.stringify(second) ? second : null;
  });

/** 記法の欄の上の帯を送る分の幅、見えている部品の名前の並び、帯の中に収まらない部品 (#3065) */
const codeBarOf = (page: Page): Promise<{ hidden: number; shown: string[]; cut: string[] } | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const bar = document.querySelector(".pg-bar");
    if (!bar) return null;
    const b = bar.getBoundingClientRect();
    const parts = [...bar.querySelectorAll<HTMLElement>("[data-playground]")].filter((el) => el.checkVisibility());
    return {
      hidden: bar.scrollWidth - bar.clientWidth,
      shown: parts.map((el) => el.dataset.playground ?? ""),
      cut: parts
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.left < b.left - 0.5 || r.right > b.right + 0.5;
        })
        .map((el) => el.dataset.playground ?? ""),
    };
  });

/**
 * 編集画面の棚の押せる部品 (#3077)。部品ごとに `data-playground` の名前、四捨五入しない幅と高さ (#3085)、四隅から 2px 内側を押した時にその部品に当たるか。
 * 部品を画面に入れてから読み、2 回続けて同じ値を読めた時だけ返す
 */
const shelfTargetsOf = (page: Page): Promise<{ name: string; width: number; height: number; corners: boolean }[] | null> =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const read = () =>
      [...document.querySelectorAll<HTMLElement>('[data-playground="shelf"] :is(button, input)[data-playground]')]
        .filter((el) => el.checkVisibility())
        .map((el) => {
          el.scrollIntoView({ block: "nearest" });
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
          return { name: el.dataset.playground ?? "", width: r.width, height: r.height, corners };
        });
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const first = read();
    await frame();
    await frame();
    const second = read();
    return JSON.stringify(first) === JSON.stringify(second) ? second : null;
  });

/** 指で触る端末を模して編集画面を確かめる画面の大きさ。768 と 1024 は棚を畳む幅、1366 は棚を横に並べる幅 (#3077) */
const TOUCH_EDITOR_SIZES = [
  { width: 768, height: 1024 },
  { width: 1024, height: 1366 },
  { width: 1366, height: 1024 },
] as const;

/** 棚を畳む幅では棚を開く釦で開き、開き終えるまで待つ (#3077) */
const openShelf = async (page: Page, where: string): Promise<void> => {
  const toggle = page.locator('[data-playground="shelf-toggle"]');
  if (!(await toggle.isVisible())) return;
  await toggle.click();
  await expect.poll(() => page.locator('[data-playground="shelf"]').getAttribute("data-open"), { ...WAIT, message: `${where} で、棚を開く釦で棚が開かない` }).toBe("on");
};

/**
 * 編集画面を読むだけの件 (#3435)。頁の状態 (倍率、記法、言語、札、畳み、棚、色味、段) を変えないので、
 * 画面の大きさと指で触るかが同じ件は、1 度開いた編集画面に見本を棚から読んで順に使える
 */
const READER_CHECKS = [
  "narrow-editor-hides-phase-badge",
  "narrow-editor-step-buttons-on-first-screen",
  "narrow-editor-figure-starts-higher",
  "narrow-editor-figure-clear-of-toolbar",
  "wide-editor-keeps-phase-badge",
  "narrow-editor-tools-fit-one-row",
  "narrow-editor-tools-hide-live-and-swatches",
  "narrow-editor-bars-touch-targets",
  "wide-editor-tools-keep-all",
  "wide-editor-bars-keep-size",
  "coarse-editor-tools-drop-when-narrow",
  "mouse-tablet-editor-keeps-size",
] as const;

/** 2 つの帯の並びと大きさを確かめる、440px 以上の編集画面の大きさ (#3063、#3065) */
const WIDE_EDITOR_SIZES = [
  { width: 560, height: 900 },
  { width: 1440, height: 900 },
] as const;

/** 読むだけの件を回す編集画面の設定 (#3435) */
interface ReaderSetting {
  viewport: { width: number; height: number };
  touch: boolean;
}

/** 設定の組の名前。頁を開いた回数もこの名前で数える (#3435) */
const settingLabel = (s: ReaderSetting): string => `${s.viewport.width} × ${s.viewport.height}${s.touch ? " 指で触る" : ""}`;

const mouse = (viewport: { width: number; height: number }): ReaderSetting => ({ viewport, touch: false });
const finger = (viewport: { width: number; height: number }): ReaderSetting => ({ viewport, touch: true });

/** 読むだけの件の 1 回分 (#3435)。`sub` は、同じ設定の中で件を見本ごとに分ける時の組の名前 */
interface ReaderCase {
  check: (typeof READER_CHECKS)[number];
  setting: ReaderSetting;
  sub?: string;
  run: (page: Page) => Promise<void>;
}

/**
 * 使い回す編集画面に見本 `key` を棚から読み、頁を上端へ戻す (#3435)。
 * 棚を開く釦は記法の欄の上の帯に在り、押すと頁がそこまで送られるので、開き直した頁と同じく最初の画面から読めるよう上端へ戻す
 */
const showReading = async (page: Page, key: ExampleKey): Promise<void> => {
  await showInEditor(page, key);
  await page.evaluate(() => scrollTo({ top: 0, left: 0, behavior: "instant" }));
};

/** 読むだけの件。件の名前ごとに、確かめる設定と見本を並べる (#3435) */
const READER_CASES: readonly ReaderCase[] = [
  // 携帯の幅の編集画面では、段の札がすぐ下の段の本文の帯と同じ番号と題を 2 回並べ、枠の上に 48px を取っていた (#3061)
  ...PHONES.map(
    (viewport): ReaderCase => ({
      check: "narrow-editor-hides-phase-badge",
      setting: mouse(viewport),
      run: async (page) => {
        for (const sample of CAPTION_SAMPLES) {
          await showReading(page, sample.key);
          await expect
            .poll(async () => (await editorTopOf(page))?.badge, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${sample.key} で、段の札が見える` })
            .toBeNull();
        }
      },
    }),
  ),
  // 表を窓の下へ移して図が高くなり、幅 360px では段を送る釦が最初の画面の外に出た (#3274)
  ...PHONES.slice(0, 2).flatMap((viewport) =>
    EXAMPLE_KEYS.map(
      (key): ReaderCase => ({
        check: "narrow-editor-step-buttons-on-first-screen",
        setting: mouse(viewport),
        sub: key,
        run: async (page) => {
          await showReading(page, key);
          await expect
            .poll(
              () =>
                page.evaluate(() => {
                  const next = document.querySelector('[data-playground="stage"] [data-dragon="next"]')?.getBoundingClientRect();
                  return next ? next.bottom <= innerHeight && scrollY === 0 : null;
                }),
              { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${key} で、段を送る釦が最初の画面の外に在る` },
            )
            .toBe(true);
        },
      }),
    ),
  ),
  // 札を出さない分だけ図の枠の上の余白が詰まり、記法の欄が最初の画面に多く見える (#3061)。
  // 比べる値は #3061 より前の値から、値の表を窓の下に置いて図が高くなった分を引いた値 (#3270)。
  // 図の高さは oauth が 320px から 488px、ccip が 360px の枠で 440px から 597px、390px の枠で 447px から 602px になった
  ...PHONES.slice(0, 2).map(
    (viewport): ReaderCase => ({
      check: "narrow-editor-figure-starts-higher",
      setting: mouse(viewport),
      run: async (page) => {
        const before = {
          "360 × 780": { oauth: 93 - 168, ccip: -41 - 157 },
          "390 × 844": { oauth: 163 - 168, ccip: 16 - 155 },
        } as const;
        const size = `${viewport.width} × ${viewport.height}` as keyof typeof before;
        for (const sample of CAPTION_SAMPLES) {
          await showReading(page, sample.key);
          const code = before[size][sample.key];
          await expect
            .poll(async () => {
              const seen = await editorTopOf(page);
              // 道具の帯から図の枠の中までは枠の上の余白の 16px。広がると記法の欄が下へ押される (#3101)
              return seen && { above: Math.round(seen.above), more: seen.code > code };
            }, { ...WAIT, message: `${size} の編集画面の ${sample.key} で、道具の帯と図の枠の中の間が 16px でないか、見える記法の欄が ${code}px より高くならない` })
            .toEqual({ above: 16, more: true });
        }
      },
    }),
  ),
  // 枠の上の余白を詰めても、図の箱は道具の帯に重ならず、図の枠の中の上端より上に出ない (#3061)
  ...PHONES.map(
    (viewport): ReaderCase => ({
      check: "narrow-editor-figure-clear-of-toolbar",
      setting: mouse(viewport),
      run: async (page) => {
        for (const sample of CAPTION_SAMPLES) {
          await showReading(page, sample.key);
          await expect
            .poll(async () => {
              const seen = await editorTopOf(page);
              return seen && { underTools: seen.underTools, overTop: seen.overTop };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${sample.key} で、図の箱が道具の帯に重なるか、図の枠の中の上端より上に出る` })
            .toEqual({ underTools: 0, overTop: 0 });
        }
      },
    }),
  ),
  // 440px 以上の編集画面は、今と同じく段の札を出し、枠の上に 48px を取る (#3061)
  ...WIDE_EDITOR_SIZES.map(
    (viewport): ReaderCase => ({
      check: "wide-editor-keeps-phase-badge",
      setting: mouse(viewport),
      run: async (page) => {
        for (const sample of CAPTION_SAMPLES) {
          await showReading(page, sample.key);
          await expect
            .poll(async () => {
              const seen = await editorTopOf(page);
              return seen && { badge: badgeOfSample(seen.badge, sample.key), pad: seen.pad };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${sample.key} で、段の札が出ないか、枠の上の余白が 48px でない` })
            .toEqual({ badge: true, pad: 48 });
        }
      },
    }),
  ),
  // 携帯の幅の道具の帯は並べるのに 487px 要り、拡大の釦と倍率が画面の外に出て、帯を送れることも分からなかった (#3063)。
  // 合わせるの釦は倍率の釦が持つ (#3065)
  ...PHONES.map(
    (viewport): ReaderCase => ({
      check: "narrow-editor-tools-fit-one-row",
      setting: mouse(viewport),
      run: async (page) => {
        for (const key of TOOL_SAMPLES) {
          await showReading(page, key);
          await expect
            .poll(async () => {
              const seen = await toolsOf(page);
              return seen && { scrolls: seen.hidden > 0, tools: PHONE_TOOLS.every((tool) => seen.shown.includes(tool)), cut: seen.cut };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${key} で、道具の帯を送る分が残るか、道具が帯からはみ出す` })
            .toEqual({ scrolls: false, tools: true, cut: [] });
        }
      },
    }),
  ),
  // 携帯の幅では実況表示の札と色味の丸を出さず、道具を 1 列に収める。色味は上の帯の切替で替える (#3063)
  ...PHONES.map(
    (viewport): ReaderCase => ({
      check: "narrow-editor-tools-hide-live-and-swatches",
      setting: mouse(viewport),
      run: async (page) => {
        await showReading(page, "intro");
        await expect
          .poll(async () => {
            const seen = await toolsOf(page);
            return seen && { live: seen.shown.includes("live"), swatches: seen.shown.filter((n) => n.startsWith("palette-")) };
          }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面で、実況表示の札か色味の丸が見える` })
          .toEqual({ live: false, swatches: [] });
      },
    }),
  ),
  // 携帯の幅の 2 つの帯の釦は 30 × 30px で隣との間が 4px しか無く、指で隣を押し違えやすかった (#3065)。指で押す的の目安は 44 × 44px
  ...PHONES.flatMap((viewport) =>
    TOOL_SAMPLES.map(
      (key): ReaderCase => ({
        check: "narrow-editor-bars-touch-targets",
        setting: mouse(viewport),
        sub: key,
        run: async (page) => {
          const required = [...PHONE_TOOLS, ...CODE_PARTS];
          await showReading(page, key);
          await expect
            .poll(async () => {
              const parts = await targetsOf(page);
              return (
                parts && {
                  missing: required.filter((name) => !parts.some((p) => p.name === name)),
                  small: parts.filter((p) => p.width < 44 || p.height < 44 || !p.corners).map((p) => `${p.name} ${p.width}x${p.height}${p.corners ? "" : " 隅が外れる"}`),
                }
              );
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${key} で、押せる部品が揃わないか、44px に届かない部品がある` })
            .toEqual({ missing: [], small: [] });
          // 書類名の欄の最小の幅が効くよう、欄が最も縮む 360px で比べる
          if (viewport === PHONES[0] && key === TOOL_SAMPLES[0]) {
            await expectSizes(() => targetsOf(page), `${viewport.width} × ${viewport.height} の編集画面の ${key} の 2 つの帯`, [
              "shelf-toggle 44x44",
              "tab-notation 44x44",
              "tab-json 47x44",
              "file-name 48x44",
              "import 44x44",
              "export 44x44",
              "fold 52x44",
              "font-down 44x44",
              "font-up 44x44",
              "grid 44x44",
              "fullscreen 44x44",
              "zoom-out 44x44",
              "zoom-level 44x44",
              "zoom-in 44x44",
            ]);
          }
        },
      }),
    ),
  ),
  // 440px 以上の編集画面の道具の帯は、実況表示の札と色味の丸と道具を今と同じ並びで 1 列に出す (#3063)
  ...WIDE_EDITOR_SIZES.map(
    (viewport): ReaderCase => ({
      check: "wide-editor-tools-keep-all",
      setting: mouse(viewport),
      run: async (page) => {
        const all = ["live", ...PALETTE_IDS.map((id) => `palette-${id}`), ...STAGE_TOOLS];
        for (const key of TOOL_SAMPLES) {
          await showReading(page, key);
          await expect
            .poll(async () => {
              const seen = await toolsOf(page);
              return seen && { scrolls: seen.hidden > 0, shown: seen.shown, cut: seen.cut };
            }, { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面の ${key} で、道具の帯の並びが今と違うか、帯からはみ出す` })
            .toEqual({ scrolls: false, shown: all, cut: [] });
        }
      },
    }),
  ),
  // 440px 以上の編集画面の 2 つの帯は、部品の大きさを今のまま保ち、倍率を字で出す (#3065)
  ...WIDE_EDITOR_SIZES.map(
    (viewport): ReaderCase => ({
      check: "wide-editor-bars-keep-size",
      setting: mouse(viewport),
      run: async (page) => {
        await showReading(page, "intro");
        await expect
          .poll(
            () =>
              page.evaluate(async () => {
                await document.fonts.ready;
                const visible = (sel: string): Element[] => [...document.querySelectorAll(sel)].filter((el) => el.checkVisibility());
                const height = (el: Element | null): number | null => (el ? Math.round(el.getBoundingClientRect().height) : null);
                return {
                  tools: [
                    ...new Set(
                      visible(".pg-stage-bar .pg-tool, .pg-bar .pg-tool").map((el) => {
                        const r = el.getBoundingClientRect();
                        return `${Math.round(r.width)}x${Math.round(r.height)}`;
                      }),
                    ),
                  ],
                  tabs: visible('.pg-bar [role="tab"]').map(height),
                  file: height(document.querySelector('.pg-bar [data-playground="file-name"]')),
                  level: document.querySelector('.pg-stage-bar [data-playground="zoom-level"]')?.tagName.toLowerCase() ?? null,
                };
              }),
            { ...WAIT, message: `${viewport.width} × ${viewport.height} の編集画面で、2 つの帯の部品の大きさが今と違うか、倍率が字で出ない` },
          )
          .toEqual({ tools: ["30x30"], tabs: [27, 27], file: 26, level: "span" });
      },
    }),
  ),
  // 指で触る時は道具の帯の部品を 44px にするので、帯の幅が 730px より狭い時は携帯の幅と同じく実況表示の札と色味の丸を外す。
  // 外すかは画面の幅でなく帯の幅で決める。1180 × 820 は棚を横に並べて帯が狭くなる (#3077)。
  // 色味の丸が 4 つになると英語で 726px 要り、帯が 724px の 1024 × 1366 でも外す。色味は見出しの帯の切替で替える (#3341)
  ...(
    [
      [{ width: 768, height: 1024 }, false],
      [{ width: 1180, height: 820 }, false],
      [{ width: 1024, height: 1366 }, false],
      [{ width: 1366, height: 1024 }, true],
    ] as const
  ).map(
    ([viewport, keepsAll]): ReaderCase => ({
      check: "coarse-editor-tools-drop-when-narrow",
      setting: finger(viewport),
      run: async (page) => {
        const shown = keepsAll ? ["live", ...PALETTE_IDS.map((id) => `palette-${id}`), ...STAGE_TOOLS] : [...STAGE_TOOLS];
        await showReading(page, "intro");
        await expect
          .poll(async () => (await toolsOf(page))?.shown, { ...WAIT, message: `指で触る ${viewport.width} × ${viewport.height} の編集画面で、道具の帯の並びが違う` })
          .toEqual(shown);
      },
    }),
  ),
  // マウスで使う時は、768px でも編集画面の棚と 2 つの帯の部品は今の大きさのまま (#3077)
  ...[{ width: 768, height: 1024 }, WIDE_EDITOR_SIZES[1]].map(
    (viewport): ReaderCase => ({
      check: "mouse-tablet-editor-keeps-size",
      setting: mouse(viewport),
      run: async (page) => {
        await showReading(page, "intro");
        await expect
          .poll(
            () =>
              page.evaluate(async () => {
                await document.fonts.ready;
                const all = (sel: string): Element[] => [...document.querySelectorAll(sel)].filter((el) => el.checkVisibility());
                const sizes = (sel: string): string[] => [
                  ...new Set(
                    all(sel).map((el) => {
                      const r = el.getBoundingClientRect();
                      return `${Math.round(r.width)}x${Math.round(r.height)}`;
                    }),
                  ),
                ];
                const heights = (sel: string): number[] => [...new Set(all(sel).map((el) => Math.round(el.getBoundingClientRect().height)))];
                return {
                  tools: sizes(".pg-stage-bar .pg-tool, .pg-bar .pg-tool"),
                  swatches: sizes('.pg-stage-bar [data-playground^="palette-"]'),
                  // 倍率の字は桁が変わってもぶれないよう幅を取っておく (#3095)
                  zoom: sizes('.pg-stage-bar [data-playground="zoom-level"]'),
                  tabs: heights('.pg-bar [role="tab"]'),
                  file: heights('.pg-bar [data-playground="file-name"]'),
                  shelf: {
                    new: heights('[data-playground="new-file"]'),
                    tabs: heights('[data-playground^="shelf-tab-"]'),
                    filter: heights('[data-playground="shelf-filter"]'),
                    items: heights('[data-playground^="sample-"]'),
                  },
                };
              }),
            { ...WAIT, message: `マウスで使う ${viewport.width} × ${viewport.height} の編集画面で、棚か 2 つの帯の部品の大きさが今と違う` },
          )
          .toEqual({ tools: ["30x30"], swatches: ["16x16"], zoom: ["55x18"], tabs: [27], file: [26], shelf: { new: [41], tabs: [39], filter: [34], items: [35] } });
      },
    }),
  ),
];

/** 読むだけの件を、設定の組ごとに、組が初めて出た順に束ねる (#3435) */
const READER_GROUPS = ((): { label: string; setting: ReaderSetting; cases: ReaderCase[] }[] => {
  const groups = new Map<string, { label: string; setting: ReaderSetting; cases: ReaderCase[] }>();
  for (const c of READER_CASES) {
    const label = settingLabel(c.setting);
    const group = groups.get(label) ?? { label, setting: c.setting, cases: [] };
    group.cases.push(c);
    groups.set(label, group);
  }
  return [...groups.values()];
})();

describe("編集画面の幅と指の操作 (#3061)", () => {
  useSite();
  // 読むだけの件が編集画面を開いた回数を、画面の大きさと指で触るかの組ごとに数える (#3435)
  const readerOpens = countOpens(READER_CHECKS, (o) =>
    o.path?.startsWith(`${BASE}editor`) && o.viewport ? settingLabel({ viewport: o.viewport, touch: o.touch ?? false }) : undefined,
  );

  // 読むだけの件は、設定の組ごとに 1 度開いた編集画面に、見本を棚から読んで順に回す (#3435)。
  // 件が落ちると使い回す道具がその頁を閉じ、同じ組の次の件は開き直した頁で回る
  describe("読むだけの件 (#3435)", () => {
    const readerPages: PageGroups<Page> = pageGroups<Page>((page) => page.context().close());
    afterAll(() => readerPages.close());
    for (const group of READER_GROUPS) {
      describe(group.label, () => {
        for (const c of group.cases) {
          const run = async ({ onTestFailed }: TestContext): Promise<void> => {
            const page = await readerPages.get(group.label, () => openKeptEditor(group.setting.viewport, group.setting.touch), onTestFailed);
            await c.run(page);
          };
          if (c.sub === undefined) it(c.check, run);
          else describe(c.sub, () => it(c.check, run));
        }
      });
    }
  });


  it(
    "narrow-editor-kept-notice-keeps-room",
    async () => {
      // 記法に誤りがあり前の図を出している間は、その旨の札のために枠の上の余白を今のまま取る (#3061)
      const viewport = { width: 390, height: 844 };
      for (const sample of CAPTION_SAMPLES) {
        const broken = `${exampleText(sample.key, "ja")}\n!!! 読めない行\n`;
        expect(parseNotation(broken).ok, "検査に使う記法が誤りにならない").toBe(false);
        const page = await openEditor(viewport, sample.key, true);
        await expect.poll(async () => (await editorTopOf(page))?.kept, { ...WAIT, message: `編集画面の ${sample.key} の図が描かれない` }).toBe(false);
        await page.locator('[data-playground="editor"]').fill(broken);
        await expect
          .poll(async () => {
            const seen = await editorTopOf(page);
            return seen && { kept: seen.kept, pad: seen.pad, covered: seen.covered };
          }, { ...WAIT, message: `390 × 844 の編集画面の ${sample.key} で、前の図を出している旨の札が出ないか、枠の上の余白が 48px でないか、札が箱に重なる` })
          .toEqual({ kept: true, pad: 48, covered: 0 });
      }
    },
  );


  // 頭の列を 2 段にした時、携帯の幅の編集画面で前の図を出している旨の札が頭の列の箱に重なった (#3120)。
  // 頭の列が出る全部の幅と段で、ふだんの状態と前の図を出している状態のどちらでも、頭の列に頁の部品が重ならない (#3126)
  describe.for(([...PHONES, { width: 860, height: 960 }]).flatMap((viewport) => ([false, true]).map((kept) => ({ viewport, kept }))))("$viewport.width × $viewport.height $kept", ({ viewport, kept }) => {
    it("editor-heads-strip-uncovered", async () => {
      const scope = '[data-playground="stage"]';
      const broken = `${exampleText("oauth", "ja")}\n!!! 読めない行\n`;
      expect(parseNotation(broken).ok, "検査に使う記法が誤りにならない").toBe(false);
      const where = `${viewport.width} × ${viewport.height} の oauth の編集画面${kept ? "で前の図を出している間" : ""}`;
      const page = await openEditor(viewport, "oauth", true);
      await expect.poll(() => stripCoveredOf(page, scope), { ...WAIT, message: `${where}、頭の列が描かれない` }).not.toBeNull();
      if (kept) {
        await page.locator('[data-playground="editor"]').fill(broken);
        await expect.poll(() => page.locator(".pg-kept").isVisible(), { ...WAIT, message: `${where}、その旨の札が出ない` }).toBe(true);
        // 記法の欄に書くと頁が欄まで送られるので、図の側を画面の上へ戻す
        await page.evaluate(() => scrollTo(0, 0));
      }
      const steps = Number((await page.locator(`${scope} [data-dragon="step-no"]`).textContent())?.split("/")[1]);
      expect(steps, `${where}、段の数が読めない`).toBeGreaterThan(1);
      for (let s = 0; s < steps; s++) {
        const step = `${String(s + 1).padStart(2, "0")}/${String(steps).padStart(2, "0")}`;
        await expect
          .poll(() => stripCoveredOf(page, scope), { ...WAIT, message: `${where}の ${s + 1} 段目で、頭の列が無いか、画面の外に出るか、頭の列に頁の部品が重なる` })
          .toEqual({ step, points: 39, covered: [] });
        if (s < steps - 1) await page.locator(`${scope} [data-dragon="next"]`).click();
      }
    });
  });


  it(
    "catalog-preview-keeps-phase-badge",
    async () => {
      // カタログの頁の見本の枠では帯が段の題を出さないので、携帯の幅でも札を出す (#3061)
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 1440, height: 900 },
      ]) {
        for (const sample of CAPTION_SAMPLES) {
          const page = await openItem(viewport, sample);
          await expect
            .poll(
              async () =>
                badgeOfSample(
                  await page.evaluate(() => {
                    const badge = document.querySelector<HTMLElement>('[data-catalog="preview"] [data-catalog="phase-badge"]');
                    return badge?.checkVisibility() ? (badge.textContent?.trim() ?? "") : null;
                  }),
                  sample.key,
                ),
              { ...WAIT, message: `${viewport.width} × ${viewport.height} のカタログの頁の ${sample.key} の見本の枠で、段の札が出ない` },
            )
            .toBe(true);
        }
      }
    },
  );


  it(
    "narrow-editor-tools-zoom-works",
    async () => {
      // 携帯の幅でも、図を枠に合わせて描く見本では拡大と縮小が働き、頁は横にあふれない (#3063)。
      // 合わせるは倍率の釦が持ち、`narrow-editor-zoom-level-fits` が確かめる (#3065)
      const page = await openEditor({ width: 360, height: 780 }, "intro", true);
      const level = async (): Promise<number> => Number.parseInt((await toolsOf(page))?.level ?? "", 10);
      const overflows = (): Promise<boolean> => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      await expect.poll(level, { ...WAIT, message: "360 × 780 の編集画面の intro で、倍率が出ない" }).toBeGreaterThan(0);
      const base = await level();
      await page.locator('[data-playground="zoom-in"]').click();
      await expect.poll(level, { ...WAIT, message: "拡大の釦で倍率が上がらない" }).toBeGreaterThan(base);
      const larger = await level();
      expect(await overflows(), "拡大すると頁が横にあふれる").toBe(false);
      await page.locator('[data-playground="zoom-out"]').click();
      await expect.poll(level, { ...WAIT, message: "縮小の釦で倍率が下がらない" }).toBeLessThan(larger);
      expect(await overflows(), "頁が横にあふれる").toBe(false);
    },
  );


  it(
    "narrow-editor-zoom-level-fits",
    async () => {
      // 44px の釦を 1 列に収めるため、携帯の幅では合わせるの釦を出さず、倍率を縮小と拡大の間の釦にして、押すと枠に合わせる (#3065)
      for (const viewport of PHONES) {
        const page = await openEditor(viewport, "intro", true);
        const where = `${viewport.width} × ${viewport.height} の編集画面の intro`;
        await expect.poll(async () => (await toolsOf(page))?.shown, { ...WAIT, message: `${where} で、道具の帯の並びが違う` }).toEqual([...PHONE_TOOLS]);
        const level = async (): Promise<number> => Number.parseInt((await toolsOf(page))?.level ?? "", 10);
        const base = await level();
        expect(base, `${where} で、倍率が出ない`).toBeGreaterThan(0);
        await page.locator('[data-playground="zoom-in"]').click();
        await expect.poll(level, { ...WAIT, message: `${where} で、拡大の釦で倍率が上がらない` }).toBeGreaterThan(base);
        await page.locator('[data-playground="zoom-level"]').click();
        await expect.poll(level, { ...WAIT, message: `${where} で、倍率の釦で元の倍率に戻らない` }).toBe(base);
      }
      const page = await openEditor({ width: 360, height: 780 }, "oauth", true);
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const el = document.querySelector('[data-playground="stage"] svg[data-dragon="figure"]') && document.querySelector('.pg-stage-bar [data-playground="zoom-level"]');
              return el ? { button: el instanceof HTMLButtonElement, disabled: el instanceof HTMLButtonElement && el.disabled, text: el.textContent?.trim() ?? "" } : null;
            }),
          { ...WAIT, message: "360 × 780 の編集画面の oauth で、倍率が押せない状態の釦でないか、「—」を出さない" },
        )
        .toEqual({ button: true, disabled: true, text: "—" });
    },
  );


  it(
    "narrow-editor-code-bar-works",
    async () => {
      // 携帯の幅で記法の欄の上の帯の部品を 44px にしても、1 列に収まり、切替の札と畳むの釦が今と同じに働く (#3065)
      for (const viewport of PHONES) {
        const page = await openEditor(viewport, "intro", true);
        const where = `${viewport.width} × ${viewport.height} の編集画面`;
        await expect
          .poll(async () => {
            const seen = await codeBarOf(page);
            return seen && { scrolls: seen.hidden > 0, shown: seen.shown, cut: seen.cut };
          }, { ...WAIT, message: `${where} で、記法の欄の上の帯を送る分が残るか、部品が揃わないか、帯からはみ出す` })
          .toEqual({ scrolls: false, shown: [...CODE_PARTS], cut: [] });
        await page.locator('[data-playground="tab-json"]').click();
        await expect
          .poll(() => page.locator('[data-playground="editor"]').inputValue(), { ...WAIT, message: `${where} で、JSON の札で JSON の側に替わらない` })
          .toMatch(/^\s*\{/);
        await page.locator('[data-playground="fold"]').click();
        await expect
          .poll(() => page.evaluate(() => document.querySelector<HTMLElement>(".pg-code-body")?.hidden ?? null), { ...WAIT, message: `${where} で、畳むの釦で書く欄が畳まれない` })
          .toBe(true);
      }
    },
  );


  it(
    "narrow-editor-site-palette-recolors-figure",
    async () => {
      // 携帯の幅では編集画面の色味の丸を出さないので、上の帯の畳んだ面の切替で図の色味を替える (#3063)
      const { page } = await site.open({ path: `${BASE}editor${toHash(exampleText("oauth", "ja"))}`, viewport: { width: 390, height: 844 }, colorScheme: "light" });
      await onScreen(page, "editor", "390 × 844 で編集画面が出ない");
      await expect.poll(() => figureLooks(page, '[data-playground="stage"]'), { ...WAIT, message: "編集画面の図が紙と墨で描かれない" }).toEqual([figureLook("paper", "light")]);
      await page.locator(siteSel("menu")).click();
      await page.locator(`${siteSel("sheet-palette")} ${siteSel("palette-night")}`).click();
      await expect
        .poll(() => figureLooks(page, '[data-playground="stage"]'), { ...WAIT, message: "畳んだ面の色味の切替で、編集画面の図が夜の計器で描かれない" })
        .toEqual([figureLook("night", "light")]);
    },
  );


  // 指で触るタブレットの編集画面は、棚と 2 つの帯の部品が 16 から 41px で指で押し違えやすかった (#3077)。指で触る時は幅に関わらず 44 × 44px にする
  describe.for([{ width: 360, height: 780 }, ...TOUCH_EDITOR_SIZES])("$width × $height", (viewport) => {
    it("coarse-editor-touch-targets", async () => {
      const where = `指で触る ${viewport.width} × ${viewport.height} の編集画面`;
      const page = await openEditor(viewport, "intro", true, true);
      const short = (parts: { name: string; width: number; height: number; corners: boolean }[]): string[] =>
        parts.filter((p) => p.width < 44 || p.height < 44 || !p.corners).map((p) => `${p.name} ${p.width}x${p.height}${p.corners ? "" : " 隅が外れる"}`);
      await expect
        .poll(async () => {
          const parts = await targetsOf(page);
          return parts && { some: parts.length > 0, small: short(parts) };
        }, { ...WAIT, message: `${where}の 2 つの帯で、部品が無いか、44px に届かない部品がある` })
        .toEqual({ some: true, small: [] });
      if (viewport === TOUCH_EDITOR_SIZES[0]) {
        await expectSizes(() => targetsOf(page), `${where}の 2 つの帯`, [
          "shelf-toggle 44x44",
          "tab-notation 44x44",
          "tab-json 44x44",
          "file-name 63x44",
          "import 44x44",
          "export 44x44",
          "font-down 44x44",
          "font-up 44x44",
          "grid 44x44",
          "fullscreen 44x44",
          "fit 44x44",
          "zoom-out 44x44",
          "zoom-in 44x44",
        ]);
      }
      // 色味の丸は道具の帯が 730px 以上の時だけ出る (#3077、#3341)
      if (viewport === TOUCH_EDITOR_SIZES[2]) {
        await expectSizes(() => targetsOf(page), `${where}の 2 つの帯`, [
          "tab-notation 44x44",
          "tab-json 44x44",
          "file-name 109x44",
          "import 44x44",
          "export 44x44",
          "palette-clear 44x44",
          "palette-paper 44x44",
          "palette-night 44x44",
          "palette-arcade 44x44",
          "palette-sea 44x44",
          "font-down 44x44",
          "font-up 44x44",
          "grid 44x44",
          "fullscreen 44x44",
          "fit 44x44",
          "zoom-out 44x44",
          "zoom-in 44x44",
        ]);
      }
      await openShelf(page, where);
      await expect
        .poll(async () => {
          const parts = await shelfTargetsOf(page);
          return parts && { some: parts.some((p) => p.name.startsWith("sample-")), small: short(parts) };
        }, { ...WAIT, message: `${where}の棚で、見本の行が無いか、44px に届かない部品がある` })
        .toEqual({ some: true, small: [] });
      if (viewport === TOUCH_EDITOR_SIZES[0]) {
        await expectSizes(() => shelfTargetsOf(page), `${where}の棚`, [
          "new-file 255x44",
          "shelf-tab-samples 82x44",
          "shelf-tab-parts 82x44",
          "shelf-tab-notation 82x44",
          "shelf-filter 255x44",
          // 見本の行は図の種類ごとに束ねて並ぶ。どの見本の題も 1 行に収まる (#3167)
          ...KINDS.flatMap(samplesOf).map((key) => `sample-${key} 255x44`),
        ]);
      }
    });
  });


  // 指で触る時に 44px の部品を並べても、2 つの帯は日本語でも英語でも横に送る分を持たず、部品が帯からはみ出さない (#3077)
  describe.for(([...TOUCH_EDITOR_SIZES, { width: 1180, height: 820 }]).flatMap((viewport) => (["ja", "en"] as const).map((lang) => ({ viewport, lang }))))("$viewport.width × $viewport.height $lang", ({ viewport, lang }) => {
    it("coarse-editor-bars-fit", async () => {
      const where = `指で触る ${viewport.width} × ${viewport.height} の${lang === "en" ? "英語の" : ""}編集画面`;
      const page = await openEditor(viewport, "intro", true, true);
      if (lang === "en") {
        await page.locator(siteSel("lang-en")).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where} で、英語に切り替わらない` }).toBe("en");
      }
      await expect
        .poll(async () => {
          const tools = await toolsOf(page);
          const code = await codeBarOf(page);
          return tools && code && { tools: { scrolls: tools.hidden > 0, cut: tools.cut }, code: { scrolls: code.hidden > 0, cut: code.cut } };
        }, { ...WAIT, message: `${where} で、帯を送る分が残るか、部品が帯からはみ出す` })
        .toEqual({ tools: { scrolls: false, cut: [] }, code: { scrolls: false, cut: [] } });
    });
  });


  it(
    "coarse-editor-file-name-fits",
    async () => {
      // 指で触るタブレットの英語では書類名の欄が 44px まで縮み、見本の oauth が「oaut…」までしか見えなかった (#3087)。
      // 欄には拡張子を外した名前を出し、書き出す時に `.dragon` を付ける
      for (const viewport of [
        { width: 768, height: 1024 },
        { width: 834, height: 1194 },
        { width: 1024, height: 768 },
      ]) {
        for (const lang of ["ja", "en"] as const) {
          const where = `指で触る ${viewport.width} × ${viewport.height} の${lang === "en" ? "英語の" : ""}編集画面`;
          const page = await openEditor(viewport, "oauth", true, true);
          if (lang === "en") {
            await page.locator(siteSel("lang-en")).click();
            await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where} で、英語に切り替わらない` }).toBe("en");
          }
          await expect
            .poll(
              () =>
                page.evaluate(async () => {
                  await document.fonts.ready;
                  const field = document.querySelector<HTMLInputElement>('.pg-bar [data-playground="file-name"]');
                  return field && { name: field.value, cut: field.scrollWidth > field.clientWidth };
                }),
              { ...WAIT, message: `${where} で、書類名の欄に oauth と出ないか、字が欄の中で切れる` },
            )
            .toEqual({ name: "oauth", cut: false });
          // 英語の 768px では欄が最小の幅まで縮む (#3095)
          if (lang === "en" && viewport.width === 768) {
            await expectSizes(async () => (await targetsOf(page))?.filter((p) => p.name === "file-name") ?? null, `${where}の書類名の欄`, ["file-name 44x44"]);
          }
        }
      }
    },
  );


  // 指で触るタブレットの英語の書類名の欄は 5 字までで、新規作成した時の untitled は「unti…」で切れた (#3089)。新しいファイルの名前は new
  describe.for(([
    { width: 768, height: 1024 },
    { width: 834, height: 1194 },
    { width: 1024, height: 768 },
  ]).flatMap((viewport) => (["ja", "en"] as const).map((lang) => ({ viewport, lang }))))("$viewport.width × $viewport.height $lang", ({ viewport, lang }) => {
    it("coarse-editor-new-file-name-fits", async () => {
      const where = `指で触る ${viewport.width} × ${viewport.height} の${lang === "en" ? "英語の" : ""}編集画面`;
      const page = await openEditor(viewport, "oauth", true, true);
      if (lang === "en") {
        await page.locator(siteSel("lang-en")).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.lang), { ...WAIT, message: `${where} で、英語に切り替わらない` }).toBe("en");
      }
      await openShelf(page, where);
      await page.locator('[data-playground="new-file"]').click();
      await expect
        .poll(
          () =>
            page.evaluate(async () => {
              await document.fonts.ready;
              const field = document.querySelector<HTMLInputElement>('.pg-bar [data-playground="file-name"]');
              return field && { name: field.value, cut: field.scrollWidth > field.clientWidth };
            }),
          { ...WAIT, message: `${where} で、新規作成した書類名が new でないか、字が欄の中で切れる` },
        )
        .toEqual({ name: "new", cut: false });
    });
  });


  it(
    "coarse-editor-controls-work",
    async () => {
      // 指で触る時に部品を 44px にしても、棚と 2 つの帯の部品の働きは今と同じ (#3077)
      const wide = await openEditor({ width: 1366, height: 1024 }, "intro", true, true);
      const where = "指で触る 1366 × 1024 の編集画面";
      const stage = '[data-playground="stage"]';
      await expect.poll(() => figureLooks(wide, stage), { ...WAIT, message: `${where} で、図が出ない` }).toHaveLength(1);
      const look = await figureLooks(wide, stage);
      await wide.locator(`.pg-stage-bar [data-playground="palette-night"]`).click();
      await expect.poll(() => figureLooks(wide, stage), { ...WAIT, message: `${where} で、色味の丸で図の色味が替わらない` }).not.toEqual(look);
      const level = async (): Promise<number> => Number.parseInt((await toolsOf(wide))?.level ?? "", 10);
      await expect.poll(level, { ...WAIT, message: `${where} で、倍率が出ない` }).toBeGreaterThan(0);
      const base = await level();
      await wide.locator('[data-playground="zoom-in"]').click();
      await expect.poll(level, { ...WAIT, message: `${where} で、拡大の釦で倍率が上がらない` }).toBeGreaterThan(base);
      await wide.locator('[data-playground="tab-json"]').click();
      await expect.poll(() => wide.locator('[data-playground="editor"]').inputValue(), { ...WAIT, message: `${where} で、JSON の札で JSON の側に替わらない` }).toMatch(/^\s*\{/);
      await wide.locator('[data-playground="shelf-tab-parts"]').click();
      await expect.poll(() => wide.locator('[data-playground="part-box"]').isVisible(), { ...WAIT, message: `${where} で、棚の部品の札で部品の一覧に替わらない` }).toBe(true);

      const narrow = await openEditor({ width: 768, height: 1024 }, "intro", true, true);
      await openShelf(narrow, "指で触る 768 × 1024 の編集画面");
      await narrow.locator('[data-playground="sample-oauth"]').click();
      const head = exampleText("oauth", "ja").split("\n")[0] ?? "";
      await expect
        .poll(() => narrow.locator('[data-playground="editor"]').inputValue(), { ...WAIT, message: "指で触る 768 × 1024 の編集画面で、見本の行を押しても oauth が書く欄に入らない" })
        .toContain(head);
    },
  );


  it("editor-readers-open-one-page-per-setting", () => {
    // 読むだけの件は、画面の大きさと指で触るかの組ごとに編集画面を 1 度だけ開き、組の続く件は同じ頁に見本を棚から読む (#3435)
    expectOneOpenPerSetting(readerOpens, READER_CHECKS, "編集画面を読むだけの件");
  });
});

describe("編集画面の棚の足したブロックの見本 (#3407)", () => {
  useSite();

  it("editor-shelf-has-user-blocks", async () => {
    // 箱と線と印を元に足したブロックを使う見本は構成図なので、棚の構成図の束に載る
    const text = example("bridge.dragon");
    expect(text, "packages/dragon/examples/bridge.dragon が無い").toBeDefined();
    const parsed = parseNotation(text ?? "", { lang: "ja" });
    expect(parsed.ok ? [] : parsed.errors.map((e) => `${e.line}: ${e.message}`), "bridge.dragon が読めない").toEqual([]);
    if (!parsed.ok) return;
    expect(parsed.diagram.kind, "bridge.dragon が構成図でない").toBe("architecture");
    expect(parsed.diagram.define?.blocks.length ?? 0, "bridge.dragon が足したブロックを定義しない").toBeGreaterThan(0);
    const title = parsed.diagram.title;
    const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "editor", "編集画面が出ない");
    const placed = (): Promise<{ title: string; group: string } | null> =>
      page.evaluate((s) => {
        const b = document.querySelector(s);
        return b ? { title: b.textContent?.trim() ?? "", group: b.closest("section")?.querySelector("h3")?.textContent?.trim() ?? "" } : null;
      }, '[data-playground="sample-bridge"]');
    await expect.poll(placed, { ...WAIT, message: "編集画面の棚の構成図の束に、足したブロックの見本 bridge が無い" }).toEqual({ title, group: "構成図" });
    await page.locator('[data-playground="sample-bridge"]').click();
    const editorValue = (): Promise<string | null> =>
      page.evaluate(() => document.querySelector<HTMLTextAreaElement>('[data-playground="editor"]')?.value.trimEnd() ?? null);
    await expect.poll(editorValue, { ...WAIT, message: "棚の足したブロックの見本を押しても、その記法が書く欄に入らない" }).toBe(text?.trimEnd());
    await expect
      .poll(() => page.evaluate(() => document.querySelector('[data-playground="stage"] [data-dragon="steps"]')?.getAttribute("aria-label") ?? ""), {
        ...WAIT,
        message: "棚の足したブロックの見本が描かれない",
      })
      .toContain(title);
  });

  it("editor-shelf-bridge-draws-tabler-icon", async () => {
    // 橋の見本の足した箱は、定義に書いた Tabler の石の橋の絵柄で描く (#3489)。見本帳は棚を開いた時に表の塊を読む (#3505)
    const text = example("bridge.dragon") ?? "";
    const parsed = parseNotation(text, { lang: "ja" });
    const icon = parsed.ok ? parsed.diagram.define?.blocks.find((b) => b.base === "box")?.icon : undefined;
    expect(icon, "bridge.dragon の足した箱が Tabler の絵柄を定義しない").toMatch(/^tabler:/u);
    // 定義の絵柄の形は、同じ絵柄を箱の行に書いて既定の入口で描いた形と比べる
    const sample = parseNotation(["architecture 絵柄", "", "box a as A", `box b as B [icon: ${icon}]`, "", "step 見る", "  say 見る。", "  a -> b: 見る", ""].join("\n"));
    const glyph = sample.ok ? /class="dg-gl"[^>]* d="([^"]+)"/u.exec(renderDiagram(sample.diagram).svg)?.[1] : undefined;
    expect(glyph, `箱の行に書いた ${icon} が既定の入口で描かれない`).toBeDefined();
    const { page } = await site.open({ path: `${BASE}editor`, viewport: { width: 1440, height: 900 } });
    await onScreen(page, "editor", "編集画面が出ない");
    await expect.poll(() => page.locator('[data-playground="sample-bridge"]').count(), { ...WAIT, message: "編集画面の棚に橋の見本が載らない" }).toBe(1);
    await page.locator('[data-playground="sample-bridge"]').click();
    await expect
      .poll(
        () => page.evaluate((d) => [...document.querySelectorAll('[data-playground="stage"] svg path.dg-gl')].some((p) => p.getAttribute("d") === d), glyph),
        { ...WAIT, message: "棚の橋の見本の橋の箱に、定義の石の橋の絵柄が描かれない" },
      )
      .toBe(true);
  });
});

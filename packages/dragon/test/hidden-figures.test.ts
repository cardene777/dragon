/**
 * 隠れたタブに置いた図 (#3755)。
 *
 * タブに分けた頁は、開いていないタブを `display:none` か `visibility:hidden` で隠す。
 * script の1行の入口が読み込んだ時に隠れている囲みを描くと、図の動きが走らないまま再生の時計だけが進み、見えた時に図が段と食い違う。
 * 描いた後に隠して見せ直した図も、見えない間に CSS の動きが止まって最初から数え直すので、同じく食い違う。
 * `visibility:hidden` の祖先の中の図は、段の番号の印が動く間だけ `visibility: visible` を持ち、隠れたタブの上に漏れて出る。
 *
 * 頁は `http://localhost/` に置いた Chromium で開き、入口と塊は build した `dist/cdn` から渡す。
 *
 * 件の中で頁を開いて時を待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
 * 頁を開いて待ち、読む仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は読んだ値を元の件と同じ順で確かめる。
 * 図の動きの時刻を測る件が同じ頃に開いたほかの頁と CPU を奪い合わないよう、頁は 1 つずつ順に開く。
 */
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { PAGE_LIMIT_MS, within } from "./page-wait";
import { cdnPage, escapeHtml, withSite } from "./cdn-page-support";

/** 3 つの段を持つ時系列図。段 1 は 1.4 秒から、段 2 は 3.6 秒から、段 3 は 5.8 秒から始まる */
const SEQUENCE =
  "sequence 注文\n\nbox user as 利用者\nbox shop as 店\n\nstep 頼む\n  user -> shop: 注文\nstep 返す\n  shop -> user: 受付\nstep 送る\n  user -> shop: 支払い\n";
/** 隠さずに置く構成図。頁の囲みを描き終えたかを、この図で見る */
const ARCHITECTURE =
  "architecture 置き場\n\nbox app as アプリ\nbox db as 記録\n\nstep 書く\n  app -> db: 書く\n";

/** 図を待つ長さ。元の件の 1 件の上限 (10 秒) より短く待ち、描かれない時も判定の文で落とす */
const WAIT = 6_000;

const block = (source: string): string => `<pre class="dragon">${escapeHtml(source)}</pre>`;

/** 頁の中で `selector` の図が描かれるまで待つ。待ちきれなくても投げず、判定に任せる */
const drawn = (page: Page, selector: string): Promise<unknown> =>
  page
    .waitForFunction(
      (s) => document.querySelector(`${s} [data-dragon="player"] svg`) !== null,
      selector,
      { timeout: WAIT },
    )
    .catch(() => undefined);

/** `html` の頁を開いて `run` を回す。頁は回し終えたら閉じる (`withSite`) */
const openPage = <T>(html: string, run: (page: Page) => Promise<T>): Promise<T> =>
  within(withSite({ "index.html": html }, "index.html", run), PAGE_LIMIT_MS, "隠れたタブの図を置いた頁の仕事");

const HIDDEN_BLOCK = await atLoad("読み込んだ時に隠れている囲みを持つ頁を開き、隠れている間と見せた後の図を読む", () => {
  const html = cdnPage(
    `<div id="shown">${block(ARCHITECTURE)}</div><div id="tab" style="display:none">${block(SEQUENCE)}</div>`,
  );
  return openPage(html, async (page) => {
    await drawn(page, "#shown");
    await page.waitForTimeout(300);
    const whileHidden = await page.evaluate(() => ({
      shown: document.querySelector('#shown [data-dragon="player"] svg') !== null,
      hidden: document.querySelector('#tab [data-dragon="player"]') !== null,
    }));
    // 見せた後の仕事が落ちても、件は隠れている間の図を先に確かめてから落ちる
    const shown = await atLoad("隠れた囲みを見せ、見えた後の図を読む", async () => {
      await page.evaluate(() => {
        (document.getElementById("tab") as HTMLElement).style.display = "block";
      });
      await drawn(page, "#tab");
      return page.evaluate(() => ({
        tab: (document.getElementById("tab") as HTMLElement).clientWidth,
        frame: document.querySelector<HTMLElement>("#tab .dg-frame")?.clientWidth ?? 0,
        step: document.querySelector('#tab [data-dragon="step-no"]')?.textContent ?? "",
      }));
    });
    return { whileHidden, shown };
  });
});

const RESHOWN = await atLoad("描いた図を隠して見せ直し、図の動きの時刻と再生の時計の時刻を読む", () => {
  const html = cdnPage(`<div id="tab">${block(SEQUENCE)}</div>`);
  return openPage(html, async (page) => {
    await drawn(page, "#tab");
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      (document.getElementById("tab") as HTMLElement).style.display = "none";
    });
    await page.waitForTimeout(2_000);
    await page.evaluate(() => {
      (document.getElementById("tab") as HTMLElement).style.display = "block";
    });
    await page.waitForTimeout(300);
    // 図の動きの時刻 (動きの遅れ `--at` と動きが流れた時間の和) を読み、止める釦を押して再生の時計の時刻 (止めた所の `--at`) と比べる
    return page.evaluate(() => {
      const svg = document.querySelector<SVGSVGElement>('#tab [data-dragon="player"] svg');
      const animations = svg?.getAnimations({ subtree: true }) ?? [];
      const at = Number(svg?.style.getPropertyValue("--at") ?? Number.NaN);
      const picture = at + Number(animations[0]?.currentTime ?? Number.NaN) / 1000;
      document.querySelector<HTMLButtonElement>('#tab [data-dragon="toggle"]')?.click();
      const clock = Number(
        document
          .querySelector<SVGSVGElement>('#tab [data-dragon="player"] svg')
          ?.style.getPropertyValue("--at") ?? Number.NaN,
      );
      return { animations: animations.length, picture, clock };
    });
  });
});

const HIDDEN_ANCESTOR = await atLoad("visibility:hidden の祖先の中の図を置き、見える段の番号の印を数える", () => {
  const html = cdnPage(`<div id="tab" style="visibility:hidden">${block(SEQUENCE)}</div>`);
  return openPage(html, async (page) => {
    await drawn(page, "#tab");
    // 段 1 の番号の印が出る 1.75 秒の後まで、0.2 秒ごとに見える印を数える
    const seen: number[] = [];
    for (let i = 0; i < 14; i++) {
      seen.push(
        await page.evaluate(
          () =>
            [...document.querySelectorAll("#tab .dg-bd .dg-a")].filter(
              (g) => getComputedStyle(g).visibility === "visible",
            ).length,
        ),
      );
      await page.waitForTimeout(200);
    }
    return seen;
  });
});

const SHOWN_BADGES = await atLoad("見えている図を置き、段 1 と段 3 の番号の印が出たかを読む", () => {
  const html = cdnPage(`<div id="tab">${block(SEQUENCE)}</div>`);
  return openPage(html, async (page) => {
    await drawn(page, "#tab");
    // 段 1 の印は 1.4 秒から出て、段 3 の印は 5.8 秒まで出ない
    const seen: { first: boolean; third: boolean }[] = [];
    for (let i = 0; i < 14; i++) {
      seen.push(
        await page.evaluate(() => {
          const shown = (step: number): boolean => {
            const fill = document.querySelector(
              `#tab .dg-bd[data-step="${step}"] > g:last-of-type`,
            );
            if (!fill) return false;
            const style = getComputedStyle(fill);
            return style.visibility === "visible" && Number(style.opacity) > 0.5;
          };
          return { first: shown(0), third: shown(2) };
        }),
      );
      await page.waitForTimeout(200);
    }
    return seen;
  });
});

describe("隠れたタブの図 (#3755)", () => {
  it("hidden-block-draws-when-shown", () => {
    const { whileHidden, shown: showing } = HIDDEN_BLOCK.get();
    expect(whileHidden.shown, "隠していない囲みが図にならない").toBe(true);
    expect(whileHidden.hidden, "読み込んだ時に隠れている囲みを、隠れている間に図にした").toBe(
      false,
    );
    const shown = showing.get();
    expect(shown.frame, "見えた後の図の枠の幅が、置いた所の幅と違う").toBe(shown.tab);
    expect(shown.step, "見えた時の図が段 1 から始まらない").toBe("01/03");
  });

  it("reshown-figure-keeps-motion-in-step", () => {
    const times = RESHOWN.get();
    expect(times.animations, "見せ直した図が動きを持たない").toBeGreaterThan(0);
    expect(
      Math.abs(times.clock - times.picture),
      `見せ直した図の動きの時刻 ${times.picture} 秒が再生の時計の ${times.clock} 秒とずれる`,
    ).toBeLessThan(0.5);
  });

  it("hidden-ancestor-hides-step-badges", () => {
    const seen = HIDDEN_ANCESTOR.get();
    expect(Math.max(...seen), `隠れた祖先の中で見えた段の番号の印の数 (${seen.join(",")})`).toBe(
      0,
    );
  });

  it("shown-figure-badges-follow-steps", () => {
    const seen = SHOWN_BADGES.get();
    expect(
      seen.some((s) => s.first),
      "見えている図で段 1 の番号の印が出ない",
    ).toBe(true);
    expect(
      seen.some((s) => s.third),
      "見えている図で、まだ来ていない段 3 の番号の印が出た",
    ).toBe(false);
  });
});

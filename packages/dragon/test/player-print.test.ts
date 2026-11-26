/**
 * 図を置いた頁の印刷の形 (#3956)。
 *
 * 図を置いた頁を印刷すると、紙で押せない再生の帯と図の上の道具の帯を出さず、段のある図は全ての段の止め絵を段の順に並べる。
 * 各止め絵の下には段の番号と題と say の文を置き、紙の写しが途中の段まで全て持つ。
 * 画面では今と同じく 1 つの段だけを映し、再生の帯と道具の帯を出す。
 *
 * 頁は script の1行の入口で図を読む頁を `http://localhost/` に置いた Chromium で開き、入口と塊は build した `dist/cdn` から渡す。
 * 頁を開いて待ち、画面と印刷の形を読む仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は読んだ値を確かめる。
 */
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";

import { atLoad } from "./at-load";
import { cdnPage, escapeHtml, withSite } from "./cdn-page-support";
import { PAGE_LIMIT_MS, within } from "./page-wait";

/** 段ごとの題と say の文と、その段で引く線の札 */
const STEPS = [
  { title: "送る", say: "エージェントが送金を作って送る。", label: "送金" },
  { title: "通す", say: "規則に合う送金を署名へ通す。", label: "合う送金" },
  { title: "残す", say: "確かめた結果を記録に残す。", label: "結果" },
] as const;

/** 3 つの段を持つ構成図。段ごとに別の札の線を引く */
const SOURCE =
  "architecture 送金の確かめ\n\nbox agent as エージェント\nbox check as 確かめる所\nbox signer as 署名する所\nbox log as 記録\n\n" +
  `step ${STEPS[0].title}\n  say ${STEPS[0].say}\n  agent -> check: ${STEPS[0].label}\n` +
  `step ${STEPS[1].title}\n  say ${STEPS[1].say}\n  check -> signer: ${STEPS[1].label}\n` +
  `step ${STEPS[2].title}\n  say ${STEPS[2].say}\n  check -> log: ${STEPS[2].label}\n`;

/** 図の上の道具の帯の釦 (`frame/names.ts` の `BUILTIN_BUTTONS`) */
const TOOLS = ["code", "editor", "copy", "export", "expand"];

/** 図を待つ長さ */
const WAIT = 6_000;

/** 帯つきの図が帯の内側の影の根に描かれるまで待つ。待ちきれなくても投げず、判定に任せる */
const drawn = (page: Page): Promise<unknown> =>
  page
    .waitForFunction(() => (document.querySelector(".dragon-frame")?.shadowRoot?.querySelector('[data-dragon="player"] svg[data-dragon="figure"]') ?? null) !== null, null, { timeout: WAIT })
    .catch(() => undefined);

/** 頁の今の見え方。影の根の中も歩いて、見える図と帯と道具の釦と段の止め絵を読む */
interface Seen {
  /** 見える図の数 */
  figures: number;
  /** 再生の帯が見えるか */
  bar: boolean;
  /** 見える道具の帯の釦 */
  tools: string[];
  /** 見える段の止め絵。止め絵の下の字と、止め絵の中で見える線の札 */
  stills: { caption: string; labels: string[] }[];
}

const read = (page: Page, labels: readonly string[]): Promise<Seen> =>
  page.evaluate((names) => {
    const deep = (selector: string): Element[] => {
      const out: Element[] = [];
      const walk = (root: Document | ShadowRoot): void => {
        out.push(...root.querySelectorAll(selector));
        for (const host of root.querySelectorAll("*")) if (host.shadowRoot) walk(host.shadowRoot);
      };
      walk(document);
      return out;
    };
    const shown = (el: Element): boolean => (el as HTMLElement).checkVisibility();
    /** 図の中の要素の、祖先の濃さを掛けた見える濃さ */
    const alpha = (el: Element, top: Element): number => {
      let a = 1;
      for (let e: Element | null = el; e && e !== top.parentElement; e = e.parentElement) a *= Number(getComputedStyle(e).opacity);
      return a;
    };
    const squash = (text: string | null): string => (text ?? "").replace(/\s+/gu, " ").trim();
    return {
      figures: deep('svg[data-dragon="figure"]').filter(shown).length,
      bar: deep(".dg-bar").some(shown),
      tools: deep("[data-action]")
        .filter(shown)
        .map((el) => el.getAttribute("data-action") ?? ""),
      stills: deep('[data-dragon="step-still"]')
        .filter(shown)
        .map((still) => {
          const svg = still.querySelector('svg[data-dragon="figure"]');
          const caption = [...still.childNodes]
            .filter((node) => !(node instanceof SVGElement) && !(node instanceof Element && node.querySelector("svg")))
            .map((node) => node.textContent ?? "")
            .join(" ");
          const texts = svg ? [...svg.querySelectorAll("text")] : [];
          return {
            caption: squash(caption),
            labels: names.filter((name) => svg !== null && texts.some((t) => squash(t.textContent) === name && alpha(t, svg) > 0.5)),
          };
        }),
    };
  }, labels);

const SEEN = await atLoad("帯つきの段のある図を置いた頁を開き、画面と印刷の形を読む", () =>
  within(
    withSite(
      { "index.html": cdnPage(`<pre class="dragon" data-header>${escapeHtml(SOURCE)}</pre>`) },
      "index.html",
      async (page) => {
        await drawn(page);
        const labels = STEPS.map((s) => s.label);
        const screen = await read(page, labels);
        await page.emulateMedia({ media: "print" });
        const print = await read(page, labels);
        return { screen, print };
      },
    ),
    PAGE_LIMIT_MS,
    "印刷の形を読む頁の仕事",
  ),
);

describe("図を置いた頁の印刷の形 (#3956)", () => {
  it("player-screen-shows-one-step-and-bar", () => {
    const { screen } = SEEN.get();
    expect(screen.figures, "画面で見える図の数").toBe(1);
    expect(screen.stills, "画面で見える段の止め絵").toEqual([]);
    expect(screen.bar, "画面で再生の帯が見えない").toBe(true);
    expect(screen.tools, "画面で見える道具の帯の釦").toEqual(TOOLS);
  });

  it("player-print-hides-bar", () => {
    const { print } = SEEN.get();
    expect(print.bar, "印刷の形で再生の帯が紙に出る").toBe(false);
  });

  it("frame-print-hides-tool-bar", () => {
    const { print } = SEEN.get();
    expect(print.tools, "印刷の形で紙に出る道具の帯の釦").toEqual([]);
  });

  it("player-print-stacks-every-step", () => {
    const { print } = SEEN.get();
    // 段ごとの止め絵だけを見せ、画面で動く図は紙に出さない
    expect(print.stills.length, "印刷の形の段の止め絵の数").toBe(STEPS.length);
    expect(print.figures, "印刷の形で見える図の数").toBe(STEPS.length);
    for (const [i, step] of STEPS.entries()) {
      const still = print.stills[i];
      expect(still?.caption ?? "", `段 ${i + 1} の止め絵の下に段の番号が無い`).toContain(String(i + 1));
      expect(still?.caption ?? "", `段 ${i + 1} の止め絵の下に段の題が無い`).toContain(step.title);
      expect(still?.caption ?? "", `段 ${i + 1} の止め絵の下に say の文が無い`).toContain(step.say);
      // 止め絵はその段の形で、その段までに引いた線の札だけを見せる
      expect(still?.labels ?? [], `段 ${i + 1} の止め絵に見える線の札`).toEqual(STEPS.slice(0, i + 1).map((s) => s.label));
    }
  });
});

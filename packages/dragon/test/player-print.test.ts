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

/** 印刷の形で段の止め絵が見えるまで待つ。止め絵は印刷の形に切り替わった時に作る。待ちきれなくても投げず、判定に任せる */
const stillsShown = (page: Page): Promise<unknown> =>
  page
    .waitForFunction(
      () => {
        const walk = (root: Document | ShadowRoot): boolean =>
          [...root.querySelectorAll<HTMLElement>('[data-dragon="step-still"]')].some((el) => el.checkVisibility()) ||
          [...root.querySelectorAll("*")].some((host) => host.shadowRoot !== null && walk(host.shadowRoot));
        return walk(document);
      },
      null,
      { timeout: WAIT },
    )
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
        await stillsShown(page);
        const print = await read(page, labels);
        return { screen, print };
      },
    ),
    PAGE_LIMIT_MS,
    "印刷の形を読む頁の仕事",
  ),
);

/** 縦に長い順の図の段の数 */
const TALL_STEPS = 8;

/** 縦に長い順の図。順の図は全ての段の線を初めから薄く描くので、どの段の止め絵も 32 本の線の高さを持つ */
const TALL =
  "sequence 縦に長い順の図\n\nbox ask as 頼む所\nbox take as 受ける所\nbox check as 照らす所\nbox keep as 残す所\n\n" +
  Array.from(
    { length: TALL_STEPS },
    (_, i) => `step 段${i + 1}\n  say ${i + 1}つ目の段で依頼を進める。\n  ask -> take: 依頼${i + 1}\n  take -> check: 照らす${i + 1}\n  check -> take: 答え${i + 1}\n  take -> keep: 残す${i + 1}\n`,
  ).join("");

/** 縦に長い場面の図。10 の箱を縦に繋いだ手順の後で 2 つの場面に分かれ、印刷の形では場面ごとに段の止め絵を積む */
const TALL_SCENES =
  "flow 縦に長い場面の図 [scenes: pick]\n\n" +
  Array.from({ length: 10 }, (_, i) => `box s${i + 1} as 段${i + 1}\n`).join("") +
  "choice go as 続けるか？\nbox pass as 通す [color: green]\nbox halt as 止める [color: rose]\n\n" +
  "step 進める\n  say 10の段を順に進める。\n  start -> s1\n" +
  Array.from({ length: 9 }, (_, i) => `  s${i + 1} -> s${i + 2}\n`).join("") +
  "  s10 -> go\n\n" +
  "scene 続ける\n  step 通す\n    say 続けるので通す。\n    go -> pass: はい\nend\n\n" +
  "scene 続けない\n  step 止める\n    say 続けないので止める。\n    go -> halt: いいえ\nend\n";

/** 縦に長い図を印刷の形で測る枠。紙の頁と同じく縦に長い */
const PAPER = { width: 1000, height: 1400 };

const TALL_SEEN = await atLoad("縦に長い帯つきの順の図と場面の図を置いた頁を幅1000px、高さ1400pxで開き、印刷の形の止め絵と場面の絵の高さと頁の改め方を読む", () =>
  within(
    withSite(
      { "index.html": cdnPage(`<pre class="dragon" data-header>${escapeHtml(TALL)}</pre><pre class="dragon" data-header>${escapeHtml(TALL_SCENES)}</pre>`) },
      "index.html",
      async (page) => {
        await drawn(page);
        await page.emulateMedia({ media: "print" });
        await stillsShown(page);
        return page.evaluate(() => {
          /** `top`の中を、影の根の中も歩いて探す */
          const deep = (top: Element | Document, selector: string): Element[] => {
            const out: Element[] = [];
            const walk = (root: Element | Document | ShadowRoot): void => {
              out.push(...root.querySelectorAll(selector));
              for (const host of root.querySelectorAll("*")) if (host.shadowRoot) walk(host.shadowRoot);
            };
            if (top instanceof Element && top.shadowRoot) walk(top.shadowRoot);
            walk(top);
            return out;
          };
          // 1つ目の帯つきの図は順の図、2つ目は場面の図
          const [tallFrame, sceneFrame] = [...document.querySelectorAll(".dragon-frame")];
          const shown = (el: Element): boolean => (el as HTMLElement).checkVisibility();
          const stills = tallFrame ? deep(tallFrame, '[data-dragon="step-still"]').filter(shown) : [];
          const header = tallFrame ? deep(tallFrame, "[data-dragon-header]")[0] : undefined;
          const scenes = sceneFrame ? deep(sceneFrame, '[data-dragon="scene"]').filter(shown) : [];
          // 場面ごとに積んだ段の止め絵を、場面の順に並べる
          const sceneStills = scenes.flatMap((scene) => [...scene.querySelectorAll('[data-dragon="step-still"]')].filter(shown));
          /** 続く2つの塊が、間の余白も含めて占める高さ */
          const pairsOf = (els: Element[]): number[] => els.slice(1).map((el, i) => el.getBoundingClientRect().bottom - (els[i]?.getBoundingClientRect().top ?? 0));
          return {
            pageHeight: innerHeight,
            heights: stills.map((el) => el.getBoundingClientRect().height),
            pairs: pairsOf(stills),
            scenes: scenes.length,
            sceneStills: sceneStills.map((el) => el.getBoundingClientRect().height),
            // 続く2段は同じ場面の中で数える。場面の間には次の場面の名前が入る
            sceneStillPairs: scenes.flatMap((scene) => pairsOf([...scene.querySelectorAll('[data-dragon="step-still"]')].filter(shown))),
            headerBreakAfter: header ? getComputedStyle(header).breakAfter : "(見出しの帯が無い)",
            firstBreakBefore: stills[0] ? getComputedStyle(stills[0]).breakBefore : "(止め絵が無い)",
          };
        });
      },
      PAPER,
    ),
    PAGE_LIMIT_MS,
    "縦に長い図の印刷の形を読む頁の仕事",
  ),
);

describe("印刷の形の頁の改め方 (#3975)", () => {
  it("player-print-keeps-header-with-first-still", () => {
    // 見出しの帯だけが頁の下に残り、図の本体が次の頁から始まらないよう、帯と最初の段の止め絵の間で頁を分けない
    const tall = TALL_SEEN.get();
    expect(tall.headerBreakAfter, "印刷の形で図の見出しの帯の後ろに頁を分けうる").toBe("avoid");
    expect(tall.firstBreakBefore, "印刷の形で最初の段の止め絵の前に頁を分けうる").toBe("avoid");
  });

  it("player-print-fits-two-stills-per-page", () => {
    // 段の止め絵は段の題と文と合わせて頁の高さの半分に収め、1頁に2段まで並べて、送った後に頁の半分を超える空白を残さない
    const tall = TALL_SEEN.get();
    expect(tall.heights.length, "印刷の形の段の止め絵の数").toBe(TALL_STEPS);
    const over = tall.heights.map((height, i) => ({ step: i + 1, height: Math.round(height) })).filter(({ height }) => height > tall.pageHeight / 2);
    expect(over, `頁の高さ ${tall.pageHeight}px の半分を超える段の止め絵`).toEqual([]);
    const tooTall = tall.pairs.map((height, i) => ({ steps: `${i + 1}-${i + 2}`, height: Math.round(height) })).filter(({ height }) => height > tall.pageHeight);
    expect(tooTall, `間の余白も含めて頁の高さ ${tall.pageHeight}px に収まらない続く2段`).toEqual([]);
    // 場面の図は隠した場面も紙に出し、場面ごとに積む段の止め絵も頁の半分に収める
    expect(tall.scenes, "印刷の形で紙に出る場面の数").toBe(2);
    expect(tall.sceneStills.length, "印刷の形の場面の図の段の止め絵の数").toBeGreaterThanOrEqual(2);
    const overScenes = tall.sceneStills.map((height, i) => ({ still: i + 1, height: Math.round(height) })).filter(({ height }) => height > tall.pageHeight / 2);
    expect(overScenes, `頁の高さ ${tall.pageHeight}px の半分を超える場面の図の段の止め絵`).toEqual([]);
    const tooTallScenes = tall.sceneStillPairs.map((height) => Math.round(height)).filter((height) => height > tall.pageHeight);
    expect(tooTallScenes, `間の余白も含めて頁の高さ ${tall.pageHeight}px に収まらない場面の図の続く2段`).toEqual([]);
  });
});

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
      // 止め絵はその段の形で、その段で引いた線の札を見せ、後の段の線の札を見せない
      expect(still?.labels ?? [], `段 ${i + 1} の止め絵にその段の線の札が無い`).toContain(step.label);
      for (const later of STEPS.slice(i + 1)) expect(still?.labels ?? [], `段 ${i + 1} の止め絵に後の段の線の札が見える`).not.toContain(later.label);
    }
  });
});

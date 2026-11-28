// @vitest-environment jsdom
/**
 * 頁に置いた図を決めた段で止めて置く (#3831)。
 *
 * `<pre class="dragon" data-step="3">` は、置いた時に流さず、帯に出る段の番号で 3 段目の止め絵で止めて置く。段は帯の番号と同じく 1 から数える。
 * 止めた後も再生の帯で段を送れる。段の数より大きい数は最後の段で止め、1 以上の整数でない値は図を描かずに誤りの文にする。
 * `data-header` の塊は帯つきの図に同じ設定を渡し、`data-still` の塊は今どおり最後の段の止め絵の SVG に置き換える。
 *
 * jsdom は `matchMedia` を持たないので、動きを嫌わない頁として差し替え、止めた図が流れないことを設定の側で確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "./built-globals";
import "../src/kind-use/sequence";
import { drawPageBlocks, type FramedBlock } from "../src/page-blocks";

const ROOT = join(process.cwd(), "packages/dragon");

/** 4 段の時系列図。段ごとに違う題を持つ */
const SOURCE =
  "sequence 注文\n\nbox shop as 店\nbox bank as 銀行\nbox store as 倉庫\n\n" +
  "step 頼む\n  say 店が銀行に代金を頼む。\n  shop -> bank: 代金\n\n" +
  "step 送る\n  say 銀行が倉庫に出荷してよいと伝える。\n  bank -> store: 出荷\n\n" +
  "step 返す\n  say 倉庫が店に届けたと返す。\n  store -> shop: 届けた\n\n" +
  "step 締める\n  say 店が銀行に締めを伝える。\n  shop -> bank: 締め\n";
const TITLES = ["頼む", "送る", "返す", "締める"];

/** 動きを嫌わない頁を模す。動きを嫌う頁では図が流れないので、止めて置く設定の効き目を確かめられない */
beforeEach(() => {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
});

afterEach(() => {
  document.body.innerHTML = "";
});

const escapeHtml = (text: string): string => text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");

/** `attrs` を持つ塊を 1 つ置いた日本語の頁を描き、塊が置き換わるまで待つ */
async function drawPage(attrs: string, framed?: FramedBlock): Promise<void> {
  document.documentElement.lang = "ja";
  document.body.innerHTML = `<pre class="dragon"${attrs}>${escapeHtml(SOURCE)}</pre>`;
  drawPageBlocks(document, () => Promise.resolve(), framed ? () => Promise.resolve(framed) : undefined);
  for (let i = 0; i < 50 && document.querySelector("pre.dragon"); i++) await new Promise((done) => setTimeout(done, 0));
  expect(document.querySelector("pre.dragon"), "塊が図に置き換わらない").toBeNull();
}

/** 置いた図の今の段の番号と題、再生の釦の絵柄、図の動き方 */
function shown(): { no: string | undefined; title: string | undefined; toggle: string | undefined; motion: string | null | undefined } {
  return {
    no: document.querySelector('[data-dragon="step-no"]')?.textContent?.trim(),
    title: document.querySelector('[data-dragon="step-title"]')?.textContent ?? undefined,
    toggle: document.querySelector<HTMLElement>('[data-dragon="toggle"] .dg-btn-ic')?.dataset.icon,
    motion: document.querySelector('svg[data-dragon="figure"]')?.getAttribute("data-motion"),
  };
}

describe("頁に置いた図を決めた段で止めて置く (#3831)", () => {
  it("page-block-step-pauses-at-step", async () => {
    await drawPage(' data-step="3"');
    expect(document.querySelector(".dragon-error"), "data-step=\"3\" の塊が誤りの文になった").toBeNull();
    expect(shown(), "data-step=\"3\" の図が帯の番号で 3 段目の止め絵で止まっていない").toEqual({ no: "03/04", title: TITLES[2], toggle: "play", motion: "still" });
  });

  it("page-block-step-past-count-stops-last", async () => {
    await drawPage(' data-step="9"');
    expect(document.querySelector(".dragon-error"), "段の数より大きい data-step の塊が誤りの文になった").toBeNull();
    expect(shown(), "段の数より大きい data-step の図が最後の段で止まっていない").toEqual({ no: "04/04", title: TITLES[3], toggle: "play", motion: "still" });
  });

  it("page-block-step-refuses-bad-value", async () => {
    for (const value of ["0", "-1", "2.5", "abc", ""]) {
      await drawPage(` data-step="${value}"`);
      const error = document.querySelector(".dragon-error");
      expect(error, `data-step="${value}" の塊が誤りの文にならない`).not.toBeNull();
      expect(error?.textContent ?? "", `data-step="${value}" の誤りの文が属性の名前を示さない`).toContain("data-step");
      expect(error?.textContent ?? "", `data-step="${value}" の誤りの文が書ける値を示さない`).toContain("1");
      expect(document.querySelector('svg[data-dragon="figure"]'), `data-step="${value}" の塊が図を描いた`).toBeNull();
    }
  });

  it("page-block-step-reaches-framed-figure", async () => {
    const seen: { pausedAt?: number }[] = [];
    const framed: FramedBlock = (host, _source, _diagram, options) => {
      seen.push(options);
      host.textContent = "帯つきの図";
    };
    await drawPage(' data-header data-step="2"', framed);
    expect(seen.length, "data-header の塊を帯つきの図で描かない").toBe(1);
    expect(seen[0]?.pausedAt, "data-header と data-step=\"2\" の塊が帯つきの図に段 2 で止める設定を渡さない").toBe(1);
  });

  it("page-block-still-keeps-last-step-svg", async () => {
    await drawPage(" data-still");
    expect(document.querySelector(".dragon-still svg"), "data-still の塊が止め絵の SVG にならない").not.toBeNull();
    expect(document.querySelector(".dg-player"), "data-still の塊に再生の部品が在る").toBeNull();
  });

  it("readme-describes-data-step", () => {
    const en = readFileSync(join(ROOT, "README.md"), "utf8");
    const ja = readFileSync(join(ROOT, "README.ja.md"), "utf8");
    expect(en, "英語の README に data-step の書き方が無い").toContain('<pre class="dragon" data-step="');
    expect(en, "英語の README が data-step を 1 から数えると書かない").toMatch(/data-step[^\n]*count(?:s|ing)? from 1/u);
    expect(ja, "日本語の README に data-step の書き方が無い").toContain('<pre class="dragon" data-step="');
    expect(ja, "日本語の README が data-step を 1 から数えると書かない").toMatch(/data-step[^\n]*1から数え/u);
  });
});

/** 置いた止め絵の図の色の変数が持つ青の役の値 */
const stillBlue = (): string | undefined => /--c-blue:(#[0-9a-f]{6})/u.exec(document.querySelector(".dragon-still svg")?.outerHTML ?? "")?.[1];

/** 澄んだ色と紙と墨の明るい表示の青の役の値 */
const CLEAR_BLUE = "#467deb";
const PAPER_BLUE = "#26706e";

describe("止めて置く塊の色味 (#4057)", () => {
  it("page-still-block-reads-palette", async () => {
    await drawPage(' data-still data-palette="paper"');
    expect(stillBlue(), 'data-palette="paper" の止め絵の青の役').toBe(PAPER_BLUE);
  });

  it("page-still-block-defaults-to-clear", async () => {
    await drawPage(" data-still");
    expect(stillBlue(), "色味を名指さない止め絵の青の役").toBe(CLEAR_BLUE);
  });

  it("page-still-block-ignores-unknown-palette", async () => {
    await drawPage(' data-still data-palette="nope"');
    expect(stillBlue(), "色味に無い名前を名指した止め絵の青の役").toBe(CLEAR_BLUE);
  });

  it("still-palette-documented", () => {
    const docs = {
      "README.md": readFileSync(join(ROOT, "README.md"), "utf8"),
      "README.ja.md": readFileSync(join(ROOT, "README.ja.md"), "utf8"),
      "references/embed.md": readFileSync(join(ROOT, "../../plugins/dragon/skills/dragon/references/embed.md"), "utf8"),
    };
    for (const [name, text] of Object.entries(docs)) expect(text, `${name} に止め絵の data-palette の書き方が無い`).toContain('<pre class="dragon" data-still data-palette="');
  });
});

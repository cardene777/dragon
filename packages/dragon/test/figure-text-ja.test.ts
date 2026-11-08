// @vitest-environment jsdom
/**
 * 試す図以外の図が日本語で読み手に見せる字は、和文と英数字の間に空白を置かない (#3517)。
 *
 * 状態の図の脇道の添え書き、時間軸の図の時刻と目盛りの名前、配管の図の量、読み上げの段の一覧の名前を確かめる。
 * 英語の字と、英字の名前と数の間の空白と、書き手が CLI で受け取る配置の警告の字は今のまま変えない。
 */
import { afterEach, describe, expect, it } from "vitest";
import { FIGURE_TEXT } from "../src/figure-text";
import { PIPE_TEXT } from "../src/kinds/pipe/layout";
import { api, exampleJson, type Json } from "./diagram-support";
import { draw, type Lang, type Player } from "./render-support";

/** 和文 (漢字、ひらがな、カタカナ、長音) と英数字の間の空白 */
const GAP =
  /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー] [0-9A-Za-z]|[0-9A-Za-z] [\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー]/u;

/** 目盛りと区切りの名前を和文で書き、拡大の帯を持つ時間軸の図 */
const TIME_SOURCE = [
  "time 目盛りと針",
  "scale スロット 12s 8 [from: 3200]",
  "period エポック 4 [from: 100]",
  "zoom 0-3",
  "row ブロック",
  "step 針を進める",
  "  say 進める。",
  "  now -> 3",
].join("\n");

/** トークンの名前を和文で書いた配管の図。Alice の 100 ポイントのうち 10 を Bob へ移す */
const PIPE_SOURCE = [
  "pipe 槽",
  "box alice as Alice",
  "box pt as ポイント",
  "box bob as Bob",
  "hold alice: 100 ポイント",
  "hold bob: 0 ポイント",
  "step 移す",
  "  say 移す。",
  "  alice -> pt: 送る",
  "  move pt: 10 alice -> bob",
  "step 戻る",
  "  say 戻る。",
  "  return pt: true",
].join("\n");

interface Placed {
  side?: { notes?: string[] };
  ticks?: { text: string }[];
  regions?: { id: string; note?: string }[];
  periods?: { name: string; range: string }[];
  zoom?: { columns: { head: string }[] };
}

const parsed = (source: string): Json => {
  const read = api("parseNotation")(source, { lang: "ja" });
  expect(read.ok, `記法を読めない: ${JSON.stringify(read.ok ? [] : read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
};

const rendered = (diagram: Json, lang: Lang): { layout: Placed; texts: string[] } => {
  const { layout, svg } = draw("renderDiagram")(diagram, { lang });
  const texts = [...svg.matchAll(/<(?:text|tspan)\b[^>]*>([^<]+)</gu)].map((m) => m[1] ?? "");
  return { layout: layout as unknown as Placed, texts };
};

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

const mounted = (diagram: Json, lang: Lang): HTMLElement => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  players.push(draw("mountDiagram")(host, diagram, { lang, pausedAt: 0 }));
  return host;
};

const titleOf = (diagram: Json): string => String((diagram as { title: string }).title);

describe("試す図以外の図の日本語の字の空白 (#3517)", () => {
  it("figure-text-ja-has-no-space-around-names", () => {
    const ja = FIGURE_TEXT.ja;
    expect(ja.sideFrom(1), "脇道の添え書き").toBe("1つの状態から入れる");
    expect(ja.steps("Order flow"), "段の一覧の名前").toBe("Order flowの段");
    const texts = [
      ja.sideFrom(3),
      ja.steps("OAuth 2.0"),
      ja.lineupAt("tx1", 2),
      ja.lineupAdded(["a1", "b2"]),
      ja.lineupMissing("a1"),
      ja.returnOf("ok"),
      ja.range("1", "4"),
      PIPE_TEXT.ja.fold(2, 3),
      PIPE_TEXT.ja.foldTitle("Router"),
    ];
    for (const text of texts) expect(text, `和文と英数字の間に空白を持つ字: ${text}`).not.toMatch(GAP);
  });

  it("state-ja-side-note-has-no-space", () => {
    const { layout, texts } = rendered(exampleJson("order.json"), "ja");
    expect(layout.side?.notes, "脇道の添え書き").toEqual(["今回は通らない", "3つの状態から入れる"]);
    expect(texts, "脇道の添え書きが描かれない").toContain("3つの状態から入れる");
    expect(texts, "数と仮名の間に空白を持つ添え書きが描かれる").not.toContain("3 つの状態から入れる");
  });

  it("time-ja-unit-names-join-without-space", () => {
    const { layout } = rendered(parsed(TIME_SOURCE), "ja");
    expect(layout.zoom?.columns.map((c) => c.head), "拡大の帯の列の上の字").toEqual([
      "スロット3200 ・ 0秒",
      "スロット3201 ・ 12秒",
      "スロット3202 ・ 24秒",
      "スロット3203 ・ 36秒",
    ]);
    expect(layout.regions?.find((r) => r.id === "zoom")?.note, "拡大の帯の添え書き").toBe("4スロット");
    expect(layout.periods?.map((p) => [p.name, p.range]), "区切りの名前と範囲").toEqual([
      ["エポック100", "スロット3200〜3203"],
      ["エポック101", "スロット3204〜3207"],
    ]);
    expect(layout.ticks?.map((t) => t.text), "目盛りの時刻の字").toEqual(["0秒", "48秒", "96秒"]);
  });

  it("pipe-ja-amount-has-no-space", () => {
    const diagram = parsed(PIPE_SOURCE);
    const { texts } = rendered(diagram, "ja");
    for (const text of ["+10ポイント", "−10ポイント", "10ポイント"]) expect(texts, `配管の図に「${text}」が描かれない`).toContain(text);
    for (const text of texts) expect(text, `配管の図が和文と英数字の間に空白を持つ字を描く: ${text}`).not.toMatch(GAP);
    const host = mounted(diagram, "ja");
    const amounts = [...host.querySelectorAll('[data-dragon="flow-amount"]')].map((el) => el.textContent ?? "");
    expect(amounts, "図の下の矢印の量").toContain("10ポイント");
  });

  it("player-ja-steps-label-has-no-space", () => {
    const diagram = exampleJson("order.json");
    const host = mounted(diagram, "ja");
    expect(host.querySelector('[data-dragon="steps"]')?.getAttribute("aria-label"), "読み上げの段の一覧の名前").toBe(`${titleOf(diagram)}の段`);
  });

  it("figure-text-en-keeps-spaces", () => {
    const en = FIGURE_TEXT.en;
    expect(en.sideFrom(3), "英語の脇道の添え書き").toBe("Enterable from 3 states");
    expect(en.steps("Order"), "英語の段の一覧の名前").toBe("Steps of Order");
    expect(rendered(exampleJson("order.en.json"), "en").layout.side?.notes, "英語の状態の図の脇道の添え書き").toEqual(["Not taken this time", "Enterable from 3 states"]);
    const time = rendered(exampleJson("finality.en.json"), "en").layout;
    expect(time.ticks?.map((t) => t.text), "英語の目盛りの時刻の字").toEqual(["0 min", "6.4 min", "12.8 min", "19.2 min"]);
    expect(time.zoom?.columns[0]?.head, "英語の拡大の帯の列の上の字").toBe("slot 3200 · 0 s");
    expect(rendered(exampleJson("swap.en.json"), "en").texts, "英語の配管の図の量").toContain("100 USDC");
    const diagram = exampleJson("order.en.json");
    const host = mounted(diagram, "en");
    expect(host.querySelector('[data-dragon="steps"]')?.getAttribute("aria-label"), "英語の読み上げの段の一覧の名前").toBe(`Steps of ${titleOf(diagram)}`);
  });

  it("figure-text-ja-keeps-latin-spaces", () => {
    const time = rendered(exampleJson("finality.json"), "ja").layout;
    expect(time.zoom?.columns[0]?.head.startsWith("slot 3200 "), `英字の目盛りの名前と数の間の空白が無い: ${time.zoom?.columns[0]?.head}`).toBe(true);
    expect(time.regions?.find((r) => r.id === "zoom")?.note, "英字の目盛りの名前の拡大の帯の添え書き").toBe("4 slot");
    expect(time.periods?.[0]?.name, "英字の区切りの名前").toBe("epoch 100");
    expect(time.periods?.[0]?.range, "英字の目盛りの名前の区切りの範囲").toMatch(/^slot 3200\D+3231$/u);
    expect(rendered(exampleJson("swap.json"), "ja").texts, "日本語の配管の図の英字のトークンの量").toContain("100 USDC");
  });

  it("figure-text-ja-keeps-warning-text", () => {
    const ja = FIGURE_TEXT.ja;
    expect(ja.badgeName("1"), "段の番号の呼び方").toBe("段の番号 1");
    expect(ja.lineOf("a", "b", 2), "段を添えた線の呼び方").toBe("線 a → b (段 2)");
    expect(ja.atWidth(390), "崩れの幅").toBe("(幅 390 の時)");
    expect(ja.textsOverlap("a1", "b2"), "2 つの字の重なり").toBe("a1 とb2 が重なる");
    expect(ja.iconOf("db"), "箱の絵柄の呼び方").toBe("「db の絵柄」");
    expect(ja.kindNotLoaded("try"), "読んでいない種類の誤り").toBe("try の図の部品を読んでいない。描く前に loadKind を待つ");
  });
});

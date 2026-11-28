// @vitest-environment jsdom
/**
 * 列の図の目盛りも、押すと段ごとの増えた量とその時の値を並べた内訳の札を出す (#4040)。
 *
 * 1 行目に `[note: pop]` を書いた列の図 (ボードと流れの線の見た目) は、手順の図 (#3896) と同じく、値を 1 度でも書いた目盛りの名前のすぐ右に丸い i の印を描き、
 * 目盛りを押すと目盛りのすぐ下に札を開く。札は目盛りに `set` を書いた段のうち今見ている段までを段の順に並べ、印刷の形では全ての札を開いて全ての段の行を並べる。
 * 列の図の `note` (列の名前の下の値の札、段ごとの値の札、チップの凡例) は段を送るたびに読ませる値と色の凡例なので、`[note: pop]` を書いても札に移さない。
 *
 * 画面の大きさを測れない jsdom では、押した目盛りと図の枠の四角を検査が決め、札をその四角から置く位置を確かめる。
 * 検査は種類を登録しない入口と、列の図の登録の file だけを読む (#3763)。
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import "./built-globals";
import * as dragon from "../src/core";
import "../src/kind-use/lineup";
import { textWidth } from "../src/layout/measure";
import { LOOK, TYPE } from "../src/look/values";
import { drawPageBlocks } from "../src/page-blocks";
import { exportPage } from "../src/page/export";

/** 段の名前と、その段に書く行。3 段目は目盛りに値を書かず、送った列の値の札だけを書く */
const STEPS: readonly (readonly [string, readonly string[]])[] = [
  ["1件目を送る", ["line queue: p2, p3", "line sent: p1", "set budget: 40"]],
  ["2件目を送る", ["line queue: p3", "line sent: p1, p2", "set budget: 70"]],
  ["件数を書く", ["note sent: 2件で70"]],
  ["3件目で止める", ["line queue:", "line sent: p1, p2, p3", "set budget: 110"]],
  ["1件を戻す", ["line queue: p3", "line sent: p1, p2", "set budget: 90"]],
];

/** 値を書いた段の番号 (0 から) と、行に出す段の番号と名前と増えた量とその時の値 */
const WRITTEN = ["0", "1", "3", "4"];
const NUMBERS = ["1", "2", "4", "5"];
const NAMES = ["1件目を送る", "2件目を送る", "3件目で止める", "1件を戻す"];
const DELTAS = ["+40", "+30", "+40", "−20"];
const VALUES = ["40 USDC", "70 USDC", "110 USDC", "90 USDC"];

/**
 * 1 日の予算の目盛りを送った列の下に持つ列の図。待ちの列は名前の下の値の札を持ち、チップは凡例に出す説明を持つ。
 * `head` は 1 行目の後ろに書く属性、`gauges` は足す目盛りの宣言、`queue` は待ちの列の箱の属性
 */
function notation(head = " [note: pop]", gauges: string[] = [], queue = "note: 朝9時から"): string {
  const steps = STEPS.map(
    ([title, lines], k) =>
      `step ${title}\n  say ${k + 1}段目。\n${lines.map((l) => `  ${l}\n`).join("")}`,
  ).join("\n");
  return (
    `lineup 1日の予算と送金の列${head}\n\nbox queue as 待ち [${queue}]\nbox sent as 送った\n\n` +
    "item p1, p2 [note: 取引先への送金]\nitem p3 [color: rose, note: 初めての宛先]\n\n" +
    `${["gauge budget as 1日の予算 [on: sent, limit: 100, unit: USDC]", ...gauges].join("\n")}\n\n${steps}`
  );
}

/** 記法を読んだ原本。読めない時は判定の文で落とし、`undefined` を返す */
function diagramOf(text: string): unknown {
  const parsed = dragon.parseNotation(text, { lang: "ja" });
  expect(
    parsed.ok,
    `記法を読めない: ${parsed.ok ? "" : parsed.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`,
  ).toBe(true);
  return parsed.ok ? parsed.diagram : undefined;
}

/** 描いた SVG を要素にする */
function svgOf(markup: string): Element {
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  return holder.querySelector("svg") ?? holder;
}

interface Placed {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 描いた図の、置いた目盛り `id` の四角 */
const placedOf = (rendered: { layout: unknown }, id: string): Placed | undefined =>
  ((rendered.layout as { gauges?: Placed[] }).gauges ?? []).find((g) => g.id === id);

/** 目盛り `id` の組 */
const gaugeOf = (root: ParentNode, id: string): Element | null =>
  root.querySelector(`[data-gauge="${id}"]`);

/** 目盛り `id` の押せる組。札を持たない目盛りは `null` */
const pressableOf = (root: ParentNode, id: string): Element | null =>
  gaugeOf(root, id)?.querySelector("[data-note]") ?? null;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 要素の四角を決める。jsdom は画面の大きさを測らないので、押した目盛りと図の枠の四角を検査が渡す */
function placeAt(el: Element | null, rect: Rect): void {
  if (!el) return;
  const value = {
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => rect,
  };
  Object.defineProperty(el, "getBoundingClientRect", { configurable: true, value: () => value });
}

/** 頁に置いた図。検査の終わりに外す */
const mounted: { destroy(): void }[] = [];
const hosts: HTMLElement[] = [];

/** 記法 `text` の図を、幅 `width` の枠に置く。幅を渡さない時は jsdom の既定の枠に置く。置けない時は判定の文で落とし、`undefined` を返す */
function mount(
  text: string,
  width?: number,
): { host: HTMLElement; player: dragon.Player } | undefined {
  const diagram = diagramOf(text);
  if (diagram === undefined) return undefined;
  const host = document.createElement("div");
  if (width !== undefined)
    Object.defineProperty(host, "clientWidth", { configurable: true, get: () => width });
  document.body.appendChild(host);
  hosts.push(host);
  const player = dragon.mountDiagram(host, diagram, { lang: "ja" });
  mounted.push(player);
  return { host, player };
}

/** 置いた図の、帯の並べ方 (`row` は横に並べた形、`stack` は積んだ形) */
const arrangementOf = (host: ParentNode): string | null =>
  host.querySelector('svg[data-dragon="figure"]')?.getAttribute("data-lineup-arrangement") ?? null;

/** 札 `key` の要素。札の無い時は `null` */
const cardOf = (host: ParentNode, key: string): HTMLElement | null =>
  host.querySelector<HTMLElement>(`[data-dragon="note-card"][data-box="${key}"]`);

/** 開いている札の名札 */
const openCards = (host: ParentNode): string[] =>
  [...host.querySelectorAll('[data-dragon="note-card"][data-open]')].map(
    (el) => el.getAttribute("data-box") ?? "",
  );

/** 要素を押す。押した所から上の要素へ伝わる */
const press = (el: Element | null): void => {
  el?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

/** 図の枠の四角と目盛りの四角。目盛りは枠の左上から右へ 200、下へ 160 の所に在る */
const FRAME: Rect = { left: 20, top: 30, width: 800, height: 500 };
const GAUGE: Rect = { left: 220, top: 190, width: 180, height: 64 };

/** 図の枠と目盛り `id` の四角を決めてから、目盛りを押す。押した目盛りの札の名札を返す */
function pressGauge(host: HTMLElement, id: string = "budget"): string {
  placeAt(host.querySelector(".dg-frame"), FRAME);
  const el = pressableOf(host, id);
  expect(el, `目盛り ${id} に札の印が無く、押せない`).not.toBeNull();
  placeAt(el, GAUGE);
  press(el);
  return el?.getAttribute("data-note") ?? "";
}

/** 札の行。`all` が偽の時は、画面に出ている行 (`hidden` を持たない行) だけ */
const rowsOf = (card: ParentNode | null, all = false): HTMLElement[] =>
  [...(card?.querySelectorAll<HTMLElement>('[data-dragon="gauge-row"]') ?? [])].filter(
    (row) => all || !row.hidden,
  );

/** 行の中の部品 `part` の字 */
const partText = (row: ParentNode, part: string): string =>
  row.querySelector(`[data-dragon="gauge-row-${part}"]`)?.textContent ?? "";

/** 頁の全ての見た目の規則。印刷の形の規則は `print` を真にして読む */
function cssRules(print: boolean): CSSStyleRule[] {
  const isMedia = (rule: CSSRule): rule is CSSMediaRule => "media" in rule && "cssRules" in rule;
  const isStyle = (rule: CSSRule): rule is CSSStyleRule =>
    "selectorText" in rule && "style" in rule;
  return [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .flatMap((rule) =>
      isMedia(rule)
        ? print === rule.media.mediaText.includes("print")
          ? [...rule.cssRules]
          : []
        : print
          ? []
          : [rule],
    )
    .filter(isStyle);
}

/** 要素の属性の数。無い時は `NaN` */
const numberOf = (el: Element | null | undefined, name: string): number =>
  Number(el?.getAttribute(name) ?? Number.NaN);

/** 列 `lane` の帯の枠の左上 */
const frameAt = (svg: ParentNode, lane: string): [number, number] => {
  const frame = svg.querySelector(`[data-lineup-lane="${lane}"] [data-lineup-frame]`);
  return [numberOf(frame, "x"), numberOf(frame, "y")];
};

/** 列 `lane` の値の札の、字と帯の枠の左上から測った四角の左上 */
const valuesOf = (svg: ParentNode, lane: string): string[] => {
  const [fx, fy] = frameAt(svg, lane);
  return [...svg.querySelectorAll(`[data-lineup-note="${lane}"] [data-lineup-value]`)].map(
    (value) => {
      const rect = value.querySelector("rect");
      return `${value.textContent ?? ""}@${numberOf(rect, "x") - fx},${numberOf(rect, "y") - fy}`;
    },
  );
};

/**
 * 凡例の行の、字と色の四角の左の端と図の下の端からの高さ。凡例は図の下の端に置くので、
 * 目盛りの印の幅だけ帯が広がり上の「この先」の帯の折り返しが変わっても、図の下の端からの高さは変わらない
 */
const legendOf = (rendered: { svg: string; layout: unknown }): string[] => {
  const { height } = rendered.layout as { height: number };
  return [...svgOf(rendered.svg).querySelectorAll("[data-lineup-legend-row]")].map((row) => {
    const swatch = row.querySelector("rect");
    return `${row.textContent ?? ""}@${numberOf(swatch, "x")},${height - numberOf(swatch, "y")}`;
  });
};

afterEach(() => {
  for (const player of mounted.splice(0)) player.destroy();
  for (const host of hosts.splice(0)) host.remove();
  document.body.innerHTML = "";
  document.documentElement.lang = "";
});

describe("列の図の目盛りの内訳の札 (#4040)", () => {
  it("lineup-gauge-card-mark-after-name", () => {
    // ボードを横に並べた形、携帯の幅で帯を積んだ形、流れの線の見た目の3つで確かめる
    const cases: [string, string, number | undefined, string][] = [
      ["横に並べたボード", " [note: pop]", undefined, "row"],
      ["携帯の幅で積んだボード", " [note: pop]", 390, "stack"],
      ["流れの線の見た目", " [shape: stations, note: pop]", undefined, ""],
    ];
    for (const [name, head, width, arranged] of cases) {
      const diagram = diagramOf(notation(head));
      if (diagram === undefined) return;
      // 書き出した頁は原本の形を検査してから描くので、1 行目の note: pop を持つ列の図の原本も形の検査を通る
      expect(dragon.validateDiagram(diagram), `${name} の原本を形の検査が受け付けない`).toEqual({ ok: true });
      const rendered = dragon.renderDiagram(diagram, {
        lang: "ja",
        ...(width === undefined ? {} : { width }),
      });
      if (arranged !== "")
        expect((rendered.layout as { arrangement?: string }).arrangement, `${name} の並べ方`).toBe(
          arranged,
        );
      const svg = svgOf(rendered.svg);
      const scene = placedOf(rendered, "budget");
      expect(scene, `${name} の目盛りの置き場所`).toBeDefined();
      if (!scene) return;
      const circle = gaugeOf(svg, "budget")?.querySelector(".dg-nb circle");
      expect(circle, `${name} の札で見せる列の図の目盛りに印の丸が無い`).not.toBeNull();
      const cx = numberOf(circle, "cx");
      const cy = numberOf(circle, "cy");
      const r = numberOf(circle, "r");
      // 印は名前のすぐ右に、名前の字の高さの真ん中に置く
      const nameRight = scene.x + textWidth("1日の予算", TYPE.gaugeName);
      expect(
        cx - r - nameRight,
        `${name} の印の左の端 (${cx - r}) が名前の右の端 (${nameRight}) のすぐ右に無い`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        cx - r - nameRight,
        `${name} の印の左の端 (${cx - r}) が名前の右の端 (${nameRight}) から離れすぎる`,
      ).toBeLessThanOrEqual(10);
      const middle = scene.y + LOOK.gauge.textH - 4 - TYPE.gaugeName.size * 0.35;
      expect(
        Math.abs(cy - middle),
        `${name} の印の真ん中 (${cy}) が名前の字の真ん中 (${middle}) に揃わない`,
      ).toBeLessThanOrEqual(1.5);
      // 値の字は、最も長い「110 / 100 USDC」の段も印の右に離れて始まり、目盛りの四角の中で終わる
      const values = [...(gaugeOf(svg, "budget")?.querySelectorAll(".dg-gv") ?? [])];
      expect(values.length, `${name} の値の字`).toBeGreaterThan(0);
      for (const value of values) {
        const left = numberOf(value, "x");
        const anchor = value.getAttribute("text-anchor");
        const start =
          anchor === "end" ? left - textWidth(value.textContent ?? "", TYPE.gaugeValue) : left;
        expect(
          start - (cx + r),
          `${name} の値の字「${value.textContent}」の左の端 (${start}) が印の右の端 (${cx + r}) に重なる`,
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("lineup-gauge-card-opens-under-gauge", () => {
    // 横に並べた形と、携帯の幅で帯を積んだ形の両方で開く
    for (const [name, width, arranged] of [
      ["横に並べた形", undefined, "row"],
      ["積んだ形", 390, "stack"],
    ] as const) {
      const placed = mount(notation(), width);
      if (!placed) return;
      const { host, player } = placed;
      expect(arrangementOf(host), `${name} の並べ方`).toBe(arranged);
      player.goTo(4);
      expect(openCards(host), `${name} で押す前に開いている札`).toEqual([]);
      const key = pressGauge(host);
      expect(openCards(host), `${name} で目盛りを押した後に開いている札`).toEqual([key]);
      const card = cardOf(host, key);
      // 見出しは目盛りの名前と上限と単位
      expect(
        card?.querySelector('[data-dragon="note-name"]')?.textContent ?? "",
        `${name} の札の見出しに目盛りの名前が無い`,
      ).toContain("1日の予算");
      expect(
        card?.querySelector('[data-dragon="gauge-card-limit"]')?.textContent,
        `${name} の札の見出しの上限と単位`,
      ).toBe("上限 100 USDC");
      // 札は目盛りのすぐ下に、目盛りと真ん中を揃えて出る。位置は図の枠の左上から測る
      const top = Number.parseFloat(card?.style.top ?? "");
      const left = Number.parseFloat(card?.style.left ?? "");
      const w = Number.parseFloat(card?.style.width ?? "");
      const bottom = GAUGE.top + GAUGE.height - FRAME.top;
      expect(
        top > bottom && top <= bottom + 16,
        `${name} の札の上端 (${top}) が目盛りの下端 (${bottom}) のすぐ下に無い`,
      ).toBe(true);
      expect(
        Math.abs(left + w / 2 - (GAUGE.left + GAUGE.width / 2 - FRAME.left)),
        `${name} の札の真ん中 (${left + w / 2}) が目盛りの真ん中に揃わない`,
      ).toBeLessThanOrEqual(1);
      // 札の外を押すと閉じる
      press(document.body);
      expect(openCards(host), `${name} で札の外を押した後に開いている札`).toEqual([]);
      // 閉じるのアイコンを押すと閉じる
      pressGauge(host);
      press(cardOf(host, key)?.querySelector('[data-dragon="note-close"]') ?? null);
      expect(openCards(host), `${name} で閉じるのアイコンを押した後に開いている札`).toEqual([]);
      // 段を送ると閉じる
      player.goTo(3);
      pressGauge(host);
      expect(openCards(host), `${name} の4段目で目盛りを押した後に開いている札`).toEqual([key]);
      press(host.querySelector('[data-dragon="next"]'));
      expect(player.step, `${name} で次の段へ送った後の段`).toBe(4);
      expect(openCards(host), `${name} で次の段へ送った後に開いている札`).toEqual([]);
    }
  });

  it("lineup-gauge-card-rows-up-to-step", () => {
    const placed = mount(notation());
    if (!placed) return;
    const { host, player } = placed;
    // 2段目では、1段目と2段目の行だけを出す
    player.goTo(1);
    const key = pressGauge(host);
    expect(
      rowsOf(cardOf(host, key)).map((row) => row.dataset.step),
      "2段目で出す行の段",
    ).toEqual(["0", "1"]);
    // 最後の段では、値を書いた段を全て順に並べ、値を書かない3段目の行は持たない
    player.goTo(4);
    pressGauge(host);
    const card = cardOf(host, key);
    expect(
      rowsOf(card, true).map((row) => row.dataset.step),
      "札が持つ行の段",
    ).toEqual(WRITTEN);
    const rows = rowsOf(card);
    expect(
      rows.map((row) => row.dataset.step),
      "最後の段で出す行の段",
    ).toEqual(WRITTEN);
    expect(
      rows.map((row) => partText(row, "no")),
      "行の段の番号",
    ).toEqual(NUMBERS);
    expect(
      rows.map((row) => partText(row, "name")),
      "行の段の名前",
    ).toEqual(NAMES);
    expect(
      rows.map((row) => partText(row, "delta")),
      "行の増えた量",
    ).toEqual(DELTAS);
    expect(
      rows.map((row) => partText(row, "value")),
      "行のその時の値",
    ).toEqual(VALUES);
  });

  it("lineup-gauge-card-print-shows-all-rows", () => {
    const text = notation(" [note: pop]", ["gauge count as 件数 [on: queue]"]).replace(
      "  set budget: 40\n",
      "  set budget: 40\n  set count: 2\n",
    );
    const placed = mount(text);
    const diagram = diagramOf(text);
    if (!placed || diagram === undefined) return;
    const { host, player } = placed;
    const rendered = dragon.renderDiagram(diagram, { lang: "ja" });
    const { width, height } = rendered.layout as { width: number; height: number };
    // 札は押す前から全ての目盛りの分を持つ
    const keys = ["budget", "count"].map(
      (id) => pressableOf(host, id)?.getAttribute("data-note") ?? "",
    );
    const cards = keys.map((key) => cardOf(host, key));
    expect(
      cards.every((card) => card !== null),
      "押す前に全ての目盛りの札を持たない",
    ).toBe(true);
    // 札は印刷の形で目盛りの下に置くため、図の幅と高さに対する目盛りの真ん中と下端の割合を持つ
    const scene = placedOf(rendered, "budget");
    if (!scene) return;
    expect(
      Number.parseFloat(cards[0]?.style.getPropertyValue("--nx") ?? ""),
      "目盛りの札の印刷の横の位置",
    ).toBeCloseTo(((scene.x + scene.w / 2) / width) * 100, 1);
    expect(
      Number.parseFloat(cards[0]?.style.getPropertyValue("--ny") ?? ""),
      "目盛りの札の印刷の縦の位置",
    ).toBeCloseTo(((scene.y + scene.h) / height) * 100, 1);
    // 画面で2段目に絞った札も、印刷の形では全ての行を出す
    player.goTo(1);
    pressGauge(host);
    expect(rowsOf(cards[0] ?? null).length, "2段目で画面に出す行の数").toBe(2);
    expect(rowsOf(cards[0] ?? null, true).length, "札が持つ行の数").toBe(WRITTEN.length);
    const print = cssRules(true);
    const shown = print.find(
      (rule) =>
        rule.selectorText.includes(".dg-nc") &&
        !rule.selectorText.includes("[data-open]") &&
        rule.style.display === "block",
    );
    expect(shown, "印刷の形で閉じた札を開いて描く決まりが無い").toBeDefined();
    const all = print.find(
      (rule) =>
        rule.selectorText.includes("[hidden]") &&
        rule.selectorText.includes("dg-ngr") &&
        rule.style.display !== "" &&
        rule.style.display !== "none",
    );
    expect(all, "印刷の形で画面に出さない行も描く決まりが無い").toBeDefined();
  });

  it("lineup-gauge-card-keeps-lane-and-chip-notes", () => {
    const plain = diagramOf(notation(""));
    const pop = diagramOf(notation());
    if (plain === undefined || pop === undefined) return;
    const plainRendered = dragon.renderDiagram(plain, { lang: "ja" });
    const popRendered = dragon.renderDiagram(pop, { lang: "ja" });
    const before = svgOf(plainRendered.svg);
    const after = svgOf(popRendered.svg);
    // 列の名前の下の値の札と段ごとの値の札は、書かない図と同じ字を、帯の枠の左上から同じ所に描く
    for (const lane of ["queue", "sent"]) {
      const want = valuesOf(before, lane);
      expect(want.length, `書かない図の ${lane} の値の札`).toBeGreaterThan(0);
      expect(valuesOf(after, lane), `[note: pop] を書いた図の ${lane} の値の札`).toEqual(want);
    }
    expect(valuesOf(after, "queue").join(" "), "待ちの列の名前の下の値の札").toContain("朝9時から");
    expect(valuesOf(after, "sent").join(" "), "送った列の段ごとの値の札").toContain("2件で70");
    // チップの凡例も同じ字を、図の下の端の同じ所に描く
    const legend = legendOf(plainRendered);
    expect(legend.length, "書かない図の凡例の行").toBe(2);
    expect(legendOf(popRendered), "[note: pop] を書いた図の凡例").toEqual(legend);
    // 印は目盛りだけが持ち、列とチップは印も札も持たない
    const marked = [...after.querySelectorAll("[data-note]")];
    expect(marked.length, "印を持つ組の数").toBe(1);
    expect(
      marked.every((el) => el.closest("[data-gauge]") !== null),
      "目盛りの外に印を持つ組が在る",
    ).toBe(true);
    const placed = mount(notation());
    if (!placed) return;
    const keys = [...placed.host.querySelectorAll('[data-dragon="note-card"]')].map((card) =>
      card.getAttribute("data-box"),
    );
    expect(keys, "札を持つのは目盛りだけ").toEqual([
      pressableOf(placed.host, "budget")?.getAttribute("data-note"),
    ]);
    const words = [...placed.host.querySelectorAll('[data-dragon="note-card"]')]
      .map((card) => card.textContent ?? "")
      .join(" ");
    for (const note of ["朝9時から", "取引先への送金", "初めての宛先"])
      expect(words, `列かチップの note「${note}」が札に移った`).not.toContain(note);
  });

  it("lineup-gauge-card-only-with-values", () => {
    const placed = mount(
      notation(" [note: pop]", ["gauge idle as 使わない予算 [on: queue, limit: 50]"]),
    );
    if (!placed) return;
    expect(pressableOf(placed.host, "budget"), "値を書いた目盛りの押せる組").not.toBeNull();
    expect(gaugeOf(placed.host, "idle"), "値を書かない目盛り").not.toBeNull();
    expect(pressableOf(placed.host, "idle"), "値を書かない目盛りの押せる組").toBeNull();
    expect(
      gaugeOf(placed.host, "idle")?.querySelector(".dg-nb") ?? null,
      "値を書かない目盛りの印",
    ).toBeNull();
    const boxes = [...placed.host.querySelectorAll('[data-dragon="note-card"]')].map((card) =>
      card.getAttribute("data-box"),
    );
    expect(boxes, "値を書いた目盛りだけが札を持つ").toEqual([
      pressableOf(placed.host, "budget")?.getAttribute("data-note"),
    ]);
  });

  it("lineup-gauge-card-page-default", async () => {
    vi.stubGlobal("__DRAGON_VERSION__", "0.79.7");
    const dir = mkdtempSync(join(tmpdir(), "dragon-lineup-gauge-card-"));
    const fence = (text: string): string => `\`\`\`dragon\n${text}\`\`\``;
    // 1 行目に何も書かない列の図は頁の既定で目盛りの札を持ち、1 行目に [note: under] を書いた列の図は持たない
    const page =
      "---\nnote: pop\n---\n\n# 送金の頁\n\n入口の字。\n\n" +
      `${fence(notation(""))}\n\n${fence(notation(" [note: under]"))}\n`;
    writeFileSync(join(dir, "lineup.md"), page);
    const result = await exportPage(join(dir, "lineup.md"));
    expect(result.ok, `頁を書き出せない: ${JSON.stringify(result)}`).toBe(true);
    if (!result.ok) return;
    // 書き出した頁の図を、頁の script の1行の入口と同じ処理で描く
    const written = new DOMParser().parseFromString(readFileSync(result.path, "utf8"), "text/html");
    document.documentElement.lang = "ja";
    document.body.innerHTML = written.body.innerHTML;
    for (const script of document.body.querySelectorAll("script")) script.remove();
    drawPageBlocks(document, () => Promise.resolve());
    for (let i = 0; i < 50 && document.querySelector("pre.dragon"); i++)
      await new Promise((done) => setTimeout(done, 0));
    expect(
      [...document.querySelectorAll(".dragon-error")].map((e) => e.textContent),
      "頁の図の誤り",
    ).toEqual([]);
    const figures = [...document.querySelectorAll(".dragon-figure")];
    expect(figures.length, "頁に描いた図の数").toBe(2);
    const [first, second] = figures;
    if (!first || !second) return;
    expect(
      pressableOf(first, "budget"),
      "頁の既定で札にした列の図の目盛りの押せる組",
    ).not.toBeNull();
    expect(
      pressableOf(second, "budget"),
      "1 行目に [note: under] を書いた列の図の目盛りの押せる組",
    ).toBeNull();
  });

  it("lineup-gauge-card-example-refused", () => {
    // 札で見せる列の図でも、列の箱の行の example は箱の行を名指して断る
    for (const lang of ["ja", "en"] as const) {
      const read = dragon.parseNotation(
        notation(" [note: pop]", [], "note: 朝9時から, example: 9時に開く"),
        { lang },
      );
      expect(read.ok, `${lang} の列の箱の example を読んだ`).toBe(false);
      const error = read.ok ? undefined : read.errors[0];
      expect(error?.line, `${lang} の列の箱の example を断った行`).toBe(3);
      expect(error?.message ?? "", `${lang} の断りの文が example を名指さない`).toContain(
        "example",
      );
    }
  });

  it("lineup-gauge-card-docs", () => {
    const docs: readonly [string, RegExp][] = [
      ["packages/dragon/src/blocks/gauge/gallery/docs.ts", /列の図[^。]*目盛りを押すと/u],
      [
        "packages/dragon/src/blocks/gauge/gallery/docs.ts",
        /lineup[^.]*click(?:ing)? (?:a|the) gauge/iu,
      ],
      ["packages/dragon/src/blocks/pop/gallery/docs.ts", /列の図[^。]*目盛りだけ/u],
      ["packages/dragon/src/blocks/pop/gallery/docs.ts", /lineup[^.]*only (?:the )?gauges?/iu],
      ["packages/dragon/examples/quick-start.md", /列の図[^。]*目盛りを押すと/u],
      ["packages/dragon/examples/quick-start.md", /列の図[^。]*目盛りだけ/u],
      ["packages/dragon/examples/quick-start.en.md", /lineup[^.]*click(?:ing)? (?:a|the) gauge/iu],
      ["packages/dragon/examples/quick-start.en.md", /lineup[^.]*only (?:the )?gauges?/iu],
      [
        "plugins/dragon/skills/dragon/references/cheatsheet.md",
        /lineup[^.\n]*click(?:ing)? (?:a|the) gauge/iu,
      ],
      [
        "plugins/dragon/skills/dragon/references/cheatsheet.md",
        /lineup[^.\n]*only (?:the )?gauges?/iu,
      ],
    ];
    for (const [file, pattern] of docs) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      expect(pattern.test(text), `${file} が、列の図の目盛りの札を書かない (${pattern})`).toBe(
        true,
      );
    }
    // 後の課題が版を上げても落ちないよう、この課題で上げた1.3.0以上と見る
    const musubi = JSON.parse(
      readFileSync(join(process.cwd(), "plugins/dragon/skills/dragon/musubi.json"), "utf8"),
    ) as {
      provides: Record<string, { version: string }>;
    };
    const version = musubi.provides.cheatsheet?.version ?? "0.0.0";
    const [major = 0, minor = 0] = version.split(".").map(Number);
    expect(
      major > 1 || (major === 1 && minor >= 3),
      `スキルの cheatsheet の版 (${version}) が1.3.0より前`,
    ).toBe(true);
  });
});

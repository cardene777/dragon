// @vitest-environment jsdom
/**
 * 量の図の折れ線の見た目 (#3802)。
 *
 * 量の図 (`chart`) の見た目に `[shape: line]` を足す。新しい図の種類と語は足さず、今の `item` と `step` と `set` で書く。
 * `item` の行は 1 本の線で、段 (`step`) の 1 つが時間の軸の点の 1 つになり、段の題が横の軸の名前になる。
 * `set <項目>: <値>` はその段の点の値で、値を書かない段は前の段の値を保ち、最初に値を書いた段より前は点も線も無い。
 * 縦の軸は 0 から、一番大きい値を 1 か 2 か 2.5 か 5 に 10 の累乗を掛けた刻みで切り上げた上端まで。
 * 段を送ると、線が前の段の点から新しい段の点へ伸び、着いた点に丸が出て、その段の値が点の近くの線に掛からない所に出る (#3812)。
 * 止めて置く図 (`figure: true`) は全ての線を最後の点まで描き、図の上の行に図の題を出し、横の軸の名前は段の題のまま残す。
 *
 * 線と点と字の見え方は、描いた SVG の keyframes を jsdom で読んで、各段の止め絵の時刻で確かめる。
 * 部品は検査と読み上げの道具が引けるよう `data-chart-*` に項目の名札か値か段の番号を持つ。
 * 線は `data-chart-line`、点は `data-chart-point` と `data-chart-step`、点の値の字は `data-chart-value`、
 * 縦の軸の値の字は `data-chart-tick`、刻みの線は `data-chart-grid`、横の軸の名前は `data-chart-x`、凡例の名前は `data-chart-name`、
 * 凡例の色の見本は `data-chart-key` に持つ。
 * 線の描いた長さは、線の長さ (`stroke-dasharray` の 1 つ目の数) から `stroke-dashoffset` を引いた長さで読む。
 * 見本の file と折れ線の見た目がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderDiagram } from "../src/api";
import { checkText, problemLine } from "../src/check";
import { api, type Json, pointers } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Rendered } from "./render-support";
import { textBox } from "../src/layout/measure";
import { CHART_LOOK, CHART_TYPE } from "../src/look/chart";
import "../src/kinds/basics";
import "../src/kind-use/chart";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const LANGS = ["ja", "en"] as const;
type Lang = (typeof LANGS)[number];

/** 折れ線の見た目の見本。パン屋の 1 週間の日ごとの売り上げを、店頭と通販の 2 本の線で比べる */
const SAMPLES = ["bakery-sales"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

interface SourceEvent {
  type: string;
  item?: string;
  value?: number;
}

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string; items: { id: string; name: string; color?: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

const setEvent = (item: string, value: number): Json => ({ type: "set", item, value });

/**
 * 2 本の線を 3 つの段で引く最小の折れ線。店頭 12,000、9,800、14,000 と通販 6,000、7,500、9,000 で、
 * 一番大きい値 14,000 を 4 で割った 3,500 を切り上げる刻みは 5,000、縦の軸の上端は 15,000
 */
function smallLine(shape = "line"): Json {
  return {
    version: 2,
    kind: "chart",
    title: "日ごとの売り上げ",
    chart: {
      shape,
      items: [
        { id: "a", name: "店頭", color: "blue" },
        { id: "b", name: "通販", color: "amber" },
      ],
    },
    blocks: {},
    steps: [
      { title: "月", body: "店頭が12,000で通販が6,000。", events: [setEvent("a", 12000), setEvent("b", 6000)] },
      { title: "火", body: "店頭が9,800に減り、通販が7,500に増える。", events: [setEvent("a", 9800), setEvent("b", 7500)] },
      { title: "水", body: "店頭が14,000、通販が9,000になる。", events: [setEvent("a", 14000), setEvent("b", 9000)] },
    ],
  };
}

/** 甲を段 1 と段 3 だけで、乙を段 2 から書く折れ線。甲は段 2 で前の値 12,000 を保ち、乙は段 1 に点を持たない */
function lateLine(): Json {
  return {
    version: 2,
    kind: "chart",
    title: "遅れて始まる線",
    chart: {
      shape: "line",
      items: [
        { id: "a", name: "甲" },
        { id: "b", name: "乙" },
      ],
    },
    blocks: {},
    steps: [
      { title: "一", body: "甲だけが12,000。", events: [setEvent("a", 12000)] },
      { title: "二", body: "乙が4,000で始まる。", events: [setEvent("b", 4000)] },
      { title: "三", body: "甲が8,000に、乙が5,000になる。", events: [setEvent("a", 8000), setEvent("b", 5000)] },
    ],
  };
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "折れ線の見た目の量の図を描けない").toBe("");
  return rendered as Rendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", steps: [] }) as unknown as Source;
}

/** 描いた図の部品。全て返す */
const partsOf = (motion: Motion, selector: string): Element[] => [...motion.doc.querySelectorAll(selector)];

/** 時刻 `t` に見えている (濃さが 0.9 を超える) 部品の字 */
const textsAt = (motion: Motion, selector: string, t: number): string[] =>
  partsOf(motion, selector)
    .filter((el) => motion.opacity(el, t) > 0.9)
    .map((el) => el.textContent ?? "");

/** 部品の数の属性 */
const num = (el: Element, name: string): number => Number(el.getAttribute(name));

/** 項目 `id` の線の部品。無ければ落とす */
function lineOf(motion: Motion, id: string): Element {
  const el = motion.doc.querySelector(`[data-chart-line="${id}"]`);
  expect(el, `描いた図に ${id} の線 (data-chart-line) が無い`).not.toBeNull();
  return el as Element;
}

/** 項目 `id` の段 `s` の点。無ければ `null` */
const pointOf = (motion: Motion, id: string, s: number): Element | null => motion.doc.querySelector(`[data-chart-point="${id}"][data-chart-step="${s}"]`);

/** 項目 `id` の段 `s` の点。無ければ落とす */
function pointAt(motion: Motion, id: string, s: number): Element {
  const el = pointOf(motion, id, s);
  expect(el, `描いた図に ${id} の段 ${s + 1} の点 (data-chart-point と data-chart-step) が無い`).not.toBeNull();
  return el as Element;
}

/** 線の長さ。`stroke-dasharray` の 1 つ目の数 */
const lengthOf = (line: Element): number => Number((line.getAttribute("stroke-dasharray") ?? "").split(/[\s,]+/u)[0]);

/** 時刻 `t` に描いている線の長さ。線の長さから `stroke-dashoffset` を引く */
const drawnAt = (motion: Motion, line: Element, t: number): number => lengthOf(line) - (motion.value(line, "stroke-dashoffset", t)?.[0] ?? Number.NaN);

/** 項目 `id` の、最初の点から段 `s` の点までの折れ線の長さ。点の真ん中を結んで測る */
function pathTo(motion: Motion, id: string, from: number, s: number): number {
  let sum = 0;
  for (let k = from + 1; k <= s; k++) {
    const a = pointAt(motion, id, k - 1);
    const b = pointAt(motion, id, k);
    sum += Math.hypot(num(b, "cx") - num(a, "cx"), num(b, "cy") - num(a, "cy"));
  }
  return sum;
}

/** 部品の style が名指す色の役 (`--c:var(--c-<色>)` の `<色>`) */
const colorOf = (el: Element): string => /--c:var\(--c-([\w-]+)\)/u.exec(el.getAttribute("style") ?? "")?.[1] ?? "";

/** 3 桁ごとに `,` で区切った数 */
const grouped = (value: number): string => value.toLocaleString("en-US");

/** 記法の行の、注釈と空の行を除いた並び */
const codeLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line !== "" && !line.trimStart().startsWith("//"));

/** 値の字の四角。字の基準線と寄せ方から求める */
function valueBox(el: Element): { x: number; y: number; w: number; h: number } {
  const anchor = el.getAttribute("text-anchor") === "middle" ? "middle" : "start";
  return textBox(el.textContent ?? "", num(el, "x"), num(el, "y"), CHART_TYPE.value, anchor);
}

type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** 線の区間 (`x1`,`y1`)-(`x2`,`y2`) が四角を通るか。区間を四角で切り詰め、残る長さが在るかで見る */
function crosses(box: Box, x1: number, y1: number, x2: number, y2: number): boolean {
  let lo = 0;
  let hi = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  for (const [p, q] of [
    [-dx, x1 - box.x],
    [dx, box.x + box.w - x1],
    [-dy, y1 - box.y],
    [dy, box.y + box.h - y1],
  ] as const) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) lo = Math.max(lo, r);
    else hi = Math.min(hi, r);
    if (lo > hi) return false;
  }
  return true;
}

/** 線の `d` (`M x y L x y ...`) の点 */
const pathPoints = (d: string): [number, number][] => [...d.matchAll(/[ML]([-\d.]+) ([-\d.]+)/gu)].map((m) => [Number(m[1]), Number(m[2])]);

/** 急に上り下りし、2 本が交わる折れ線 */
const STEEP_LINES = [
  "chart 急に変わる売り上げ [shape: line]",
  "item a as 店頭 [color: blue]",
  "item b as 通販 [color: amber]",
  "step 月",
  "  say 店頭が10で通販が90。",
  "  set a: 10",
  "  set b: 90",
  "step 火",
  "  say 店頭が95に跳ね、通販が20に落ちる。",
  "  set a: 95",
  "  set b: 20",
  "step 水",
  "  say 店頭が5に落ち、通販が85に戻る。",
  "  set a: 5",
  "  set b: 85",
  "step 木",
  "  say 店頭が90に戻り、通販が15に落ちる。",
  "  set a: 90",
  "  set b: 15",
].join("\n");

/** 値の字を確かめる折れ線。見本の 2 つの言葉と、急に上り下りする 2 本の線 */
function valueCases(): { name: string; text: string; lang: Lang }[] {
  return [
    { name: "bakery-sales (ja)", text: fileText("bakery-sales.dragon") ?? "", lang: "ja" },
    { name: "bakery-sales (en)", text: fileText("bakery-sales.en.dragon") ?? "", lang: "en" },
    { name: "急に変わる線", text: STEEP_LINES, lang: "ja" },
  ];
}

/** 動く図と止めて置く図の 2 つを描いて、DOM で読む */
function valueDocs(text: string, lang: Lang): { label: string; doc: Document }[] {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `折れ線の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  if (!read.ok) return [];
  return [
    { label: "動く図", options: { lang } },
    { label: "止めて置く図", options: { lang, still: true, figure: true } },
  ].map(({ label, options }) => ({ label, doc: new DOMParser().parseFromString(renderDiagram(read.diagram, options).svg, "image/svg+xml") }));
}

describe("折れ線の見た目の原本の JSON (#3802)", () => {
  it("schema-accepts-chart-line", () => {
    const validate = api("validateDiagram");
    for (const [where, diagram] of [
      ["最小の折れ線", smallLine()],
      ["遅れて始まる線", lateLine()],
    ] as const) {
      const checked = validate(diagram);
      expect(checked.ok, `${where} の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    for (const name of SAMPLES) {
      for (const lang of LANGS) {
        const text = fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`);
        expect(text, `${name} の ${lang} の見本が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const sample = validate(parsed(text, lang, name));
        expect(sample.ok, `${name} の ${lang} の原本が検査で落ちる: ${JSON.stringify(sample.ok ? [] : sample.errors)}`).toBe(true);
      }
    }
  });
});

describe("折れ線の見た目の記法 (#3802)", () => {
  it("chart-line-roundtrip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const small = [
      "chart 日ごとの売り上げ [shape: line]",
      "item a as 店頭 [color: blue]",
      "item b as 通販 [color: amber]",
      "step 月",
      "  say 店頭が12,000で通販が6,000。",
      "  set a: 12000",
      "  set b: 6000",
      "step 火",
      "  say 店頭が9,800に減る。",
      "  set a: 9800",
    ].join("\n");
    const cases: [string, string, Lang][] = [["最小の折れ線", small, "ja"]];
    for (const name of SAMPLES) {
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text !== undefined) cases.push([file, text, lang]);
      }
    }
    for (const [where, text, lang] of cases) {
      const first = parse(text, { lang });
      expect(first.ok, `${where} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      expect((first.diagram as unknown as Source).chart?.shape, `${where} の見た目`).toBe("line");
      // 書き戻すと、注釈の行のほかは書いた記法と同じ行に戻る
      const printed = print(first.diagram);
      expect(codeLines(printed), `${where} を書き戻した記法が書いた記法と違う`).toEqual(codeLines(text));
      expect(codeLines(printed)[0], `${where} を書き戻した頭の行`).toMatch(/^chart .+ \[shape: line\]$/u);
      const second = parse(printed, { lang });
      expect(second.ok ? second.diagram : undefined, `${where} を往復した JSON が最初と違う`).toEqual(first.diagram);
    }
  });
});

describe("折れ線の見た目の描き方 (#3802)", () => {
  it("chart-line-draws-both-axes", () => {
    const motion = motionFrom(render(smallLine()));
    // 縦の軸は 0 から 15,000 まで 5,000 ずつの刻みの線と値の字
    const ticks = partsOf(motion, "[data-chart-tick]");
    expect(
      ticks.map((el) => el.getAttribute("data-chart-tick")),
      "縦の軸の値の字 (data-chart-tick) の値",
    ).toEqual(["0", "5000", "10000", "15000"]);
    expect(
      ticks.map((el) => el.textContent),
      "縦の軸の値の字",
    ).toEqual(["0", "5,000", "10,000", "15,000"]);
    const gridY = (value: number): number => {
      const grid = motion.doc.querySelector(`[data-chart-grid="${value}"]`);
      expect(grid, `値 ${value} の刻みの線 (data-chart-grid) が無い`).not.toBeNull();
      return Number(/^M[\d.]+ ([\d.]+)/u.exec(grid?.getAttribute("d") ?? "")?.[1] ?? Number.NaN);
    };
    const bottom = gridY(0);
    const top = gridY(15000);
    expect(top, "上端の刻みの線が 0 の刻みの線より上に無い").toBeLessThan(bottom);
    for (const value of [5000, 10000]) expect(gridY(value), `値 ${value} の刻みの線の高さ`).toBeCloseTo(bottom - ((bottom - top) * value) / 15000, 1);
    // 点の高さは縦の軸の刻みに合い、0 は 0 の刻みの線に乗る
    const values = { a: [12000, 9800, 14000], b: [6000, 7500, 9000] };
    for (const [id, row] of Object.entries(values)) {
      row.forEach((value, s) => {
        expect(num(pointAt(motion, id, s), "cy"), `${id} の段 ${s + 1} の点の高さ`).toBeCloseTo(bottom - ((bottom - top) * value) / 15000, 1);
      });
    }
    // 横の軸は段の題を段の順に、その段の点の真下に等しい間で並べる
    const labels = partsOf(motion, "[data-chart-x]");
    expect(
      labels.map((el) => el.textContent),
      "横の軸の名前 (data-chart-x)",
    ).toEqual(["月", "火", "水"]);
    labels.forEach((label, s) => {
      expect(label.getAttribute("data-chart-x"), `横の軸の ${s + 1} 番目の名前の段の番号`).toBe(String(s));
      expect(num(label, "x"), `横の軸の ${label.textContent} の名前が点の真下に無い`).toBeCloseTo(num(pointAt(motion, "a", s), "cx"), 1);
      expect(num(label, "y"), `横の軸の ${label.textContent} の名前が 0 の刻みの線より下に無い`).toBeGreaterThan(bottom);
    });
    const xs = [0, 1, 2].map((s) => num(pointAt(motion, "a", s), "cx"));
    expect((xs[1] as number) - (xs[0] as number), "点の間が等しくない").toBeCloseTo((xs[2] as number) - (xs[1] as number), 1);
    // 一番大きい値が刻みの境に乗る時は上端を足さない。小さい値は 1、2、2.5、5 に 10 の累乗を掛けた刻みで切り上げる
    for (const [most, want] of [
      [1000, ["0", "250", "500", "750", "1000"]],
      [7, ["0", "2", "4", "6", "8"]],
    ] as const) {
      const one = smallLine() as unknown as { steps: { events: Json[] }[] };
      for (const step of one.steps) step.events = [setEvent("a", most), setEvent("b", 0)];
      const drawn = motionFrom(render(one));
      expect(
        partsOf(drawn, "[data-chart-tick]").map((el) => el.getAttribute("data-chart-tick")),
        `一番大きい値が ${most} の縦の軸の値`,
      ).toEqual([...want]);
    }
  });

  it("chart-line-draws-one-colored-line-per-item", () => {
    const cases: { where: string; diagram: Json; names: string[] }[] = [{ where: "色を書いた 2 本", diagram: smallLine(), names: ["店頭", "通販"] }];
    const three = smallLine() as unknown as { chart: { items: Json[] }; steps: { events: Json[] }[] };
    three.chart.items = [
      { id: "a", name: "店頭" },
      { id: "b", name: "通販" },
      { id: "c", name: "卸し" },
    ];
    for (const step of three.steps) step.events.push(setEvent("c", 3000));
    cases.push({ where: "色を書かない 3 本", diagram: three, names: ["店頭", "通販", "卸し"] });
    for (const { where, diagram, names } of cases) {
      const motion = motionFrom(render(diagram));
      const ids = names.map((_, i) => String.fromCharCode(97 + i));
      const lines = ids.map((id) => lineOf(motion, id));
      expect(partsOf(motion, "[data-chart-line]").length, `${where} の線の数`).toBe(names.length);
      const colors = lines.map(colorOf);
      expect(colors.every((c) => c !== ""), `${where} の線が色の役を持たない: ${colors.join(", ")}`).toBe(true);
      expect(new Set(colors).size, `${where} の線の色が項目ごとに違わない: ${colors.join(", ")}`).toBe(names.length);
      if (where === "色を書いた 2 本") expect(colors, `${where} の線の色`).toEqual(["blue", "amber"]);
      // 凡例は図の上に、宣言した順で名前を出し、色の見本は線と同じ色
      const legend = partsOf(motion, "[data-chart-name]");
      expect(
        legend.map((el) => el.textContent),
        `${where} の凡例の名前`,
      ).toEqual(names);
      expect(
        legend.map((el) => el.getAttribute("data-chart-name")),
        `${where} の凡例の名札`,
      ).toEqual(ids);
      ids.forEach((id, i) => {
        const key = motion.doc.querySelector(`[data-chart-key="${id}"]`);
        expect(key, `${where} の ${id} の凡例の色の見本 (data-chart-key) が無い`).not.toBeNull();
        expect(colorOf(key as Element), `${where} の ${id} の凡例の色の見本の色`).toBe(colors[i]);
      });
      const topGrid = Math.min(...partsOf(motion, "[data-chart-grid]").map((el) => Number(/^M[\d.]+ ([\d.]+)/u.exec(el.getAttribute("d") ?? "")?.[1])));
      for (const name of legend) expect(num(name, "y"), `${where} の凡例の ${name.textContent} が縦の軸の上端より上に無い`).toBeLessThan(topGrid);
    }
  });

  it("chart-line-grows-from-the-previous-point", () => {
    for (const lang of LANGS) {
      const rendered = render(smallLine(), lang);
      const motion = motionFrom(rendered);
      const { stills, steps } = rendered.timeline;
      const values = { a: [12000, 9800, 14000], b: [6000, 7500, 9000] };
      for (const [id, row] of Object.entries(values)) {
        const line = lineOf(motion, id);
        expect(lengthOf(line), `${lang} の ${id} の線の長さ (stroke-dasharray)`).toBeGreaterThan(0);
        row.forEach((value, s) => {
          const t = stills[s] ?? 0;
          // 止め絵では、線が最初の点から段 s の点まで伸びていて、先へは伸びていない
          expect(drawnAt(motion, line, t), `${lang} の段 ${s + 1} の止め絵の ${id} の線の長さ`).toBeCloseTo(pathTo(motion, id, 0, s), 0);
          // 段の始まりでは、線は前の段の点で止まっている
          if (s > 0) expect(drawnAt(motion, line, steps[s]?.start ?? 0), `${lang} の段 ${s + 1} の始まりの ${id} の線の長さ`).toBeCloseTo(pathTo(motion, id, 0, s - 1), 0);
          // 着いた点に丸が出て、まだ着いていない点の丸は出ない
          expect(motion.opacity(pointAt(motion, id, s), t), `${lang} の段 ${s + 1} の止め絵で ${id} の点が見えない`).toBeGreaterThan(0.9);
          const next = pointOf(motion, id, s + 1);
          if (next) expect(motion.opacity(next, t), `${lang} の段 ${s + 1} の止め絵で ${id} の次の段の点が見える`).toBeLessThan(0.1);
          // その段の値の字が点の近くに出る (#3812)
          expect(textsAt(motion, `[data-chart-value="${id}"]`, t), `${lang} の段 ${s + 1} の止め絵の ${id} の値の字`).toEqual([grouped(value)]);
          const shown = partsOf(motion, `[data-chart-value="${id}"]`).find((el) => motion.opacity(el, t) > 0.9);
          if (shown) {
            const box = valueBox(shown);
            const point = pointAt(motion, id, s);
            const [cx, cy] = [num(point, "cx"), num(point, "cy")];
            const away = Math.hypot(Math.max(0, box.x - cx, cx - box.x - box.w), Math.max(0, box.y - cy, cy - box.y - box.h));
            expect(away, `${lang} の段 ${s + 1} の ${id} の値の字が点から離れすぎる`).toBeLessThan(CHART_LOOK.line.pointR + CHART_LOOK.line.valueGap + CHART_TYPE.value.size);
          }
        });
      }
    }
  });

  it("chart-line-keeps-values-and-starts-late", () => {
    const rendered = render(lateLine());
    const motion = motionFrom(rendered);
    const { stills } = rendered.timeline;
    // 甲は段 2 で値を書かないので、段 1 と同じ高さに点を置く
    expect(num(pointAt(motion, "a", 1), "cy"), "値を書かない段の甲の点の高さが前の段と違う").toBeCloseTo(num(pointAt(motion, "a", 0), "cy"), 1);
    // 乙は段 2 から始まり、段 1 には点を持たず、段 1 の止め絵では線も点も見えない
    expect(pointOf(motion, "b", 0), "値を書く前の段 1 に乙の点が在る").toBeNull();
    const b = lineOf(motion, "b");
    expect(drawnAt(motion, b, stills[0] ?? 0), "段 1 の止め絵で、まだ値の無い乙の線が見える").toBeCloseTo(0, 1);
    expect(textsAt(motion, '[data-chart-value="b"]', stills[0] ?? 0), "段 1 の止め絵で、まだ値の無い乙の値の字が見える").toEqual([]);
    // 段 2 で乙の最初の点が出て、段 3 で乙の線が段 2 の点から段 3 の点まで伸びる
    expect(motion.opacity(pointAt(motion, "b", 1), stills[1] ?? 0), "段 2 の止め絵で乙の最初の点が見えない").toBeGreaterThan(0.9);
    expect(drawnAt(motion, b, stills[1] ?? 0), "段 2 の止め絵の乙の線の長さ").toBeCloseTo(0, 0);
    expect(drawnAt(motion, b, stills[2] ?? 0), "段 3 の止め絵の乙の線の長さ").toBeCloseTo(pathTo(motion, "b", 1, 2), 0);
    expect(textsAt(motion, '[data-chart-value="a"]', stills[1] ?? 0), "段 2 の止め絵の甲の値の字").toEqual(["12,000"]);
  });

  it("chart-line-still-figure-draws-every-line", () => {
    const read = api("parseNotation")(
      [
        "chart 日ごとの売り上げ [shape: line]",
        "item a as 店頭 [color: blue]",
        "item b as 通販 [color: amber]",
        "step 月",
        "  say 店頭が12,000で通販が6,000。",
        "  set a: 12000",
        "  set b: 6000",
        "step 火",
        "  say 店頭が9,800に減り、通販が7,500に増える。",
        "  set a: 9800",
        "  set b: 7500",
        "step 水",
        "  say 店頭が14,000、通販が9,000になる。",
        "  set a: 14000",
        "  set b: 9000",
      ].join("\n"),
      { lang: "ja" },
    );
    expect(read.ok, `止めて置く折れ線の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    if (!read.ok) return;
    let rendered: Rendered | undefined;
    let refusal = "";
    try {
      rendered = renderDiagram(read.diagram, { lang: "ja", still: true, figure: true });
    } catch (error) {
      refusal = String(error);
    }
    expect(refusal, "止めて置く折れ線を描けない").toBe("");
    if (!rendered) return;
    const motion = motionFrom(rendered);
    const last = rendered.timeline.stills[rendered.timeline.steps.length - 1] ?? 0;
    // 全ての線を最後の点まで描く
    for (const id of ["a", "b"]) expect(drawnAt(motion, lineOf(motion, id), last), `止めて置く図の ${id} の線の長さ`).toBeCloseTo(pathTo(motion, id, 0, 2), 0);
    // 図の上の行に図の題を出し、横の軸の名前は段の題のまま残す
    const titles = partsOf(motion, "[data-chart-title]").filter((el) => motion.opacity(el, last) > 0.9);
    expect(
      titles.map((el) => el.textContent),
      "止めて置く図の図の題",
    ).toEqual(["日ごとの売り上げ"]);
    const topGrid = Math.min(...partsOf(motion, "[data-chart-grid]").map((el) => Number(/^M[\d.]+ ([\d.]+)/u.exec(el.getAttribute("d") ?? "")?.[1])));
    expect(num(titles[0] as Element, "y"), "止めて置く図の図の題が縦の軸の上端より上に無い").toBeLessThan(topGrid);
    expect(
      textsAt(motion, "[data-chart-x]", last),
      "止めて置く図の横の軸の名前",
    ).toEqual(["月", "火", "水"]);
    expect(rendered.svg, "止めて置く図に段の番号の丸が在る").not.toMatch(/class="dg-bd"/u);
  });

  it("chart-line-css-stays-in-line-charts", () => {
    const line = render(smallLine()).svg;
    expect(line, "折れ線の図の SVG に折れ線の見た目の規則 (.dg-ch-ln) が無い").toContain(".dg-ch-ln{");
    for (const shape of ["donut", "bar", "funnel", "dots"]) {
      expect(render(smallLine(shape)).svg, `${shape} の SVG に折れ線の見た目の規則が在る`).not.toContain("dg-ch-ln");
    }
  });
});

describe("折れ線にならない書き方 (#3802)", () => {
  it("chart-line-rejects-notation-errors", () => {
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札と名前は英字にする
    const head = ["chart Small line [shape: line]", "item a as A", "item b as B"];
    const two = ["step Two", "  say Next.", "  set a: 4"];
    const at = (line: string, token: string): number => line.lastIndexOf(token);
    // 記法の行と、誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)
    const cases: [string, string[], number, number][] = [
      ["数でない値", [...head, "step One", "  say Start.", "  set a: ten", "  set b: 5", ...two], 5, at("  set a: ten", "ten")],
      // 値を書かないまま終わる項目は線を引けないので、宣言した行の名札を指して断る
      ["値を書かない項目", [...head, "item c as C", "step One", "  say Start.", "  set a: 1", "  set b: 2", ...two], 3, at("item c as C", "c ")],
      // どの項目にも入らない数は折れ線に描けないので、宣言していない項目として断る
      ["set none", [...head, "step One", "  say Start.", "  set a: 1", "  set b: 2", "  set none: 3", ...two], 7, at("  set none: 3", "none")],
      // 点が 1 つでは線を引けないので、頭の行を指して断る
      ["段が 1 つだけの図", [...head, "step One", "  say Only.", "  set a: 1", "  set b: 2"], 0, 0],
    ];
    for (const [name, lines, row, column] of cases) {
      for (const lang of LANGS) {
        // `dragon check` と同じ検査で読み、最初の誤りの行を `file:行:列 error 文` の形で受ける
        const problems = checkText("small.dragon", lines.join("\n"), "notation", lang).map(problemLine);
        const first = problems[0] ?? "";
        expect(first.startsWith(`small.dragon:${row + 1}:${column + 1} error `), `${name} の誤りの行と列 (${lang}): ${first || "誤りにならない"}`).toBe(true);
        const message = first.replace(/^\S+ error /u, "");
        expect(message, `${name} の誤りの文 (${lang})`).not.toBe("");
        expect(KANA.test(message), `${name} の誤りの文の言葉 (${lang}): ${message}`).toBe(lang === "ja");
      }
    }
    // 段が 2 つで、値を書かない段を持つ折れ線は読める
    const read = api("parseNotation")([...head, "step One", "  say Start.", "  set a: 1", "  set b: 2", "step Two", "  say Same."].join("\n"));
    expect(read.ok, `値を書かない段を持つ折れ線が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  });

  it("chart-line-schema-rejects-errors", () => {
    const validate = api("validateDiagram");
    type Draft = { chart: { items: Json[] }; steps: { title: string; body: string; events: Json[] }[] };
    const unset = smallLine() as unknown as Draft;
    unset.chart.items.push({ id: "c", name: "卸し" });
    const none = smallLine() as unknown as Draft;
    (none.steps[0] as { events: Json[] }).events.push(setEvent("none", 3000));
    const single = smallLine() as unknown as Draft;
    single.steps = single.steps.slice(0, 1);
    const cases: [string, Draft, string][] = [
      ["どの段にも値を書かない項目", unset, "/chart/items/2/id"],
      ["none の値", none, "/steps/0/events/2/item"],
      ["段が 1 つだけの図", single, "/steps"],
    ];
    for (const [name, diagram, pointer] of cases) {
      for (const lang of LANGS) {
        const checked = validate(diagram, { lang });
        expect(pointers(checked), `${name} の原本の誤りの場所 (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toContain(pointer);
        const messages = checked.ok ? [] : checked.errors.filter((e) => e.pointer === pointer).map((e) => e.message);
        expect(messages.length, `${name} の原本の誤りの文 (${lang})`).toBeGreaterThan(0);
        for (const message of messages) expect(KANA.test(message), `${name} の原本の誤りの文の言葉 (${lang}): ${message}`).toBe(lang === "ja");
        let refused = "";
        try {
          draw("renderDiagram")(diagram, { lang });
        } catch (error) {
          refused = String(error);
        }
        expect(refused, `${name} の原本を描いてしまう (${lang})`).not.toBe("");
      }
    }
  });
});

describe("折れ線の値の字を線から離す (#3812)", () => {
  it("chart-line-values-clear-of-lines", () => {
    const L = CHART_LOOK.line;
    for (const { name, text, lang } of valueCases()) {
      expect(text, `${name} の記法`).not.toBe("");
      for (const { label, doc } of valueDocs(text, lang)) {
        const where = `${name} の${label}`;
        const segments = [...doc.querySelectorAll("[data-chart-line]")].flatMap((line) => {
          const points = pathPoints(line.getAttribute("d") ?? "");
          return points.slice(1).map((p, k) => [...(points[k] as [number, number]), ...p] as [number, number, number, number]);
        });
        const dots = [...doc.querySelectorAll("[data-chart-point]")].map((p) => ({ x: num(p, "cx"), y: num(p, "cy") }));
        const boxes = [...doc.querySelectorAll("[data-chart-value]")].map((el) => ({ text: el.textContent ?? "", box: valueBox(el) }));
        expect(segments.length, `${where} の線の区間`).toBeGreaterThan(0);
        expect(boxes.length, `${where} の値の字`).toBe(dots.length);
        const legendBottom = Math.max(...[...doc.querySelectorAll("[data-chart-key]")].map((k) => Number(/H[-\d.]+$/u.test(k.getAttribute("d") ?? "") ? /^M[-\d.]+ ([-\d.]+)/u.exec(k.getAttribute("d") ?? "")?.[1] : Number.NaN))) + L.row / 2;
        const base = doc.querySelector('[data-chart-grid="0"]')?.getAttribute("d") ?? "";
        const [axisX, baseY] = (/^M([-\d.]+) ([-\d.]+)/u.exec(base) ?? []).slice(1).map(Number) as [number, number];
        const width = Number((doc.documentElement.getAttribute("viewBox") ?? "").split(/\s+/u)[2]);
        for (const [k, { text: value, box }] of boxes.entries()) {
          const pad = { x: box.x - L.stroke / 2, y: box.y - L.stroke / 2, w: box.w + L.stroke, h: box.h + L.stroke };
          for (const [x1, y1, x2, y2] of segments) expect(crosses(pad, x1, y1, x2, y2), `${where} の値 ${value} の字を線 (${x1},${y1})-(${x2},${y2}) が横切る`).toBe(false);
          for (const dot of dots) {
            const r = L.pointR + L.pointEdge / 2;
            const near = Math.hypot(Math.max(0, box.x - dot.x, dot.x - box.x - box.w), Math.max(0, box.y - dot.y, dot.y - box.y - box.h));
            expect(near, `${where} の値 ${value} の字が点 (${dot.x},${dot.y}) に掛かる`).toBeGreaterThanOrEqual(r);
          }
          for (const other of boxes.slice(k + 1)) expect(overlaps(box, other.box), `${where} の値 ${value} と ${other.text} の字が重なる`).toBe(false);
          expect(box.y, `${where} の値 ${value} の字が凡例の行に掛かる`).toBeGreaterThanOrEqual(legendBottom);
          expect(box.y + box.h, `${where} の値 ${value} の字が 0 の線より下に出る`).toBeLessThanOrEqual(baseY);
          expect(box.x, `${where} の値 ${value} の字が縦の軸より左に出る`).toBeGreaterThanOrEqual(axisX);
          expect(box.x + box.w, `${where} の値 ${value} の字が図の右の端から出る`).toBeLessThanOrEqual(width);
        }
      }
    }
  });

  it("chart-line-peak-value-sits-above", () => {
    for (const { name, text, lang } of valueCases()) {
      for (const { label, doc } of valueDocs(text, lang)) {
        for (const line of doc.querySelectorAll("[data-chart-line]")) {
          const id = line.getAttribute("data-chart-line") ?? "";
          const points = [...doc.querySelectorAll(`[data-chart-point="${id}"]`)].sort((a, b) => num(a, "data-chart-step") - num(b, "data-chart-step"));
          const values = [...doc.querySelectorAll(`[data-chart-value="${id}"]`)];
          points.forEach((point, s) => {
            const [before, after] = [points[s - 1], points[s + 1]];
            const cy = num(point, "cy");
            if (!before || !after || !(cy < num(before, "cy") && cy < num(after, "cy"))) return;
            const cx = num(point, "cx");
            const value = values.find((el) => {
              const box = valueBox(el);
              return box.x <= cx && cx <= box.x + box.w;
            });
            expect(value, `${name} の${label}の ${id} の段 ${s + 1} の山の点の上に値の字が無い`).toBeDefined();
            if (value) expect(valueBox(value).y + valueBox(value).h, `${name} の${label}の ${id} の段 ${s + 1} の山の値の字が点の上に無い`).toBeLessThanOrEqual(cy - CHART_LOOK.line.pointR);
          });
        }
      }
    }
  });
});

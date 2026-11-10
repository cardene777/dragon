// @vitest-environment jsdom
/**
 * 量の図 (#3560)。
 *
 * 項目ごとの割合をドーナツの弧で、量を横棒の長さで描き、段ごとに値が変わって図がその値へ動く図。原本の JSON の `kind` は `chart` で、
 * 種類の欄 `chart` に見た目 (`shape` の `donut` か `bar`) と項目の宣言 (`items` の名札と名前と色) を持ち、段の中の値の出来事 (`set`) が項目の値を変える。
 * 記法は頭の行の `chart <題> [shape: donut]` か `[shape: bar]`、最初の `step` より前の `item <名札> as <名前> [color: <色>]`、段の中の `set <名札>: <値>`。
 * `item` は列の図と試す図が、`set` は帯 (`strip`) が既に使う語なので、量の図でだけ量の図の読み方で読み、ほかの種類の今の読み方を変えない。
 * 見た目の元は step 2 で本人が選んだ動く試作 (ドーナツと横棒)。
 *
 * 置き場所 (`layout.chart`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、弧と棒の動きと字の濃さは SVG の keyframes を jsdom で読んで確かめる。
 * 弧は輪の円の線を `stroke-dasharray` の長さで切り、`stroke-dashoffset` で始まりの角度へ回す。棒は一番大きい値の棒の長さの四角を `scaleX` で縮める。
 * 見本の file と量の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api, type Json, type LineError, patched, pointers, smallSequence } from "./diagram-support";
import { captionSteps, formatOf } from "./export-support";
import { exportInThread, threadStats, warmThread } from "./export-thread";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Layout, type Rect, type Rendered, sampleTimes } from "./render-support";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/svg"), import("../src/check")]);

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** ドーナツの見本と横棒の見本 */
const DONUT = "os-share";
const BAR = "tickets";
const SAMPLES = [DONUT, BAR] as const;
/** 2 つの見本の日本語と英語の記法と JSON */
const SAMPLE_FILES = SAMPLES.flatMap((name) => [`${name}.dragon`, `${name}.en.dragon`, `${name}.json`, `${name}.en.json`]);

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

interface ChartItem {
  id: string;
  name: string;
  color?: string;
}

interface SourceEvent {
  type: string;
  item?: string;
  value?: unknown;
  from?: string;
  to?: string;
  field?: string;
}

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string; items: ChartItem[] };
  blocks: { box?: { id: string }[]; item?: { id: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 描いた量の図の置き場所。`values` は段ごと項目ごとの値で、まだ値の無い項目は 0 */
interface ChartLaid {
  shape: string;
  items: { id: string; name: string; color: string }[];
  values: number[][];
  /** ドーナツの輪の真ん中と、輪の線の真ん中の半径と、輪の太さ */
  ring?: { cx: number; cy: number; r: number; width: number };
  /** 段ごと項目ごとの弧。始まりの角度と広がりは度で、12 時の向きから時計回りに測る */
  arcs?: { start: number; sweep: number }[][];
  /** ドーナツの凡例の行。宣言した順 */
  legend?: { item: string; x: number; y: number }[];
  /** 横棒の行。宣言した順で、`track` は一番大きい値の棒の長さの置き場 */
  bars?: { item: string; name: Rect; track: Rect }[];
  /** 段ごと項目ごとの棒の長さ */
  lengths?: number[][];
}

interface ChartRendered extends Omit<Rendered, "layout"> {
  layout: Layout & { kind: string; chart: ChartLaid };
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の原本の JSON。無ければ落とす */
function exampleJson(name: string): Json {
  const text = fileText(name);
  expect(text, `${name} が packages/dragon/examples に無い`).toBeDefined();
  return JSON.parse(text ?? "{}") as Json;
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 描いた量の図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: "ja" | "en" = "ja", width?: number): ChartRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "量の図を描けない").toBe("");
  expect((rendered as unknown as ChartRendered | undefined)?.layout?.chart, "並べた量の図に量の図の置き場所 (layout.chart) が無い").toBeDefined();
  return rendered as unknown as ChartRendered;
}

const setEvent = (item: string, value: Json): Json => ({ type: "set", item, value });

/** 2 つの項目を 2 段で書いた最小の量の図。段 2 で b の値を書かない */
function smallChart(shape = "donut"): Json {
  return {
    version: 2,
    kind: "chart",
    title: "小さな量の図",
    chart: {
      shape,
      items: [
        { id: "a", name: "甲", color: "blue" },
        { id: "b", name: "乙" },
      ],
    },
    blocks: {},
    steps: [
      { title: "一", body: "甲が多い。", events: [setEvent("a", 3), setEvent("b", 1)] },
      { title: "二", body: "甲が増える。", events: [setEvent("a", 5)] },
    ],
  };
}

/**
 * 段ごとに値を書く項目が変わる量の図。`late` は段 2 で初めて値を持ち、`kept` は段 1 でだけ値を書く。
 * 段 1 の `late` は値が無いので 0 として弧も棒も出さない
 */
function movingChart(shape: "donut" | "bar"): Json {
  return {
    version: 2,
    kind: "chart",
    title: "動く量の図",
    chart: {
      shape,
      items: [
        { id: "grow", name: "伸びる", color: "blue" },
        { id: "kept", name: "保つ", color: "green" },
        { id: "late", name: "遅れる", color: "amber" },
      ],
    },
    blocks: {},
    steps: [
      { title: "初め", body: "伸びると保つだけが値を持つ。", events: [setEvent("grow", 10), setEvent("kept", 30)] },
      { title: "次", body: "伸びるが増え、遅れるが現れる。", events: [setEvent("grow", 40), setEvent("late", 20)] },
      { title: "終わり", body: "伸びるがさらに増える。", events: [setEvent("grow", 60)] },
    ],
  };
}

/** 描いた図の部品。全て返す */
const partsOf = (motion: Motion, selector: string): Element[] => [...motion.doc.querySelectorAll(selector)];

/** 描いた図の部品を 1 つ。無ければ落とす */
function partOf(motion: Motion, selector: string): Element {
  const el = motion.doc.querySelector(selector);
  expect(el, `描いた図に ${selector} の部品が無い`).not.toBeNull();
  return el as Element;
}

/** 時刻 `t` に見えている (濃さが 0.9 を超える) 部品 */
const shownAt = (motion: Motion, selector: string, t: number): Element[] => partsOf(motion, selector).filter((el) => motion.opacity(el, t) > 0.9);

/** 弧の部品の、時刻 `t` の線の長さと始まりの位置 (輪の円の線の上の長さ) */
function arcAt(motion: Motion, id: string, t: number): { dash: number; offset: number } {
  const el = partOf(motion, `[data-chart-arc="${id}"]`);
  const dash = motion.value(el, "stroke-dasharray", t)?.[0] ?? Number(el.getAttribute("stroke-dasharray")?.split(/[\s,]+/u)[0] ?? Number.NaN);
  const offset = motion.value(el, "stroke-dashoffset", t)?.[0] ?? Number(el.getAttribute("stroke-dashoffset") ?? 0);
  return { dash, offset };
}

/** 棒の部品の、時刻 `t` の横の縮み (0 から 1) */
function barScaleAt(motion: Motion, id: string, t: number): number {
  const el = partOf(motion, `[data-chart-bar="${id}"]`);
  return motion.value(el, "transform", t)?.[0] ?? Number.NaN;
}

/** 字の部品の左端の x。`text-anchor` が `middle` の字は真ん中 */
const textX = (el: Element): number => Number(el.getAttribute("x"));

const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0);

/** 原本の項目と段と段ごとの `set` の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.chart?.shape,
  items: (d.chart?.items ?? []).map((i) => i.id),
  steps: d.steps.length,
  sets: d.steps.map((step) => step.events.filter((e) => e.type === "set").length),
});

describe("量の図の原本の JSON (#3560)", () => {
  it("schema-accepts-chart-diagram", () => {
    const validate = api("validateDiagram");
    for (const shape of ["donut", "bar"]) {
      const checked = validate(smallChart(shape));
      expect(checked.ok, `${shape} の最小の量の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    const moving = validate(movingChart("bar"));
    expect(moving.ok, `値を書かない段を持つ量の図が検査で落ちる: ${JSON.stringify(moving.ok ? [] : moving.errors)}`).toBe(true);
    for (const file of SAMPLE_FILES.filter((f) => f.endsWith(".json"))) {
      const sample = validate(exampleJson(file));
      expect(sample.ok, `${file} が検査で落ちる: ${JSON.stringify(sample.ok ? [] : sample.errors)}`).toBe(true);
    }
  });

  it("schema-rejects-misplaced-chart-fields", () => {
    const validate = api("validateDiagram");
    const read = api("readDiagram");
    const sequence = ((): Json => {
      const r = read(smallSequence());
      expect(r.ok, "小さな時系列図を版2の形で読めない").toBe(true);
      return r.ok ? r.diagram : {};
    })();
    const chart = smallChart();
    const cases: [string, Json, string][] = [
      ["時系列図に chart の欄", patched(sequence, ["chart"], { shape: "donut", items: [{ id: "a", name: "甲" }] }), "/chart"],
      ["時系列図に値の出来事", patched(sequence, ["steps", 0, "events"], [setEvent("a", 1)]), "/steps/0/events/0/type"],
      ["量の図に git の欄", patched(chart, ["git"], { branches: [{ id: "main" }] }), "/git"],
      ["量の図に state の欄", patched(chart, ["state"], { paths: [{ from: "a", to: "b" }] }), "/state"],
      ["量の図に sequence の欄", patched(chart, ["sequence"], { lifelines: ["a"] }), "/sequence"],
      ["量の図に time の欄", patched(chart, ["time"], { scale: { unit: "slot", length: "12s", count: 4 } }), "/time"],
      ["donut と bar のほかの見た目", patched(chart, ["chart", "shape"], "pie"), "/chart/shape"],
      ["負の値", patched(chart, ["steps", 0, "events", 0, "value"], -1), "/steps/0/events/0/value"],
      ["数でない値", patched(chart, ["steps", 0, "events", 0, "value"], "70"), "/steps/0/events/0/value"],
    ];
    for (const [name, input, pointer] of cases) {
      const ja = validate(input, { lang: "ja" });
      expect(pointers(ja), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      const messages = en.ok ? [] : en.errors.map((e) => e.message);
      expect(messages.filter((m) => KANA.test(m)), `${name} の英語の誤りの文に仮名か漢字がある`).toEqual([]);
    }
  });
});

describe("量の図の記法 (#3560)", () => {
  it("notation-compiles-chart-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const name of SAMPLES.flatMap((s) => [s, `${s}.en`])) {
      const text = fileText(`${name}.dragon`);
      expect(text, `${name}.dragon が無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: name.endsWith(".en") ? "en" : "ja" });
      expect(parsed.ok, `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      expect(parsed.ok ? parsed.diagram : undefined, `${name}.dragon から作った JSON が ${name}.json と違う`).toEqual(exampleJson(`${name}.json`));
    }
  });

  it("notation-rejects-misused-chart-lines", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札と名前は英字にする
    const head = ["chart Small chart [shape: donut]", "item a as A [color: blue]", "item b as B"];
    const step = ["step One", "  say A leads.", "  set a: 3"];
    const at = (line: string, token: string, from = 0): number => line.indexOf(token, from);
    const nine = Array.from({ length: 9 }, (_, i) => `item i${i} as I${i}`);
    // 記法の行と、誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)
    const cases: [string, string[], number, number][] = [
      ["宣言していない項目への set", [...head, ...step, "  set zz: 1"], 6, at("  set zz: 1", "zz")],
      ["同じ名札の 2 度の item", [...head, "item a as Again", ...step], 3, at("item a as Again", "a ")],
      ["最初の step より前の set", [...head, "set a: 1", ...step], 3, 0],
      ["数でない値の set", [...head, ...step, "  set b: many"], 6, at("  set b: many", "many")],
      ["負の値の set", [...head, ...step, "  set b: -2"], 6, at("  set b: -2", "-2")],
      // 属性の誤りは、ほかの属性の誤りと同じく鍵を指す
      ["donut と bar のほかの shape", ["chart Small chart [shape: pie]", ...head.slice(1), ...step], 0, at("chart Small chart [shape: pie]", "shape")],
      ["9 つ目の item", ["chart Small chart [shape: bar]", ...nine, "step One", "  say Nine.", "  set i0: 1"], 9, 0],
      ["箱の行", [...head, "box db", ...step], 3, 0],
      ["線の行", [...head, ...step, "  a -> b: send"], 6, at("  a -> b: send", "a")],
      ["group の行", [...head, "group g as G", "end", ...step], 3, 0],
      ["item の行が無い量の図", ["chart Small chart [shape: donut]", "step One", "  say Nothing."], 0, 0],
    ];
    for (const [name, lines, row, column] of cases) {
      const want = { line: row + 1, column: column + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang}): ${first?.message ?? "誤りにならない"}`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-keeps-chart-words-plain-outside-chart", () => {
    const parse = api("parseNotation");
    // chart を名札にした箱どうしの線は、時系列図と構成図で今どおり線として読む
    for (const kind of ["sequence", "architecture"] as const) {
      const text = [`${kind} 量の語の名札`, "box chart as 図", "box db", "step 送る", "  say 送る。", "  chart -> db: 送る"].join("\n");
      const parsed = parse(text);
      expect(parsed.ok, `${kind} で chart を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as Source;
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["chart", "db"]);
      const line = diagram.steps?.[0]?.events?.[0];
      expect(line && { type: line.type, from: line.from, to: line.to }, `${kind} の chart から db への線`).toEqual({ type: "edge", from: "chart", to: "db" });
    }
    // 列の図の item の行は、今どおり列の図のチップとして読む
    const lineup = parse(["lineup 列", "box lane", "item x, y [color: blue]", "step 並べる", "  say 並べる。", "  line lane: x, y"].join("\n"));
    expect(lineup.ok, `列の図の item の行が読めない: ${lineup.ok ? "" : JSON.stringify(lineup.errors)}`).toBe(true);
    expect((lineup.ok ? (lineup.diagram as unknown as Source).blocks.item : [])?.map((i) => i.id), "列の図のチップ").toEqual(["x", "y"]);
    // 試す図の item の行は、今どおり入力の帯の欄の値を持つチップとして読む
    const tryText = fileText("tx-block.dragon") ?? "";
    expect(tryText, "試す図の見本 tx-block.dragon が無い").not.toBe("");
    expect(tryText.split("\n").some((l) => /^\s*item\s/u.test(l)), "試す図の見本に item の行が無い (走査の空振り)").toBe(true);
    const tried = parse(tryText);
    expect(tried.ok, `試す図の item の行が読めない: ${tried.ok ? "" : JSON.stringify(tried.errors)}`).toBe(true);
    expect((tried.ok ? (tried.diagram as unknown as Source).blocks.item : [])?.length ?? 0, "試す図のチップ").toBeGreaterThan(0);
    // 帯の set の行は、今どおり帯の欄の値として読む
    const strip = parse(["sequence 帯の値", "box a", "strip 持つ値: 残高", "step 書く", "  say 書く。", "  set 残高: 70 [tag: 新]"].join("\n"));
    expect(strip.ok, `帯の set の行が読めない: ${strip.ok ? "" : JSON.stringify(strip.errors)}`).toBe(true);
    expect((strip.ok ? (strip.diagram as unknown as Source).steps[0]?.events : [])?.map((e) => ({ type: e.type, field: e.field, value: e.value })), "帯の set の行").toEqual([
      { type: "strip", field: "残高", value: "70" },
    ]);
    // ほかの図の頭の行は、今どおり shape を読まずに鍵を指して断る。量の図の見た目を黙って捨てない
    const head = "sequence 見た目の鍵 [shape: donut]";
    const shaped = parse([head, "box a", "step 一", "  say あ。"].join("\n"));
    expect(shaped.ok, "量の図でない図の頭の行の shape を読んでしまう").toBe(false);
    expect(shaped.ok ? undefined : { line: shaped.errors[0]?.line, column: shaped.errors[0]?.column }, "量の図でない図の頭の行の shape の誤りの位置").toEqual({ line: 1, column: head.indexOf("shape") + 1 });
  });

  it("chart-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of SAMPLES.flatMap((s) => [`${s}.dragon`, `${s}.en.dragon`])) {
      const text = fileText(name);
      expect(text, `${name} が無い`).toBeDefined();
      const first = parse(text ?? "");
      expect(first.ok, `${name} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed);
      expect(second.ok, `${name} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
      expect(second.ok ? second.diagram : undefined, `${name} を往復した JSON が最初と違う`).toEqual(first.diagram);
    }
  });
});

describe("量の図の描き方 (#3560)", () => {
  it("chart-donut-draws-arcs-by-share", () => {
    for (const lang of ["ja", "en"] as const) {
      const file = `${DONUT}${lang === "en" ? ".en" : ""}.json`;
      const source = exampleJson(file) as unknown as Source;
      expect(source.chart?.shape, `${file} の見た目`).toBe("donut");
      const rendered = render(source as unknown as Json, lang);
      const { chart } = rendered.layout;
      const motion = motionFrom(rendered);
      const items = source.chart?.items ?? [];
      expect(chart.items.map((i) => i.id), `${file} の項目の並び`).toEqual(items.map((i) => i.id));
      expect(chart.ring, `${file} の輪の置き場所`).toBeDefined();
      const ring = chart.ring ?? { cx: 0, cy: 0, r: 0, width: 0 };
      const C = 2 * Math.PI * ring.r;
      source.steps.forEach((step, s) => {
        const values = chart.values[s] ?? [];
        const total = sum(values);
        expect(total, `${file} の段 ${s + 1} の値の合計`).toBeGreaterThan(0);
        let start = 0;
        const t = rendered.timeline.stills[s] ?? 0;
        items.forEach((item, i) => {
          const sweep = ((values[i] ?? 0) / total) * 360;
          const arc = chart.arcs?.[s]?.[i];
          // 弧は宣言した順に、12 時の向きから時計回りに並び、値を合計で割った割合の角度を持つ
          expect(arc?.start ?? Number.NaN, `${file} の段 ${s + 1} の ${item.id} の弧の始まり`).toBeCloseTo(start, 3);
          expect(arc?.sweep ?? Number.NaN, `${file} の段 ${s + 1} の ${item.id} の弧の角度`).toBeCloseTo(sweep, 3);
          // 描いた弧は止め絵の時刻に、その角度の長さで、その始まりの角度から引かれる
          const drawn = arcAt(motion, item.id, t);
          const want = (sweep / 360) * C;
          expect(drawn.dash, `${file} の段 ${s + 1} の ${item.id} の弧の長さ`).toBeGreaterThan(want - 4);
          expect(drawn.dash, `${file} の段 ${s + 1} の ${item.id} の弧の長さ`).toBeLessThanOrEqual(want + 0.5);
          expect(Math.abs(drawn.offset + (start / 360) * C), `${file} の段 ${s + 1} の ${item.id} の弧の始まりの位置`).toBeLessThan(4);
          start += sweep;
        });
        // 輪の真ん中にその段の名前が出る
        const titles = shownAt(motion, "[data-chart-title]", t);
        expect(titles.map((el) => el.textContent), `${file} の段 ${s + 1} の止め絵の輪の真ん中の字`).toEqual([step.title]);
        expect(Math.abs(textX(titles[0] as Element) - ring.cx), `${file} の段 ${s + 1} の段の名前が輪の真ん中に無い`).toBeLessThan(0.5);
        // 凡例に項目の名前と、整数に丸めた割合が宣言した順に並ぶ
        const legend = chart.legend ?? [];
        expect(legend.map((row) => row.item), `${file} の凡例の並び`).toEqual(items.map((i) => i.id));
        legend.forEach((row, k) => {
          if (k > 0) expect(row.y, `${file} の凡例の ${row.item} が前の行より下に無い`).toBeGreaterThan((legend[k - 1] as { y: number }).y);
        });
        items.forEach((item, i) => {
          expect(partsOf(motion, `[data-chart-name="${item.id}"]`).map((el) => el.textContent), `${file} の凡例の ${item.id} の名前`).toEqual([item.name]);
          const shares = shownAt(motion, `[data-chart-share="${item.id}"]`, t).map((el) => el.textContent);
          expect(shares, `${file} の段 ${s + 1} の凡例の ${item.id} の割合`).toEqual([`${Math.round(((values[i] ?? 0) / total) * 100)}%`]);
        });
      });
    }
  });

  it("chart-bar-draws-lengths-by-value", () => {
    for (const lang of ["ja", "en"] as const) {
      const file = `${BAR}${lang === "en" ? ".en" : ""}.json`;
      const source = exampleJson(file) as unknown as Source;
      expect(source.chart?.shape, `${file} の見た目`).toBe("bar");
      const rendered = render(source as unknown as Json, lang);
      const { chart } = rendered.layout;
      const motion = motionFrom(rendered);
      const items = source.chart?.items ?? [];
      const bars = chart.bars ?? [];
      // 横棒は宣言した順に上から並ぶ
      expect(bars.map((b) => b.item), `${file} の棒の並び`).toEqual(items.map((i) => i.id));
      bars.forEach((bar, k) => {
        if (k > 0) expect(bar.track.y, `${file} の ${bar.item} の棒が前の棒より下に無い`).toBeGreaterThan((bars[k - 1] as { track: Rect }).track.y + (bars[k - 1] as { track: Rect }).track.h - 0.5);
        // 棒の左に項目の名前が出る
        expect(bar.name.x + bar.name.w, `${file} の ${bar.item} の名前が棒の左に無い`).toBeLessThanOrEqual(bar.track.x);
        const name = partOf(motion, `[data-chart-name="${bar.item}"]`);
        expect(name.textContent, `${file} の ${bar.item} の名前`).toBe(items[k]?.name);
        expect(textX(name), `${file} の ${bar.item} の名前の字が棒の左に無い`).toBeLessThan(bar.track.x);
      });
      const most = Math.max(...chart.values.flat());
      expect(most, `${file} の一番大きい値`).toBeGreaterThan(0);
      source.steps.forEach((_, s) => {
        const t = rendered.timeline.stills[s] ?? 0;
        items.forEach((item, i) => {
          const value = chart.values[s]?.[i] ?? 0;
          const bar = bars[i] as { track: Rect };
          // 棒の長さは、値を一番大きい値で割った割合に比例する
          const length = chart.lengths?.[s]?.[i] ?? Number.NaN;
          expect(length, `${file} の段 ${s + 1} の ${item.id} の棒の長さ`).toBeCloseTo((value / most) * bar.track.w, 3);
          expect(barScaleAt(motion, item.id, t), `${file} の段 ${s + 1} の止め絵の ${item.id} の棒の縮み`).toBeCloseTo(value / most, 2);
          // 棒の端に値が出る。値の無い項目は棒を出さない
          if (value === 0) return;
          const shown = shownAt(motion, `[data-chart-value="${item.id}"]`, t);
          expect(shown.map((el) => el.textContent), `${file} の段 ${s + 1} の ${item.id} の値`).toEqual([String(value)]);
          expect(textX(shown[0] as Element), `${file} の段 ${s + 1} の ${item.id} の値が棒の端に無い`).toBeGreaterThanOrEqual(bar.track.x + length);
          expect(textX(shown[0] as Element), `${file} の段 ${s + 1} の ${item.id} の値が棒の端から離れる`).toBeLessThan(bar.track.x + length + 16);
        });
      });
    }
  });

  it("chart-values-move-from-previous-step", () => {
    for (const shape of ["donut", "bar"] as const) {
      const diagram = movingChart(shape);
      const rendered = render(diagram);
      const { chart } = rendered.layout;
      const motion = motionFrom(rendered);
      const { steps, stills } = rendered.timeline;
      // set を書かない項目は前の段の値を保ち、まだ値の無い項目は 0
      expect(chart.values, `${shape} の段ごとの値`).toEqual([
        [10, 30, 0],
        [40, 30, 20],
        [60, 30, 20],
      ]);
      /** 項目 `id` の、時刻 `t` の描いた量 (弧の長さか棒の縮み) */
      const amount = (id: string, t: number): number => (shape === "donut" ? arcAt(motion, id, t).dash : barScaleAt(motion, id, t));
      // まだ値の無い項目は、弧も棒も出さない
      const late = amount("late", stills[0] ?? 0);
      expect(late, `${shape} の段 1 の止め絵で値の無い遅れるが描かれる`).toBeLessThan(0.01);
      if (shape === "donut") expect(motion.opacity(partOf(motion, '[data-chart-arc="late"]'), stills[0] ?? 0), "段 1 の止め絵で値の無い遅れるの弧が見える").toBeLessThan(0.1);
      // 段を送ると、前の段の値から新しい値へ動く
      for (let s = 1; s < steps.length; s++) {
        const begin = (steps[s]?.start ?? 0) + 0.01;
        const before = amount("grow", stills[s - 1] ?? 0);
        const after = amount("grow", stills[s] ?? 0);
        expect(Math.abs(amount("grow", begin) - before), `${shape} の段 ${s + 1} の始まりで伸びるが前の段の量に無い`).toBeLessThan(0.02 * Math.max(1, before));
        expect(after, `${shape} の段 ${s + 1} の止め絵で伸びるが変わらない`).not.toBeCloseTo(before, 2);
        const times = Array.from({ length: 40 }, (_, k) => begin + (((stills[s] ?? 0) - begin) * k) / 39);
        const between = times.map((time) => amount("grow", time)).filter((v) => v > Math.min(before, after) + 1e-3 && v < Math.max(before, after) - 1e-3);
        expect(between.length, `${shape} の段 ${s + 1} で伸びるが前の段の量から新しい量へ動かない (途中の量が無い)`).toBeGreaterThan(0);
      }
      // 保つは段 2 と段 3 で値を書かないので、棒は前の段の値のまま、弧は合計が変わる分だけ変わる
      if (shape === "bar") for (const s of [1, 2]) expect(amount("kept", stills[s] ?? 0), `段 ${s + 1} で保つの棒の縮み`).toBeCloseTo(30 / 60, 2);
    }
  });

  it("chart-keeps-motion-rules", () => {
    for (const name of SAMPLES) {
      const rendered = render(exampleJson(`${name}.json`));
      const { timeline } = rendered;
      const motion = motionFrom(rendered);
      expect(timeline.badges.map((b) => b.step), `${name} の段の番号`).toEqual(timeline.steps.map((_, i) => i));
      for (const badge of timeline.badges) expect(badge.appears, `${name} の段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(timeline.steps[badge.step]?.start ?? Number.POSITIVE_INFINITY);
      const badges = partsOf(motion, "g.dg-bd[data-step]");
      expect(badges.length, `${name} の描いた段の番号`).toBe(timeline.steps.length);
      // 0.25 秒ごとに止めて、まだ始まっていない段の番号が見えていないかを数える。
      // 番号を包む組は動かないので濃さ 1 に読める。見えるかは描く丸と字で読む
      for (const t of sampleTimes(timeline)) {
        for (const el of badges) {
          const s = Number(el.getAttribute("data-step"));
          if (t >= (timeline.steps[s]?.start ?? 0)) continue;
          const seen = Math.max(...[...el.querySelectorAll("circle, text")].map((part) => motion.opacity(part, t)));
          expect(seen, `${name} の ${t.toFixed(2)} 秒に、まだ始まっていない段 ${s + 1} の番号が見える`).toBeLessThan(0.05);
        }
      }
    }
  });
});

describe("量の図の崩れ (#3560)", () => {
  it("chart-examples-pass-layout-check", () => {
    for (const file of SAMPLES.flatMap((s) => [`${s}.dragon`, `${s}.en.dragon`])) {
      const text = fileText(file);
      expect(text, `${file} が無い`).toBeDefined();
      const lang = file.includes(".en.") ? "en" : "ja";
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す。誤りの行も返し、記法を読めずに崩れを数えなかった回を崩れの無い回と取り違えない
      const problems = checkText(file, text ?? "", "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
      expect(problems, `${file} の崩れの知らせ`).toEqual([]);
      // 崩れを数えた図が量の図の置き場所を持つ (記法を読めずに崩れを数えない形を除く)
      for (const width of [undefined, 390]) {
        const parsed = api("parseNotation")(text ?? "", { lang });
        expect(parsed.ok, `${file} が読めない`).toBe(true);
        if (parsed.ok) expect(render(parsed.diagram, lang, width).layout.chart.items.length, `${file} を幅 ${width ?? "既定"} で描いた項目`).toBeGreaterThan(0);
      }
    }

    // 見本の 0 件が検査の空振りでないことの対照。輪の内側の円に収まらない段の名前は、図の枠に収まっていても崩れに数え、同じ名前が続く段は最初の段の 1 件にする
    const withTitle = (title: string, shape: string): string =>
      [`chart 題 [shape: ${shape}]`, "", "item a as 一つ目 [color: blue]", "item b as 二つ目 [color: green]", "", "step 短い", "  say 最初の段。", "  set a: 7", "  set b: 3", "", `step ${title}`, "  say 次の段。", "  set a: 5", "", `step ${title}`, "  say 同じ名前の段。", "  set a: 3", ""].join("\n");
    const check = (title: string, shape: string, lang: "ja" | "en") => checkText("long.dragon", withTitle(title, shape), "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` });
    const ringBreak = (title: string) => ({ kind: "title-outside-ring", step: 2, parts: [{ kind: "text", text: title }, { kind: "ring" }] });
    const longJa = "2024年の市場の割合";
    const longEn = "Market share by region";
    expect(check(longJa, "donut", "ja").map((p) => p.layout), "輪の内側に収まらない日本語の名前の崩れ").toEqual([ringBreak(longJa)]);
    expect(check(longJa, "donut", "ja").map((p) => p.message), "日本語の文が段と名前を名指す").toEqual([`段 2: 「${longJa}」がドーナツの輪の内側からはみ出す`]);
    expect(check(longEn, "donut", "en").map((p) => p.layout), "輪の内側に収まらない英語の名前の崩れ").toEqual([ringBreak(longEn)]);
    expect(check(longEn, "donut", "en").map((p) => p.message), "英語の文が段と名前を名指す").toEqual([`段 2: "${longEn}" sticks out of the inside of the donut ring`]);
    // skill の参照 (`references/kinds/chart.md`) に書いた目安の長さは収まる。それより長ければ知らせる
    expect(check("七文字の段の名", "donut", "ja").map(problemLine), "日本語 7 字の名前").toEqual([]);
    expect(check("八文字の段の名前", "donut", "ja").map((p) => p.layout), "日本語 8 字の名前").toEqual([ringBreak("八文字の段の名前")]);
    expect(check("Market share A", "donut", "en").map(problemLine), "英語 14 字の名前").toEqual([]);
    // 横棒の図は輪を持たず、段の名前を段の番号の隣の行に書く
    expect(check(longJa, "bar", "ja").map(problemLine), "横棒の図の長い名前").toEqual([]);
  });
});

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-chart-export-"));

/** 書き出した file の中身。無い時は空にして、形の判定で落とす */
function writtenBytes(file: string): Buffer {
  try {
    return readFileSync(file);
  } catch {
    return Buffer.alloc(0);
  }
}

/** 見本の最初の段だけの原本。動画のコマを減らす */
const firstStep = (name: string): Json => {
  const sample = exampleJson(`${name}.json`) as { steps: Json[] };
  return { ...sample, steps: sample.steps.slice(0, 1) };
};

/**
 * 4 つの形式の書き出しを 1 件ずつに分ける。1 件で全てを書き出すと、混んだ機械で 1 件の上限 (10 秒) を超える。
 * 動画は 1 秒 1 コマと 2 秒に 1 コマで最初の段だけを撮り、PNG は同じ JSON を 2 回書き出してバイトで比べ、HTML は全ての段を送る
 */
describe.for([
  { shot: "video", name: DONUT },
  { shot: "png", name: BAR },
  { shot: "html", name: DONUT },
  { shot: "html", name: BAR },
] as const)("量の図の書き出し (#3560) $shot $name", ({ shot, name }) => {
  // thread を作り Chromium を起こす段は件の前に済ませ、件の中では書き出す分だけを待つ (#3602)。2 件目からは用意済みで待たない
  beforeAll(warmThread);
  it("chart-exports-every-format", async () => {
    if (shot === "video") {
      const files = await exportInThread(firstStep(name), { outDir: scratch(), formats: ["mp4", "gif"], fps: 1, gifFps: 0.5 });
      for (const format of ["mp4", "gif"] as const) expect(formatOf(writtenBytes(files[format] ?? "")), `${name} が ${format} に書き出されない`).toBe(format);
      return;
    }
    const diagram = exampleJson(`${name}.json`);
    if (shot === "png") {
      const shots: Buffer[] = [];
      for (let k = 0; k < 2; k++) {
        const files = await exportInThread(diagram, { outDir: scratch(), formats: ["png"] });
        shots.push(writtenBytes(files.png ?? ""));
      }
      expect(formatOf(shots[0] as Buffer), `${name} が PNG に書き出されない`).toBe("png");
      expect((shots[0] as Buffer).equals(shots[1] as Buffer), `${name} を 2 回書き出した PNG がバイト単位で違う`).toBe(true);
      return;
    }
    const files = await exportInThread(diagram, { outDir: scratch(), formats: ["html"] });
    const html = writtenBytes(files.html ?? "");
    expect(formatOf(html), `${name} が HTML に書き出されない`).toBe("html");
    const steps = (diagram as { steps: Json[] }).steps.length;
    expect(await captionSteps(html.toString("utf8"), 1280), `${name} の書き出した HTML で送れた段の数`).toHaveLength(steps);
  });
});

/**
 * 書き出しの thread は Chromium を 1 度だけ起こし、2 回目からの書き出しは同じ Chromium を借りる (#3602)。
 * 書き出すたびに起こすと、混んだ機械で PNG を 2 回書き出す件が 1 件の上限 (10 秒) を超えた
 */
describe("量の図の書き出しの thread (#3602)", () => {
  it("chart-export-thread-launches-once", async () => {
    const { launches, exports } = await threadStats();
    expect(exports, "書き出しの件より後に回し、thread で 2 回以上書き出している").toBeGreaterThanOrEqual(2);
    expect(launches, `thread で ${exports} 回書き出す間に Chromium を起こした回数`).toBe(1);
  });
});

describe("量の図の見本の file (#3560)", () => {
  it("chart-example-files-match", () => {
    const parse = api("parseNotation");
    for (const file of SAMPLE_FILES) expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
    for (const name of SAMPLES) {
      const ja = parse(fileText(`${name}.dragon`) ?? "", { lang: "ja" });
      const en = parse(fileText(`${name}.en.dragon`) ?? "", { lang: "en" });
      expect(ja.ok && en.ok, `${name} の見本の記法が読めない`).toBe(true);
      if (!ja.ok || !en.ok) continue;
      const source = ja.diagram as unknown as Source;
      expect(source.kind, `${name} の見本の図の種類`).toBe("chart");
      expect(shapeOf(en.diagram as unknown as Source), `${name} の英語版の項目と段と段ごとの set の数が日本語版と違う`).toEqual(shapeOf(source));
    }
    expect(
      SAMPLES.map((name) => (exampleJson(`${name}.json`) as unknown as Source).chart?.shape),
      "ドーナツの見本と横棒の見本の見た目",
    ).toEqual(["donut", "bar"]);
  });
});

describe("量の図の書き方の文書 (#3560)", () => {
  it("docs-describe-chart-diagram", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `chart` と 2 つの見た目と、`item` と `set` の行の形 */
    const forms: [string, RegExp][] = [
      ["chart の頭の行", /(^|[\s`])chart [^\s`][^\n`]*\[shape: (donut|bar|<[^>]+>)\]/mu],
      ["[shape: donut]", /\[shape: donut\]/u],
      ["[shape: bar]", /\[shape: bar\]/u],
      ["item の行", /(^|[\s`])item (<[^>]+>|[^\s`,]+) as (<[^>]+>|[^\s`]+)/mu],
      ["set の行", /(^|[\s`])set (<[^>]+>|[^\s:`]+): (<[^>]+>|[0-9]+)/mu],
    ];
    const describes = (where: string, text: string): void => {
      for (const [word, form] of forms) expect(form.test(text), `${where} に ${word} の書き方が無い`).toBe(true);
    };
    const chartFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as unknown as Source).kind === "chart";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      describes(path, text);
      if (path !== "README.md") expect(chartFences(text), `${path} に量の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"chart"/u.test(content), "使い方の頁の節に量の図 (chart) が無い").toBe(true);
    const sections = ["chart.dragon", "chart.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const parsed = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(parsed.ok && (parsed.diagram as unknown as Source).kind, `使い方の頁の量の図の節の例 (${i === 0 ? "chart.dragon" : "chart.en.dragon"}) が量の図として読めない`).toBe("chart");
    }
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    describes("使い方の頁", [content, ...sections, ...paragraphs].join("\n"));
    // 変更履歴の量の図の項 (#3560) を持つ節 (Unreleased か版の節) の Added に量の図が載る
    for (const [path, word] of [
      ["CHANGELOG.md", /chart/u],
      ["CHANGELOG.ja.md", /量の図/u],
    ] as const) {
      const entry = changelogEntry(join(ROOT, path), 3560);
      const added = /### (?:Added|追加)([\s\S]*?)(?=\n### |$)/u.exec(entry)?.[1] ?? "";
      expect(added, `${path} の量の図の項 (#3560) を持つ節に Added の節が無い`).not.toBe("");
      expect(word.test(added) && /\bchart\b/u.test(added), `${path} の Added に量の図 (chart) が無い`).toBe(true);
    }
    // 前提の文の描ける図の種類の数が、図の種類の置き場の数と合う。種類を足しても数を決め打ちしない
    const product = repoText(".ikkan/premises/product.md");
    const kinds = /描ける図の種類は([^\n]*?)の (\d+) つ/u.exec(product);
    const kindDirs = readdirSync(join(ROOT, "packages/dragon/src/kinds"), { withFileTypes: true }).filter((entry) => entry.isDirectory());
    expect(kinds?.[2], ".ikkan/premises/product.md の描ける図の種類の数").toBe(String(kindDirs.length));
    expect(kinds?.[1] ?? "", ".ikkan/premises/product.md の描ける図の種類に量の図 (chart) が無い").toContain("`chart`");
  });
});

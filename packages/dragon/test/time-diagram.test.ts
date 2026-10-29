// @vitest-environment jsdom
/**
 * 時間軸の図 (#3165)。
 *
 * 決まった間隔で刻む時間の上で、何がいつ起きたかを段で追う図。原本の JSON の `kind` は `time` で、
 * 目盛り (`scale`)、区切り (`period`)、印の列 (`rows`)、節目 (`points`)、拡大の範囲 (`zoom`) は種類の欄 `time` に置く。
 * 段の中には、針を進める出来事 (`now`)、印の色を変える出来事 (`mark`)、範囲の括弧と囲み (`span`) を置く。
 * 拡大の帯の箱は 1 度宣言すれば列ごとに繰り返し、線は `at` の列の箱どうしを結ぶ。受ける箱を別の列から選ぶ時は `into` を書く。
 * 見た目の元は試作の `docs/design/base/scenes/finality.js`。針は目盛り 1 つを決まった秒数で進み、拡大した目盛りでは列の線を待つ。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、字は SVG で確かめる。
 * 狭い枠で寄って追う窓は頁に置いて読むので jsdom で回し、書き出しは命令を別の process で打って確かめる。
 * 見本の file と、時間軸の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api, type Json, type LineError, patched, pointers, smallSequence } from "./diagram-support";
import { formatOf, runCli } from "./export-support";
import { place, releasePlaced } from "./follow-support";
import { covers, draw, type LaidBox, type Layout, type Rect, type Rendered, sampleTimes, type Timeline } from "./render-support";

/** 書き出し 1 回に許す時間 (`export.test.ts` と同じ) */
const SLOW = 180_000;

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 試作 (`finality.js`) の 10 段の題 */
const FINALITY_STEPS = [
  "ブロックを出す",
  "委員会が投票する",
  "空く slot もある",
  "checkpoint を決める",
  "票が積み上がる",
  "正当化する",
  "次の epoch も同じ",
  "前の checkpoint が確定する",
  "確定が 1 epoch ずつ進む",
  "確定したら戻せない",
] as const;

/** ブロックの確定の図で、段の終わりに針がいる目盛りの境 (0 から数える)。段 1 から段 3 で拡大した 4 列を進む */
const FINALITY_NEEDLE = [0, 1, 4, 4, 32, 32, 64, 64, 96, 96] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

/** 時間軸。`x` から目盛り 1 つの幅 `unit` で `count` 個並べ、`line` の高さに時刻の目盛りの線を引く */
interface TimeAxis {
  x: number;
  w: number;
  unit: number;
  count: number;
  line: number;
}

/** 印の列。宣言した順に上から並べる */
interface TimeRow extends Rect {
  id: string;
  name: string;
}

/** 目盛り 1 つの印。`empty` は空きの印。`colors` は色を変えた段と出来事と色 */
interface TimeMark extends Rect {
  row: string;
  unit: number;
  empty: boolean;
  colors: { step: number; event: number; color: string }[];
}

/** 時刻の字。目盛りの境 `at` に置く */
interface TimeTick {
  at: number;
  x: number;
  text: string;
}

/** 区切り。`name` は区切りの名前と番号、`range` はその区切りの目盛りの番号の範囲 */
interface TimePeriod extends Rect {
  index: number;
  from: number;
  to: number;
  name: string;
  range: string;
}

/** 節目。置いた目盛り `unit` の印の下の旗の丸。`changes` は状態の字と色を変えた段と出来事 */
interface TimePoint {
  id: string;
  unit: number;
  cx: number;
  cy: number;
  r: number;
  changes: { step: number; event: number; text: string; color?: string }[];
}

/** 拡大の帯の列。目盛り `unit` の列に、宣言した箱を同じ並びで置く */
interface TimeColumn extends Rect {
  unit: number;
  head: string;
  boxes: (LaidBox & { empty?: boolean })[];
}

/** 拡大の帯。軸の上の拡大した範囲の枠 `frame` と、枠から帯へつなぐ点線 `guides` */
interface TimeZoom {
  from: number;
  to: number;
  frame: Rect;
  guides: Point[][];
  columns: TimeColumn[];
}

/** 範囲の括弧 (`bracket`) か囲み (`box`)。`until` は消える段 (無ければ最後の段まで残る) */
interface TimeSpan extends Rect {
  step: number;
  event: number;
  kind: "bracket" | "box";
  from: number;
  to: number;
  text: string;
  textRect: Rect;
  until?: number;
}

/** 中身の帯の欄。物差しの欄は `meter` を持ち、`line` の割合の所に線を引く */
interface TimeField {
  name: string;
  meter?: { line: number; x: number; w: number };
}

interface TimeLayout extends Layout {
  kind: string;
  axis: TimeAxis;
  rows: TimeRow[];
  marks: TimeMark[];
  ticks: TimeTick[];
  periods: TimePeriod[];
  points: TimePoint[];
  zoom?: TimeZoom;
  spans: TimeSpan[];
  strip?: Rect & { fields: TimeField[] };
}

interface TimeTimeline extends Timeline {
  /** 針の動き。[時刻, 目盛りの境の位置] の並びで、間は真っ直ぐ進む */
  needle: Point[];
  /** 針が目盛りを過ぎた時刻 */
  units: { unit: number; passed: number }[];
  /** 物差しの満ち具合の動き。[時刻, 割合] の並びで、間は真っ直ぐ変わる */
  meters: { field: string; keys: Point[] }[];
}

interface TimeRendered extends Omit<Rendered, "layout" | "timeline"> {
  layout: TimeLayout;
  timeline: TimeTimeline;
}

interface SourceEvent {
  type: string;
  from?: string | number;
  to?: string | number;
  at?: number;
  into?: number;
  box?: string;
  row?: string;
  text?: string;
  color?: string;
  shape?: string;
}

interface Source {
  kind: string;
  title: string;
  view?: string;
  boxes: { id: string; name: string }[];
  steps: { title: string; events: SourceEvent[] }[];
  time?: { rows: { id: string }[]; points?: { id: string; at: number }[]; zoom?: { from: number; to: number } };
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

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): TimeRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "時間軸の図を描けない").toBe("");
  return rendered as unknown as TimeRendered;
}

/** 真っ直ぐ進む動き `keys` の、時刻 `t` の値 */
function valueAt(keys: Point[], t: number): number {
  const first = keys[0];
  if (!first) return Number.NaN;
  if (t <= first[0]) return first[1];
  for (let k = 1; k < keys.length; k++) {
    const [t1, v1] = keys[k] as Point;
    const [t0, v0] = keys[k - 1] as Point;
    if (t <= t1) return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
  }
  return (keys[keys.length - 1] as Point)[1];
}

/** 針が初めて境 `position` に着く時刻 */
function reachAt(needle: Point[], position: number): number {
  for (let k = 1; k < needle.length; k++) {
    const [t0, p0] = needle[k - 1] as Point;
    const [t1, p1] = needle[k] as Point;
    if (p0 <= position && position <= p1 && p1 > p0) return t0 + ((t1 - t0) * (position - p0)) / (p1 - p0);
    if (p0 === position) return t0;
  }
  return Number.NaN;
}

/** 段 `s` の終わりに針がいる境 */
const needleAtEnd = (timeline: TimeTimeline, s: number): number => valueAt(timeline.needle, (timeline.steps[s]?.end ?? 0) - 1e-6);

const near = (a: number, b: number, tolerance = 0.5): boolean => Math.abs(a - b) <= tolerance;
const inside = (p: Point, r: Rect, tolerance = 1): boolean => p[0] >= r.x - tolerance && p[0] <= r.x + r.w + tolerance && p[1] >= r.y - tolerance && p[1] <= r.y + r.h + tolerance;

const pointOf = (layout: TimeLayout, id: string): TimePoint => {
  const found = layout.points.find((p) => p.id === id);
  expect(found, `節目 ${id} が並べた図に無い`).toBeDefined();
  return found as TimePoint;
};

/** 原本の JSON の、列と節目と段と段ごとの出来事の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  rows: (d.time?.rows ?? []).length,
  points: (d.time?.points ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

const zoomLine = (from: string, to: string, at: number, extra: Record<string, Json> = {}): Json => ({ type: "edge", from, to, carry: { kind: "envelope" }, at, ...extra });

/** 区切りと拡大の帯と物差しを持つ最小の時間軸の図 */
function smallTime(): Json {
  return {
    version: 1,
    kind: "time",
    title: "小さな時間の図",
    boxes: [
      { id: "p", name: "提案者" },
      { id: "r", name: "ブロック" },
    ],
    strip: { title: "進み", fields: ["票"], meters: [{ field: "票", line: "2/3" }] },
    time: {
      scale: { unit: "slot", length: "12s", count: 8, from: 3200 },
      period: { name: "epoch", length: 4, from: 100 },
      rows: [{ id: "r", name: "ブロック", color: "blue", empty: [2] }],
      points: [
        { id: "P", at: 0 },
        { id: "Q", at: 4 },
      ],
      zoom: { from: 0, to: 1 },
    },
    steps: [
      {
        title: "出す",
        body: "提案者がブロックを出し、針が 2 つの slot を進む。",
        events: [zoomLine("p", "r", 0), zoomLine("p", "r", 1, { into: 0 }), { type: "now", to: 1 }],
      },
      {
        title: "確定する",
        body: "針が最後まで進み、最初の epoch が確定する。",
        events: [
          { type: "now", to: 7 },
          { type: "strip", field: "票", value: "97%" },
          { type: "swap", box: "P", text: "確定", color: "green" },
          { type: "mark", row: "r", from: 0, to: 3, color: "green" },
          { type: "span", from: 0, to: 3, text: "1 epoch" },
          { type: "span", from: 0, to: 3, text: "戻せない", shape: "box", color: "rose" },
          { type: "edge", from: "P", to: "Q", label: "2/3 を超えた", carry: { kind: "none" } },
        ],
      },
    ],
  };
}

/** 区切りも拡大の帯も箱も持たない時間軸の図 */
function bareTime(): Json {
  return {
    version: 1,
    kind: "time",
    title: "目盛りだけの図",
    boxes: [],
    time: { scale: { unit: "day", length: "1d", count: 10 }, rows: [{ id: "batch", name: "提出" }] },
    steps: [{ title: "進む", body: "針が 10 日を進む。", events: [{ type: "now", to: 9 }] }],
  };
}

describe("時間軸の図の原本の JSON (#3165)", () => {
  it("schema-accepts-time-diagram", () => {
    for (const [name, input] of [
      ["区切りと拡大の帯を持つ時間軸の図", smallTime()],
      ["区切りも拡大の帯の箱も持たない時間軸の図", bareTime()],
    ] as const) {
      const checked = api("validateDiagram")(input);
      expect(checked.ok, `${name}が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
  });

  it("schema-rejects-misplaced-time-fields", () => {
    const validate = api("validateDiagram");
    const inSequence = (event: Json): Json => patched(smallSequence(), ["steps", 0, "events"], [event]);
    const cases: [string, Json, string][] = [
      ["時系列図に time の欄", patched(smallSequence(), ["time"], { scale: { unit: "slot", length: "12s", count: 4 }, rows: [{ id: "r", name: "r" }] }), "/time"],
      ["時系列図に針を進める出来事", inSequence({ type: "now", to: 1 }), "/steps/0/events/0/type"],
      ["時系列図に印の色を変える出来事", inSequence({ type: "mark", row: "r", from: 0, to: 1, color: "green" }), "/steps/0/events/0/type"],
      ["時系列図に範囲の括弧", inSequence({ type: "span", from: 0, to: 1, text: "範囲" }), "/steps/0/events/0/type"],
      ["時系列図の線の列", inSequence({ type: "edge", from: "a", to: "b", carry: { kind: "envelope" }, at: 0 }), "/steps/0/events/0/at"],
      ["時間軸の図に git の欄", patched(smallTime(), ["git"], { branches: [{ id: "main" }] }), "/git"],
      ["時間軸の図に state の欄", patched(smallTime(), ["state"], { paths: [{ from: "p", to: "r" }] }), "/state"],
      ["時間軸の図に sequence の欄", patched(smallTime(), ["sequence"], { lifelines: ["p"] }), "/sequence"],
      ["数と単位の組でない単位の長さ", patched(smallTime(), ["time", "scale", "length"], "12 sec"), "/time/scale/length"],
    ];
    for (const [name, input, pointer] of cases) {
      const ja = validate(input);
      expect(pointers(ja), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      const messages = en.ok ? [] : en.errors.map((e) => e.message);
      expect(messages.filter((m) => KANA.test(m)), `${name} の英語の誤りの文に仮名か漢字がある`).toEqual([]);
    }
  });
});

describe("時間軸の図の記法 (#3165)", () => {
  it("notation-compiles-time-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const name of ["finality", "finality.en", "withdraw", "withdraw.en"]) {
      const text = fileText(`${name}.dragon`);
      expect(text, `${name}.dragon が無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: name.endsWith(".en") ? "en" : "ja" });
      expect(parsed.ok, `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      expect(parsed.ok ? parsed.diagram : undefined, `${name}.dragon から作った JSON が ${name}.json と違う`).toEqual(exampleJson(`${name}.json`));
    }
  });

  it("notation-rejects-misused-time-lines", () => {
    const parse = api("parseNotation");
    const head = [
      "time 小さな時間の図",
      "scale slot 12s 8 [from: 3200]",
      "period epoch 4 [from: 100]",
      "row r [empty: 2]",
      "point P at 0",
      "point Q at 4",
      "zoom 0-1",
      "box p",
      "box q",
      "strip 進み: 票 [meter: 2/3]",
    ];
    const step = ["step 進む", "  say 進む。", "  now -> 1"];
    const bare = ["time 小さな時間の図", "scale slot 12s 8", "row r", "point P at 0", "point Q at 4"];
    for (const lines of [
      [...head, ...step],
      [...bare, ...step],
    ]) {
      const base = parse(lines.join("\n"));
      expect(base.ok, `誤りの行を足す前の記法が読めない: ${base.ok ? "" : JSON.stringify(base.errors)}`).toBe(true);
    }
    const at = head.length + step.length;
    const before = head.length;
    // 記法の行と、誤りの行 (0 から数える) と、その行で誤りを指す語
    const cases: [string, string[], number, string][] = [
      ["宣言していない列への mark", [...head, ...step, "  mark zzz 0 [color: green]"], at, "zzz"],
      ["宣言していない節目への note", [...head, ...step, "  note Z9: 提案済み"], at, "Z9"],
      ["目盛りの数を超える時刻", [...head, ...step, "  now -> 9"], at, "9"],
      ["目盛りの数を超える範囲", [...head, ...step, "  mark r 6-9 [color: green]"], at, "6-9"],
      ["前の時刻より戻る now", [...head, ...step, "  now -> 0"], at, "0"],
      ["拡大の範囲の外の列を選ぶ線", [...head, ...step, "  p -> q [at: 5]"], at, "at"],
      ["zoom の無い図の列を選ぶ線", [...bare, ...step, "  P -> Q [at: 0]"], bare.length + step.length, "at"],
      ["既にある名札と同じ名札の節目", [...head, "point r at 1", ...step], before, "r"],
      ["最初の step より前の now", [...head, "now -> 0", ...step], before, "now"],
      ["最初の step より前の mark", [...head, "mark r 0 [color: green]", ...step], before, "mark"],
      ["最初の step より前の span", [...head, "span 0-3: 範囲", ...step], before, "span"],
    ];
    for (const [name, lines, line, token] of cases) {
      const want = { line: line + 1, column: (lines[line] ?? "").indexOf(token) + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-limits-time-lines-to-time", () => {
    const parse = api("parseNotation");
    // 記法の行と、誤りの行 (1 から数える)
    const cases: [string, string[], number][] = [
      ["時系列図の scale の行", ["sequence 時間の行", "box a", "scale slot 12s 8", "step 送る", "  say 送る。", "  a -> a"], 3],
      ["構成図の period の行", ["architecture 時間の行", "box a", "box b", "period epoch 4", "step 送る", "  say 送る。", "  a -> b"], 4],
      ["状態遷移図の row の行", ["state 時間の行", "box a", "row r", "step 送る", "  say 送る。", "  start -> a"], 3],
      ["枝分かれの図の point の行", ["git 時間の行", "branch main", "point p at 0", "step 積む", "  say 積む。", "  commit A on main"], 3],
      ["時系列図の zoom の行", ["sequence 時間の行", "box a", "zoom 0-1", "step 送る", "  say 送る。", "  a -> a"], 3],
      ["構成図の mark の行", ["architecture 時間の行", "box a", "box b", "step 送る", "  say 送る。", "  a -> b", "  mark a 0 [color: green]"], 7],
      ["状態遷移図の span の行", ["state 時間の行", "box a", "step 送る", "  say 送る。", "  start -> a", "  span 0-1: 範囲"], 6],
      ["枝分かれの図の物差しの欄", ["git 時間の行", "branch main", "strip 進み: 票 [meter: 2/3]", "step 積む", "  say 積む。", "  commit A on main"], 3],
    ];
    for (const [name, lines, line] of cases) {
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first?.line, `${name} が ${line} 行目の誤りにならない (${lang})`).toBe(line);
        // 時間軸の図の頭の語を名指して、その図でしか書けないことを示す
        expect(first?.message ?? "", `${name} の誤りの文が時間軸の図 (time) を名指さない (${lang})`).toContain("time");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-keeps-now-plain-outside-time", () => {
    const parse = api("parseNotation");
    const cases: [string, string[], string, string][] = [
      ["sequence", ["sequence 今の名札", "box now as 今", "box later as 後", "step 送る", "  say 送る。", "  now -> later: 送る"], "now", "later"],
      ["architecture", ["architecture 今の名札", "box now as 今", "box later as 後", "step 送る", "  say 送る。", "  now -> later: 送る"], "now", "later"],
      ["state", ["state 今の名札", "box now as 今", "box later as 後", "step 送る", "  say 送る。", "  start -> now", "  now -> later: 送る"], "now", "later"],
      ["git", ["git 今の名札", "branch now", "step 積む", "  say 積む。", "  commit A on now", "  commit B on now", "  now -> A: 戻す"], "now", "A"],
    ];
    for (const [kind, lines, from, to] of cases) {
      const parsed = parse(lines.join("\n"));
      expect(parsed.ok, `${kind} で now を名札にした線が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as Source;
      const line = diagram.steps?.[0]?.events?.at(-1);
      expect(line && { type: line.type, from: line.from, to: line.to }, `${kind} の now からの線`).toEqual({ type: "edge", from, to });
    }
  });

  it("time-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of ["finality.dragon", "finality.en.dragon", "withdraw.dragon", "withdraw.en.dragon"]) {
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

describe("時間軸の図の並べ方 (#3165)", () => {
  it("time-axis-places-units-evenly", () => {
    const { layout } = render(exampleJson("finality.json"));
    const { axis } = layout;
    expect(axis.count, "目盛りの数").toBe(96);
    expect(near(axis.w, axis.unit * axis.count, 1e-6), "軸の幅が目盛りの幅と数に合わない").toBe(true);
    expect(layout.rows.map((r) => r.id), "印の列が宣言した順でない").toEqual(["ブロック", "票"]);
    layout.rows.slice(1).forEach((row, k) => expect(row.y, `${row.id} の列が上の列より下に無い`).toBeGreaterThanOrEqual((layout.rows[k] as TimeRow).y + (layout.rows[k] as TimeRow).h));
    for (const row of layout.rows) {
      const marks = layout.marks.filter((m) => m.row === row.id).sort((a, b) => a.unit - b.unit);
      expect(marks.map((m) => m.unit), `${row.id} の列の印が目盛りごとに 1 つでない`).toEqual(Array.from({ length: 96 }, (_, k) => k));
      for (const m of marks) {
        // 印は目盛りの真ん中に置き、どの印も同じ幅
        expect(near(m.x + m.w / 2, axis.x + (m.unit + 0.5) * axis.unit, 0.05), `${row.id} の ${m.unit} の印が目盛りの真ん中に無い`).toBe(true);
        expect(near(m.w, (marks[0] as TimeMark).w, 1e-6), `${row.id} の ${m.unit} の印の幅が揃わない`).toBe(true);
        expect(m.y >= row.y - 1e-6 && m.y + m.h <= row.y + row.h + 1e-6, `${row.id} の ${m.unit} の印が列の中に無い`).toBe(true);
      }
    }
    const empties = layout.marks.filter((m) => m.empty).map((m) => `${m.row} ${m.unit}`);
    expect(empties, "空きの印").toEqual(["ブロック 3", "ブロック 13", "ブロック 45", "ブロック 79"]);
    // 区切りの境ごとに、区切りの名前と番号と目盛りの番号の範囲を置く
    expect(
      layout.periods.map((p) => ({ index: p.index, from: p.from, to: p.to, name: p.name })),
      "区切り",
    ).toEqual([
      { index: 0, from: 0, to: 31, name: "epoch 100" },
      { index: 1, from: 32, to: 63, name: "epoch 101" },
      { index: 2, from: 64, to: 95, name: "epoch 102" },
    ]);
    layout.periods.forEach((p, k) => {
      expect(p.range, `区切り ${p.name} の目盛りの番号の範囲`).toMatch(new RegExp(`^slot ${3200 + 32 * k}\\D+${3231 + 32 * k}$`, "u"));
      expect(near(p.x, axis.x + p.from * axis.unit, 0.05) && near(p.x + p.w, axis.x + (p.to + 1) * axis.unit, 0.05), `区切り ${p.name} の幅が目盛りに合わない`).toBe(true);
    });
  });

  it("time-axis-labels-follow-language", () => {
    const want = { ja: ["0 分", "6.4 分", "12.8 分", "19.2 分"], en: ["0 min", "6.4 min", "12.8 min", "19.2 min"] } as const;
    for (const lang of ["ja", "en"] as const) {
      const { layout, svg } = render(exampleJson(lang === "en" ? "finality.en.json" : "finality.json"), lang);
      expect(layout.ticks.map((t) => t.text), `ブロックの確定の時刻の字 (${lang})`).toEqual([...want[lang]]);
      expect(layout.ticks.map((t) => t.at), `ブロックの確定の時刻の字を置く境 (${lang})`).toEqual([0, 32, 64, 96]);
      for (const t of layout.ticks) {
        expect(near(t.x, layout.axis.x + t.at * layout.axis.unit, 0.05), `時刻の字 ${t.text} が境に無い (${lang})`).toBe(true);
        expect(svg, `時刻の字 ${t.text} が描かれない (${lang})`).toContain(`>${t.text}<`);
      }
      const withdraw = render(exampleJson(lang === "en" ? "withdraw.en.json" : "withdraw.json"), lang).layout;
      expect(withdraw.ticks.length, `引き出しの時刻の字の数 (${lang})`).toBeGreaterThan(1);
      const unit = lang === "en" ? / d$/u : / 日$/u;
      for (const t of withdraw.ticks) expect(t.text, `引き出しの時刻の字が日の単位でない (${lang})`).toMatch(unit);
    }
  });

  it("time-needle-sweeps-at-fixed-speed", () => {
    const { timeline } = render(exampleJson("finality.json"));
    const source = exampleJson("finality.json") as unknown as Source;
    const zoom = source.time?.zoom ?? { from: 0, to: -1 };
    const zoomed = (u: number): boolean => u >= zoom.from && u <= zoom.to;
    expect(timeline.needle?.length, "針の動きが無い").toBeGreaterThan(1);
    const passed = new Map(timeline.units.map((u) => [u.unit, u.passed]));
    expect([...passed.keys()].sort((a, b) => a - b), "針が過ぎた目盛り").toEqual(Array.from({ length: 96 }, (_, k) => k));
    // 針が過ぎた目盛りの時刻は、針が目盛りの右の境に着いた時刻
    for (const [unit, at] of passed) expect(near(at, reachAt(timeline.needle, unit + 1), 1e-6), `目盛り ${unit} を過ぎた時刻が針の動きと合わない`).toBe(true);
    // 拡大していない目盛りは、どの段でも同じ秒数で進む
    const lengths: number[] = [];
    for (let u = 1; u < 96; u++) {
      if (zoomed(u) || zoomed(u - 1)) continue;
      const a = passed.get(u - 1) as number;
      const b = passed.get(u) as number;
      if (timeline.steps.some((s) => covers(s, a) && covers(s, b))) lengths.push(b - a);
    }
    expect(lengths.length, "拡大していない目盛りの進みを数えられない").toBeGreaterThan(80);
    for (const length of lengths) expect(near(length, lengths[0] as number, 1e-6), `目盛り 1 つの進みが ${length} 秒で、${lengths[0]} 秒と揃わない`).toBe(true);
    // 拡大した目盛りでは、その段のその列の線が届くまで針が待つ
    source.steps.forEach((step, s) => {
      step.events.forEach((event, e) => {
        if (event.type !== "edge" || event.at === undefined) return;
        const drawn = timeline.edges.find((t) => t.step === s && t.event === e)?.drawn;
        expect(drawn, `段 ${s + 1} の列 ${event.at} の線の時刻が無い`).toBeDefined();
        const left = passed.get(event.at) as number;
        if (covers(timeline.steps[s] as { start: number; end: number }, left)) expect(left, `段 ${s + 1} で列 ${event.at} の線が届く前に針が目盛りを過ぎる`).toBeGreaterThanOrEqual((drawn ?? 0) - 1e-6);
      });
    });
    // 段の長さは針の進みから決まり、針は段の中で進み終える
    source.steps.forEach((step, s) => {
      if (!step.events.some((e) => e.type === "now")) return;
      const span = timeline.steps[s] as { start: number; end: number };
      const moving = timeline.needle.filter(([t]) => t > span.start && t < span.end);
      expect(moving.length, `段 ${s + 1} で針が動かない`).toBeGreaterThan(0);
    });
  });

  it("time-zoom-repeats-boxes-per-column", () => {
    for (const lang of ["ja", "en"] as const) {
      const name = lang === "en" ? "finality.en.json" : "finality.json";
      const source = exampleJson(name) as unknown as Source;
      const { layout } = render(source as unknown as Json, lang);
      const zoom = layout.zoom;
      expect(zoom, `拡大の帯が無い (${lang})`).toBeDefined();
      if (!zoom) continue;
      expect(zoom.columns.map((c) => c.unit), `拡大の帯の列 (${lang})`).toEqual([0, 1, 2, 3]);
      const ids = source.boxes.map((b) => b.id);
      const seconds = lang === "en" ? ["0 s", "12 s", "24 s", "36 s"] : ["0 秒", "12 秒", "24 秒", "36 秒"];
      zoom.columns.forEach((column, k) => {
        expect(column.boxes.map((b) => b.id), `列 ${k} の箱が宣言した並びでない (${lang})`).toEqual(ids);
        expect(column.head, `列 ${k} の上の字に目盛りの番号が無い (${lang})`).toContain(`slot ${3200 + k}`);
        expect(column.head, `列 ${k} の上の字に時刻が無い (${lang})`).toContain(seconds[k]);
        column.boxes.forEach((box, b) => {
          const first = (zoom.columns[0] as TimeColumn).boxes[b] as LaidBox;
          expect(near(box.y, first.y, 1e-6), `列 ${k} の ${box.id} の高さが最初の列と違う (${lang})`).toBe(true);
          expect(near(box.x + box.w / 2, column.x + column.w / 2, 0.5), `列 ${k} の ${box.id} が列の真ん中に無い (${lang})`).toBe(true);
        });
      });
      // 印の列と同じ名札の箱は、その列が空きにした目盛りの列で空きの枠になる
      const row = (source.time?.rows ?? [])[0]?.id ?? "";
      expect(
        zoom.columns.map((c) => c.boxes.find((b) => b.id === row)?.empty === true),
        `空きにした目盛りの列だけが空きの枠でない (${lang})`,
      ).toEqual([false, false, false, true]);
      // 線は at の列の箱から、into を書けばその列の箱へ引く
      source.steps.forEach((step, s) => {
        step.events.forEach((event, e) => {
          if (event.type !== "edge" || event.at === undefined) return;
          const laid = layout.edges.find((x) => x.step === s && x.event === e);
          expect(laid, `段 ${s + 1} の列 ${event.at} の線が並べた図に無い (${lang})`).toBeDefined();
          const columnOf = (unit: number): TimeColumn => zoom.columns.find((c) => c.unit === unit) as TimeColumn;
          const fromBox = columnOf(event.at).boxes.find((b) => b.id === event.from) as LaidBox;
          const toBox = columnOf(event.into ?? event.at).boxes.find((b) => b.id === event.to) as LaidBox;
          const points = laid?.points ?? [];
          expect(inside(points[0] as Point, fromBox, 2), `段 ${s + 1} の線が列 ${event.at} の ${event.from} から出ない (${lang})`).toBe(true);
          expect(inside(points[points.length - 1] as Point, toBox, 2), `段 ${s + 1} の線が列 ${event.into ?? event.at} の ${event.to} に着かない (${lang})`).toBe(true);
        });
      });
      // 軸の上の拡大した範囲を枠で囲み、枠の上の角から拡大の帯へ点線でつなぐ
      const { axis } = layout;
      const top = Math.min(...layout.rows.map((r) => r.y));
      const bottom = Math.max(...layout.rows.map((r) => r.y + r.h));
      expect(zoom.frame.x <= axis.x + zoom.from * axis.unit && zoom.frame.x + zoom.frame.w >= axis.x + (zoom.to + 1) * axis.unit, `拡大の枠が拡大した目盛りを囲まない (${lang})`).toBe(true);
      expect(zoom.frame.y <= top && zoom.frame.y + zoom.frame.h >= bottom, `拡大の枠が印の列を囲まない (${lang})`).toBe(true);
      expect(zoom.guides.length, `拡大の枠から帯への点線の数 (${lang})`).toBe(2);
      const band = Math.max(...zoom.columns.map((c) => c.y + c.h));
      for (const guide of zoom.guides) {
        const [start, end] = [guide[0] as Point, guide[guide.length - 1] as Point];
        expect(near(start[1], zoom.frame.y, 1), `点線が拡大の枠の上の辺から出ない (${lang})`).toBe(true);
        expect(end[1] <= band + 1 && end[1] < start[1], `点線が拡大の帯へ届かない (${lang})`).toBe(true);
      }
    }
  });

  it("time-points-show-states", () => {
    const { layout, timeline, svg } = render(exampleJson("finality.json"));
    const lowest = Math.max(...layout.marks.map((m) => m.y + m.h));
    for (const [id, unit] of [
      ["C100", 0],
      ["C101", 32],
      ["C102", 64],
    ] as const) {
      const point = pointOf(layout, id);
      expect(point.unit, `${id} を置いた目盛り`).toBe(unit);
      expect(near(point.cx, layout.axis.x + (unit + 0.5) * layout.axis.unit, 0.05), `${id} が目盛りの真ん中に無い`).toBe(true);
      expect(point.cy - point.r, `${id} が印の下に無い`).toBeGreaterThan(lowest);
      expect(svg, `${id} の名札が描かれない`).toContain(`>${id}<`);
      for (const change of point.changes) {
        expect(svg, `${id} の状態 ${change.text} が描かれない`).toContain(`>${change.text}<`);
        expect(
          timeline.events.some((t) => t.step === change.step && t.event === change.event),
          `${id} の状態 ${change.text} を変える時刻が無い`,
        ).toBe(true);
      }
    }
    expect(
      pointOf(layout, "C100").changes.map((c) => ({ step: c.step, text: c.text, color: c.color })),
      "C100 の状態と丸の色",
    ).toEqual([
      { step: 3, text: "提案済み", color: "blue" },
      { step: 5, text: "正当化", color: "violet" },
      { step: 7, text: "確定", color: "green" },
    ]);
    // 節目どうしの線は 2 つの丸の間に引き、名前を線の下に置く
    const source = exampleJson("finality.json") as unknown as Source;
    const links = source.steps.flatMap((step, s) => step.events.flatMap((e, k) => (e.type === "edge" && e.at === undefined ? [{ ...e, step: s, event: k }] : [])));
    expect(links.length, "節目どうしの線の数").toBe(2);
    for (const link of links) {
      const a = pointOf(layout, String(link.from));
      const b = pointOf(layout, String(link.to));
      const laid = layout.edges.find((x) => x.step === link.step && x.event === link.event);
      const points = laid?.points ?? [];
      const [x0, y0] = (points[0] ?? [Number.NaN, Number.NaN]) as Point;
      const [x1, y1] = (points[points.length - 1] ?? [Number.NaN, Number.NaN]) as Point;
      expect(x0 >= a.cx + a.r - 1e-6 && x1 <= b.cx - b.r + 1e-6, `${link.from} から ${link.to} の線が 2 つの丸の間に無い`).toBe(true);
      expect(near(y0, a.cy, 1) && near(y1, b.cy, 1), `${link.from} から ${link.to} の線が丸の高さに無い`).toBe(true);
      const label = layout.labels.find((l) => l.step === link.step && l.event === link.event);
      expect(label, `${link.from} から ${link.to} の線の名前が無い`).toBeDefined();
      expect(label?.y ?? 0, `${link.from} から ${link.to} の線の名前が線の下に無い`).toBeGreaterThanOrEqual(a.cy);
    }
  });

  it("time-span-draws-bracket-and-box", () => {
    const { layout, svg } = render(exampleJson("finality.json"));
    const { axis } = layout;
    expect(
      layout.spans.map((s) => ({ step: s.step, kind: s.kind, from: s.from, to: s.to, until: s.until })),
      "ブロックの確定の括弧と囲み",
    ).toEqual([
      { step: 3, kind: "bracket", from: 0, to: 31, until: 7 },
      { step: 7, kind: "bracket", from: 0, to: 63, until: undefined },
      { step: 9, kind: "box", from: 0, to: 32, until: undefined },
    ]);
    const lowest = Math.max(...layout.marks.map((m) => m.y + m.h));
    const top = Math.min(...layout.rows.map((r) => r.y));
    for (const span of layout.spans) {
      expect(svg, `範囲の字 ${span.text} が描かれない`).toContain(`>${span.text}<`);
      if (span.kind === "bracket") {
        // 括弧は印の下に範囲の幅で置き、字を括弧の下に置く
        expect(near(span.x, axis.x + span.from * axis.unit, 1) && near(span.x + span.w, axis.x + (span.to + 1) * axis.unit, 1), `括弧 ${span.text} の幅が範囲に合わない`).toBe(true);
        expect(span.y, `括弧 ${span.text} が印の下に無い`).toBeGreaterThan(lowest);
        expect(span.textRect.y, `括弧 ${span.text} の字が括弧の下に無い`).toBeGreaterThanOrEqual(span.y);
      } else {
        // 囲みは印の列の範囲を囲み、字を縁の札にする
        expect(span.x <= axis.x + span.from * axis.unit && span.x + span.w >= axis.x + (span.to + 1) * axis.unit, `囲み ${span.text} が範囲を囲まない`).toBe(true);
        expect(span.y <= top && span.y + span.h >= lowest, `囲み ${span.text} が印の列を囲まない`).toBe(true);
        expect(span.textRect.y < span.y && span.textRect.y + span.textRect.h > span.y, `囲み ${span.text} の字が縁の札でない`).toBe(true);
      }
    }
  });

  it("time-mark-recolors-marks", () => {
    const { layout, timeline } = render(exampleJson("finality.json"));
    const blocks = layout.marks.filter((m) => m.row === "ブロック" && !m.empty);
    const colored = (unit: number) => (blocks.find((m) => m.unit === unit)?.colors ?? []).map((c) => ({ step: c.step, color: c.color }));
    expect(colored(0), "ブロック 0 の色").toEqual([{ step: 7, color: "green" }]);
    for (const m of blocks.filter((b) => b.unit >= 1 && b.unit <= 32)) expect(colored(m.unit), `ブロック ${m.unit} の色`).toEqual([{ step: 8, color: "green" }]);
    for (const m of blocks.filter((b) => b.unit > 32)) expect(colored(m.unit), `ブロック ${m.unit} の色が変わる`).toEqual([]);
    for (const m of layout.marks.filter((b) => b.row === "票")) expect(m.colors, `票 ${m.unit} の色が変わる`).toEqual([]);
    for (const c of blocks.flatMap((m) => m.colors)) expect(timeline.events.some((t) => t.step === c.step && t.event === c.event), `段 ${c.step + 1} の印の色を変える時刻が無い`).toBe(true);
  });
});

describe("時間軸の図の中身の帯 (#3165)", () => {
  it("strip-meter-fills-with-needle", () => {
    const { layout, timeline, svg } = render(exampleJson("finality.json"));
    const field = layout.strip?.fields.find((f) => f.name === "今の epoch の票");
    expect(field?.meter, "今の epoch の票の欄が物差しでない").toBeDefined();
    expect(near(field?.meter?.line ?? 0, 2 / 3, 1e-6), "物差しの線が 2/3 の所に無い").toBe(true);
    expect(svg, "物差しの線の字が描かれない").toContain(">2/3<");
    const meter = timeline.meters?.find((m) => m.field === "今の epoch の票");
    expect(meter, "物差しの満ち具合の動きが無い").toBeDefined();
    const keys = meter?.keys ?? [];
    const at = (position: number): number => valueAt(keys, reachAt(timeline.needle, position));
    // 段 5 は針と一緒に 97% まで満ちる。間は針の進みに比例する
    const start5 = at(4);
    expect(near(at(32), 0.97, 0.005), `針が epoch の終わりに着いた時の満ち具合が ${at(32)}`).toBe(true);
    expect(near(at(18), start5 + ((0.97 - start5) * 14) / 28, 0.01), `段 5 の途中の満ち具合が針の進みに比例しない: ${at(18)}`).toBe(true);
    // 段 7 は区切りが替わって 0 から満ち直し、針と一緒に 97% まで満ちる
    const step7 = timeline.steps[6] as { start: number; end: number };
    expect(near(valueAt(keys, step7.start), 0.97, 0.005), "段 7 の始まりで前の区切りの満ち具合が残らない").toBe(true);
    expect(at(32.5), "区切りが替わっても 0 から満ち直さない").toBeLessThan(0.05);
    expect(near(at(48), 0.97 * 0.5, 0.02), `段 7 の途中の満ち具合が針の進みに比例しない: ${at(48)}`).toBe(true);
    expect(near(at(64), 0.97, 0.005), `段 7 の終わりの満ち具合が ${at(64)}`).toBe(true);
  });
});

describe("時間軸の図の描き方 (#3165)", () => {
  afterEach(() => releasePlaced());

  it("finality-renders-10-steps", () => {
    const source = exampleJson("finality.json") as unknown as Source;
    expect(source.steps.map((s) => s.title), "ブロックの確定の図の段の題が試作の 10 段と違う").toEqual([...FINALITY_STEPS]);
    const { layout, timeline } = render(source as unknown as Json);
    expect(timeline.steps, "時刻の表の段の数").toHaveLength(10);
    timeline.steps.forEach((step, i) => {
      expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
      if (i > 0) expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
    });
    expect(
      timeline.steps.map((_, s) => Math.round(needleAtEnd(timeline, s) * 1000) / 1000),
      "段の終わりに針がいる目盛りの境",
    ).toEqual([...FINALITY_NEEDLE]);
    const finalized = (id: string): number | undefined => pointOf(layout, id).changes.find((c) => c.color === "green")?.step;
    expect(finalized("C100"), "C100 が確定の色になる段").toBe(7);
    expect(finalized("C101"), "C101 が確定の色になる段").toBe(8);
    expect(finalized("C102"), "C102 が確定の色になる").toBeUndefined();
  });

  it("withdraw-renders-day-axis", () => {
    const source = exampleJson("withdraw.json") as unknown as Source;
    const { layout, timeline } = render(source as unknown as Json);
    expect(layout.zoom, "引き出しの図に拡大の帯がある").toBeUndefined();
    for (const t of layout.ticks) expect(t.text, "引き出しの時刻の字が日の単位でない").toMatch(/ 日$/u);
    // 7 日の挑戦の期間を囲みで示す
    const box = layout.spans.find((s) => s.kind === "box");
    expect(box && box.to - box.from + 1, "挑戦の期間の囲みが 7 日を囲まない").toBe(7);
    // 針が 7 日を進んだ段の後に、引き出しの節目が出る
    const moved = timeline.steps.map((_, s) => needleAtEnd(timeline, s) - (s === 0 ? 0 : needleAtEnd(timeline, s - 1)));
    const week = moved.findIndex((d) => near(d, 7, 1e-6));
    expect(week, "針が 7 日を進む段が無い").toBeGreaterThanOrEqual(0);
    const last = [...layout.points].sort((a, b) => b.unit - a.unit)[0];
    expect(last, "引き出しの節目が無い").toBeDefined();
    expect(last?.changes[0]?.step ?? -1, `引き出しの節目 ${last?.id} が針が 7 日を進んだ段より後に出ない`).toBeGreaterThan(week);
  });

  it("time-keeps-motion-rules", () => {
    for (const name of ["finality.json", "withdraw.json"]) {
      const { timeline } = render(exampleJson(name));
      for (const t of sampleTimes(timeline)) expect(timeline.labels.filter((span) => covers(span, t)).length, `${name} の ${t} 秒に見える線の名前`).toBeLessThanOrEqual(2);
      expect(timeline.badges.map((b) => b.step), `${name} の段の番号`).toEqual(timeline.steps.map((_, i) => i));
      for (const badge of timeline.badges) {
        const step = timeline.steps[badge.step];
        expect(badge.appears, `${name} の段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
      }
    }
  });

  it("time-opens-fixed", () => {
    for (const name of ["finality.json", "withdraw.json"]) {
      const source = exampleJson(name) as unknown as Source;
      expect(source.view, `${name} が見せ方を書いている`).toBeUndefined();
      const rendered = render(source as unknown as Json);
      const choose = draw("chooseView");
      for (const width of [rendered.layout.width, 728]) {
        expect(choose(rendered as unknown as Rendered, width).mode, `${width}px の枠で ${name} の見せ方`).toBe("fixed");
      }
    }
  });

  it("time-follows-needle-when-narrow", () => {
    const narrow = 360;
    const rendered = render(exampleJson("finality.json"));
    const chosen = draw("chooseView")(rendered as unknown as Rendered, narrow);
    expect(chosen.textPx, `${narrow}px の枠で全体を収めた字の大きさ`).toBeLessThan(10.5);
    expect(chosen.mode, `${narrow}px の枠のブロックの確定の見せ方`).toBe("follow");
    const placed = place("finality", "finality.json", narrow);
    const layout = placed.layout as unknown as TimeLayout;
    const { timeline } = rendered;
    const top = Math.min(...layout.rows.map((r) => r.y));
    const bottom = Math.max(...layout.rows.map((r) => r.y + r.h));
    for (let s = 0; s < placed.steps; s++) {
      const win = placed.windowAt(s);
      const x = layout.axis.x + valueAt(timeline.needle, placed.stillAt(s)) * layout.axis.unit;
      expect(x >= win.x && x <= win.x + win.w, `段 ${s + 1} の終わりに針 (x ${x}) が窓 (${win.x} から ${win.x + win.w}) の中に無い`).toBe(true);
      expect(top < win.y + win.h && bottom > win.y, `段 ${s + 1} の終わりに印の列が窓の中に無い`).toBe(true);
    }
  });
});

describe("時間軸の図の書き出し (#3165)", () => {
  it(
    "export-writes-time-diagram",
    async () => {
      const json = join(EXAMPLES, "finality.json");
      expect(existsSync(json), "finality.json が無い").toBe(true);
      const out = join(mkdtempSync(join(tmpdir(), "dragon-time-")), "out");
      const ran = await runCli(["export", json, "--out", out, "--fps", "2", "--gif-fps", "1"]);
      expect(ran.code, `書き出しの命令が落ちた: ${ran.stderr}`).toBe(0);
      for (const format of ["mp4", "gif", "html", "png"] as const) {
        const file = join(out, `finality.${format}`);
        const bytes = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
        expect(formatOf(bytes), `${file} が ${format} として書かれていない`).toBe(format);
      }

      const shots: Buffer[] = [];
      for (const k of [0, 1]) {
        const outDir = join(mkdtempSync(join(tmpdir(), "dragon-time-")), `run-${k}`);
        const png = await runCli(["export", json, "--format", "png", "--out", outDir]);
        expect(png.code, `${k + 1} 回目の PNG の書き出しが落ちた: ${png.stderr}`).toBe(0);
        const file = join(outDir, "finality.png");
        expect(existsSync(file), `${k + 1} 回目の PNG を書き出していない`).toBe(true);
        shots.push(existsSync(file) ? readFileSync(file) : Buffer.alloc(0));
      }
      expect((shots[0] as Buffer).equals(shots[1] as Buffer), "同じ JSON から 2 回書き出した PNG がバイト単位で違う").toBe(true);
    },
    SLOW * 2,
  );
});

describe("時間軸の図の見本の file (#3165)", () => {
  it("time-example-files-match", () => {
    const parse = api("parseNotation");
    for (const name of ["finality", "withdraw"]) {
      for (const file of [`${name}.dragon`, `${name}.en.dragon`, `${name}.json`, `${name}.en.json`]) {
        expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
      }
      const ja = parse(fileText(`${name}.dragon`) ?? "");
      const en = parse(fileText(`${name}.en.dragon`) ?? "", { lang: "en" });
      expect(ja.ok && en.ok, `${name} の見本の記法が読めない`).toBe(true);
      if (!ja.ok || !en.ok) continue;
      expect(shape(en.diagram as unknown as Source), `${name} の英語版の列と節目と段と出来事の数が日本語版と違う`).toEqual(shape(ja.diagram as unknown as Source));
      expect((ja.diagram as unknown as Source).kind, `${name} の見本の図の種類`).toBe("time");
    }
  });
});

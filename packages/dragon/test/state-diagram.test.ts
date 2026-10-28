/**
 * 状態遷移図 (#3163)。
 *
 * 1 つの物 (注文 #1042) が状態を移る様子を段で追う図。原本の JSON の `kind` は `state` で、
 * 始まりと終わりは線の予約の名前 `start` と `finish` で書き、最初の段より前に書いた線 (種類の欄 `state.paths`) は
 * 移れるが今回は通らない道になる。どの段も辿り着かない状態は点線の箱にして、1 段目の上の脇道の囲みへ寄せる。
 * 状態は段で初めて辿り着く順に左から右へ 4 つずつ並べ、段をまたぐ線は 2 つの段の間の通り道を通る。
 * 見た目の元は試作の `docs/design/base/scenes/order.js`。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、点線の箱と囲みの字は SVG の字で確かめる。
 * 見本の file と、状態遷移図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, patched, pointers, smallSequence } from "./diagram-support";
import { exporter, formatOf, runCli } from "./export-support";
import { covers, draw, gap, type Layout, type Rect, type Rendered, sampleTimes, type Span, type Timeline } from "./render-support";

/** 書き出し 1 回に許す時間 (`export.test.ts` と同じ) */
const SLOW = 180_000;

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 試作 (`order.js`) の 10 段の題 */
const ORDER_STEPS = [
  "注文を受け付ける",
  "支払いを待つ",
  "支払いが確定する",
  "在庫を確保する",
  "発送する",
  "届く",
  "返品を申し込む",
  "戻った品を確かめる",
  "返金する",
  "注文を閉じる",
] as const;

/** 注文の札 */
const ORDER_TAG = "#1042";

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

interface StateBox extends Rect {
  id: string;
  name: string;
  cx: number;
  cy: number;
  /** どの段も辿り着かない状態 */
  ghost?: boolean;
}

interface StatePath {
  from: string;
  to: string;
  points: Point[];
  /** 線の名前を書いた時だけある */
  label?: Rect & { text: string };
}

interface StateEnd {
  kind: "start" | "finish";
  x: number;
  y: number;
  r: number;
  /** 脇道の中の印 */
  ghost: boolean;
}

interface StateLayout extends Omit<Layout, "boxes"> {
  kind: string;
  boxes: StateBox[];
  /** 最初の段より前に書いた線のうち、どの段にも出ない線 */
  paths: StatePath[];
  /** 脇道の囲み */
  side?: Rect;
  /** 始まりと終わりの印 */
  ends: StateEnd[];
}

interface StateTimeline extends Timeline {
  /** 状態の箱ごとの、光る間と、済んだ印が出る時刻 */
  states?: { box: string; lit: Span[]; done?: number }[];
}

interface StateRendered extends Omit<Rendered, "layout" | "timeline"> {
  layout: StateLayout;
  timeline: StateTimeline;
}

interface SourceEdge {
  type: string;
  from: string;
  to: string;
  label?: string;
  carry: { kind: string; text?: string };
}

interface Source {
  kind: string;
  title: string;
  view?: string;
  boxes: { id: string; name: string }[];
  steps: { title: string; events: SourceEdge[] }[];
  state?: { paths: { from: string; to: string; label?: string }[] };
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の原本の JSON。無ければ落とす */
function orderJson(name = "order.json"): Json {
  const text = fileText(name);
  expect(text, `${name} が packages/dragon/examples に無い`).toBeDefined();
  return JSON.parse(text ?? "{}") as Json;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): StateRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "状態遷移図を描けない").toBe("");
  return rendered as unknown as StateRendered;
}

const edgesOf = (d: Source): (SourceEdge & { step: number; event: number })[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e, i) => (e.type === "edge" ? [{ ...e, step: s, event: i }] : [])));

const RESERVED = new Set(["start", "finish"]);

/** 段で初めて辿り着く順の状態の名札 */
function visitOrder(d: Source): string[] {
  const order: string[] = [];
  for (const edge of edgesOf(d)) if (!RESERVED.has(edge.to) && !order.includes(edge.to)) order.push(edge.to);
  return order;
}

const nameOf = (d: Source, id: string): string => d.boxes.find((b) => b.id === id)?.name ?? id;

/** 点から四角までの距離。中なら 0 */
function distanceToRect([x, y]: Point, r: Rect): number {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
  const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/** 折れ線から四角までの最も近い距離。区間を 1px ごとに数える */
function pathToRect(points: Point[], r: Rect): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let k = 0; k <= n; k++) best = Math.min(best, distanceToRect([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n], r));
  }
  return best;
}

const inside = ([x, y]: Point, r: Rect, slack = 1e-6): boolean => x >= r.x - slack && x <= r.x + r.w + slack && y >= r.y - slack && y <= r.y + r.h + slack;
const rectInside = (a: Rect, r: Rect): boolean => inside([a.x, a.y], r) && inside([a.x + a.w, a.y + a.h], r);

/** 原本の JSON の、段の線と通らない道の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  boxes: d.boxes.length,
  steps: d.steps.length,
  lines: d.steps.map((step) => step.events.filter((event) => event.type === "edge").length),
  paths: (d.state?.paths ?? []).length,
});

const edge = (from: string, to: string, label?: string): Json => ({ type: "edge", from, to, ...(label ? { label } : {}), carry: { kind: "tag", text: "#1" } });

/** 始まりと終わりへの線と、通らない道を 2 本持つ最小の状態遷移図 */
function smallState(): Json {
  return {
    version: 1,
    kind: "state",
    title: "小さな状態の図",
    boxes: [
      { id: "a", name: "受付" },
      { id: "b", name: "完了" },
      { id: "x", name: "取消" },
    ],
    steps: [
      { title: "始める", body: "受け付けから始まる。", events: [edge("start", "a", "受け付ける")] },
      { title: "終える", body: "完了へ移って閉じる。", events: [edge("a", "b", "終える"), edge("b", "finish", "閉じる")] },
    ],
    state: { paths: [{ from: "a", to: "x", label: "取り消す" }, { from: "x", to: "finish" }] },
  };
}

describe("状態遷移図の原本の JSON (#3163)", () => {
  it("schema-accepts-state-diagram", () => {
    const checked = api("validateDiagram")(smallState());
    expect(checked.ok, `最小の状態遷移図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
  });

  it("schema-rejects-misplaced-state-fields", () => {
    const validate = api("validateDiagram");
    const cases: [string, Json, string][] = [
      ["状態遷移図の箱の名札が start", patched(smallState(), ["boxes", 0, "id"], "start"), "/boxes/0/id"],
      ["状態遷移図の箱の名札が finish", patched(smallState(), ["boxes", 1, "id"], "finish"), "/boxes/1/id"],
      ["時系列図に state の欄", patched(smallSequence(), ["state"], { paths: [{ from: "a", to: "b" }] }), "/state"],
      ["状態遷移図に sequence の欄", patched(smallState(), ["sequence"], { lifelines: ["a"] }), "/sequence"],
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

describe("状態遷移図の記法 (#3163)", () => {
  it("notation-compiles-order-to-json", () => {
    const parse = api("parseNotation");
    for (const [notation, json] of [
      ["order.dragon", "order.json"],
      ["order.en.dragon", "order.en.json"],
    ] as const) {
      const text = fileText(notation);
      expect(text, `${notation} が無い`).toBeDefined();
      const parsed = parse(text ?? "");
      expect(parsed.ok, `${notation} が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      expect(parsed.ok ? parsed.diagram : undefined, `${notation} から作った JSON が ${json} と違う`).toEqual(orderJson(json));
    }
  });

  it("notation-rejects-misused-start-and-finish", () => {
    const parse = api("parseNotation");
    const head = ["state 小さな状態の図", "box a as 受付", "box b as 完了"];
    const step = ["step 始める", "  say 始める。", "  start -> a: 受け付ける"];
    // 記法の行と、誤りの行 (0 から数える) と、その行で誤りを指す名札
    const cases: [string, string[], number, string][] = [
      ["start へ入る線", [...head, ...step, "  a -> start: 戻る"], 6, "start"],
      ["finish から出る線", [...head, ...step, "  finish -> a: 開く"], 6, "finish"],
      ["start を名札にした箱", ["state 小さな状態の図", "box start as 始まり", "box a as 受付", ...step], 1, "start"],
      ["宣言していない名札への通らない道", [...head, "a -> zzz: 取り消す", ...step], 3, "zzz"],
    ];
    for (const [name, lines, at, token] of cases) {
      const want = { line: at + 1, column: (lines[at] ?? "").indexOf(token) + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-keeps-start-and-finish-plain-outside-state", () => {
    const parse = api("parseNotation");
    // 時系列図では start と finish も宣言して使う普通の名札
    const plain = parse(["sequence 名札の図", "box start as 始め", "box finish as 終え", "step 送る", "  say 送る。", "  start -> finish: 送る"].join("\n"));
    expect(plain.ok, `時系列図で start と finish を名札にした箱が読めない: ${plain.ok ? "" : JSON.stringify(plain.errors)}`).toBe(true);
    const diagram = (plain.ok ? plain.diagram : {}) as unknown as Source;
    expect(diagram.boxes?.map((b) => b.id), "時系列図の箱の名札").toEqual(["start", "finish"]);

    // 時系列図と構成図では、最初の step より前の線の行と、宣言していない start は誤り
    const cases: [string, string[], number][] = [
      ["時系列図の段より前の線", ["sequence 前の線", "box a", "box b", "a -> b: 送る", "step 送る", "  say 送る。", "  a -> b"], 4],
      ["構成図の段より前の線", ["architecture 前の線", "box a", "box b", "a -> b: 送る", "step 送る", "  say 送る。", "  a -> b"], 4],
      ["時系列図の宣言していない start", ["sequence 前の線", "box a", "step 送る", "  say 送る。", "  start -> a"], 5],
    ];
    for (const [name, lines, line] of cases) {
      const parsed = parse(lines.join("\n"));
      expect(parsed.ok ? undefined : parsed.errors[0]?.line, `${name} が ${line} 行目の誤りにならない`).toBe(line);
    }
  });

  it("state-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const text = fileText("order.dragon");
    expect(text, "order.dragon が無い").toBeDefined();
    const first = parse(text ?? "");
    expect(first.ok, `order.dragon が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
    if (!first.ok) return;
    const printed = print(first.diagram);
    const second = parse(printed);
    expect(second.ok, `書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
    expect(second.ok ? second.diagram : undefined, "往復した JSON が最初と違う").toEqual(first.diagram);

    // 通らない道は最初の step より前に書く
    const lines = printed.split("\n");
    const firstStep = lines.findIndex((line) => line.startsWith("step "));
    const before = lines.slice(0, Math.max(firstStep, 0)).filter((line) => line.includes("->")).length;
    const paths = ((first.diagram as unknown as Source).state?.paths ?? []).length;
    expect(paths, "注文の図に通らない道が無い").toBeGreaterThan(0);
    expect(before, "書き戻した記法が、通らない道を最初の step より前に書かない").toBe(paths);
  });
});

describe("状態遷移図の並べ方 (#3163)", () => {
  it("state-layout-wraps-four-per-row", () => {
    const source = orderJson() as unknown as Source;
    const { layout } = render(source as unknown as Json);
    expect(layout.kind, "置き場所の図の種類").toBe("state");
    const walked = layout.boxes.filter((b) => !b.ghost);
    const order = visitOrder(source);
    expect(order.length, "注文の図で段が辿り着く状態の数").toBe(8);
    // 1 段目と 2 段目に分け、段の中は左から右へ
    const rows = [...new Set(walked.map((b) => Math.round(b.cy)))].sort((a, b) => a - b);
    expect(rows.length, "状態の箱が 2 段に並ばない").toBe(2);
    const inRow = (y: number): StateBox[] => walked.filter((b) => Math.round(b.cy) === y).sort((a, b) => a.cx - b.cx);
    const [top, bottom] = rows.map(inRow) as [StateBox[], StateBox[]];
    expect([...top, ...bottom].map((b) => b.name), "状態が、段で初めて辿り着く順に左から右へ 4 つずつ並ばない").toEqual(order.map((id) => nameOf(source, id)));
    expect(top.length, "1 段目の状態の数").toBe(4);
    // 2 段目の状態は 1 段目の同じ列に揃う
    bottom.forEach((b, i) => expect(Math.abs(b.cx - (top[i]?.cx ?? Number.NaN)), `2 段目の ${i + 1} 番目の状態の列が 1 段目と揃わない`).toBeLessThan(0.5));
  });

  it("state-layout-routes-between-rows", () => {
    const source = orderJson() as unknown as Source;
    const { layout } = render(source as unknown as Json);
    const byName = (name: string): StateBox | undefined => layout.boxes.find((b) => b.name === name);
    const from = byName("発送準備");
    const to = byName("発送済み");
    expect(from && to, "発送準備と発送済みの箱が無い").toBeTruthy();
    if (!from || !to) return;
    const cross = layout.edges.find((e) => e.from === from.id && e.to === to.id);
    expect(cross, "発送準備から発送済みへの線が無い").toBeDefined();
    // 横に走る区間が、1 段目の箱の下と 2 段目の箱の上の間にある
    const rowGap = { top: from.y + from.h, bottom: to.y };
    const runs = (cross?.points ?? []).slice(1).filter(([, y], i) => y === (cross?.points[i]?.[1] ?? Number.NaN));
    expect(runs.some(([, y]) => y > rowGap.top && y < rowGap.bottom), "段をまたぐ線が 2 つの段の間を横に通らない").toBe(true);

    // 線はどれも、始まりと終わりの箱でない箱から 10px 以上離れる
    const lines = [...layout.edges.map((e) => ({ name: `段 ${e.step + 1} の ${e.from} -> ${e.to}`, ...e })), ...layout.paths.map((p) => ({ name: `通らない道 ${p.from} -> ${p.to}`, ...p }))];
    for (const line of lines) {
      for (const box of layout.boxes) {
        if (box.id === line.from || box.id === line.to) continue;
        expect(pathToRect(line.points, box), `${line.name} が ${box.name} の箱に 10px より近い`).toBeGreaterThanOrEqual(10);
      }
    }
    // 箱どうしと、線の名前と箱も 10px 以上離れる
    layout.boxes.forEach((a, i) => {
      for (const b of layout.boxes.slice(i + 1)) expect(gap(a, b), `${a.name} と ${b.name} の箱の隙間`).toBeGreaterThanOrEqual(10);
    });
    const labels = [...layout.labels.map((l) => ({ ...l, name: `段 ${l.step + 1} の線の名前 ${l.text}` })), ...layout.paths.flatMap((p) => (p.label ? [{ ...p.label, name: `通らない道の名前 ${p.label.text}` }] : []))];
    for (const label of labels) for (const box of layout.boxes) expect(gap(label, box), `${label.name} と ${box.name} の隙間`).toBeGreaterThanOrEqual(10);
  });
});

describe("状態遷移図の描き方 (#3163)", () => {
  it("state-renders-side-path", () => {
    const source = orderJson() as unknown as Source;
    const { layout, svg } = render(source as unknown as Json);
    const reached = new Set(visitOrder(source));
    const ghosts = layout.boxes.filter((b) => b.ghost);
    expect(ghosts.map((b) => b.name), "どの段も辿り着かない状態だけを点線の箱にしない").toEqual(source.boxes.filter((b) => !reached.has(b.id)).map((b) => b.name));
    expect(ghosts.length, "注文の図に点線の箱が無い").toBeGreaterThan(0);
    const side = layout.side;
    expect(side, "脇道の囲みが無い").toBeDefined();
    if (!side) return;
    for (const ghost of ghosts) expect(rectInside(ghost, side), `${ghost.name} の箱が脇道の囲みの中に無い`).toBe(true);
    // 囲みは 1 段目より上に置く
    const top = Math.min(...layout.boxes.filter((b) => !b.ghost).map((b) => b.y));
    expect(side.y + side.h, "脇道の囲みが 1 段目の箱より上に無い").toBeLessThan(top);
    // 点線の箱から出る線と、その終わりの印も囲みの中
    for (const path of layout.paths.filter((p) => ghosts.some((g) => g.id === p.from))) {
      for (const point of path.points) expect(inside(point, side), `${path.from} -> ${path.to} の線が脇道の囲みから出る`).toBe(true);
    }
    const ghostEnds = layout.ends.filter((e) => e.ghost);
    expect(ghostEnds.length, "脇道の中の終わりの印が無い").toBeGreaterThan(0);
    for (const end of ghostEnds) expect(inside([end.x, end.y], side), "脇道の中の終わりの印が囲みの中に無い").toBe(true);
    expect((svg.match(/data-ghost="/gu) ?? []).length, "点線の箱の印 (data-ghost) の数").toBe(ghosts.length);

    // 囲みの字は描く部品に渡した言葉で出す
    for (const word of ["脇道", "今回は通らない"]) expect(svg, `日本語の図の囲みに「${word}」が無い`).toContain(word);
    const english = render(orderJson("order.en.json"), "en").svg;
    for (const word of ["Side path", "Not taken this time"]) expect(english, `英語の図の囲みに ${word} が無い`).toContain(word);
    expect(english, "英語の図に日本語の囲みの字が残る").not.toContain("脇道");
  });

  it("state-dots-paths-not-taken", () => {
    const source = orderJson() as unknown as Source;
    const { layout, timeline, svg } = render(source as unknown as Json);
    const walked = new Set(edgesOf(source).map((e) => `${e.from}->${e.to}`));
    const notTaken = (source.state?.paths ?? []).filter((p) => !walked.has(`${p.from}->${p.to}`)).map((p) => `${p.from}->${p.to}`);
    expect(notTaken.length, "注文の図に通らない道が無い").toBeGreaterThan(0);
    expect(layout.paths.map((p) => `${p.from}->${p.to}`).sort(), "点線で描く線が、段より前に書いてどの段にも出ない線と違う").toEqual([...notTaken].sort());
    expect((svg.match(/data-path="/gu) ?? []).length, "点線の線の印 (data-path) の数").toBe(layout.paths.length);
    // 運ぶ物は段の中の線だけを走る
    const stepEdges = edgesOf(source).filter((e) => e.carry.kind !== "none");
    expect(timeline.carriers.map((c) => `${c.step}:${c.event}`).sort(), "運ぶ物が段の中の線の数だけ走らない").toEqual(stepEdges.map((e) => `${e.step}:${e.event}`).sort());

    // 段より前に書いた線を段の中でも書くと、その段で運ぶ物が走る線になる
    const walkedPath = patched(smallState(), ["state", "paths"], [{ from: "a", to: "b" }, { from: "a", to: "x" }]);
    const small = render(walkedPath);
    expect(small.layout.paths.map((p) => `${p.from}->${p.to}`), "段の中でも書いた線を点線で描く").toEqual(["a->x"]);
    const ab = small.layout.edges.find((e) => e.from === "a" && e.to === "b");
    expect(ab, "段の中でも書いた線が段の線にならない").toBeDefined();
    expect(small.timeline.carriers.some((c) => c.step === ab?.step && c.event === ab?.event), "段の中でも書いた線に運ぶ物が走らない").toBe(true);
  });

  it("state-renders-start-and-finish", () => {
    const source = orderJson() as unknown as Source;
    const { layout, svg } = render(source as unknown as Json);
    const box = (id: string): StateBox | undefined => layout.boxes.find((b) => b.id === id);
    const starts = layout.ends.filter((e) => e.kind === "start" && !e.ghost);
    expect(starts.length, "始まりの印が 1 つでない").toBe(1);
    const first = box(visitOrder(source)[0] ?? "");
    const start = starts[0];
    expect(Boolean(first && start && Math.abs(start.x - first.cx) < 0.5 && start.y < first.y), "始まりの印が最初の状態の上に無い").toBe(true);

    const finishing = edgesOf(source).filter((e) => e.to === "finish").map((e) => box(e.from));
    expect(finishing.length, "注文の図に終わりへ移る線が無い").toBeGreaterThan(0);
    for (const state of finishing) {
      const end = layout.ends.find((e) => e.kind === "finish" && !e.ghost && state && Math.abs(e.x - state.cx) < 0.5 && e.y > state.y + state.h);
      expect(end, `終わりの印が ${state?.name} の下に無い`).toBeDefined();
    }
    for (const path of layout.paths.filter((p) => p.to === "finish")) {
      const from = box(path.from);
      const end = layout.ends.find((e) => e.kind === "finish" && e.ghost && from && e.x > from.x + from.w && Math.abs(e.y - from.cy) < 0.5);
      expect(end, `脇道の終わりの印が ${from?.name} の右に無い`).toBeDefined();
    }
    // 線は印から出て、印へ入る
    const near = (p: Point | undefined, kind: StateEnd["kind"]): boolean => p !== undefined && layout.ends.some((e) => e.kind === kind && Math.hypot(p[0] - e.x, p[1] - e.y) <= e.r + 6);
    for (const e of layout.edges.filter((e) => e.from === "start")) expect(near(e.points[0], "start"), "start から出る線が始まりの印から出ない").toBe(true);
    for (const line of [...layout.edges, ...layout.paths].filter((e) => e.to === "finish")) expect(near(line.points.at(-1), "finish"), `${line.from} から終わりへの線が終わりの印へ入らない`).toBe(true);

    for (const word of ["始まり", "終わり"]) expect(svg, `日本語の図に「${word}」の字が無い`).toContain(word);
    const english = render(orderJson("order.en.json"), "en").svg;
    for (const word of [">Start<", ">End<"]) expect(english, `英語の図に ${word} の字が無い`).toContain(word);
    expect(english, "英語の図に日本語の始まりの字が残る").not.toContain("始まり");
  });

  it("order-renders-10-steps", () => {
    const source = orderJson() as unknown as Source;
    expect(source.steps.map((s) => s.title), "注文の図の段の題が試作の 10 段と違う").toEqual([...ORDER_STEPS]);
    const { layout, timeline } = render(source as unknown as Json);
    expect(timeline.steps, "時刻の表の段の数").toHaveLength(10);
    timeline.steps.forEach((step, i) => {
      expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
      if (i > 0) expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
    });
    for (const e of edgesOf(source)) {
      expect(e.carry, `段 ${e.step + 1} の線が注文の札を運ばない`).toEqual({ kind: "tag", text: ORDER_TAG });
      const drawn = timeline.edges.find((t) => t.step === e.step && t.event === e.event);
      const span = timeline.steps[e.step];
      expect(Boolean(drawn && span && drawn.start >= span.start - 1e-9 && drawn.end <= span.end + 1e-9), `段 ${e.step + 1} の線がその段の間に引かれない`).toBe(true);
      if (RESERVED.has(e.to)) continue;
      // 札は着いた状態の箱に乗る
      const laid = layout.edges.find((l) => l.step === e.step && l.event === e.event);
      const target = layout.boxes.find((b) => b.id === e.to);
      expect(Boolean(laid?.settle && target && inside(laid.settle, target)), `段 ${e.step + 1} の札が ${nameOf(source, e.to)} の箱に乗らない`).toBe(true);
    }
  });

  it("state-marks-current-and-left-states", () => {
    const source = orderJson() as unknown as Source;
    const { timeline, svg, layout } = render(source as unknown as Json);
    expect(timeline.states, "時刻の表に状態の光る間と済んだ印が無い").toBeDefined();
    const states = timeline.states ?? [];
    const of = (id: string) => states.find((s) => s.box === id);
    const left = new Set<string>();
    for (const e of edgesOf(source)) {
      const span = timeline.steps[e.step] as Span;
      const late = span.end - 0.05;
      if (!RESERVED.has(e.to)) expect(of(e.to)?.lit.some((l) => covers(l, late)), `段 ${e.step + 1} の終わりに ${nameOf(source, e.to)} が光らない`).toBe(true);
      if (RESERVED.has(e.from) || e.from === e.to) continue;
      expect(of(e.from)?.lit.some((l) => covers(l, late)), `段 ${e.step + 1} の終わりに、出た ${nameOf(source, e.from)} がまだ光る`).toBe(false);
      if (left.has(e.from)) continue;
      left.add(e.from);
      const done = of(e.from)?.done;
      expect(done !== undefined && done >= span.start && done < span.end, `${nameOf(source, e.from)} を出た段 ${e.step + 1} の間に済んだ印が出ない (${done})`).toBe(true);
    }
    for (const ghost of layout.boxes.filter((b) => b.ghost)) expect(of(ghost.id)?.done, `通らない ${ghost.name} に済んだ印が出る`).toBeUndefined();
    expect((svg.match(/data-done="/gu) ?? []).length, "済んだ印 (data-done) の数が、出た状態の数と違う").toBe(left.size);
  });

  it("state-draws-self-loop-under-box", () => {
    const source = orderJson() as unknown as Source;
    const { layout, timeline } = render(source as unknown as Json);
    const loop = layout.edges.find((e) => e.from === e.to);
    expect(loop, "注文の図に同じ状態へ戻る線が無い").toBeDefined();
    const box = layout.boxes.find((b) => b.id === loop?.from);
    expect(box?.name, "同じ状態へ戻る線の状態").toBe("返品の受付");
    if (!loop || !box) return;
    const bottom = box.y + box.h;
    for (const [x, y] of loop.points) {
      expect(y, "輪が箱の下から上へはみ出す").toBeGreaterThanOrEqual(bottom - 1e-6);
      expect(x >= box.x && x <= box.x + box.w, "輪が箱の幅から横へはみ出す").toBe(true);
    }
    expect(Math.max(...loop.points.map(([, y]) => y)) - bottom, "輪の深さ").toBeGreaterThanOrEqual(20);
    expect(timeline.carriers.some((c) => c.step === loop.step && c.event === loop.event), "輪の段で札が輪を回らない").toBe(true);
    const label = layout.labels.find((l) => l.step === loop.step && l.event === loop.event);
    expect(label && label.y >= bottom, "輪の名前が箱の下に無い").toBe(true);
  });

  it("state-keeps-motion-rules", () => {
    const source = orderJson() as unknown as Source;
    const { timeline } = render(source as unknown as Json);
    const times = sampleTimes(timeline);
    const empty = times.filter((t) => !timeline.carriers.some((span) => covers(span, t)));
    expect(empty.length / times.length, `運ぶ物が見えない時刻 ${empty.slice(0, 5).join(", ")}`).toBeLessThanOrEqual(0.02);
    for (const label of timeline.labels) {
      const span = timeline.steps[label.step];
      expect(Boolean(span && label.start >= span.start - 1e-9 && label.end <= span.end + 1e-9), `段 ${label.step + 1} の線の名前が段の外に出る`).toBe(true);
    }
    for (const t of times) expect(timeline.labels.filter((span) => covers(span, t)).length, `${t} 秒に見える線の名前`).toBeLessThanOrEqual(2);
    expect(timeline.badges.map((b) => b.step), "段の番号").toEqual(timeline.steps.map((_, i) => i));
    for (const badge of timeline.badges) {
      const step = timeline.steps[badge.step];
      expect(badge.appears, `段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
    }
  });

  it("order-opens-fixed", () => {
    const source = orderJson() as unknown as Source;
    expect(source.view, "注文の図が見せ方を書いている").toBeUndefined();
    const rendered = render(source as unknown as Json);
    const choose = draw("chooseView");
    for (const width of [rendered.layout.width, 720]) {
      expect(choose(rendered as unknown as Rendered, width).mode, `${width}px の枠で注文の図の見せ方`).toBe("fixed");
    }
  });
});

describe("状態遷移図の書き出し (#3163)", () => {
  it(
    "export-writes-state-diagram",
    async () => {
      const json = join(EXAMPLES, "order.json");
      expect(existsSync(json), "order.json が無い").toBe(true);
      const out = join(mkdtempSync(join(tmpdir(), "dragon-state-")), "out");
      const ran = await runCli(["export", json, "--out", out, "--fps", "2", "--gif-fps", "1"]);
      expect(ran.code, `書き出しの命令が落ちた: ${ran.stderr}`).toBe(0);
      for (const format of ["mp4", "gif", "html", "png"] as const) {
        const file = join(out, `order.${format}`);
        const bytes = existsSync(file) ? readFileSync(file) : Buffer.alloc(0);
        expect(formatOf(bytes), `${file} が ${format} として書かれていない`).toBe(format);
      }

      const exportDiagram = await exporter();
      const shots: Buffer[] = [];
      for (const k of [0, 1]) {
        const outDir = join(mkdtempSync(join(tmpdir(), "dragon-state-")), `run-${k}`);
        mkdirSync(outDir, { recursive: true });
        const result = await exportDiagram(orderJson(), { outDir, formats: ["png"] });
        expect(result.files.png, "PNG を書き出していない").toBeDefined();
        shots.push(readFileSync(result.files.png as string));
      }
      expect((shots[0] as Buffer).equals(shots[1] as Buffer), "同じ JSON から 2 回書き出した PNG がバイト単位で違う").toBe(true);
    },
    SLOW * 2,
  );
});

describe("注文の見本の file (#3163)", () => {
  it("order-example-files-match", () => {
    const parse = api("parseNotation");
    for (const file of ["order.dragon", "order.en.dragon", "order.json", "order.en.json"]) {
      expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
    }
    const ja = parse(fileText("order.dragon") ?? "");
    const en = parse(fileText("order.en.dragon") ?? "");
    expect(ja.ok && en.ok, "注文の見本の記法が読めない").toBe(true);
    if (!ja.ok || !en.ok) return;
    expect(shape(en.diagram as unknown as Source), "注文の英語版の状態と段と線の数が日本語版と違う").toEqual(shape(ja.diagram as unknown as Source));
    expect((ja.diagram as unknown as Source).kind, "注文の見本の図の種類").toBe("state");
  });
});

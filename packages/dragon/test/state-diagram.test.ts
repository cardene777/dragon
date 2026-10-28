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
    // 段をまたぐ線は 1 段目の箱の下端から出て、2 つの段の間を通って 2 段目の箱の上端へ入る (#3171 で真下への 1 本にした)
    const points = cross?.points ?? [];
    const [first, last] = [points[0], points[points.length - 1]];
    expect(Boolean(first && last && first[1] <= from.y + from.h + 1e-6 && last[1] > from.y + from.h && last[1] <= to.y + 1e-6), "段をまたぐ線が 2 つの段の間を通らない").toBe(true);

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

  // 線の名前の数の決まりは、薄く残す名前を数えない形で `state-keeps-past-line-names-faint` が確かめる (#3171)
  it("state-keeps-carrier-and-badge-rules", () => {
    const source = orderJson() as unknown as Source;
    const { timeline } = render(source as unknown as Json);
    const times = sampleTimes(timeline);
    const empty = times.filter((t) => !timeline.carriers.some((span) => covers(span, t)));
    expect(empty.length / times.length, `運ぶ物が見えない時刻 ${empty.slice(0, 5).join(", ")}`).toBeLessThanOrEqual(0.02);
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

/** 始まりから `n` 個の状態を 1 列に辿って終わる状態遷移図。段の折り返しを 3 段まで確かめる */
function chainState(n: number): Json {
  const ids = Array.from({ length: n }, (_, i) => `s${i + 1}`);
  const lines: [string, string][] = [["start", "s1"], ...ids.slice(1).map((id, i): [string, string] => [ids[i] as string, id]), [ids[n - 1] as string, "finish"]];
  return {
    version: 1,
    kind: "state",
    title: "一列に辿る状態の図",
    boxes: ids.map((id, i) => ({ id, name: `状態${i + 1}` })),
    steps: lines.map(([from, to], i) => ({ title: `段${i + 1}`, body: `${to} へ移る。`, events: [edge(from, to)] })),
  };
}

/** 脇道の状態を 2 つ持つ状態遷移図 */
function twoGhosts(): Json {
  const base = smallState() as unknown as Source;
  return {
    ...(base as unknown as Record<string, unknown>),
    boxes: [...base.boxes, { id: "y", name: "保留" }],
    state: { paths: [...(base.state?.paths ?? []), { from: "a", to: "y" }, { from: "y", to: "finish" }] },
  };
}

interface SetEvent {
  type: string;
  field?: string;
  value?: string;
}

interface TintedStrip extends Rect {
  fields: { name: string }[];
  /** 状態遷移図の帯の最後の、通った状態の欄 */
  trail?: { title: string; states: { box: string }[] };
}

/** 点の列 3 つが作る曲がりの角度 (度)。まっすぐなら 0 */
const turn = (a: Point, b: Point, c: Point): number => {
  const u = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const v = Math.atan2(c[1] - b[1], c[0] - b[0]);
  const d = Math.abs(u - v) % (2 * Math.PI);
  return ((d > Math.PI ? 2 * Math.PI - d : d) * 180) / Math.PI;
};

describe("状態遷移図の見た目 (#3171)", () => {
  it("state-layout-snakes-rows", () => {
    const source = orderJson() as unknown as Source;
    const { layout } = render(source as unknown as Json);
    const walked = layout.boxes.filter((b) => !b.ghost);
    const ordered = visitOrder(source).map((id) => walked.find((b) => b.id === id));
    expect(ordered.every(Boolean), "段が辿り着く状態の箱が揃わない").toBe(true);
    const boxes = ordered as StateBox[];
    const rows = [...new Set(walked.map((b) => Math.round(b.cy)))].sort((a, b) => a - b);
    expect(rows.length, "状態の箱が 2 段に並ばない").toBe(2);
    const top = boxes.slice(0, 4);
    const bottom = boxes.slice(4);
    for (const b of top) expect(Math.round(b.cy), `${b.name} が 1 段目に無い`).toBe(rows[0]);
    for (const b of bottom) expect(Math.round(b.cy), `${b.name} が 2 段目に無い`).toBe(rows[1]);
    top.slice(1).forEach((b, i) => expect(b.cx, `1 段目の ${b.name} が左から右へ並ばない`).toBeGreaterThan((top[i] as StateBox).cx));
    bottom.slice(1).forEach((b, i) => expect(b.cx, `2 段目の ${b.name} が右から左へ並ばない`).toBeLessThan((bottom[i] as StateBox).cx));
    const last = top[3] as StateBox;
    const next = bottom[0] as StateBox;
    expect(Math.abs(next.cx - last.cx), "2 段目の最初の状態が 1 段目の最後の状態の真下に無い").toBeLessThan(0.5);
    const cross = layout.edges.find((e) => e.from === last.id && e.to === next.id);
    expect(cross?.points, "1 段目の最後から 2 段目の最初への線が真下への 1 本でない").toHaveLength(2);
    expect(Math.abs((cross?.points[0]?.[0] ?? 0) - (cross?.points[1]?.[0] ?? Number.NaN)), "段をまたぐ線が真下へ下りない").toBeLessThan(0.5);

    // 9 つ以上の状態では 3 段目を再び左から右へ並べる
    const chain = render(chainState(10)).layout.boxes;
    const at = (id: string): StateBox => chain.find((b) => b.id === id) as StateBox;
    expect(new Set(chain.map((b) => Math.round(b.cy))).size, "10 個の状態が 3 段に並ばない").toBe(3);
    expect(Math.abs(at("s9").cx - at("s8").cx), "3 段目の最初の状態が 2 段目の最後の状態の真下に無い").toBeLessThan(0.5);
    expect(at("s9").cy, "3 段目が 2 段目より下に無い").toBeGreaterThan(at("s8").cy);
    expect(at("s10").cx, "3 段目が左から右へ並ばない").toBeGreaterThan(at("s9").cx);
  });

  it("state-greys-past-lines", () => {
    const { layout, svg } = render(orderJson());
    const colorOf = (id: string): string | undefined => (layout.boxes.find((b) => b.id === id))?.color;
    for (const e of layout.edges as (StateLayout["edges"][number] & { color?: string })[]) {
      const want = e.to === "finish" ? colorOf(e.from) : colorOf(e.to);
      expect(e.color, `段 ${e.step + 1} の線 (${e.from} -> ${e.to}) が移った先の状態の色でない`).toBe(want);
    }
    const taken = layout.edges.filter((e) => e.points.length > 0).length;
    expect((svg.match(/class="dg-e-past/gu) ?? []).length, "段が終わった後の灰の線の数が、段の線の数と違う").toBe(taken);
    expect(svg, "段が終わった後の線が共通の値の表の灰で描かれない").toMatch(/\.dg-e-past\{[^}]*stroke:[^;]*var\(--mute\)/u);
    expect((svg.match(/class="dg-bdp-g"/gu) ?? []).length, "段が終わった後の灰の番号の数が、段の番号の数と違う").toBe(layout.badges.length);
    expect(svg, "段が終わった後の番号が共通の値の表の灰で描かれない").toMatch(/\.dg-bdp-g\{[^}]*stroke:[^;]*var\(--mute\)/u);
  });

  it("state-draws-taken-lines-solid", () => {
    const { svg } = render(orderJson());
    const rule = (cls: string): string | undefined => svg.match(new RegExp(`\\.${cls}\\{([^}]*)\\}`, "u"))?.[1];
    const past = rule("dg-e-past");
    expect(past, "状態遷移図に通った線の部品が無い").toBeDefined();
    expect(past, "通った線が点線で描かれる").not.toContain("dasharray");
    expect(rule("dg-e"), "まだ通っていない線が点線でない").toContain("dasharray");
    const width = (r: string | undefined): number => Number(r?.match(/stroke-width:([\d.]+)/u)?.[1] ?? Number.NaN);
    expect(width(past), "通った線が、下に敷いた点線を覆う太さでない").toBeGreaterThanOrEqual(width(rule("dg-e")));
  });

  it("state-marks-done-in-ink", () => {
    const { svg } = render(orderJson());
    expect(svg, "済んだ印が墨で塗られない").toMatch(/\.dg-done\{fill:var\(--ink\)/u);
  });

  it("state-draws-self-loop-as-arc", () => {
    const { layout } = render(orderJson());
    const loop = layout.edges.find((e) => e.from === e.to);
    const box = layout.boxes.find((b) => b.id === loop?.from);
    expect(loop && box, "注文の図に同じ状態へ戻る線が無い").toBeTruthy();
    if (!loop || !box) return;
    const points = loop.points as Point[];
    expect(points.length, "同じ状態へ戻る線が弧として点を持たない").toBeGreaterThanOrEqual(8);
    const bottom = box.y + box.h;
    const depth = Math.max(...points.map(([, y]) => y)) - bottom;
    expect(depth, "弧の深さ").toBeGreaterThanOrEqual(20);
    for (const [x, y] of points) {
      expect(y, "弧が箱の下から上へはみ出す").toBeGreaterThanOrEqual(bottom - 1e-6);
      expect(x >= box.x && x <= box.x + box.w, "弧が箱の幅から横へはみ出す").toBe(true);
    }
    points.slice(1).forEach((p, i) => {
      const q = points[i] as Point;
      expect(Math.hypot(p[0] - q[0], p[1] - q[1]), `弧の ${i + 1} 番目の区間がまっすぐに長い`).toBeLessThanOrEqual(depth / 2);
    });
    for (let i = 1; i < points.length - 1; i++) expect(turn(points[i - 1] as Point, points[i] as Point, points[i + 1] as Point), `弧の ${i} 番目の点で急に曲がる`).toBeLessThan(60);
  });

  it("state-keeps-past-line-names-faint", () => {
    const { layout, timeline, svg } = render(orderJson());
    const labels = timeline.labels as (Timeline["labels"][number] & { after?: Span })[];
    expect(labels.length, "注文の図に線の名前が無い").toBeGreaterThan(0);
    for (const label of labels) {
      const span = timeline.steps[label.step];
      expect(Boolean(span && label.start >= span.start - 1e-9 && label.end <= span.end + 1e-9), `段 ${label.step + 1} の線の名前が段の外で普通の濃さに出る`).toBe(true);
      expect(label.after, `段 ${label.step + 1} の線の名前が段の後に薄く残らない`).toBeDefined();
      expect((label.after?.start ?? Number.POSITIVE_INFINITY) >= label.end - 1e-9, `段 ${label.step + 1} の線の名前が段の終わりより前に薄くなる`).toBe(true);
      expect(label.after?.end ?? 0, `段 ${label.step + 1} の線の名前が最後の段まで薄く残らない`).toBeGreaterThanOrEqual(timeline.last - 1e-9);
    }
    for (const t of sampleTimes(timeline)) expect(labels.filter((span) => covers(span, t)).length, `${t} 秒に普通の濃さで見える線の名前`).toBeLessThanOrEqual(2);
    expect((svg.match(/class="dg-cap-past/gu) ?? []).length, "薄く残す線の名前の数が、線の名前の数と違う").toBe(layout.labels.length);
  });

  it("state-renders-side-path-top-right", () => {
    const { layout, svg } = render(orderJson());
    const side = layout.side;
    expect(side, "脇道の囲みが無い").toBeDefined();
    if (!side) return;
    const box = (id: string): StateBox | undefined => layout.boxes.find((b) => b.id === id);
    const entering = layout.paths.flatMap((p) => (box(p.to)?.ghost && !box(p.from)?.ghost ? [box(p.from) as StateBox] : []));
    expect(entering.length, "脇道へ入る線が無い").toBeGreaterThan(0);
    const leftmost = Math.min(...entering.map((b) => b.x));
    expect(side.x, "脇道の囲みの左端が、脇道へ入る最も左の状態の列に揃わない").toBeLessThanOrEqual(leftmost);
    expect(side.x, "脇道の囲みの左端が、脇道へ入る最も左の状態の列より大きく左へ出る").toBeGreaterThan(leftmost - 40);
    const right = Math.max(...layout.boxes.filter((b) => !b.ghost).map((b) => b.x + b.w));
    expect(side.x + side.w, "脇道の囲みが図の右端まで届かない").toBeGreaterThanOrEqual(right - 0.5);
    const start = layout.ends.find((e) => e.kind === "start");
    expect(start, "始まりの印が無い").toBeDefined();
    if (!start) return;
    expect(start.x + start.r, "始まりの印が脇道の囲みに重なる").toBeLessThan(side.x);
    expect(start.y, "始まりの印が脇道の囲みと同じ高さの帯に無い").toBeLessThan(side.y + side.h);
    expect(side.notes, "脇道の囲みの添え書きが 2 行でない").toEqual(["今回は通らない", "3 つの状態から入れる"]);
    for (const note of side.notes ?? []) expect(svg, `日本語の図に「${note}」が無い`).toContain(note);
    const english = render(orderJson("order.en.json"), "en").layout.side;
    expect(english?.notes, "英語の図の脇道の添え書き").toEqual(["Not taken this time", "Enterable from 3 states"]);
  });

  it("state-lines-up-side-states", () => {
    const { svg } = render(orderJson());
    const ghost = svg.match(/<g data-ghost="[^"]*"[^>]*>(.*?)<\/g>/u)?.[1] ?? "";
    const icon = ghost.match(/<rect class="dg-ic" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/u);
    const name = ghost.match(/<text class="dg-sn" x="([\d.]+)"[^>]*text-anchor="([a-z]+)"/u);
    expect(icon && name, "点線の札に絵柄と名前が無い").toBeTruthy();
    expect(name?.[2], "点線の札の名前が左揃えでない").toBe("start");
    expect(Number(name?.[1]), "点線の札の名前が絵柄の右に無い").toBeGreaterThan(Number(icon?.[1]) + Number(icon?.[2]));

    const { layout } = render(twoGhosts());
    const ghosts = layout.boxes.filter((b) => b.ghost);
    expect(ghosts.length, "脇道の状態が 2 つにならない").toBe(2);
    const [a, b] = [...ghosts].sort((p, q) => p.x - q.x) as [StateBox, StateBox];
    expect(Math.abs(a.y - b.y), "脇道の状態が横に並ばない").toBeLessThan(0.5);
    expect(gap(a, b), "脇道の状態どうしの隙間").toBeGreaterThanOrEqual(10);
    for (const g of ghosts) expect(Boolean(layout.side && rectInside(g, layout.side)), `${g.name} が脇道の囲みの中に無い`).toBe(true);
  });

  it("state-order-uses-undo-and-yen", () => {
    for (const name of ["order.json", "order.en.json"]) {
      const source = orderJson(name) as unknown as Source & { boxes: { id: string; icon?: string }[] };
      const order = visitOrder(source);
      const iconOf = (id: string | undefined): string | undefined => source.boxes.find((b) => b.id === id)?.icon;
      expect(iconOf(order[6]), `${name} の返品の受付の絵柄`).toBe("undo");
      expect(iconOf(order[7]), `${name} の返金済みの絵柄`).toBe("yen");
      const { svg } = render(source as unknown as Json, name.includes(".en.") ? "en" : "ja");
      expect((svg.match(/class="dg-ic"/gu) ?? []).length, `${name} で絵柄を描けない状態がある`).toBe(source.boxes.filter((b) => b.icon !== undefined).length);
    }
  });

  it("state-strip-shows-passed-states", () => {
    const source = orderJson() as unknown as Source;
    const { layout, svg } = render(source as unknown as Json);
    const strip = layout.strip as TintedStrip | undefined;
    expect(strip, "注文の図に帯が無い").toBeDefined();
    expect(strip?.fields.map((f) => f.name), "注文の見本の帯に状態の欄が残る").not.toContain("状態");
    expect(strip?.trail?.title, "帯に通った状態の欄が無い").toBe("通った状態");
    expect(strip?.trail?.states.map((s) => s.box), "通った状態の欄の点の並び").toEqual(visitOrder(source));
    expect((svg.match(/data-trail="/gu) ?? []).length, "通った状態の点の数").toBe(visitOrder(source).length);
    expect((svg.match(/class="dg-tr-ring"/gu) ?? []).length, "まだ着いていない状態の輪郭の点の数").toBe(visitOrder(source).length);
    expect((svg.match(/class="dg-tr-fill dg-a"/gu) ?? []).length, "着いた状態を塗る点の数").toBe(visitOrder(source).length);
    const english = render(orderJson("order.en.json"), "en").layout.strip as TintedStrip | undefined;
    expect(english?.trail?.title, "英語の図の通った状態の欄").toBe("States passed");
  });

  it("state-strip-tints-changed-values", () => {
    const source = orderJson() as unknown as Source;
    const { layout, svg } = render(source as unknown as Json);
    const colorOf = (id: string | undefined): string | undefined => (layout.boxes.find((b) => b.id === id))?.color;
    const sets = source.steps.flatMap((step, s) => (step.events as unknown as SetEvent[]).filter((e) => e.type === "strip" && e.value !== undefined).map(() => s));
    expect(sets.length, "注文の図に値を書き換える段が無い").toBeGreaterThan(0);
    const tinted = [...svg.matchAll(/<g class="dg-fv-now dg-a" data-step="(\d+)" style="--c:var\(--c-([a-z]+)\)/gu)];
    expect(tinted.map((m) => Number(m[1])).sort((a, b) => a - b), "段で変わった値を色で描く数と段").toEqual(sets);
    for (const m of tinted) {
      const step = source.steps[Number(m[1])];
      const moved = step?.events.find((e) => e.type === "edge");
      const state = moved?.to === "finish" ? moved.from : moved?.to;
      expect(m[2], `段 ${Number(m[1]) + 1} で変わった値が今の状態の色でない`).toBe(colorOf(state));
    }
    expect((svg.match(/class="dg-fl-now"/gu) ?? []).length, "変わった値の欄の名前の横の点の数").toBe(sets.length);
  });

  it("state-shows-future-lines-dotted", () => {
    const { layout, svg } = render(orderJson());
    const taken = layout.edges.filter((e) => e.points.length > 0).length;
    expect((svg.match(/<path class="dg-e" d="/gu) ?? []).length, "段が来る前から見える点線の数が、段の線の数と違う").toBe(taken);
    expect(svg, "段が来る前の線が点線でない").toMatch(/\.dg-e\{[^}]*stroke-dasharray/u);
    expect((svg.match(/class="dg-e-on dg-a"/gu) ?? []).length, "段で引く色の線の数が、段の線の数と違う").toBe(taken);
  });
});

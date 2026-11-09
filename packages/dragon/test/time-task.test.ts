// @vitest-environment jsdom
/**
 * 時間軸の図の作業の棒 (#3562)。
 *
 * 時間軸の図の最初の `step` より前に `task <名札> as <名前> <範囲> [color: <色>]` の行を書くと、作業が 1 つずつ自分の行を持ち、
 * 範囲の目盛りの上に続いた太い棒で描かれる。行の左に作業の名前、棒の中に期間の字が出て、針が通った分の棒が濃く塗られる。
 * 範囲は `mark` と `span` と同じく 0 から数える目盛りで、`0-2` か `13` と書く。原本は作業を種類の欄 `time` の `tasks` (版2では `blocks.task`) に持つ。
 * 作業を持つ図は印の列 (`row`) を持たなくても描け、印の列と作業の行は宣言した順に上から並ぶ。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、字は SVG で確かめる。
 * 見本の file と作業のブロックがまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { fileChromium } from "./page-needs";
import { draw, type Layout, type Rect, type Rendered, sampleTimes, type Timeline } from "./render-support";

const [{ TYPE }, { textWidth }] = await Promise.all([import("../src/look/values"), import("../src/layout/measure")]);

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
/** 工程表の見本の名前 */
const PLAN = "release-plan";

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

/** 時間軸。`x` から目盛り 1 つの幅 `unit` で `count` 個並べる */
interface TimeAxis {
  x: number;
  w: number;
  unit: number;
  count: number;
}

/** 印の列 */
interface TimeRow extends Rect {
  id: string;
  name: string;
}

/** 目盛り 1 つの印 */
interface TimeMark extends Rect {
  row: string;
  unit: number;
}

/** 作業の行。`bar` は範囲の目盛りの上の棒、`text` は期間の字、`textRect` はその字が占める所、`inside` は字が棒の中にあるか */
interface TimeTask extends Rect {
  id: string;
  name: string;
  from: number;
  to: number;
  bar: Rect;
  text: string;
  textRect: Rect;
  inside: boolean;
}

/** 軸の字。字の左端を `left` に置く */
interface TimeTick {
  text: string;
  left: number;
}

interface TimeLayout extends Layout {
  axis: TimeAxis;
  rows: TimeRow[];
  marks: TimeMark[];
  tasks?: TimeTask[];
  ticks: TimeTick[];
}

interface TimeTimeline extends Timeline {
  /** 針の動き。[時刻, 目盛りの境の位置] の並びで、間は真っ直ぐ進む */
  needle: Point[];
  /** 作業の棒の濃く塗った割合の動き。[時刻, 割合] の並びで、間は真っ直ぐ変わる */
  tasks?: { task: string; keys: Point[] }[];
}

interface TimeRendered extends Omit<Rendered, "layout" | "timeline"> {
  layout: TimeLayout;
  timeline: TimeTimeline;
  diagram: { time?: { tasks?: unknown[] } };
}

/** 原本の JSON の作業の宣言と段 */
interface Source {
  kind: string;
  blocks: { task?: { id: string; name: string; from: number; to: number; color?: string }[]; row?: { id: string }[] };
  steps: { title: string; events: { type: string; from?: string; to?: string }[] }[];
}

const repoText = (path: string): string => {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 小さな工程表。14 日の目盛りに `lines` の宣言を書き、`steps` の段を足す */
const DAYS = ["time 小さな工程", "scale 日 1d 14 [from: 1]"];
const TO_END = ["step 進む", "  say 針が最後まで進む。", "  now -> 13"];
const plan = (lines: string[], steps: string[] = TO_END): string => [...DAYS, ...lines, "", ...steps].join("\n");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: "ja" | "en" = "ja"): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}\n${text}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: "ja" | "en" = "ja"): TimeRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "作業を持つ時間軸の図を描けない").toBe("");
  return rendered as unknown as TimeRendered;
}

/** 並べた図の作業。無ければ落とす */
function taskOf(layout: TimeLayout, id: string): TimeTask {
  const found = (layout.tasks ?? []).find((t) => t.id === id);
  expect(found, `作業 ${id} が並べた図に無い`).toBeDefined();
  return found as TimeTask;
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

/** 作業 `id` の棒の濃く塗った割合の動き。無ければ落とす */
function fillOf(timeline: TimeTimeline, id: string): Point[] {
  const found = timeline.tasks?.find((t) => t.task === id);
  expect(found, `作業 ${id} の棒を塗る動きが時刻の表に無い`).toBeDefined();
  return found?.keys ?? [];
}

const near = (a: number, b: number, tolerance = 0.5): boolean => Math.abs(a - b) <= tolerance;
const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** 描いた SVG の、字 `text` の `<text>` の x。無ければ `undefined` */
const textX = (svg: string, text: string): number | undefined => {
  const found = new RegExp(`<text[^>]*\\bx="(-?[\\d.]+)"[^>]*>${text}</text>`, "u").exec(svg);
  return found ? Number(found[1]) : undefined;
};
const r2 = (v: number): number => Math.round(v * 100) / 100;

/** 印の列も作業も持つ図の、どの段の時刻でもない図の行の名前を上から並べた物 */
const linesOf = (layout: TimeLayout): string[] =>
  [...layout.rows.map((r) => ({ id: r.id, y: r.y })), ...(layout.tasks ?? []).map((t) => ({ id: t.id, y: t.y }))].sort((a, b) => a.y - b.y).map((l) => l.id);

describe("作業の棒の原本の JSON (#3562)", () => {
  const scale = { unit: "日", length: "1d", count: 14, from: 1 };
  const steps = [{ title: "進む", body: "針が最後まで進む。", events: [{ type: "now", to: 13 }] }];
  const tasksOnly = (): Json => ({
    version: 1,
    kind: "time",
    title: "作業だけの工程",
    boxes: [],
    time: {
      scale,
      tasks: [
        { id: "design", name: "設計", from: 0, to: 2, color: "blue" },
        { id: "ship", name: "リリース", from: 13, to: 13 },
      ],
    },
    steps,
  });

  it("schema-accepts-time-tasks", () => {
    const validate = api("validateDiagram");
    const cases: [string, Json][] = [
      ["印の列を持たず作業だけを持つ図", tasksOnly()],
      [
        "印の列と作業を持つ図",
        { version: 1, kind: "time", title: "休みと工程", boxes: [], time: { scale, rows: [{ id: "off", name: "休み", empty: [3] }], tasks: [{ id: "build", name: "実装", from: 3, to: 8, color: "violet" }] }, steps },
      ],
      ["版2の原本で作業だけを持つ図", { version: 2, kind: "time", title: "作業だけの工程", blocks: { scale, task: [{ id: "design", name: "設計", from: 0, to: 2, color: "blue" }] }, steps }],
    ];
    for (const [name, input] of cases) {
      const checked = validate(input);
      expect(checked.ok, `${name}が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
  });

  it("schema-rejects-misplaced-tasks", () => {
    const validate = api("validateDiagram");
    const sequence: Json = {
      version: 2,
      kind: "sequence",
      title: "作業を書いた時系列図",
      blocks: {
        box: [
          { id: "a", name: "送る側" },
          { id: "b", name: "受ける側" },
        ],
        task: [{ id: "design", name: "設計", from: 0, to: 2 }],
      },
      steps: [{ title: "送る", body: "送る。", events: [{ type: "edge", from: "a", to: "b", carry: { kind: "envelope" } }] }],
    };
    const withTask = (field: string, value: Json): Json => {
      const input = tasksOnly() as { time: { tasks: Record<string, Json>[] } };
      (input.time.tasks[0] as Record<string, Json>)[field] = value;
      return input;
    };
    // 名前と、原本と、誤りの場所と、英語の誤りの文が名指す語
    const cases: [string, Json, string, string | undefined][] = [
      ["時系列図に作業の欄", sequence, "/blocks/task", "time"],
      ["始まりが負の数の範囲", withTask("from", -1), "/time/tasks/0/from", undefined],
      ["終わりが整数でない範囲", withTask("to", 2.5), "/time/tasks/0/to", undefined],
      ["始まりが数でない範囲", withTask("from", "0"), "/time/tasks/0/from", undefined],
    ];
    for (const [name, input, pointer, word] of cases) {
      const ja = validate(input);
      expect(pointers(ja), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      const messages = en.ok ? [] : en.errors.map((e) => e.message);
      expect(messages.filter((m) => KANA.test(m)), `${name} の英語の誤りの文に仮名か漢字がある`).toEqual([]);
      if (word !== undefined) {
        const at = en.ok ? undefined : en.errors.find((e) => e.pointer === pointer);
        expect(at?.message ?? "", `${name} の英語の誤りの文が ${word} を名指さない`).toContain(word);
      }
    }
  });
});

describe("作業の棒の記法 (#3562)", () => {
  it("notation-reads-task-lines", () => {
    const text = plan(["task design as 設計 0-2 [color: blue]", "task build as 実装 3-8 [color: violet]", "task docs as 説明書 を書く 9-12", "task ship as リリース 13"]);
    const want = [
      { id: "design", name: "設計", from: 0, to: 2, color: "blue" },
      { id: "build", name: "実装", from: 3, to: 8, color: "violet" },
      { id: "docs", name: "説明書 を書く", from: 9, to: 12 },
      { id: "ship", name: "リリース", from: 13, to: 13 },
    ];
    const diagram = parsed(text) as unknown as Source;
    expect(diagram.blocks.task, "原本の作業が書いた順に入らない").toEqual(want);
    expect(diagram.blocks.row, "作業だけの図が印の列を持つ").toBeUndefined();
    // 描く処理の形 (版1と同じ欄) では、作業は種類の欄 time の tasks に入る
    const { diagram: model } = render(diagram as unknown as Json);
    expect(model.time?.tasks, "描く処理の形の time.tasks が書いた順でない").toEqual(want);
  });

  it("notation-rejects-misused-task-lines", () => {
    const parse = api("parseNotation");
    const head = ["time 小さな工程", "scale 日 1d 14 [from: 1]", "row off as 休み", "task design as 設計 0-2 [color: blue]"];
    const step = ["step 進む", "  say 進む。", "  now -> 13"];
    const base = parse([...head, ...step].join("\n"));
    expect(base.ok, `誤りの行を足す前の記法が読めない: ${base.ok ? "" : JSON.stringify(base.errors)}`).toBe(true);
    const before = head.length;
    const after = head.length + step.length;
    // 名前と、記法の行と、誤りの行 (0 から数える) と、その行で誤りを指す語
    const cases: [string, string[], number, string][] = [
      ["目盛りの数を超える範囲", [...head, "task late as 遅れ 12-14", ...step], before, "12-14"],
      ["目盛りの数を超える 1 つの目盛り", [...head, "task late as 遅れ 14", ...step], before, "14"],
      ["終わりが始まりより前の範囲", [...head, "task back as 戻り 5-3", ...step], before, "5-3"],
      ["既にある作業と同じ名札", [...head, "task design as 設計の続き 4-5", ...step], before, "design"],
      ["既にある印の列と同じ名札", [...head, "task off as 休みの作業 4-5", ...step], before, "off"],
      ["最初の step より後の task", [...head, ...step, "  task late as 遅れ 4-5"], after, "task"],
      ["印の列も作業も無い図", ["time 小さな工程", "scale 日 1d 14", ...step], 0, "time"],
    ];
    for (const [name, lines, line, token] of cases) {
      const want = { line: line + 1, column: (lines[line] ?? "").indexOf(token) + 1 };
      for (const lang of ["ja", "en"] as const) {
        const read = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
        // 印の列も作業も無い図は、どちらを書けばよいかを示す
        if (line === 0) expect(first?.message ?? "", `${name} の誤りの文が task の行を名指さない (${lang})`).toContain("task");
      }
    }
  });

  it("notation-limits-task-to-time", () => {
    const parse = api("parseNotation");
    // 図の種類と、task の行を差し込む前の記法と、差し込む行 (0 から数える)
    const cases: [string, string[], number][] = [
      ["sequence", ["sequence 作業の行", "box a", "step 送る", "  say 送る。", "  a -> a"], 2],
      ["architecture", ["architecture 作業の行", "box a", "box b", "step 送る", "  say 送る。", "  a -> b"], 3],
      ["state", ["state 作業の行", "box a", "step 移る", "  say 移る。", "  start -> a"], 2],
      ["git", ["git 作業の行", "branch main", "step 積む", "  say 積む。", "  commit A on main"], 2],
      ["tree", ["tree 作業の行", "step 葉を出す", "  say 葉を出す。", "  leaf a"], 1],
      ["lineup", ["lineup 作業の行", "box a", "item x", "step 並べる", "  say 並べる。", "  line a: x"], 3],
    ];
    for (const [kind, lines, at] of cases) {
      const base = parse(lines.join("\n"));
      expect(base.ok, `${kind} の task の行を足す前の記法が読めない: ${base.ok ? "" : JSON.stringify(base.errors)}`).toBe(true);
      const insert = (line: string): string => [...lines.slice(0, at), line, ...lines.slice(at)].join("\n");
      for (const lang of ["ja", "en"] as const) {
        const read = parse(insert("task design as 設計 0-2"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `${kind} の task の行が ${at + 1} 行目の誤りにならない (${lang})`).toBe(at + 1);
        // 時間軸の図だけの行 (row) と同じ形の文で、time でだけ書けることを示す
        const row = parse(insert("row design as 設計"), { lang });
        const rowMessage = row.ok ? "" : (row.errors[0]?.message ?? "");
        expect(rowMessage, `${kind} の row の行が時間軸の図だけの行の誤りにならない (${lang})`).toContain("time");
        expect(first?.message, `${kind} の task の行の誤りの文が、時間軸の図でしか書けないことを示さない (${lang})`).toBe(rowMessage.replace(/^row\b/u, "task"));
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${kind} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-keeps-task-plain-outside-time", () => {
    const cases: [string, string[]][] = [
      ["sequence", ["sequence 作業の名札", "box task as 作業", "box db", "step 送る", "  say 送る。", "  task -> db: 送る"]],
      ["architecture", ["architecture 作業の名札", "box task as 作業", "box db", "step 送る", "  say 送る。", "  task -> db: 送る"]],
      ["state", ["state 作業の名札", "box task as 作業", "box db", "step 移る", "  say 移る。", "  start -> task", "  task -> db: 送る"]],
    ];
    for (const [kind, lines] of cases) {
      const diagram = parsed(lines.join("\n")) as unknown as Source & { blocks: { box?: { id: string }[] } };
      expect((diagram.blocks.box ?? []).map((b) => b.id), `${kind} の箱の名札`).toEqual(["task", "db"]);
      const line = diagram.steps[0]?.events.at(-1);
      expect(line && { type: line.type, from: line.from, to: line.to }, `${kind} の task からの線`).toEqual({ type: "edge", from: "task", to: "db" });
    }
  });

  it("task-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const texts: [string, string, "ja" | "en"][] = [
      [`${PLAN}.dragon`, fileText(`${PLAN}.dragon`) ?? "", "ja"],
      [`${PLAN}.en.dragon`, fileText(`${PLAN}.en.dragon`) ?? "", "en"],
      ["印の列と作業を交互に書いた図", plan(["task design as 設計 0-2 [color: blue]", "row off as 休み [empty: 0 1]", "task build as 実装 3-8", "row hold as 待ち", "task ship 13"]), "ja"],
      ["名前に空白を持つ作業", plan(["task docs as Write the docs 9-12 [color: green]"]), "en"],
    ];
    for (const [name, text, lang] of texts) {
      expect(text, `${name} が無い`).not.toBe("");
      const first = parse(text, { lang });
      expect(first.ok, `${name} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed, { lang });
      expect(second.ok, `${name} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
      expect(second.ok ? second.diagram : undefined, `${name} を往復した JSON が最初と違う\n${printed}`).toEqual(first.diagram);
    }
  });
});

describe("作業の棒の描き方 (#3562)", () => {
  it("task-draws-a-thick-bar-per-row", () => {
    const { layout, svg } = render(parsed(plan(["task design as 設計 0-2 [color: blue]", "task build as 実装 3-8 [color: violet]"])));
    const { axis } = layout;
    expect((layout.tasks ?? []).map((t) => t.id), "作業の行が宣言した順でない").toEqual(["design", "build"]);
    const design = taskOf(layout, "design");
    const build = taskOf(layout, "build");
    // 作業は 1 つずつ自分の行を持つ
    expect(build.y, "実装の行が設計の行より下に無い").toBeGreaterThanOrEqual(design.y + design.h);
    for (const task of [design, build]) {
      const { bar } = task;
      expect(near(bar.x, axis.x + task.from * axis.unit, 1.5), `${task.id} の棒の左端が目盛り ${task.from} の始まりに無い`).toBe(true);
      expect(near(bar.x + bar.w, axis.x + (task.to + 1) * axis.unit, 1.5), `${task.id} の棒の右端が目盛り ${task.to} の終わりに無い`).toBe(true);
      expect(bar.y >= task.y - 1e-6 && bar.y + bar.h <= task.y + task.h + 1e-6, `${task.id} の棒が自分の行の中に無い`).toBe(true);
      expect(bar.h, `${task.id} の棒が太くない`).toBeGreaterThanOrEqual(12);
      // 角の丸い棒が 1 本
      const rects = [...svg.matchAll(new RegExp(`<rect[^>]*\\bx="${r2(bar.x)}"[^>]*\\bwidth="${r2(bar.w)}"[^>]*>`, "gu"))].map((m) => m[0]);
      expect(rects.length, `${task.id} の棒が描かれない`).toBeGreaterThan(0);
      const radius = Math.max(0, ...rects.map((r) => Number(/\brx="([\d.]+)"/u.exec(r)?.[1] ?? 0)));
      expect(radius, `${task.id} の棒の角が丸くない`).toBeGreaterThan(0);
      // 行の左に作業の名前
      const nameX = textX(svg, task.name);
      expect(nameX, `${task.id} の名前 ${task.name} が描かれない`).toBeDefined();
      expect(nameX ?? Number.POSITIVE_INFINITY, `${task.id} の名前が行の左に無い`).toBeLessThan(axis.x);
      // 棒の中に期間の字。試作で選んだ形で、始まりと終わりの目盛りの名前の数 (`scale` の `from` の 1 を足す) と `scale` の名前の単位
      expect(task.text, `${task.id} の期間の字が始まりと終わりの目盛りの名前でない`).toBe(`${task.from + 1}〜${task.to + 1}日`);
      expect(svg, `${task.id} の期間の字 ${task.text} が描かれない`).toContain(`>${task.text}<`);
      expect(task.inside, `${task.id} の期間の字が棒の中に無い`).toBe(true);
      const r = task.textRect;
      expect(r.x >= bar.x && r.x + r.w <= bar.x + bar.w && r.y >= bar.y - 1 && r.y + r.h <= bar.y + bar.h + 1, `${task.id} の期間の字が棒からはみ出す`).toBe(true);
    }
    // 期間の字が棒に収まらない時は棒の右に出す
    const narrow = render(parsed(["time 細かい目盛り", "scale 分 1min 60", "task check as 確認 5 [color: rose]", "", ...TO_END.slice(0, 2), "  now -> 59"].join("\n"))).layout;
    const check = taskOf(narrow, "check");
    expect(check.inside, "棒に収まらない期間の字が棒の中にある").toBe(false);
    expect(check.textRect.x, "棒に収まらない期間の字が棒の右に無い").toBeGreaterThanOrEqual(check.bar.x + check.bar.w);
    expect(near(check.textRect.y + check.textRect.h / 2, check.bar.y + check.bar.h / 2, 3), "棒の右の期間の字が棒の高さに無い").toBe(true);
    // 英語は目盛りの名前を頭に置き、仮名と漢字を含まない
    const english = render(parsed(fileText("release-plan.en.dragon") ?? "", "en"), "en").layout;
    const texts = (english.tasks ?? []).map((t) => t.text);
    expect(texts, "英語の見本の期間の字が目盛りの名前の範囲でない").toEqual(["Day 1–3", "Day 4–9", "Day 8–11", "Day 14"]);
    for (const text of texts) expect(text, `英語の期間の字 ${text} が仮名か漢字を含む`).not.toMatch(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u);
    // 最後の目盛りの狭い棒は、右に置くと軸の右端を越えるので棒の左に置く
    const ship = taskOf(english, "ship");
    expect(ship.inside, "最後の目盛りの棒に Day 14 が収まる").toBe(false);
    expect(ship.textRect.x + ship.textRect.w, "軸の右端の近くの期間の字が棒の左に無い").toBeLessThanOrEqual(ship.bar.x);
    expect(ship.textRect.x, "棒の左の期間の字が軸の左端を越える").toBeGreaterThanOrEqual(english.axis.x);
  });

  it("task-fills-passed-part", () => {
    // 段 1 で針が実装の棒の途中 (目盛り 5 の終わり) まで進み、段 2 で棒の終わりを過ぎる
    const steps = ["step 途中まで", "  say 実装の途中まで進む。", "  now -> 5", "", "step 最後まで", "  say 最後まで進む。", "  now -> 13"];
    const { layout, timeline, svg } = render(parsed(plan(["task build as 実装 3-8 [color: violet]"], steps)));
    const build = taskOf(layout, "build");
    const keys = fillOf(timeline, "build");
    expect(keys.length, "実装の棒を塗る動きが無い").toBeGreaterThan(1);
    const want = (t: number): number => Math.min(1, Math.max(0, (valueAt(timeline.needle, t) - build.from) / (build.to + 1 - build.from)));
    for (const t of sampleTimes(timeline)) expect(near(valueAt(keys, t), want(t), 0.02), `${t} 秒の濃く塗った割合 ${valueAt(keys, t)} が針の所 (${want(t)}) と合わない`).toBe(true);
    const endOf = (s: number): number => (timeline.steps[s]?.end ?? 0) - 1e-6;
    const half = valueAt(keys, endOf(0));
    expect(half > 0.05 && half < 0.95, `針が棒の途中にいる段の終わりに、棒が途中まで塗られない (${half})`).toBe(true);
    expect(near(half, 0.5, 0.02), `針が棒の半ばにいる段の終わりの割合 ${half}`).toBe(true);
    expect(near(valueAt(keys, endOf(1)), 1, 1e-6), "針が棒の終わりを過ぎた段の終わりに、棒の全てが濃くない").toBe(true);
    // 棒は作業の色で描き、濃く塗る所は針と共に伸びる
    const group = /<g[^>]*data-task="build"[^>]*>/u.exec(svg)?.[0];
    expect(group, "実装の棒の塊が描かれない").toBeDefined();
    expect(group ?? "", "実装の棒が作業の色で描かれない").toContain("--c:var(--c-violet)");
    // 塊の中身は、次の作業の塊か針までの間に在る
    const start = svg.indexOf('data-task="build"');
    const ends = [svg.indexOf("data-task=", start + 1), svg.indexOf("data-needle", start)].filter((at) => at > start);
    const body = svg.slice(start, ends.length > 0 ? Math.min(...ends) : undefined);
    expect(/<rect[^>]*animation-name/u.test(body), "実装の棒の濃く塗る所が動かない").toBe(true);
  });

  it("task-fills-passed-part", async () => {
    // 目盛りが細かい図で、針が棒の中の期間の字の途中で止まる段を描く。塗られた所の上の字は明るく、まだ塗られない所の字は濃い
    const steps = ["step 字の途中まで", "  say 針が棒の中の字の途中で止まる。", "  now -> 3", "", "step 最後まで", "  say 最後まで進む。", "  now -> 27"];
    const { layout, timeline, svg } = render(parsed(["time 字の途中で止まる工程", "scale 日 1d 28 [from: 1]", "task build as 実装 3-12 [color: violet]", "", ...steps].join("\n")));
    const build = taskOf(layout, "build");
    const r = build.textRect;
    const at = (timeline.steps[0]?.end ?? 0) - 0.01;
    const edge = build.bar.x + build.bar.w * valueAt(fillOf(timeline, "build"), at);
    expect(r.x + 6 < edge && edge < r.x + r.w - 6, `塗りの端 ${edge} が期間の字 (${r.x} から ${r.x + r.w}) の途中に無い`).toBe(true);
    // 棒の中の字は 2 回描き、明るい字は濃く塗る所と同じ動きの四角で切り抜く
    const texts = [...svg.matchAll(new RegExp(`<text[^>]*>${build.text}</text>`, "gu"))].map((m) => m[0]);
    expect(texts.length, "棒の中の期間の字が 2 回描かれない").toBe(2);
    const fill = /<rect class="dg-tm-tf[^>]*animation-name:([\w-]+)[^>]*>/u.exec(svg);
    const clipId = /clip-path="url\(#([^)]+)\)"/u.exec(texts.find((t) => t.includes("dg-tm-to")) ?? "")?.[1];
    const clip = new RegExp(`<clipPath id="${clipId}"><rect[^>]*animation-name:([\\w-]+)`, "u").exec(svg);
    expect(clip?.[1], "明るい字を切り抜く四角が濃く塗る所と同じ動きでない").toBe(fill?.[1]);
    expect(svg, "塗った地の上の字の色が色味の表の変数でない").toMatch(/\.dg-tm-to\{[^}]*fill:var\(--on-c\)/u);
    expect(svg, "まだ塗られない所の字の色が色味の表の変数でない").toMatch(/\.dg-tm-tt\{[^}]*fill:var\(--ct\)/u);
    // 棒の外の字には塗りが届かないので 1 回だけ描く
    const english = render(parsed(fileText("release-plan.en.dragon") ?? "", "en"), "en").svg;
    // 軸の字 (#3574) も同じ `Day 14` なので、軸の字の組 `dg-tm-tk` を除いて数える
    const barTexts = (word: string): number => [...english.matchAll(new RegExp(`<text[^>]*>${word}</text>`, "gu"))].filter((m) => !m[0].includes("dg-tm-tk")).length;
    expect(barTexts("Day 14"), "棒の外の期間の字が 1 回でない").toBe(1);
    expect(barTexts("Day 1–3"), "棒の中の期間の字が 2 回でない").toBe(2);

    // 針が止まった時刻で描いた形を撮り、塗りの端の左と右で字の色を数える。図は頁の幅に伸びるので、頁を図の幅にして図の座標のまま撮る
    const context = await (await fileChromium()).newContext({ viewport: { width: Math.ceil(layout.width), height: Math.ceil(layout.height) }, deviceScaleFactor: 3 });
    try {
      const page = await context.newPage();
      await page.setContent(`<!doctype html><body style="margin:0">${svg}</body>`);
      const colors = await page.evaluate((stop) => {
        const figure = document.querySelector("svg");
        figure?.style.setProperty("--at", String(stop));
        figure?.style.setProperty("--play", "paused");
        const fillOfText = (name: string): string => getComputedStyle(document.querySelector(name) as Element).fill;
        return { light: fillOfText(".dg-tm-to"), dark: fillOfText(".dg-tm-tt") };
      }, at);
      /** 撮った範囲 (図の座標) で、色 `color` に近い点の数 */
      const pixels = async (from: number, to: number, color: string, tolerance: number): Promise<number> => {
        const shot = await page.screenshot({ clip: { x: from, y: r.y, width: to - from, height: r.h } });
        return page.evaluate(
          async ({ data, wanted, off }) => {
            const image = new Image();
            image.src = `data:image/png;base64,${data}`;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const paint = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
            // CSS の色の字を点の値にする
            paint.fillStyle = wanted;
            paint.fillRect(0, 0, 1, 1);
            const [red = 0, green = 0, blue = 0] = paint.getImageData(0, 0, 1, 1).data;
            paint.drawImage(image, 0, 0);
            const { data: points } = paint.getImageData(0, 0, image.width, image.height);
            let found = 0;
            for (let k = 0; k < points.length; k += 4) {
              if (Math.abs((points[k] ?? 0) - red) <= off && Math.abs((points[k + 1] ?? 0) - green) <= off && Math.abs((points[k + 2] ?? 0) - blue) <= off) found++;
            }
            return found;
          },
          { data: shot.toString("base64"), wanted: color, off: tolerance },
        );
      };
      // 針の線が塗りの端に重なるので、端から 3 離す
      expect(await pixels(r.x, edge - 3, colors.light, 12), "塗られた所の上に明るい字が出ない").toBeGreaterThan(0);
      expect(await pixels(edge + 3, r.x + r.w, colors.dark, 30), "まだ塗られない所に濃い字が出ない").toBeGreaterThan(0);
      expect(await pixels(edge + 3, r.x + r.w, colors.light, 12), "まだ塗られない所に明るい字がはみ出す").toBe(0);
    } finally {
      await context.close();
    }
  });

  it("task-single-tick-draws-bar", () => {
    const { layout, timeline } = render(parsed(plan(["task ship as リリース 13 [color: green]"])));
    const { axis } = layout;
    const ship = taskOf(layout, "ship");
    expect(near(ship.bar.x, axis.x + 13 * axis.unit, 1.5), "1 つの目盛りの棒の左端が目盛りの始まりに無い").toBe(true);
    expect(near(ship.bar.w, axis.unit, 2.5), `1 つの目盛りの棒の幅 ${ship.bar.w} が目盛り 1 つの幅 ${axis.unit} でない`).toBe(true);
    expect(ship.bar.h, "1 つの目盛りの棒が太くない").toBeGreaterThanOrEqual(12);
    expect(ship.text, "1 つの目盛りの期間の字が目盛りの名前 1 つでない").toBe("14日");
    const keys = fillOf(timeline, "ship");
    expect(near(valueAt(keys, (timeline.steps[0]?.end ?? 0) - 1e-6), 1, 1e-6), "針が過ぎた 1 つの目盛りの棒が濃く塗られない").toBe(true);
  });

  it("task-and-row-keep-declared-order", () => {
    const { layout } = render(
      parsed(plan(["task design as 設計 0-2 [color: blue]", "row off as 休み [color: slate, empty: 6 7]", "task build as 実装 3-8 [color: violet]", "row hold as 待ち", "task ship as リリース 13 [color: green]"])),
    );
    const { axis } = layout;
    expect(linesOf(layout), "印の列と作業の行が宣言した順に上から並ばない").toEqual(["design", "off", "build", "hold", "ship"]);
    const every = [...layout.rows, ...(layout.tasks ?? [])].sort((a, b) => a.y - b.y);
    every.slice(1).forEach((line, k) => expect(line.y, `${line.id} の行が上の行と重なる`).toBeGreaterThanOrEqual((every[k] as Rect).y + (every[k] as Rect).h));
    for (const task of layout.tasks ?? []) {
      expect(near(task.bar.x, axis.x + task.from * axis.unit, 1.5) && near(task.bar.x + task.bar.w, axis.x + (task.to + 1) * axis.unit, 1.5), `${task.id} の棒が目盛りの位置にそろわない`).toBe(true);
      // 同じ目盛りの印は棒の左右の端の間に置かれる
      for (const row of layout.rows) {
        const marks = layout.marks.filter((m) => m.row === row.id && m.unit >= task.from && m.unit <= task.to);
        expect(marks.length, `${row.id} の列に ${task.id} の範囲の印が無い`).toBe(task.to - task.from + 1);
        for (const m of marks) expect(m.x + m.w / 2 > task.bar.x && m.x + m.w / 2 < task.bar.x + task.bar.w, `${row.id} の ${m.unit} の印が ${task.id} の棒の範囲にそろわない`).toBe(true);
      }
    }
  });
});

describe("工程表の見本 (#3562)", () => {
  it("release-plan-passes-layout-check", () => {
    const check = (dragon as unknown as { checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => unknown[] }).checkLayoutText;
    expect(check, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
    for (const lang of ["ja", "en"] as const) {
      const name = `${PLAN}${lang === "en" ? ".en" : ""}.dragon`;
      const text = fileText(name);
      expect(text, `${name} が packages/dragon/examples に無い`).toBeDefined();
      if (text === undefined) continue;
      // 枠の幅を渡さない時と幅 390 の時の両方を、全ての段で見る
      expect(check?.(text, { lang }) ?? ["崩れを確かめられない"], `${name} に崩れがある`).toEqual([]);
      const { layout } = render(parsed(text, lang), lang);
      const bars = (layout.tasks ?? []).map((t) => ({ id: t.id, bar: t.bar }));
      expect(bars.length, `${name} の作業の棒の数`).toBe(4);
      for (const [k, a] of bars.entries()) for (const b of bars.slice(k + 1)) expect(overlaps(a.bar, b.bar), `${name} の ${a.id} と ${b.id} の棒が重なる`).toBe(false);
    }
  });

  it("task-example-files-match", () => {
    const files = [`${PLAN}.dragon`, `${PLAN}.en.dragon`, `${PLAN}.json`, `${PLAN}.en.json`];
    for (const file of files) expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
    if (!files.every((file) => existsSync(join(EXAMPLES, file)))) return;
    const ja = parsed(fileText(`${PLAN}.dragon`) ?? "") as unknown as Source;
    const en = parsed(fileText(`${PLAN}.en.dragon`) ?? "", "en") as unknown as Source;
    expect(ja.kind, "工程表の見本の図の種類").toBe("time");
    const shape = (d: Source): Record<string, unknown> => ({ kind: d.kind, tasks: (d.blocks.task ?? []).length, steps: d.steps.length });
    expect(shape(ja).tasks, "工程表の見本の作業の数").toBe(4);
    expect(shape(en), "工程表の英語版の作業と段の数が日本語版と違う").toEqual(shape(ja));
    expect(ja, `${PLAN}.dragon から作った JSON が ${PLAN}.json と違う`).toEqual(JSON.parse(fileText(`${PLAN}.json`) ?? "{}"));
    expect(en, `${PLAN}.en.dragon から作った JSON が ${PLAN}.en.json と違う`).toEqual(JSON.parse(fileText(`${PLAN}.en.json`) ?? "{}"));
  });

  it("docs-describe-time-task", () => {
    /** 見出し `heading` から、次の `next` まで */
    const sectionOf = (text: string, heading: string, next: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const end = text.indexOf(next, start + heading.length);
      return text.slice(start, end < 0 ? undefined : end);
    };
    // 書き方の文書と、task の行の書き方
    const forms: [string, string][] = [
      ["README.md", "`task <id> as <name> <range>"],
      ["README.ja.md", "`task`"],
      ["packages/dragon/README.md", "`task <id> as <name> <range>"],
      ["packages/dragon/README.ja.md", "`task <名札> as <名前> <範囲>"],
      ["packages/dragon/examples/quick-start.md", "`task <名札> as <名前> <範囲>"],
      ["packages/dragon/examples/quick-start.en.md", "`task <id> as <name> <range>"],
      ["plugins/dragon/skills/dragon/references/kinds/time.md", "`task <id> as <name> <range>"],
    ];
    for (const [path, form] of forms) expect(repoText(path), `${path} に task の行の書き方が無い`).toContain(form);
    // 使い方の頁の時間軸の図の節は、作業の棒のブロックの段落を日本語と英語で持つ
    const docs = repoText("packages/dragon/src/blocks/task/gallery/docs.ts");
    expect(docs, "使い方の頁の作業の棒の段落 (blocks/task/gallery/docs.ts) が無い").not.toBe("");
    expect(docs, "作業の棒の段落が時間軸の図の節に無い").toContain('section: "time"');
    expect(docs, "作業の棒の段落に日本語の task の行の書き方が無い").toContain("`task <名札> as <名前> <範囲>");
    expect(docs, "作業の棒の段落に英語の task の行の書き方が無い").toContain("`task <id> as <name> <range>");
    expect(repoText("apps/playground-spa/src/catalog/blocks-docs.gen.ts"), "使い方の頁が作業の棒の段落を読まない").toContain('"task"');
    // 変更の記録の 0.68.0 の Added に工程表の棒が載る (0.68.0 で出した、#3568)
    for (const path of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const released = sectionOf(repoText(path), "## [0.68.0]", "\n## [");
      const added = sectionOf(released, "### Added", "\n### ");
      expect(added, `${path} の 0.68.0 に Added が無い`).not.toBe("");
      expect(added, `${path} の 0.68.0 の Added に task の行が無い`).toContain("`task");
    }
  });
});

describe("工程表の軸の字 (#3574)", () => {
  /** 工程表の見本を描いた置き場所 */
  const planLayout = (lang: "ja" | "en"): TimeLayout => render(parsed(fileText(`${PLAN}${lang === "en" ? ".en" : ""}.dragon`) ?? "", lang), lang).layout;
  const texts = (layout: TimeLayout): string[] => layout.ticks.map((tick) => tick.text);

  it("task-axis-uses-bar-numbers", () => {
    // 棒の字 (1〜3日) と同じ番号で読めるよう、軸も日の番号で数える
    expect(texts(planLayout("ja")), "軸の字が棒の字と同じ番号でない").toEqual(["1日", "5日", "10日", "14日"]);
  });

  it("task-axis-speaks-bar-words", () => {
    // 英語の棒の字 (Day 1–3) と同じく、目盛りの名前を頭に置く
    expect(texts(planLayout("en")), "英語の軸の字が棒の字と同じ形でない").toEqual(["Day 1", "Day 5", "Day 10", "Day 14"]);
  });

  it("task-axis-centers-on-its-tick", () => {
    const layout = planLayout("ja");
    const { axis } = layout;
    for (const tick of layout.ticks) {
      const number = Number.parseInt(tick.text, 10);
      const center = tick.left + textWidth(tick.text, TYPE.timeTick) / 2;
      expect(near(center, axis.x + (number - 1 + 0.5) * axis.unit, 1), `軸の字 ${tick.text} が目盛り ${number} の真ん中に無い`).toBe(true);
    }
  });

  it("task-axis-follows-scale-from", () => {
    // `from` を書かない図の棒の字は 0 から始まるので、軸の字も 0 から始まり、最後の目盛りの番号で終わる
    const { layout } = render(parsed(["time 小さな工程", "scale 日 1d 14", "task design as 設計 0-2 [color: blue]", "", ...TO_END].join("\n")));
    expect(taskOf(layout, "design").text, "棒の字が 0 から始まらない").toBe("0〜2日");
    expect(texts(layout), "軸の字が棒の字と同じ番号でない").toEqual(["0日", "5日", "10日", "13日"]);
  });

  it("task-axis-keeps-apart-on-many-ticks", () => {
    const check = (dragon as unknown as { checkLayoutText: (text: string, options: { lang: "ja" | "en" }) => unknown[] }).checkLayoutText;
    // 細かい目盛りの図と、目盛りの名前が長く隣の字に届く図 (1 と 2 の字が重なるので 2 の字を置かない)
    const cases: [string, string, string[] | undefined][] = [
      ["60 目盛り", "scale 分 1min 60\ntask check as 確認 5 [color: rose]\n\nstep 進む\n  say 針が最後まで進む。\n  now -> 59", undefined],
      ["長い目盛りの名前", "scale ブロック 12s 12 [from: 1]\ntask check as 確認 0-2 [color: rose]\n\nstep 進む\n  say 針が最後まで進む。\n  now -> 11", ["1ブロック", "4ブロック", "6ブロック", "8ブロック", "10ブロック", "12ブロック"]],
    ];
    for (const [name, body, want] of cases) {
      const text = `time ${name}\n${body}`;
      const { layout } = render(parsed(text));
      const boxes = layout.ticks.map((tick) => ({ left: tick.left, right: tick.left + textWidth(tick.text, TYPE.timeTick) }));
      expect(boxes.length, `${name} の軸の字が少なすぎて確かめられない`).toBeGreaterThan(2);
      if (want) expect(texts(layout), `${name} の軸の字`).toEqual(want);
      for (const [k, box] of boxes.slice(1).entries()) expect(box.left, `${name} の軸の字 ${layout.ticks[k + 1]?.text} が前の字に重なる`).toBeGreaterThanOrEqual((boxes[k] as { right: number }).right);
      expect(check(text, { lang: "ja" }), `${name} の工程表に崩れがある`).toEqual([]);
    }
  });

  it("changelog-describes-task-axis", () => {
    for (const path of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const start = repoText(path).indexOf("## [0.68.1]");
      const end = repoText(path).indexOf("\n## [", start + 1);
      expect(start, `${path} に 0.68.1 の節が無い`).toBeGreaterThanOrEqual(0);
      expect(repoText(path).slice(start, end), `${path} の 0.68.1 の節に軸の字の変更 (#3574) が無い`).toContain("#3574");
    }
  });
});

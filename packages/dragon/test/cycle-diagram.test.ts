// @vitest-environment jsdom
/**
 * 回り続ける図 (#3623)。
 *
 * 輪になった手順を段で追う図。原本の JSON の `kind` は `cycle` で、手順は `box` で宣言し、書いた順に真上から右回りに輪の上へ置く。
 * 段の中の `<名札> -> <名札> [tag: <字>]` は輪の次の手順への線だけを受け、札がその段で弧に沿って次の手順へ走り、走った弧は光ったまま残る。
 * 輪の真ん中には中身の帯 (`strip <題>: <欄>, <欄>`) の題と、段の中の `set <欄>: <値>` で書いた値を出す。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (手順の箱を輪の上に置き、隣どうしを弧の矢印で結ぶ)。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、光り方と真ん中の値の出方は SVG の keyframes を jsdom で読んで確かめる。
 * 見本の file と回り続ける図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { draw, type Layout, type Rect, type Rendered, type Span } from "./render-support";

const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages/dragon");
const EXAMPLES = join(PACKAGE, "examples");

/** 回り続ける図の見本 4 枚 (#3623 の「決まっていること」) */
const CYCLE_EXAMPLES = ["eth-slot", "sprint", "pdca", "restake"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

interface CycleBox extends Rect {
  id: string;
  name: string;
  cx: number;
  cy: number;
}

/** 輪の上の隣どうしを結ぶ弧。`points` は箱の外に見える弧を細かく区切った点 */
interface CycleArc {
  from: string;
  to: string;
  points: Point[];
}

interface CycleLayout extends Omit<Layout, "boxes"> {
  kind: string;
  boxes: CycleBox[];
  /** 輪の真ん中と半径 */
  ring?: { cx: number; cy: number; r: number };
  arcs?: CycleArc[];
}

interface CycleRendered extends Omit<Rendered, "layout"> {
  layout: CycleLayout;
}

interface SourceEvent {
  type: string;
  from?: string;
  to?: string;
  carry?: { kind: string; text?: string };
  field?: string;
  value?: string;
}

interface Source {
  kind: string;
  title: string;
  blocks: { box?: { id: string; name: string }[]; strip?: { title: string; fields: string[] } };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 見本の file から、最初の注釈の行と、その後ろの空の行を外した記法 */
const withoutComments = (text: string): string => text.replace(/^(?:\/\/[^\n]*\n)+\n*/u, "");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: "ja" | "en" = "ja"): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `回り続ける図の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): CycleRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "回り続ける図を描けない").toBe("");
  const layout = (rendered as unknown as CycleRendered | undefined)?.layout;
  expect(layout?.kind, "描いた図が回り続ける図 (cycle) でない").toBe("cycle");
  expect(layout?.ring, "並べた回り続ける図に輪 (layout.ring) が無い").toBeDefined();
  return rendered as unknown as CycleRendered;
}

const boxOf = (layout: CycleLayout, id: string): CycleBox => {
  const box = layout.boxes.find((b) => b.id === id);
  expect(box, `${id} の箱が並べた図に無い`).toBeDefined();
  return box as CycleBox;
};

/** 輪の真ん中から見た点の向き。真上を 0 にし、右回りに増える (0 から 2π) */
function angleOf(ring: { cx: number; cy: number }, [x, y]: Point): number {
  const a = Math.atan2(x - ring.cx, ring.cy - y);
  return a < 0 ? a + Math.PI * 2 : a;
}

/** 向き `a` から右回りに `b` まで進む角 (0 から 2π) */
function clockwise(a: number, b: number): number {
  const d = b - a;
  return d < 0 ? d + Math.PI * 2 : d;
}

const edgesOf = (d: Source): (SourceEvent & { step: number; event: number })[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e, i) => (e.type === "edge" ? [{ ...e, step: s, event: i }] : [])));

/** `n` 個の手順を輪に並べ、札を 1 周させる記法。最初の段で真ん中の欄を書き、最後の段で次の回に入る */
function ringText(n: number): string {
  const ids = Array.from({ length: n }, (_, i) => `s${i + 1}`);
  const lines = ["cycle 小さな輪", "", ...ids.map((id, i) => `box ${id} as 手順${i + 1}`), "", "strip 回: 番号, 経過", ""];
  lines.push("step 始める", "  say 1つ目の手順から始める。", "  set 番号: 1回目", "  set 経過: 0日", "");
  ids.forEach((id, i) => {
    const next = ids[(i + 1) % n] as string;
    lines.push(`step 手順${i + 2 > n ? 1 : i + 2}へ`, `  say 札が手順${i + 2 > n ? 1 : i + 2}へ移る。`, `  ${id} -> ${next} [tag: 札${i + 1}]`);
    if (i === n - 1) lines.push("  set 番号: 2回目");
    lines.push(`  set 経過: ${i + 1}日`, "");
  });
  return `${lines.join("\n").trimEnd()}\n`;
}

/** 3 つの手順を回る、書き戻した形の小さな記法 */
const SMALL = [
  "cycle 小さな輪",
  "",
  "box a as 計画",
  "box b as 実行",
  "box c as 確かめる",
  "",
  "strip 回: 番号, 経過",
  "",
  "step 計画する",
  "  say 計画から始める。",
  "  set 番号: 1回目",
  "  set 経過: 0日",
  "",
  "step 実行する",
  "  say 計画を実行する。",
  "  a -> b [tag: 計画]",
  "  set 経過: 3日",
  "",
  "step 確かめる",
  "  say 結果を確かめる。",
  "  b -> c [tag: 結果]",
  "  set 経過: 5日",
  "",
  "step 次の回へ",
  "  say 直して次の回の計画へ戻る。",
  "  c -> a [tag: 直す]",
  "  set 番号: 2回目",
  "  set 経過: 0日",
  "",
].join("\n");

const tag = (from: string, to: string, text: string): Json => ({ type: "edge", from, to, carry: { kind: "tag", text } });
const set = (field: string, value: string): Json => ({ type: "strip", field, value });

/** SMALL と同じ図の原本 (版2) */
function smallCycle(): Json {
  return {
    version: 2,
    kind: "cycle",
    title: "小さな輪",
    blocks: {
      box: [
        { id: "a", name: "計画" },
        { id: "b", name: "実行" },
        { id: "c", name: "確かめる" },
      ],
      strip: { title: "回", fields: ["番号", "経過"] },
    },
    steps: [
      { title: "計画する", body: "計画から始める。", events: [set("番号", "1回目"), set("経過", "0日")] },
      { title: "実行する", body: "計画を実行する。", events: [tag("a", "b", "計画"), set("経過", "3日")] },
      { title: "確かめる", body: "結果を確かめる。", events: [tag("b", "c", "結果"), set("経過", "5日")] },
      { title: "次の回へ", body: "直して次の回の計画へ戻る。", events: [tag("c", "a", "直す"), set("番号", "2回目"), set("経過", "0日")] },
    ],
  };
}

describe("回り続ける図の原本の JSON (#3623)", () => {
  it("schema-accepts-cycle-diagram", () => {
    const validate = api("validateDiagram");
    for (const lang of ["ja", "en"] as const) {
      const checked = validate(smallCycle(), { lang });
      expect(checked.ok, `最小の回り続ける図が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    // 中身の帯を持たない回り続ける図も通る
    const plain = smallCycle() as { blocks: Record<string, Json>; steps: { events: Json[] }[] };
    delete plain.blocks.strip;
    for (const step of plain.steps) step.events = step.events.filter((e) => (e as { type: string }).type !== "strip");
    plain.steps[0] = { ...plain.steps[0], events: [tag("a", "b", "計画")] };
    const bare = validate(plain);
    expect(bare.ok, `中身の帯の無い回り続ける図が検査で落ちる: ${JSON.stringify(bare.ok ? [] : bare.errors)}`).toBe(true);
  });
});

describe("回り続ける図の記法 (#3623)", () => {
  it("cycle-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(SMALL)), "小さな回り続ける図を読んで書き戻した記法が元と違う").toBe(SMALL);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(SMALL), "小さな回り続ける図の記法から作った原本").toEqual(smallCycle());
    for (const key of CYCLE_EXAMPLES) {
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const diagram = parsed(text, lang);
        expect((diagram as unknown as Source).kind, `${file} の図の種類`).toBe("cycle");
        expect(print(diagram), `${file} を読んで書き戻した記法が元 (最初の注釈を除く) と違う`).toBe(withoutComments(text));
      }
    }
  });

  it("cycle-rejects-a-line-that-skips-a-step", () => {
    const parse = api("parseNotation");
    const head = ["cycle small", "box a", "box b", "box c", "box d", "step go", "  say go."];
    const n = head.length;
    const at = (line: string, token: string, from = 0): number => line.indexOf(token, from);
    // 1 つ飛ばす線、逆回りの線、同じ手順へ戻る線は、受ける側の名札を指して止める
    const cases: [string, string][] = [
      ["1 つ飛ばす線", "  a -> c [tag: x]"],
      ["2 つ飛ばす線", "  a -> d [tag: x]"],
      ["逆回りの線", "  b -> a [tag: x]"],
      ["最初の手順から最後の手順への逆回りの線", "  a -> d"],
      ["同じ手順へ戻る線", "  c -> c [tag: x]"],
    ];
    for (const [name, line] of cases) {
      const to = line.trim().split(/\s+/u)[2] as string;
      const want = { line: n + 1, column: at(line, to, at(line, "->")) + 1 };
      for (const lang of ["ja", "en"] as const) {
        const read = parse([...head, line].join("\n"), { lang });
        expect(read.ok, `${name} を書いた回り続ける図が読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang}): ${first?.message}`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
        else expect(KANA.test(first?.message ?? ""), `${name} の日本語の誤りの文が日本語でない: ${first?.message}`).toBe(true);
      }
    }
    // 輪の次の手順への線は受ける。最後の手順から最初の手順への線も次の手順への線
    for (const line of ["  a -> b [tag: x]", "  b -> c", "  d -> a [tag: x]"]) {
      const read = parse([...head, line].join("\n"));
      expect(read.ok, `輪の次の手順への線 ${line.trim()} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
    // 手順が 2 つの輪では、どちらの向きの線も次の手順への線
    for (const line of ["  a -> b", "  b -> a"]) {
      const read = parse(["cycle two", "box a", "box b", "step go", "  say go.", line].join("\n"));
      expect(read.ok, `手順が 2 つの輪の ${line.trim()} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("cycle-rejects-too-few-or-too-many-steps", () => {
    const parse = api("parseNotation");
    const text = (n: number): string => ["cycle small", ...Array.from({ length: n }, (_, i) => `box s${i + 1}`), "step go", "  say go."].join("\n");
    for (const n of [0, 1, 9, 12]) {
      for (const lang of ["ja", "en"] as const) {
        const read = parse(text(n), { lang });
        expect(read.ok, `手順が ${n} つの回り続ける図が読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `手順が ${n} つの回り続ける図の誤りの行 (${lang}): ${first?.message}`).toBe(1);
        const message = first?.message ?? "";
        expect(message.includes("2") && message.includes("8"), `手順が ${n} つの回り続ける図の誤りの文が 2 から 8 の数を示さない (${lang}): ${message}`).toBe(true);
        if (lang === "en") expect(KANA.test(message), `手順が ${n} つの英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
      }
    }
    for (const n of [2, 8]) {
      const read = parse(text(n));
      expect(read.ok, `手順が ${n} つの回り続ける図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("notation-keeps-cycle-words-plain-outside-cycle", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [`${kind} 回る語の名札`, "box cycle as 輪", "box db", "step 送る", "  say 送る。", "  cycle -> db: 送る", "  db -> cycle: 戻す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind} で cycle を名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["cycle", "db"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の cycle から出る線と入る線`).toEqual([
        { type: "edge", from: "cycle", to: "db" },
        { type: "edge", from: "db", to: "cycle" },
      ]);
    }
  });
});

describe("回り続ける図の並べ方と動き (#3623)", () => {
  it("cycle-boxes-go-clockwise-from-top", () => {
    const cases: [string, Json, "ja" | "en"][] = [3, 4, 6, 8].map((n) => [`手順が ${n} つの輪`, parsed(ringText(n)), "ja"]);
    for (const [file, lang] of [
      ["eth-slot.dragon", "ja"],
      ["eth-slot.en.dragon", "en"],
    ] as const) {
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text !== undefined) cases.push([file, parsed(text, lang), lang]);
    }
    for (const [name, diagram, lang] of cases) {
      const source = diagram as unknown as Source;
      const ids = (source.blocks.box ?? []).map((b) => b.id);
      const { layout } = render(diagram, lang);
      const ring = layout.ring as { cx: number; cy: number; r: number };
      expect(layout.boxes.map((b) => b.id), `${name} の輪に置いた手順の順`).toEqual(ids);
      ids.forEach((id, i) => {
        const box = boxOf(layout, id);
        expect(Math.abs(box.cx - (box.x + box.w / 2)) < 0.5 && Math.abs(box.cy - (box.y + box.h / 2)) < 0.5, `${name} の ${id} の真ん中が箱の真ん中でない`).toBe(true);
        expect(Math.abs(Math.hypot(box.cx - ring.cx, box.cy - ring.cy) - ring.r), `${name} の ${id} の真ん中が輪の上に無い`).toBeLessThan(1);
        const want = (Math.PI * 2 * i) / ids.length;
        const got = angleOf(ring, [box.cx, box.cy]);
        expect(Math.min(Math.abs(got - want), Math.PI * 2 - Math.abs(got - want)), `${name} の ${i + 1} つ目の手順 ${id} が真上から右回りに ${i} つ目の所に無い`).toBeLessThan(0.02);
      });
      // 最初の手順は輪の真上
      const first = boxOf(layout, ids[0] as string);
      expect(Math.abs(first.cx - ring.cx) < 0.5 && first.cy < ring.cy, `${name} の最初の手順が輪の真上に無い`).toBe(true);
      // 隣どうしの手順を結ぶ弧は、手順の数だけあり、右回りに次の手順へ向かう
      const arcs = layout.arcs ?? [];
      expect(arcs.map((a) => `${a.from}>${a.to}`), `${name} の弧`).toEqual(ids.map((id, i) => `${id}>${ids[(i + 1) % ids.length]}`));
      for (const arc of arcs) {
        expect(arc.points.length, `${name} の ${arc.from} から ${arc.to} の弧の点`).toBeGreaterThan(2);
        for (const p of arc.points) expect(Math.abs(Math.hypot(p[0] - ring.cx, p[1] - ring.cy) - ring.r), `${name} の ${arc.from} から ${arc.to} の弧が輪の上に無い`).toBeLessThan(1.5);
        const from = angleOf(ring, [boxOf(layout, arc.from).cx, boxOf(layout, arc.from).cy]);
        const span = clockwise(from, angleOf(ring, [boxOf(layout, arc.to).cx, boxOf(layout, arc.to).cy]));
        const steps = arc.points.map((p) => clockwise(from, angleOf(ring, p)));
        expect(steps.every((s, k) => s > 0 && s < span && (k === 0 || s > (steps[k - 1] as number))), `${name} の ${arc.from} から ${arc.to} の弧が右回りに進まない`).toBe(true);
      }
    }
  });

  it("cycle-tag-runs-along-the-arc", () => {
    const sources: [string, Json][] = [["小さな輪", parsed(SMALL)]];
    const eth = fileText("eth-slot.dragon");
    expect(eth, "eth-slot.dragon が packages/dragon/examples に無い").toBeDefined();
    if (eth !== undefined) sources.push(["eth-slot", parsed(eth)]);
    for (const [name, diagram] of sources) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram);
      const { layout, timeline, svg } = rendered;
      const ring = layout.ring as { cx: number; cy: number; r: number };
      const motion = motionFrom(rendered);
      const last = timeline.steps[timeline.steps.length - 1] as Span;
      const edges = edgesOf(source);
      expect(edges.length, `${name} に段の中の線が無い`).toBeGreaterThan(0);
      for (const e of edges) {
        const span = timeline.steps[e.step] as Span;
        const what = `${name} の段 ${e.step + 1} の ${e.from} -> ${e.to}`;
        // 札はその段で走り出し、その段の中で次の手順に着く
        const carrier = timeline.carriers.find((c) => c.step === e.step && c.event === e.event);
        expect(carrier, `${what} の札が走らない`).toBeDefined();
        if (!carrier) continue;
        expect(carrier.depart >= span.start - 1e-9 && carrier.arrive <= span.end + 1e-9 && carrier.arrive > carrier.depart, `${what} の札がその段の間に走らない`).toBe(true);
        expect(carrier.start, `${what} の札が前の段から見えている`).toBeGreaterThanOrEqual(span.start - 1e-9);
        // 札の道は輪の上の弧で、送る側の手順の近くから受ける側の手順の近くへ右回りに進む
        const laid = layout.edges.find((l) => l.step === e.step && l.event === e.event);
        const points = (laid?.points ?? []) as Point[];
        expect(points.length, `${what} の札の道が弧になっていない`).toBeGreaterThan(2);
        for (const p of points) expect(Math.abs(Math.hypot(p[0] - ring.cx, p[1] - ring.cy) - ring.r), `${what} の札の道が輪の上に無い`).toBeLessThan(1.5);
        const from = boxOf(layout, e.from ?? "");
        const to = boxOf(layout, e.to ?? "");
        const a = angleOf(ring, [from.cx, from.cy]);
        const span2 = clockwise(a, angleOf(ring, [to.cx, to.cy]));
        const along = points.map((p) => clockwise(a, angleOf(ring, p)));
        expect(along.every((s, k) => s > 0 && s < span2 && (k === 0 || s >= (along[k - 1] as number))), `${what} の札の道が右回りに次の手順へ進まない`).toBe(true);
        expect(svg.includes(`>${e.carry?.text ?? ""}</text>`), `${what} の札の字 ${e.carry?.text} が描いた図に無い`).toBe(true);
        // 走った弧はその段から光り、後の段でも光ったまま残る
        const lit = motion.doc.querySelector(`[data-arc="${e.from}>${e.to}"] .dg-cy-lit`);
        expect(lit, `${what} の弧の光る部品 ([data-arc] の .dg-cy-lit) が描いた図に無い`).not.toBeNull();
        if (!lit) continue;
        const ran = edges.filter((x) => x.from === e.from && x.to === e.to);
        if (ran[0] === e && e.step > 0) expect(motion.opacity(lit, span.start - 0.05), `${what} の弧が走る前の段から光る`).toBeLessThan(0.1);
        expect(motion.opacity(lit, span.end - 0.05), `${what} の弧がその段の終わりに光っていない`).toBeGreaterThan(0.9);
        expect(motion.opacity(lit, (last.start + last.end) / 2), `${what} の弧が最後の段で光ったまま残らない`).toBeGreaterThan(0.9);
      }
    }
  });

  it("cycle-centre-shows-strip-values", () => {
    const sources: [string, Json][] = [["小さな輪", parsed(SMALL)]];
    const eth = fileText("eth-slot.dragon");
    expect(eth, "eth-slot.dragon が packages/dragon/examples に無い").toBeDefined();
    if (eth !== undefined) sources.push(["eth-slot", parsed(eth)]);
    for (const [name, diagram] of sources) {
      const source = diagram as unknown as Source;
      const strip = source.blocks.strip;
      expect(strip, `${name} に中身の帯 (strip) が無い`).toBeDefined();
      if (!strip) continue;
      const rendered = render(diagram);
      const { layout, timeline } = rendered;
      const ring = layout.ring as { cx: number; cy: number; r: number };
      // 真ん中に出すので、図の下の帯には置かない
      expect(layout.strip, `${name} の中身の帯が図の下に置かれる`).toBeUndefined();
      const motion = motionFrom(rendered);
      const texts = [...motion.doc.querySelectorAll("text")];
      const inside = (el: Element): boolean => {
        const x = Number(el.getAttribute("x"));
        const y = Number(el.getAttribute("y"));
        return Math.abs(x - ring.cx) < 1 && Math.abs(y - ring.cy) < ring.r / 2;
      };
      const title = texts.find((t) => t.textContent === strip.title);
      expect(title, `${name} の帯の題 ${strip.title} が描いた図に無い`).toBeDefined();
      if (title) expect(inside(title), `${name} の帯の題が輪の真ん中に無い`).toBe(true);
      // 段ごとに、その段までに書いた欄の値だけが輪の真ん中に出る
      const current = new Map<string, string>();
      source.steps.forEach((step, s) => {
        for (const e of step.events) if (e.type === "strip" && e.field && e.value !== undefined) current.set(e.field, e.value);
        const span = timeline.steps[s] as Span;
        const t = span.end - 0.05;
        for (const field of strip.fields) {
          const groups = [...motion.doc.querySelectorAll(`[data-field="${field}"]`)];
          expect(groups.length, `${name} の欄 ${field} の値の部品 ([data-field]) が描いた図に無い`).toBeGreaterThan(0);
          const want = current.get(field);
          const shown = groups.filter((g) => motion.opacity(g, t) > 0.9).map((g) => g.textContent);
          expect(shown, `${name} の段 ${s + 1} の終わりに真ん中に出ている欄 ${field} の値`).toEqual(want === undefined ? [] : [want]);
          for (const g of groups) {
            const text = g.querySelector("text");
            expect(Boolean(text && inside(text)), `${name} の欄 ${field} の値 ${g.textContent} が輪の真ん中に無い`).toBe(true);
          }
        }
      });
    }
  });
});

describe("回り続ける図の軽い入口 (#3623)", () => {
  it("cycle-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(SMALL)};`,
      "out.before = light.kindLoaded('cycle');",
      "await light.loadFor(text);",
      "out.after = light.kindLoaded('cycle');",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.kind = drawn.layout.kind;",
      "  out.arcs = (drawn.svg.match(/data-arc=/g) ?? []).length;",
      "  const full = await import('@cardenelabs/dragon');",
      "  const again = full.parseNotation(text);",
      "  out.same = again.ok && full.renderDiagram(again.diagram).svg === drawn.svg;",
      "}",
      "console.log(JSON.stringify(out));",
    ].join("\n");
    const script = `const light = await import("@cardenelabs/dragon/light");\nconst out = {};\n${code}`;
    let stdout = "";
    let failure = "";
    try {
      stdout = execFileSync(process.execPath, ["--input-type=module", "-e", script], { cwd: PACKAGE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      failure = String((error as { stderr?: string }).stderr ?? error);
    }
    expect(failure, "軽い入口で回り続ける図を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { before?: boolean; after?: boolean; ok?: boolean; errors?: unknown[]; kind?: string; arcs?: number; same?: boolean };
    expect(out.before, "軽い入口が loadFor の前から回り続ける図の描く部品を持つ (最初に読む塊に入っている)").toBe(false);
    expect(out.after, "軽い入口で loadFor を待っても回り続ける図の描く部品を読まない").toBe(true);
    expect(out.ok, `軽い入口で loadFor を待った後に回り続ける図を読めない: ${JSON.stringify(out.errors)}`).toBe(true);
    expect(out.kind, "軽い入口で描いた図の種類").toBe("cycle");
    expect(out.arcs, "軽い入口で描いた回り続ける図の弧の数").toBe(3);
    expect(out.same, "軽い入口と既定の入口で描いた回り続ける図が違う").toBe(true);
  });
});

describe("回り続ける図の書き方の文書 (#3623)", () => {
  it("cycle-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `cycle` と、段の中の札を走らせる線の書き方 */
    const head = /(^|[\s`])cycle [^\s`]/mu;
    const run = /(<[^>]+>|[^\s`]+) -> (<[^>]+>|[^\s`]+) \[tag: [^\]]+\]/u;
    const cycleFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "cycle";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に cycle の行の書き方が無い`).toBe(true);
      expect(run.test(text), `${path} に札を走らせる線 (<名札> -> <名札> [tag: <字>]) の書き方が無い`).toBe(true);
      if (path !== "README.md") expect(cycleFences(text), `${path} に回り続ける図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に回り続ける図が載る
    expect(/^\| Diagram kinds \|.*\bcycle diagram\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に cycle diagram が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"cycle"/u.test(content), "使い方の頁の節に回り続ける図 (cycle) が無い").toBe(true);
    const sections = ["cycle.dragon", "cycle.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の回り続ける図の節の例 (${i === 0 ? "cycle.dragon" : "cycle.en.dragon"}) が回り続ける図として読めない`).toBe("cycle");
    }
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に cycle の行の書き方が無い").toBe(true);
    expect(run.test(page), "使い方の頁に札を走らせる線の書き方が無い").toBe(true);
  });
});

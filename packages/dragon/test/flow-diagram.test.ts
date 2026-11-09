/**
 * 手順の図 (#3561)。
 *
 * 判断のひし形で道が分かれる手順を段で追う図。原本の JSON の `kind` は `flow` で、手順の箱 (`blocks.box`) と判断 (`blocks.choice`) を宣言し、
 * 最初の段より前に書いた線 (`blocks.path`) は今回は通らない道になる。始まりと終わりは線の端の名前 `start` と `finish` で書く。
 * 段で通る本筋の箱と判断は、通る順に上から下へ 1 列に並べ、判断はひし形で描く。本筋に無い箱は、そこへ線を出す最初の判断の右に置き、
 * 判断から本筋でない箱への線は判断の右の角から出る。見た目の元は step 2 で本人が選んだ動く試作の「上から下へ」。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、点線の道と字は SVG で確かめる。
 * 見本の file と手順の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 * 図の種類の数は数えない。ほかの図の種類が後から足されても、手順の図が並ぶことだけを確かめる。
 * 書き出しの検査が字の file を node の Buffer で縮めるので、この file は node の場で回す (jsdom の場では字の file を縮める部品が字の中身を読めない)。
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, patched, pointers, smallArchitecture, smallSequence } from "./diagram-support";
import { captionSteps, exporter, formatOf } from "./export-support";
import { covers, draw, type Layout, type Rect, type Rendered, sampleTimes, type Span, type Timeline } from "./render-support";

/*
 * 字の幅を測る部品と、崩れを数える部品の元の code を、検査の外で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで数秒かかる (#3410)。
 * 崩れを数える部品は元の code の描く所で描くので、全部入りの入口と同じく全ての種類の部品と原本の検査を読むだけで登録する (`kinds/all`)
 */
const [{ textWidth }, { TYPE }, layoutCheck] = await Promise.all([
  import("../src/layout/measure"),
  import("../src/look/values"),
  import("../src/render/layout-check"),
  import("../src/kinds/all"),
]);

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** ログインの判断の 4 段の題 (step 4 で決めた) */
const LOGIN_STEPS = ["入力する", "パスワードを確かめる", "2FAを確かめる", "ログインする"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

interface FlowBox extends Rect {
  id: string;
  name: string;
  cx: number;
  cy: number;
  /** 判断はひし形で描く */
  shape?: string;
  /** 形の内側に動かした中身の真ん中の、箱の左上からの位置 */
  at?: Point;
}

interface FlowPath {
  from: string;
  to: string;
  points: Point[];
  label?: Rect & { text: string };
}

interface FlowEnd {
  kind: "start" | "finish";
  x: number;
  y: number;
  r: number;
}

interface FlowLayout extends Omit<Layout, "boxes"> {
  kind: string;
  boxes: FlowBox[];
  /** 最初の段より前に書いた線のうち、どの段にも出ない線 */
  paths: FlowPath[];
  ends: FlowEnd[];
}

interface FlowRendered extends Omit<Rendered, "layout" | "timeline"> {
  layout: FlowLayout;
  timeline: Timeline;
}

interface SourceEdge {
  type: string;
  from: string;
  to: string;
  label?: string;
}

interface Source {
  kind: string;
  title: string;
  blocks: {
    box?: { id: string; name: string; color?: string }[];
    choice?: { id: string; name: string }[];
    path?: { from: string; to: string; label?: string }[];
  };
  steps: { title: string; body?: string; events: SourceEdge[] }[];
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

/** 描いた図。`width` は描く枠の幅。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en", width?: number): FlowRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { ...(lang ? { lang } : {}), ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "手順の図を描けない").toBe("");
  expect((rendered as unknown as FlowRendered | undefined)?.layout?.kind, "描いた図が手順の図 (flow) でない").toBe("flow");
  return rendered as unknown as FlowRendered;
}

const boxOf = (layout: FlowLayout, id: string): FlowBox => {
  const box = layout.boxes.find((b) => b.id === id);
  expect(box, `${id} の箱が並べた図に無い`).toBeDefined();
  return box as FlowBox;
};

const edgesOf = (d: Source): (SourceEdge & { step: number; event: number })[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e, i) => (e.type === "edge" ? [{ ...e, step: s, event: i }] : [])));

/** 段で初めて辿り着く順の、本筋の箱と判断の名札 */
function mainPath(d: Source): string[] {
  const order: string[] = [];
  for (const edge of edgesOf(d))
    for (const id of [edge.from, edge.to]) if (id !== "start" && id !== "finish" && !order.includes(id)) order.push(id);
  return order;
}

/** 点 `p` がひし形の箱 `b` の内に在るか。縁から `pad` 内側までを内とする */
const inDiamond = ([x, y]: Point, b: FlowBox, pad = 0): boolean => Math.abs(x - b.cx) / (b.w / 2 - pad) + Math.abs(y - b.cy) / (b.h / 2 - pad) <= 1 + 1e-6;

/** 2 つの縦か横の区間が、同じ向きで 1px より近く並んで重なるか */
function overlapping([a1, a2]: [Point, Point], [b1, b2]: [Point, Point]): boolean {
  const vertical = (p: Point, q: Point): boolean => Math.abs(p[0] - q[0]) < 0.5;
  const horizontal = (p: Point, q: Point): boolean => Math.abs(p[1] - q[1]) < 0.5;
  const span = (u: number, v: number): [number, number] => [Math.min(u, v), Math.max(u, v)];
  const meets = ([l1, r1]: [number, number], [l2, r2]: [number, number]): boolean => Math.min(r1, r2) - Math.max(l1, l2) > 1;
  if (vertical(a1, a2) && vertical(b1, b2)) return Math.abs(a1[0] - b1[0]) < 1 && meets(span(a1[1], a2[1]), span(b1[1], b2[1]));
  if (horizontal(a1, a2) && horizontal(b1, b2)) return Math.abs(a1[1] - b1[1]) < 1 && meets(span(a1[0], a2[0]), span(b1[0], b2[0]));
  return false;
}

const segments = (points: Point[]): [Point, Point][] => points.slice(1).map((b, i) => [points[i] as Point, b]);

/** 原本の JSON の、箱と判断と通らない道と段と段ごとの線の数 */
const shape = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  boxes: (d.blocks.box ?? []).length,
  choices: (d.blocks.choice ?? []).length,
  paths: (d.blocks.path ?? []).length,
  steps: d.steps.length,
  lines: d.steps.map((step) => step.events.filter((event) => event.type === "edge").length),
});

const edge = (from: string, to: string, label?: string): Json => ({ type: "edge", from, to, ...(label ? { label } : {}), carry: { kind: "envelope" } });

/** 手順の箱と判断を 1 つずつ持ち、通らない道を 1 本持つ最小の手順の図 */
function smallFlow(): Json {
  return {
    version: 2,
    kind: "flow",
    title: "小さな手順の図",
    blocks: {
      box: [
        { id: "a", name: "受け付ける" },
        { id: "b", name: "通す" },
        { id: "x", name: "断る" },
      ],
      choice: [{ id: "q", name: "正しい？" }],
      path: [{ from: "q", to: "x", label: "いいえ" }],
    },
    steps: [
      { title: "始める", body: "受け付けから始まる。", events: [edge("start", "a"), edge("a", "q", "確かめる")] },
      { title: "通す", body: "正しいので通す。", events: [edge("q", "b", "はい"), edge("b", "finish")] },
    ],
  };
}

/** 版2の原本にした小さな図 */
function v2(d: Json): Json {
  const read = api("readDiagram")(d);
  expect(read.ok, "小さな図を版2の形で読めない").toBe(true);
  return read.ok ? read.diagram : {};
}

/** 版2の小さな状態遷移図 */
function smallState(): Json {
  return {
    version: 2,
    kind: "state",
    title: "小さな状態の図",
    blocks: { box: [{ id: "a", name: "受付" }, { id: "b", name: "完了" }] },
    steps: [{ title: "移る", body: "受付から完了へ移る。", events: [edge("a", "b", "終える")] }],
  };
}

describe("手順の図の原本の JSON (#3561)", () => {
  it("schema-accepts-flow-diagram", () => {
    const validate = api("validateDiagram");
    const checked = validate(smallFlow());
    expect(checked.ok, `最小の手順の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    // 判断と通らない道を持たない手順の図も通る
    const plain = patched(patched(smallFlow(), ["blocks", "choice"], undefined), ["blocks", "path"], undefined) as { steps: { events: Json[] }[] };
    plain.steps = [{ title: "通す", body: "受け付けて通す。", events: [edge("start", "a"), edge("a", "b"), edge("b", "finish")] }] as never;
    const bare = validate(plain);
    expect(bare.ok, `判断の無い手順の図が検査で落ちる: ${JSON.stringify(bare.ok ? [] : bare.errors)}`).toBe(true);
  });

  it("schema-rejects-misplaced-flow-fields", () => {
    const validate = api("validateDiagram");
    // 誤りの欄を書かない手順の図は通る。手順の図を読めない間は、下の手順の図の欄の誤りもここで落ちる
    expect(validate(smallFlow()), "最小の手順の図").toEqual({ ok: true });
    const choice: Json = [{ id: "q", name: "正しい？" }];
    const cases: [string, Json, string, boolean][] = [
      ["時系列図に判断の欄", patched(v2(smallSequence()), ["blocks", "choice"], choice), "/blocks/choice", true],
      ["構成図に判断の欄", patched(v2(smallArchitecture()), ["blocks", "choice"], choice), "/blocks/choice", true],
      ["状態遷移図に判断の欄", patched(smallState(), ["blocks", "choice"], choice), "/blocks/choice", true],
      ["手順の図に git の欄", patched(smallFlow(), ["git"], { branches: [{ id: "main" }] }), "/git", false],
      ["手順の図に state の欄", patched(smallFlow(), ["state"], { paths: [{ from: "a", to: "b" }] }), "/state", false],
      ["手順の図に sequence の欄", patched(smallFlow(), ["sequence"], { lifelines: ["a"] }), "/sequence", false],
      ["手順の図に time の欄", patched(smallFlow(), ["time"], { scale: { unit: "slot", length: "12s", count: 4 } }), "/time", false],
      ["手順の図に枝の欄", patched(smallFlow(), ["blocks", "branch"], [{ id: "main" }]), "/blocks/branch", false],
      ["手順の図に目盛りの欄", patched(smallFlow(), ["blocks", "scale"], { unit: "slot", length: "12s", count: 4 }), "/blocks/scale", false],
    ];
    for (const [name, input, pointer, namesFlow] of cases) {
      const ja = validate(input);
      expect(pointers(ja), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      const messages = en.ok ? [] : en.errors.map((e) => e.message);
      expect(messages.filter((m) => KANA.test(m)), `${name} の英語の誤りの文に仮名か漢字がある`).toEqual([]);
      // 判断の欄は手順の図だけが書けることを、手順の図の頭の語を名指して示す
      if (namesFlow) {
        const at = en.ok ? [] : en.errors.filter((e) => e.pointer === pointer).map((e) => e.message);
        expect(at.some((m) => m.includes("flow")), `${name} の誤りの文が手順の図 (flow) を名指さない: ${at.join(" / ")}`).toBe(true);
      }
    }
  });
});

describe("手順の図の記法 (#3561)", () => {
  it("notation-compiles-flow-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const name of ["login-check", "login-check.en"]) {
      const text = fileText(`${name}.dragon`);
      expect(text, `${name}.dragon が packages/dragon/examples に無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: name.endsWith(".en") ? "en" : "ja" });
      expect(parsed.ok, `${name}.dragon が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      expect(parsed.ok ? parsed.diagram : undefined, `${name}.dragon から作った JSON が ${name}.json と違う`).toEqual(exampleJson(`${name}.json`));
    }
    // 判断の行は判断の欄に、最初の段より前の線は通らない道の欄に入る
    const small = parse(
      [
        "flow 小さな手順",
        "box a as 受け付ける",
        "choice q as 正しい？",
        "box b as 通す",
        "box x as 断る",
        "q -> x: いいえ",
        "step 確かめる",
        "  say 確かめる。",
        "  start -> a",
        "  a -> q",
        "  q -> b: はい",
        "  b -> finish",
      ].join("\n"),
    );
    expect(small.ok, `小さな手順の図が読めない: ${small.ok ? "" : JSON.stringify(small.errors)}`).toBe(true);
    const blocks = small.ok ? (small.diagram as unknown as Source).blocks : {};
    expect(blocks.box, "box の行が宣言する箱").toEqual([
      { id: "a", name: "受け付ける" },
      { id: "b", name: "通す" },
      { id: "x", name: "断る" },
    ]);
    expect(blocks.choice, "choice の行が宣言する判断").toEqual([{ id: "q", name: "正しい？" }]);
    expect(blocks.path, "最初の段より前の線").toEqual([{ from: "q", to: "x", label: "いいえ" }]);
  });

  it("notation-rejects-misused-flow-lines", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札は英字にする
    const head = ["flow small", "box input", "choice pw as Correct?", "box done", "box err"];
    const before = ["pw -> err: no"];
    const step = ["step go", "  say go.", "  start -> input", "  input -> pw: send", "  pw -> done: yes"];
    const at = (line: string, token: string, from = 0): number => line.indexOf(token, from);
    const n = head.length;
    const cases: [string, string[], number, number][] = [
      ["宣言していない箱への線", [...head, ...before, ...step, "  done -> zz"], n + 1 + step.length, at("  done -> zz", "zz")],
      ["同じ名札を 2 度宣言した判断", [...head, "choice input as Again?", ...before, ...step], n, at("choice input as Again?", "input")],
      ["同じ名札を 2 度宣言した箱", [...head, "box pw", ...before, ...step], n, at("box pw", "pw")],
      ["名前の無い線を持つ判断", [...head, "pw -> err", ...step], n, 0],
      ["段の中の名前の無い判断の線", [...head, ...before, "step go", "  say go.", "  start -> input", "  input -> pw: send", "  pw -> done"], n + 5, 2],
      ["3 本の線を出す判断", [...head, "box more", ...before, ...step, "  pw -> more: maybe"], n + 2 + step.length, 2],
      ["本筋で前に置いた箱へ戻る線", [...head, ...before, ...step, "  done -> input: again"], n + 1 + step.length, at("  done -> input: again", "input")],
      ["本筋の判断から前の箱へ戻る線", [...head, "pw -> input: retry", ...step], n, at("pw -> input: retry", "input")],
      ["同じ箱へ戻る線", [...head, ...before, ...step, "  done -> done: again"], n + 1 + step.length, at("  done -> done: again", "done", 4)],
      ["group の行", ["flow small", "group g", "  box input", "end", "step go", "  say go.", "  start -> input"], 1, 0],
      ["scale の行", [...head, "scale slot 12s 4", ...before, ...step], n, 0],
      ["row の行", [...head, "row r", ...before, ...step], n, 0],
      ["箱も判断も無い図", ["flow small", "step go", "  say go.", "  start -> finish"], 0, 0],
    ];
    for (const [name, lines, row, column] of cases) {
      const want = { line: row + 1, column: column + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang}): ${first?.message}`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-limits-flow-lines-to-flow", () => {
    const parse = api("parseNotation");
    const heads: [string, string[]][] = [
      ["時系列図", ["sequence 判断の行", "box a", "step 送る", "  say 送る。"]],
      ["構成図", ["architecture 判断の行", "box a", "step 送る", "  say 送る。"]],
      ["状態遷移図", ["state 判断の行", "box a", "step 送る", "  say 送る。"]],
      ["枝分かれの図", ["git 判断の行", "branch main", "step 積む", "  say 積む。"]],
      ["時間軸の図", ["time 判断の行", "scale slot 12s 4", "row a", "step 進む", "  say 進む。"]],
      ["木の図", ["tree 判断の行", "step 葉", "  say 葉。", "  leaf x1"]],
      ["列の図", ["lineup 判断の行", "box a", "item x", "step 並べる", "  say 並べる。"]],
    ];
    for (const [name, head] of heads) {
      // 宣言の行として、最初の段より前に書く
      const lines = [head[0] as string, "choice q as 正しい？", ...head.slice(1)];
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first?.line, `${name} の choice の行が 2 行目の誤りにならない (${lang})`).toBe(2);
        expect(first?.message ?? "", `${name} の choice の行の誤りの文が手順の図 (flow) を名指さない (${lang})`).toContain("flow");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の choice の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-keeps-flow-words-plain-outside-flow", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [
        `${kind} 手順の語の名札`,
        "box flow as 流れ",
        "box choice as 選ぶ",
        "box db",
        "step 送る",
        "  say 送る。",
        "  choice -> db: 送る",
        "  flow -> choice: 戻す",
      ].join("\n");
      const parsed = parse(text);
      expect(parsed.ok, `${kind} で flow と choice を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["flow", "choice", "db"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の choice と flow から出る線`).toEqual([
        { type: "edge", from: "choice", to: "db" },
        { type: "edge", from: "flow", to: "choice" },
      ]);
    }
  });

  it("flow-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of ["login-check.dragon", "login-check.en.dragon"]) {
      const text = fileText(name);
      expect(text, `${name} が無い`).toBeDefined();
      const first = parse(text ?? "");
      expect(first.ok, `${name} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed);
      expect(second.ok, `${name} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
      expect(second.ok ? second.diagram : undefined, `${name} を往復した JSON が最初と違う`).toEqual(first.diagram);
      // 原本の JSON から書き戻しても、同じ原本に戻る
      const fromJson = parse(print(exampleJson(name.replace(/\.dragon$/u, ".json"))));
      expect(fromJson.ok ? fromJson.diagram : fromJson.errors, `${name} の JSON を書き戻して読んだ JSON が最初と違う`).toEqual(first.diagram);
    }
    // 小さな手順の図も往復する
    const source = smallFlow();
    const again = parse(print(source));
    expect(again.ok ? again.diagram : again.errors, "小さな手順の図を往復した JSON が最初と違う").toEqual(source);
  });
});

describe("手順の図の並べ方 (#3561)", () => {
  it("flow-places-main-path-top-to-bottom", () => {
    const source = exampleJson("login-check.json") as unknown as Source;
    for (const lang of ["ja", "en"] as const) {
      const json = lang === "ja" ? source : (exampleJson("login-check.en.json") as unknown as Source);
      const { layout, svg } = render(json as unknown as Json, lang);
      const main = mainPath(json).map((id) => boxOf(layout, id));
      expect(main.map((b) => b.id), `本筋の箱と判断 (${lang})`).toEqual(["input", "pw", "otp", "done"]);
      // 通る順に上から並び、重ならない
      main.slice(1).forEach((b, i) => {
        const above = main[i] as FlowBox;
        expect(b.y, `${b.id} が ${above.id} の下に無い (${lang})`).toBeGreaterThan(above.y + above.h);
      });
      // 中心の横の位置がそろう
      for (const b of main) expect(Math.abs(b.cx - (main[0] as FlowBox).cx), `${b.id} の中心の横の位置が本筋とそろわない (${lang})`).toBeLessThan(0.5);
      // 判断はひし形で、手順の箱はひし形でない
      const choices = new Set((json.blocks.choice ?? []).map((c) => c.id));
      for (const b of layout.boxes) expect(b.shape === "diamond", `${b.id} の形 (${lang})`).toBe(choices.has(b.id));
      // 問いの字がひし形の内に収まる
      for (const id of choices) {
        const b = boxOf(layout, id);
        const name = b.name;
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&").replaceAll("&", "&amp;");
        const found = new RegExp(`<text class="dg-sn" x="([-\\d.]+)" y="([-\\d.]+)" text-anchor="middle">${escaped}</text>`, "u").exec(svg);
        expect(found, `${name} の問いの字が描いた図に無い (${lang})`).not.toBeNull();
        const x = Number(found?.[1]);
        const y = Number(found?.[2]);
        const w = textWidth(name, TYPE.boxName);
        const size = TYPE.boxName.size;
        const corners: Point[] = [
          [x - w / 2, y - size * 0.8],
          [x + w / 2, y - size * 0.8],
          [x - w / 2, y + size * 0.2],
          [x + w / 2, y + size * 0.2],
        ];
        for (const corner of corners) expect(inDiamond(corner, b), `${name} の問いの字の角 ${corner.join(",")} がひし形の外に出る (${lang})`).toBe(true);
      }
    }
  });

  it("flow-side-paths-leave-choice-to-the-right", () => {
    for (const [file, lang] of [
      ["login-check.json", "ja"],
      ["login-check.en.json", "en"],
    ] as const) {
      const { layout } = render(exampleJson(file), lang);
      const pw = boxOf(layout, "pw");
      const otp = boxOf(layout, "otp");
      const err = boxOf(layout, "err");
      // 本筋に無い箱は、そこへ線を出す最初の判断 (pw) の右に置く
      expect(err.x, `本筋に無い「エラーを出す」の箱が最初の判断の右に無い (${lang})`).toBeGreaterThan(pw.x + pw.w);
      const into = layout.paths.filter((p) => p.to === "err");
      expect(into.map((p) => p.from).sort(), `「エラーを出す」へ入る通らない道 (${lang})`).toEqual(["otp", "pw"]);
      for (const p of into) {
        const choice = p.from === "pw" ? pw : otp;
        const [x, y] = p.points[0] as Point;
        // 判断から本筋でない箱への線は判断の右の角から出る
        expect(Math.hypot(x - (choice.x + choice.w), y - choice.cy), `${p.from} から「エラーを出す」への線が判断の右の角から出ない (${lang})`).toBeLessThan(1);
        const [ex, ey] = p.points.at(-1) as Point;
        expect(ex >= err.x - 8 && ex <= err.x + err.w + 8 && ey >= err.y - 8 && ey <= err.y + err.h + 8, `${p.from} からの線が「エラーを出す」の箱で終わらない (${lang})`).toBe(true);
      }
      // 2 つの判断の線が同じ箱へ集まっても、線どうしが重ならない
      const [a, b] = into as [FlowPath, FlowPath];
      for (const s of segments(a.points)) for (const t of segments(b.points)) expect(overlapping(s, t), `2 本の「いいえ」の線が重なる (${lang}): ${JSON.stringify([s, t])}`).toBe(false);
    }
  });

  it("flow-dotted-lines-and-marker", () => {
    const source = exampleJson("login-check.json") as unknown as Source;
    const { layout, timeline, svg } = render(source as unknown as Json);
    // 最初の段より前に書いた線は点線の道になり、最初の段から図に在る
    const before = (source.blocks.path ?? []).map((p) => `${p.from}->${p.to}`).sort();
    expect(before.length, "ログインの判断の図に最初の段より前の線が無い").toBeGreaterThan(0);
    expect(layout.paths.map((p) => `${p.from}->${p.to}`).sort(), "点線で描く道が、最初の段より前に書いた線と違う").toEqual(before);
    const drawn = [...svg.matchAll(/<g data-path="([^"]+)"[^>]*><path class="dg-path"/gu)].map((m) => (m[1] ?? "").replaceAll("&gt;", ">"));
    expect(drawn.sort(), "点線の道の部品 (data-path) が通らない道の数だけ無い").toEqual(before);
    expect(/data-path="[^"]*"[^>]*class="dg-a"/u.test(svg), "点線の道が段で現れる動きを持つ (最初の段から在るはず)").toBe(false);
    // 段の中の線はその段で引かれ、段の印 (運ぶ物) がその線に沿って進む
    for (const e of edgesOf(source)) {
      const span = timeline.steps[e.step] as Span;
      const time = timeline.edges.find((t) => t.step === e.step && t.event === e.event);
      expect(Boolean(time && time.start >= span.start - 1e-9 && time.drawn <= span.end + 1e-9), `段 ${e.step + 1} の ${e.from} -> ${e.to} がその段の間に引かれない`).toBe(true);
      const carrier = timeline.carriers.find((c) => c.step === e.step && c.event === e.event);
      expect(carrier, `段 ${e.step + 1} の ${e.from} -> ${e.to} の上を印が進まない`).toBeDefined();
      if (!carrier) continue;
      expect(carrier.depart >= span.start - 1e-9 && carrier.arrive <= span.end + 1e-9 && carrier.arrive > carrier.depart, `段 ${e.step + 1} の印が段の間に線を進まない`).toBe(true);
      const laid = layout.edges.find((l) => l.step === e.step && l.event === e.event);
      expect((laid?.points.length ?? 0) >= 2, `段 ${e.step + 1} の ${e.from} -> ${e.to} の線の道が無い`).toBe(true);
    }
    // 通らない道の上は印が進まない
    expect(timeline.carriers.length, "印が段の中の線の数だけ進まない").toBe(edgesOf(source).length);
  });
});

describe("ログインの判断の見本 (#3561)", () => {
  it("login-check-renders-4-steps", () => {
    const source = exampleJson("login-check.json") as unknown as Source;
    expect(source.steps.map((s) => s.title), "ログインの判断の図の段の題").toEqual([...LOGIN_STEPS]);
    const { layout, timeline } = render(source as unknown as Json, "ja");
    expect(timeline.steps, "時刻の表の段の数").toHaveLength(4);
    timeline.steps.forEach((step, i) => {
      expect(step.end, `段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
      if (i > 0) expect(step.start, `段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
    });
    // 段ごとに印が進む先。段 4 は「ログイン」を通って終わりへ進む
    const walked = source.steps.map((step) => step.events.filter((e) => e.type === "edge").map((e) => `${e.from}->${e.to}`));
    expect(walked, "段ごとの線").toEqual([["start->input"], ["input->pw"], ["pw->otp"], ["otp->done", "done->finish"]]);
    const start = layout.ends.find((e) => e.kind === "start");
    const finish = layout.ends.find((e) => e.kind === "finish");
    expect(start && finish, "始まりと終わりの印").toBeTruthy();
    const near = (p: Point | undefined, end: FlowEnd | undefined): boolean => p !== undefined && end !== undefined && Math.hypot(p[0] - end.x, p[1] - end.y) <= end.r + 6;
    for (const e of edgesOf(source)) {
      const laid = layout.edges.find((l) => l.step === e.step && l.event === e.event);
      const points = (laid?.points ?? []) as Point[];
      if (e.from === "start") expect(near(points[0], start), "段 1 の印が始まりの印から出ない").toBe(true);
      if (e.to === "finish") expect(near(points.at(-1), finish), "段 4 の印が終わりの印へ入らない").toBe(true);
      if (e.to !== "finish") {
        const target = boxOf(layout, e.to);
        const [x, y] = points.at(-1) ?? [Number.NaN, Number.NaN];
        expect(x >= target.x - 8 && x <= target.x + target.w + 8 && y >= target.y - 8 && y <= target.y + target.h + 8, `段 ${e.step + 1} の印が ${target.name} へ着かない`).toBe(true);
      }
      const carrier = timeline.carriers.find((c) => c.step === e.step && c.event === e.event);
      const span = timeline.steps[e.step] as Span;
      expect(Boolean(carrier && covers(span, carrier.depart)), `段 ${e.step + 1} の ${e.from} -> ${e.to} の印がその段で進まない`).toBe(true);
    }
  });

  it("flow-keeps-motion-rules", () => {
    const { timeline } = render(exampleJson("login-check.json"));
    const times = sampleTimes(timeline);
    expect(times.length, "ログインの判断の図を 0.25 秒ごとに数えた時刻").toBeGreaterThan(0);
    expect(timeline.badges.map((b) => b.step), "ログインの判断の図の段の番号").toEqual(timeline.steps.map((_, i) => i));
    for (const t of times) {
      const early = timeline.badges.filter((b) => b.appears <= t && (timeline.steps[b.step]?.start ?? Number.POSITIVE_INFINITY) > t).map((b) => b.step + 1);
      expect(early, `ログインの判断の図の ${t} 秒に、始まっていない段の番号が出る`).toEqual([]);
    }
  });

  it("flow-examples-pass-layout-check", () => {
    for (const [file, lang] of [
      ["login-check.json", "ja"],
      ["login-check.en.json", "en"],
    ] as const) {
      const diagram = exampleJson(file);
      // 枠の幅を渡さない時と携帯の幅 (390) の両方で描き、どの段の止め絵でも崩れを数える
      const breaks = layoutCheck.diagramBreaks(diagram as never, lang);
      expect(breaks.map((b) => layoutCheck.describeBreak(b, lang)), `${file} の崩れ`).toEqual([]);
    }
  });

  it("flow-example-files-match", () => {
    const parse = api("parseNotation");
    for (const file of ["login-check.dragon", "login-check.en.dragon", "login-check.json", "login-check.en.json"])
      expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
    const ja = parse(fileText("login-check.dragon") ?? "", { lang: "ja" });
    const en = parse(fileText("login-check.en.dragon") ?? "", { lang: "en" });
    expect(ja.ok && en.ok, `ログインの判断の見本の記法が読めない: ${JSON.stringify([ja.ok || ja.errors, en.ok || en.errors])}`).toBe(true);
    if (!ja.ok || !en.ok) return;
    expect((ja.diagram as unknown as Source).kind, "ログインの判断の見本の図の種類").toBe("flow");
    expect(shape(en.diagram as unknown as Source), "英語版の箱と判断と線と段の数が日本語版と違う").toEqual(shape(ja.diagram as unknown as Source));
  });
});

/**
 * 書き出しの件は 1 件の上限 (10 秒) に収めるため、形式ごとに分ける (#3410)。
 * 書き出す部品は検査の外 (この file を読む段) で先に読む。最初の件が読むと、混んだ機械で読むだけで上限に近づく
 */
const exportDiagram = await exporter();

describe("手順の図の書き出し (#3561)", () => {
  const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-flow-"));
  /** 動画と PNG で撮る図。コマの数とバイトの一致を比べるだけなので最初の段だけを撮る。4 段を 2 回撮ると、混んだ機械で上限を超えた */
  const firstStep = (): Json => {
    const login = exampleJson("login-check.json") as { steps: Json[] };
    return { ...login, steps: login.steps.slice(0, 1) };
  };

  it("flow-exports-every-format", async () => {
    const result = await exportDiagram(firstStep(), { outDir: scratch(), formats: ["mp4", "gif"], fps: 1, gifFps: 0.5 });
    for (const format of ["mp4", "gif"] as const) expect(formatOf(readFileSync(result.files[format] ?? "")), `手順の図の ${format} の書き出し`).toBe(format);
  });

  it("flow-exports-every-format", async () => {
    const shots: Buffer[] = [];
    for (const k of [0, 1]) {
      const result = await exportDiagram(firstStep(), { outDir: join(scratch(), `run-${k}`), formats: ["png"] });
      expect(result.files.png, "手順の図の PNG を書き出していない").toBeDefined();
      shots.push(readFileSync(result.files.png ?? ""));
    }
    expect(formatOf(shots[0] as Buffer), "手順の図の png の書き出し").toBe("png");
    expect((shots[0] as Buffer).equals(shots[1] as Buffer), "同じ手順の図を 2 回書き出した PNG がバイト単位で一致しない").toBe(true);
  });

  it("flow-exports-every-format", async () => {
    const result = await exportDiagram(exampleJson("login-check.json"), { outDir: scratch(), formats: ["html"] });
    const html = readFileSync(result.files.html ?? "", "utf8");
    expect(formatOf(Buffer.from(html)), "手順の図の html の書き出し").toBe("html");
    // 書き出した HTML で全ての段を送れる
    const steps = await captionSteps(html, 1280);
    expect(steps.map((s) => s.step), "書き出した HTML で送れた段").toEqual(LOGIN_STEPS.map((_, i) => `0${i + 1}/04`));
  });
});

describe("手順の図の書き方の文書 (#3561)", () => {
  it("docs-describe-flow-diagram", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `flow` と、`choice <名札> as <問い>` の行の形 */
    const forms: [string, RegExp][] = [
      ["flow", /(^|[\s`])flow [^\s`]/mu],
      ["choice", /(^|[\s`])choice (<[^>]+>|[^\s:`]+) as [^\s`]/mu],
    ];
    const flowFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as unknown as Source).kind === "flow";
      }).length;
    /** README は英語で書き、手引きは日本語と英語の 2 つを持つ */
    const dotted = (path: string, text: string): void => {
      const ja = path === "packages/dragon/examples/quick-start.md";
      expect(ja ? text.includes("点線") : /dotted/iu.test(text), `${path} に最初の段より前の線が点線になることが無い`).toBe(true);
    };
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      for (const [word, form] of forms) expect(form.test(text), `${path} に ${word} の行の書き方が無い`).toBe(true);
      dotted(path, text);
      if (path !== "README.md") expect(flowFences(text), `${path} に手順の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"flow"/u.test(content), "使い方の頁の節に手順の図 (flow) が無い").toBe(true);
    const sections = ["flow.dragon", "flow.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const parsed = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(parsed.ok && (parsed.diagram as unknown as Source).kind, `使い方の頁の手順の図の節の例 (${i === 0 ? "flow.dragon" : "flow.en.dragon"}) が手順の図として読めない`).toBe("flow");
    }
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    for (const [word, form] of forms) expect(form.test(page), `使い方の頁に ${word} の行の書き方が無い`).toBe(true);
    expect(page.includes("点線") && /dotted/iu.test(page), "使い方の頁に最初の段より前の線が点線になることが無い").toBe(true);
    // 変更の一覧の Unreleased の Added に手順の図が載る
    const unreleased = (path: string): string => {
      const part = repoText(path).split(/^## \[/mu).find((p) => p.startsWith("Unreleased]")) ?? "";
      return part.split(/^### /mu).find((p) => p.startsWith("Added")) ?? "";
    };
    expect(unreleased("CHANGELOG.md").includes("`flow`") && unreleased("CHANGELOG.md").includes("`choice"), "CHANGELOG.md の Unreleased の Added に手順の図 (flow と choice) が無い").toBe(true);
    expect(unreleased("CHANGELOG.ja.md").includes("`flow`") && unreleased("CHANGELOG.ja.md").includes("手順の図"), "CHANGELOG.ja.md の Unreleased の Added に手順の図が無い").toBe(true);
    // 前提が手順の図を描ける図の種類に数える
    const kinds = repoText(".ikkan/premises/product.md").split("\n").find((line) => line.startsWith("- 描ける図の種類は")) ?? "";
    expect(kinds.includes("手順の図 (`flow`"), "前提 (product.md) の描ける図の種類に手順の図 (flow) が無い").toBe(true);
  });
});

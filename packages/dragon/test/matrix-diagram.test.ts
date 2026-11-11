// @vitest-environment jsdom
/**
 * 2つの軸で置く図 (#3622)。
 *
 * 横と縦の 2 つの軸で 4 つの区画に分け、段ごとに課題の札を区画へ置く図。原本の JSON の `kind` は `matrix` で、
 * 段より前の `axis <名前> [from: <小さい側>, to: <大きい側>]` を横、縦の順に 2 行書き、`box` を書いた順に左上、右上、左下、右下の区画にする。
 * 課題は `item <名札> as <名前>` で宣言し、まだ区画に置いていない課題は区画の左の置く前の一覧に書いた順に並ぶ。
 * 段の中の `line <区画>: <課題>` (列の図と同じ形) を書いた段で、課題の札が置く前の一覧から区画へ動き、その区画が光る。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (矢印の軸で 4 つの区画に分け、左に並べた札を段ごとに区画へ動かす)。
 *
 * 置き場所 (`layout`) は描く部品が返す値で確かめ、札の動きと区画の光り方は SVG の keyframes を jsdom で読んで確かめる。
 * 区画の部品は `data-matrix-area="<名札>"`、区画を光らせる部品は `data-matrix-glow="<名札>"`、課題の札は `data-matrix-item="<名札>"`、
 * 軸は `data-matrix-axis="x"` と `data-matrix-axis="y"`、軸の矢印の先は `data-matrix-arrow`、置く前の一覧は `data-matrix-list` を持つ。
 * 見本の file と 2つの軸で置く図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Layout, type Rect, type Rendered, type Span } from "./render-support";

const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages/dragon");
const EXAMPLES = join(PACKAGE, "examples");

/** 2つの軸で置く図の見本 4 枚 (#3622 の「決まっていること」) */
const MATRIX_EXAMPLES = ["task-priority", "risk-matrix", "token-listing", "chain-choice"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

/** 並べた区画。`spot` は区画の場所で、左上が 0、右上が 1、左下が 2、右下が 3 */
interface MatrixArea extends Rect {
  id: string;
  name: string;
  spot: number;
}

/** 並べた軸。`dir` は横 (`x`) か縦 (`y`)。`line` は小さい側の端から大きい側の矢印の先まで */
interface MatrixAxis {
  dir: "x" | "y";
  name: string;
  from?: string;
  to?: string;
  line: [Point, Point];
}

/** 課題の札。四角は置く前の一覧の席 */
interface MatrixCard extends Rect {
  id: string;
  name: string;
}

interface MatrixLayout extends Omit<Layout, "boxes"> {
  kind: string;
  areas?: MatrixArea[];
  axes?: MatrixAxis[];
  list?: Rect;
  cards?: MatrixCard[];
}

interface MatrixRendered extends Omit<Rendered, "layout"> {
  layout: MatrixLayout;
}

interface SourceEvent {
  type: string;
  box?: string;
  items?: string[];
}

interface Source {
  kind: string;
  title: string;
  matrix?: { axes: { name: string; from?: string; to?: string }[]; items: { id: string; name: string }[] };
  blocks: { box?: { id: string; name: string }[] };
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
  expect(read.ok, `2つの軸で置く図の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): MatrixRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "2つの軸で置く図を描けない").toBe("");
  const layout = (rendered as unknown as MatrixRendered | undefined)?.layout;
  expect(layout?.kind, "描いた図が 2つの軸で置く図 (matrix) でない").toBe("matrix");
  expect(layout?.areas, "並べた図に区画の並び (layout.areas) が無い").toBeDefined();
  expect(layout?.axes, "並べた図に軸の並び (layout.axes) が無い").toBeDefined();
  expect(layout?.cards, "並べた図に課題の札の並び (layout.cards) が無い").toBeDefined();
  expect(layout?.list, "並べた図に置く前の一覧 (layout.list) が無い").toBeDefined();
  return rendered as unknown as MatrixRendered;
}

/** 仕事を手間と効き目で分ける、書き戻した形の小さな記法。軸 2 つ、区画 4 つ、課題 5 つ */
const SMALL = [
  "matrix 仕事を手間と効き目で分ける",
  "",
  "axis 手間 [from: 小さい, to: 大きい]",
  "axis 効き目 [from: 小さい, to: 大きい]",
  "",
  "box now as 今やる",
  "box plan as 計画する",
  "box spare as 手が空いたら",
  "box drop as やらない",
  "",
  "item login as ログインを速く",
  "item pay as 決済を足す",
  "item word as 文言の直し",
  "item docs as 手引きを足す",
  "item old as 古い画面を作り直す",
  "",
  "step 並べる",
  "  say 置く前の課題を左に並べる。",
  "",
  "step 今やる",
  "  say 手間が小さく効き目の大きい課題は今やる。",
  "  line now: login",
  "",
  "step 計画する",
  "  say 効き目は大きいが手間も大きい課題は計画する。",
  "  line plan: pay",
  "",
  "step 残りを分ける",
  "  say 効き目の小さい課題は手間で分ける。",
  "  line spare: word, docs",
  "  line drop: old",
  "",
].join("\n");

/** SMALL と同じ図の原本 (版2) */
function smallMatrix(): Json {
  const line = (box: string, ...items: string[]): Json => ({ type: "line", box, items });
  return {
    version: 2,
    kind: "matrix",
    title: "仕事を手間と効き目で分ける",
    matrix: {
      axes: [
        { name: "手間", from: "小さい", to: "大きい" },
        { name: "効き目", from: "小さい", to: "大きい" },
      ],
      items: [
        { id: "login", name: "ログインを速く" },
        { id: "pay", name: "決済を足す" },
        { id: "word", name: "文言の直し" },
        { id: "docs", name: "手引きを足す" },
        { id: "old", name: "古い画面を作り直す" },
      ],
    },
    blocks: {
      box: [
        { id: "now", name: "今やる" },
        { id: "plan", name: "計画する" },
        { id: "spare", name: "手が空いたら" },
        { id: "drop", name: "やらない" },
      ],
    },
    steps: [
      { title: "並べる", body: "置く前の課題を左に並べる。", events: [] },
      { title: "今やる", body: "手間が小さく効き目の大きい課題は今やる。", events: [line("now", "login")] },
      { title: "計画する", body: "効き目は大きいが手間も大きい課題は計画する。", events: [line("plan", "pay")] },
      { title: "残りを分ける", body: "効き目の小さい課題は手間で分ける。", events: [line("spare", "word", "docs"), line("drop", "old")] },
    ],
  };
}

/** 段ごとの、区画へ置く課題。段の番号と区画と課題 */
const placementsOf = (d: Source): { step: number; area: string; item: string }[] =>
  d.steps.flatMap((step, s) => step.events.flatMap((e) => (e.type === "line" && e.box !== undefined ? (e.items ?? []).map((item) => ({ step: s, area: e.box as string, item })) : [])));

/** 課題の札の部品の、時刻 `t` 秒の四角。札の四角に、動きのずらし (`transform` の translate) を足す */
function cardAt(motion: Motion, id: string, t: number): Rect | undefined {
  const group = motion.doc.querySelector(`[data-matrix-item="${id}"]`);
  const rect = group?.querySelector("rect");
  if (!group || !rect) return undefined;
  const [dx = 0, dy = 0] = motion.value(group, "transform", t) ?? [];
  const n = (name: string): number => Number(rect.getAttribute(name));
  return { x: n("x") + dx, y: n("y") + dy, w: n("width"), h: n("height") };
}

/** `inner` が `outer` の中に在るか (縁の 0.5 の食い違いまで許す) */
const inside = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.w <= outer.x + outer.w + 0.5 && inner.y + inner.h <= outer.y + outer.h + 0.5;

/** 2 つの四角が離れているか */
const apart = (a: Rect, b: Rect): boolean => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;

/** 部品の中の、字が `text` の `text` の部品 */
const textIn = (el: Element | null, text: string): Element | undefined => [...(el?.querySelectorAll("text") ?? [])].find((t) => t.textContent === text);

/** 誤りの行と列と文を確かめる。日本語の文は仮名か漢字を持ち、英語の文は持たない */
function expectRefused(text: string, name: string, want: { line: number; column?: number }): void {
  const parse = api("parseNotation");
  for (const lang of ["ja", "en"] as const) {
    const read = parse(text, { lang });
    expect(read.ok, `${name} を書いた 2つの軸で置く図が読めてしまう (${lang})`).toBe(false);
    const first: LineError | undefined = read.ok ? undefined : read.errors[0];
    const got = first && (want.column === undefined ? { line: first.line } : { line: first.line, column: first.column });
    expect(got, `${name} の誤りの行と列 (${lang}): ${first?.message}`).toEqual(want);
    const message = first?.message ?? "";
    expect(message, `${name} の誤りの文 (${lang})`).not.toBe("");
    if (lang === "en") expect(KANA.test(message), `${name} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
    else expect(KANA.test(message), `${name} の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
  }
}

/** 見本の日本語と英語の記法を読んだ原本。file が無ければ名指して落とす */
function exampleSources(): [string, Json, "ja" | "en"][] {
  const out: [string, Json, "ja" | "en"][] = [];
  for (const key of MATRIX_EXAMPLES)
    for (const [file, lang] of [
      [`${key}.dragon`, "ja"],
      [`${key}.en.dragon`, "en"],
    ] as const) {
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text !== undefined) out.push([file, parsed(text, lang), lang]);
    }
  return out;
}

describe("2つの軸で置く図の原本の JSON (#3622)", () => {
  it("schema-accepts-matrix-diagram", () => {
    const validate = api("validateDiagram");
    for (const lang of ["ja", "en"] as const) {
      const checked = validate(smallMatrix(), { lang });
      expect(checked.ok, `小さな 2つの軸で置く図が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
    // 軸と課題の欄 (matrix) はほかの種類の図には書けない
    const architecture = { version: 2, kind: "architecture", title: "構成", matrix: (smallMatrix() as { matrix: Json }).matrix, blocks: { box: [{ id: "a", name: "A" }] }, steps: [{ title: "見る", body: "見る。", events: [] }] };
    expect(validate(architecture).ok, "構成図に軸と課題の欄 (matrix) を書いた原本が検査を通る").toBe(false);
    // 2つの軸で置く図は区画をちょうど 4 つ持つ
    const three = smallMatrix() as { blocks: { box: Json[] } };
    three.blocks.box = three.blocks.box.slice(0, 3);
    expect(validate(three).ok, "区画が 3 つの 2つの軸で置く図の原本が検査を通る").toBe(false);
  });
});

describe("2つの軸で置く図の記法 (#3622)", () => {
  it("matrix-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(SMALL)), "小さな 2つの軸で置く図を読んで書き戻した記法が元と違う").toBe(SMALL);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(SMALL), "小さな 2つの軸で置く図の記法から作った原本").toEqual(smallMatrix());
    // 両端を書かない軸と、`as <名前>` を省いた区画と課題は、書き戻すとそのまま戻る
    const bare = [
      "matrix 端を省く",
      "",
      "axis 横",
      "axis 縦",
      "",
      "box 左上",
      "box 右上",
      "box 左下",
      "box 右下",
      "",
      "item 課題",
      "",
      "step 置く",
      "  say 名札だけで置く。",
      "  line 左上: 課題",
      "",
    ].join("\n");
    expect(print(parsed(bare)), "端と名前を省いた 2つの軸で置く図を読んで書き戻した記法が元と違う").toBe(bare);
    for (const key of MATRIX_EXAMPLES) {
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const diagram = parsed(text, lang);
        expect((diagram as unknown as Source).kind, `${file} の図の種類`).toBe("matrix");
        expect(print(diagram), `${file} を読んで書き戻した記法が元 (最初の注釈を除く) と違う`).toBe(withoutComments(text));
      }
    }
  });

  it("matrix-rejects-other-than-four-areas", () => {
    const head = ["matrix 区画の数", "axis 横 [from: 左, to: 右]", "axis 縦 [from: 下, to: 上]", "item a as 課題"];
    const steps = ["step 置く", "  say 置く。", "  line b1: a"];
    const boxes = (n: number): string[] => Array.from({ length: n }, (_, k) => `box b${k + 1} as 区画${k + 1}`);
    // 区画が 4 つの図は読める
    const four = api("parseNotation")([...head, ...boxes(4), ...steps].join("\n"));
    expect(four.ok, `区画が 4 つの 2つの軸で置く図が読めない: ${four.ok ? "" : JSON.stringify(four.errors)}`).toBe(true);
    // 区画が 3 つの図は図の種類の行を指して止め、5 つの図は 5 つ目の区画の行を指して止める
    expectRefused([...head, ...boxes(3), ...steps].join("\n"), "区画が 3 つの図", { line: 1 });
    expectRefused([...head, ...boxes(5), ...steps].join("\n"), "区画が 5 つの図", { line: head.length + 5, column: 1 });
  });

  it("matrix-rejects-other-than-two-axes", () => {
    const boxes = ["box a as 左上", "box b as 右上", "box c as 左下", "box d as 右下", "item x as 課題"];
    const steps = ["step 置く", "  say 置く。", "  line a: x"];
    // 軸が 1 つの図は図の種類の行を指して止め、3 つの図は 3 つ目の軸の行を指して止める
    expectRefused(["matrix 軸の数", "axis 横", ...boxes, ...steps].join("\n"), "軸が 1 つの図", { line: 1 });
    expectRefused(["matrix 軸の数", "axis 横", "axis 縦", "axis 奥", ...boxes, ...steps].join("\n"), "軸が 3 つの図", { line: 4, column: 1 });
    // 軸は段より前に書く
    expectRefused(["matrix 軸の数", "axis 横", "axis 縦", ...boxes, ...steps, "  axis 奥"].join("\n"), "段の中に書いた軸", { line: 12, column: 3 });
  });

  it("matrix-rejects-an-unknown-item-or-area", () => {
    const head = ["matrix 無い物", "axis 横", "axis 縦", "box a as 左上", "box b as 右上", "box c as 左下", "box d as 右下", "item x as 課題", "item y as 課題2", "step 置く", "  say 置く。"];
    const n = head.length;
    // 宣言していない区画と、宣言していない課題は、その名札を指して止める
    const area = "  line nope: x";
    expectRefused([...head, area].join("\n"), "無い区画へ置く行", { line: n + 1, column: area.indexOf("nope") + 1 });
    const item = "  line a: x, nope";
    expectRefused([...head, item].join("\n"), "無い課題を置く行", { line: n + 1, column: item.indexOf("nope") + 1 });
    // 同じ行に同じ課題を 2 度書いた行も、2 つ目の課題を指して止める
    const twice = "  line a: x, x";
    expectRefused([...head, twice].join("\n"), "同じ課題を 2 度置く行", { line: n + 1, column: twice.lastIndexOf("x") + 1 });
    // 宣言した区画と課題を書いた行は読める
    const read = api("parseNotation")([...head, "  line a: x, y"].join("\n"));
    expect(read.ok, `宣言した区画と課題を書いた行が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  });

  it("notation-keeps-matrix-words-plain-outside-matrix", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [`${kind} 軸の語の名札`, "box axis as 軸", "box matrix as 区画", "step 送る", "  say 送る。", "  axis -> matrix: 送る", "  matrix -> axis: 戻す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind} で axis と matrix を名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["axis", "matrix"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の axis から出る線と入る線`).toEqual([
        { type: "edge", from: "axis", to: "matrix" },
        { type: "edge", from: "matrix", to: "axis" },
      ]);
    }
  });
});

describe("2つの軸で置く図の並べ方と動き (#3622)", () => {
  it("matrix-areas-go-left-to-right-top-to-bottom", () => {
    for (const [name, diagram, lang] of [["小さな図", parsed(SMALL), "ja"] as [string, Json, "ja" | "en"], ...exampleSources()]) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const areas = rendered.layout.areas ?? [];
      const boxes = source.blocks.box ?? [];
      // box を書いた順に、左上、右上、左下、右下の区画にする
      expect(areas.map((a) => a.id), `${name} の区画の並び`).toEqual(boxes.map((b) => b.id));
      expect(areas.map((a) => a.spot), `${name} の区画の場所`).toEqual([0, 1, 2, 3]);
      const [tl, tr, bl, br] = areas as [MatrixArea, MatrixArea, MatrixArea, MatrixArea];
      expect(Math.abs(tl.y - tr.y) < 0.5 && Math.abs(bl.y - br.y) < 0.5, `${name} の上の区画どうしと下の区画どうしの高さが揃わない`).toBe(true);
      expect(Math.abs(tl.x - bl.x) < 0.5 && Math.abs(tr.x - br.x) < 0.5, `${name} の左の区画どうしと右の区画どうしの横の所が揃わない`).toBe(true);
      expect(tl.x + tl.w <= tr.x && bl.x + bl.w <= br.x, `${name} の右の区画が左の区画の右に無い`).toBe(true);
      expect(tl.y + tl.h <= bl.y && tr.y + tr.h <= br.y, `${name} の下の区画が上の区画の下に無い`).toBe(true);
      const motion = motionFrom(rendered as unknown as Rendered);
      for (const area of areas) {
        expect(area.x >= 0 && area.y >= 0 && area.x + area.w <= rendered.layout.width && area.y + area.h <= rendered.layout.height, `${name} の区画 ${area.id} が図の枠の外へ出る`).toBe(true);
        // 区画の名前は区画の左上に、左に揃えて出す
        const group = motion.doc.querySelector(`[data-matrix-area="${area.id}"]`);
        expect(group, `${name} の区画 ${area.id} の部品 ([data-matrix-area]) が描いた図に無い`).not.toBeNull();
        const label = textIn(group, area.name);
        expect(label, `${name} の区画 ${area.id} の名前 ${area.name} が区画の部品に無い`).toBeDefined();
        if (!label) continue;
        const x = Number(label.getAttribute("x"));
        const y = Number(label.getAttribute("y"));
        expect(label.getAttribute("text-anchor") ?? "start", `${name} の区画 ${area.id} の名前が左に揃っていない`).toBe("start");
        expect(x > area.x && x < area.x + area.w / 4, `${name} の区画 ${area.id} の名前が区画の左に無い (x ${x}、区画 ${area.x} から ${area.x + area.w})`).toBe(true);
        expect(y > area.y && y < area.y + Math.min(48, area.h / 2), `${name} の区画 ${area.id} の名前が区画の上に無い (y ${y}、区画 ${area.y} から ${area.y + area.h})`).toBe(true);
      }
    }
  });

  it("matrix-axes-show-names-and-ends", () => {
    for (const [name, diagram, lang] of [["小さな図", parsed(SMALL), "ja"] as [string, Json, "ja" | "en"], ...exampleSources()]) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const { layout } = rendered;
      const areas = layout.areas ?? [];
      const left = Math.min(...areas.map((a) => a.x));
      const right = Math.max(...areas.map((a) => a.x + a.w));
      const top = Math.min(...areas.map((a) => a.y));
      const bottom = Math.max(...areas.map((a) => a.y + a.h));
      const axes = layout.axes ?? [];
      // 1 行目の axis が横の軸、2 行目が縦の軸
      expect(axes.map((a) => ({ dir: a.dir, name: a.name, from: a.from, to: a.to })), `${name} の軸`).toEqual(
        (source.matrix?.axes ?? []).map((a, k) => ({ dir: k === 0 ? "x" : "y", name: a.name, from: a.from, to: a.to })),
      );
      const [x, y] = axes as [MatrixAxis, MatrixAxis];
      // 横の軸は区画の下を左から右へ、縦の軸は区画の左を下から上へ、区画の幅と高さに渡って引く
      expect(Math.abs(x.line[0][1] - x.line[1][1]) < 0.5 && x.line[1][0] > x.line[0][0], `${name} の横の軸が左から右への横の線でない`).toBe(true);
      expect(x.line[0][1] >= bottom && x.line[0][0] <= left + 1 && x.line[1][0] >= right - 1, `${name} の横の軸が区画の下に区画の幅で無い`).toBe(true);
      expect(Math.abs(y.line[0][0] - y.line[1][0]) < 0.5 && y.line[1][1] < y.line[0][1], `${name} の縦の軸が下から上への縦の線でない`).toBe(true);
      expect(y.line[0][0] <= left && y.line[1][1] <= top + 1 && y.line[0][1] >= bottom - 1, `${name} の縦の軸が区画の左に区画の高さで無い`).toBe(true);
      const motion = motionFrom(rendered as unknown as Rendered);
      for (const axis of axes) {
        const group = motion.doc.querySelector(`[data-matrix-axis="${axis.dir}"]`);
        expect(group, `${name} の ${axis.dir} の軸の部品 ([data-matrix-axis]) が描いた図に無い`).not.toBeNull();
        expect(group?.querySelector("[data-matrix-arrow]"), `${name} の ${axis.dir} の軸に矢印の先 ([data-matrix-arrow]) が無い`).not.toBeNull();
        // 軸の名前と両端の字を軸の部品に出し、大きい側の字を矢印の先の側に、小さい側の字を軸の始まりの側に置く
        expect(textIn(group, axis.name), `${name} の ${axis.dir} の軸の名前 ${axis.name} が描いた図に無い`).toBeDefined();
        if (axis.from === undefined || axis.to === undefined) continue;
        const from = textIn(group, axis.from);
        const to = textIn(group, axis.to);
        expect(from, `${name} の ${axis.dir} の軸の小さい側の字 ${axis.from} が描いた図に無い`).toBeDefined();
        expect(to, `${name} の ${axis.dir} の軸の大きい側の字 ${axis.to} が描いた図に無い`).toBeDefined();
        if (!from || !to) continue;
        const at = (el: Element): Point => [Number(el.getAttribute("x")), Number(el.getAttribute("y"))];
        const near = (p: Point, q: Point): number => Math.hypot(p[0] - q[0], p[1] - q[1]);
        const [start, tip] = axis.line;
        expect(near(at(to), tip) < near(at(to), start), `${name} の ${axis.dir} の軸の大きい側の字が矢印の先の側に無い`).toBe(true);
        expect(near(at(from), start) < near(at(from), tip), `${name} の ${axis.dir} の軸の小さい側の字が軸の始まりの側に無い`).toBe(true);
      }
    }
  });

  it("matrix-items-wait-in-the-unplaced-list", () => {
    for (const [name, diagram, lang] of [["小さな図", parsed(SMALL), "ja"] as [string, Json, "ja" | "en"], ...exampleSources()]) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const { layout, timeline } = rendered;
      const list = layout.list as Rect;
      const areas = layout.areas ?? [];
      // 置く前の一覧は区画の左に在る
      expect(list.x + list.w <= Math.min(...areas.map((a) => a.x)), `${name} の置く前の一覧が区画の左に無い`).toBe(true);
      const cards = layout.cards ?? [];
      // 課題の札は item を書いた順に、置く前の一覧の中へ上から並べる
      expect(cards.map((c) => c.id), `${name} の課題の札の並び`).toEqual((source.matrix?.items ?? []).map((i) => i.id));
      for (const [k, card] of cards.entries()) {
        expect(inside(card, list), `${name} の課題 ${card.id} の席が置く前の一覧の中に無い`).toBe(true);
        const next = cards[k + 1];
        if (next) expect(card.y + card.h <= next.y, `${name} の課題 ${card.id} の下に次の課題 ${next.id} が無い`).toBe(true);
      }
      const motion = motionFrom(rendered as unknown as Rendered);
      expect(motion.doc.querySelector("[data-matrix-list]"), `${name} の置く前の一覧の部品 ([data-matrix-list]) が描いた図に無い`).not.toBeNull();
      const placed = placementsOf(source);
      for (const card of cards) {
        // 区画へ置く段より前の段の終わりには、札は置く前の一覧の席に在る
        const first = placed.find((p) => p.item === card.id)?.step ?? timeline.steps.length;
        for (let s = 0; s < first; s += 1) {
          const span = timeline.steps[s] as Span;
          const at = cardAt(motion, card.id, span.end - 0.05);
          expect(at, `${name} の課題 ${card.id} の札の部品 ([data-matrix-item]) が描いた図に無い`).toBeDefined();
          if (!at) continue;
          expect(Math.hypot(at.x - card.x, at.y - card.y) < 1, `${name} の段 ${s + 1} の終わりに課題 ${card.id} の札が置く前の一覧の席に無い`).toBe(true);
        }
      }
    }
  });

  it("matrix-line-moves-the-item-into-the-area", () => {
    // 前の段で置いた課題を別の区画へ置き直すと、札は前の区画から動く
    const moved = SMALL.replace("  line drop: old\n", "  line drop: old\n\nstep 置き直す\n  say 決済は今やる。\n  line now: pay\n");
    const sources: [string, Json, "ja" | "en"][] = [["小さな図", parsed(SMALL), "ja"], ["置き直す図", parsed(moved), "ja"], ...exampleSources()];
    for (const [name, diagram, lang] of sources) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram, lang);
      const { layout, timeline } = rendered;
      const motion = motionFrom(rendered as unknown as Rendered);
      const areaOf = new Map((layout.areas ?? []).map((a) => [a.id, a]));
      const last = timeline.steps[timeline.steps.length - 1] as Span;
      const placed = placementsOf(source);
      expect(placed.length, `${name} に区画へ置く行が無い`).toBeGreaterThan(0);
      for (const p of placed) {
        const span = timeline.steps[p.step] as Span;
        const area = areaOf.get(p.area);
        const what = `${name} の段 ${p.step + 1} の ${p.item} (${p.area} へ)`;
        expect(area, `${what} の区画が並べた図に無い`).toBeDefined();
        if (!area) continue;
        // 札は置いた段の始めにはまだ区画の外に在り、段の終わりには区画の中に在る
        const before = cardAt(motion, p.item, span.start + 0.01);
        const after = cardAt(motion, p.item, span.end - 0.05);
        expect(before && after, `${what} の札の部品 ([data-matrix-item]) が描いた図に無い`).toBeTruthy();
        if (!before || !after) continue;
        expect(inside(before, area), `${what} の札が置く段の始めから区画の中に在る`).toBe(false);
        expect(inside(after, area), `${what} の札が置いた段の終わりに区画の中に無い`).toBe(true);
        // ほかの段で置き直さない札は、最後の段まで区画に残る
        const again = placed.some((q) => q.item === p.item && q.step > p.step);
        if (!again) {
          const end = cardAt(motion, p.item, (last.start + last.end) / 2);
          expect(end && inside(end, area), `${what} の札が最後の段で区画に残らない`).toBe(true);
        }
        // 札を受けた区画は、その段の間だけ光る
        const glow = motion.doc.querySelector(`[data-matrix-glow="${p.area}"]`);
        expect(glow, `${what} の区画を光らせる部品 ([data-matrix-glow]) が描いた図に無い`).not.toBeNull();
        if (!glow) continue;
        expect(motion.opacity(glow, span.end - 0.05), `${what} の区画が札を受けた段の終わりに光っていない`).toBeGreaterThan(0.5);
        const quiet = timeline.steps.findIndex((_, s) => !placed.some((q) => q.step === s && q.area === p.area));
        if (quiet >= 0) {
          const q = timeline.steps[quiet] as Span;
          expect(motion.opacity(glow, (q.start + q.end) / 2), `${name} の区画 ${p.area} が札を受けない段 ${quiet + 1} に光っている`).toBeLessThan(0.1);
        }
      }
      // 最後の段では、同じ区画に置いた札どうしが重ならず、どれも区画の中に在る
      const mid = (last.start + last.end) / 2;
      const ends = (layout.cards ?? []).flatMap((c) => {
        const at = cardAt(motion, c.id, mid);
        return at ? [{ id: c.id, at }] : [];
      });
      for (const [i, a] of ends.entries())
        for (const b of ends.slice(i + 1)) expect(apart(a.at, b.at), `${name} の最後の段で課題 ${a.id} と ${b.id} の札が重なる`).toBe(true);
    }
  });
});

describe("2つの軸で置く図の軽い入口 (#3622)", () => {
  it("matrix-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(SMALL)};`,
      "out.before = light.kindLoaded('matrix');",
      "await light.loadFor(text);",
      "out.after = light.kindLoaded('matrix');",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.kind = drawn.layout.kind;",
      "  out.cards = (drawn.svg.match(/data-matrix-item=/g) ?? []).length;",
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
    expect(failure, "軽い入口で 2つの軸で置く図を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { before?: boolean; after?: boolean; ok?: boolean; errors?: unknown[]; kind?: string; cards?: number; same?: boolean };
    expect(out.before, "軽い入口が loadFor の前から 2つの軸で置く図の描く部品を持つ (最初に読む塊に入っている)").toBe(false);
    expect(out.after, "軽い入口で loadFor を待っても 2つの軸で置く図の描く部品を読まない").toBe(true);
    expect(out.ok, `軽い入口で loadFor を待った後に 2つの軸で置く図を読めない: ${JSON.stringify(out.errors)}`).toBe(true);
    expect(out.kind, "軽い入口で描いた図の種類").toBe("matrix");
    expect(out.cards, "軽い入口で描いた 2つの軸で置く図の課題の札の数").toBe(5);
    expect(out.same, "軽い入口と既定の入口で描いた 2つの軸で置く図が違う").toBe(true);
  });
});

describe("2つの軸で置く図の書き方の文書 (#3622)", () => {
  it("matrix-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `matrix` と、軸の行と、課題の行と、区画へ置く行の書き方 */
    const head = /(^|[\s`])matrix [^\s`]/mu;
    const axis = /axis (<[^>]+>|[^\s`]+) \[from: (<[^>]+>|[^\s`,]+), to: (<[^>]+>|[^\s`\]]+)\]/u;
    const item = /item (<[^>]+>|[^\s`]+) as (<[^>]+>|[^\s`]+)/u;
    const place = /line (<[^>]+>|[^\s`:]+): (<[^>]+>|[^\s`]+)/u;
    const matrixFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "matrix";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に matrix の行の書き方が無い`).toBe(true);
      expect(axis.test(text), `${path} に軸の行 (axis <名前> [from: <小さい側>, to: <大きい側>]) の書き方が無い`).toBe(true);
      if (path !== "README.md") {
        expect(item.test(text), `${path} に課題の行 (item <名札> as <名前>) の書き方が無い`).toBe(true);
        expect(place.test(text), `${path} に区画へ置く行 (line <区画>: <課題>) の書き方が無い`).toBe(true);
        expect(matrixFences(text), `${path} に 2つの軸で置く図として読める dragon の囲みが無い`).toBeGreaterThan(0);
      }
    }
    // README の描ける図の欄に 2つの軸で置く図が載る
    expect(/^\| Diagram kinds \|.*\btwo-axis matrix\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に two-axis matrix が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"matrix"/u.test(content), "使い方の頁の節に 2つの軸で置く図 (matrix) が無い").toBe(true);
    const sections = ["matrix.dragon", "matrix.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の 2つの軸で置く図の節の例 (${i === 0 ? "matrix.dragon" : "matrix.en.dragon"}) が 2つの軸で置く図として読めない`).toBe("matrix");
    }
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に matrix の行の書き方が無い").toBe(true);
    expect(axis.test(page), "使い方の頁に軸の行の書き方が無い").toBe(true);
    expect(item.test(page), "使い方の頁に課題の行の書き方が無い").toBe(true);
    expect(place.test(page), "使い方の頁に区画へ置く行の書き方が無い").toBe(true);
  });
});

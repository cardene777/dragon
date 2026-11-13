// @vitest-environment jsdom
/**
 * 2つの軸で置く図の、点数で点を打つ見た目 (#3637)。
 *
 * 図の種類の行に `matrix <題> [shape: scatter]` を書くと、0 から 10 の目盛りの軸に項目を点数どおりの位置の点で打つ。
 * 点数は項目の行に `item <名札> as <名前> [x: <横>, y: <縦>]` で書き、段は区画を書かずに `line: <項目>` で 1 段に 1 つの項目を打つ。
 * 区画は点数から決め、軸ごとに 5 以上を大きい側にする。区画を書いた `line <区画>: <項目>` は点数の区画と合う時だけ読む。
 * 軸の行に `[reverse: yes]` を書くと、その軸は大きい値を左か下に打つ。札を置く今の見た目でも矢印の向きを合わせる。
 * 同じ点数の項目は 1 つの点にまとめ、後の段で打った名前を前の名前の下に足す。
 * 点の図の左に置く前の課題の表を出し、図の種類の行に `table: none` を書くと表を出さない。携帯の幅では表を上に、点の図を下に積む。
 * 見た目の元は #3622 の step 2 で本人が選ばなかった動く試作の案B (`.context/extend/new-kinds/kinds/matrix.js` の `drawB`)。
 *
 * 置き場所 (`layout`) は描く部品が返す値で確かめ、点と線と表の行の現れ方は SVG の keyframes を jsdom で読んで確かめる。
 * 点の図の枠は `layout.plot`、打った点は `layout.dots` (同じ点数の項目は 1 つの点の `ids` に並ぶ)、表は `layout.table` と `layout.rows` に返る。
 * 点の部品は `data-matrix-dot="<名札を空白で並べた物>"`、打った段の軸からの線と点数の札は `data-matrix-guide="<名札>"`、
 * 表は `data-matrix-table`、表の行は `data-matrix-row="<名札>"`、行を光らせる部品は `data-matrix-row-glow="<名札>"` を持つ。
 * 見本と見た目の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Layout, type Rect, type Rendered, type Span } from "./render-support";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/svg"), import("../src/check")]);

const ROOT = process.cwd();
const PACKAGE = join(ROOT, "packages/dragon");
const EXAMPLES = join(PACKAGE, "examples");
const LANGS = ["ja", "en"] as const;
type Lang = (typeof LANGS)[number];

/** 見本帳の見本の一覧と、棚の見本の束と記法の早見と、カタログの種類の頁の見本 */
interface Playground {
  EXAMPLE_KEYS: readonly string[];
  exampleText: (key: string, lang: Lang) => string | undefined;
  LATER_EXAMPLES: { start: () => void; state: () => { status: string } };
  sampleGroups: (lang: Lang, arrived: boolean) => { kind: string; samples: { key: string }[] }[];
  syntaxLines: (lang: Lang) => { id: string; lines: string[] }[];
  samplesOf: (kind: string) => string[];
}

/**
 * 見本帳の見本と棚の雛形は、見本帳の部品から読む。描画の部品の型の検査 (`tsconfig.test.json`) は見本帳の vite の読み込み (`?raw`) の型を持たないので、
 * path を字にして読み込みの時に引き、型の検査に見本帳の file を入れない
 */
const playgroundFile = (path: string): Promise<object> => import(/* @vite-ignore */ join(ROOT, "apps/playground-spa/src", path));
const { EXAMPLE_KEYS, exampleText, LATER_EXAMPLES, sampleGroups, syntaxLines, samplesOf } = Object.assign(
  {},
  ...(await Promise.all(["examples.ts", "editor/shelf-first.ts", "editor/shelf-items.ts", "catalog/catalog.ts"].map(playgroundFile))),
) as Playground;

/** 点数で点を打つ見た目の見本 (#3637 の受入条件) */
const SAMPLE = "feature-scores";

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 区画の場所。左上が 0、右上が 1、左下が 2、右下が 3 */
interface Area extends Rect {
  id: string;
  name: string;
  spot: number;
}

type Point = [number, number];

/** 並べた軸。`line` は小さい値の側の端から大きい値の側の矢印の先まで */
interface Axis {
  dir: "x" | "y";
  name: string;
  from?: string;
  to?: string;
  reverse?: boolean;
  line: [Point, Point];
}

/** 打った点。同じ点数の項目は 1 つの点に、打った段の順に並ぶ */
interface Dot {
  ids: string[];
  x: number;
  y: number;
}

interface Row extends Rect {
  id: string;
}

interface ScatterLayout extends Omit<Layout, "boxes"> {
  kind: string;
  shape?: string;
  areas?: Area[];
  axes?: Axis[];
  plot?: Rect;
  dots?: Dot[];
  table?: Rect;
  rows?: Row[];
}

interface ScatterRendered extends Omit<Rendered, "layout"> {
  layout: ScatterLayout;
}

interface Item {
  id: string;
  name: string;
  x?: number;
  y?: number;
}

interface Source {
  kind: string;
  title: string;
  matrix?: { shape?: string; table?: string; axes: { name: string; from?: string; to?: string; reverse?: boolean }[]; items: Item[] };
  blocks: { box?: { id: string; name: string }[] };
  steps: { title: string; events: { type: string; box?: string; items?: string[] }[] }[];
}

/** 仕事を効き目と手間の点数で打つ、書き戻した形の小さな記法。境目ちょうどの課題と、同じ点数の 2 つの課題を持つ */
const SCATTER = [
  "matrix 仕事を手間と効き目の点数で打つ [shape: scatter]",
  "",
  "axis 手間 [from: 小さい, to: 大きい]",
  "axis 効き目 [from: 小さい, to: 大きい]",
  "",
  "box now as 今やる",
  "box plan as 計画する",
  "box spare as 手が空いたら",
  "box drop as やらない",
  "",
  "item login as ログインを速く [x: 2, y: 8]",
  "item pay as 決済を足す [x: 8, y: 7.5]",
  "item word as 文言の直し [x: 3, y: 3]",
  "item edge as 境目の課題 [x: 5, y: 5]",
  "item old as 古い画面を作り直す [x: 9, y: 2]",
  "item twin as 同じ点数の課題 [x: 3, y: 3]",
  "",
  "step 並べる",
  "  say 置く前の課題を左の表に並べる。",
  "",
  "step ログイン",
  "  say 手間が小さく効き目の大きい課題を打つ。",
  "  line: login",
  "",
  "step 決済",
  "  say 効き目も手間も大きい課題を打つ。",
  "  line: pay",
  "",
  "step 文言",
  "  say 効き目も手間も小さい課題を打つ。",
  "  line: word",
  "",
  "step 境目",
  "  say 真ん中の5点の課題は大きい側の区画に入る。",
  "  line: edge",
  "",
  "step 古い画面",
  "  say 手間が大きく効き目の小さい課題を打つ。",
  "  line: old",
  "",
  "step 同じ点数",
  "  say 文言の直しと同じ点数の課題は同じ点にまとまる。",
  "  line: twin",
  "",
].join("\n");

/** 項目ごとの、点数から決まる区画。5 以上を大きい側にする */
const AREA_OF: Record<string, string> = { login: "now", pay: "plan", word: "spare", edge: "plan", old: "drop", twin: "spare" };

/** 項目ごとの点数 */
const SCORES: Record<string, [number, number]> = { login: [2, 8], pay: [8, 7.5], word: [3, 3], edge: [5, 5], old: [9, 2], twin: [3, 3] };

/** SCATTER と同じ図の原本 (版2) */
function smallScatter(): Json {
  const line = (item: string): Json => ({ type: "line", items: [item] });
  const names: Record<string, string> = { login: "ログインを速く", pay: "決済を足す", word: "文言の直し", edge: "境目の課題", old: "古い画面を作り直す", twin: "同じ点数の課題" };
  return {
    version: 2,
    kind: "matrix",
    title: "仕事を手間と効き目の点数で打つ",
    matrix: {
      shape: "scatter",
      axes: [
        { name: "手間", from: "小さい", to: "大きい" },
        { name: "効き目", from: "小さい", to: "大きい" },
      ],
      items: Object.keys(SCORES).map((id) => ({ id, name: names[id] as string, x: (SCORES[id] as [number, number])[0], y: (SCORES[id] as [number, number])[1] })),
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
      { title: "並べる", body: "置く前の課題を左の表に並べる。", events: [] },
      { title: "ログイン", body: "手間が小さく効き目の大きい課題を打つ。", events: [line("login")] },
      { title: "決済", body: "効き目も手間も大きい課題を打つ。", events: [line("pay")] },
      { title: "文言", body: "効き目も手間も小さい課題を打つ。", events: [line("word")] },
      { title: "境目", body: "真ん中の5点の課題は大きい側の区画に入る。", events: [line("edge")] },
      { title: "古い画面", body: "手間が大きく効き目の小さい課題を打つ。", events: [line("old")] },
      { title: "同じ点数", body: "文言の直しと同じ点数の課題は同じ点にまとまる。", events: [line("twin")] },
    ],
  };
}

/** 項目を打つ段の番号 (0 から数える) */
const STEP_OF: Record<string, number> = { login: 1, pay: 2, word: 3, edge: 4, old: 5, twin: 6 };

/** 横の軸に `[reverse: yes]` を書いた SCATTER */
const REVERSED = SCATTER.replace("axis 手間 [from: 小さい, to: 大きい]", "axis 手間 [from: 小さい, to: 大きい, reverse: yes]");

/** 図の種類の行に `table: none` を書いた SCATTER */
const NO_TABLE = SCATTER.replace("[shape: scatter]", "[shape: scatter, table: none]");

/** SCATTER から図の種類の行の見た目を外し、札を置く今の見た目にした記法 */
const CHIPS = SCATTER.replace(" [shape: scatter]", "");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang = "ja", where = "記法"): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Source | Json, lang: Lang = "ja", width?: number): ScatterRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "2つの軸で置く図を描けない").toBe("");
  return rendered as unknown as ScatterRendered;
}

/** 点数で点を打つ見た目の描いた図。並べ方の欄が無ければ名指して落とす */
function renderScatter(text: string, lang: Lang = "ja", width?: number): { rendered: ScatterRendered; motion: Motion; plot: Rect; dots: Dot[] } {
  const rendered = render(parsed(text, lang), lang, width);
  const { layout } = rendered;
  expect(layout.kind, "描いた図が 2つの軸で置く図 (matrix) でない").toBe("matrix");
  expect(layout.shape, "描いた図が点数で点を打つ見た目 (layout.shape) でない").toBe("scatter");
  expect(layout.plot, "並べた図に点の図の枠 (layout.plot) が無い").toBeDefined();
  expect(layout.dots, "並べた図に打った点の並び (layout.dots) が無い").toBeDefined();
  expect(layout.areas, "並べた図に区画の並び (layout.areas) が無い").toBeDefined();
  expect(layout.axes, "並べた図に軸の並び (layout.axes) が無い").toBeDefined();
  return { rendered, motion: motionFrom(rendered as unknown as Rendered), plot: layout.plot ?? { x: 0, y: 0, w: 0, h: 0 }, dots: layout.dots ?? [] };
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 段の真ん中の時刻 */
const middle = (span: Span): number => (span.start + span.end) / 2;

/** 部品の中の、字が `text` の `text` の部品 */
const textIn = (el: Element | null | undefined, text: string): Element | undefined => [...(el?.querySelectorAll("text") ?? [])].find((t) => t.textContent === text);

/** 名札を持つ点の部品。同じ点数の項目は 1 つの部品の名札の並びに入る */
const dotOf = (motion: Motion, id: string): Element | undefined =>
  [...motion.doc.querySelectorAll("[data-matrix-dot]")].find((el) => (el.getAttribute("data-matrix-dot") ?? "").split(" ").includes(id));

/** 点数から、点の図の枠の中の点の場所。`reverse` の軸は大きい値を左か下に置く */
const spotOf = (plot: Rect, [sx, sy]: [number, number], reverse: { x?: boolean; y?: boolean } = {}): Point => [
  plot.x + (plot.w * (reverse.x ? 10 - sx : sx)) / 10,
  plot.y + plot.h - (plot.h * (reverse.y ? 10 - sy : sy)) / 10,
];

/** 誤りの最初の 1 件 */
function firstError(text: string, lang: Lang): LineError | undefined {
  const read = api("parseNotation")(text, { lang });
  return read.ok ? undefined : read.errors[0];
}

/** 誤りの行を確かめ、日本語の文は仮名か漢字を持ち、英語の文は持たず、どちらの文も `words` を全て含む */
function expectRefused(text: string, name: string, line: number, words: string[] = []): void {
  for (const lang of LANGS) {
    const first = firstError(text, lang);
    expect(first, `${name} が読めてしまう (${lang})`).toBeDefined();
    if (!first) continue;
    expect(first.line, `${name} の誤りの行 (${lang}): ${first.message}`).toBe(line);
    const message = first.message ?? "";
    if (lang === "en") expect(KANA.test(message), `${name} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
    else expect(KANA.test(message), `${name} の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
    for (const word of words) expect(message, `${name} の誤りの文 (${lang}) が ${word} を名指さない`).toContain(word);
  }
}

/** SCATTER の行の番号 (1 から数える) */
const lineOf = (text: string, head: string): number => text.split("\n").findIndex((l) => l.startsWith(head)) + 1;

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("点数で点を打つ見た目の原本の JSON (#3637)", () => {
  it("schema-accepts-scatter-look", () => {
    const validate = api("validateDiagram");
    const json = (value: Json): Json => JSON.parse(JSON.stringify(value)) as Json;
    const base = smallScatter();
    const full = json(base) as { matrix: { table?: string; axes: { reverse?: boolean }[] } };
    full.matrix.table = "none";
    (full.matrix.axes[0] as { reverse?: boolean }).reverse = true;
    for (const [where, source] of [
      ["点数で点を打つ見た目", base],
      ["表を消して横の軸の向きを変えた見た目", full as unknown as Json],
    ] as const) {
      for (const lang of LANGS) {
        const checked = validate(source, { lang });
        expect(checked.ok, `${where}の原本が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
      }
    }
    // 見た目は scatter だけ、点数は 0 から 10 の数だけを受け、ほかはその欄を指して断る
    const wrongShape = json(base) as { matrix: { shape: string } };
    wrongShape.matrix.shape = "dots";
    expect(pointers(validate(wrongShape as unknown as Json)), "scatter でない見た目の誤りの場所").toContain("/matrix/shape");
    const tooHigh = json(base) as { matrix: { items: { x: number }[] } };
    (tooHigh.matrix.items[0] as { x: number }).x = 11;
    expect(pointers(validate(tooHigh as unknown as Json)), "10 より大きい点数の誤りの場所").toContain("/matrix/items/0/x");
    const wrongTable = json(base) as { matrix: { table: string } };
    wrongTable.matrix.table = "left";
    expect(pointers(validate(wrongTable as unknown as Json)), "none でない表の欄の誤りの場所").toContain("/matrix/table");
  });
});

describe("点数で点を打つ見た目の記法 (#3637)", () => {
  it("scatter-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(SCATTER) as unknown as Json), "点数で点を打つ見た目を読んで書き戻した記法が元と違う").toBe(SCATTER);
    // 記法から作った原本は、原本の JSON と同じ。区画を書かない line は区画の欄を持たない
    expect(parsed(SCATTER), "点数で点を打つ見た目の記法から作った原本").toEqual(smallScatter());
    for (const [where, text] of [
      ["横の軸の向きを変えた図", REVERSED],
      ["表を消した図", NO_TABLE],
      ["札を置く見た目で点数を書いた図", CHIPS],
    ] as const) {
      expect(print(parsed(text) as unknown as Json), `${where}を読んで書き戻した記法が元と違う`).toBe(text);
    }
    expect(parsed(REVERSED).matrix?.axes[0]?.reverse, "reverse: yes を書いた軸の原本").toBe(true);
    expect(parsed(NO_TABLE).matrix?.table, "table: none を書いた図の原本").toBe("none");
    expect(parsed(CHIPS).matrix?.shape, "見た目を書かない図の原本の見た目").toBeUndefined();
  });

  it("matrix-rejects-an-area-that-disagrees-with-scores", () => {
    // 点数から決まる区画と同じ区画を書いた line は読める
    const agree = SCATTER.replace("  line: login", "  line now: login");
    expect(firstError(agree, "ja"), "点数の区画と同じ区画を書いた line が読めない").toBeUndefined();
    // 違う区画を書いた line は、その行を指し、区画と点数を名指して止める。札を置く見た目でも同じ
    for (const [where, text] of [
      ["点数で点を打つ見た目", SCATTER],
      ["札を置く見た目", CHIPS],
    ] as const) {
      const wrong = text.replace("  line: login", "  line drop: login");
      expectRefused(wrong, `${where}で点数と違う区画を書いた line`, lineOf(wrong, "  line drop: login"), ["drop", "login", "2", "8"]);
    }
  });

  it("scatter-rejects-scores-out-of-range", () => {
    const at = lineOf(SCATTER, "item login");
    // 0 と 10 と小数 1 桁は読める
    for (const scores of ["x: 0, y: 10", "x: 10, y: 0", "x: 2.5, y: 9.5"]) {
      const text = SCATTER.replace("[x: 2, y: 8]", `[${scores}]`);
      expect(firstError(text, "ja"), `点数 ${scores} の項目が読めない`).toBeUndefined();
    }
    // 0 から 10 の外と、小数 2 桁以上と、数でない点数は、項目の行を指し、項目と値を名指して止める
    for (const [scores, value] of [
      ["x: 11, y: 8", "11"],
      ["x: -1, y: 8", "-1"],
      ["x: 2, y: 8.25", "8.25"],
      ["x: 2, y: high", "high"],
    ] as const) {
      expectRefused(SCATTER.replace("[x: 2, y: 8]", `[${scores}]`), `点数 ${scores} の項目`, at, ["login", value]);
    }
  });

  it("scatter-rejects-misused-words", () => {
    // x か y の片方だけを書いた項目は、その行を指して止める
    for (const scores of ["x: 2", "y: 8"]) {
      expectRefused(SCATTER.replace("[x: 2, y: 8]", `[${scores}]`), `点数を ${scores} だけ書いた項目`, lineOf(SCATTER, "item login"), ["login"]);
    }
    // 点数の無い項目を区画を書かずに打つ line は、その行を指して止める
    const bare = SCATTER.replace(" [x: 2, y: 8]", "");
    expectRefused(bare, "点数の無い項目を区画を書かずに打つ line", lineOf(bare, "  line: login"), ["login"]);
    // 見た目が scatter でない図の table: none と、図の種類の行の reverse は、図の種類の行で止める
    expectRefused(CHIPS.replace("matrix 仕事を手間と効き目の点数で打つ", "matrix 仕事を手間と効き目の点数で打つ [table: none]"), "見た目の無い図の table: none", 1, ["table"]);
    // yes でない reverse は、軸の行で止める
    const no = SCATTER.replace("axis 手間 [from: 小さい, to: 大きい]", "axis 手間 [from: 小さい, to: 大きい, reverse: no]");
    expectRefused(no, "yes でない reverse", lineOf(no, "axis 手間"), ["reverse"]);
    // scatter の見た目は 2つの軸で置く図の外では書けない
    expectRefused("chart 端末の割合 [shape: scatter]\n\nitem a as 電話\n\nstep 数える\n  say 数える。\n  set a: 3\n", "量の図の scatter", 1, ["scatter"]);
    // x と y は 2つの軸で置く図の項目の外では書けない
    expectRefused("chart 端末の割合\n\nitem a as 電話 [x: 3, y: 4]\n\nstep 数える\n  say 数える。\n  set a: 3\n", "量の図の項目の x と y", 3);
  });
});

describe("点数で点を打つ見た目の描き方 (#3637)", () => {
  it("scatter-plots-items-at-their-scores", () => {
    const { rendered, motion, plot, dots } = renderScatter(SCATTER);
    const { timeline } = rendered;
    expect(plot.w > 0 && plot.h > 0, "点の図の枠に幅か高さが無い").toBe(true);
    for (const [id, scores] of Object.entries(SCORES)) {
      const dot = dots.find((d) => d.ids.includes(id));
      expect(dot, `${id} の点が並べた図 (layout.dots) に無い`).toBeDefined();
      if (!dot) continue;
      // 点数どおりの場所に打ち、大きいほど右と上に置く
      const [x, y] = spotOf(plot, scores);
      expect(Math.hypot(dot.x - x, dot.y - y) < 0.5, `${id} の点が点数 ${scores.join(", ")} の場所に無い (${dot.x}, ${dot.y} と ${x}, ${y})`).toBe(true);
      const el = dotOf(motion, id);
      expect(el, `${id} の点の部品 ([data-matrix-dot]) が描いた図に無い`).toBeDefined();
      if (!el) continue;
      // 打つ段より前の段には点が無く、打った段の終わりから最後の段まで点が在る
      const step = STEP_OF[id] as number;
      const before = timeline.steps[step - 1] as Span;
      const now = timeline.steps[step] as Span;
      const last = timeline.steps[timeline.steps.length - 1] as Span;
      if (dots.find((d) => d.ids.includes(id))?.ids[0] === id) expect(motion.opacity(el, middle(before)), `${id} の点が打つ段より前に見える`).toBeLessThan(0.1);
      expect(motion.opacity(el, now.end - 0.05), `${id} の点が打った段の終わりに見えない`).toBeGreaterThan(0.5);
      expect(motion.opacity(el, middle(last)), `${id} の点が最後の段で見えない`).toBeGreaterThan(0.5);
      // 打った段だけ、両方の軸から点まで線を引き、軸の上に点数の札を出す
      const guide = motion.doc.querySelector(`[data-matrix-guide="${id}"]`);
      expect(guide, `${id} の軸からの線の部品 ([data-matrix-guide]) が描いた図に無い`).not.toBeNull();
      if (!guide) continue;
      expect(guide.querySelectorAll("path, line").length, `${id} の軸からの線が 2 本でない`).toBeGreaterThanOrEqual(2);
      for (const value of scores) expect(textIn(guide, String(value)), `${id} の点数 ${value} の札が軸からの線の部品に無い`).toBeDefined();
      expect(motion.opacity(guide, now.end - 0.05), `${id} の軸からの線が打った段の終わりに見えない`).toBeGreaterThan(0.5);
      const later = timeline.steps[step + 1];
      if (later) expect(motion.opacity(guide, middle(later)), `${id} の軸からの線が次の段にも残る`).toBeLessThan(0.1);
    }
    // 軸は 0、5、10 の目盛りの数を持つ
    for (const dir of ["x", "y"]) {
      const axis = motion.doc.querySelector(`[data-matrix-axis="${dir}"]`);
      expect(axis, `${dir} の軸の部品 ([data-matrix-axis]) が描いた図に無い`).not.toBeNull();
      for (const tick of ["0", "5", "10"]) expect(textIn(axis, tick), `${dir} の軸に目盛りの数 ${tick} が無い`).toBeDefined();
    }
  });

  it("scatter-line-lights-the-area-from-scores", () => {
    const { rendered, motion, plot } = renderScatter(SCATTER);
    const { timeline, layout } = rendered;
    const areas = layout.areas ?? [];
    expect(areas.map((a) => a.spot), "区画の場所").toEqual([0, 1, 2, 3]);
    for (const area of areas) {
      // 区画は点の図の枠を真ん中で 4 つに分ける
      const right = area.spot % 2 === 1;
      const bottom = area.spot >= 2;
      expect(Math.abs(area.x - (right ? plot.x + plot.w / 2 : plot.x)) < 0.5 && Math.abs(area.y - (bottom ? plot.y + plot.h / 2 : plot.y)) < 0.5, `区画 ${area.id} が点の図の枠の ${area.spot} の場所に無い`).toBe(true);
    }
    for (const [id, area] of Object.entries(AREA_OF)) {
      const step = STEP_OF[id] as number;
      const span = timeline.steps[step] as Span;
      const glow = motion.doc.querySelector(`[data-matrix-glow="${area}"]`);
      expect(glow, `${id} を受ける区画 ${area} を光らせる部品 ([data-matrix-glow]) が描いた図に無い`).not.toBeNull();
      if (!glow) continue;
      expect(motion.opacity(glow, span.end - 0.05), `${id} を打った段の終わりに区画 ${area} が光っていない`).toBeGreaterThan(0.5);
      // ほかの区画は、その段に光らない
      for (const other of areas.filter((a) => a.id !== area)) {
        const dark = motion.doc.querySelector(`[data-matrix-glow="${other.id}"]`);
        if (dark) expect(motion.opacity(dark, span.end - 0.05), `${id} を打った段に区画 ${other.id} も光る`).toBeLessThan(0.1);
      }
    }
  });

  it("scatter-reverse-axis-puts-large-values-left-or-down", () => {
    const { rendered, motion, plot, dots } = renderScatter(REVERSED);
    for (const [id, scores] of Object.entries(SCORES)) {
      const dot = dots.find((d) => d.ids.includes(id));
      const [x, y] = spotOf(plot, scores, { x: true });
      expect(dot && Math.hypot(dot.x - x, dot.y - y) < 0.5, `向きを変えた横の軸で ${id} の点が点数の場所に無い`).toBe(true);
    }
    // 横の軸の向きを変えると、手間の大きい課題は左の区画に入る。5 以上は大きい側なので、境目の課題も左に入る
    const flipped: Record<string, string> = { login: "plan", pay: "now", word: "drop", edge: "now", old: "spare", twin: "drop" };
    for (const [id, area] of Object.entries(flipped)) {
      const span = rendered.timeline.steps[STEP_OF[id] as number] as Span;
      const glow = motion.doc.querySelector(`[data-matrix-glow="${area}"]`);
      expect(glow && motion.opacity(glow, span.end - 0.05), `向きを変えた横の軸で ${id} を打った段に区画 ${area} が光らない`).toBeGreaterThan(0.5);
    }
    const [axisX] = rendered.layout.axes ?? [];
    expect(axisX?.reverse, "向きを変えた横の軸の並べ方 (layout.axes の reverse)").toBe(true);
    expect(axisX && axisX.line[1][0] < axisX.line[0][0], "向きを変えた横の軸の大きい値の側が左に無い").toBe(true);
    // 区画を書いた line も、向きを変えた軸の区画で確かめる
    expect(firstError(REVERSED.replace("  line: login", "  line plan: login"), "ja"), "向きを変えた軸の区画を書いた line が読めない").toBeUndefined();
    expect(firstError(REVERSED.replace("  line: login", "  line now: login"), "ja"), "向きを変えた軸で、向きを変える前の区画を書いた line が読めてしまう").toBeDefined();
  });

  it("matrix-reverse-axis-flips-the-arrow", () => {
    for (const [dir, text] of [
      ["x", CHIPS.replace("axis 手間 [from: 小さい, to: 大きい]", "axis 手間 [from: 小さい, to: 大きい, reverse: yes]")],
      ["y", CHIPS.replace("axis 効き目 [from: 小さい, to: 大きい]", "axis 効き目 [from: 小さい, to: 大きい, reverse: yes]")],
    ] as const) {
      const rendered = render(parsed(text));
      const axis = (rendered.layout.axes ?? []).find((a) => a.dir === dir);
      expect(axis, `札を置く見た目の ${dir} の軸が並べた図に無い`).toBeDefined();
      if (!axis) continue;
      const [start, tip] = axis.line;
      // 向きを変えた横の軸は矢印の先が左に、縦の軸は下に在る
      if (dir === "x") expect(tip[0] < start[0], "向きを変えた横の軸の矢印の先が左に無い").toBe(true);
      else expect(tip[1] > start[1], "向きを変えた縦の軸の矢印の先が下に無い").toBe(true);
      const motion = motionFrom(rendered as unknown as Rendered);
      const group = motion.doc.querySelector(`[data-matrix-axis="${dir}"]`);
      expect(group?.querySelector("[data-matrix-arrow]"), `向きを変えた ${dir} の軸に矢印の先が無い`).not.toBeNull();
      const at = (el: Element | undefined): Point => [Number(el?.getAttribute("x")), Number(el?.getAttribute("y"))];
      const near = (p: Point, q: Point): number => Math.hypot(p[0] - q[0], p[1] - q[1]);
      const big = textIn(group, "大きい");
      const small = textIn(group, "小さい");
      expect(big && small, `向きを変えた ${dir} の軸に両端の字が無い`).toBeTruthy();
      expect(near(at(big), tip) < near(at(big), start), `向きを変えた ${dir} の軸の大きい側の字が矢印の先の側に無い`).toBe(true);
      expect(near(at(small), start) < near(at(small), tip), `向きを変えた ${dir} の軸の小さい側の字が軸の始まりの側に無い`).toBe(true);
    }
  });

  it("matrix-chips-take-the-area-from-scores", () => {
    const rendered = render(parsed(CHIPS));
    expect(rendered.layout.shape, "見た目を書かない図が札を置く見た目でない").not.toBe("scatter");
    const motion = motionFrom(rendered as unknown as Rendered);
    const areaOf = new Map((rendered.layout.areas ?? []).map((a) => [a.id, a]));
    for (const [id, area] of Object.entries(AREA_OF)) {
      const span = rendered.timeline.steps[STEP_OF[id] as number] as Span;
      const group = motion.doc.querySelector(`[data-matrix-item="${id}"]`);
      const rect = group?.querySelector("rect");
      const box = areaOf.get(area);
      expect(group && rect && box, `札を置く見た目で ${id} の札か区画 ${area} が無い`).toBeTruthy();
      if (!group || !rect || !box) continue;
      const [dx = 0, dy = 0] = motion.value(group, "transform", span.end - 0.05) ?? [];
      const n = (name: string): number => Number(rect.getAttribute(name));
      const card = { x: n("x") + dx, y: n("y") + dy, w: n("width"), h: n("height") };
      const inside = card.x >= box.x - 0.5 && card.y >= box.y - 0.5 && card.x + card.w <= box.x + box.w + 0.5 && card.y + card.h <= box.y + box.h + 0.5;
      expect(inside, `札を置く見た目で ${id} の札が点数の区画 ${area} に入らない`).toBe(true);
    }
  });

  it("scatter-merges-items-at-the-same-score", () => {
    const { rendered, motion, dots } = renderScatter(SCATTER);
    // 文言の直しと同じ点数の課題は 1 つの点にまとまり、打った段の順に並ぶ
    const shared = dots.filter((d) => d.ids.includes("word") || d.ids.includes("twin"));
    expect(shared.map((d) => d.ids), "同じ点数の 2 つの課題の点").toEqual([["word", "twin"]]);
    expect(dots.length, "打った点の数").toBe(Object.keys(SCORES).length - 1);
    const el = dotOf(motion, "twin");
    expect(el, "同じ点数の課題の点の部品が描いた図に無い").toBeDefined();
    expect(el?.querySelectorAll("circle").length ?? 0, "同じ点数の 2 つの課題の点の部品が丸を 1 つだけ持たない").toBeGreaterThan(0);
    expect(motion.doc.querySelectorAll("[data-matrix-dot]").length, "点の部品の数").toBe(Object.keys(SCORES).length - 1);
    const first = textIn(el, "文言の直し");
    const second = textIn(el, "同じ点数の課題");
    expect(first && second, "まとめた点の部品に 2 つの課題の名前が無い").toBeTruthy();
    if (!first || !second) return;
    // 後の段で打った名前は前の名前の下に足し、打つ段より前には見えない
    expect(Number(second.getAttribute("y")), "後の段で打った名前が前の名前の下に無い").toBeGreaterThan(Number(first.getAttribute("y")));
    const steps = rendered.timeline.steps;
    const twin = STEP_OF.twin as number;
    expect(motion.opacity(second, middle(steps[twin - 1] as Span)), "後の段で打つ名前が打つ段より前に見える").toBeLessThan(0.1);
    expect(motion.opacity(second, (steps[twin] as Span).end - 0.05), "後の段で打った名前が打った段の終わりに見えない").toBeGreaterThan(0.5);
  });

  it("scatter-table-lists-items-with-scores", () => {
    const { rendered, motion, plot } = renderScatter(SCATTER);
    const { layout, timeline } = rendered;
    const table = layout.table;
    expect(table, "並べた図に置く前の課題の表 (layout.table) が無い").toBeDefined();
    if (!table) return;
    expect(table.x + table.w <= plot.x, "置く前の課題の表が点の図の左に無い").toBe(true);
    expect(motion.doc.querySelector("[data-matrix-table]"), "置く前の課題の表の部品 ([data-matrix-table]) が描いた図に無い").not.toBeNull();
    const rows = layout.rows ?? [];
    // 表の行は項目を書いた順に上から並べ、項目の名前と 2 つの点数を持つ
    expect(rows.map((r) => r.id), "置く前の課題の表の行").toEqual(Object.keys(SCORES));
    const names = parsed(SCATTER).matrix?.items ?? [];
    for (const [k, row] of rows.entries()) {
      expect(row.x >= table.x - 0.5 && row.x + row.w <= table.x + table.w + 0.5 && row.y >= table.y - 0.5 && row.y + row.h <= table.y + table.h + 0.5, `表の行 ${row.id} が表の中に無い`).toBe(true);
      const next = rows[k + 1];
      if (next) expect(row.y + row.h <= next.y + 0.5, `表の行 ${row.id} の下に次の行 ${next.id} が無い`).toBe(true);
      const el = motion.doc.querySelector(`[data-matrix-row="${row.id}"]`);
      expect(el, `表の行 ${row.id} の部品 ([data-matrix-row]) が描いた図に無い`).not.toBeNull();
      const item = names.find((i) => i.id === row.id);
      for (const word of [item?.name ?? "", String(item?.x), String(item?.y)]) expect(textIn(el, word), `表の行 ${row.id} に ${word} が無い`).toBeDefined();
      // 段で打つ項目の行は、その段だけ光る
      const glow = motion.doc.querySelector(`[data-matrix-row-glow="${row.id}"]`);
      expect(glow, `表の行 ${row.id} を光らせる部品 ([data-matrix-row-glow]) が描いた図に無い`).not.toBeNull();
      if (!glow) continue;
      const step = STEP_OF[row.id] as number;
      expect(motion.opacity(glow, (timeline.steps[step] as Span).end - 0.05), `表の行 ${row.id} が打つ段の終わりに光っていない`).toBeGreaterThan(0.5);
      expect(motion.opacity(glow, middle(timeline.steps[0] as Span)), `表の行 ${row.id} が最初の段に光る`).toBeLessThan(0.1);
    }
  });

  it("scatter-table-none-draws-the-plot-alone", () => {
    const withTable = renderScatter(SCATTER);
    const alone = renderScatter(NO_TABLE);
    expect(alone.rendered.layout.table, "table: none の図が置く前の課題の表を並べる").toBeUndefined();
    expect(alone.motion.doc.querySelector("[data-matrix-table]"), "table: none の図が置く前の課題の表の部品を描く").toBeNull();
    // 表の分の幅を点の図に回し、点の図を表の在る図より広く描く
    expect(alone.plot.w, "table: none の図の点の図が表の在る図より広くない").toBeGreaterThan(withTable.plot.w);
    expect(alone.plot.x, "table: none の図の点の図が表の在る図より左から始まらない").toBeLessThan(withTable.plot.x);
  });

  it("scatter-stacks-table-above-plot-at-phone-width", () => {
    const { rendered, plot } = renderScatter(SCATTER, "ja", 390);
    const table = rendered.layout.table;
    expect(table, "幅 390 の図に置く前の課題の表が無い").toBeDefined();
    if (!table) return;
    // 表を上に置き、点の図を幅いっぱいに下へ積む
    expect(table.y + table.h <= plot.y, "幅 390 の図で置く前の課題の表が点の図の上に無い").toBe(true);
    for (const [where, rect] of [
      ["置く前の課題の表", table],
      ["点の図", plot],
    ] as const) {
      expect(rect.x >= 0 && rect.x + rect.w <= 390, `幅 390 の図で${where}が幅に収まらない`).toBe(true);
    }
    expect(plot.w, "幅 390 の図で点の図が幅いっぱいでない").toBeGreaterThanOrEqual(260);
  });
});

describe("点数で点を打つ見た目の見本と雛形 (#3637)", () => {
  it("scatter-examples-in-both-langs-have-no-breaks", () => {
    const sources: Partial<Record<Lang, Source>> = {};
    for (const lang of LANGS) {
      const file = `${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`;
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text === undefined) continue;
      // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
      expect(text.split("\n")[0] ?? "", `${file} の最初の行`).toMatch(/^\/\/ /u);
      expect(/#\d+/u.test(text.split("\n")[0] ?? ""), `${file} の最初の注釈の行に作業の番号がある`).toBe(false);
      const source = parsed(text, lang, file);
      sources[lang] = source;
      expect(source.kind, `${file} の図の種類`).toBe("matrix");
      expect(source.matrix?.shape, `${file} の見た目`).toBe("scatter");
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
      const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
      expect(problems, `${file} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, 390]) renderScatter(text, lang, width);
    }
    if (sources.ja && sources.en) {
      const shape = (d: Source): Json => ({ items: (d.matrix?.items ?? []).map((i) => [i.id, i.x ?? null, i.y ?? null]), steps: d.steps.map((s) => s.events.length) }) as Json;
      expect(shape(sources.en), `${SAMPLE} の英語版の項目と点数と段ごとの行の数が日本語版と違う`).toEqual(shape(sources.ja));
    }
    // 見本帳の見本の一覧に載り、2つの軸で置く図の頁に並ぶ
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
    expect(samplesOf("matrix"), `見本帳の matrix の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS) {
      expect(exampleText(SAMPLE, lang), `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
  });

  it("scatter-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、点数で点を打つ見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^matrix <[^>]+> \[shape: scatter\]$/u.test(line)), `棚の記法の早見 (${lang}) に matrix の点数で点を打つ見た目の頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      // 図の種類の見本の束に点数で点を打つ見た目の見本が在り、雛形を誤り無く読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "matrix");
      expect(group, `棚の見本の束 (${lang}) に matrix の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の matrix の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      const source = parsed(exampleText(SAMPLE, lang) ?? "", lang, `棚の雛形 ${SAMPLE} (${lang})`);
      expect(source.matrix?.shape, `棚の雛形 ${SAMPLE} (${lang}) の見た目`).toBe("scatter");
    }
  });
});

describe("点数で点を打つ見た目の軽い入口 (#3637)", () => {
  it("scatter-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(SCATTER)};`,
      "await light.loadFor(text);",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.shape = drawn.layout.shape;",
      "  out.dots = (drawn.svg.match(/data-matrix-dot=/g) ?? []).length;",
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
    expect(failure, "軽い入口で点数で点を打つ見た目を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { ok?: boolean; errors?: unknown[]; shape?: string; dots?: number; same?: boolean };
    expect(out.ok, `軽い入口で loadFor を待った後に点数で点を打つ見た目を読めない: ${JSON.stringify(out.errors)}`).toBe(true);
    expect(out.shape, "軽い入口で描いた図の見た目").toBe("scatter");
    expect(out.dots, "軽い入口で描いた点の部品の数").toBe(Object.keys(SCORES).length - 1);
    expect(out.same, "軽い入口と既定の入口で描いた点数で点を打つ見た目が違う").toBe(true);
  });
});

describe("点数で点を打つ見た目の書き方の文書 (#3637)", () => {
  it("scatter-docs-describe-the-look", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const head = /matrix (<[^>]+>|[^\s`]+) \[shape: scatter\]/u;
    const scores = /\[x: (<[^>]+>|[\d.]+), y: (<[^>]+>|[\d.]+)\]/u;
    const reverse = /reverse: yes/u;
    const plotLine = /line: (<[^>]+>|[^\s`]+)/u;
    const scatterFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).matrix?.shape === "scatter";
      }).length;
    for (const path of ["packages/dragon/README.md", "packages/dragon/README.ja.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に matrix <題> [shape: scatter] の書き方が無い`).toBe(true);
      expect(scores.test(text), `${path} に項目の点数 ([x: <横>, y: <縦>]) の書き方が無い`).toBe(true);
      expect(reverse.test(text), `${path} に軸の向きを変える reverse: yes の書き方が無い`).toBe(true);
      expect(plotLine.test(text), `${path} に区画を書かずに打つ line: <項目> の書き方が無い`).toBe(true);
      expect(scatterFences(text), `${path} に点数で点を打つ見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["matrix.dragon", "matrix.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    for (const [what, pattern] of [
      ["matrix <題> [shape: scatter]", head],
      ["項目の点数", scores],
      ["reverse: yes", reverse],
      ["line: <項目>", plotLine],
    ] as const) {
      expect(pattern.test(page), `使い方の頁に ${what} の書き方が無い`).toBe(true);
    }
  });
});

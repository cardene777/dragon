// @vitest-environment jsdom
/**
 * 量の行き先の図 (#3626)。
 *
 * 1 つの量がどこへどれだけ分かれるかを段で追う図。原本の JSON の `kind` は `sankey` で、出どころと行き先は段より前の `box` で宣言する。
 * 段の中の `<出どころ> -> <行き先>: <量>` の線を書くと、その段でその帯が伸び、量の札が帯を渡る。
 * 出どころの無い箱を左の列に置き、行き先を出どころの右の列へ置く。線の名前の初めの数 (`40%` の 40、`1,200円` の 1200) を量として読み、
 * 帯の幅を同じ出どころの量に比べて決める。見た目の元は step 2 で本人が選んだ動く試作の案A (全量の棒から幅を保った帯が右へ枝分かれする)。
 *
 * 置き場所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめ、帯と棒の出方は SVG の keyframes を jsdom で読んで確かめる。
 * 見本の file と量の行き先の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
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

/** 量の行き先の図の見本 4 枚 (#3626 の「決まっていること」) */
const SANKEY_EXAMPLES = ["token-allocation", "fee-split", "salary", "revenue"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Point = [number, number];

/** 量の棒。`column` は左から数えた列 (0 から)、`amount` は棒が表す量 */
interface SankeyNode extends Rect {
  id: string;
  name: string;
  column: number;
  amount: number;
}

/**
 * 量の帯。`a` は出どころの棒の右の縁での上と下、`b` は行き先の棒の左の縁での上と下。
 * `x1` は出どころの棒の右の縁、`x2` は行き先の棒の左の縁。`amount` は線の名前から読んだ量
 */
interface SankeyBand {
  from: string;
  to: string;
  step: number;
  event: number;
  amount: number;
  x1: number;
  x2: number;
  a: Point;
  b: Point;
}

interface SankeyLayout extends Omit<Layout, "boxes"> {
  kind: string;
  nodes?: SankeyNode[];
  bands?: SankeyBand[];
}

interface SankeyRendered extends Omit<Rendered, "layout"> {
  layout: SankeyLayout;
}

interface SourceEvent {
  type: string;
  from?: string;
  to?: string;
  label?: string;
}

interface Source {
  kind: string;
  title: string;
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
  expect(read.ok, `量の行き先の図の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: "ja" | "en"): SankeyRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "量の行き先の図を描けない").toBe("");
  const layout = (rendered as unknown as SankeyRendered | undefined)?.layout;
  expect(layout?.kind, "描いた図が量の行き先の図 (sankey) でない").toBe("sankey");
  expect(layout?.nodes, "並べた量の行き先の図に量の棒 (layout.nodes) が無い").toBeDefined();
  expect(layout?.bands, "並べた量の行き先の図に量の帯 (layout.bands) が無い").toBeDefined();
  return rendered as unknown as SankeyRendered;
}

const nodeOf = (layout: SankeyLayout, id: string): SankeyNode => {
  const node = (layout.nodes ?? []).find((n) => n.id === id);
  expect(node, `${id} の棒が並べた図に無い`).toBeDefined();
  return node as SankeyNode;
};

/** 3 つの段で全量を配り、4 つ目の段で行き先の 1 つをさらに分ける、書き戻した形の小さな記法 */
const SMALL = [
  "sankey 小さな配り先",
  "",
  "box total as 全量",
  "box comm as 仲間",
  "box team as 作った人",
  "box fund as 蓄え",
  "box rew as 報酬",
  "box don as 寄付",
  "",
  "step 作る",
  "  say 全量を作る。",
  "",
  "step 仲間へ回す",
  "  say 全量の40%を仲間へ回す。",
  "  total -> comm: 40%",
  "",
  "step 残りを回す",
  "  say 残りを作った人と蓄えへ回す。",
  "  total -> team: 35%",
  "  total -> fund: 25%",
  "",
  "step 仲間の分を分ける",
  "  say 仲間の40%を報酬と寄付に分ける。",
  "  comm -> rew: 25%",
  "  comm -> don: 15%",
  "",
].join("\n");

const flow = (from: string, to: string, label: string): Json => ({ type: "edge", from, to, label, carry: { kind: "envelope" } });

/** SMALL と同じ図の原本 (版2) */
function smallSankey(): Json {
  return {
    version: 2,
    kind: "sankey",
    title: "小さな配り先",
    blocks: {
      box: [
        { id: "total", name: "全量" },
        { id: "comm", name: "仲間" },
        { id: "team", name: "作った人" },
        { id: "fund", name: "蓄え" },
        { id: "rew", name: "報酬" },
        { id: "don", name: "寄付" },
      ],
    },
    steps: [
      { title: "作る", body: "全量を作る。", events: [] },
      { title: "仲間へ回す", body: "全量の40%を仲間へ回す。", events: [flow("total", "comm", "40%")] },
      { title: "残りを回す", body: "残りを作った人と蓄えへ回す。", events: [flow("total", "team", "35%"), flow("total", "fund", "25%")] },
      { title: "仲間の分を分ける", body: "仲間の40%を報酬と寄付に分ける。", events: [flow("comm", "rew", "25%"), flow("comm", "don", "15%")] },
    ],
  };
}

/** 箱 `ids` を宣言し、1 つの段に線 `lines` を書いた記法 */
const linesText = (ids: readonly string[], lines: readonly string[]): string =>
  ["sankey 小さな流れ", ...ids.map((id) => `box ${id}`), "step 流す", "  say 流す。", ...lines.map((line) => `  ${line}`)].join("\n");

/** 誤りを返して読まないことを確かめ、最初の誤りを返す。日本語と英語の両方で確かめる */
function refused(text: string, what: string): Record<"ja" | "en", LineError | undefined> {
  const parse = api("parseNotation");
  const out = { ja: undefined, en: undefined } as Record<"ja" | "en", LineError | undefined>;
  for (const lang of ["ja", "en"] as const) {
    const read = parse(text, { lang });
    expect(read.ok, `${what} を書いた量の行き先の図が読めてしまう (${lang})`).toBe(false);
    const first: LineError | undefined = read.ok ? undefined : read.errors[0];
    const message = first?.message ?? "";
    expect(message, `${what} の誤りの文 (${lang})`).not.toBe("");
    if (lang === "en") expect(KANA.test(message), `${what} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
    else expect(KANA.test(message), `${what} の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
    out[lang] = first;
  }
  return out;
}

describe("量の行き先の図の原本の JSON (#3626)", () => {
  it("schema-accepts-sankey-diagram", () => {
    const validate = api("validateDiagram");
    for (const lang of ["ja", "en"] as const) {
      const checked = validate(smallSankey(), { lang });
      expect(checked.ok, `最小の量の行き先の図が検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    }
  });
});

describe("量の行き先の図の記法 (#3626)", () => {
  it("sankey-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    // 書き戻した形の記法は、読んで書き戻すと 1 字も変わらない
    expect(print(parsed(SMALL)), "小さな量の行き先の図を読んで書き戻した記法が元と違う").toBe(SMALL);
    // 記法から作った原本は、原本の JSON と同じ
    expect(parsed(SMALL), "小さな量の行き先の図の記法から作った原本").toEqual(smallSankey());
    for (const key of SANKEY_EXAMPLES) {
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        const diagram = parsed(text, lang);
        expect((diagram as unknown as Source).kind, `${file} の図の種類`).toBe("sankey");
        expect(print(diagram), `${file} を読んで書き戻した記法が元 (最初の注釈を除く) と違う`).toBe(withoutComments(text));
      }
    }
  });

  it("sankey-rejects-a-label-without-an-amount", () => {
    const parse = api("parseNotation");
    const ids = ["a", "b", "c"];
    /** 最初の線の前の行の数 (頭の行、箱の行、step と say の行) */
    const n = ids.length + 3;
    // 線の名前が数で始まらない線は、線の名前の初めの字を指して止める
    for (const label of ["たくさん", "約40%", "-5", "%40", "a lot"]) {
      const line = `a -> b: ${label}`;
      const first = refused(linesText(ids, [line]), `線の名前が ${label} の線`);
      for (const lang of ["ja", "en"] as const) {
        const got = first[lang];
        const full = `  ${line}`;
        expect(got && { line: got.line, column: got.column }, `線の名前が ${label} の線の誤りの行と列 (${lang}): ${got?.message}`).toEqual({ line: n + 1, column: full.indexOf(label, full.indexOf(":")) + 1 });
      }
    }
    // 線の名前の無い線も止める
    const bare = refused(linesText(ids, ["a -> b"]), "線の名前の無い線");
    expect(bare.ja?.line, `線の名前の無い線の誤りの行: ${bare.ja?.message}`).toBe(n + 1);
    // 数で始まる線の名前は、後ろに単位や言葉が続いても量として読む
    for (const label of ["40%", "1,200円", "2.5億トークン", "3", "0.5 ETH"]) {
      const read = parse(linesText(ids, [`a -> b: ${label}`]));
      expect(read.ok, `線の名前が ${label} の線が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("sankey-rejects-a-line-that-flows-back", () => {
    const parse = api("parseNotation");
    const ids = ["a", "b", "c", "d"];
    const n = ids.length + 3;
    /** 線 `lines` の最後の線が前の列の箱へ戻る線として、受ける側の名札を指して止まる */
    const cases: [string, string[]][] = [
      ["行き先から出どころへ戻る線", ["a -> b: 10", "b -> a: 5"]],
      ["2 つ前の列の箱へ戻る線", ["a -> b: 10", "b -> c: 5", "c -> a: 2"]],
      ["同じ箱へ戻る線", ["a -> b: 10", "b -> b: 2"]],
      ["後から書いた線で前の列へ戻る線", ["b -> c: 5", "a -> b: 10", "c -> b: 1"]],
    ];
    for (const [name, lines] of cases) {
      const last = `  ${lines[lines.length - 1]}`;
      const to = last.trim().split(/\s+/u)[2]?.replace(/:$/u, "") as string;
      const want = { line: n + lines.length, column: last.indexOf(to, last.indexOf("->")) + 1 };
      const first = refused(linesText(ids, lines), name);
      for (const lang of ["ja", "en"] as const) {
        const got = first[lang];
        expect(got && { line: got.line, column: got.column }, `${name} の誤りの行と列 (${lang}): ${got?.message}`).toEqual(want);
      }
    }
    // 列を飛ばして右の列へ進む線と、2 つの出どころから同じ行き先へ入る線は受ける
    const read = parse(linesText(ids, ["a -> b: 10", "b -> c: 4", "a -> c: 3", "d -> c: 2"]));
    expect(read.ok, `右の列へ進む線だけの図が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  });

  it("sankey-rejects-outflow-larger-than-inflow", () => {
    const parse = api("parseNotation");
    const ids = ["a", "b", "c", "d", "x"];
    const n = ids.length + 3;
    /** 最後に足した出る量で、入る量の和を越える線を指して止まる。出る量の和と入る量の和を文に出す */
    const cases: [string, string[], number, [number, number]][] = [
      ["出る量の和が入る量より大きい箱", ["a -> b: 10", "b -> c: 6", "b -> d: 5"], 3, [11, 10]],
      ["入る量を後に書いた箱", ["b -> c: 6", "b -> d: 5", "a -> b: 10"], 2, [11, 10]],
      ["2 つの出どころから入る箱", ["a -> b: 6", "x -> b: 5", "b -> c: 12"], 3, [12, 11]],
    ];
    for (const [name, lines, at, [out, inflow]] of cases) {
      const line = `  ${lines[at - 1]}`;
      const amount = line.slice(line.indexOf(": ") + 2);
      const first = refused(linesText(ids, lines), name);
      for (const lang of ["ja", "en"] as const) {
        const got = first[lang];
        expect(got && { line: got.line, column: got.column }, `${name} の誤りの行と列 (${lang}): ${got?.message}`).toEqual({ line: n + at, column: line.indexOf(amount, line.indexOf(":")) + 1 });
        const message = got?.message ?? "";
        expect(message.includes(String(out)) && message.includes(String(inflow)), `${name} の誤りの文 (${lang}) が出る量の和 ${out} と入る量の和 ${inflow} を示さない: ${message}`).toBe(true);
      }
    }
    // 出る量の和が入る量の和と同じか小さい箱と、出どころの無い箱は受ける
    for (const lines of [
      ["a -> b: 10", "b -> c: 6", "b -> d: 4"],
      ["a -> b: 6", "x -> b: 5", "b -> c: 11"],
      ["a -> b: 10", "b -> c: 3"],
      ["a -> b: 1,200", "a -> c: 800"],
    ]) {
      const read = parse(linesText(ids, lines));
      expect(read.ok, `出る量が入る量に収まる図 (${lines.join(" / ")}) が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    }
  });

  it("notation-keeps-sankey-words-plain-outside-sankey", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [`${kind} 量の語の名札`, "box sankey as 量", "box db", "step 送る", "  say 送る。", "  sankey -> db: 送る", "  db -> sankey: 戻す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind} で sankey を名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["sankey", "db"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind} の sankey から出る線と入る線`).toEqual([
        { type: "edge", from: "sankey", to: "db" },
        { type: "edge", from: "db", to: "sankey" },
      ]);
    }
  });
});

describe("量の行き先の図の並べ方と動き (#3626)", () => {
  it("sankey-columns-follow-the-flow", () => {
    const cases: [string, Json, Record<string, number>][] = [
      ["小さな配り先", parsed(SMALL), { total: 0, comm: 1, team: 1, fund: 1, rew: 2, don: 2 }],
      // 列を飛ばす線の行き先は、最も長い道の先の列に置く。出どころの無い箱は全て左の列
      ["列を飛ばす線", parsed(linesText(["a", "b", "c", "x"], ["a -> b: 10", "b -> c: 4", "a -> c: 3", "x -> c: 2"])), { a: 0, x: 0, b: 1, c: 2 }],
      // 行き先を先に宣言し、線を後ろの列から書いても、列は線の向きで決まる
      ["後ろから書いた線", parsed(linesText(["c", "b", "a"], ["b -> c: 4", "a -> b: 10"])), { a: 0, b: 1, c: 2 }],
    ];
    for (const key of SANKEY_EXAMPLES) {
      const text = fileText(`${key}.dragon`);
      expect(text, `${key}.dragon が packages/dragon/examples に無い`).toBeDefined();
      if (text !== undefined) cases.push([`${key}.dragon`, parsed(text), {}]);
    }
    for (const [name, diagram, want] of cases) {
      const source = diagram as unknown as Source;
      const { layout } = render(diagram);
      const nodes = layout.nodes ?? [];
      expect(nodes.map((n) => n.id).sort(), `${name} の量の棒`).toEqual((source.blocks.box ?? []).map((b) => b.id).sort());
      if (Object.keys(want).length > 0) expect(Object.fromEntries(nodes.map((n) => [n.id, n.column])), `${name} の箱の列`).toEqual(want);
      // 入る線の無い箱は左の列、行き先は出どころより右の列
      const edges = source.steps.flatMap((s) => s.events.filter((e) => e.type === "edge"));
      for (const node of nodes) {
        const inflow = edges.filter((e) => e.to === node.id);
        if (inflow.length === 0) expect(node.column, `${name} の出どころの無い ${node.id} が左の列に無い`).toBe(0);
        for (const e of inflow) expect(node.column, `${name} の ${e.from} -> ${node.id} の行き先が出どころより右の列に無い`).toBeGreaterThan(nodeOf(layout, e.from ?? "").column);
      }
      // 同じ列の棒は同じ横の所に並び、右の列ほど右に在る
      const columns = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
      const xs = columns.map((c) => nodes.filter((n) => n.column === c).map((n) => n.x));
      for (const [i, list] of xs.entries()) expect(Math.max(...list) - Math.min(...list), `${name} の列 ${columns[i]} の棒の横の所が揃わない`).toBeLessThan(0.5);
      for (let i = 1; i < xs.length; i++) expect((xs[i] as number[])[0], `${name} の列 ${columns[i]} が左の列より右に無い`).toBeGreaterThan((xs[i - 1] as number[])[0] as number);
      // 帯は出どころの棒の右の縁から行き先の棒の左の縁まで伸びる
      for (const band of layout.bands ?? []) {
        const from = nodeOf(layout, band.from);
        const to = nodeOf(layout, band.to);
        expect(Math.abs(band.x1 - (from.x + from.w)), `${name} の ${band.from} -> ${band.to} の帯が出どころの棒の右の縁から始まらない`).toBeLessThan(0.5);
        expect(Math.abs(band.x2 - to.x), `${name} の ${band.from} -> ${band.to} の帯が行き先の棒の左の縁で終わらない`).toBeLessThan(0.5);
      }
    }
  });

  it("sankey-band-width-follows-the-amount", () => {
    const sources: [string, Json][] = [["小さな配り先", parsed(SMALL)]];
    for (const key of SANKEY_EXAMPLES) {
      const text = fileText(`${key}.dragon`);
      expect(text, `${key}.dragon が packages/dragon/examples に無い`).toBeDefined();
      if (text !== undefined) sources.push([`${key}.dragon`, parsed(text)]);
    }
    for (const [name, diagram] of sources) {
      const { layout } = render(diagram);
      const bands = layout.bands ?? [];
      expect(bands.length, `${name} に量の帯が無い`).toBeGreaterThan(0);
      for (const node of layout.nodes ?? []) {
        const out = bands.filter((b) => b.from === node.id);
        const inflow = bands.filter((b) => b.to === node.id);
        // 帯の幅は出どころの棒の高さを量で割った幅で、出どころの棒の上から書いた順に積む
        let top = node.y;
        for (const band of out) {
          const width = band.a[1] - band.a[0];
          expect(Math.abs(width - (node.h * band.amount) / node.amount), `${name} の ${band.from} -> ${band.to} の帯の幅が量 ${band.amount} / ${node.amount} に比例しない`).toBeLessThan(0.5);
          expect(Math.abs(band.b[1] - band.b[0] - width), `${name} の ${band.from} -> ${band.to} の帯の幅が行き先で変わる`).toBeLessThan(0.5);
          expect(Math.abs(band.a[0] - top), `${name} の ${band.from} -> ${band.to} の帯が出どころの棒に書いた順に積まれない`).toBeLessThan(0.5);
          top = band.a[1];
        }
        // 出る量を全て書いた出どころは、行き先の帯の幅の和が出どころの棒の高さと等しい
        const outSum = out.reduce((s, b) => s + b.amount, 0);
        if (out.length > 0 && Math.abs(outSum - node.amount) < 1e-9)
          expect(Math.abs(out.reduce((s, b) => s + (b.a[1] - b.a[0]), 0) - node.h), `${name} の ${node.id} から出る帯の幅の和が棒の高さと違う`).toBeLessThan(0.5);
        // 行き先の棒の高さは入る帯の幅の和で、帯は棒の左の縁に収まる
        if (inflow.length > 0) {
          expect(Math.abs(inflow.reduce((s, b) => s + (b.b[1] - b.b[0]), 0) - node.h), `${name} の ${node.id} に入る帯の幅の和が棒の高さと違う`).toBeLessThan(0.5);
          for (const band of inflow) expect(band.b[0] >= node.y - 0.5 && band.b[1] <= node.y + node.h + 0.5, `${name} の ${band.from} -> ${band.to} の帯が行き先の棒の縁からはみ出す`).toBe(true);
        }
      }
    }
    // 線の名前の初めの数を量として読む。桁の区切りの `,` は外し、後ろの単位は読まない
    const { layout } = render(parsed(linesText(["a", "b", "c", "d"], ["a -> b: 1,200円", "a -> c: 800円", "b -> d: 2.5億"])));
    const amounts = Object.fromEntries((layout.bands ?? []).map((b) => [`${b.from}>${b.to}`, b.amount]));
    expect(amounts, "線の名前から読んだ量").toEqual({ "a>b": 1200, "a>c": 800, "b>d": 2.5 });
    expect(nodeOf(layout, "a").amount, "出どころの無い箱の量は出る量の和").toBe(2000);
    expect(nodeOf(layout, "b").amount, "行き先の量は入る量の和").toBe(1200);
    const width = (from: string, to: string): number => {
      const band = (layout.bands ?? []).find((b) => b.from === from && b.to === to);
      return band ? band.a[1] - band.a[0] : 0;
    };
    expect(Math.abs(width("a", "b") / width("a", "c") - 1.5), "1,200円と800円の帯の幅の比").toBeLessThan(0.01);
  });

  it("sankey-band-grows-at-its-step", () => {
    const sources: [string, Json][] = [["小さな配り先", parsed(SMALL)]];
    const token = fileText("token-allocation.dragon");
    expect(token, "token-allocation.dragon が packages/dragon/examples に無い").toBeDefined();
    if (token !== undefined) sources.push(["token-allocation", parsed(token)]);
    for (const [name, diagram] of sources) {
      const source = diagram as unknown as Source;
      const rendered = render(diagram);
      const { layout, timeline } = rendered;
      // 動きを読む部品は SVG と時刻の表だけを読み、並べ方の形を見ない
      const motion = motionFrom(rendered as unknown as Rendered);
      /** 部品が時刻 `t` に見えている濃さ。部品の中に動く部品が在れば、そのうち最も濃いもの。動かない部品はそのままの濃さ */
      const shown = (el: Element, t: number): number => {
        const moving = [...(el.matches(".dg-a") ? [el] : []), ...el.querySelectorAll(".dg-a")];
        return moving.length === 0 ? motion.opacity(el, t) : Math.max(...moving.map((x) => motion.opacity(x, t)));
      };
      const last = timeline.steps[timeline.steps.length - 1] as Span;
      const first = timeline.steps[0] as Span;
      const edges = source.steps.flatMap((step, s) => step.events.flatMap((e, i) => (e.type === "edge" ? [{ ...e, step: s, event: i }] : [])));
      expect(edges.length, `${name} に段の中の線が無い`).toBeGreaterThan(0);
      // 出どころの無い箱の棒は最初の段から出ている
      for (const node of layout.nodes ?? []) {
        if (edges.some((e) => e.to === node.id)) continue;
        const bar = motion.doc.querySelector(`[data-node="${node.id}"]`);
        expect(bar, `${name} の ${node.id} の棒の部品 ([data-node]) が描いた図に無い`).not.toBeNull();
        if (bar) expect(shown(bar, (first.start + first.end) / 2), `${name} の出どころの無い ${node.id} の棒が最初の段に出ていない`).toBeGreaterThan(0.9);
      }
      for (const e of edges) {
        const span = timeline.steps[e.step] as Span;
        const what = `${name} の段 ${e.step + 1} の ${e.from} -> ${e.to}`;
        // 帯はその段で伸び始め、後の段でも残る
        const band = motion.doc.querySelector(`[data-band="${e.from}>${e.to}"]`);
        expect(band, `${what} の帯の部品 ([data-band]) が描いた図に無い`).not.toBeNull();
        if (band) {
          if (e.step > 0) expect(shown(band, span.start - 0.05), `${what} の帯がその段より前から出ている`).toBeLessThan(0.1);
          expect(shown(band, span.end - 0.05), `${what} の帯がその段の終わりに出ていない`).toBeGreaterThan(0.9);
          expect(shown(band, (last.start + last.end) / 2), `${what} の帯が最後の段で残らない`).toBeGreaterThan(0.9);
        }
        // 行き先の棒は、入る帯が最初に伸びる段から出る
        const firstIn = edges.find((x) => x.to === e.to);
        const bar = motion.doc.querySelector(`[data-node="${e.to}"]`);
        expect(bar, `${what} の行き先の棒の部品 ([data-node]) が描いた図に無い`).not.toBeNull();
        if (bar && firstIn === e) {
          if (e.step > 0) expect(shown(bar, span.start - 0.05), `${what} の行き先の棒がその段より前から出ている`).toBeLessThan(0.1);
          expect(shown(bar, span.end - 0.05), `${what} の行き先の棒がその段の終わりに出ていない`).toBeGreaterThan(0.9);
        }
        // 量の札はその段の間に帯を出どころから行き先の側へ渡る
        const carrier = timeline.carriers.find((c) => c.step === e.step && c.event === e.event);
        expect(carrier, `${what} の量の札が走らない`).toBeDefined();
        if (!carrier) continue;
        expect(carrier.depart >= span.start - 1e-9 && carrier.arrive <= span.end + 1e-9 && carrier.arrive > carrier.depart, `${what} の量の札がその段の間に走らない`).toBe(true);
        expect(carrier.start, `${what} の量の札が前の段から見えている`).toBeGreaterThanOrEqual(span.start - 1e-9);
        expect(carrier.end, `${what} の量の札がその段の後も残る`).toBeLessThanOrEqual(span.end + 1e-9);
        const laid = layout.edges.find((l) => l.step === e.step && l.event === e.event);
        const points = (laid?.points ?? []) as Point[];
        const bandLaid = (layout.bands ?? []).find((b) => b.step === e.step && b.event === e.event);
        expect(points.length > 2 && bandLaid !== undefined, `${what} の量の札の道が帯に沿っていない`).toBe(true);
        if (bandLaid) {
          const xs = points.map((p) => p[0]);
          expect(xs.every((x, k) => x >= bandLaid.x1 - 0.5 && x <= bandLaid.x2 + 0.5 && (k === 0 || x > (xs[k - 1] as number))), `${what} の量の札が帯の上を左から右へ進まない`).toBe(true);
          const mid = (bandLaid.x1 + bandLaid.x2) / 2;
          expect((xs[0] as number) < mid && (xs[xs.length - 1] as number) > mid, `${what} の量の札が帯の出どころの側から行き先の側へ渡らない`).toBe(true);
          const top = Math.min(bandLaid.a[0], bandLaid.b[0]);
          const bottom = Math.max(bandLaid.a[1], bandLaid.b[1]);
          expect(points.every((p) => p[1] >= top - 0.5 && p[1] <= bottom + 0.5), `${what} の量の札の道が帯の上下からはみ出す`).toBe(true);
        }
        expect(rendered.svg.includes(`>${e.label ?? ""}</text>`), `${what} の量の札の字 ${e.label} が描いた図に無い`).toBe(true);
      }
    }
  });
});

describe("量の行き先の図の軽い入口 (#3626)", () => {
  it("sankey-light-entry-draws-after-load-for", () => {
    const code = [
      `const text = ${JSON.stringify(SMALL)};`,
      "out.before = light.kindLoaded('sankey');",
      "await light.loadFor(text);",
      "out.after = light.kindLoaded('sankey');",
      "const read = light.parseNotation(text);",
      "out.ok = read.ok;",
      "out.errors = read.ok ? [] : read.errors;",
      "if (read.ok) {",
      "  const drawn = light.renderDiagram(read.diagram);",
      "  out.kind = drawn.layout.kind;",
      "  out.bands = (drawn.svg.match(/data-band=/g) ?? []).length;",
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
    expect(failure, "軽い入口で量の行き先の図を読んで描く node が落ちる").toBe("");
    const out = JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}") as { before?: boolean; after?: boolean; ok?: boolean; errors?: unknown[]; kind?: string; bands?: number; same?: boolean };
    expect(out.before, "軽い入口が loadFor の前から量の行き先の図の描く部品を持つ (最初に読む塊に入っている)").toBe(false);
    expect(out.after, "軽い入口で loadFor を待っても量の行き先の図の描く部品を読まない").toBe(true);
    expect(out.ok, `軽い入口で loadFor を待った後に量の行き先の図を読めない: ${JSON.stringify(out.errors)}`).toBe(true);
    expect(out.kind, "軽い入口で描いた図の種類").toBe("sankey");
    expect(out.bands, "軽い入口で描いた量の行き先の図の帯の数").toBe(5);
    expect(out.same, "軽い入口と既定の入口で描いた量の行き先の図が違う").toBe(true);
  });
});

describe("量の行き先の図の書き方の文書 (#3626)", () => {
  it("sankey-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `sankey` と、段の中の量を書いた線の書き方 */
    const head = /(^|[\s`])sankey [^\s`]/mu;
    const amount = / -> (<[^>]+>|[^\s`:]+): (<量>|<amount>|\d)/u;
    const sankeyFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "sankey";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に sankey の行の書き方が無い`).toBe(true);
      expect(amount.test(text), `${path} に量を書いた線 (<出どころ> -> <行き先>: <量>) の書き方が無い`).toBe(true);
      if (path !== "README.md") expect(sankeyFences(text), `${path} に量の行き先の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に量の行き先の図が載る
    expect(/^\| Diagram kinds \|.*\bsankey diagram\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に sankey diagram が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"sankey"/u.test(content), "使い方の頁の節に量の行き先の図 (sankey) が無い").toBe(true);
    const sections = ["sankey.dragon", "sankey.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の量の行き先の図の節の例 (${i === 0 ? "sankey.dragon" : "sankey.en.dragon"}) が量の行き先の図として読めない`).toBe("sankey");
    }
    const blocks = join(PACKAGE, "src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に sankey の行の書き方が無い").toBe(true);
    expect(amount.test(page), "使い方の頁に量を書いた線の書き方が無い").toBe(true);
  });
});

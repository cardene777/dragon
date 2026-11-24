/**
 * `scatter-look.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { api, type Json } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Layout, type Rect, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/chart";
import "../src/kind-use/matrix";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/draw"), import("../src/check")]);

const ROOT = process.cwd();

const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** ブロックの置き場。書き方の文書の段落を読む。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

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

/** 区画の場所。左上が 0、右上が 1、左下が 2、右下が 3 */
interface Area extends Rect {
  id: string;
  name: string;
  spot: number;
  /** 区画の名前を置く所。`end` の名前は `x` を右の端にする */
  label?: { x: number; y: number; anchor: "start" | "end" };
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

// 後から読む塊は file を読み込む段で待つ。前処理で 25 ミリ秒ずつ見て待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", async () => {
  const { whenReady } = (await playgroundFile("site/later.ts")) as { whenReady: (chunk: typeof LATER_EXAMPLES) => Promise<unknown> };
  return whenReady(LATER_EXAMPLES);
});

beforeAll(() => {
  EXAMPLES_READY.get();
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
      const shape = (d: Source): Json => ({ items: (d.matrix?.items ?? []).map((i) => [i.id, i.x ?? null, i.y ?? null]), steps: d.steps.map((s) => s.events.length) });
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
    // 種類ごとの書き方は README から記法の手引きへ移した (#3881)
    for (const path of ["packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
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
    const blocks = BLOCKS;
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

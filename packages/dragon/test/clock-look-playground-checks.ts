/**
 * `clock-look.test.ts` から移した見本帳の確かめ (#3763)。
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
import "../src/kind-use/cycle";
import "../src/kind-use/sequence";
import "../src/kind-use/time";

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

/** 時計の文字盤の見た目の見本 (#3638 の受入条件) */
const SAMPLE = "focus-clock";

type Point = [number, number];

/** 手順の弧。`from` と `to` は 12 時を 0 にした度で、右回りの図は `to` が大きく、左回りの図は小さい */
interface Sector {
  id: string;
  from: number;
  to: number;
}

/** 文字盤の目盛りの数字。`value` は `unit` で数えた値、`angle` は 12 時を 0 にした度 */
interface Tick {
  value: number;
  text: string;
  angle: number;
}

/** 文字盤の外へ引き出す線。`from` は弧の側の端、`to` は外の端 */
interface Lead {
  id: string;
  from: Point;
  to: Point;
}

interface ListRow {
  id: string;
  number: string;
  name: string;
  time: string;
}

interface ClockLayout extends Omit<Layout, "boxes"> {
  kind: string;
  shape?: string;
  turn?: string;
  /** 文字盤の真ん中と、弧の帯の外の半径 `r` と内の半径 `inner` */
  ring?: { cx: number; cy: number; r: number; inner?: number };
  sectors?: Sector[];
  ticks?: Tick[];
  unit?: string;
  hand?: { r: number; angles: number[] };
  names?: (Rect & { id: string })[];
  leads?: Lead[];
  list?: Rect & { rows: ListRow[] };
  boxes: (Rect & { id: string })[];
}

interface ClockRendered extends Omit<Rendered, "layout"> {
  layout: ClockLayout;
}

interface Box {
  id: string;
  name: string;
  time?: string;
}

interface Source {
  kind: string;
  title: string;
  cycle?: { shape?: string; turn?: string };
  blocks: { box?: Box[]; strip?: { title: string; fields: string[] } };
  steps: { title: string; events: { type: string; from?: string; to?: string; carry?: { kind: string; text?: string }; field?: string; value?: string }[] }[];
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang = "ja", where = "記法"): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Source | Json, lang: Lang = "ja", width?: number): ClockRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "回り続ける図を描けない").toBe("");
  return rendered as unknown as ClockRendered;
}

interface Clock {
  rendered: ClockRendered;
  layout: ClockLayout;
  motion: Motion;
  ring: { cx: number; cy: number; r: number; inner: number };
  sectors: Sector[];
  hand: { r: number; angles: number[] };
}

/** 時計の文字盤の見た目の描いた図。並べ方の欄が無ければ名指して落とす */
function renderClock(text: string, lang: Lang = "ja", width?: number): Clock {
  const rendered = render(parsed(text, lang), lang, width);
  const { layout } = rendered;
  expect(layout.kind, "描いた図が回り続ける図 (cycle) でない").toBe("cycle");
  expect(layout.shape, "描いた図が時計の文字盤の見た目 (layout.shape) でない").toBe("clock");
  expect(layout.ring?.inner, "並べた図に文字盤の弧の帯の内の半径 (layout.ring.inner) が無い").toBeDefined();
  expect(layout.sectors, "並べた図に手順の弧 (layout.sectors) が無い").toBeDefined();
  expect(layout.ticks, "並べた図に目盛りの数字 (layout.ticks) が無い").toBeDefined();
  expect(layout.hand, "並べた図に針 (layout.hand) が無い").toBeDefined();
  const ring = layout.ring ?? { cx: 0, cy: 0, r: 0 };
  return {
    rendered,
    layout,
    motion: motionFrom(rendered as unknown as Rendered),
    ring: { cx: ring.cx, cy: ring.cy, r: ring.r, inner: ring.inner ?? 0 },
    sectors: layout.sectors ?? [],
    hand: layout.hand ?? { r: 0, angles: [] },
  };
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


describe("時計の文字盤の見た目の見本と雛形 (#3638)", () => {
  it("clock-examples-in-both-langs-have-no-breaks", () => {
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
      expect(source.kind, `${file} の図の種類`).toBe("cycle");
      expect(source.cycle?.shape, `${file} の見た目`).toBe("clock");
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
      const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
      expect(problems, `${file} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, 390]) renderClock(text, lang, width);
    }
    if (sources.ja && sources.en) {
      const shape = (d: Source): Json => ({ boxes: (d.blocks.box ?? []).map((b) => [b.id, b.time ?? null]), steps: d.steps.map((s) => s.events.length) });
      expect(shape(sources.en), `${SAMPLE} の英語版の手順と長さと段ごとの行の数が日本語版と違う`).toEqual(shape(sources.ja));
    }
    // 見本帳の見本の一覧に載り、回り続ける図の頁に並ぶ
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
    expect(samplesOf("cycle"), `見本帳の cycle の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS) {
      expect(exampleText(SAMPLE, lang), `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
  });

  it("clock-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、時計の文字盤の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^cycle <[^>]+> \[shape: clock\]$/u.test(line)), `棚の記法の早見 (${lang}) に cycle の文字盤の見た目の頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      // 図の種類の見本の束に文字盤の見た目の見本が在り、雛形を誤り無く読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "cycle");
      expect(group, `棚の見本の束 (${lang}) に cycle の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の cycle の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      const source = parsed(exampleText(SAMPLE, lang) ?? "", lang, `棚の雛形 ${SAMPLE} (${lang})`);
      expect(source.cycle?.shape, `棚の雛形 ${SAMPLE} (${lang}) の見た目`).toBe("clock");
    }
  });
});


describe("時計の文字盤の見た目の書き方の文書 (#3638)", () => {
  it("clock-docs-describe-the-look", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const head = /cycle (<[^>]+>|[^\s`]+) \[shape: clock(, turn: left)?\]/u;
    const time = /\[time: (<[^>]+>|[\d.]+(ms|s|min|h|d))\]/u;
    const turn = /turn: left/u;
    const clockFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).cycle?.shape === "clock";
      }).length;
    // 種類ごとの書き方は README から記法の手引きへ移した (#3881)
    for (const path of ["packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に cycle <題> [shape: clock] の書き方が無い`).toBe(true);
      expect(time.test(text), `${path} に手順の長さ ([time: <長さ>]) の書き方が無い`).toBe(true);
      expect(turn.test(text), `${path} に左回りにする turn: left の書き方が無い`).toBe(true);
      expect(clockFences(text), `${path} に時計の文字盤の見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["cycle.dragon", "cycle.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    for (const [what, pattern] of [
      ["cycle <題> [shape: clock]", head],
      ["手順の長さ [time: <長さ>]", time],
      ["turn: left", turn],
    ] as const) {
      expect(pattern.test(page), `使い方の頁に ${what} の書き方が無い`).toBe(true);
    }
  });
});

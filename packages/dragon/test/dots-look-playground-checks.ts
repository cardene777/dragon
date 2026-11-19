/**
 * `dots-look.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/chart";
import "../src/kind-use/venn";

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

/** 点で数える見た目の見本。一般の量の図 (1,000 人に聞いた端末) と、Web3 の集合の重なりの図 (ウォレットの住所 10,000 件) */
const SAMPLES = [
  { name: "device-dots", kind: "chart" },
  { name: "wallet-dots", kind: "venn" },
] as const;

interface SourceEvent {
  type: string;
  item?: string;
  sets?: string[];
  value?: number;
}

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string; unit?: number; items: { id: string }[] };
  venn?: { shape?: string; unit?: number };
  blocks: { circle?: { id: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang = "ja", where = "記法"): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Source | Json, lang: Lang = "ja", width?: number): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "点で数える見た目の図を描けない").toBe("");
  return rendered as Rendered;
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 描いた点。無ければ落とす */
function dotsOf(motion: Motion, where: string): Element[] {
  const dots = [...motion.doc.querySelectorAll("[data-dot]")];
  expect(dots.length, `${where} に点 ([data-dot]) が無い`).toBeGreaterThan(0);
  return dots;
}

/** 原本の項目と段と段ごとの数の行の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.chart?.shape ?? d.venn?.shape,
  items: (d.chart?.items ?? d.blocks.circle ?? []).map((i) => i.id),
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.length),
});

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});


describe("点で数える見た目の見本 (#3635)", () => {
  it("dots-examples-in-both-langs-have-no-breaks", () => {
    for (const { name, kind } of SAMPLES) {
      const sources: Partial<Record<Lang, Source>> = {};
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
        expect(text.split("\n")[0] ?? "", `${file} の最初の行`).toMatch(/^\/\/ /u);
        expect(/#\d+/u.test(text.split("\n")[0] ?? ""), `${file} の最初の注釈の行に作業の番号がある`).toBe(false);
        const source = parsed(text, lang, file);
        sources[lang] = source;
        expect(source.kind, `${file} の図の種類`).toBe(kind);
        expect(source.chart?.shape ?? source.venn?.shape, `${file} の見た目`).toBe("dots");
        // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
        const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
        expect(problems, `${file} の崩れの知らせ`).toEqual([]);
        for (const width of [undefined, 390]) dotsOf(motionFrom(render(source, lang, width)), `${file} を幅 ${width ?? "既定"} で描いた図`);
      }
      if (sources.ja && sources.en) expect(shapeOf(sources.en), `${name} の英語版の項目と段と段ごとの行の数が日本語版と違う`).toEqual(shapeOf(sources.ja));
      // 見本帳の見本の一覧に載り、その図の種類の頁に並ぶ
      expect(EXAMPLE_KEYS.includes(name), `${name} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      expect(samplesOf(kind), `見本帳の ${kind} の頁に ${name} が無い`).toContain(name);
      for (const lang of LANGS) {
        expect(exampleText(name, lang), `見本帳の ${name} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
      }
    }
  });

  it("dots-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、点で数える見た目の頭の行が量の図と集合の重なりの図の両方で在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      for (const kind of ["chart", "venn"]) {
        expect(
          kinds.some((line) => new RegExp(`^${kind} <[^>]+> \\[shape: dots\\]$`, "u").test(line)),
          `棚の記法の早見 (${lang}) に ${kind} の点で数える見た目の頭の行が無い: ${kinds.join(" / ")}`,
        ).toBe(true);
      }
      // 図の種類の見本の束に点で数える見た目の見本が在り、どの雛形も誤り無く点で数える見た目の図として読める
      for (const { name, kind } of SAMPLES) {
        const group = sampleGroups(lang, true).find((g) => g.kind === kind);
        expect(group, `棚の見本の束 (${lang}) に ${kind} の束が無い`).toBeDefined();
        const keys = group?.samples.map((s) => s.key) ?? [];
        expect(keys, `棚の ${kind} の束 (${lang}) に ${name} が無い`).toContain(name);
        if (!keys.includes(name)) continue;
        const source = parsed(exampleText(name, lang) ?? "", lang, `棚の雛形 ${name} (${lang})`);
        expect(source.chart?.shape ?? source.venn?.shape, `棚の雛形 ${name} (${lang}) の見た目`).toBe("dots");
      }
    }
  });
});


describe("点で数える見た目の書き方の文書 (#3635)", () => {
  it("dots-docs-describe-the-look", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 囲みのうち、読めて条件に合う物の数 */
    const fences = (text: string, ok: (source: Source, fence: string) => boolean): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && ok(read.diagram as unknown as Source, fence.source);
      }).length;
    const dots = (s: Source): boolean => (s.chart?.shape ?? s.venn?.shape) === "dots";
    const chartNone = (s: Source, source: string): boolean => s.kind === "chart" && /^\s*set none: /mu.test(source);
    for (const path of ["packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: dots\]/u.test(text), `${path} に [shape: dots] の書き方が無い`).toBe(true);
      expect(fences(text, dots), `${path} に点で数える見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
      expect(fences(text, chartNone), `${path} に set none を書いた量の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // AI の skill の量の図と集合の重なりの図の手引き
    for (const path of ["plugins/dragon/skills/dragon/references/kinds/chart.md", "plugins/dragon/skills/dragon/references/kinds/venn.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: dots\]/u.test(text), `${path} に [shape: dots] の書き方が無い`).toBe(true);
      expect(/\[unit: /u.test(text) || /unit: \d/u.test(text), `${path} に 1 点の件数 (unit) の書き方が無い`).toBe(true);
    }
    expect(/set none: /u.test(repoText("plugins/dragon/skills/dragon/references/kinds/chart.md")), "AI の skill の量の図の手引きに set none の書き方が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["chart.dragon", "chart.en.dragon", "venn.dragon", "venn.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(/\[shape: dots\]/u.test(page), "使い方の頁に [shape: dots] の書き方が無い").toBe(true);
    expect(/unit: /u.test(page), "使い方の頁に 1 点の件数 (unit) の書き方が無い").toBe(true);
    // 量の図の set none は、量の図の節の例か量の図の値のブロックの段落に書く。集合の重なりの図の set none の書き方では数えない
    const chartPage = [sections[0] ?? "", sections[1] ?? "", repoText("packages/dragon/src/blocks/chart-set/gallery/docs.ts")].join("\n");
    expect(/set none/u.test(chartPage), "使い方の頁の量の図に set none の書き方が無い").toBe(true);
  });
});

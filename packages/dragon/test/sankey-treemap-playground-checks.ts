/**
 * `sankey-treemap.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json } from "./diagram-support";
import { draw, type Rect, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/sankey";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([
  import("../src/render/draw"),
  import("../src/check"),
]);

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

/** 見本帳の見本と棚の雛形は、見本帳の部品から読む。型の検査に見本帳の file を入れないよう、path を字にして読み込みの時に引く */
const playgroundFile = (path: string): Promise<object> =>
  import(/* @vite-ignore */ join(ROOT, "apps/playground-spa/src", path));

const { EXAMPLE_KEYS, exampleText, LATER_EXAMPLES, sampleGroups, syntaxLines, samplesOf } =
  Object.assign(
    {},
    ...(await Promise.all(
      ["examples.ts", "editor/shelf-first.ts", "editor/shelf-items.ts", "catalog/catalog.ts"].map(
        playgroundFile,
      ),
    )),
  ) as Playground;

/** 面積で割る四角の見た目の見本。スマホの保存領域の内訳 */
const SAMPLE = "phone-storage";

/** 携帯の幅 */
const PHONE = 390;

interface Source {
  kind: string;
  title: string;
  sankey?: { shape?: string };
  blocks: { box?: { id: string; name: string; color?: string }[] };
  steps: {
    title: string;
    body?: string;
    events: { type: string; from?: string; to?: string; label?: string }[];
  }[];
}

/** 字の置き場所。`rect` は字の四角 */
interface TileText {
  text: string;
  x: number;
  y: number;
  rect: Rect;
}

/**
 * 区画。`id` は区画の名札で、箱の区画は箱の名札、出どころの無い箱の残りは `rest:<名札>:<段>`。`box` は区画が表す箱。
 * `kind` は箱の区画 (`box`) か残り (`rest`)。`step` は区画が現れる段、`until` は区画が消える段 (残りが切られた時)。
 * `split` は区画を子の区画に分けた段で、その段から区画は枠と名前の札 (`chip`) だけになる。`name` と `value` は区画の中に書く名前と量
 */
interface Tile extends Rect {
  id: string;
  box: string;
  kind: "box" | "rest";
  step: number;
  until?: number;
  split?: number;
  color: string;
  amount: number;
  name?: TileText;
  value?: TileText;
  chip?: TileText;
}

/** 切る線。`region` は線が割った四角、`step` は線を引く段 */
interface Cut {
  step: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  region: Rect;
}

/** 図の四角の下に並べる名前。`mark` は区画と同じ色の印の四角 */
interface TileName {
  id: string;
  color: string;
  mark: Rect;
  name: TileText;
}

interface TreemapLayout {
  kind: string;
  arrangement?: string;
  width: number;
  height: number;
  frame?: Rect;
  tiles?: Tile[];
  cuts?: Cut[];
  names?: TileName[];
  edges: unknown[];
}

interface TreemapRendered extends Omit<Rendered, "layout"> {
  layout: TreemapLayout;
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string =>
  existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "";

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): TreemapRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "面積で割る四角の見た目の量の行き先の図を描けない").toBe("");
  return rendered as unknown as TreemapRendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok
    ? read.diagram
    : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 面積で割る四角の置き場所。面積で割る四角の見た目で並べていなければ落とす */
function treemapOf(
  rendered: TreemapRendered,
  where: string,
): { frame: Rect; tiles: Tile[]; cuts: Cut[]; names: TileName[] } {
  const { layout } = rendered;
  expect(layout.arrangement, `${where} を面積で割る四角の見た目で並べていない`).toBe("treemap");
  expect(layout.frame, `${where} に図の四角 (layout.frame) が無い`).toBeDefined();
  expect(layout.tiles, `${where} に区画 (layout.tiles) が無い`).toBeDefined();
  return {
    frame: layout.frame ?? { x: 0, y: 0, w: 0, h: 0 },
    tiles: layout.tiles ?? [],
    cuts: layout.cuts ?? [],
    names: layout.names ?? [],
  };
}

/** 原本の見た目と箱と段と段ごとの線の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.sankey?.shape,
  boxes: (d.blocks.box ?? []).map((b) => b.id),
  steps: d.steps.length,
  lines: d.steps.map((step) =>
    step.events.filter((e) => e.type === "edge").map((e) => `${e.from}>${e.to}`),
  ),
});

/** 見本の記法と、描く原本 */
function samples(): { where: string; text: string; source: Source; lang: Lang }[] {
  return LANGS.flatMap((lang) => {
    const file = `${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`;
    const text = fileText(file);
    expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
    return text === undefined
      ? []
      : [{ where: file, text, source: parsed(text, lang, file), lang }];
  });
}

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1)
    await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});


describe("面積で割る四角の見た目の見本 (#3642)", () => {
  it("sankey-treemap-examples-in-both-langs-have-no-breaks", () => {
    const sources: Partial<Record<Lang, Source>> = {};
    for (const { where, text, source, lang } of samples()) {
      // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
      expect(text.split("\n")[0] ?? "", `${where} の最初の行`).toMatch(/^\/\/ /u);
      expect(
        /#\d+/u.test(text.split("\n")[0] ?? ""),
        `${where} の最初の注釈の行に作業の番号がある`,
      ).toBe(false);
      sources[lang] = source;
      expect(source.sankey?.shape, `${where} の見た目`).toBe("treemap");
      const problems = checkText(where, text, "notation", lang, {
        layout: (step, said) => `段 ${step}: ${said}`,
      }).map(problemLine);
      expect(problems, `${where} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, PHONE]) {
        const { tiles } = treemapOf(
          render(source as unknown as Json, lang, width),
          `${where} (幅 ${width ?? "既定"})`,
        );
        expect(tiles.length, `${where} を幅 ${width ?? "既定"} で描いた区画の数`).toBeGreaterThan(
          0,
        );
      }
    }
    expect(sources.ja && sources.en, `${SAMPLE} の日本語版と英語版が揃わない`).toBeTruthy();
    if (sources.ja && sources.en)
      expect(shapeOf(sources.en), `${SAMPLE} の英語版の箱と段と線が日本語版と違う`).toEqual(
        shapeOf(sources.ja),
      );
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(
      true,
    );
    expect(samplesOf("sankey"), `見本帳の量の行き先の図の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS)
      expect(
        exampleText(SAMPLE, lang),
        `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`,
      ).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
  });
});


describe("面積で割る四角の見た目の棚 (#3642)", () => {
  it("sankey-treemap-shelf-template-reads", () => {
    for (const lang of LANGS) {
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) => /^sankey <[^>]+> \[shape: treemap\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に sankey の面積で割る四角の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      const group = sampleGroups(lang, true).find((g) => g.kind === "sankey");
      expect(group, `棚の見本の束 (${lang}) に量の行き先の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の量の行き先の図の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      expect(
        parsed(exampleText(SAMPLE, lang) ?? "", lang, `棚の雛形 ${SAMPLE} (${lang})`).sankey?.shape,
        `棚の雛形 ${SAMPLE} (${lang}) の見た目`,
      ).toBe("treemap");
    }
  });
});


describe("面積で割る四角の見た目の書き方の文書 (#3642)", () => {
  it("sankey-treemap-docs-describe-the-shape", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const treemapFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).sankey?.shape === "treemap";
      }).length;
    for (const path of [
      "packages/dragon/README.md",
      "packages/dragon/README.ja.md",
      "packages/dragon/examples/quick-start.md",
      "packages/dragon/examples/quick-start.en.md",
    ]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: treemap\]/u.test(text), `${path} に [shape: treemap] の書き方が無い`).toBe(
        true,
      );
      expect(
        treemapFences(text),
        `${path} に面積で割る四角の見た目として読める dragon の囲みが無い`,
      ).toBeGreaterThan(0);
    }
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) =>
      repoText(`apps/playground-spa/src/docs/examples/${file}`),
    );
    const paragraphs = readdirSync(BLOCKS).map((name) =>
      repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`),
    );
    expect(
      /\[shape: treemap\]/u.test([content, ...sections, ...paragraphs].join("\n")),
      "使い方の頁に [shape: treemap] の書き方が無い",
    ).toBe(true);
  });
});

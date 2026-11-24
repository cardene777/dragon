/**
 * `lineup-stairs.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { api, type Json } from "./diagram-support";
import { draw, type Rect, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/lineup";
import "../src/kind-use/pipe";
import "../src/kind-use/time";

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

/** 階段の層の見た目の見本。撮った動画が見る人の端末で見られるようになるまで */
const SAMPLE = "video-publish";

/** 携帯の幅 */
const PHONE = 390;

interface SourceEvent {
  type: string;
  box?: string;
  items?: string[];
  text?: string;
}

interface Source {
  kind: string;
  title: string;
  lineup?: { shape?: string };
  blocks: {
    box?: {
      id: string;
      name: string;
      sub?: string;
      color?: string;
      order?: string;
      time?: string;
    }[];
    item?: { id: string; color?: string; label?: string; note?: string }[];
  };
  steps: { title: string; body?: string; events: SourceEvent[] }[];
}

/** 字の置き場所。`text` は描く字 */
type Writing = Rect & { text: string };

/** 層の名前と説明。段そのものの四角は `layout.lanes` の箱が持つ */
interface Band {
  lane: string;
  name: Writing;
  desc?: Writing;
}

/** 札が層の段に居る間 1 回分。`from` は滑り始める左上で、弾んで現れる札は持たない */
interface Seat extends Rect {
  id: string;
  lane: string;
  step: number;
  event: number;
  from?: [number, number];
}

/** 層の段の印。`note` の行 1 つ分 */
interface BandNote extends Rect {
  lane: string;
  step: number;
  event: number;
  text: Writing;
}

/** 経った時間の目盛りの数字。`value` は `unit` で数えた値、`at` は目盛りの向き (縦なら y、横なら x) の所 */
interface Tick {
  value: number;
  text: string;
  at: number;
  rect: Rect;
}

/** 経った時間の目盛り。`line` は目盛りの線の四角 */
interface Scale {
  axis: "vertical" | "horizontal";
  unit: string;
  line: Rect;
  ticks: Tick[];
}

/** 段ごとの針。`value` は `unit` で数えた経った時間、`at` は目盛りの向きの所、`chip` は経った時間を書いた札の四角 */
interface Needle {
  step: number;
  value: number;
  text: string;
  at: number;
  chip: Rect;
}

interface StairsLayout {
  kind: string;
  arrangement?: string;
  width: number;
  height: number;
  lanes: (Rect & { id: string; name: string })[];
  bands?: Band[];
  bandNotes?: BandNote[];
  chips: Seat[];
  arrows?: unknown[];
  scale?: Scale;
  needles?: Needle[];
}

interface StairsRendered extends Omit<Rendered, "layout"> {
  layout: StairsLayout;
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
function render(diagram: Json, lang: Lang = "ja", width?: number): StairsRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "階段の見た目の列の図を描けない").toBe("");
  return rendered as unknown as StairsRendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok
    ? read.diagram
    : { kind: "", title: "", blocks: {}, steps: [] }) as unknown as Source;
}

/** 階段の見た目の置き場所。階段の見た目で並べていなければ落とす */
function stairsOf(rendered: StairsRendered, where: string): StairsLayout {
  const { layout } = rendered;
  expect(layout.arrangement, `${where} を階段の見た目で並べていない`).toBe("stairs");
  return layout;
}

/** 原本の層と長さと札と段と段ごとの出来事の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.lineup?.shape,
  layers: (d.blocks.box ?? []).map((b) => b.id),
  times: (d.blocks.box ?? []).map((b) => b.time),
  items: (d.blocks.item ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.map((e) => e.type)),
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

// 後から読む塊は file を読み込む段で待つ。前処理で 25 ミリ秒ずつ見て待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", async () => {
  const { whenReady } = (await playgroundFile("site/later.ts")) as { whenReady: (chunk: typeof LATER_EXAMPLES) => Promise<unknown> };
  return whenReady(LATER_EXAMPLES);
});

beforeAll(() => {
  EXAMPLES_READY.get();
});


describe("階段の見た目の見本 (#3640)", () => {
  it("lineup-stairs-examples-in-both-langs-have-no-breaks", () => {
    const sources: Partial<Record<Lang, Source>> = {};
    for (const { where, text, source, lang } of samples()) {
      // 見本の file の最初の注釈の行は見本帳が説明に出すので、作業の番号を書かない
      expect(text.split("\n")[0] ?? "", `${where} の最初の行`).toMatch(/^\/\/ /u);
      expect(
        /#\d+/u.test(text.split("\n")[0] ?? ""),
        `${where} の最初の注釈の行に作業の番号がある`,
      ).toBe(false);
      sources[lang] = source;
      expect(source.lineup?.shape, `${where} の見た目`).toBe("stairs");
      expect(
        (source.blocks.box ?? []).every((b) => b.time !== undefined),
        `${where} の全ての箱に長さが無い`,
      ).toBe(true);
      // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
      const problems = checkText(where, text, "notation", lang, {
        layout: (step, said) => `段 ${step}: ${said}`,
      }).map(problemLine);
      expect(problems, `${where} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, PHONE]) {
        const layout = stairsOf(
          render(source as unknown as Json, lang, width),
          `${where} (幅 ${width ?? "既定"})`,
        );
        expect(layout.lanes.length, `${where} を幅 ${width ?? "既定"} で描いた段の数`).toBe(
          source.blocks.box?.length ?? -1,
        );
      }
    }
    expect(sources.ja && sources.en, `${SAMPLE} の日本語版と英語版が揃わない`).toBeTruthy();
    if (sources.ja && sources.en)
      expect(
        shapeOf(sources.en),
        `${SAMPLE} の英語版の層と長さと札と段と出来事の数が日本語版と違う`,
      ).toEqual(shapeOf(sources.ja));
    // 見本帳の見本の一覧に載り、列の図の頁に並ぶ
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(
      true,
    );
    expect(samplesOf("lineup"), `見本帳の列の図の頁に ${SAMPLE} が無い`).toContain(SAMPLE);
    for (const lang of LANGS) {
      expect(
        exampleText(SAMPLE, lang),
        `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`,
      ).toBe((fileText(`${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
  });
});


describe("階段の見た目の棚 (#3640)", () => {
  it("lineup-stairs-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、階段の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) => /^lineup <[^>]+> \[shape: stairs\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に lineup の階段の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      // 列の図の見本の束に階段の見た目の見本が在り、雛形が誤り無く階段の見た目の列の図として読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "lineup");
      expect(group, `棚の見本の束 (${lang}) に列の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      expect(keys, `棚の列の図の束 (${lang}) に ${SAMPLE} が無い`).toContain(SAMPLE);
      if (!keys.includes(SAMPLE)) continue;
      const text = exampleText(SAMPLE, lang) ?? "";
      expect(
        parsed(text, lang, `棚の雛形 ${SAMPLE} (${lang})`).lineup?.shape,
        `棚の雛形 ${SAMPLE} (${lang}) の見た目`,
      ).toBe("stairs");
    }
  });
});


describe("階段の見た目の書き方の文書 (#3640)", () => {
  it("lineup-stairs-docs-describe-the-shape", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const stairsFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).lineup?.shape === "stairs";
      }).length;
    for (const path of [
      "packages/dragon/README.md",
      "packages/dragon/README.ja.md",
      "packages/dragon/examples/quick-start.md",
      "packages/dragon/examples/quick-start.en.md",
    ]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: stairs\]/u.test(text), `${path} に [shape: stairs] の書き方が無い`).toBe(
        true,
      );
      expect(
        /\[time: /u.test(text.slice(text.indexOf("[shape: stairs]"))),
        `${path} の [shape: stairs] の後に [time: ] の書き方が無い`,
      ).toBe(true);
      expect(
        stairsFences(text),
        `${path} に階段の見た目として読める dragon の囲みが無い`,
      ).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) =>
      repoText(`apps/playground-spa/src/docs/examples/${file}`),
    );
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) =>
      repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`),
    );
    expect(
      /\[shape: stairs\]/u.test([content, ...sections, ...paragraphs].join("\n")),
      "使い方の頁に [shape: stairs] の書き方が無い",
    ).toBe(true);
  });
});

/**
 * 折れ線の見た目 (#3802) の見本帳の確かめ。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfile (`chart-line.test.ts`) に置かず、`kind-playground.test.ts` が読む (#3763)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { changelogEntry } from "./changelog-support";
import { api, type Json } from "./diagram-support";
import { type Motion, motionFrom } from "./motion-support";
import { draw, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/chart";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/draw"), import("../src/check")]);

const ROOT = process.cwd();

const EXAMPLES = join(ROOT, "packages/dragon/examples");

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

/** 折れ線の見た目の見本。パン屋の 1 週間の日ごとの売り上げを、店頭と通販の 2 本の線で比べる */
const SAMPLES = ["bakery-sales"] as const;

interface SourceEvent {
  type: string;
  item?: string;
  value?: number;
}

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string; items: { id: string; name: string; color?: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang: Lang = "ja", width?: number): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "折れ線の見た目の量の図を描けない").toBe("");
  return rendered as Rendered;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang, where: string): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `${where} が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", title: "", steps: [] }) as unknown as Source;
}

/** 描いた図の部品。全て返す */
const partsOf = (motion: Motion, selector: string): Element[] => [...motion.doc.querySelectorAll(selector)];

/** 原本の項目と段と段ごとの `set` の数 */
const shapeOf = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.chart?.shape,
  items: (d.chart?.items ?? []).map((i) => i.id),
  steps: d.steps.length,
  sets: d.steps.map((step) => step.events.filter((e) => e.type === "set").length),
});

// 後から読む塊は file を読み込む段で待つ。前処理で 25 ミリ秒ずつ見て待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", async () => {
  const { whenReady } = (await playgroundFile("site/later.ts")) as { whenReady: (chunk: typeof LATER_EXAMPLES) => Promise<unknown> };
  return whenReady(LATER_EXAMPLES);
});

beforeAll(() => {
  EXAMPLES_READY.get();
});

describe("折れ線の見た目の書き方の文書 (#3802)", () => {
  it("chart-line-docs-describe-the-shape", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const lineFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).chart?.shape === "line";
      }).length;
    // 種類ごとの書き方は README から記法の手引きへ移した (#3881)
    const docs = [
      "packages/dragon/examples/quick-start.md",
      "packages/dragon/examples/quick-start.en.md",
      "plugins/dragon/skills/dragon/references/kinds/chart.md",
      "plugins/dragon/skills/dragon/references/notation.md",
    ];
    for (const path of docs) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[shape: line\]/u.test(text), `${path} に [shape: line] の書き方が無い`).toBe(true);
      if (/quick-start(?:\.en)?\.md$/u.test(path) || path.endsWith("kinds/chart.md")) {
        expect(lineFences(text), `${path} に折れ線の見た目として読める dragon の囲みが無い`).toBeGreaterThan(0);
      }
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = ["chart.dragon", "chart.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(/\[shape: line\]/u.test(page), "使い方の頁に [shape: line] の書き方が無い").toBe(true);
    // 変更履歴の Unreleased か版の節の Added に、折れ線の見た目が英語と日本語で載る
    for (const [path, word] of [
      ["CHANGELOG.md", /line chart/u],
      ["CHANGELOG.ja.md", /折れ線/u],
    ] as const) {
      const entry = changelogEntry(join(ROOT, path), 3802);
      const added = /### (?:Added|追加)([\s\S]*?)(?=\n### |$)/u.exec(entry)?.[1] ?? "";
      expect(added, `${path} の折れ線の見た目の項 (#3802) を持つ節に Added の節が無い`).not.toBe("");
      expect(word.test(added) && /\[shape: line\]/u.test(added), `${path} の Added に折れ線の見た目 ([shape: line]) が無い`).toBe(true);
    }
  });
});

describe("折れ線の見た目の見本 (#3802)", () => {
  it("chart-line-examples-in-both-langs-have-no-breaks", () => {
    for (const name of SAMPLES) {
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
        expect(source.chart?.shape, `${file} の見た目`).toBe("line");
        // `dragon check --layout` と同じ形で、記法の誤りと、既定の幅と幅 390 で描いた崩れの知らせの行を返す
        const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
        expect(problems, `${file} の崩れの知らせ`).toEqual([]);
        for (const width of [undefined, 390]) {
          const rendered = render(source as unknown as Json, lang, width);
          expect(partsOf(motionFrom(rendered), "[data-chart-line]").length, `${file} を幅 ${width ?? "既定"} で描いた線`).toBe(source.chart?.items.length ?? -1);
          if (width !== undefined) expect(rendered.layout.width, `${file} を幅 ${width} で描いた図の幅`).toBeLessThanOrEqual(width);
        }
      }
      if (sources.ja && sources.en) expect(shapeOf(sources.en), `${name} の英語版の項目と段と段ごとの set の数が日本語版と違う`).toEqual(shapeOf(sources.ja));
      // 見本帳の見本の一覧に載り、量の図の頁に並ぶ
      expect(EXAMPLE_KEYS.includes(name), `${name} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      expect(samplesOf("chart"), `見本帳の量の図の頁に ${name} が無い`).toContain(name);
      for (const lang of LANGS) {
        expect(exampleText(name, lang), `見本帳の ${name} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
      }
    }
  });
});

describe("折れ線の見た目の棚 (#3802)", () => {
  it("chart-line-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、折れ線の見た目の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(
        kinds.some((line) => /^chart <[^>]+> \[shape: line\]$/u.test(line)),
        `棚の記法の早見 (${lang}) に chart の折れ線の見た目の頭の行が無い: ${kinds.join(" / ")}`,
      ).toBe(true);
      // 量の図の見本の束に折れ線の見た目の見本が在り、どの雛形も誤り無く折れ線の見た目の量の図として読める
      const group = sampleGroups(lang, true).find((g) => g.kind === "chart");
      expect(group, `棚の見本の束 (${lang}) に量の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      for (const name of SAMPLES) {
        expect(keys, `棚の量の図の束 (${lang}) に ${name} が無い`).toContain(name);
        if (!keys.includes(name)) continue;
        const text = exampleText(name, lang) ?? "";
        expect(parsed(text, lang, `棚の雛形 ${name} (${lang})`).chart?.shape, `棚の雛形 ${name} (${lang}) の見た目`).toBe("line");
      }
    }
  });
});

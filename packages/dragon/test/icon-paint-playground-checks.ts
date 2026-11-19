/**
 * `icon-paint.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { api, type Json, type LineError, type NotationLang } from "./diagram-support";
import { draw, type Rendered } from "./render-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/sequence";
import "../src/kind-use/state";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む。
// 見本は定義の行を持つので、定義を読む処理も全部入りの入口と同じく読むだけで登録する (`kinds/all`)
const [{ checkText, problemLine }] = await Promise.all([
  import("../src/check"),
  import("../src/kinds/basics"),
]);

const ROOT = process.cwd();

const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** ブロックの置き場。書き方の文書の段落を読む。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

const LANGS = ["ja", "en"] as const;

/** 見本帳の見本の一覧と記法と、後から読む見本の塊 */
interface Playground {
  EXAMPLE_KEYS: readonly string[];
  exampleText: (key: string, lang: NotationLang) => string | undefined;
  LATER_EXAMPLES: { start: () => void; state: () => { status: string } };
}

const playgroundFile = (path: string): Promise<object> =>
  import(/* @vite-ignore */ join(ROOT, "apps/playground-spa/src", path));

const { EXAMPLE_KEYS, exampleText, LATER_EXAMPLES } = (await playgroundFile(
  "examples.ts",
)) as Playground;

/** 色付きの絵柄の見本。写真を受け取って縮めて配る構成 */
const SAMPLE = "photo-delivery";

/** 携帯の幅 */
const PHONE = 390;

type Parsed = { ok: true; diagram: Json } | { ok: false; errors: LineError[] };

const parse = (text: string, options: { lang?: NotationLang; blocks?: unknown } = {}): Parsed =>
  api("parseNotation")(text, options);

/** 読めた図。読めない時は誤りの文を添えて落とす */
function parsed(text: string, options: { lang?: NotationLang } = {}): Json {
  const result = parse(text, options);
  expect(result.ok, `記法を読めない: ${result.ok ? "" : JSON.stringify(result.errors)}`).toBe(true);
  return result.ok ? result.diagram : {};
}

/** 描いた図。描けない時は断りの文を名指して落とす */
function render(diagram: Json, options: { lang?: NotationLang; width?: number } = {}): Rendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, options);
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "色付きの絵柄を持つ図を描けない").toBe("");
  return rendered as Rendered;
}

/** 描いた SVG の部品 */
const docOf = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string =>
  existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "";

interface Source {
  kind: string;
  blocks: { box?: { id: string; icon?: string }[] };
  steps: { events: { type: string; from?: string; to?: string }[] }[];
}

// 後から読む塊は file を読み込む段で待つ。前処理で 25 ミリ秒ずつ見て待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", async () => {
  const { whenReady } = (await playgroundFile("site/later.ts")) as { whenReady: (chunk: typeof LATER_EXAMPLES) => Promise<unknown> };
  return whenReady(LATER_EXAMPLES);
});

beforeAll(() => {
  EXAMPLES_READY.get();
});


describe("色付きの絵柄の見本 (#3633)", () => {
  it("icon-paint-examples-have-no-breaks", () => {
    const shapes: Partial<Record<NotationLang, unknown>> = {};
    for (const lang of LANGS) {
      const file = `${SAMPLE}${lang === "en" ? ".en" : ""}.dragon`;
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text === undefined) continue;
      expect(
        /#\d+/u.test(text.split("\n")[0] ?? ""),
        `${file} の最初の注釈の行に作業の番号がある`,
      ).toBe(false);
      const source = parsed(text, { lang }) as unknown as Source;
      expect(source.kind, `${file} の図の種類`).toBe("architecture");
      expect(
        (source.blocks.box ?? []).filter((b) => b.icon?.startsWith("+")).length,
        `${file} に色付きの絵柄を置いた箱が無い`,
      ).toBeGreaterThan(1);
      shapes[lang] = {
        boxes: (source.blocks.box ?? []).map((b) => `${b.id}:${b.icon ?? ""}`),
        lines: source.steps.map((s) =>
          s.events.filter((e) => e.type === "edge").map((e) => `${e.from}>${e.to}`),
        ),
      };
      const problems = checkText(file, text, "notation", lang, {
        layout: (step, said) => `段 ${step}: ${said}`,
      }).map(problemLine);
      expect(problems, `${file} の崩れの知らせ`).toEqual([]);
      for (const width of [undefined, PHONE]) {
        const { svg } = render(source as unknown as Json, {
          lang,
          ...(width === undefined ? {} : { width }),
        });
        expect(
          [...docOf(svg).querySelectorAll("path[fill^='#']")].length,
          `${file} を幅 ${width ?? "既定"} で描いた色付きの絵柄の形の数`,
        ).toBeGreaterThan(0);
      }
      expect(
        exampleText(SAMPLE, lang),
        `見本帳の ${SAMPLE} の ${lang} の記法が見本の file と違う`,
      ).toBe(text.trimEnd());
    }
    expect(shapes.en, `${SAMPLE} の英語版の箱と線が日本語版と違う`).toEqual(shapes.ja);
    expect(EXAMPLE_KEYS.includes(SAMPLE), `${SAMPLE} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(
      true,
    );
  });
});


describe("色付きの絵柄の書き方の文書 (#3633)", () => {
  it("icon-paint-docs-describe-sources", () => {
    for (const path of ["packages/dragon/README.md", "packages/dragon/README.ja.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/^\s*view \d+ \d+ \d+ \d+$/mu.test(text), `${path} に view の行の書き方が無い`).toBe(
        true,
      );
      expect(
        /^\s*paint #[0-9A-Fa-f]{3,6} /mu.test(text),
        `${path} に paint の行の書き方が無い`,
      ).toBe(true);
      expect(text.includes("dragon icon"), `${path} に dragon icon の書き方が無い`).toBe(true);
    }
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) =>
      repoText(`apps/playground-spa/src/docs/examples/${file}`),
    );
    const paragraphs = readdirSync(BLOCKS).map((name) =>
      repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`),
    );
    const page = [
      repoText("apps/playground-spa/src/docs/content.ts"),
      ...sections,
      ...paragraphs,
    ].join("\n");
    for (const word of ["配る元の最新", "初出", "略さ"])
      expect(page.includes(word), `使い方の頁に「${word}」の節が無い`).toBe(true);
    for (const word of ["latest", "abbreviat"])
      expect(page.includes(word), `使い方の頁の英語に「${word}」の節が無い`).toBe(true);
    const plugin = repoText("plugins/dragon/skills/dragon/references/kinds/architecture.md");
    for (const word of ["latest", "abbreviat", "dragon icon"])
      expect(plugin.includes(word), `プラグインの構成図の文書に「${word}」が無い`).toBe(true);
  });
});

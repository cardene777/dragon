/**
 * `chart-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api } from "./diagram-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/chart";
import "../src/kind-use/git";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/time";
import "../src/kind-use/try";

const ROOT = process.cwd();

interface ChartItem {
  id: string;
  name: string;
  color?: string;
}

interface SourceEvent {
  type: string;
  item?: string;
  value?: unknown;
  from?: string;
  to?: string;
  field?: string;
}

interface Source {
  kind: string;
  title: string;
  chart?: { shape: string; items: ChartItem[] };
  blocks: { box?: { id: string }[]; item?: { id: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

describe("量の図の書き方の文書 (#3560)", () => {
  it("docs-describe-chart-diagram", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `chart` と 2 つの見た目と、`item` と `set` の行の形 */
    const forms: [string, RegExp][] = [
      ["chart の頭の行", /(^|[\s`])chart [^\s`][^\n`]*\[shape: (donut|bar|<[^>]+>)\]/mu],
      ["[shape: donut]", /\[shape: donut\]/u],
      ["[shape: bar]", /\[shape: bar\]/u],
      ["item の行", /(^|[\s`])item (<[^>]+>|[^\s`,]+) as (<[^>]+>|[^\s`]+)/mu],
      ["set の行", /(^|[\s`])set (<[^>]+>|[^\s:`]+): (<[^>]+>|[0-9]+)/mu],
    ];
    const describes = (where: string, text: string): void => {
      for (const [word, form] of forms) expect(form.test(text), `${where} に ${word} の書き方が無い`).toBe(true);
    };
    const chartFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as unknown as Source).kind === "chart";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      describes(path, text);
      if (path !== "README.md") expect(chartFences(text), `${path} に量の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"chart"/u.test(content), "使い方の頁の節に量の図 (chart) が無い").toBe(true);
    const sections = ["chart.dragon", "chart.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const parsed = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(parsed.ok && (parsed.diagram as unknown as Source).kind, `使い方の頁の量の図の節の例 (${i === 0 ? "chart.dragon" : "chart.en.dragon"}) が量の図として読めない`).toBe("chart");
    }
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    describes("使い方の頁", [content, ...sections, ...paragraphs].join("\n"));
    // 変更履歴の量の図の項 (#3560) を持つ節 (Unreleased か版の節) の Added に量の図が載る
    for (const [path, word] of [
      ["CHANGELOG.md", /chart/u],
      ["CHANGELOG.ja.md", /量の図/u],
    ] as const) {
      const entry = changelogEntry(join(ROOT, path), 3560);
      const added = /### (?:Added|追加)([\s\S]*?)(?=\n### |$)/u.exec(entry)?.[1] ?? "";
      expect(added, `${path} の量の図の項 (#3560) を持つ節に Added の節が無い`).not.toBe("");
      expect(word.test(added) && /\bchart\b/u.test(added), `${path} の Added に量の図 (chart) が無い`).toBe(true);
    }
    // 前提の文の描ける図の種類の数が、図の種類の置き場の数と合う。種類を足しても数を決め打ちしない
    const product = repoText(".ikkan/premises/product.md");
    const kinds = /描ける図の種類は([^\n]*?)の (\d+) つ/u.exec(product);
    const kindDirs = readdirSync(join(ROOT, "packages/dragon/src/kinds"), { withFileTypes: true }).filter((entry) => entry.isDirectory());
    expect(kinds?.[2], ".ikkan/premises/product.md の描ける図の種類の数").toBe(String(kindDirs.length));
    expect(kinds?.[1] ?? "", ".ikkan/premises/product.md の描ける図の種類に量の図 (chart) が無い").toContain("`chart`");
  });
});

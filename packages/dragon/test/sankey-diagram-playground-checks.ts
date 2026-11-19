/**
 * `sankey-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/sankey";
import "../src/kind-use/sequence";
import "../src/kind-use/state";

const ROOT = process.cwd();

/** ブロックの置き場。書き方の文書の段落を読む。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

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

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

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
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に sankey の行の書き方が無い").toBe(true);
    expect(amount.test(page), "使い方の頁に量を書いた線の書き方が無い").toBe(true);
  });
});

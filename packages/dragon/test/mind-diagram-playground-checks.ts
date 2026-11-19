/**
 * `mind-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/mind";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/tree";

const ROOT = process.cwd();

/** ブロックの置き場。書き方の文書の段落を読む。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

interface SourceIdea {
  type: string;
  id?: string;
  name?: string;
  parent?: string;
  color?: string;
}

interface Source {
  kind: string;
  title: string;
  steps: { title: string; events: SourceIdea[] }[];
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

describe("考えを広げる地図の書き方の文書 (#3619)", () => {
  it("mind-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `mind` と、段の中の考えの行の書き方 */
    const head = /(^|[\s`])mind [^\s`]/mu;
    const grow = /idea (<[^>]+>|[^\s`]+) as (<[^>]+>|[^\s`]+) of (<[^>]+>|[^\s`]+)/u;
    const mindFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "mind";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に mind の行の書き方が無い`).toBe(true);
      expect(grow.test(text), `${path} に考えの行 (idea <名札> as <名前> of <親>) の書き方が無い`).toBe(true);
      if (path !== "README.md") expect(mindFences(text), `${path} に考えを広げる地図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に考えを広げる地図が載る
    expect(/^\| Diagram kinds \|.*\bmind map\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に mind map が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"mind"/u.test(content), "使い方の頁の節に考えを広げる地図 (mind) が無い").toBe(true);
    const sections = ["mind.dragon", "mind.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の考えを広げる地図の節の例 (${i === 0 ? "mind.dragon" : "mind.en.dragon"}) が考えを広げる地図として読めない`).toBe("mind");
    }
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に mind の行の書き方が無い").toBe(true);
    expect(grow.test(page), "使い方の頁に考えの行の書き方が無い").toBe(true);
  });
});

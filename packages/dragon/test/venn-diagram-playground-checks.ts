/**
 * `venn-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/venn";

const ROOT = process.cwd();

/** ブロックの置き場。書き方の文書の段落を読む。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

interface SourceEvent {
  type: string;
  sets?: string[];
  value?: number;
}

interface Source {
  kind: string;
  title: string;
  blocks: { circle?: { id: string; name: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

describe("集合の重なりの図の書き方の文書 (#3620)", () => {
  it("venn-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `venn` と、段の中の重なりの数の書き方 */
    const head = /(^|[\s`])venn [^\s`]/mu;
    const overlap = /set (<[^>]+>|[^\s`&]+) & (<[^>]+>|[^\s`&]+): /u;
    const vennFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "venn";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に venn の行の書き方が無い`).toBe(true);
      expect(overlap.test(text), `${path} に重なりの数の行 (set <名札> & <名札>: <数>) の書き方が無い`).toBe(true);
      if (path !== "README.md") expect(vennFences(text), `${path} に集合の重なりの図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に集合の重なりの図が載る
    expect(/^\| Diagram kinds \|.*\bset overlap diagram\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に set overlap diagram が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"venn"/u.test(content), "使い方の頁の節に集合の重なりの図 (venn) が無い").toBe(true);
    const sections = ["venn.dragon", "venn.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の集合の重なりの図の節の例 (${i === 0 ? "venn.dragon" : "venn.en.dragon"}) が集合の重なりの図として読めない`).toBe("venn");
    }
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に venn の行の書き方が無い").toBe(true);
    expect(overlap.test(page), "使い方の頁に重なりの数の行の書き方が無い").toBe(true);
  });
});

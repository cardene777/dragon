/**
 * `cycle-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/cycle";
import "../src/kind-use/sequence";
import "../src/kind-use/state";

const ROOT = process.cwd();

/** ブロックの置き場。書き方の文書の段落を読む。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

interface SourceEvent {
  type: string;
  from?: string;
  to?: string;
  carry?: { kind: string; text?: string };
  field?: string;
  value?: string;
}

interface Source {
  kind: string;
  title: string;
  blocks: { box?: { id: string; name: string }[]; strip?: { title: string; fields: string[] } };
  steps: { title: string; events: SourceEvent[] }[];
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

describe("回り続ける図の書き方の文書 (#3623)", () => {
  it("cycle-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `cycle` と、段の中の札を走らせる線の書き方 */
    const head = /(^|[\s`])cycle [^\s`]/mu;
    const run = /(<[^>]+>|[^\s`]+) -> (<[^>]+>|[^\s`]+) \[tag: [^\]]+\]/u;
    const cycleFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "cycle";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に cycle の行の書き方が無い`).toBe(true);
      expect(run.test(text), `${path} に札を走らせる線 (<名札> -> <名札> [tag: <字>]) の書き方が無い`).toBe(true);
      if (path !== "README.md") expect(cycleFences(text), `${path} に回り続ける図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に回り続ける図が載る
    expect(/^\| Diagram kinds \|.*\bcycle diagram\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に cycle diagram が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"cycle"/u.test(content), "使い方の頁の節に回り続ける図 (cycle) が無い").toBe(true);
    const sections = ["cycle.dragon", "cycle.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の回り続ける図の節の例 (${i === 0 ? "cycle.dragon" : "cycle.en.dragon"}) が回り続ける図として読めない`).toBe("cycle");
    }
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に cycle の行の書き方が無い").toBe(true);
    expect(run.test(page), "使い方の頁に札を走らせる線の書き方が無い").toBe(true);
  });
});

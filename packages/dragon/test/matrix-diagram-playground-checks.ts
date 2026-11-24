/**
 * `matrix-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/matrix";
import "../src/kind-use/sequence";
import "../src/kind-use/state";

const ROOT = process.cwd();

/** ブロックの置き場。書き方の文書の段落を読む。package の根を字で書くと、関係する検査を選ぶ命令が package の全ての code へたどり着く (#3763) */
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

interface SourceEvent {
  type: string;
  box?: string;
  items?: string[];
}

interface Source {
  kind: string;
  title: string;
  matrix?: { axes: { name: string; from?: string; to?: string }[]; items: { id: string; name: string }[] };
  blocks: { box?: { id: string; name: string }[] };
  steps: { title: string; events: SourceEvent[] }[];
}

/** repo の file の中身。無ければ空 */
const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

describe("2つの軸で置く図の書き方の文書 (#3622)", () => {
  it("matrix-docs-describe-the-notation", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `matrix` と、軸の行と、課題の行と、区画へ置く行の書き方 */
    const head = /(^|[\s`])matrix [^\s`]/mu;
    const axis = /axis (<[^>]+>|[^\s`]+) \[from: (<[^>]+>|[^\s`,]+), to: (<[^>]+>|[^\s`\]]+)\]/u;
    const item = /item (<[^>]+>|[^\s`]+) as (<[^>]+>|[^\s`]+)/u;
    const place = /line (<[^>]+>|[^\s`:]+): (<[^>]+>|[^\s`]+)/u;
    const matrixFences = (text: string): number =>
      extract(text).filter((fence) => {
        const read = parse(fence.source);
        return read.ok && (read.diagram as unknown as Source).kind === "matrix";
      }).length;
    // 種類ごとの書き方は README から記法の手引きへ移した (#3881)
    for (const path of ["packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(head.test(text), `${path} に matrix の行の書き方が無い`).toBe(true);
      expect(axis.test(text), `${path} に軸の行 (axis <名前> [from: <小さい側>, to: <大きい側>]) の書き方が無い`).toBe(true);
      expect(item.test(text), `${path} に課題の行 (item <名札> as <名前>) の書き方が無い`).toBe(true);
      expect(place.test(text), `${path} に区画へ置く行 (line <区画>: <課題>) の書き方が無い`).toBe(true);
      expect(matrixFences(text), `${path} に 2つの軸で置く図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // README の描ける図の欄に 2つの軸で置く図が載る
    expect(/^\| Diagram kinds \|.*\btwo-axis matrix\b/imu.test(repoText("README.md")), "README.md の描ける図の欄に two-axis matrix が無い").toBe(true);
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"matrix"/u.test(content), "使い方の頁の節に 2つの軸で置く図 (matrix) が無い").toBe(true);
    const sections = ["matrix.dragon", "matrix.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const read = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(read.ok && (read.diagram as unknown as Source).kind, `使い方の頁の 2つの軸で置く図の節の例 (${i === 0 ? "matrix.dragon" : "matrix.en.dragon"}) が 2つの軸で置く図として読めない`).toBe("matrix");
    }
    const blocks = BLOCKS;
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(head.test(page), "使い方の頁に matrix の行の書き方が無い").toBe(true);
    expect(axis.test(page), "使い方の頁に軸の行の書き方が無い").toBe(true);
    expect(item.test(page), "使い方の頁に課題の行の書き方が無い").toBe(true);
    expect(place.test(page), "使い方の頁に区画へ置く行の書き方が無い").toBe(true);
  });
});

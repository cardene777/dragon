/**
 * `interactive-diagram.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json } from "./diagram-support";
import "../src/kind-use/architecture";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";
import "../src/kind-use/tree";
import "../src/kind-use/try";

/** 試す図の部品の行の頭の語。step 5 で本人が選んだ */
const PART_WORDS = ["route", "queue", "chain", "ask", "press"] as const;

interface Source {
  kind?: string;
  title?: string;
  blocks?: Record<string, Json[]>;
  steps?: { title?: string; events?: { type?: string }[] }[];
}

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("試す図の書き方の文書 (#3337)", () => {
  it("docs-describe-interactive-kind", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 文書の中の dragon の囲みのうち、試す図として読める囲みの数 */
    const tryFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as Source).kind === "try";
      }).length;
    // 種類ごとの書き方は README から記法の手引きへ移したので、手引きの試す図の小節を見る (#3881)
    const docs: [string, string][] = [
      ["packages/dragon/examples/quick-start.md", "### 試す図"],
      ["packages/dragon/examples/quick-start.en.md", "### Try diagram"],
    ];
    for (const [path, heading] of docs) {
      const text = readRepo(path);
      expect(text, `${path} に試す図の小節 (${heading.trim()}) が無い`).toContain(heading);
      expect(tryFences(text), `${path} に試す図として読める dragon の囲みが無い`).toBeGreaterThan(
        0,
      );
      for (const word of PART_WORDS)
        expect(text, `${path} に部品の行 ${word} の書き方が無い`).toContain(`${word} `);
    }
    const content = readRepo("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"try"/u.test(content), "使い方の頁の節に試す図 (try) が無い").toBe(
      true,
    );
    for (const word of ["try", ...PART_WORDS])
      expect(content, `使い方の頁に ${word} の行が無い`).toContain(`${word} `);
  });
});

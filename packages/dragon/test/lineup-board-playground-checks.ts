/**
 * `lineup-board.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import { repoText, ROOT, type Source } from "./lineup-board-support";
import "../src/kinds/basics";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";

describe("ボードの見本と書き方 (#3624)", () => {

  it("lineup-board-docs-describe-limit-and-stations", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const fences = (text: string): Source[] =>
      extract(text).flatMap((fence) => {
        const read = parse(fence.source);
        return read.ok ? [read.diagram as unknown as Source] : [];
      });
    const back = { ja: /差し戻/u, en: /sen[dt] (?:a card |it )?back|back to an earlier/iu };
    // 種類ごとの書き方は README から記法の手引きへ移した (#3881)
    for (const [path, lang] of [
      ["packages/dragon/examples/quick-start.md", "ja"],
      ["packages/dragon/examples/quick-start.en.md", "en"],
    ] as const) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[limit: \d+\]|limit: \d+/u.test(text), `${path} に [limit] の書き方が無い`).toBe(true);
      expect(/\[shape: stations\]/u.test(text), `${path} に [shape: stations] の書き方が無い`).toBe(true);
      expect(back[lang].test(text), `${path} に差し戻しの書き方が無い`).toBe(true);
      const read = fences(text);
      expect(read.some((d) => d.kind === "lineup" && d.lineup?.shape === "stations"), `${path} に流れの線として読める dragon の囲みが無い`).toBe(true);
      expect(read.some((d) => d.kind === "lineup" && (d.blocks.box ?? []).some((b) => b.limit !== undefined)), `${path} に上限を持つ列の図の囲みが無い`).toBe(true);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(/\[limit: \d+\]|limit: \d+/u.test(page), "使い方の頁に [limit] の書き方が無い").toBe(true);
    expect(/\[shape: stations\]/u.test(page), "使い方の頁に [shape: stations] の書き方が無い").toBe(true);
    expect(back.ja.test(page), "使い方の頁に差し戻しの書き方が無い").toBe(true);
    // ボードの見た目 (列の帯) を書く
    expect(/ボード|board/iu.test(page), "使い方の頁にボードの見た目の説明が無い").toBe(true);
  });
});

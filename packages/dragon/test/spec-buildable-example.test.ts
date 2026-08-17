/**
 * spec の「今書ける形」 の例が、実際に記法として解けることの検査 (#1207)。
 *
 * `docs/spec-reactive-diagram.md` は「実装着手前の SSOT」 = 計画文書で、5 段の変更計画を持つ。
 * 段 1 (`values` を式のみで足す) は入ったが、段 2 (トリガー) と段 3 (図表が値を読む) は未実装。
 *
 * **計画部分に紛れて、計画とは無関係な誤りが気付かれない状態だった**。 起票時に § 3 の例を
 * そのまま `parseTextDslV05` に通すと 25 件の error が出て、内訳に `type: pipeline`
 * (`PRESET_TYPES` に存在しない) と点付きの値名 (`invalid value name`) が含まれていた。
 * どちらも段 2-3 が入っても解けるようにならない。
 *
 * そこで例を 2 つに分け、今の記法で書いた側だけをここで解かせる。 未実装の計画は解けないのが
 * 正しいので対象にしない。
 *
 * 対象の選び方は **`title:` で始まる block**。 記法として完結した文書は `title` と `type` を
 * 必須に持つため、`title:` で始まることが「解けるべき例」 の印になる。 計画の例は `title:` を
 * 書かないことで外れる。
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/index";

const SPEC_URL = new URL("../../../docs/spec-reactive-diagram.md", import.meta.url);

/**
 * spec の fenced block のうち `title:` で始まるものを取り出す。
 *
 * 言語指定 (```text 等) は落とす。 開き fence と閉じ fence を交互に数える素朴な走査で足りる
 * (spec に入れ子の fence は無い)。
 */
function 解けるべき例(): string[] {
  const src = readFileSync(SPEC_URL, "utf8");
  const lines = src.split("\n");
  const blocks: string[] = [];
  let inBlock = false;
  let buf: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inBlock) {
        const body = buf.join("\n");
        if (body.trimStart().startsWith("title:")) blocks.push(body);
        buf = [];
      }
      inBlock = !inBlock;
      continue;
    }
    if (inBlock) buf.push(line);
  }
  return blocks;
}

describe("spec の「今書ける形」 が記法として解ける (#1207)", () => {
  it("走査が空振りしていない", () => {
    // block が 1 件も取れないと、以下の検査が「全て通った」 として素通りする。
    // fence の書き方が変わった時と、例そのものが消えた時の両方をここで捕まえる
    expect(解けるべき例().length, "`title:` で始まる block を 1 件も取れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it.each(解けるべき例().map((body, i) => [i + 1, body] as const))(
    "%i 件目の例が解ける",
    (_index, body) => {
      const result = parseTextDslV05(body);
      // 落ちた時に何が読めなかったかを出す。 出さないと spec の 200 行から探すことになる
      const detail = result.ok ? "" : result.errors.map((e) => `line ${e.line}: ${e.message}`).join("\n");
      expect(result.ok, detail).toBe(true);
    },
  );

  it("計画の例は対象に入らない", () => {
    // 段 2-3 の形は解けないのが正しい。 対象に入ると計画を消す方向の圧力になる
    const src = readFileSync(SPEC_URL, "utf8");
    expect(src).toContain("### 3.2 段 2-3 の後に書ける形 (未実装)");
    expect(解けるべき例().some((b) => b.includes("trigger:"))).toBe(false);
    expect(解けるべき例().some((b) => b.includes("reads:"))).toBe(false);
  });
});

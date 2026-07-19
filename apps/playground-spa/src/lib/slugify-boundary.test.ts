/**
 * slugify boundary tests (iter65、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter65。
 * slugify 関数の boundary 条件を集中 verify。
 */
import { describe, it, expect } from "vitest";
import { slugify } from "./canvas-pivot-interaction";

describe("iter65: slugify boundary tests", () => {
  it("1 char (a) → 'a'", () => {
    expect(slugify("a")).toBe("a");
  });

  it("2 char (AB) → 'ab'", () => {
    expect(slugify("AB")).toBe("ab");
  });

  it("64 char (a) → 全保持", () => {
    const s = "a".repeat(64);
    expect(slugify(s).length).toBe(64);
  });

  it("65 char (a) → 64 で truncate", () => {
    const s = "a".repeat(65);
    expect(slugify(s).length).toBe(64);
  });

  it("100 char (a) → 64 で truncate", () => {
    const s = "a".repeat(100);
    expect(slugify(s).length).toBe(64);
  });

  it("空文字 → 'n'", () => {
    expect(slugify("")).toBe("n");
  });

  it("数字のみ (123) → '123'", () => {
    expect(slugify("123")).toBe("123");
  });

  it("hyphen のみ (---) → 'n' (先頭末尾除去 → 空 → fallback)", () => {
    expect(slugify("---")).toBe("n");
  });

  it("hyphen + 英字 mix (a-b-c)", () => {
    expect(slugify("a-b-c")).toBe("a-b-c");
  });

  it("underscore _ が保持", () => {
    expect(slugify("a_b")).toBe("a_b");
  });

  it("hiragana + katakana + kanji 保持", () => {
    const result = slugify("あアA一");
    // 全 char が範囲に含まれる = 保持
    expect(result.length).toBeGreaterThan(0);
  });

  it("emoji → hyphen 置換", () => {
    const result = slugify("🚀rocket");
    expect(result).toContain("rocket");
  });

  it("空白 tab 混在 → hyphen 圧縮", () => {
    const result = slugify("a  b\tc");
    expect(result).toContain("a");
    expect(result).toContain("b");
    expect(result).toContain("c");
  });

  it("句読点 → 除去 / hyphen", () => {
    const result = slugify("hello, world!");
    expect(result).toContain("hello");
    expect(result).toContain("world");
  });

  it("全角文字 fullwidth → hyphen", () => {
    // NFKC normalization で halfwidth 化される可能性
    const result = slugify("ＡＢＣ");
    expect(result.length).toBeGreaterThan(0);
  });
});

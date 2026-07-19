/**
 * canvas-pivot-interaction unit test (iter28、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter28。
 * canvas pivot interaction の pure function を batch verify。
 * - extractAllActorNames (DSL parser)
 * - slugify (compile 側 slug logic と一致)
 * - hitResizeHandle (client 座標 → corner 判定)
 */
import { describe, it, expect } from "vitest";
import { extractAllActorNames, slugify, hitResizeHandle } from "./canvas-pivot-interaction";

describe("iter28: canvas-pivot-interaction 単体 verify", () => {
  describe("extractAllActorNames", () => {
    it("plain actor list を抽出", () => {
      const src = `title: "t"
type: sequence
actors:
  - Client
  - API
  - DB
flow:
  - Client -> API: "x"
`;
      expect(extractAllActorNames(src)).toEqual(["Client", "API", "DB"]);
    });

    it("actor 名 quoted (含 special chars)", () => {
      const src = `title: "t"
type: sequence
actors:
  - "Client A"
  - "API-01"
flow:
  - X -> Y: "x"
`;
      expect(extractAllActorNames(src)).toEqual(["Client A", "API-01"]);
    });

    it("parts unified syntax (kind: xxx) の alias 抽出", () => {
      const src = `title: "t"
type: sequence
actors:
  - Client
  - alias1: { kind: badge-count }
  - API
flow:
  - X -> Y: "x"
`;
      const names = extractAllActorNames(src);
      expect(names).toContain("Client");
      expect(names).toContain("alias1");
      expect(names).toContain("API");
    });

    it("actors: block なしで空配列", () => {
      const src = `title: "t"
type: sequence
flow:
  - X -> Y: "x"
`;
      expect(extractAllActorNames(src)).toEqual([]);
    });

    it("actors block の後に別 top-level key で終了", () => {
      const src = `title: "t"
type: sequence
actors:
  - A
  - B
flow:
  - X -> Y
animation:
  - step: "x"
`;
      expect(extractAllActorNames(src)).toEqual(["A", "B"]);
    });

    it("空 DSL は空配列", () => {
      expect(extractAllActorNames("")).toEqual([]);
    });
  });

  describe("slugify", () => {
    it("英字 → lowercase", () => {
      expect(slugify("Client")).toBe("client");
      expect(slugify("API")).toBe("api");
    });

    it("空白 / 特殊文字 → hyphen", () => {
      expect(slugify("hello world")).toBe("hello-world");
      expect(slugify("a b c d")).toBe("a-b-c-d");
    });

    it("hiragana / katakana を保持", () => {
      const result = slugify("あいうえお");
      // hiragana range 保持
      expect(result).toMatch(/[ぁ-ん]/);
    });

    it("先頭/末尾 hyphen を除去", () => {
      expect(slugify("---hello---")).toBe("hello");
    });

    it("64 chars で truncate", () => {
      const long = "a".repeat(200);
      expect(slugify(long).length).toBeLessThanOrEqual(64);
    });

    it("空文字 → 'n' fallback", () => {
      expect(slugify("")).toBe("n");
      expect(slugify("!!!")).toBe("n");
    });

    it("同じ入力に対し deterministic", () => {
      const inputs = ["Client", "API-01", "abc def"];
      for (const inp of inputs) {
        expect(slugify(inp)).toBe(slugify(inp));
      }
    });
  });

  describe("hitResizeHandle", () => {
    const rect = { left: 100, top: 100, right: 200, bottom: 200, width: 100, height: 100 } as DOMRect;

    it("nw corner に hit", () => {
      expect(hitResizeHandle(100, 100, rect)).toBe("nw");
    });

    it("ne corner に hit", () => {
      expect(hitResizeHandle(200, 100, rect)).toBe("ne");
    });

    it("sw corner に hit", () => {
      expect(hitResizeHandle(100, 200, rect)).toBe("sw");
    });

    it("se corner に hit", () => {
      expect(hitResizeHandle(200, 200, rect)).toBe("se");
    });

    it("中央では null", () => {
      expect(hitResizeHandle(150, 150, rect)).toBeNull();
    });

    it("矩形外では null", () => {
      expect(hitResizeHandle(500, 500, rect)).toBeNull();
    });
  });
});

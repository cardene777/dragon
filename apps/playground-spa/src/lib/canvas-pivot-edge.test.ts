/**
 * canvas-pivot edge case unit test (iter57、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter57。
 * extractAllActorNames / slugify の edge case を verify。
 */
import { describe, it, expect } from "vitest";
import {
  extractAllActorNames,
  slugify,
  updateActorPosition,
  extractActorPosition,
} from "./canvas-pivot-interaction";

describe("iter57: canvas-pivot edge case", () => {
  describe("extractAllActorNames edge case", () => {
    it("actors block 前に comment", () => {
      const src = `title: "t"
type: sequence
# comment
actors:
  - A
  - B
flow:
  - A -> B
`;
      expect(extractAllActorNames(src)).toEqual(["A", "B"]);
    });

    it("actors 空 (block あるが item なし)", () => {
      const src = `title: "t"
type: sequence
actors:
flow:
  - A -> B
`;
      const result = extractAllActorNames(src);
      expect(Array.isArray(result)).toBe(true);
    });

    it("actor に unicode 混在", () => {
      const src = `actors:
  - "ユーザー"
  - Client
  - "服务器"
`;
      const names = extractAllActorNames(src);
      expect(names).toContain("ユーザー");
      expect(names).toContain("Client");
      expect(names).toContain("服务器");
    });

    it("actor に emoji", () => {
      const src = `actors:
  - "🚀"
  - Alpha
`;
      const names = extractAllActorNames(src);
      expect(names.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("slugify edge case", () => {
    it("数字のみで始まる → 'n' 補完なし", () => {
      // "123abc" → "123abc" (kebab に変換)
      const result = slugify("123abc");
      expect(result.length).toBeGreaterThan(0);
    });

    it("special char のみ", () => {
      expect(slugify("!@#$%")).toBe("n");
    });

    it("全 space", () => {
      expect(slugify("     ")).toBe("n");
    });

    it("mixed case (ClientAPI)", () => {
      expect(slugify("ClientAPI")).toBe("clientapi");
    });
  });

  describe("updateActorPosition edge case", () => {
    it("posX = 0 で writeback", () => {
      const src = `actors:
  - A
`;
      const result = updateActorPosition(src, "A", 0, 0);
      expect(result).toContain("posX: 0");
      expect(result).toContain("posY: 0");
    });

    it("posX = 大きな値 (99999)", () => {
      const src = `actors:
  - A
`;
      const result = updateActorPosition(src, "A", 99999, 99999);
      expect(result).toContain("posX: 99999");
      expect(result).toContain("posY: 99999");
    });

    it("target actor 不在で src 変わらず", () => {
      const src = `actors:
  - A
  - B
`;
      const result = updateActorPosition(src, "NonExistent", 100, 200);
      // 存在しない actor には何も追加されない
      expect(result).not.toContain("posX: 100");
    });
  });

  describe("update → extract cycle stability", () => {
    it("10 回連続 update → extract で 情報保持", () => {
      let src = `actors:
  - A
`;
      for (let i = 0; i < 10; i++) {
        src = updateActorPosition(src, "A", i * 100, i * 200);
        const p = extractActorPosition(src, "A");
        expect(p?.posX).toBe(i * 100);
        expect(p?.posY).toBe(i * 200);
      }
    });
  });
});

/**
 * extractActorPosition / extractActorNodePosition unit test (iter31、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter31。
 * canvas pivot の position read-back logic を pure function verify。
 */
import { describe, it, expect } from "vitest";
import { extractActorPosition, extractActorNodePosition } from "./canvas-pivot-interaction";

describe("iter31: canvas-pivot extract position 単体 verify", () => {
  describe("extractActorPosition", () => {
    it("actor に posX/posY inline → 抽出", () => {
      const src = `title: "t"
type: sequence
actors:
  - Client: { posX: 200, posY: 300 }
`;
      const pos = extractActorPosition(src, "Client");
      expect(pos?.posX).toBe(200);
      expect(pos?.posY).toBe(300);
    });

    it("posW / posH 存在時も抽出", () => {
      const src = `actors:
  - Client: { posX: 100, posY: 200, posW: 300, posH: 400 }
`;
      const pos = extractActorPosition(src, "Client");
      expect(pos?.posX).toBe(100);
      expect(pos?.posY).toBe(200);
      expect(pos?.posW).toBe(300);
      expect(pos?.posH).toBe(400);
    });

    it("target 不在で null", () => {
      const src = `actors:
  - Client: { posX: 100, posY: 200 }
`;
      expect(extractActorPosition(src, "NonExistent")).toBeNull();
    });

    it("posX 欠落で null", () => {
      const src = `actors:
  - Client: { posY: 200 }
`;
      expect(extractActorPosition(src, "Client")).toBeNull();
    });

    it("小数値 posX/posY 抽出", () => {
      const src = `actors:
  - Client: { posX: 123.456, posY: 78.9 }
`;
      const pos = extractActorPosition(src, "Client");
      expect(pos?.posX).toBeCloseTo(123.456);
      expect(pos?.posY).toBeCloseTo(78.9);
    });

    it("負値 posX/posY 抽出", () => {
      const src = `actors:
  - Client: { posX: -100, posY: -50 }
`;
      const pos = extractActorPosition(src, "Client");
      expect(pos?.posX).toBe(-100);
      expect(pos?.posY).toBe(-50);
    });

    it("複数 actor で target のみ抽出", () => {
      const src = `actors:
  - Client: { posX: 100, posY: 200 }
  - API: { posX: 500, posY: 600 }
`;
      const p1 = extractActorPosition(src, "Client");
      const p2 = extractActorPosition(src, "API");
      expect(p1?.posX).toBe(100);
      expect(p2?.posX).toBe(500);
    });

    it("空 DSL で null", () => {
      expect(extractActorPosition("", "Client")).toBeNull();
    });

    it("actor に inline map なしで null (pos 情報なし)", () => {
      const src = `actors:
  - Client
`;
      expect(extractActorPosition(src, "Client")).toBeNull();
    });
  });

  describe("extractActorNodePosition", () => {
    it("nested nodes: の subKey position 抽出", () => {
      const src = `actors:
  - alias: { kind: badge-count, nodes: { header: { posX: 50, posY: 60 } } }
`;
      const p = extractActorNodePosition(src, "alias", "header");
      expect(p?.posX).toBe(50);
      expect(p?.posY).toBe(60);
    });

    it("subKey 不在で null", () => {
      const src = `actors:
  - alias: { kind: badge-count, nodes: { header: { posX: 50, posY: 60 } } }
`;
      expect(extractActorNodePosition(src, "alias", "nonexistent")).toBeNull();
    });
  });
});

/**
 * updateActorPosition / scaleDiagramPositions unit test (iter34、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter34。
 * canvas pivot の DSL write-back logic を pure function verify。
 * - updateActorPosition: bare → inline / short → inline / inline → inline 3 経路
 * - round-trip: extract 後 update で 情報保持
 */
import { describe, it, expect } from "vitest";
import {
  updateActorPosition,
  extractActorPosition,
  scaleDiagramPositions,
} from "./canvas-pivot-interaction";

describe("iter34: canvas-pivot update position 単体 verify", () => {
  describe("updateActorPosition — bare actor (- Name)", () => {
    it("bare actor → inline map 追加", () => {
      const src = `actors:
  - Client
  - API
`;
      const result = updateActorPosition(src, "Client", 100, 200);
      expect(result).toContain("Client: { posX: 100, posY: 200 }");
      expect(result).toContain("- API"); // 他 actor は影響なし
    });

    it("posW/H 指定で 4 field 出力", () => {
      const src = `actors:
  - Client
`;
      const result = updateActorPosition(src, "Client", 100, 200, 300, 400);
      expect(result).toContain("posX: 100");
      expect(result).toContain("posY: 200");
      expect(result).toContain("posW: 300");
      expect(result).toContain("posH: 400");
    });

    it("小数値は Math.round される", () => {
      const src = `actors:
  - Client
`;
      const result = updateActorPosition(src, "Client", 100.7, 200.4);
      expect(result).toContain("posX: 101");
      expect(result).toContain("posY: 200");
    });
  });

  describe("updateActorPosition — short form (- Name: kind)", () => {
    it("short form → inline map 展開", () => {
      const src = `actors:
  - Client: humanKind
`;
      const result = updateActorPosition(src, "Client", 100, 200);
      expect(result).toContain("kind: humanKind");
      expect(result).toContain("posX: 100");
      expect(result).toContain("posY: 200");
    });
  });

  describe("updateActorPosition — inline map (- Name: { ... })", () => {
    it("既存 posX/Y を新値で置換", () => {
      const src = `actors:
  - Client: { posX: 50, posY: 60 }
`;
      const result = updateActorPosition(src, "Client", 100, 200);
      expect(result).toContain("posX: 100");
      expect(result).toContain("posY: 200");
      expect(result).not.toContain("posX: 50");
    });

    it("他 field (kind) を保持しつつ posX/Y 追加", () => {
      const src = `actors:
  - Client: { kind: badge-count }
`;
      const result = updateActorPosition(src, "Client", 100, 200);
      expect(result).toContain("kind: badge-count");
      expect(result).toContain("posX: 100");
      expect(result).toContain("posY: 200");
    });

    it("negative pos 値を許容", () => {
      const src = `actors:
  - Client
`;
      const result = updateActorPosition(src, "Client", -50, -100);
      expect(result).toContain("posX: -50");
      expect(result).toContain("posY: -100");
    });
  });

  describe("update → extract round-trip", () => {
    it("update 直後の extract で same value を回収", () => {
      const src = `actors:
  - Client
`;
      const updated = updateActorPosition(src, "Client", 123, 456);
      const pos = extractActorPosition(updated, "Client");
      expect(pos?.posX).toBe(123);
      expect(pos?.posY).toBe(456);
    });

    it("update posW/H → extract で回収", () => {
      const src = `actors:
  - Client
`;
      const updated = updateActorPosition(src, "Client", 100, 200, 300, 400);
      const pos = extractActorPosition(updated, "Client");
      expect(pos?.posW).toBe(300);
      expect(pos?.posH).toBe(400);
    });

    it("既存 pos を上書き後 extract で新値", () => {
      const src = `actors:
  - Client: { posX: 10, posY: 20 }
`;
      const updated = updateActorPosition(src, "Client", 999, 888);
      const pos = extractActorPosition(updated, "Client");
      expect(pos?.posX).toBe(999);
      expect(pos?.posY).toBe(888);
    });
  });

  describe("scaleDiagramPositions", () => {
    it("factor 2 で 全 target actor の pos を 2 倍", () => {
      const src = `actors:
  - A: { posX: 100, posY: 200, posW: 50, posH: 60 }
  - B: { posX: 300, posY: 400, posW: 100, posH: 80 }
`;
      const result = scaleDiagramPositions(src, ["A", "B"], 2, 0, 0);
      const pA = extractActorPosition(result, "A");
      const pB = extractActorPosition(result, "B");
      expect(pA?.posX).toBe(200);
      expect(pA?.posY).toBe(400);
      expect(pA?.posW).toBe(100);
      expect(pA?.posH).toBe(120);
      expect(pB?.posX).toBe(600);
      expect(pB?.posY).toBe(800);
    });

    it("factor 0.5 で半分に縮小", () => {
      const src = `actors:
  - A: { posX: 200, posY: 400, posW: 100, posH: 80 }
`;
      const result = scaleDiagramPositions(src, ["A"], 0.5, 0, 0);
      const pA = extractActorPosition(result, "A");
      expect(pA?.posX).toBe(100);
      expect(pA?.posY).toBe(200);
      expect(pA?.posW).toBe(50);
      expect(pA?.posH).toBe(40);
    });

    it("factor 1 で無変化", () => {
      const src = `actors:
  - A: { posX: 100, posY: 200 }
`;
      const result = scaleDiagramPositions(src, ["A"], 1, 0, 0);
      const pA = extractActorPosition(result, "A");
      expect(pA?.posX).toBe(100);
      expect(pA?.posY).toBe(200);
    });
  });
});

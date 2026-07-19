/**
 * update / extract cycle stress test (iter67、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter67。
 * updateActorPosition / extractActorPosition の cycle stress 検証。
 */
import { describe, it, expect } from "vitest";
import {
  updateActorPosition,
  extractActorPosition,
  scaleDiagramPositions,
} from "./canvas-pivot-interaction";

describe("iter67: update/extract cycle stress", () => {
  it("100 回連続 update → extract で 情報保持", () => {
    let src = `actors:
  - A
`;
    for (let i = 0; i < 100; i++) {
      src = updateActorPosition(src, "A", i * 10, i * 20);
      const p = extractActorPosition(src, "A");
      expect(p?.posX).toBe(i * 10);
      expect(p?.posY).toBe(i * 20);
    }
  });

  it("3 actor 交互 update → 各 extract 独立", () => {
    let src = `actors:
  - A
  - B
  - C
`;
    for (let i = 0; i < 10; i++) {
      src = updateActorPosition(src, "A", i * 100, i * 100);
      src = updateActorPosition(src, "B", i * 200, i * 200);
      src = updateActorPosition(src, "C", i * 300, i * 300);
    }
    expect(extractActorPosition(src, "A")?.posX).toBe(9 * 100);
    expect(extractActorPosition(src, "B")?.posX).toBe(9 * 200);
    expect(extractActorPosition(src, "C")?.posX).toBe(9 * 300);
  });

  it("scale factor 2 適用後 extract で 2x", () => {
    let src = `actors:
  - A: { posX: 100, posY: 200 }
  - B: { posX: 300, posY: 400 }
`;
    src = scaleDiagramPositions(src, ["A", "B"], 2, 0, 0);
    expect(extractActorPosition(src, "A")?.posX).toBe(200);
    expect(extractActorPosition(src, "B")?.posX).toBe(600);
  });

  it("update + scale + update cycle 情報保持", () => {
    let src = `actors:
  - A
`;
    src = updateActorPosition(src, "A", 100, 200);
    src = scaleDiagramPositions(src, ["A"], 2, 0, 0);
    src = updateActorPosition(src, "A", 500, 600);
    expect(extractActorPosition(src, "A")?.posX).toBe(500);
  });

  it("scale 0.5 で 半分", () => {
    let src = `actors:
  - A: { posX: 400, posY: 800 }
`;
    src = scaleDiagramPositions(src, ["A"], 0.5, 0, 0);
    expect(extractActorPosition(src, "A")?.posX).toBe(200);
    expect(extractActorPosition(src, "A")?.posY).toBe(400);
  });
});

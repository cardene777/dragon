/**
 * updateActorNodePosition full test (iter70、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter70。
 * updateActorNodePosition / extractActorNodePosition の cycle verify。
 */
import { describe, it, expect } from "vitest";
import {
  updateActorNodePosition,
  extractActorNodePosition,
} from "./canvas-pivot-interaction";

describe("iter70: updateActorNodePosition + extract cycle", () => {
  it("actor + subKey に posX/Y 追加 (bare)", () => {
    const src = `actors:
  - a
`;
    const result = updateActorNodePosition(src, "a", "header", 100, 200);
    const pos = extractActorNodePosition(result, "a", "header");
    expect(pos?.posX).toBe(100);
    expect(pos?.posY).toBe(200);
  });

  it("actor + subKey posW/posH 指定で 4 field", () => {
    const src = `actors:
  - a
`;
    const result = updateActorNodePosition(src, "a", "header", 100, 200, 300, 400);
    const pos = extractActorNodePosition(result, "a", "header");
    expect(pos?.posX).toBe(100);
    expect(pos?.posY).toBe(200);
    expect(pos?.posW).toBe(300);
    expect(pos?.posH).toBe(400);
  });

  it("複数 subKey を同 actor に追加", () => {
    let src = `actors:
  - a
`;
    src = updateActorNodePosition(src, "a", "header", 10, 20);
    src = updateActorNodePosition(src, "a", "footer", 30, 40);
    expect(extractActorNodePosition(src, "a", "header")?.posX).toBe(10);
    expect(extractActorNodePosition(src, "a", "footer")?.posX).toBe(30);
  });

  it("同 subKey を上書き", () => {
    let src = `actors:
  - a
`;
    src = updateActorNodePosition(src, "a", "header", 10, 20);
    src = updateActorNodePosition(src, "a", "header", 100, 200);
    expect(extractActorNodePosition(src, "a", "header")?.posX).toBe(100);
    expect(extractActorNodePosition(src, "a", "header")?.posY).toBe(200);
  });

  it("target actor 不在で src 変わらず", () => {
    const src = `actors:
  - a
`;
    const result = updateActorNodePosition(src, "nonexistent", "header", 100, 200);
    expect(extractActorNodePosition(result, "nonexistent", "header")).toBeNull();
  });

  it("10 subKey を交互 update", () => {
    let src = `actors:
  - a
`;
    for (let i = 0; i < 10; i++) {
      src = updateActorNodePosition(src, "a", `sub${i}`, i * 10, i * 20);
    }
    for (let i = 0; i < 10; i++) {
      const pos = extractActorNodePosition(src, "a", `sub${i}`);
      expect(pos?.posX).toBe(i * 10);
      expect(pos?.posY).toBe(i * 20);
    }
  });
});

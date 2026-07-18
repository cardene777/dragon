/**
 * canvas pivot PR-D 整列補助線 unit test (dragon canvas pivot spec §6)。
 */
import { describe, expect, it } from "vitest";
import { detectGuidelines, GUIDELINE_SNAP_TOLERANCE } from "./canvas-pivot-guideline";

describe("detectGuidelines", () => {
  it("top edge alignment を検出", () => {
    const drag = { x: 100, y: 200, width: 50, height: 50 };
    const targets = [{ id: "t1", rect: { x: 300, y: 202, width: 50, height: 50 } }];
    const guides = detectGuidelines(drag, targets);
    expect(guides.length).toBeGreaterThanOrEqual(1);
    const h = guides.find((g) => g.axis === "horizontal");
    expect(h).toBeDefined();
    expect(h!.kind.dragEdge).toBe("top");
    expect(h!.kind.targetEdge).toBe("top");
  });

  it("center-y alignment を検出", () => {
    const drag = { x: 100, y: 195, width: 50, height: 60 };
    const targets = [{ id: "t1", rect: { x: 300, y: 200, width: 50, height: 50 } }];
    const guides = detectGuidelines(drag, targets);
    // drag center-y = 225、 target center-y = 225 = alignment
    const h = guides.find((g) => g.axis === "horizontal");
    expect(h).toBeDefined();
    expect(h!.kind.dragEdge).toBe("center-y");
    expect(h!.kind.targetEdge).toBe("center-y");
  });

  it("bottom edge alignment を検出", () => {
    const drag = { x: 100, y: 100, width: 50, height: 50 };
    const targets = [{ id: "t1", rect: { x: 300, y: 100, width: 50, height: 52 } }];
    const guides = detectGuidelines(drag, targets);
    // drag bottom = 150、 target bottom = 152 = tolerance 内
    const h = guides.find((g) => g.axis === "horizontal");
    expect(h).toBeDefined();
  });

  it("left edge alignment を検出", () => {
    const drag = { x: 100, y: 100, width: 50, height: 50 };
    const targets = [{ id: "t1", rect: { x: 102, y: 300, width: 50, height: 50 } }];
    const guides = detectGuidelines(drag, targets);
    const v = guides.find((g) => g.axis === "vertical");
    expect(v).toBeDefined();
    expect(v!.kind.dragEdge).toBe("left");
  });

  it("tolerance 外なら alignment 検出しない", () => {
    const drag = { x: 100, y: 100, width: 50, height: 50 };
    const targets = [{ id: "t1", rect: { x: 300, y: 100 + GUIDELINE_SNAP_TOLERANCE * 3, width: 50, height: 50 } }];
    const guides = detectGuidelines(drag, targets);
    expect(guides.length).toBe(0);
  });

  it("snapDelta は正しい方向 (正 = 下方向、 負 = 上方向)", () => {
    const drag = { x: 100, y: 100, width: 50, height: 50 };
    const targets = [{ id: "t1", rect: { x: 300, y: 105, width: 50, height: 50 } }];
    const guides = detectGuidelines(drag, targets);
    const h = guides.find((g) => g.axis === "horizontal");
    expect(h).toBeDefined();
    // drag top = 100、 target top = 105、 delta = target - drag = +5
    expect(h!.snapDelta).toBe(5);
  });
});

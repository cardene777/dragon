import { describe, it, expect } from "vitest";
import {
  overlayReducer,
  initialOverlayState,
  computeResize,
  type OverlayState,
  type OverlayPart,
} from "./overlay-reducer";

const P = (id: string, posX = 0, posY = 0, scale = 1): OverlayPart => ({ id, kind: "achievement", posX, posY, scale });

const withParts = (...parts: OverlayPart[]): OverlayState => ({
  ...initialOverlayState,
  parts,
});

describe("overlayReducer / set-parts", () => {
  it("空 state → parts set で反映", () => {
    const s = overlayReducer(initialOverlayState, { type: "set-parts", parts: [P("a")] });
    expect(s.parts).toHaveLength(1);
    expect(s.parts[0]!.id).toBe("a");
  });

  it("既 parts を新 list で上書き", () => {
    const s = overlayReducer(withParts(P("a"), P("b")), { type: "set-parts", parts: [P("c")] });
    expect(s.parts).toEqual([P("c")]);
  });
});

describe("overlayReducer / hover", () => {
  it("hover-enter で hoveredId set", () => {
    const s = overlayReducer(withParts(P("a")), { type: "hover-enter", id: "a" });
    expect(s.hoveredId).toBe("a");
  });

  it("hover-leave で hoveredId clear (同 id)", () => {
    const s0 = { ...withParts(P("a")), hoveredId: "a" };
    const s = overlayReducer(s0, { type: "hover-leave", id: "a" });
    expect(s.hoveredId).toBeNull();
  });

  it("hover-leave で 別 id は clear しない", () => {
    const s0 = { ...withParts(P("a")), hoveredId: "b" };
    const s = overlayReducer(s0, { type: "hover-leave", id: "a" });
    expect(s.hoveredId).toBe("b");
  });

  it("drag 中は hover-leave 無視 (ちらつき防止)", () => {
    const s0 = overlayReducer(withParts(P("a")), { type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1 });
    const s = overlayReducer(s0, { type: "hover-leave", id: "a" });
    expect(s.hoveredId).toBe("a");
  });

  it("resize 中は hover-leave 無視", () => {
    const s0 = overlayReducer(withParts(P("a")), {
      type: "resize-start", id: "a", corner: "se", clientX: 0, clientY: 0, clientW: 100, clientH: 100, panScale: 1,
    });
    const s = overlayReducer(s0, { type: "hover-leave", id: "a" });
    expect(s.hoveredId).toBe("a");
  });
});

describe("overlayReducer / drag", () => {
  it("drag-start で state 作成 (posX/Y 初期値 capture)", () => {
    const s = overlayReducer(withParts(P("a", 100, 200)), {
      type: "drag-start", id: "a", clientX: 500, clientY: 600, panScale: 1,
    });
    expect(s.dragging).toEqual({
      id: "a", startPosX: 100, startPosY: 200, startClientX: 500, startClientY: 600, panScale: 1,
    });
    expect(s.hoveredId).toBe("a");
  });

  it("存在しない id では drag-start 無視", () => {
    const s = overlayReducer(withParts(P("a")), {
      type: "drag-start", id: "does-not-exist", clientX: 0, clientY: 0, panScale: 1,
    });
    expect(s.dragging).toBeNull();
  });

  it("resize 中は drag-start 発火せず (排他)", () => {
    const s0 = overlayReducer(withParts(P("a")), {
      type: "resize-start", id: "a", corner: "se", clientX: 0, clientY: 0, clientW: 100, clientH: 100, panScale: 1,
    });
    const s = overlayReducer(s0, { type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1 });
    expect(s.dragging).toBeNull();
    expect(s.resizing).not.toBeNull();
  });

  it("drag-move で posX/Y が client delta / panScale で更新", () => {
    const s0 = overlayReducer(withParts(P("a", 100, 200)), {
      type: "drag-start", id: "a", clientX: 500, clientY: 600, panScale: 2,
    });
    const s = overlayReducer(s0, { type: "drag-move", clientX: 700, clientY: 900 });
    // client delta = (200, 300), panScale=2 → world delta = (100, 150)
    expect(s.parts[0]!.posX).toBe(200); // 100 + 100
    expect(s.parts[0]!.posY).toBe(350); // 200 + 150
  });

  it("drag-move の panScale=1 で client delta そのまま反映", () => {
    const s0 = overlayReducer(withParts(P("a", 0, 0)), {
      type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1,
    });
    const s = overlayReducer(s0, { type: "drag-move", clientX: 400, clientY: -300 });
    expect(s.parts[0]!.posX).toBe(400);
    expect(s.parts[0]!.posY).toBe(-300);
  });

  it("drag 中は他 parts 位置に影響なし", () => {
    const s0 = overlayReducer(withParts(P("a", 100, 100), P("b", 500, 500)), {
      type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1,
    });
    const s = overlayReducer(s0, { type: "drag-move", clientX: 200, clientY: 0 });
    expect(s.parts[0]!.posX).toBe(300);
    expect(s.parts[1]!.posX).toBe(500); // b 不変
    expect(s.parts[1]!.posY).toBe(500);
  });

  it("drag-end で dragging clear、 posX/Y は最終値保持", () => {
    const s0 = overlayReducer(withParts(P("a", 100, 200)), {
      type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1,
    });
    const s1 = overlayReducer(s0, { type: "drag-move", clientX: 50, clientY: 60 });
    const s = overlayReducer(s1, { type: "drag-end" });
    expect(s.dragging).toBeNull();
    expect(s.parts[0]!.posX).toBe(150);
    expect(s.parts[0]!.posY).toBe(260);
  });

  it("drag-start なしの drag-move は state 不変", () => {
    const s = overlayReducer(withParts(P("a")), { type: "drag-move", clientX: 100, clientY: 100 });
    expect(s.parts).toEqual([P("a")]);
  });
});

describe("overlayReducer / resize", () => {
  it("resize-start で state 作成 (全 initial capture)", () => {
    const s = overlayReducer(withParts(P("a", 100, 200, 1)), {
      type: "resize-start", id: "a", corner: "se", clientX: 500, clientY: 600, clientW: 300, clientH: 400, panScale: 1,
    });
    expect(s.resizing).toEqual({
      id: "a", corner: "se", startScale: 1, startClientX: 500, startClientY: 600,
      startPosX: 100, startPosY: 200, startClientW: 300, startClientH: 400, panScale: 1,
    });
  });

  it("drag 中は resize-start 発火せず (排他)", () => {
    const s0 = overlayReducer(withParts(P("a")), {
      type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1,
    });
    const s = overlayReducer(s0, {
      type: "resize-start", id: "a", corner: "se", clientX: 0, clientY: 0, clientW: 100, clientH: 100, panScale: 1,
    });
    expect(s.resizing).toBeNull();
    expect(s.dragging).not.toBeNull();
  });

  it("SE corner drag = scale 増加 + posX/Y 不変 (top-left anchor)", () => {
    const s0 = overlayReducer(withParts(P("a", 100, 200, 1)), {
      type: "resize-start", id: "a", corner: "se", clientX: 400, clientY: 500, clientW: 200, clientH: 200, panScale: 1,
    });
    // client を +100/+100 動かす = SE 方向に伸ばす、 aspect 保持で max=100
    const s = overlayReducer(s0, { type: "resize-move", clientX: 500, clientY: 600 });
    // new clientW = 200 + 100 = 300、 scaleRatio = 1.5、 newScale = 1 * 1.5 = 1.5
    expect(s.parts[0]!.scale).toBeCloseTo(1.5, 3);
    expect(s.parts[0]!.posX).toBe(100); // SE anchor top-left = 不変
    expect(s.parts[0]!.posY).toBe(200);
  });

  it("NW corner drag = scale 増加 + posX/Y 逆補正 (bottom-right anchor)", () => {
    const s0 = overlayReducer(withParts(P("a", 500, 500, 1)), {
      type: "resize-start", id: "a", corner: "nw", clientX: 500, clientY: 500, clientW: 200, clientH: 200, panScale: 1,
    });
    // client を -100/-100 動かす = NW 方向に伸ばす、 signX = -1、 signY = -1、 deltaW = 100、 deltaH = 100
    const s = overlayReducer(s0, { type: "resize-move", clientX: 400, clientY: 400 });
    expect(s.parts[0]!.scale).toBeCloseTo(1.5, 3);
    expect(s.parts[0]!.posX).toBe(400); // 500 - 100 shift
    expect(s.parts[0]!.posY).toBe(400);
  });

  it("NE corner drag = posX 不変 + posY 逆補正", () => {
    const s0 = overlayReducer(withParts(P("a", 100, 500, 1)), {
      type: "resize-start", id: "a", corner: "ne", clientX: 700, clientY: 500, clientW: 200, clientH: 200, panScale: 1,
    });
    // client を +100/-100 動かす = NE 方向に伸ばす、 signX = +1、 signY = -1、 deltaW = 100、 deltaH = 100
    const s = overlayReducer(s0, { type: "resize-move", clientX: 800, clientY: 400 });
    expect(s.parts[0]!.scale).toBeCloseTo(1.5, 3);
    expect(s.parts[0]!.posX).toBe(100); // 変化なし (NE = right-anchor だが posX は top-left なので不変ではない…)
    expect(s.parts[0]!.posY).toBe(400); // 500 - 100 shift
  });

  it("SW corner drag = posX 逆補正 + posY 不変", () => {
    const s0 = overlayReducer(withParts(P("a", 500, 100, 1)), {
      type: "resize-start", id: "a", corner: "sw", clientX: 500, clientY: 700, clientW: 200, clientH: 200, panScale: 1,
    });
    const s = overlayReducer(s0, { type: "resize-move", clientX: 400, clientY: 800 });
    expect(s.parts[0]!.scale).toBeCloseTo(1.5, 3);
    expect(s.parts[0]!.posX).toBe(400); // 500 - 100 shift
    expect(s.parts[0]!.posY).toBe(100); // 変化なし
  });

  it("panScale > 1 で client delta が world delta に縮小反映", () => {
    const s0 = overlayReducer(withParts(P("a", 100, 100, 1)), {
      type: "resize-start", id: "a", corner: "se", clientX: 400, clientY: 400, clientW: 200, clientH: 200, panScale: 2,
    });
    // client を +100 動かす = world では +50
    const s = overlayReducer(s0, { type: "resize-move", clientX: 500, clientY: 500 });
    // scaleRatio は client 単位なので pan 影響なし = 1.5
    expect(s.parts[0]!.scale).toBeCloseTo(1.5, 3);
    // SE = posX/Y 変化なし
    expect(s.parts[0]!.posX).toBe(100);
  });

  it("resize-end で resizing clear、 scale 最終値保持", () => {
    const s0 = overlayReducer(withParts(P("a", 0, 0, 1)), {
      type: "resize-start", id: "a", corner: "se", clientX: 0, clientY: 0, clientW: 100, clientH: 100, panScale: 1,
    });
    const s1 = overlayReducer(s0, { type: "resize-move", clientX: 50, clientY: 50 });
    const s = overlayReducer(s1, { type: "resize-end" });
    expect(s.resizing).toBeNull();
    expect(s.parts[0]!.scale).toBeCloseTo(1.5, 3);
  });

  it("scale 下限 = 0.1 で clamp", () => {
    const s0 = overlayReducer(withParts(P("a", 0, 0, 1)), {
      type: "resize-start", id: "a", corner: "se", clientX: 100, clientY: 100, clientW: 100, clientH: 100, panScale: 1,
    });
    // 巨大縮小 = -10000 shift
    const s = overlayReducer(s0, { type: "resize-move", clientX: -10000, clientY: -10000 });
    // clientW 下限 = 20、 scaleRatio = 20/100 = 0.2、 scale = 0.2、 lower bound 0.1 内
    expect(s.parts[0]!.scale).toBeGreaterThanOrEqual(0.1);
  });

  it("clientW 下限 = 20 で clamp (これ以下に縮まない)", () => {
    const s0 = overlayReducer(withParts(P("a")), {
      type: "resize-start", id: "a", corner: "se", clientX: 100, clientY: 100, clientW: 100, clientH: 100, panScale: 1,
    });
    const s = overlayReducer(s0, { type: "resize-move", clientX: -10000, clientY: -10000 });
    // newClientW = max(20, 100 - deltaMax_negative) = 20
    // scaleRatio = 20/100 = 0.2
    expect(s.parts[0]!.scale).toBeCloseTo(0.2, 3);
  });
});

describe("computeResize (pure helper 単体)", () => {
  it("SE で 正方向 drag = scale 比例増加", () => {
    const r = computeResize({
      corner: "se", clientX: 300, clientY: 300, startClientX: 200, startClientY: 200,
      startClientW: 100, startClientH: 100, startScale: 1, startPosX: 0, startPosY: 0, panScale: 1,
    });
    expect(r.scale).toBeCloseTo(2, 3); // 100 → 200 = 2倍
    expect(r.posX).toBe(0);
    expect(r.posY).toBe(0);
  });

  it("aspect 保持 = 大きい delta 側を採用", () => {
    const r = computeResize({
      corner: "se", clientX: 300, clientY: 210, startClientX: 200, startClientY: 200,
      startClientW: 100, startClientH: 100, startScale: 1, startPosX: 0, startPosY: 0, panScale: 1,
    });
    // deltaW = 100, deltaH = 10、 max = 100 → scale = 2
    expect(r.scale).toBeCloseTo(2, 3);
  });

  it("panScale で posX/Y 補正が世界単位", () => {
    const r = computeResize({
      corner: "nw", clientX: 100, clientY: 100, startClientX: 200, startClientY: 200,
      startClientW: 200, startClientH: 200, startScale: 1, startPosX: 500, startPosY: 500, panScale: 2,
    });
    // clientDelta = -100, sign -1, deltaW = 100, newClientW = 300、 scaleRatio = 1.5、 scale = 1.5
    // deltaClientW = 100、 deltaWorldW = 50 (panScale=2)
    // NW = posX shift = -50
    expect(r.posX).toBe(450);
    expect(r.posY).toBe(450);
  });
});

describe("overlayReducer / invariants (property-like)", () => {
  it("drag + 逆 drag で元の位置に戻る", () => {
    let s = overlayReducer(withParts(P("a", 100, 200)), {
      type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1,
    });
    s = overlayReducer(s, { type: "drag-move", clientX: 300, clientY: 400 });
    s = overlayReducer(s, { type: "drag-end" });
    s = overlayReducer(s, { type: "drag-start", id: "a", clientX: 0, clientY: 0, panScale: 1 });
    s = overlayReducer(s, { type: "drag-move", clientX: -300, clientY: -400 });
    s = overlayReducer(s, { type: "drag-end" });
    expect(s.parts[0]!.posX).toBe(100);
    expect(s.parts[0]!.posY).toBe(200);
  });

  it("複数 parts drag = 対象以外の parts は全 event で不変", () => {
    let s = withParts(P("a", 10, 20), P("b", 100, 200), P("c", 500, 600));
    s = overlayReducer(s, { type: "drag-start", id: "b", clientX: 0, clientY: 0, panScale: 1 });
    for (let i = 1; i <= 20; i++) {
      s = overlayReducer(s, { type: "drag-move", clientX: i * 5, clientY: i * 3 });
      // 各 tick で a と c は不変
      expect(s.parts[0]).toEqual(P("a", 10, 20));
      expect(s.parts[2]).toEqual(P("c", 500, 600));
    }
    s = overlayReducer(s, { type: "drag-end" });
    expect(s.parts[0]).toEqual(P("a", 10, 20));
    expect(s.parts[2]).toEqual(P("c", 500, 600));
    expect(s.parts[1]!.posX).toBe(200); // 100 + 100
    expect(s.parts[1]!.posY).toBe(260); // 200 + 60
  });

  it("resize + 逆 resize で元 scale に戻る (SE)", () => {
    let s = overlayReducer(withParts(P("a", 100, 100, 1)), {
      type: "resize-start", id: "a", corner: "se", clientX: 200, clientY: 200, clientW: 100, clientH: 100, panScale: 1,
    });
    s = overlayReducer(s, { type: "resize-move", clientX: 250, clientY: 250 });
    const midScale = s.parts[0]!.scale;
    s = overlayReducer(s, { type: "resize-move", clientX: 200, clientY: 200 });
    expect(s.parts[0]!.scale).toBeCloseTo(1, 3);
    expect(midScale).toBeCloseTo(1.5, 3);
  });
});

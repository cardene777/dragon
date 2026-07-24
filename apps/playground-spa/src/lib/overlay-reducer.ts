/**
 * overlay parts の drag / resize / hover 全 state 遷移を pure function として定義する reducer。
 *
 * CdlEditor.tsx から interaction logic を抽出、 DOM / React 依存ゼロで vitest 単発 test 可能にする。
 * user 要求「現在の状況をしっかり把握 + ダメな状態を早く」 に対応する 4 層 test の Layer 2 中核。
 *
 * 設計原則:
 *   - 全 event が pure 変換 (state, event) → newState。 副作用なし。
 *   - client px 統一 (pan.scale / p.scale の単位混在バグ対策)。
 *   - drag / resize の同時発火は禁止 (先勝ち)、 排他 state で保持。
 *   - anchor 逆補正 = drag corner の対角固定を pure 計算で担保。
 */

export type Corner = "nw" | "ne" | "sw" | "se";

export type OverlayPart = {
  id: string;
  kind: string;
  posX: number;
  posY: number;
  scale: number;
};

export type DragState = {
  id: string;
  startPosX: number;
  startPosY: number;
  startClientX: number;
  startClientY: number;
  panScale: number;
};

export type ResizeState = {
  id: string;
  corner: Corner;
  startScale: number;
  startClientX: number;
  startClientY: number;
  startPosX: number;
  startPosY: number;
  startClientW: number;
  startClientH: number;
  panScale: number;
};

export type OverlayState = {
  parts: OverlayPart[];
  dragging: DragState | null;
  resizing: ResizeState | null;
  hoveredId: string | null;
};

export type OverlayEvent =
  | { type: "set-parts"; parts: OverlayPart[] }
  | { type: "hover-enter"; id: string }
  | { type: "hover-leave"; id: string }
  | { type: "drag-start"; id: string; clientX: number; clientY: number; panScale: number }
  | { type: "drag-move"; clientX: number; clientY: number }
  | { type: "drag-end" }
  | {
      type: "resize-start";
      id: string;
      corner: Corner;
      clientX: number;
      clientY: number;
      clientW: number;
      clientH: number;
      panScale: number;
    }
  | { type: "resize-move"; clientX: number; clientY: number }
  | { type: "resize-end" };

export const initialOverlayState: OverlayState = {
  parts: [],
  dragging: null,
  resizing: null,
  hoveredId: null,
};

/**
 * 全 event pure 変換。 副作用なし。
 */
export function overlayReducer(state: OverlayState, event: OverlayEvent): OverlayState {
  switch (event.type) {
    case "set-parts":
      return { ...state, parts: event.parts };
    case "hover-enter":
      return { ...state, hoveredId: event.id };
    case "hover-leave":
      // drag / resize 中は hover 継続 (ちらつき防止)
      if (state.dragging || state.resizing) return state;
      if (state.hoveredId !== event.id) return state;
      return { ...state, hoveredId: null };
    case "drag-start": {
      const part = state.parts.find((p) => p.id === event.id);
      if (!part) return state;
      // resize 中は drag 発火不可 (排他)
      if (state.resizing) return state;
      return {
        ...state,
        dragging: {
          id: event.id,
          startPosX: part.posX,
          startPosY: part.posY,
          startClientX: event.clientX,
          startClientY: event.clientY,
          panScale: event.panScale,
        },
        hoveredId: event.id,
      };
    }
    case "drag-move": {
      if (!state.dragging) return state;
      const st = state.dragging;
      const dx = (event.clientX - st.startClientX) / st.panScale;
      const dy = (event.clientY - st.startClientY) / st.panScale;
      const newParts = state.parts.map((p) =>
        p.id === st.id ? { ...p, posX: st.startPosX + dx, posY: st.startPosY + dy } : p,
      );
      return { ...state, parts: newParts };
    }
    case "drag-end":
      if (!state.dragging) return state;
      return { ...state, dragging: null };
    case "resize-start": {
      const part = state.parts.find((p) => p.id === event.id);
      if (!part) return state;
      // drag 中は resize 発火不可 (排他)
      if (state.dragging) return state;
      return {
        ...state,
        resizing: {
          id: event.id,
          corner: event.corner,
          startScale: part.scale,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startPosX: part.posX,
          startPosY: part.posY,
          startClientW: event.clientW,
          startClientH: event.clientH,
          panScale: event.panScale,
        },
        hoveredId: event.id,
      };
    }
    case "resize-move": {
      if (!state.resizing) return state;
      const st = state.resizing;
      const result = computeResize({
        corner: st.corner,
        clientX: event.clientX,
        clientY: event.clientY,
        startClientX: st.startClientX,
        startClientY: st.startClientY,
        startClientW: st.startClientW,
        startClientH: st.startClientH,
        startScale: st.startScale,
        startPosX: st.startPosX,
        startPosY: st.startPosY,
        panScale: st.panScale,
      });
      const newParts = state.parts.map((p) =>
        p.id === st.id ? { ...p, scale: result.scale, posX: result.posX, posY: result.posY } : p,
      );
      return { ...state, parts: newParts };
    }
    case "resize-end":
      if (!state.resizing) return state;
      return { ...state, resizing: null };
    default:
      return state;
  }
}

/**
 * resize の corner drag 計算を単独 pure 関数化 (unit test しやすさ + reducer 内で再利用)。
 * client px 統一で scale / posX / posY を返す。 aspect ratio 保持 (X/Y 大きい方 delta 基準)。
 * nw / ne / sw では anchor (drag corner の対角) 固定のため posX / posY を逆補正する。
 */
export function computeResize(input: {
  corner: Corner;
  clientX: number;
  clientY: number;
  startClientX: number;
  startClientY: number;
  startClientW: number;
  startClientH: number;
  startScale: number;
  startPosX: number;
  startPosY: number;
  panScale: number;
}): { scale: number; posX: number; posY: number } {
  const {
    corner,
    clientX,
    clientY,
    startClientX,
    startClientY,
    startClientW,
    startClientH,
    startScale,
    startPosX,
    startPosY,
    panScale,
  } = input;
  const dxClient = clientX - startClientX;
  const dyClient = clientY - startClientY;
  const signX = corner === "ne" || corner === "se" ? 1 : -1;
  const signY = corner === "sw" || corner === "se" ? 1 : -1;
  const deltaW = dxClient * signX;
  const deltaH = dyClient * signY;
  const deltaMax = Math.max(deltaW, deltaH);
  const newClientW = Math.max(20, startClientW + deltaMax);
  const scaleRatio = newClientW / startClientW;
  const newScale = Math.max(0.1, startScale * scaleRatio);
  const deltaClientW = newClientW - startClientW;
  const deltaClientH = (newClientW / startClientW) * startClientH - startClientH;
  const deltaWorldW = deltaClientW / panScale;
  const deltaWorldH = deltaClientH / panScale;
  let posX = startPosX;
  let posY = startPosY;
  if (corner === "nw" || corner === "sw") posX = startPosX - deltaWorldW;
  if (corner === "nw" || corner === "ne") posY = startPosY - deltaWorldH;
  return { scale: newScale, posX, posY };
}

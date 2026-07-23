import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { compile, type CdlDiagram, type LaidDiagram, type LaidLane, type LaidNode } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import {
  updateActorPosition,
  extractActorPosition,
  extractAllActorNames,
  slugify as slugifyActor,
} from "@/lib/canvas-pivot-interaction";

/**
 * HTML div canvas editor (Miro / Figma / Google スライド 相当 GPU accelerated `translate3d` 経路)。
 *
 * 前 session (2026-07-23 昼) で SVG element の CSS `style.transform` loop + cdl auto layout spec の
 * 組合わせが Miro / Figma 品質に届かない技術限界を実測確定 (7 PR 全 revert)、 architecture 転換として
 * HTML div canvas を新設する Phase 1 実装。
 *
 * 設計 SSOT = `decisions/personal/decision-log/2026-07-23-dragon-editor-html-div-canvas-architecture.md`。
 *
 * 4 論点確定 (architecture decision-log 参照):
 * 1. 実装配置 = editor 右 pane 完全置換 (feature flag `?canvas=html` opt-in で並置、 catalog SVG 経路無傷)
 * 2. cdl 経路 = cdl 1 回計算 → HTML div 転写 (initial mount 時のみ compile、 drag 中は cdl 呼ばず)
 * 3. DSL sync = drag end で YAML DSL posX/posY 書換 (updateActorPosition 経路継続)
 * 4. node visual = cdl SVG 忠実模写 (Phase 1 は actor lane のみ、 arrow / phase / topic は Phase 2 以降)
 *
 * 挙動 (Stated check 3 条件):
 * - 掴んだ点 = 置いた点 (drag end で world 座標を round → DSL write back、 再 render で同座標に settle)
 * - drag 中 smooth 追従 (pointer move → ref update → RAF で 1 回だけ transform 書換、 setState 経由なし)
 * - release 後 flicker ゼロ (transform 直接書換で先に visual 確定 → DSL write back で React 再 render 時
 *   に同座標に settle するため画面上の差分なし)
 */

interface HtmlDivCanvasEditorProps {
  /** dragon DSL YAML source (CdlEditor 側で state 保持) */
  src: string;
  /** drag end で書換された src を親 (CdlEditor) に通知、 CodeMirror へ双方向 sync */
  onSrcChange: (next: string) => void;
  /** parts catalog (CAR-1657 unified syntax、 partsCatalog 経由で kind = parts identifier を展開) */
  partsCatalog?: Record<string, CdlDiagram>;
  /** test 用 = window mirror に internal state を公開する経路 (e2e 検証用、 production では読み手なし) */
  testId?: string;
}

interface LaneVisual {
  /** DSL 側 actor 名 (write back key) */
  name: string;
  /** cdl slug (data attr / lane.id 照合用) */
  slug: string;
  /** world 座標 (viewBox 単位、 cdl compile 出力の LaidLane.x/y) */
  worldX: number;
  worldY: number;
  worldW: number;
  worldH: number;
  /** lane に紐づく nodes (Phase 2 で実描画拡張、 Phase 1 では count のみ visualize) */
  nodeCount: number;
}

const CANVAS_TEST_MIRROR_KEY = "__htmlCanvasState";

function isCanvasHtmlEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("canvas") === "html";
}

/** Query param `?canvas=html` を検出する feature flag (export = CdlEditor 側から参照)。 */
export const canvasHtmlFeatureFlag = {
  isEnabled: isCanvasHtmlEnabled,
};

/**
 * DSL src と LaidDiagram から LaneVisual[] を生成。
 * cdl slug と DSL 名の対応は slugifyActor で照合、 posX/posY 未指定 lane は cdl auto layout の x/y を採用。
 */
function buildLaneVisuals(src: string, laid: LaidDiagram): LaneVisual[] {
  const actorNames = extractAllActorNames(src);
  const slugToName = new Map<string, string>();
  for (const name of actorNames) {
    slugToName.set(slugifyActor(name), name);
    slugToName.set(name, name);
  }
  const nodeCountByLane = new Map<string, number>();
  for (const n of laid.nodes) {
    nodeCountByLane.set(n.lane, (nodeCountByLane.get(n.lane) ?? 0) + 1);
  }
  const out: LaneVisual[] = [];
  for (const lane of laid.lanes) {
    const dslName = slugToName.get(lane.id) ?? lane.id;
    // updateActorPosition が posX/posY 書換済なら DSL の値を優先 (cdl auto layout の x が同一値だが
    // guard で明示、 DSL 側書換 → laid → visual の変換 pipeline の可読性向上)。
    const dslPos = extractActorPosition(src, dslName);
    const worldX = dslPos?.posX ?? lane.x;
    const worldY = dslPos?.posY ?? lane.y;
    out.push({
      name: dslName,
      slug: lane.id,
      worldX,
      worldY,
      worldW: dslPos?.posW ?? lane.width,
      worldH: dslPos?.posH ?? lane.height,
      nodeCount: nodeCountByLane.get(lane.id) ?? 0,
    });
  }
  return out;
}

interface DragRef {
  laneName: string;
  laneEl: HTMLDivElement;
  startClientX: number;
  startClientY: number;
  startWorldX: number;
  startWorldY: number;
  currentWorldX: number;
  currentWorldY: number;
  scale: number;
  pointerId: number;
  rafScheduled: boolean;
  /** flicker ゼロ検証用 = drag end 直後の visual 位置を保持 (再 render 前) */
  finalWorldX: number;
  finalWorldY: number;
}

/**
 * HtmlDivCanvasEditor 本体。
 *
 * 使い方 (CdlEditor.tsx 側):
 * ```
 * {canvasHtmlFeatureFlag.isEnabled() ? (
 *   <HtmlDivCanvasEditor src={src} onSrcChange={setSrc} partsCatalog={partsCatalog} />
 * ) : (
 *   <CdlDiagramView diagram={diagram} disableAutoFit />
 * )}
 * ```
 */
export function HtmlDivCanvasEditor({ src, onSrcChange, partsCatalog, testId }: HtmlDivCanvasEditorProps): React.ReactElement {
  // 1. DSL → CdlDiagram (parse) → LaidDiagram (layout 計算)
  const laid = useMemo<LaidDiagram | null>(() => {
    try {
      const d = textDslToDiagram(src, { partsCatalog });
      return compile(d);
    } catch {
      return null;
    }
  }, [src, partsCatalog]);

  // 2. LaneVisual[] 生成
  const lanes = useMemo(() => (laid ? buildLaneVisuals(src, laid) : []), [src, laid]);

  // 3. viewport 座標 (pan / zoom は今回 fit 固定、 Phase 2 以降で拡張)
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportTransform, setViewportTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const viewportScaleRef = useRef(1);
  useEffect(() => {
    viewportScaleRef.current = viewportTransform.scale;
  }, [viewportTransform.scale]);

  // 4. 初回 fit (viewBox が viewport にちょうど収まる scale + center 配置)
  const initialFitDoneRef = useRef(false);
  useEffect(() => {
    if (!laid || !viewportRef.current || initialFitDoneRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const vb = laid.viewBox;
    if (vb.w === 0 || vb.h === 0) return;
    const PADDING_RATIO = 0.04;
    const availableW = rect.width * (1 - PADDING_RATIO * 2);
    const availableH = rect.height * (1 - PADDING_RATIO * 2);
    const scale = Math.min(availableW / vb.w, availableH / vb.h);
    const tx = (rect.width - vb.w * scale) / 2;
    const ty = (rect.height - vb.h * scale) / 2;
    setViewportTransform({ tx, ty, scale });
    initialFitDoneRef.current = true;
  }, [laid]);

  // 5. drag state (ref、 React 再 render 経由なし)
  const dragRef = useRef<DragRef | null>(null);

  // 6. lane div 参照 map (drag 対象の element を直接 transform 書換するため)
  const laneElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 7. pointer down / move / up handlers (RAF driven direct DOM update)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, lane: LaneVisual) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const laneEl = e.currentTarget;
      laneEl.setPointerCapture(e.pointerId);
      const scale = viewportScaleRef.current;
      dragRef.current = {
        laneName: lane.name,
        laneEl,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startWorldX: lane.worldX,
        startWorldY: lane.worldY,
        currentWorldX: lane.worldX,
        currentWorldY: lane.worldY,
        finalWorldX: lane.worldX,
        finalWorldY: lane.worldY,
        scale: scale > 0 ? scale : 1,
        pointerId: e.pointerId,
        rafScheduled: false,
      };
      laneEl.classList.add("html-canvas-lane-dragging");
    },
    [],
  );

  const flushRaf = useCallback(() => {
    const st = dragRef.current;
    if (!st) return;
    st.rafScheduled = false;
    st.laneEl.style.transform = `translate3d(${st.currentWorldX}px, ${st.currentWorldY}px, 0)`;
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = dragRef.current;
      if (!st || e.pointerId !== st.pointerId) return;
      const deltaClientX = e.clientX - st.startClientX;
      const deltaClientY = e.clientY - st.startClientY;
      st.currentWorldX = st.startWorldX + deltaClientX / st.scale;
      st.currentWorldY = st.startWorldY + deltaClientY / st.scale;
      if (st.rafScheduled) return;
      st.rafScheduled = true;
      window.requestAnimationFrame(flushRaf);
    },
    [flushRaf],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = dragRef.current;
      if (!st || e.pointerId !== st.pointerId) return;
      // flicker ゼロ経路 = release 直前 pointer 位置を最終座標として direct transform 書換
      const deltaClientX = e.clientX - st.startClientX;
      const deltaClientY = e.clientY - st.startClientY;
      st.finalWorldX = st.startWorldX + deltaClientX / st.scale;
      st.finalWorldY = st.startWorldY + deltaClientY / st.scale;
      st.laneEl.style.transform = `translate3d(${st.finalWorldX}px, ${st.finalWorldY}px, 0)`;
      st.laneEl.classList.remove("html-canvas-lane-dragging");
      try {
        st.laneEl.releasePointerCapture(st.pointerId);
      } catch {
        // pointer capture 未取得は無害
      }
      // DSL write back (Math.round で round trip 一致、 updateActorPosition が Math.round 実施済)
      const nextSrc = updateActorPosition(src, st.laneName, st.finalWorldX, st.finalWorldY);
      dragRef.current = null;
      if (nextSrc !== src) {
        onSrcChange(nextSrc);
      }
    },
    [src, onSrcChange],
  );

  // 8. test mirror = window.__htmlCanvasState (e2e 検証用、 lane world 座標 dump)
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as Record<string, unknown>)[CANVAS_TEST_MIRROR_KEY] = {
      viewBox: laid?.viewBox ?? null,
      viewportTransform,
      lanes: lanes.map((l) => ({
        name: l.name,
        slug: l.slug,
        worldX: l.worldX,
        worldY: l.worldY,
        worldW: l.worldW,
        worldH: l.worldH,
      })),
    };
  }, [laid, lanes, viewportTransform]);

  if (!laid) {
    return (
      <div className="html-canvas-viewport" data-testid={testId} style={viewportStyle}>
        <div style={placeholderStyle}>DSL parse error, HTML div canvas を描画できません。</div>
      </div>
    );
  }

  const vb = laid.viewBox;

  return (
    <div ref={viewportRef} className="html-canvas-viewport" data-testid={testId} style={viewportStyle}>
      <div
        className="html-canvas-world"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: vb.w,
          height: vb.h,
          transform: `translate3d(${viewportTransform.tx}px, ${viewportTransform.ty}px, 0) scale(${viewportTransform.scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {lanes.map((lane) => (
          <div
            key={lane.name}
            ref={(el) => {
              if (el) laneElRefs.current.set(lane.name, el);
              else laneElRefs.current.delete(lane.name);
            }}
            className="html-canvas-lane"
            data-html-canvas-lane={lane.slug}
            data-html-canvas-lane-name={lane.name}
            onPointerDown={(e) => handlePointerDown(e, lane)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: lane.worldW,
              height: lane.worldH,
              transform: `translate3d(${lane.worldX}px, ${lane.worldY}px, 0)`,
              willChange: "transform",
              boxSizing: "border-box",
              cursor: "grab",
              background: "rgba(184, 134, 42, 0.08)",
              border: "1.5px solid #b8862a",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#1a1410",
              fontFamily: "'JetBrains Mono', 'Noto Sans JP', monospace",
              fontSize: "14px",
              fontWeight: 500,
              userSelect: "none",
              touchAction: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              gap: 4,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{lane.name}</div>
            {lane.nodeCount > 0 ? (
              <div style={{ fontSize: 11, color: "#8a5a2a", opacity: 0.75 }}>
                nodes: {lane.nodeCount}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const viewportStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  background: "var(--v4-editor-preview-bg, #fcf8ee)",
  touchAction: "none",
};

const placeholderStyle: React.CSSProperties = {
  padding: 24,
  color: "#8a5a2a",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
};

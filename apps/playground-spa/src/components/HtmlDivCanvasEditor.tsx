import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import type { LaidDiagram } from "@cardenelabs/cdl";
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
 *
 * Round 2 fix (Codex adversarial review 6 MAJOR 対応):
 * - F1 = drag write-back で対象外 lane も現在座標で pin し、 posW/posH も保持
 * - F2 = fit 計算で viewBox 原点 (vb.x/vb.y、 通常負) を補正
 * - F4 = pointer cleanup 経路 (multi-pointer 排他 / pointercancel / lostpointercapture / blur / unmount)
 * - F5 = parse 経路を親から受取り、 子は compile のみ (parse 重複を除去、 親 debounce と 1:1)
 */

interface HtmlDivCanvasEditorProps {
  /** dragon DSL YAML source (CdlEditor 側で state 保持、 drag end write back の SSOT) */
  src: string;
  /** drag end で書換された src を親 (CdlEditor) に通知、 CodeMirror へ双方向 sync */
  onSrcChange: (next: string) => void;
  /**
   * Round 2 F5 対応 = 親側で compile 済 LaidDiagram を SSOT として受け取る (compile 重複を完全排除)。
   * 未指定 (`null`) 時は空 canvas を描画 (親の compile pipeline 未 settle の初回 render 用)。
   */
  laid?: LaidDiagram | null;
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
  /** F1 = drag write-back で pin 用の元 posW/posH (DSL 明示済なら保持、 未指定なら world から拾う) */
  origPosW?: number;
  origPosH?: number;
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
      origPosW: dslPos?.posW,
      origPosH: dslPos?.posH,
      nodeCount: nodeCountByLane.get(lane.id) ?? 0,
    });
  }
  return out;
}

/**
 * F1 対応 = drag 対象 lane の write back に加えて、 対象外 lane も現座標 (posX/posY) で pin する。
 * 対象外 lane の posW/posH は元 DSL に明示済なら保持、 未指定なら書出さない (undefined → updateActorPosition の
 * optional path)。 これで sequence preset の auto layout が「Client 移動時に API/DB が飛ぶ」 現象を防ぐ。
 */
function writeBackDragEndSrc(
  srcBase: string,
  lanes: LaneVisual[],
  targetName: string,
  targetX: number,
  targetY: number,
): string {
  let out = srcBase;
  // まず対象 lane を明示座標で write back (posW/posH を保持)
  const target = lanes.find((l) => l.name === targetName);
  if (target) {
    out = updateActorPosition(out, targetName, targetX, targetY, target.origPosW, target.origPosH);
  } else {
    out = updateActorPosition(out, targetName, targetX, targetY);
  }
  // 対象外 lane も現座標で pin (F1 の再配置回帰防止)
  for (const lane of lanes) {
    if (lane.name === targetName) continue;
    out = updateActorPosition(out, lane.name, lane.worldX, lane.worldY, lane.origPosW, lane.origPosH);
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
  rafHandle: number | null;
  finalWorldX: number;
  finalWorldY: number;
}

export interface HtmlDivCanvasEditorHandle {
  /** F3 対応 = 親 toolbar の Fit ボタンから呼ぶ imperative handle。 現在 viewBox に対して再 fit する。 */
  fit(): void;
  /** F3 対応 = 親 toolbar の Reset ボタンから呼ぶ imperative handle。 fit + drag state clear。 */
  reset(): void;
}

/**
 * HtmlDivCanvasEditor 本体。 CdlEditor 側で feature flag ON 時に render される。
 */
export const HtmlDivCanvasEditor = forwardRef<HtmlDivCanvasEditorHandle, HtmlDivCanvasEditorProps>(
  function HtmlDivCanvasEditor(
    { src, onSrcChange, laid: laidProp, testId }: HtmlDivCanvasEditorProps,
    ref,
  ): React.ReactElement {
    // Round 2 F5 対応 = 親から LaidDiagram を受取り、 子で compile 呼ばない (SSOT 一本化)。
    const laid: LaidDiagram | null = laidProp ?? null;
    const lanes = useMemo(() => (laid ? buildLaneVisuals(src, laid) : []), [src, laid]);

    // 3. viewport 座標 (fit only、 Phase 1 は pan / zoom 未実装、 F3 = toolbar は親側で disabled)
    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewportTransform, setViewportTransform] = useState({ tx: 0, ty: 0, scale: 1 });
    const viewportScaleRef = useRef(1);
    useEffect(() => {
      viewportScaleRef.current = viewportTransform.scale;
    }, [viewportTransform.scale]);

    // F2 対応 = viewBox 原点 (vb.x/vb.y、 通常負) を補正した fit 計算。
    const doFit = useCallback((): void => {
      if (!laid || !viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const vb = laid.viewBox;
      if (vb.w === 0 || vb.h === 0) return;
      const PADDING_RATIO = 0.04;
      const availableW = rect.width * (1 - PADDING_RATIO * 2);
      const availableH = rect.height * (1 - PADDING_RATIO * 2);
      const scale = Math.min(availableW / vb.w, availableH / vb.h);
      // F2 = tx/ty に vb.x/vb.y * scale を差引 (viewBox 原点補正)
      const tx = (rect.width - vb.w * scale) / 2 - vb.x * scale;
      const ty = (rect.height - vb.h * scale) / 2 - vb.y * scale;
      setViewportTransform({ tx, ty, scale });
    }, [laid]);

    // 4. 初回 fit と diagram (id 変化 = sample 切替) 変化時の再 fit
    const lastFitDiagramIdRef = useRef<string | null>(null);
    useEffect(() => {
      if (!laid || !viewportRef.current) return;
      if (lastFitDiagramIdRef.current === laid.id) return;
      lastFitDiagramIdRef.current = laid.id;
      // rAF 2 段で viewport 実 rect が settle した後に fit
      const raf1 = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => doFit());
      });
      return () => window.cancelAnimationFrame(raf1);
    }, [laid, doFit]);

    // 5. drag state (ref、 React 再 render 経由なし)
    const dragRef = useRef<DragRef | null>(null);

    // 6. lane div 参照 map (drag 対象の element を直接 transform 書換するため)
    const laneElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // F4 対応 = drag 中断時の共通 rollback (pointercancel / lostpointercapture / blur / unmount)
    const abortDrag = useCallback(() => {
      const st = dragRef.current;
      if (!st) return;
      if (st.rafHandle != null) {
        window.cancelAnimationFrame(st.rafHandle);
        st.rafHandle = null;
      }
      // 開始座標へ rollback (write back なし)
      st.laneEl.style.transform = `translate3d(${st.startWorldX}px, ${st.startWorldY}px, 0)`;
      st.laneEl.classList.remove("html-canvas-lane-dragging");
      try {
        st.laneEl.releasePointerCapture(st.pointerId);
      } catch {
        // pointer capture 未取得は無害
      }
      dragRef.current = null;
    }, []);

    // 7. pointer down / move / up handlers (RAF driven direct DOM update)
    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>, lane: LaneVisual) => {
        if (e.button !== 0) return;
        // F4 = active drag 中の追加 down は拒否 (multi-pointer 排他)
        if (dragRef.current) return;
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
          rafHandle: null,
        };
        laneEl.classList.add("html-canvas-lane-dragging");
      },
      [],
    );

    const flushRaf = useCallback(() => {
      const st = dragRef.current;
      if (!st) return;
      st.rafScheduled = false;
      st.rafHandle = null;
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
        st.rafHandle = window.requestAnimationFrame(flushRaf);
      },
      [flushRaf],
    );

    const handlePointerUp = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const st = dragRef.current;
        if (!st || e.pointerId !== st.pointerId) return;
        if (st.rafHandle != null) {
          window.cancelAnimationFrame(st.rafHandle);
          st.rafHandle = null;
        }
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
        // F1 対応 = 対象外 lane も現座標で pin して DSL write back (Client 移動時 API/DB 飛び防止)
        const nextSrc = writeBackDragEndSrc(src, lanes, st.laneName, st.finalWorldX, st.finalWorldY);
        dragRef.current = null;
        if (nextSrc !== src) {
          onSrcChange(nextSrc);
        }
      },
      [src, lanes, onSrcChange],
    );

    // F4 対応 = pointercancel / lostpointercapture / window.blur / unmount 共通 cleanup
    const handlePointerCancel = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const st = dragRef.current;
        if (!st || e.pointerId !== st.pointerId) return;
        abortDrag();
      },
      [abortDrag],
    );

    useEffect(() => {
      if (typeof window === "undefined") return;
      const onBlur = () => abortDrag();
      window.addEventListener("blur", onBlur);
      return () => {
        window.removeEventListener("blur", onBlur);
        abortDrag();
      };
    }, [abortDrag]);

    // F3 対応 = 親 toolbar から呼ぶ imperative handle (fit / reset)
    useImperativeHandle(
      ref,
      () => ({
        fit: () => doFit(),
        reset: () => {
          abortDrag();
          doFit();
        },
      }),
      [doFit, abortDrag],
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
          origPosW: l.origPosW ?? null,
          origPosH: l.origPosH ?? null,
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
              onPointerCancel={handlePointerCancel}
              onLostPointerCapture={handlePointerCancel}
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
  },
);

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

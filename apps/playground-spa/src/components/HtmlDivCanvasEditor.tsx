import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import type { LaidDiagram, NodeKind } from "@cardenelabs/cdl";
import {
  updateActorPosition,
  updateActorNodePosition,
  extractActorPosition,
  extractActorNodePosition,
  extractAllActorNames,
  resolveDslNameWithSubKey,
  slugify as slugifyActor,
} from "@/lib/canvas-pivot-interaction";

/**
 * HTML div canvas editor (Miro / Figma / Google スライド 相当 GPU accelerated `translate3d` 経路)。
 *
 * Phase 1 (CAR-1947、 PR #906) = lane drag + 3 条件 (掴んだ点=置いた点 / drag 中 smooth / release 後 flicker ゼロ)。
 * Phase 2 PR 1 (CAR-1952) = node (sequence step / class node / flow node 等 sub-node) を HTML div として描画 +
 * pointer drag + DSL sync (updateActorNodePosition 経由 nested nodes: { subKey: { posX, posY } } 書換)。
 *
 * 4 論点確定 (architecture decision-log):
 * 1. 実装配置 = editor 右 pane 完全置換 (feature flag `?canvas=html` opt-in で並置、 catalog SVG 経路無傷)
 * 2. cdl 経路 = cdl 1 回計算 → HTML div 転写 (initial mount 時のみ compile、 drag 中は cdl 呼ばず)
 * 3. DSL sync = drag end で YAML DSL posX/posY 書換 (updateActorPosition / updateActorNodePosition 継続)
 * 4. node visual = cdl SVG 忠実模写 (Phase 2 PR 1 は rectangle 描画 + label、 visual fidelity は PR 4 で拡張)
 *
 * 挙動 (Stated check 3 条件、 lane + node 双方適用):
 * - 掴んだ点 = 置いた点 (drag end で world 座標を round → DSL write back、 再 render で同座標に settle)
 * - drag 中 smooth 追従 (pointer move → ref update → RAF で 1 回だけ transform 書換、 setState 経由なし)
 * - release 後 flicker ゼロ (transform 直接書換で先に visual 確定 → DSL write back で React 再 render 時
 *   に同座標に settle するため画面上の差分なし)
 *
 * Round 2 fix (Codex adversarial review 6 MAJOR 対応、 Phase 1):
 * - F1 = drag write-back で対象外 lane も現在座標で pin し、 posW/posH も保持
 * - F2 = fit 計算で viewBox 原点 (vb.x/vb.y、 通常負) を補正
 * - F4 = pointer cleanup 経路 (multi-pointer 排他 / pointercancel / lostpointercapture / blur / unmount)
 * - F5 = parse 経路を親から受取り、 子は compile のみ (parse 重複を除去、 親 debounce と 1:1)
 *
 * Phase 2 PR 1 の設計:
 * - node 描画 layer = lane layer の上に置く (z-index で node が topmost)、 node pointer down で stopPropagation
 *   することで lane drag が誤発火しない semantic を保証
 * - node の DSL 上の subKey は resolveDslNameWithSubKey で LaidNode.id → { name, subKey } を逆引き
 *   (`{lane-slug}-header` / `{lane-slug}-footer` / `s{N}-{lane-slug}` 等の suffix / prefix pattern 対応)
 * - node drag write back = updateActorNodePosition (subKey ある場合) or updateActorPosition (subKey ない場合)
 *   + F1 相当の全 lane pin (対象外 lane が飛ばない invariant を lane / node 共通で維持)
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
  /** lane に紐づく nodes 数 (label 用) */
  nodeCount: number;
}

interface NodeVisual {
  /** LaidNode.id (data attribute value) */
  nodeId: string;
  /** LaidNode.lane (parent lane slug) */
  laneSlug: string;
  /** DSL 側 actor 名 (parent lane's DSL name) */
  actorName: string;
  /** DSL 側 subKey (nested nodes: { subKey: {...} } 経路の key、 単一 node preset なら null) */
  subKey: string | null;
  /** world 座標 = 左上 (cx - w/2, cy - h/2) */
  worldX: number;
  worldY: number;
  worldW: number;
  worldH: number;
  /** node kind (flow / api / storage / event / step / group / label / etc、 rendering 装飾用) */
  kind: NodeKind;
  /** display label */
  title: string;
  subtitle?: string;
  value?: string;
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
 * Phase 2 PR 1 = NodeVisual[] 生成 (LaidNode.id から DSL actor 名 + subKey を逆引き)。
 * subKey が null の場合 (単一 node preset = flow node / class 単一等) は updateActorPosition を使う経路、
 * subKey が非 null の場合 (sequence step / header / footer / spacer 等) は updateActorNodePosition 経路。
 */
function buildNodeVisuals(src: string, laid: LaidDiagram): NodeVisual[] {
  const actorNames = extractAllActorNames(src);
  const slugToName = new Map<string, string>();
  for (const name of actorNames) {
    slugToName.set(slugifyActor(name), name);
    slugToName.set(name, name);
  }
  const out: NodeVisual[] = [];
  for (const node of laid.nodes) {
    // node.id → { name: DSL actor 名, subKey?: string } 逆引き
    const resolved = resolveDslNameWithSubKey(node.id, slugToName);
    if (!resolved) continue; // slug not matched (parts merge sub-node の一部等)、 skip
    const subKey = resolved.subNodeKey ?? null;
    // DSL 側で node に明示 pos がある場合はそれを優先 (subKey 経路のみ、 flat actor pos は lane が持つ)
    const explicitPos =
      subKey !== null ? extractActorNodePosition(src, resolved.name, subKey) : null;
    const worldX = explicitPos?.posX ?? node.cx - node.w / 2;
    const worldY = explicitPos?.posY ?? node.cy - node.h / 2;
    const worldW = explicitPos?.posW ?? node.w;
    const worldH = explicitPos?.posH ?? node.h;
    out.push({
      nodeId: node.id,
      laneSlug: node.lane,
      actorName: resolved.name,
      subKey,
      worldX,
      worldY,
      worldW,
      worldH,
      kind: node.kind,
      title: node.title,
      subtitle: node.subtitle,
      value: node.value,
    });
  }
  return out;
}

/**
 * F1 相当 = drag 対象 lane を write back する時、 対象外 lane を全て現座標で pin する。
 * Phase 2 拡張 = node drag 時にも同じ invariant を維持 (対象外 lane が飛ばない、 DSL 側で全 lane 座標を pinning)。
 */
function pinAllLanes(srcBase: string, lanes: LaneVisual[]): string {
  let out = srcBase;
  for (const lane of lanes) {
    out = updateActorPosition(out, lane.name, lane.worldX, lane.worldY, lane.origPosW, lane.origPosH);
  }
  return out;
}

/**
 * lane drag end の write-back = 対象 lane を新座標で + 対象外 lane を現座標で pin + posW/posH 保持。
 */
function writeBackLaneDragEnd(
  srcBase: string,
  lanes: LaneVisual[],
  targetName: string,
  targetX: number,
  targetY: number,
): string {
  let out = srcBase;
  const target = lanes.find((l) => l.name === targetName);
  if (target) {
    out = updateActorPosition(out, targetName, targetX, targetY, target.origPosW, target.origPosH);
  } else {
    out = updateActorPosition(out, targetName, targetX, targetY);
  }
  for (const lane of lanes) {
    if (lane.name === targetName) continue;
    out = updateActorPosition(out, lane.name, lane.worldX, lane.worldY, lane.origPosW, lane.origPosH);
  }
  return out;
}

/**
 * Phase 2 PR 1 = node drag end の write-back = 対象 node の posX/posY 書換 (subKey ある / ない で分岐) +
 * 全 lane を現座標で pin (F1 相当 = node 移動でも lane が auto layout で飛ばない)。
 */
function writeBackNodeDragEnd(
  srcBase: string,
  lanes: LaneVisual[],
  target: NodeVisual,
  targetX: number,
  targetY: number,
): string {
  let out = srcBase;
  if (target.subKey !== null) {
    out = updateActorNodePosition(out, target.actorName, target.subKey, targetX, targetY, target.worldW, target.worldH);
  } else {
    // 単一 node preset (flow / class 単一等) は actor 全体 posX/posY 経路
    out = updateActorPosition(out, target.actorName, targetX, targetY, target.worldW, target.worldH);
  }
  // 全 lane pin (F1 相当)
  for (const lane of lanes) {
    // 対象 node の parent lane も pin (node drag は lane 座標を触らない)
    out = updateActorPosition(out, lane.name, lane.worldX, lane.worldY, lane.origPosW, lane.origPosH);
  }
  return out;
}

interface DragRef {
  /** drag 対象種別 (lane or node) */
  kind: "lane" | "node";
  /** lane drag の対象 lane 名 (kind === "lane") */
  laneName?: string;
  /** node drag の対象 node visual (kind === "node") */
  nodeVisual?: NodeVisual;
  targetEl: HTMLDivElement;
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
  /** 親 toolbar の Fit ボタンから呼ぶ imperative handle。 現在 viewBox に対して再 fit する。 */
  fit(): void;
  /** 親 toolbar の Reset ボタンから呼ぶ imperative handle。 fit + drag state clear。 */
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
    // Phase 2 PR 1 = nodes を HTML div として描画するための visual list
    const nodes = useMemo(() => (laid ? buildNodeVisuals(src, laid) : []), [src, laid]);

    // viewport 座標 (fit only、 Phase 2 では pan / zoom も未実装)
    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewportTransform, setViewportTransform] = useState({ tx: 0, ty: 0, scale: 1 });
    const viewportScaleRef = useRef(1);
    useEffect(() => {
      viewportScaleRef.current = viewportTransform.scale;
    }, [viewportTransform.scale]);

    // F2 対応 = viewBox 原点 (vb.x/vb.y、 通常負) を補正した fit 計算
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
      const tx = (rect.width - vb.w * scale) / 2 - vb.x * scale;
      const ty = (rect.height - vb.h * scale) / 2 - vb.y * scale;
      setViewportTransform({ tx, ty, scale });
    }, [laid]);

    // 初回 fit と diagram (id 変化) 変化時の再 fit
    const lastFitDiagramIdRef = useRef<string | null>(null);
    useEffect(() => {
      if (!laid || !viewportRef.current) return;
      if (lastFitDiagramIdRef.current === laid.id) return;
      lastFitDiagramIdRef.current = laid.id;
      const raf1 = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => doFit());
      });
      return () => window.cancelAnimationFrame(raf1);
    }, [laid, doFit]);

    // drag state (ref、 React 再 render 経由なし)
    const dragRef = useRef<DragRef | null>(null);

    // 各要素の DOM ref map (drag 対象の element を直接 transform 書換するため)
    const laneElRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const nodeElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // drag 中断時の共通 rollback
    const abortDrag = useCallback(() => {
      const st = dragRef.current;
      if (!st) return;
      if (st.rafHandle != null) {
        window.cancelAnimationFrame(st.rafHandle);
        st.rafHandle = null;
      }
      st.targetEl.style.transform = `translate3d(${st.startWorldX}px, ${st.startWorldY}px, 0)`;
      st.targetEl.classList.remove("html-canvas-lane-dragging", "html-canvas-node-dragging");
      try {
        st.targetEl.releasePointerCapture(st.pointerId);
      } catch {
        // pointer capture 未取得は無害
      }
      dragRef.current = null;
    }, []);

    const flushRaf = useCallback(() => {
      const st = dragRef.current;
      if (!st) return;
      st.rafScheduled = false;
      st.rafHandle = null;
      st.targetEl.style.transform = `translate3d(${st.currentWorldX}px, ${st.currentWorldY}px, 0)`;
    }, []);

    const startDrag = useCallback(
      (
        e: React.PointerEvent<HTMLDivElement>,
        kind: "lane" | "node",
        startWorldX: number,
        startWorldY: number,
        laneName?: string,
        nodeVisual?: NodeVisual,
      ) => {
        if (e.button !== 0) return;
        if (dragRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const targetEl = e.currentTarget;
        targetEl.setPointerCapture(e.pointerId);
        const scale = viewportScaleRef.current;
        dragRef.current = {
          kind,
          laneName,
          nodeVisual,
          targetEl,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startWorldX,
          startWorldY,
          currentWorldX: startWorldX,
          currentWorldY: startWorldY,
          finalWorldX: startWorldX,
          finalWorldY: startWorldY,
          scale: scale > 0 ? scale : 1,
          pointerId: e.pointerId,
          rafScheduled: false,
          rafHandle: null,
        };
        targetEl.classList.add(kind === "lane" ? "html-canvas-lane-dragging" : "html-canvas-node-dragging");
      },
      [],
    );

    const handleLanePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>, lane: LaneVisual) => {
        startDrag(e, "lane", lane.worldX, lane.worldY, lane.name, undefined);
      },
      [startDrag],
    );

    const handleNodePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>, node: NodeVisual) => {
        startDrag(e, "node", node.worldX, node.worldY, undefined, node);
      },
      [startDrag],
    );

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
        st.targetEl.style.transform = `translate3d(${st.finalWorldX}px, ${st.finalWorldY}px, 0)`;
        st.targetEl.classList.remove("html-canvas-lane-dragging", "html-canvas-node-dragging");
        try {
          st.targetEl.releasePointerCapture(st.pointerId);
        } catch {
          // pointer capture 未取得は無害
        }
        let nextSrc = src;
        if (st.kind === "lane" && st.laneName) {
          nextSrc = writeBackLaneDragEnd(src, lanes, st.laneName, st.finalWorldX, st.finalWorldY);
        } else if (st.kind === "node" && st.nodeVisual) {
          nextSrc = writeBackNodeDragEnd(src, lanes, st.nodeVisual, st.finalWorldX, st.finalWorldY);
        }
        dragRef.current = null;
        if (nextSrc !== src) {
          onSrcChange(nextSrc);
        }
      },
      [src, lanes, onSrcChange],
    );

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

    // test mirror = window.__htmlCanvasState (e2e 検証用、 lane + node world 座標 dump)
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
        nodes: nodes.map((n) => ({
          nodeId: n.nodeId,
          laneSlug: n.laneSlug,
          actorName: n.actorName,
          subKey: n.subKey,
          worldX: n.worldX,
          worldY: n.worldY,
          worldW: n.worldW,
          worldH: n.worldH,
          kind: n.kind,
          title: n.title,
        })),
      };
    }, [laid, lanes, nodes, viewportTransform]);

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
          {/* lane layer (z 底、 background として lane container を描画) */}
          {lanes.map((lane) => (
            <div
              key={`lane-${lane.name}`}
              ref={(el) => {
                if (el) laneElRefs.current.set(lane.name, el);
                else laneElRefs.current.delete(lane.name);
              }}
              className="html-canvas-lane"
              data-html-canvas-lane={lane.slug}
              data-html-canvas-lane-name={lane.name}
              onPointerDown={(e) => handleLanePointerDown(e, lane)}
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
                background: "rgba(184, 134, 42, 0.06)",
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
                zIndex: 1,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{lane.name}</div>
              {lane.nodeCount > 0 ? (
                <div style={{ fontSize: 11, color: "#8a5a2a", opacity: 0.7 }}>
                  nodes: {lane.nodeCount}
                </div>
              ) : null}
            </div>
          ))}
          {/* Phase 2 PR 1 = node layer (lane 上に重ねる、 各 node は独立に draggable) */}
          {nodes.map((node) => (
            <div
              key={`node-${node.nodeId}`}
              ref={(el) => {
                if (el) nodeElRefs.current.set(node.nodeId, el);
                else nodeElRefs.current.delete(node.nodeId);
              }}
              className="html-canvas-node"
              data-html-canvas-node={node.nodeId}
              data-html-canvas-node-actor={node.actorName}
              data-html-canvas-node-subkey={node.subKey ?? ""}
              data-html-canvas-node-kind={node.kind}
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onLostPointerCapture={handlePointerCancel}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: node.worldW,
                height: node.worldH,
                transform: `translate3d(${node.worldX}px, ${node.worldY}px, 0)`,
                willChange: "transform",
                boxSizing: "border-box",
                cursor: "grab",
                background: nodeBgForKind(node.kind),
                border: nodeBorderForKind(node.kind),
                borderRadius: nodeRadiusForKind(node.kind),
                padding: "6px 8px",
                color: "#1a1410",
                fontFamily: "'JetBrains Mono', 'Noto Sans JP', monospace",
                fontSize: "12px",
                fontWeight: 500,
                userSelect: "none",
                touchAction: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 2,
                WebkitTapHighlightColor: "transparent",
                zIndex: 2,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, wordBreak: "break-word" }}>
                {node.title}
              </div>
              {node.subtitle ? (
                <div style={{ fontSize: 10, color: "#5a4a2a", opacity: 0.8, lineHeight: 1.1 }}>
                  {node.subtitle}
                </div>
              ) : null}
              {node.value ? (
                <div style={{ fontSize: 10, color: "#6a4a1a", opacity: 0.9, lineHeight: 1.1 }}>
                  {node.value}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

/**
 * node kind 別 background / border / radius = catalog v4 palette 近似の暫定装飾 (visual fidelity は PR 4)。
 * 完全 忠実模写は Phase 2 PR 4 (visual fidelity 拡張) で拡張、 本 PR は draggable + 識別可能な最低装飾のみ。
 */
function nodeBgForKind(kind: NodeKind): string {
  switch (kind) {
    case "storage":
    case "database":
    case "cache":
      return "rgba(240, 184, 64, 0.15)"; // amber-gold
    case "event":
    case "webhook":
      return "rgba(147, 224, 161, 0.15)"; // mint
    case "service":
    case "api":
    case "backend":
    case "microservice":
      return "rgba(184, 134, 42, 0.12)"; // gold-glow
    case "actor":
    case "user-group":
    case "person":
      return "rgba(255, 255, 255, 0.7)";
    default:
      return "rgba(252, 248, 238, 0.9)";
  }
}

function nodeBorderForKind(kind: NodeKind): string {
  switch (kind) {
    case "storage":
    case "database":
    case "cache":
      return "1.5px solid #f0b840";
    case "event":
    case "webhook":
      return "1.5px solid #6ab080";
    case "decision":
      return "1.5px dashed #b8862a";
    default:
      return "1.5px solid #b8862a";
  }
}

function nodeRadiusForKind(kind: NodeKind): number {
  switch (kind) {
    case "storage":
    case "database":
    case "cache":
      return 4;
    case "event":
    case "webhook":
      return 12;
    default:
      return 6;
  }
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

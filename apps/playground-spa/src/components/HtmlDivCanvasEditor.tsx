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
 * Phase 1 (CAR-1947、 PR #906) = lane drag + 3 条件。
 * Phase 2 PR 1 (CAR-1952、 PR #907) = node (sub-node) 描画 + drag + DSL sync。
 *
 * Round 1 Codex adversarial review 7 findings 対応 (Phase 2 PR 1):
 * - F1 (correctness) = CDL node の posX/posY 契約は中心座標 (cx/cy)。 HTML div 左上 = cx - w/2, cy - h/2、
 *   write back 時は finalLeft + w/2, finalTop + h/2 を updateActorNodePosition に渡す
 * - F2 (correctness/consistency) = 単一 node 経路 (subKey === null) では parent lane を pin ループから除外、
 *   同 actor の座標を旧値で上書きしない
 * - F3 (consistency) = `alias__subId` (parts merge sub-node) は node layer から除外 = parts は一体操作契約
 *   (SVG 経路と semantic 統一)、 個別 sub-node drag は禁止
 * - F4 (consistency) = drag で posW/posH を新規書換禁止、 DSL の元 origPosW/origPosH のみ保持継続
 * - F5 (lint) = 未使用 `pinAllLanes` 削除、 pin ループは write-back 関数内 inline に統合
 * - F6 (test-coverage) = Playwright に bare flow node / parts (skip) / pointercancel / multi-pointer /
 *   DOM node 数 一致 の regression test 追加 (別 spec file 拡張)
 * - F7 (perf) = actor slug index を一度だけ構築、 extractActorNodePosition の呼出を pre-computed map に、
 *   willChange は drag 中対象要素にのみ適用、 未使用 DOM ref map は削除
 */

interface HtmlDivCanvasEditorProps {
  src: string;
  onSrcChange: (next: string) => void;
  laid?: LaidDiagram | null;
  testId?: string;
}

interface LaneVisual {
  name: string;
  slug: string;
  worldX: number;
  worldY: number;
  worldW: number;
  worldH: number;
  origPosW?: number;
  origPosH?: number;
  nodeCount: number;
}

interface NodeVisual {
  /** LaidNode.id (data attribute) */
  nodeId: string;
  /** LaidNode.lane (parent lane slug) */
  laneSlug: string;
  /** DSL 側 actor 名 */
  actorName: string;
  /** DSL 側 subKey (null なら単一 node preset、 actor 全体経路) */
  subKey: string | null;
  /**
   * F1 = world 中心座標 (cx, cy)。 DSL posX/posY の契約と一致 (CDL node の中心座標)。
   * HTML div の translate3d は render 時に cx - w/2, cy - h/2 で左上に補正する。
   */
  worldCX: number;
  worldCY: number;
  worldW: number;
  worldH: number;
  /** F4 = DSL に明示された posW/posH のみ保持、 自動計算値は書換禁止 */
  origPosW?: number;
  origPosH?: number;
  kind: NodeKind;
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

export const canvasHtmlFeatureFlag = {
  isEnabled: isCanvasHtmlEnabled,
};

/**
 * F7 = actor slug index / node override index を 1 パスで構築、 lane / node の visual 生成でシェア。
 */
interface DslIndex {
  slugToName: Map<string, string>;
  laneOverrides: Map<string, { posX?: number; posY?: number; posW?: number; posH?: number }>;
  nodeOverrides: Map<string, { posX?: number; posY?: number; posW?: number; posH?: number }>;
}

function buildDslIndex(src: string, laid: LaidDiagram): DslIndex {
  const slugToName = new Map<string, string>();
  const actorNames = extractAllActorNames(src);
  for (const name of actorNames) {
    slugToName.set(slugifyActor(name), name);
    slugToName.set(name, name);
  }
  // lane override index (actor 名 → posX/posY/posW/posH)
  const laneOverrides = new Map<string, { posX?: number; posY?: number; posW?: number; posH?: number }>();
  for (const name of actorNames) {
    const pos = extractActorPosition(src, name);
    if (pos) laneOverrides.set(name, pos);
  }
  // node override index (actor 名 + subKey → posX/posY/posW/posH)
  const nodeOverrides = new Map<string, { posX?: number; posY?: number; posW?: number; posH?: number }>();
  for (const node of laid.nodes) {
    const resolved = resolveDslNameWithSubKey(node.id, slugToName);
    if (!resolved || !resolved.subNodeKey) continue;
    const pos = extractActorNodePosition(src, resolved.name, resolved.subNodeKey);
    if (pos) nodeOverrides.set(`${resolved.name}::${resolved.subNodeKey}`, pos);
  }
  return { slugToName, laneOverrides, nodeOverrides };
}

function buildLaneVisuals(laid: LaidDiagram, index: DslIndex): LaneVisual[] {
  const nodeCountByLane = new Map<string, number>();
  for (const n of laid.nodes) {
    nodeCountByLane.set(n.lane, (nodeCountByLane.get(n.lane) ?? 0) + 1);
  }
  const out: LaneVisual[] = [];
  for (const lane of laid.lanes) {
    const dslName = index.slugToName.get(lane.id) ?? lane.id;
    const dslPos = index.laneOverrides.get(dslName);
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
 * NodeVisual[] 生成。 F3 = parts merge sub-node (`alias__subId`) は node layer から除外 (parts は一体操作)。
 * F1 = worldCX/worldCY は中心座標 (LaidNode.cx/cy)、 render 時に cx - w/2, cy - h/2 で左上に補正、
 * write back 時は逆変換 (left + w/2, top + h/2) で DSL の posX/posY (中心座標契約) に戻す。
 */
function buildNodeVisuals(laid: LaidDiagram, index: DslIndex): NodeVisual[] {
  const out: NodeVisual[] = [];
  for (const node of laid.nodes) {
    // F3 = parts merge sub-node は除外
    if (node.id.includes("__")) continue;
    const resolved = resolveDslNameWithSubKey(node.id, index.slugToName);
    if (!resolved) continue;
    const subKey = resolved.subNodeKey ?? null;
    // Round 2 F1/F4 fix = 単一 node (subKey === null) は actor 直下の posX/posY (laneOverrides) を SSOT にする、
    // sub-node は nested nodes.{subKey} の posX/posY (nodeOverrides) 経路。 単一 node で explicitPos が
    // undefined になり origPosW/H の write-back が消える regression を防止。
    const explicitPos =
      subKey !== null
        ? index.nodeOverrides.get(`${resolved.name}::${subKey}`)
        : index.laneOverrides.get(resolved.name);
    // F1 = 中心座標を SSOT に保持 (worldCX/worldCY = DSL posX/posY と一致する契約)
    const worldCX = explicitPos?.posX ?? node.cx;
    const worldCY = explicitPos?.posY ?? node.cy;
    const worldW = explicitPos?.posW ?? node.w;
    const worldH = explicitPos?.posH ?? node.h;
    out.push({
      nodeId: node.id,
      laneSlug: node.lane,
      actorName: resolved.name,
      subKey,
      worldCX,
      worldCY,
      worldW,
      worldH,
      origPosW: explicitPos?.posW,
      origPosH: explicitPos?.posH,
      kind: node.kind,
      title: node.title,
      subtitle: node.subtitle,
      value: node.value,
    });
  }
  return out;
}

/**
 * lane drag end の write-back = 対象 lane を新座標で + 対象外 lane を現座標で pin + posW/posH 元値保持。
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
 * F1 + F2 + F4 対応 = node drag end の write-back。
 * - F1 = 中心座標契約遵守 (targetCX/targetCY は中心座標を渡す、 逆変換は呼出側で完了済)
 * - F2 = subKey === null の単一 node 経路では parent lane (actorName) を pin ループから除外
 * - F4 = origPosW/origPosH のみ渡す (DSL 明示済 サイズは保持、 未指定なら書換禁止)
 */
function writeBackNodeDragEnd(
  srcBase: string,
  lanes: LaneVisual[],
  target: NodeVisual,
  targetCX: number,
  targetCY: number,
): string {
  let out = srcBase;
  if (target.subKey !== null) {
    // F4 = origPosW/origPosH のみ渡す (自動計算 worldW/worldH は書換しない)
    out = updateActorNodePosition(
      out,
      target.actorName,
      target.subKey,
      targetCX,
      targetCY,
      target.origPosW,
      target.origPosH,
    );
  } else {
    // 単一 node preset = actor 全体 posX/posY 経路
    out = updateActorPosition(out, target.actorName, targetCX, targetCY, target.origPosW, target.origPosH);
  }
  // 全 lane pin (F2 = 単一 node 経路では parent lane を除外して重複上書きを防止)
  for (const lane of lanes) {
    if (target.subKey === null && lane.name === target.actorName) continue;
    out = updateActorPosition(out, lane.name, lane.worldX, lane.worldY, lane.origPosW, lane.origPosH);
  }
  return out;
}

interface DragRef {
  kind: "lane" | "node";
  laneName?: string;
  nodeVisual?: NodeVisual;
  targetEl: HTMLDivElement;
  startClientX: number;
  startClientY: number;
  /**
   * F1 = drag 開始時の world 座標。 lane は左上 (worldX/worldY)、 node は中心 (worldCX/worldCY) を保持する契約。
   * render/write-back は kind ごとに変換 (node は render で cx - w/2, write-back で cx を渡す)。
   */
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
  /** node の場合の半幅 / 半高 (translate3d は左上を渡す、 中心座標から補正するため) */
  halfW: number;
  halfH: number;
}

export interface HtmlDivCanvasEditorHandle {
  fit(): void;
  reset(): void;
}

export const HtmlDivCanvasEditor = forwardRef<HtmlDivCanvasEditorHandle, HtmlDivCanvasEditorProps>(
  function HtmlDivCanvasEditor(
    { src, onSrcChange, laid: laidProp, testId }: HtmlDivCanvasEditorProps,
    ref,
  ): React.ReactElement {
    const laid: LaidDiagram | null = laidProp ?? null;

    // F7 = 1 パスで actor slug + lane override + node override index を構築
    const dslIndex = useMemo(() => (laid ? buildDslIndex(src, laid) : null), [src, laid]);
    const lanes = useMemo(() => (laid && dslIndex ? buildLaneVisuals(laid, dslIndex) : []), [laid, dslIndex]);
    const nodes = useMemo(() => (laid && dslIndex ? buildNodeVisuals(laid, dslIndex) : []), [laid, dslIndex]);

    const viewportRef = useRef<HTMLDivElement>(null);
    const [viewportTransform, setViewportTransform] = useState({ tx: 0, ty: 0, scale: 1 });
    const viewportScaleRef = useRef(1);
    useEffect(() => {
      viewportScaleRef.current = viewportTransform.scale;
    }, [viewportTransform.scale]);

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

    const dragRef = useRef<DragRef | null>(null);

    const abortDrag = useCallback(() => {
      const st = dragRef.current;
      if (!st) return;
      if (st.rafHandle != null) {
        window.cancelAnimationFrame(st.rafHandle);
        st.rafHandle = null;
      }
      // F1 = kind ごとに render 変換 (node は世界中心 - 半幅/半高で左上を渡す)
      const rollbackLeft = st.kind === "node" ? st.startWorldX - st.halfW : st.startWorldX;
      const rollbackTop = st.kind === "node" ? st.startWorldY - st.halfH : st.startWorldY;
      st.targetEl.style.transform = `translate3d(${rollbackLeft}px, ${rollbackTop}px, 0)`;
      st.targetEl.style.willChange = "";
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
      // F1 = node は中心 → 左上変換で render (lane は左上のまま)
      const renderLeft = st.kind === "node" ? st.currentWorldX - st.halfW : st.currentWorldX;
      const renderTop = st.kind === "node" ? st.currentWorldY - st.halfH : st.currentWorldY;
      st.targetEl.style.transform = `translate3d(${renderLeft}px, ${renderTop}px, 0)`;
    }, []);

    const startDrag = useCallback(
      (
        e: React.PointerEvent<HTMLDivElement>,
        kind: "lane" | "node",
        startWorldX: number,
        startWorldY: number,
        halfW: number,
        halfH: number,
        laneName?: string,
        nodeVisual?: NodeVisual,
      ) => {
        if (e.button !== 0) return;
        if (dragRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const targetEl = e.currentTarget;
        targetEl.setPointerCapture(e.pointerId);
        // F7 = willChange は drag 開始時のみ有効化
        targetEl.style.willChange = "transform";
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
          halfW,
          halfH,
        };
        targetEl.classList.add(kind === "lane" ? "html-canvas-lane-dragging" : "html-canvas-node-dragging");
      },
      [],
    );

    const handleLanePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>, lane: LaneVisual) => {
        // lane は左上経路、 halfW/halfH = 0
        startDrag(e, "lane", lane.worldX, lane.worldY, 0, 0, lane.name, undefined);
      },
      [startDrag],
    );

    const handleNodePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>, node: NodeVisual) => {
        // F1 = node は中心座標経路、 halfW/halfH = w/2, h/2 で render 変換
        startDrag(e, "node", node.worldCX, node.worldCY, node.worldW / 2, node.worldH / 2, undefined, node);
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
        // render は kind ごとに変換
        const renderLeft = st.kind === "node" ? st.finalWorldX - st.halfW : st.finalWorldX;
        const renderTop = st.kind === "node" ? st.finalWorldY - st.halfH : st.finalWorldY;
        st.targetEl.style.transform = `translate3d(${renderLeft}px, ${renderTop}px, 0)`;
        st.targetEl.style.willChange = "";
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
          // F1 = node の DSL 契約は中心座標、 finalWorldX/Y は既に中心座標
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
          // F1 = mirror にも中心座標を露出 (DSL 契約と一致)
          worldCX: n.worldCX,
          worldCY: n.worldCY,
          worldW: n.worldW,
          worldH: n.worldH,
          origPosW: n.origPosW ?? null,
          origPosH: n.origPosH ?? null,
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
          {lanes.map((lane) => (
            <div
              key={`lane-${lane.name}`}
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
                // F7 = static state では willChange なし、 drag 中のみ startDrag で有効化
                transform: `translate3d(${lane.worldX}px, ${lane.worldY}px, 0)`,
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
          {nodes.map((node) => (
            <div
              key={`node-${node.nodeId}`}
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
                // F1 = 中心座標 → 左上変換 (translate3d は左上を渡す)、 F7 = static では willChange なし
                transform: `translate3d(${node.worldCX - node.worldW / 2}px, ${node.worldCY - node.worldH / 2}px, 0)`,
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

function nodeBgForKind(kind: NodeKind): string {
  switch (kind) {
    case "storage":
    case "database":
    case "cache":
      return "rgba(240, 184, 64, 0.15)";
    case "event":
    case "webhook":
      return "rgba(147, 224, 161, 0.15)";
    case "service":
    case "api":
    case "backend":
    case "microservice":
      return "rgba(184, 134, 42, 0.12)";
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

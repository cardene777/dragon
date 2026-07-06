"use client";

import { useMemo } from "react";
import rough from "roughjs";
import { THEME_CONFIGS, type ThemeName } from "@/lib/theme";
import type { PresetEdge, PresetNode } from "@/lib/presets";

/**
 * 2 node 間の edge を orthogonal routing で描画。
 * from node の中心 → to node の中心を hop 中央 で L 字曲げする。
 *
 * handdrawn theme のときは rough.js で wobble stroke、 その他は straight。
 * text label は edge 中央、 pill 背景付き (theme accent 色)。
 */

function nodeCenter(n: PresetNode | undefined): { x: number; y: number } {
  if (!n) return { x: 0, y: 0 };
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function nodeEdgePoint(from: PresetNode, to: PresetNode): { x: number; y: number } {
  const fc = nodeCenter(from);
  const tc = nodeCenter(to);
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    // horizontal
    return { x: dx > 0 ? from.x + from.w : from.x, y: fc.y };
  }
  return { x: fc.x, y: dy > 0 ? from.y + from.h : from.y };
}

function nodeEdgePointIncoming(to: PresetNode, from: PresetNode): { x: number; y: number } {
  const fc = nodeCenter(from);
  const tc = nodeCenter(to);
  const dx = tc.x - fc.x;
  const dy = tc.y - fc.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return { x: dx > 0 ? to.x : to.x + to.w, y: tc.y };
  }
  return { x: tc.x, y: dy > 0 ? to.y : to.y + to.h };
}

function routeOrthogonal(from: PresetNode, to: PresetNode): {
  d: string;
  labelX: number;
  labelY: number;
  segments: number;
  totalLength: number;
} {
  const start = nodeEdgePoint(from, to);
  const end = nodeEdgePointIncoming(to, from);
  const mx = (start.x + end.x) / 2;
  const totalLength = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
  // label 位置 = 最長 segment の中央
  const segH1 = Math.abs(mx - start.x);
  const segV = Math.abs(end.y - start.y);
  const segH2 = Math.abs(end.x - mx);
  let labelX: number, labelY: number;
  if (segH1 >= segV && segH1 >= segH2) {
    labelX = (start.x + mx) / 2;
    labelY = start.y - 6;
  } else if (segV >= segH1 && segV >= segH2) {
    labelX = mx + 6;
    labelY = (start.y + end.y) / 2;
  } else {
    labelX = (mx + end.x) / 2;
    labelY = end.y - 6;
  }
  const d = `M ${start.x} ${start.y} L ${mx} ${start.y} L ${mx} ${end.y} L ${end.x} ${end.y}`;
  return { d, labelX, labelY, segments: 3, totalLength };
}

export function DiagramEdge({
  edge,
  fromNode,
  toNode,
  theme,
}: {
  edge: PresetEdge;
  fromNode: PresetNode | undefined;
  toNode: PresetNode | undefined;
  theme: ThemeName;
}): React.ReactElement | null {
  if (!fromNode || !toNode) return null;

  const cfg = THEME_CONFIGS[theme];
  const routed = routeOrthogonal(fromNode, toNode);
  const dashed = edge.style === "dashed";

  const strokeD = useMemo(() => {
    if (cfg.shapeAdapter !== "rough") return null;
    const gen = rough.generator();
    let hash = 0;
    for (let i = 0; i < edge.id.length; i++) {
      hash = (hash << 5) - hash + edge.id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) || 1;
    // rough path via 4-segment polyline
    const parts = routed.d.split(" ");
    const points: Array<[number, number]> = [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "M" || parts[i] === "L") {
        points.push([parseFloat(parts[i + 1]!), parseFloat(parts[i + 2]!)]);
        i += 2;
      }
    }
    const drawable = gen.linearPath(points, {
      roughness: (cfg.roughness ?? 1.6) * 0.7,
      bowing: 0.5,
      seed,
      stroke: "currentColor",
      strokeWidth: cfg.strokeWidth.edge,
    });
    const paths = drawable.sets.map((set) => {
      const ops = set.ops.map((op) => {
        if (op.op === "move") return `M ${op.data[0]} ${op.data[1]}`;
        if (op.op === "lineTo") return `L ${op.data[0]} ${op.data[1]}`;
        if (op.op === "bcurveTo") return `C ${op.data[0]} ${op.data[1]}, ${op.data[2]} ${op.data[3]}, ${op.data[4]} ${op.data[5]}`;
        return "";
      });
      return ops.join(" ");
    });
    return paths.join(" ");
  }, [cfg, routed.d, edge.id]);

  return (
    <g data-edge={edge.id}>
      <path
        d={strokeD ?? routed.d}
        fill="none"
        stroke="var(--color-ink-dim)"
        strokeWidth={cfg.strokeWidth.edge}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? "6 6" : undefined}
      />
      {/* arrowhead */}
      <ArrowHead
        x={routed.d.split(" ").slice(-2)[0] ? parseFloat(routed.d.split(" ").slice(-2)[0]!) : 0}
        y={routed.d.split(" ").slice(-1)[0] ? parseFloat(routed.d.split(" ").slice(-1)[0]!) : 0}
        prevX={parseFloat(routed.d.split(" ").slice(-5)[0] ?? "0")}
        prevY={parseFloat(routed.d.split(" ").slice(-4)[0] ?? "0")}
        color="var(--color-ink-dim)"
      />
      {edge.label && routed.totalLength > 90 && (
        <g transform={`translate(${routed.labelX} ${routed.labelY})`}>
          <rect
            x={-edge.label.length * cfg.fontSize.edgeLabel * 0.35 - 10}
            y={-cfg.fontSize.edgeLabel + 1}
            width={edge.label.length * cfg.fontSize.edgeLabel * 0.7 + 20}
            height={cfg.fontSize.edgeLabel + 8}
            rx={(cfg.fontSize.edgeLabel + 8) / 2}
            fill="var(--color-surface)"
            stroke="var(--color-accent)"
            strokeWidth={1}
          />
          <text
            fontSize={cfg.fontSize.edgeLabel}
            fontWeight={600}
            fill="var(--color-accent)"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono)"
          >
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
}

function ArrowHead({
  x,
  y,
  prevX,
  prevY,
  color,
}: {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
}): React.ReactElement {
  const dx = x - prevX;
  const dy = y - prevY;
  const angle = Math.atan2(dy, dx);
  const size = 10;
  const a1x = x - size * Math.cos(angle - Math.PI / 6);
  const a1y = y - size * Math.sin(angle - Math.PI / 6);
  const a2x = x - size * Math.cos(angle + Math.PI / 6);
  const a2y = y - size * Math.sin(angle + Math.PI / 6);
  return (
    <polygon points={`${x},${y} ${a1x},${a1y} ${a2x},${a2y}`} fill={color} />
  );
}

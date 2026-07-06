"use client";

import { DiagramNode } from "./DiagramNode";
import { DiagramEdge } from "./DiagramEdge";
import type { PresetDoc } from "@/lib/presets";
import type { ThemeName } from "@/lib/theme";

/**
 * PresetDoc + theme を SVG diagram に render する main component。
 *
 * SVG は preserveAspectRatio=xMidYMid meet で container fit、
 * viewBoxScale は render 側で container width / viewBox width から推定して
 * shape-generator の adaptive stroke に渡す。
 */
export function DiagramView({
  preset,
  theme,
  className,
  interactive = false,
}: {
  preset: PresetDoc;
  theme: ThemeName;
  className?: string;
  interactive?: boolean;
}): React.ReactElement {
  // catalog thumbnail の縮小 scale は default 0.35 と推定 (viewBox 1200 → container ~420px)。
  // detail view / modal は 1.0 = 原寸。
  const viewBoxScale = interactive ? 1.0 : 0.4;

  const nodeMap = new Map(preset.nodes.map((n) => [n.id, n]));

  return (
    <svg
      className={className}
      viewBox={`${preset.viewBox.x} ${preset.viewBox.y} ${preset.viewBox.w} ${preset.viewBox.h}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "var(--color-surface)", borderRadius: 16 }}
    >
      {/* Blueprint theme のみ grid overlay */}
      {theme === "blueprint" && (
        <>
          <defs>
            <pattern id="bp-grid" width={20} height={20} patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="var(--diagram-grid-color, rgba(120, 180, 220, 0.35))"
                strokeWidth={0.5}
              />
            </pattern>
          </defs>
          <rect
            x={preset.viewBox.x}
            y={preset.viewBox.y}
            width={preset.viewBox.w}
            height={preset.viewBox.h}
            fill="url(#bp-grid)"
          />
        </>
      )}
      {/* Handdrawn theme のみ kraft noise overlay */}
      {theme === "handdrawn" && (
        <>
          <defs>
            <filter id="hd-noise" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="1" />
              <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.04 0" />
            </filter>
          </defs>
          <rect
            x={preset.viewBox.x}
            y={preset.viewBox.y}
            width={preset.viewBox.w}
            height={preset.viewBox.h}
            filter="url(#hd-noise)"
            opacity={0.6}
          />
        </>
      )}
      {/* lanes */}
      {preset.lanes?.map((lane) => (
        <g key={lane.id}>
          <rect
            x={lane.x}
            y={lane.y}
            width={lane.w}
            height={lane.h}
            fill="var(--color-surface-2)"
            stroke="var(--color-ink-mute)"
            strokeWidth={1}
            strokeDasharray="5 3"
            rx={12}
            opacity={0.5}
          />
          <text
            x={lane.x + 16}
            y={lane.y + 24}
            fontSize={11}
            fontWeight={700}
            letterSpacing={1.5}
            fill="var(--color-ink-dim)"
            fontFamily="var(--font-mono)"
          >
            {lane.label.toUpperCase()}
          </text>
        </g>
      ))}
      {/* edges (先に描画して node の下に) */}
      {preset.edges.map((edge) => (
        <DiagramEdge
          key={edge.id}
          edge={edge}
          fromNode={nodeMap.get(edge.from)}
          toNode={nodeMap.get(edge.to)}
          theme={theme}
        />
      ))}
      {/* nodes */}
      {preset.nodes.map((node) => (
        <DiagramNode
          key={node.id}
          node={node}
          theme={theme}
          active={false}
          viewBoxScale={viewBoxScale}
        />
      ))}
    </svg>
  );
}

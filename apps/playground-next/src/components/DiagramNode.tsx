"use client";

import { useMemo } from "react";
import { generateShape, type ShapeKind } from "@/lib/shape-generator";
import { THEME_CONFIGS, type ThemeName } from "@/lib/theme";
import type { PresetNode } from "@/lib/presets";

/**
 * Circuit theme = rect の 4 隅に gold solder pad (r=4.5) を配置。
 */
function SolderPads({ w, h }: { w: number; h: number }): React.ReactElement {
  return (
    <>
      {[
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={4.5}
          fill="var(--color-accent)"
          stroke="none"
          opacity={1}
        />
      ))}
    </>
  );
}

/**
 * 1 node を SVG group で描画。 shape-generator API 経由で
 * theme に応じた path (rough.js or straight) を生成、 text を上乗せする。
 *
 * text は shape とは別 layer で描画するので、 rough.js filter の影響を受けない。
 * text 位置は shape 内 padding で決定 (title 上 / subtitle 下)。
 */
export function DiagramNode({
  node,
  theme,
  active,
  viewBoxScale = 1.0,
}: {
  node: PresetNode;
  theme: ThemeName;
  active: boolean;
  viewBoxScale?: number;
}): React.ReactElement {
  const shape = (node.shape ?? "rect") as ShapeKind;
  const cfg = THEME_CONFIGS[theme];
  const shapeResult = useMemo(
    () =>
      generateShape({
        kind: shape,
        w: node.w,
        h: node.h,
        theme,
        nodeId: node.id,
        active,
        viewBoxScale,
      }),
    [shape, node.w, node.h, theme, node.id, active, viewBoxScale],
  );

  const centered = shape === "diamond" || shape === "ellipse";
  const textAnchor: "start" | "middle" = centered ? "middle" : "start";
  const textX = centered ? node.w / 2 : 24;
  const eyebrowY = centered ? node.h / 2 - 32 : 26;
  const titleY = centered ? node.h / 2 + 8 : 56;
  const subtitleY = centered ? node.h / 2 + 32 : 82;
  const subtitleLines = node.subtitle?.split("\n") ?? [];
  const filterAttr = cfg.nodeFilter && shape === "rect" ? cfg.nodeFilter : undefined;

  // Pinboard tilt = seed 由来 -3° to +3° rotation で sticky note の pinned 感
  const tilt = useMemo(() => {
    if (theme !== "pinboard") return 0;
    let hash = 0;
    for (let i = 0; i < node.id.length; i++) {
      hash = (hash << 5) - hash + node.id.charCodeAt(i);
      hash |= 0;
    }
    return ((Math.abs(hash) % 60) - 30) / 10; // -3.0 ... +3.0
  }, [theme, node.id]);
  const transform = tilt
    ? `translate(${node.x} ${node.y}) rotate(${tilt} ${node.w / 2} ${node.h / 2})`
    : `translate(${node.x} ${node.y})`;

  return (
    <g
      transform={transform}
      data-node={node.id}
      data-kind={node.kind}
      role="group"
      aria-label={`${node.kind} node — ${node.title}${node.subtitle ? " (" + node.subtitle.replace(/\n/g, ", ") + ")" : ""}`}
    >
      <g filter={filterAttr}>
        {shapeResult.paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.fill}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            strokeLinecap={p.strokeLinecap as "round" | "square" | "butt" | undefined}
            strokeLinejoin={p.strokeLinejoin as "round" | "miter" | "bevel" | undefined}
          />
        ))}
        {/* Circuit theme = 4 隅 solder pad (rect のみ) */}
        {theme === "circuit" && shape === "rect" && (
          <SolderPads w={node.w} h={node.h} />
        )}
      </g>
      {node.eyebrow && (
        <text
          x={textX}
          y={eyebrowY}
          fontSize={cfg.fontSize.eyebrow}
          fontWeight={600}
          letterSpacing={1.4}
          fill="var(--color-accent)"
          textAnchor={textAnchor}
          fontFamily="var(--font-mono, monospace)"
        >
          {node.eyebrow}
        </text>
      )}
      <text
        x={textX}
        y={titleY}
        fontSize={cfg.fontSize.title}
        fontWeight={700}
        fill="var(--color-ink)"
        textAnchor={textAnchor}
        fontFamily="var(--font-sans)"
      >
        {node.title}
      </text>
      {subtitleLines.map((line, i) => (
        <text
          key={i}
          x={textX}
          y={subtitleY + i * (cfg.fontSize.subtitle + 4)}
          fontSize={cfg.fontSize.subtitle}
          fill="var(--color-ink-dim)"
          textAnchor={textAnchor}
          fontFamily="var(--font-mono, monospace)"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

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
  const subtitleLines = node.subtitle?.split("\n") ?? [];
  // dynamic text Y layout — node height に応じて text stack を center 詰めする
  const hasEyebrow = Boolean(node.eyebrow);
  const hasSubtitle = subtitleLines.length > 0;
  const eyebrowGap = 8;
  const titleGap = 10;
  const subtitleGap = 4;
  const eyebrowH = hasEyebrow ? cfg.fontSize.eyebrow + eyebrowGap : 0;
  const titleH = cfg.fontSize.title + (hasSubtitle ? titleGap : 0);
  const subtitleH = hasSubtitle
    ? subtitleLines.length * cfg.fontSize.subtitle + (subtitleLines.length - 1) * subtitleGap
    : 0;
  const totalH = eyebrowH + titleH + subtitleH;
  const topY = centered ? (node.h - totalH) / 2 : Math.max(20, (node.h - totalH) / 2);
  const eyebrowY = topY + cfg.fontSize.eyebrow;
  const titleY = eyebrowY + eyebrowGap + cfg.fontSize.title * 0.4;
  const subtitleY = titleY + titleGap + cfg.fontSize.subtitle * 0.8;
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
      {hasEyebrow && (
        <text
          x={centered ? node.w / 2 : textX}
          y={eyebrowY}
          fontSize={cfg.fontSize.eyebrow}
          fontWeight={600}
          letterSpacing={1.4}
          fill="var(--color-accent)"
          textAnchor={centered ? "middle" : textAnchor}
          fontFamily="var(--font-mono, monospace)"
        >
          {node.eyebrow}
        </text>
      )}
      <text
        x={centered ? node.w / 2 : textX}
        y={titleY}
        fontSize={cfg.fontSize.title}
        fontWeight={700}
        fill="var(--color-ink)"
        textAnchor={centered ? "middle" : textAnchor}
        fontFamily="var(--font-sans)"
        dominantBaseline="middle"
      >
        {node.title}
      </text>
      {subtitleLines.map((line, i) => (
        <text
          key={i}
          x={centered ? node.w / 2 : textX}
          y={subtitleY + i * (cfg.fontSize.subtitle + subtitleGap)}
          fontSize={cfg.fontSize.subtitle}
          fill="var(--color-ink-dim)"
          textAnchor={centered ? "middle" : textAnchor}
          fontFamily="var(--font-mono, monospace)"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

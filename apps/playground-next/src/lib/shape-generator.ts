/**
 * dragon shape-generator SSOT
 *
 * theme に応じた shape path 生成。
 *   - handdrawn ... rough.js で hand-drawn stroke + hachure fill
 *   - その他    ... straight path + rx / ry / fill / stroke
 *
 * 全 theme で thumbnail scale 対応 (viewBoxScale 引数で stroke width 補正)。
 * seed 固定で pan/zoom/theme swap 時も wobble が変わらない (Excalidraw pattern)。
 */

import rough from "roughjs";
import type { RoughGenerator } from "roughjs/bin/generator";
import { THEME_CONFIGS, type ThemeName, nodeSeed } from "./theme";

export type ShapeKind = "rect" | "cylinder" | "cloud" | "diamond" | "hexagon" | "ellipse";

export interface ShapeGenOptions {
  kind: ShapeKind;
  w: number;
  h: number;
  theme: ThemeName;
  nodeId: string;
  active: boolean;
  viewBoxScale?: number;
}

export interface ShapeResult {
  /** SVG element children (rough.js は複数 path 生成、 その他は 1 shape) */
  paths: Array<{
    d: string;
    fill?: string;
    fillStyle?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: string;
    strokeLinejoin?: string;
  }>;
  /** rx / ry など shape 全体属性 (fallback) */
  attrs: {
    rx?: number;
    ry?: number;
  };
}

let cachedGenerator: RoughGenerator | null = null;
function getGenerator(): RoughGenerator {
  if (!cachedGenerator) {
    cachedGenerator = rough.generator();
  }
  return cachedGenerator;
}

/**
 * viewBoxScale = SVG が画面上どの縮小率で表示されるかの推定値。
 * catalog thumbnail = 0.3-0.5、 detail viewer = 1.0-1.5。
 * stroke-width をこの scale で補正することで、 縮小時も visible な太さを保つ。
 */
function scaledStroke(base: number, viewBoxScale: number): number {
  // clamp: 極端に薄くならず、 極端に太くならず
  return Math.max(0.5, Math.min(base / Math.max(0.4, viewBoxScale), base * 2.5));
}

/**
 * rough.js の RoughSet を SVG path attribute に変換。
 * roughjs は複数 subpath (fill + stroke) を分けて返すのでそれを配列化する。
 */
function roughSetsToPathData(sets: ReturnType<RoughGenerator["rectangle"]>["sets"]): string[] {
  return sets.map((set) => {
    const ops = set.ops.map((op) => {
      if (op.op === "move") return `M ${op.data[0]} ${op.data[1]}`;
      if (op.op === "lineTo") return `L ${op.data[0]} ${op.data[1]}`;
      if (op.op === "bcurveTo") {
        return `C ${op.data[0]} ${op.data[1]}, ${op.data[2]} ${op.data[3]}, ${op.data[4]} ${op.data[5]}`;
      }
      return "";
    });
    return ops.join(" ");
  });
}

/**
 * rough.js shape → ShapeResult 変換。 fill / stroke path を個別 element として返す。
 */
function roughShapeToPaths(
  drawable: ReturnType<RoughGenerator["rectangle"]>,
  strokeWidth: number,
): ShapeResult["paths"] {
  const paths: ShapeResult["paths"] = [];
  const pathDatas = roughSetsToPathData(drawable.sets);
  drawable.sets.forEach((set, i) => {
    const d = pathDatas[i];
    if (!d) return;
    if (set.type === "fillPath") {
      paths.push({ d, fill: drawable.options.fill ?? "none", stroke: "none" });
    } else if (set.type === "path") {
      paths.push({
        d,
        fill: "none",
        stroke: drawable.options.stroke ?? "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      });
    } else if (set.type === "fillSketch") {
      // hachure fill = 描画 stroke で fill を模す
      paths.push({
        d,
        fill: "none",
        stroke: drawable.options.fill ?? drawable.options.stroke ?? "currentColor",
        strokeWidth: Math.max(0.7, strokeWidth * 0.6),
        strokeLinecap: "round",
      });
    }
  });
  return paths;
}

export function generateShape(opts: ShapeGenOptions): ShapeResult {
  const cfg = THEME_CONFIGS[opts.theme];
  const scale = opts.viewBoxScale ?? 1.0;
  const strokeWidth = scaledStroke(
    opts.active ? cfg.strokeWidth.active : cfg.strokeWidth.normal,
    scale,
  );

  if (cfg.shapeAdapter === "rough") {
    // rough.js pathway
    const gen = getGenerator();
    const seed = nodeSeed(opts.nodeId);
    const roughOpts = {
      roughness: cfg.roughness ?? 1.6,
      bowing: cfg.bowing ?? 1.2,
      seed,
      fill: "var(--color-surface, #fdf7d9)",
      fillStyle: cfg.fillStyle ?? "hachure",
      hachureGap: 12, // 6 → 12 に増やして hachure 密度を減らし clean sketch feel
      hachureAngle: -35,
      stroke: "var(--color-ink, #2c2820)",
      strokeWidth,
      preserveVertices: true,
    };
    let drawable;
    switch (opts.kind) {
      case "rect":
        drawable = gen.rectangle(0, 0, opts.w, opts.h, roughOpts);
        break;
      case "ellipse":
        drawable = gen.ellipse(opts.w / 2, opts.h / 2, opts.w, opts.h, roughOpts);
        break;
      case "diamond":
        drawable = gen.polygon(
          [
            [opts.w / 2, 0],
            [opts.w, opts.h / 2],
            [opts.w / 2, opts.h],
            [0, opts.h / 2],
          ],
          roughOpts,
        );
        break;
      case "hexagon": {
        const cx = opts.w / 2;
        const cy = opts.h / 2;
        const rx = opts.w / 2;
        const ry = opts.h / 2;
        drawable = gen.polygon(
          [
            [cx - rx * 0.5, cy - ry],
            [cx + rx * 0.5, cy - ry],
            [cx + rx, cy],
            [cx + rx * 0.5, cy + ry],
            [cx - rx * 0.5, cy + ry],
            [cx - rx, cy],
          ],
          roughOpts,
        );
        break;
      }
      case "cylinder": {
        // cylinder = 2 ellipse (top + bottom) + side rect の合成
        const ry = 14;
        // side rectangle (top ellipse 下端から bottom ellipse 上端まで)
        const sideRect = gen.rectangle(0, ry, opts.w, opts.h - ry * 2, {
          ...roughOpts,
          fillStyle: cfg.fillStyle ?? "hachure",
        });
        const topEllipse = gen.ellipse(opts.w / 2, ry, opts.w, ry * 2, roughOpts);
        const paths: ShapeResult["paths"] = [
          ...roughShapeToPaths(sideRect, strokeWidth),
          ...roughShapeToPaths(topEllipse, strokeWidth),
        ];
        return { paths, attrs: {} };
      }
      case "cloud": {
        // cloud = 5 circle 重ね
        const cy = opts.h / 2 - opts.h * 0.05;
        const halfW = (opts.w * 0.85) / 2;
        const circles: Array<{ cx: number; cy: number; r: number }> = [
          { cx: opts.w / 2 - halfW * 0.8, cy: cy + opts.h * 0.08, r: opts.h * 0.32 },
          { cx: opts.w / 2 - halfW * 0.4, cy: cy - opts.h * 0.05, r: opts.h * 0.4 },
          { cx: opts.w / 2, cy: cy - opts.h * 0.1, r: opts.h * 0.46 },
          { cx: opts.w / 2 + halfW * 0.4, cy: cy - opts.h * 0.05, r: opts.h * 0.4 },
          { cx: opts.w / 2 + halfW * 0.8, cy: cy + opts.h * 0.08, r: opts.h * 0.32 },
        ];
        const allPaths: ShapeResult["paths"] = [];
        circles.forEach((c) => {
          const drawn = gen.circle(c.cx, c.cy, c.r * 2, roughOpts);
          allPaths.push(...roughShapeToPaths(drawn, strokeWidth));
        });
        return { paths: allPaths, attrs: {} };
      }
    }
    return { paths: roughShapeToPaths(drawable, strokeWidth), attrs: {} };
  }

  // straight path (blueprint / neumorphism / circuit / pinboard / isometric)
  const rx = opts.kind === "rect" ? 14 : 0;
  const ry = opts.kind === "rect" ? 14 : 0;
  const fill = "var(--color-surface, #ffffff)";
  // Neumorphism も subtle border を持たせる (dark mode の視認性のため、 light mode でも
  // 過度に目立たない stroke color を使う)、 border が 0 の設定は Circuit 等 filter で立体感を
  // 出す theme に限定。
  // Neumorphism は node の視認性のため --color-border variable 経由 (light=透明、 dark=subtle mint)
  const stroke =
    cfg.strokeWidth.normal === 0
      ? "none"
      : opts.theme === "neumorphism"
        ? "var(--color-border, transparent)"
        : "var(--color-ink, #1a1f2a)";

  switch (opts.kind) {
    case "rect":
      return {
        paths: [
          {
            d: `M ${rx} 0 L ${opts.w - rx} 0 Q ${opts.w} 0 ${opts.w} ${ry} L ${opts.w} ${opts.h - ry} Q ${opts.w} ${opts.h} ${opts.w - rx} ${opts.h} L ${rx} ${opts.h} Q 0 ${opts.h} 0 ${opts.h - ry} L 0 ${ry} Q 0 0 ${rx} 0 Z`,
            fill,
            stroke,
            strokeWidth,
            strokeLinejoin: "round",
          },
        ],
        attrs: { rx, ry },
      };
    case "ellipse":
      return {
        paths: [
          {
            d: `M 0 ${opts.h / 2} A ${opts.w / 2} ${opts.h / 2} 0 1 0 ${opts.w} ${opts.h / 2} A ${opts.w / 2} ${opts.h / 2} 0 1 0 0 ${opts.h / 2} Z`,
            fill,
            stroke,
            strokeWidth,
          },
        ],
        attrs: {},
      };
    case "diamond": {
      const pad = 8;
      return {
        paths: [
          {
            d: `M ${opts.w / 2} ${pad} L ${opts.w - pad} ${opts.h / 2} L ${opts.w / 2} ${opts.h - pad} L ${pad} ${opts.h / 2} Z`,
            fill,
            stroke,
            strokeWidth,
            strokeLinejoin: "round",
          },
        ],
        attrs: {},
      };
    }
    case "hexagon": {
      const cx = opts.w / 2;
      const cy = opts.h / 2;
      const rx2 = opts.w / 2;
      const ry2 = opts.h / 2;
      return {
        paths: [
          {
            d: `M ${cx - rx2 * 0.5} ${cy - ry2} L ${cx + rx2 * 0.5} ${cy - ry2} L ${cx + rx2} ${cy} L ${cx + rx2 * 0.5} ${cy + ry2} L ${cx - rx2 * 0.5} ${cy + ry2} L ${cx - rx2} ${cy} Z`,
            fill,
            stroke,
            strokeWidth,
            strokeLinejoin: "round",
          },
        ],
        attrs: {},
      };
    }
    case "cylinder": {
      const ry3 = 14;
      return {
        paths: [
          {
            d: `M 0 ${ry3} L 0 ${opts.h - ry3} A ${opts.w / 2} ${ry3} 0 0 0 ${opts.w} ${opts.h - ry3} L ${opts.w} ${ry3} A ${opts.w / 2} ${ry3} 0 0 0 0 ${ry3} Z`,
            fill,
            stroke,
            strokeWidth,
          },
          {
            d: `M 0 ${ry3} A ${opts.w / 2} ${ry3} 0 0 0 ${opts.w} ${ry3}`,
            fill: "none",
            stroke,
            strokeWidth,
          },
        ],
        attrs: {},
      };
    }
    case "cloud": {
      const cy = opts.h / 2 - opts.h * 0.05;
      const halfW = (opts.w * 0.85) / 2;
      const paths: ShapeResult["paths"] = [];
      const circles: Array<{ cx: number; cy: number; r: number }> = [
        { cx: opts.w / 2 - halfW * 0.8, cy: cy + opts.h * 0.08, r: opts.h * 0.32 },
        { cx: opts.w / 2 - halfW * 0.4, cy: cy - opts.h * 0.05, r: opts.h * 0.4 },
        { cx: opts.w / 2, cy: cy - opts.h * 0.1, r: opts.h * 0.46 },
        { cx: opts.w / 2 + halfW * 0.4, cy: cy - opts.h * 0.05, r: opts.h * 0.4 },
        { cx: opts.w / 2 + halfW * 0.8, cy: cy + opts.h * 0.08, r: opts.h * 0.32 },
      ];
      circles.forEach((c) => {
        paths.push({
          d: `M ${c.cx - c.r} ${c.cy} A ${c.r} ${c.r} 0 1 0 ${c.cx + c.r} ${c.cy} A ${c.r} ${c.r} 0 1 0 ${c.cx - c.r} ${c.cy} Z`,
          fill,
          stroke,
          strokeWidth,
        });
      });
      return { paths, attrs: {} };
    }
  }
}

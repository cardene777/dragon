/**
 * dragon theme runtime SSOT
 *
 * 6 theme の runtime metadata。 shape-generator が theme に応じて rough.js
 * or straight path を選択するための宣言的 config。
 *
 * design tokens は src/themes/tokens.css で CSS var として提供、
 * shape-adapter が要る数値 (roughness / seed strategy / stroke widths) だけ本 file で SSOT 化。
 */

export type ThemeName =
  | "blueprint"
  | "neumorphism"
  | "circuit"
  | "handdrawn"
  | "pinboard"
  | "isometric";

export const THEMES: ThemeName[] = [
  "blueprint",
  "neumorphism",
  "circuit",
  "handdrawn",
  "pinboard",
  "isometric",
];

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  description: string;
  shapeAdapter: "straight" | "rough" | "straight-3d";
  roughness?: number;
  bowing?: number;
  fillStyle?: "solid" | "hachure" | "cross-hatch" | "zigzag";
  strokeWidth: { normal: number; active: number; edge: number };
  fontFamily: { sans: string; mono: string };
  fontSize: { title: number; eyebrow: number; subtitle: number; edgeLabel: number };
  surfaceEffect?: "none" | "grid" | "kraft-noise" | "pcb-pattern" | "sticky-shadow" | "iso-gradient";
  nodeFilter?: string; // SVG filter url (e.g. url(#dragon-nm-raised))
}

export const THEME_CONFIGS: Record<ThemeName, ThemeConfig> = {
  blueprint: {
    name: "blueprint",
    label: "Blueprint",
    description: "技術製図、 青地に white ink + graph paper grid",
    shapeAdapter: "straight",
    strokeWidth: { normal: 1.8, active: 2.6, edge: 2.0 },
    fontFamily: {
      sans: '"Inter", -apple-system, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fontSize: { title: 22, eyebrow: 12, subtitle: 15, edgeLabel: 14 },
    surfaceEffect: "grid",
  },
  neumorphism: {
    name: "neumorphism",
    label: "Neumorphism",
    description: "立体感 soft UI、 raised bumps + dual shadow",
    shapeAdapter: "straight",
    strokeWidth: { normal: 0, active: 2.0, edge: 2.4 },
    fontFamily: {
      sans: '"Söhne", "Inter", -apple-system, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fontSize: { title: 22, eyebrow: 12, subtitle: 15, edgeLabel: 14 },
    surfaceEffect: "none",
    nodeFilter: "url(#dragon-nm-raised)",
  },
  circuit: {
    name: "circuit",
    label: "Circuit",
    description: "PCB 基板、 dark green board + gold pads + mint traces",
    shapeAdapter: "straight",
    strokeWidth: { normal: 1.8, active: 2.6, edge: 2.4 },
    fontFamily: {
      sans: '"JetBrains Mono", "Courier New", monospace',
      mono: '"JetBrains Mono", monospace',
    },
    fontSize: { title: 20, eyebrow: 11, subtitle: 14, edgeLabel: 13 },
    surfaceEffect: "pcb-pattern",
    nodeFilter: "url(#dragon-cir-trace-glow)",
  },
  handdrawn: {
    name: "handdrawn",
    label: "Handdrawn",
    description: "Excalidraw sketch、 rough.js wobble + kraft palette",
    shapeAdapter: "rough",
    roughness: 1.6,
    bowing: 1.2,
    fillStyle: "hachure",
    strokeWidth: { normal: 2.2, active: 3.0, edge: 2.6 },
    fontFamily: {
      sans: '"Caveat", "Bradley Hand", cursive',
      mono: '"Kalam", "Comic Sans MS", cursive',
    },
    fontSize: { title: 26, eyebrow: 13, subtitle: 17, edgeLabel: 16 },
    surfaceEffect: "kraft-noise",
  },
  pinboard: {
    name: "pinboard",
    label: "Pinboard",
    description: "掲示板 sticky note + kraft board + tilt",
    shapeAdapter: "straight",
    strokeWidth: { normal: 1.6, active: 2.4, edge: 2.2 },
    fontFamily: {
      sans: '"Kalam", "Comic Sans MS", cursive',
      mono: '"Kalam", cursive',
    },
    fontSize: { title: 24, eyebrow: 12, subtitle: 16, edgeLabel: 15 },
    surfaceEffect: "sticky-shadow",
    nodeFilter: "url(#dragon-pin-sticky-shadow)",
  },
  isometric: {
    name: "isometric",
    label: "Isometric",
    description: "3D depth、 top-light gradient + cast shadow",
    shapeAdapter: "straight-3d",
    strokeWidth: { normal: 1.8, active: 2.6, edge: 2.0 },
    fontFamily: {
      sans: '"Inter", -apple-system, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fontSize: { title: 22, eyebrow: 12, subtitle: 15, edgeLabel: 14 },
    surfaceEffect: "iso-gradient",
    nodeFilter: "url(#dragon-iso-cast-shadow)",
  },
};

/**
 * stable seed per node — Excalidraw pattern。 node id (string) を hash して int seed に。
 * pan/zoom/theme swap でも同じ wobble を保証するため、 stable input が必要。
 */
export function nodeSeed(nodeId: string): number {
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = (hash << 5) - hash + nodeId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

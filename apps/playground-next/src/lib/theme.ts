/**
 * dragon theme SSOT (cdl の CdlTheme 型を re-export)。
 *
 * CSS override は src/themes/cdl-theme.css に SSOT、 selector 経路は
 * `[data-cdl-theme="<name>"] [data-cdl-role="<role>"]`。
 * cdl package 側 6 theme とは完全一致必須。
 */
import type { CdlTheme } from "@cardenelabs/cdl";

export type ThemeName = CdlTheme;

export const THEMES: ThemeName[] = [
  "blueprint",
  "neumorphism",
  "circuit",
  "handdrawn",
  "pinboard",
  "isometric",
];

export interface ThemeMetadata {
  label: string;
  description: string;
}

export const THEME_CONFIGS: Record<ThemeName, ThemeMetadata> = {
  blueprint: {
    label: "Blueprint",
    description: "技術製図、 青地に white ink + graph paper grid",
  },
  neumorphism: {
    label: "Neumorphism",
    description: "立体感 soft UI、 raised bumps + dual shadow",
  },
  circuit: {
    label: "Circuit",
    description: "PCB 基板、 dark green board + gold pads + mint traces",
  },
  handdrawn: {
    label: "Handdrawn",
    description: "Excalidraw sketch、 rough.js wobble + kraft palette",
  },
  pinboard: {
    label: "Pinboard",
    description: "掲示板 sticky note + kraft board + tilt",
  },
  isometric: {
    label: "Isometric",
    description: "3D depth、 top-light gradient + cast shadow",
  },
};

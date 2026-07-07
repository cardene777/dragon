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
  blueprint: { label: "Blueprint", description: "技術製図、 青地に white ink + graph paper grid" },
  neumorphism: { label: "Neumorphism", description: "立体感 soft UI、 raised bumps + dual shadow" },
  circuit: { label: "Circuit", description: "PCB 基板、 dark green + gold pads + mint traces" },
  handdrawn: { label: "Handdrawn", description: "Excalidraw sketch、 手描き感 + kraft palette" },
  pinboard: { label: "Pinboard", description: "掲示板 sticky note + kraft board" },
  isometric: { label: "Isometric", description: "3D depth、 top-light gradient + cast shadow" },
};

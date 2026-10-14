export interface CssPair {
  [path: string]: string;
}

export interface FigureInput {
  page: string;
  itemId: string;
}

export const COMPARISON_PROPERTIES: readonly string[];
export const CHROMIUM_LAUNCH_ARGS: readonly string[];
export const PALETTES: ReadonlyArray<{ value: string; label: string; reference: boolean }>;
export const REFERENCE_FIGURES: ReadonlyArray<{ kind: string; page: string; itemId: string; evidence: string }>;
export function readCssInputs(options?: {
  repoRoot?: string;
  baseline?: string;
  oldCss?: CssPair | { theme: string; motion: string };
  newCss?: CssPair | { theme: string; motion: string };
}): { baseline: string; oldCss: CssPair; newCss: CssPair };
export function applyThemeCss(page: import("playwright").Page, css: CssPair): Promise<void>;
export function compareFigures(page: import("playwright").Page, options: {
  baseUrl: string;
  figures: FigureInput[];
  oldCss: CssPair;
  newCss: CssPair;
  palettes?: string[];
  darkModes?: boolean[];
  pixelComparison?: boolean;
  onStateProgress?: (progress: { stateCount: number; state: Record<string, unknown> }) => void;
  onProgress?: (progress: { figure: FigureInput; matched: number; elapsedMs: number }) => void;
}): Promise<{
  stateCount: number;
  expectedStateCount: number;
  captureModes: { settled: number; timed: number };
  smil: {
    pausedSvgCount: number;
    smilElementCount: number;
    states: Array<Record<string, unknown> & { pausedSvgCount: number; smilElementCount: number }>;
  };
  phaseCounts: Record<string, number>;
  differences: Array<Record<string, unknown>>;
  variableDifferences: Array<Record<string, unknown>>;
  incomparableStates: Array<Record<string, unknown>>;
  coverage: { total: number; matched: number; unmatched: number; unclassified: number; rules: Array<Record<string, unknown>> };
  pixels: {
    referencePageCount: number;
    referencePages: Array<{ kind: string; palette: string }>;
    comparisons: number;
    differentPixels: number;
    differences: Array<Record<string, unknown>>;
  };
}>;
export function compareFiguresWithWorkers(browser: import("playwright").Browser, options: {
  baseUrl: string;
  figures: FigureInput[];
  oldCss: CssPair;
  newCss: CssPair;
  workers: number;
  palettes?: string[];
  darkModes?: boolean[];
  pixelComparison?: boolean;
  onStateProgress?: (progress: { stateCount: number; state: Record<string, unknown> }) => void;
  onProgress?: (progress: {
    finished: number;
    total: number;
    figure: FigureInput;
    matched: number;
    elapsedMs: number;
  }) => void;
}): ReturnType<typeof compareFigures>;
export function selectFigures(page: import("playwright").Page, options: {
  baseUrl: string;
  baseline: string;
  oldCss: CssPair;
  pages?: string[];
  onProgress?: (progress: {
    finished: number;
    total: number;
    figure: FigureInput;
    matched: number;
    elapsedMs: number;
    status: "complete" | "undrawable" | "without-cdl-svg";
    reason?: string;
  }) => void;
}): Promise<Record<string, unknown>>;


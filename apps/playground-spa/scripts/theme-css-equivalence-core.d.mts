export interface CssRule {
  id: string;
  source: string;
  selector: string;
  line: number;
  conditions: string[];
}

export interface ComputedEntry {
  key: string;
  element: { path: string; dataAttributes: Record<string, string> };
  values: Record<string, string>;
}

export const COMPARISON_PROPERTIES: readonly string[];
export const CHROMIUM_LAUNCH_ARGS: readonly string[];
export const SELECTION_CACHE_VERSION: number;
export const TIMED_CAPTURE_MS: number;
export function whileSmilAnimationsPaused<TPaused, TValue>(
  pause: () => TPaused | Promise<TPaused>,
  run: () => TValue | Promise<TValue>,
  unpause: () => void | Promise<void>,
): Promise<{ paused: TPaused; value: TValue }>;
export interface SelectionCacheResult {
  page: string;
  itemId: string;
  status: "complete" | "undrawable" | "without-cdl-svg";
  phaseCount?: number;
  ruleIds?: string[];
  reason?: string;
  stageSummary?: Record<string, unknown> | null;
  elapsedMs: number;
}
export interface SelectionCache {
  version: number;
  key: string;
  cssHash: string;
  results: SelectionCacheResult[];
}
export function stateCaptureDecision(
  elapsedMs: number,
  stableSamples: number,
  phaseChanged: boolean,
  timedCaptureMs?: number,
): { status: "wait" } | { status: "advanced" } | { status: "capture"; mode: "settled" | "timed" };
export function resolvePhaseCount(
  phaseSegmentCount: number,
  sawNonZeroPhase: boolean,
): { status: "resolved"; phaseCount: number } | { status: "unreadable"; reason: string };
export function phaseResetStatus(
  phaseCount: number,
  startPhase: number,
  currentPhase: number,
  sawNonZero?: boolean,
): { ready: boolean; sawNonZero: boolean };
export function selectionCacheKey(cssHash: string, version?: number): string;
export function selectionCacheForCss(value: unknown, cssHash: string): { cache: SelectionCache; reused: boolean };
export function completedSelectionKeys(cache: SelectionCache): Set<string>;
export function recordSelectionResult(cache: SelectionCache, result: SelectionCacheResult): SelectionCache;
export function collectCssVariableNames(cssTexts: Iterable<string>): string[];
export function countReferenceFixtureFiles(
  fileNames: Iterable<string>,
  kinds: Iterable<string>,
  paletteLabels: Iterable<string>,
): number;
export function parseCssRules(css: string, source?: string): {
  rules: CssRule[];
  ignored: Array<{ type: string; line: number }>;
  ignoredTypes: string[];
};
export function normalizeSelectorForCoverage(selector: string): { selector: string; removals: string[] };
export function compareComputedSnapshots(
  oldSnapshot: ComputedEntry[],
  newSnapshot: ComputedEntry[],
  state: Record<string, unknown>,
): {
  differences: Array<Record<string, unknown>>;
  variableDifferences: Array<Record<string, unknown>>;
};
export function greedySelectFigures(
  figures: Array<{ page: string; itemId: string; phaseCount: number; ruleIds: Set<string> }>,
  allRuleIds: Set<string>,
  mandatoryKeys?: string[],
): {
  selected: Array<{ page: string; itemId: string; phaseCount: number; ruleIds: string[]; reason: string; newlyCovered: number }>;
  covered: Set<string>;
  uncovered: Set<string>;
};
export function expectedStateCount(
  phaseCounts: Readonly<Record<string, number>>,
  paletteCount: number,
): number;
export function summarizeCoverage(
  rules: CssRule[],
  matchedIds: Set<string>,
  undecidableReasons?: Map<string, string>,
): { total: number; matched: number; unmatched: number; unclassified: number; rules: Array<Record<string, unknown>> };

/**
 * CSS 意匠の比較器から browser I/O を除いた純粋処理。
 * CLI と Vitest が同じ規則分解・差分判定・図選択を使うために分けている。
 */

export const COMPARISON_PROPERTIES = Object.freeze([
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "filter",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "paint-order",
  "r",
  "rx",
  "ry",
  "display",
  "visibility",
  "overflow",
  "pointer-events",
  "clip-path",
  "shape-rendering",
  "transform",
  "transform-box",
  "transform-origin",
  "translate",
  "scale",
  "color",
  "background-color",
  "background-image",
  "background-position",
  "background-repeat",
  "background-size",
  "width",
  "height",
  "animation-name",
  "animation-duration",
  "animation-delay",
  "animation-fill-mode",
  "animation-timing-function",
  "stroke-dashoffset",
  "mix-blend-mode",
  "marker-start",
  "marker-end",
  "stop-color",
  "stop-opacity",
  "flood-color",
]);

const DYNAMIC_PSEUDO_CLASSES = [
  "active",
  "focus",
  "focus-visible",
  "focus-within",
  "hover",
  "link",
  "target",
  "visited",
];

const DYNAMIC_PSEUDO_PATTERN = DYNAMIC_PSEUDO_CLASSES.join("|");
const IGNORED_AT_RULES = Object.freeze(["font-face", "keyframes"]);

export const SELECTION_CACHE_VERSION = 2;
export const TIMED_CAPTURE_MS = 1_200;
export const CHROMIUM_LAUNCH_ARGS = Object.freeze([
  "--disable-gpu",
  "--disable-partial-raster",
  "--disable-skia-runtime-opts",
  "--force-color-profile=srgb",
]);

/** SMIL を止めた区間を必ず再開してから、次の状態へ進める。 */
export async function whileSmilAnimationsPaused(pause, run, unpause) {
  const paused = await pause();
  try {
    return { paused, value: await run() };
  } finally {
    await unpause();
  }
}

/** 要約の安定回数と段へ入ってからの経過時間から、取得方法を決める。 */
export function stateCaptureDecision(elapsedMs, stableSamples, phaseChanged, timedCaptureMs = TIMED_CAPTURE_MS) {
  if (phaseChanged) return { status: "advanced" };
  if (stableSamples >= 3) return { status: "capture", mode: "settled" };
  if (elapsedMs >= timedCaptureMs) return { status: "capture", mode: "timed" };
  return { status: "wait" };
}

/** 段の札と、札が無い図の時計観測から実際の段数を決める。 */
export function resolvePhaseCount(phaseSegmentCount, sawNonZeroPhase) {
  if (phaseSegmentCount > 0) return { status: "resolved", phaseCount: phaseSegmentCount };
  if (sawNonZeroPhase) {
    return {
      status: "unreadable",
      reason: "段の札 .cdl-phase-seg が 0 個なのに data-cdl-phase-index が 0 以外へ進んだ",
    };
  }
  return { status: "resolved", phaseCount: 1 };
}

/** 段 0 の途中を「一周した」と誤認しないため、開始段と観測履歴から復帰を判定する。 */
export function phaseResetStatus(phaseCount, startPhase, currentPhase, sawNonZero = false) {
  if (phaseCount === 1) return { ready: true, sawNonZero: false };
  const nextSawNonZero = sawNonZero || currentPhase !== 0;
  return {
    ready: currentPhase === 0 && (startPhase !== 0 || nextSawNonZero),
    sawNonZero: nextSawNonZero,
  };
}

export function selectionCacheKey(cssHash, version = SELECTION_CACHE_VERSION) {
  return `theme-css-equivalence-select-v${version}:${cssHash}`;
}

/** CSS hash・道具の版が異なる、または形が古い cache は空の現行形式へ戻す。 */
export function selectionCacheForCss(value, cssHash) {
  const key = selectionCacheKey(cssHash);
  if (
    value &&
    typeof value === "object" &&
    value.version === SELECTION_CACHE_VERSION &&
    value.key === key &&
    value.cssHash === cssHash &&
    Array.isArray(value.results)
  ) {
    return { cache: value, reused: true };
  }
  return {
    cache: { version: SELECTION_CACHE_VERSION, key, cssHash, results: [] },
    reused: false,
  };
}

export function completedSelectionKeys(cache) {
  return new Set(
    cache.results
      .filter((result) => result.status === "complete" || result.status === "without-cdl-svg")
      .map((result) => `${result.page}/${result.itemId}`),
  );
}

export function recordSelectionResult(cache, result) {
  const key = `${result.page}/${result.itemId}`;
  return {
    ...cache,
    results: [...cache.results.filter((entry) => `${entry.page}/${entry.itemId}` !== key), result],
  };
}

function withoutCssCommentsAndStrings(css) {
  let result = "";
  let cursor = 0;
  while (cursor < css.length) {
    if (css.startsWith("/*", cursor)) {
      const end = skipComment(css, cursor);
      result += " ".repeat(end - cursor);
      cursor = end;
    } else if (css[cursor] === '"' || css[cursor] === "'") {
      const end = skipString(css, cursor);
      result += " ".repeat(end - cursor);
      cursor = end;
    } else {
      result += css[cursor];
      cursor += 1;
    }
  }
  return result;
}

/** 宣言と var() 参照の両方から custom property 名を集める。 */
export function collectCssVariableNames(cssTexts) {
  const names = new Set();
  for (const css of cssTexts) {
    const searchable = withoutCssCommentsAndStrings(css);
    for (const match of searchable.matchAll(/--[-_a-zA-Z0-9]+/g)) names.add(match[0]);
  }
  return [...names].sort();
}

/** 静的見本の file 名から、対象の種と意匠に一致する組だけを数える。 */
export function countReferenceFixtureFiles(fileNames, kinds, paletteLabels) {
  const expected = new Set();
  for (const kind of kinds) {
    for (const palette of paletteLabels) expected.add(`${kind}-${palette}.html`);
  }
  return new Set(fileNames.filter((name) => expected.has(name))).size;
}

function lineAt(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text[cursor] === "\n") line += 1;
  }
  return line;
}

function skipComment(text, start) {
  const end = text.indexOf("*/", start + 2);
  return end === -1 ? text.length : end + 2;
}

function skipString(text, start) {
  const quote = text[start];
  let cursor = start + 1;
  while (cursor < text.length) {
    if (text[cursor] === "\\") cursor += 2;
    else if (text[cursor] === quote) return cursor + 1;
    else cursor += 1;
  }
  return text.length;
}

function matchingBrace(text, open) {
  let depth = 1;
  let cursor = open + 1;
  while (cursor < text.length) {
    if (text.startsWith("/*", cursor)) {
      cursor = skipComment(text, cursor);
      continue;
    }
    if (text[cursor] === '"' || text[cursor] === "'") {
      cursor = skipString(text, cursor);
      continue;
    }
    if (text[cursor] === "{") depth += 1;
    if (text[cursor] === "}") {
      depth -= 1;
      if (depth === 0) return cursor;
    }
    cursor += 1;
  }
  throw new Error(`CSS の ${lineAt(text, open)} 行目に閉じ波括弧がありません`);
}

function atRuleName(header) {
  return header.slice(1).match(/^[-\w]+/)?.[0]?.toLowerCase() ?? "unknown";
}

/** 注釈・文字列を飛ばし、通常規則と入れ子の条件規則を列挙する。 */
export function parseCssRules(css, source = "css") {
  const rules = [];
  const ignored = [];

  const walk = (from, to, conditions) => {
    let cursor = from;
    let statementStart = from;
    while (cursor < to) {
      if (css.startsWith("/*", cursor)) {
        const commentStart = cursor;
        cursor = skipComment(css, cursor);
        if (css.slice(statementStart, commentStart).trim() === "") statementStart = cursor;
        continue;
      }
      if (css[cursor] === '"' || css[cursor] === "'") {
        cursor = skipString(css, cursor);
        continue;
      }
      if (css[cursor] === ";") {
        cursor += 1;
        statementStart = cursor;
        continue;
      }
      if (css[cursor] !== "{") {
        cursor += 1;
        continue;
      }

      const close = matchingBrace(css, cursor);
      const rawHeader = css.slice(statementStart, cursor);
      const withoutComments = rawHeader.replace(/\/\*[\s\S]*?\*\//g, " ");
      const leading = withoutComments.search(/\S/);
      const headerStart = leading === -1 ? statementStart : statementStart + leading;
      const header = withoutComments.trim();
      if (header.startsWith("@")) {
        const name = atRuleName(header);
        if (name.endsWith("keyframes") || name === "font-face") {
          ignored.push({ type: name.endsWith("keyframes") ? "keyframes" : name, line: lineAt(css, headerStart) });
        } else {
          walk(cursor + 1, close, [...conditions, header]);
        }
      } else if (header !== "") {
        const index = rules.length;
        rules.push({
          id: `${source}:${lineAt(css, headerStart)}:${index + 1}`,
          source,
          selector: header,
          line: lineAt(css, headerStart),
          conditions,
        });
      }
      cursor = close + 1;
      statementStart = cursor;
    }
  };

  walk(0, css.length, []);
  return { rules, ignored, ignoredTypes: [...IGNORED_AT_RULES] };
}

function splitSelectorList(selector) {
  const parts = [];
  let start = 0;
  let round = 0;
  let square = 0;
  let cursor = 0;
  while (cursor < selector.length) {
    if (selector.startsWith("/*", cursor)) {
      cursor = skipComment(selector, cursor);
      continue;
    }
    if (selector[cursor] === '"' || selector[cursor] === "'") {
      cursor = skipString(selector, cursor);
      continue;
    }
    if (selector[cursor] === "(") round += 1;
    else if (selector[cursor] === ")") round = Math.max(0, round - 1);
    else if (selector[cursor] === "[") square += 1;
    else if (selector[cursor] === "]") square = Math.max(0, square - 1);
    else if (selector[cursor] === "," && round === 0 && square === 0) {
      parts.push(selector.slice(start, cursor));
      start = cursor + 1;
    }
    cursor += 1;
  }
  parts.push(selector.slice(start));
  return parts;
}

/** coverage 用に browser 状態でしか成立しない擬似選択子を外す。 */
export function normalizeSelectorForCoverage(selector) {
  const removals = [];
  const normalized = splitSelectorList(selector)
    .map((part) => {
      let next = part;
      next = next.replace(
        new RegExp(`:(not|is|where)\\(\\s*:(${DYNAMIC_PSEUDO_PATTERN})\\s*\\)`, "gi"),
        (match) => {
          removals.push(match);
          return "";
        },
      );
      next = next.replace(/::[-\w]+(?:\([^)]*\))?/g, (match) => {
        removals.push(match);
        return "";
      });
      next = next.replace(new RegExp(`:(${DYNAMIC_PSEUDO_PATTERN})(?![-\\w])`, "gi"), (match) => {
        removals.push(match);
        return "";
      });
      return next.trim();
    })
    .filter(Boolean)
    .join(", ");
  return { selector: normalized, removals };
}

/** 2 回分の計算後の値を element key と property で比較する。 */
export function compareComputedSnapshots(oldSnapshot, newSnapshot, state) {
  const differences = [];
  const variableDifferences = [];
  const newByKey = new Map(newSnapshot.map((entry) => [entry.key, entry]));
  for (const oldEntry of oldSnapshot) {
    const newEntry = newByKey.get(oldEntry.key);
    if (!newEntry) {
      differences.push({ ...state, element: oldEntry.element, property: "<element>", oldValue: "present", newValue: "missing" });
      continue;
    }
    const properties = new Set([...Object.keys(oldEntry.values), ...Object.keys(newEntry.values)]);
    for (const property of properties) {
      const oldValue = oldEntry.values[property] ?? "";
      const newValue = newEntry.values[property] ?? "";
      if (oldValue !== newValue) {
        const target = property.startsWith("--") ? variableDifferences : differences;
        target.push({ ...state, element: oldEntry.element, property, oldValue, newValue });
      }
    }
    newByKey.delete(oldEntry.key);
  }
  for (const newEntry of newByKey.values()) {
    differences.push({ ...state, element: newEntry.element, property: "<element>", oldValue: "missing", newValue: "present" });
  }
  return { differences, variableDifferences };
}

/** 必須図を先に入れ、残る規則を一番多く増やす図を順に選ぶ。 */
export function greedySelectFigures(figures, allRuleIds, mandatoryKeys = []) {
  const byKey = new Map(figures.map((figure) => [`${figure.page}/${figure.itemId}`, figure]));
  const covered = new Set();
  const selected = [];
  const selectedKeys = new Set();

  const add = (figure, reason) => {
    const key = `${figure.page}/${figure.itemId}`;
    if (selectedKeys.has(key)) return;
    const newlyCovered = [...figure.ruleIds].filter((id) => !covered.has(id));
    for (const id of newlyCovered) covered.add(id);
    selectedKeys.add(key);
    selected.push({ ...figure, ruleIds: [...figure.ruleIds], reason, newlyCovered: newlyCovered.length });
  };

  for (const key of mandatoryKeys) {
    const figure = byKey.get(key);
    if (figure) add(figure, "静的見本に対応する宅配の見本");
  }

  while (covered.size < allRuleIds.size) {
    let best;
    let bestGain = 0;
    for (const figure of figures) {
      const key = `${figure.page}/${figure.itemId}`;
      if (selectedKeys.has(key)) continue;
      const gain = [...figure.ruleIds].filter((id) => !covered.has(id)).length;
      if (gain > bestGain) {
        best = figure;
        bestGain = gain;
      }
    }
    if (!best || bestGain === 0) break;
    add(best, "未命中の規則を最も多く増やす図");
  }

  return {
    selected,
    covered,
    uncovered: new Set([...allRuleIds].filter((id) => !covered.has(id))),
  };
}

export function expectedStateCount(phaseCounts, paletteCount = 10, modeCount = 2) {
  return Object.values(phaseCounts).reduce((sum, count) => sum + count * paletteCount * modeCount, 0);
}

export function summarizeCoverage(rules, matchedIds, undecidableReasons = new Map()) {
  const unmatched = rules
    .filter((rule) => !matchedIds.has(rule.id))
    .map((rule) => ({
      id: rule.id,
      source: rule.source,
      selector: rule.selector,
      line: rule.line,
      reason: undecidableReasons.get(rule.id) ?? "走査した stage・SvgDefs・html・body の対象要素に一致しない",
    }));
  const summary = { total: rules.length, matched: matchedIds.size, unmatched: unmatched.length, unclassified: 0, rules: unmatched };
  if (summary.total !== summary.matched + summary.unmatched) {
    throw new Error(`coverage の分類数が一致しません: ${summary.total} != ${summary.matched} + ${summary.unmatched}`);
  }
  return summary;
}

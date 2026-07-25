/**
 * text 編集 DSL 精緻化 helper (CAR-2139 scope-out fix)。
 * 重複 text (Client が 4 箇所等) の全置換を避け、 field scope に応じた 1 箇所置換を試みる。
 *
 * 判定順序:
 *   1. 1 箇所のみ出現 = そのまま replace
 *   2. actor list yaml pattern (`- {original}` の word boundary) が 1 箇所 = そこだけ replace
 *   3. quoted string pattern (`"{original}"`) が 1 箇所 = そこだけ replace
 *   4. 全 fallback = 最初の 1 箇所のみ replace (副作用最小化)
 */
export function replaceTextInDsl(src: string, originalText: string, newText: string): string {
  if (originalText === newText || !newText.trim()) return src;
  const escaped = escapeRegExp(originalText);
  const occurrences = countOccurrences(src, originalText);
  if (occurrences === 0) return src;
  if (occurrences === 1) return src.replace(originalText, newText);
  const actorPattern = new RegExp(`(-\\s+)${escaped}(\\b)`, "g");
  const actorMatches = src.match(actorPattern);
  if (actorMatches && actorMatches.length === 1) {
    return src.replace(actorPattern, `$1${newText}$2`);
  }
  const quotedPattern = new RegExp(`("${escaped}")`, "g");
  const quotedMatches = src.match(quotedPattern);
  if (quotedMatches && quotedMatches.length === 1) {
    return src.replace(quotedPattern, `"${newText}"`);
  }
  return src.replace(originalText, newText);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(src: string, needle: string): number {
  return src.split(needle).length - 1;
}

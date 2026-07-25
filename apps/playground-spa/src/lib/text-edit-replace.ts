/**
 * text 編集 DSL 精緻化 helper (CAR-2139 scope-out fix、 Round 2 で 3 findings fix)。
 * 重複 text (Client が 4 箇所等) の全置換を避け、 field scope に応じた 1 箇所置換を試みる。
 *
 * 判定順序:
 *   1. 1 箇所のみ出現 = そのまま replace
 *   2. actors block scope 内の list pattern (`- {original}` の word boundary) が 1 箇所 = そこだけ replace
 *      (flow 行 `- Client -> API` を除外するため、 actors: block を find してからその中で match)
 *   3. quoted string pattern (`"{original}"`) が 1 箇所 = そこだけ replace
 *   4. 全 fallback = 最初の 1 箇所のみ replace (副作用最小化)
 *
 * MAJOR fix (Round 2):
 *   - 全 String.replace の replacement 引数を関数 form (`() => newText`) に変更、
 *     newText 内の $&、 $`、 $'、 $$、 $1〜$99 が JavaScript 置換 token として展開される bug 封じ
 */
export function replaceTextInDsl(src: string, originalText: string, newText: string): string {
  if (originalText === newText || !newText.trim()) return src;
  const escaped = escapeRegExp(originalText);
  const occurrences = countOccurrences(src, originalText);
  if (occurrences === 0) return src;
  if (occurrences === 1) return src.replace(originalText, () => newText);
  const actorReplaced = replaceInActorsBlock(src, originalText, newText, escaped);
  if (actorReplaced !== null) return actorReplaced;
  const quotedPattern = new RegExp(`"${escaped}"`, "g");
  const quotedMatches = src.match(quotedPattern);
  if (quotedMatches && quotedMatches.length === 1) {
    return src.replace(quotedPattern, () => `"${newText}"`);
  }
  return src.replace(originalText, () => newText);
}

/**
 * actors: block を find して block scope 内の list pattern (`- {original}`) を replace。
 *
 * block 検出 = `actors:\n` 開始、 続く indented lines を block scope、
 * 次の top-level key (`\n[a-zA-Z_-]`) or EOF で block 終了。
 *
 * block 内で `- {original}\b` が 1 箇所のみ match したら該当行を replace した src を返す。
 * それ以外 (block 不在 / 0 match / 2+ match) は null (次判定段階に譲る)。
 */
function replaceInActorsBlock(src: string, originalText: string, newText: string, escaped: string): string | null {
  const blockStartRe = /^actors:[ \t]*\r?\n/m;
  const blockStartMatch = blockStartRe.exec(src);
  if (!blockStartMatch) return null;
  const blockStartOffset = blockStartMatch.index + blockStartMatch[0].length;
  const rest = src.slice(blockStartOffset);
  const blockEndInRest = rest.search(/^(?![ \t])/m);
  const blockEndOffset = blockEndInRest === -1 ? src.length : blockStartOffset + blockEndInRest;
  const blockBody = src.slice(blockStartOffset, blockEndOffset);
  const actorPattern = new RegExp(`(-[ \\t]+)${escaped}(\\b)`, "g");
  const actorMatches = blockBody.match(actorPattern);
  if (!actorMatches || actorMatches.length !== 1) return null;
  const replacedBlock = blockBody.replace(actorPattern, (_match, prefix: string, suffix: string) => `${prefix}${newText}${suffix}`);
  return src.slice(0, blockStartOffset) + replacedBlock + src.slice(blockEndOffset);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(src: string, needle: string): number {
  return src.split(needle).length - 1;
}

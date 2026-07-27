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
 * 次の top-level key (`\n[a-zA-Z_-]:`) or EOF で block 終了。
 *
 * 2026-07-26 CAR-2158 edge case (a) fix = block 終了判定を「top-level key の実 pattern」 に精緻化。
 * 旧実装 `^(?![ \t])` は 空行 (indent なし) も top-level 扱いで block scope が空になり、
 * 段階 4 の fall-through で flow の `- Client -> API` を誤置換していた。
 * 新実装 = 空行 skip + 次の top-level key `^[a-zA-Z_][\w-]*:` 検出で block 終了。
 *
 * block 内で `- {original}` が YAML 境界 (行末 or 空白 or `:`) で 1 箇所のみ match したら
 * 該当行を replace した src を返す。 それ以外 (block 不在 / 0 match / 2+ match) は null (次判定段階に譲る)。
 *
 * 2026-07-26 CAR-2158 edge case (b) fix = word boundary を YAML delimiter set に置換。
 * 旧 `\b Client \b` は `Client-v2` の Client 部分にも match し substring 誤置換していた。
 * 新 = `(?=$|[ \t:,\r\n])` の lookahead で YAML 文脈の delimiter のみ許容、 hyphen は非 delimiter 扱い。
 */
function replaceInActorsBlock(src: string, originalText: string, newText: string, escaped: string): string | null {
  const blockStartRe = /^actors:[ \t]*\r?\n/m;
  const blockStartMatch = blockStartRe.exec(src);
  if (!blockStartMatch) return null;
  const blockStartOffset = blockStartMatch.index + blockStartMatch[0].length;
  const rest = src.slice(blockStartOffset);
  // top-level key detection = 行頭 identifier + `:` (indent なしで先頭に来る key)。 空行は skip。
  const blockEndInRest = rest.search(/^[a-zA-Z_][\w-]*:/m);
  const blockEndOffset = blockEndInRest === -1 ? src.length : blockStartOffset + blockEndInRest;
  const blockBody = src.slice(blockStartOffset, blockEndOffset);
  // YAML delimiter lookahead = 空白 / colon / comma / 行末 のみ許容、 hyphen は非 delimiter
  const actorPattern = new RegExp(`(-[ \\t]+)${escaped}(?=$|[ \\t:,\\r\\n])`, "gm");
  const actorMatches = blockBody.match(actorPattern);
  if (!actorMatches || actorMatches.length !== 1) return null;
  const replacedBlock = blockBody.replace(actorPattern, (_match, prefix: string) => `${prefix}${newText}`);
  return src.slice(0, blockStartOffset) + replacedBlock + src.slice(blockEndOffset);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(src: string, needle: string): number {
  return src.split(needle).length - 1;
}

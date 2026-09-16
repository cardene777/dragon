/**
 * 値の宣言がどの行から来たかを控える (#2034 で `compile.ts` から移した)。
 *
 * **葉に置く** = 入口 (`compileToCdl`) と部品の取り込み (`mergePartIntoDiagram`) の両方が呼ぶ。
 * 見本を重ねる間だけ別表で宣言元を持ち回るため、どちらの側も同じ表へ書き足す。
 */

/** `derived` の同名宣言を、engine が読む順のまま行番号の列として残す。 */
export function recordDerivedSourceLine(
  sourceLines: Map<string, number[]> | undefined,
  id: string,
  line: number,
): void {
  if (!sourceLines) return;
  const lines = sourceLines.get(id) ?? [];
  lines.push(line);
  sourceLines.set(id, lines);
}

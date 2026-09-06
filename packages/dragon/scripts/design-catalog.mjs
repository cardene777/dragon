/**
 * catalog の source から、記法で組む図を持ちうる群だけを選ぶ。
 *
 * file を読む責務は呼出側に置く。 入力と出力だけを扱うため、browser を開かずに候補の
 * 絞り込みを検査できる。
 */
export function 記法の群候補(files) {
  return files
    .filter(({ file, text }) => file.endsWith(".cdl.ts") && text.includes("textDslToDiagram"))
    .sort((a, b) => a.file.localeCompare(b.file))
    .map(({ file }) => ({ group: file.replace(/\.cdl\.ts$/, ""), file }));
}

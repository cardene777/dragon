/**
 * Markdown の文書から節と囲みのコードを読む (#3701)。
 *
 * 組み込みの説明の検査が、README とプラグインの文書と見本帳の使い方の頁のコードを突き合わせるのに使う。
 */

/** `heading` の節 (次の同じ深さの見出しの前まで)。無い時は空 */
export function sectionOf(markdown: string, heading: string): string {
  const start = markdown.split("\n").findIndex((line) => line === heading);
  if (start < 0) return "";
  const lines = markdown.split("\n").slice(start + 1);
  const end = lines.findIndex((line) => /^## /u.test(line));
  return lines.slice(0, end < 0 ? undefined : end).join("\n");
}

/** 節の中の囲みのコード */
export function codeBlocks(section: string): string[] {
  return [...section.matchAll(/^```[a-z]*\n([\s\S]*?)^```$/gmu)].map((match) => (match[1] ?? "").replace(/\n$/u, ""));
}

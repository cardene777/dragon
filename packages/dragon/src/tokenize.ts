/**
 * 記法を 1 行ずつに切る。
 *
 * 空行とコメントの行 (`//` で始まる行) は捨てる。行の頭と終わりの空白は意味を持たないので落とし、
 * 誤りを示すために元の行の番号と、残した字が始まる列を持たせる。
 * 行と列は 1 から数え、列は字の数で数える (UTF-16 の単位では数えない)。
 */
export interface SourceLine {
  line: number;
  column: number;
  text: string;
}

/** `text` の `index` 番目 (UTF-16 の位置) にある字が、行の何列目かを返す。 */
export function columnOf(source: SourceLine, index: number): number {
  return source.column + Array.from(source.text.slice(0, index)).length;
}

export function tokenize(notation: string): SourceLine[] {
  const lines: SourceLine[] = [];
  notation.split(/\r?\n/).forEach((raw, index) => {
    const text = raw.trim();
    if (text === "" || text.startsWith("//")) return;
    const lead = raw.length - raw.trimStart().length;
    lines.push({ line: index + 1, column: Array.from(raw.slice(0, lead)).length + 1, text });
  });
  return lines;
}

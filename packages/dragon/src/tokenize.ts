/**
 * 記法を 1 行ずつに切る。
 *
 * 空行とコメントの行 (`//` で始まる行) も捨てずに返す。`say` の下に字下げして続けた本文では、
 * 空行も `//` で始まる行も本文の字になるため、捨てるかは読む側が行の場所で決める (#3137)。
 * 行の頭と終わりの空白は落とし、頭の空白の字の数を `indent` に残す。
 * 誤りを示すために元の行の番号と、残した字が始まる列を持たせる。
 * 行と列は 1 から数え、列は字の数で数える (UTF-16 の単位では数えない)。
 */
export interface SourceLine {
  line: number;
  column: number;
  /** 行の頭の空白の字の数。`say` の続きの行を見分ける */
  indent: number;
  text: string;
}

/** 空行かコメントの行 */
export const isBlankOrComment = (source: SourceLine): boolean => source.text === "" || source.text.startsWith("//");

/** `text` の `index` 番目 (UTF-16 の位置) にある字が、行の何列目かを返す。 */
export function columnOf(source: SourceLine, index: number): number {
  return source.column + Array.from(source.text.slice(0, index)).length;
}

export function tokenize(notation: string): SourceLine[] {
  return notation.split(/\r?\n/).map((raw, index) => {
    const indent = Array.from(raw.slice(0, raw.length - raw.trimStart().length)).length;
    return { line: index + 1, column: indent + 1, indent, text: raw.trim() };
  });
}

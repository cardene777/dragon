/**
 * `dragon check` の中身 (#3455)。記法を描かずに読み、誤りと知らせを行と列を付けて返す。
 *
 * AI が書いた記法を確かめて直す輪で使う。誤りは描けない行で、知らせ (似た名前の箱、#3438) は描けるが書き手に見せたい行。
 * Markdown の file は dragon の囲み (```dragon) だけを読み、行は囲みの中の行でなく元の file の行で返す。
 * 図の頭に定義の無い `+名前` は、読む処理と同じく共有のブロック集から引く。
 */
import { extractDiagrams } from "./markdown";
import { parseNotation } from "./parser";
import type { NotationLang } from "./words";

export interface Problem {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  message: string;
}

/** 確かめる file の拡張子と読み方。Markdown は囲みだけを読む */
export const CHECKED_FILES: Readonly<Record<string, "notation" | "markdown">> = { ".dragon": "notation", ".md": "markdown", ".markdown": "markdown" };

/** `text` を確かめる。`file` は出す行の頭に付ける名前 */
export function checkText(file: string, text: string, form: "notation" | "markdown", lang: NotationLang): Problem[] {
  const pieces = form === "markdown" ? extractDiagrams(text) : [{ source: text, line: 1 }];
  return pieces.flatMap(({ source, line }) => {
    const parsed = parseNotation(source, { lang });
    const found = parsed.ok ? (parsed.notices ?? []).map((n) => ({ ...n, severity: "warning" as const })) : parsed.errors.map((e) => ({ ...e, severity: "error" as const }));
    return found.map(({ line: at, column, message, severity }) => ({ file, line: line + at - 1, column, severity, message }));
  });
}

/** 1 件 1 行の形。`<file>:<行>:<列> <重さ> <文>` */
export const problemLine = (p: Problem): string => `${p.file}:${p.line}:${p.column} ${p.severity} ${p.message}`;

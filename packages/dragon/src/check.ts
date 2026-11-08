/**
 * `dragon check` の中身 (#3455)。記法を描かずに読み、誤りと知らせを行と列を付けて返す。
 *
 * AI が書いた記法を確かめて直す輪で使う。誤りは描けない行で、知らせ (似た名前の箱、#3438) は描けるが書き手に見せたい行。
 * Markdown の file は dragon の囲み (```dragon) だけを読み、行は囲みの中の行でなく元の file の行で返す。
 * 図の頭に定義の無い `+名前` は、読む処理と同じく共有のブロック集から引く。
 * 崩れを確かめる時 (`--layout`、#3484) だけ、誤りの無い図を描き、崩れを段を始める `step` の行の知らせとして足す。
 */
import { extractDiagrams } from "./markdown";
import { parseNotation } from "./parser";
import type { LayoutBreak } from "./render/breaks";
import { describeBreak, diagramBreaks, stepLines } from "./render/layout-check";
import type { NotationLang } from "./words";

export interface Problem {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  message: string;
  /** 描いた図の崩れの知らせなら、その崩れ (#3484) */
  layout?: LayoutBreak;
}

/** 崩れの知らせの文に段を添える形。`step` は 1 から数える。命令の言葉で段を書くため、命令が渡す */
export type StepNote = (step: number, text: string) => string;

/** 確かめる file の拡張子と読み方。Markdown は囲みだけを読む */
export const CHECKED_FILES: Readonly<Record<string, "notation" | "markdown">> = { ".dragon": "notation", ".md": "markdown", ".markdown": "markdown" };

/**
 * `text` を確かめる。`file` は出す行の頭に付ける名前。
 * `layout` を渡すと、誤りの無い図を描いて崩れも確かめ、崩れの知らせの文をその形で段に添える。描けない図は描く処理の断りを誤りで返す
 */
export function checkText(file: string, text: string, form: "notation" | "markdown", lang: NotationLang, layout?: StepNote): Problem[] {
  const pieces = form === "markdown" ? extractDiagrams(text) : [{ source: text, line: 1 }];
  return pieces.flatMap(({ source, line }) => {
    const parsed = parseNotation(source, { lang });
    const found = parsed.ok ? (parsed.notices ?? []).map((n) => ({ ...n, severity: "warning" as const })) : parsed.errors.map((e) => ({ ...e, severity: "error" as const }));
    const problems: Problem[] = found.map(({ line: at, column, message, severity }) => ({ file, line: line + at - 1, column, severity, message }));
    if (layout === undefined || !parsed.ok) return problems;
    let breaks: LayoutBreak[];
    try {
      breaks = diagramBreaks(parsed.diagram, lang);
    } catch (error) {
      return [...problems, { file, line, column: 1, severity: "error", message: error instanceof Error ? error.message : String(error) }];
    }
    const steps = stepLines(source);
    return [
      ...problems,
      ...breaks.map((b): Problem => ({ file, line: line + (steps[b.step - 1] ?? 1) - 1, column: 1, severity: "warning", message: layout(b.step, describeBreak(b, lang)), layout: b })),
    ];
  });
}

/** 1 件 1 行の形。`<file>:<行>:<列> <重さ> <文>` */
export const problemLine = (p: Problem): string => `${p.file}:${p.line}:${p.column} ${p.severity} ${p.message}`;

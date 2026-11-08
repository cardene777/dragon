/**
 * `dragon check` の中身 (#3455)。記法を描かずに読み、誤りと知らせを行と列を付けて返す。
 *
 * AI が書いた記法を確かめて直す輪で使う。誤りは描けない行で、知らせ (似た名前の箱、#3438) は描けるが書き手に見せたい行。
 * Markdown の file は dragon の囲み (```dragon) だけを読み、行は囲みの中の行でなく元の file の行で返す。
 * 図の頭に定義の無い `+名前` は、読む処理と同じく共有のブロック集から引く。
 * 崩れを確かめる時 (`--layout`、#3484) だけ、誤りの無い図を描き、崩れを段を始める `step` の行の知らせとして足す。
 * 注釈を除いた最初の行が `blocks` の版の行の記法は、図ではなく足したブロックの定義の file として読む (#3508)。
 * 共有のブロック集へ PR を出す前に、組み立て直していない `dragon` で定義と、定義を渡した見本を確かめるため。
 */
import { extractDiagrams } from "./markdown";
import { parseNotation } from "./parser";
import type { LayoutBreak } from "./render/breaks";
import { describeBreak, diagramBreaks, stepLines } from "./render/layout-check";
import { isBlankOrComment, tokenize } from "./tokenize";
import { type UserBlocks, versionLine } from "./user-blocks";
import { readBlocks } from "./user-blocks-read";
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

/** `checkText` の設定 */
export interface CheckTextOptions {
  /** 渡すと、誤りの無い図を描いて崩れも確かめ、崩れの知らせの文をこの形で段に添える (#3484) */
  layout?: StepNote;
  /** 図の頭に書かずに渡す足したブロックの定義 (`--blocks`、#3508) */
  blocks?: UserBlocks;
}

/** 注釈と空の行を除いた最初の行が `blocks` の版の行なら、足したブロックの定義の file (#3508)。図は最初の行に図の種類を書く */
export function isBlocksFile(text: string): boolean {
  const first = tokenize(text).find((source) => !isBlankOrComment(source));
  return first !== undefined && versionLine(first) !== undefined;
}

/** 足したブロックの定義の file を読む。誤りは `file` を頭に付けた出す行の形で返す (#3508) */
export function readBlocksFile(file: string, text: string, lang: NotationLang): { ok: true; blocks: UserBlocks } | { ok: false; problems: Problem[] } {
  const read = readBlocks(text, { lang });
  if (read.ok) return { ok: true, blocks: read.blocks };
  return { ok: false, problems: read.errors.map(({ line, column, message }) => ({ file, line, column, severity: "error", message })) };
}

/**
 * `text` を確かめる。`file` は出す行の頭に付ける名前。
 * 足したブロックの定義の file は定義を読む処理 (`readBlocks`) で確かめ、その誤りを返す。
 * 描けない図は描く処理の断りを誤りで返す
 */
export function checkText(file: string, text: string, form: "notation" | "markdown", lang: NotationLang, options: CheckTextOptions = {}): Problem[] {
  const { layout, blocks } = options;
  if (form === "notation" && isBlocksFile(text)) {
    const read = readBlocksFile(file, text, lang);
    return read.ok ? [] : read.problems;
  }
  const pieces = form === "markdown" ? extractDiagrams(text) : [{ source: text, line: 1 }];
  return pieces.flatMap(({ source, line }) => {
    const parsed = parseNotation(source, { lang, ...(blocks !== undefined ? { blocks } : {}) });
    const found = parsed.ok ? (parsed.notices ?? []).map((n) => ({ ...n, severity: "warning" as const })) : parsed.errors.map((e) => ({ ...e, severity: "error" as const }));
    const problems: Problem[] = found.map(({ line: at, column, message, severity }) => ({ file, line: line + at - 1, column, severity, message }));
    if (layout === undefined || !parsed.ok) return problems;
    let breaks: LayoutBreak[];
    try {
      breaks = diagramBreaks(parsed.diagram, lang, blocks);
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

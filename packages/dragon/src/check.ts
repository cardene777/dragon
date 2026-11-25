/**
 * `dragon check` の中身 (#3455)。記法を描かずに読み、誤りと知らせを行と列を付けて返す。
 *
 * AI が書いた記法を確かめて直す輪で使う。誤りは描けない行で、知らせ (似た名前の箱、#3438) は描けるが書き手に見せたい行。
 * Markdown の file は dragon の囲み (```dragon) だけを読み、行は囲みの中の行でなく元の file の行で返す。
 * 図の頭に定義の無い `+名前` は、読む処理と同じく共有のブロック集から引く。
 * 崩れを確かめる時 (`--layout`、#3484) だけ、誤りの無い図を描き、崩れを段を始める `step` の行の知らせとして足す。
 * 注釈を除いた最初の行が `blocks` の版の行の記法は、図ではなく足したブロックの定義の file として読む (#3508)。
 * 共有のブロック集へ PR を出す前に、組み立て直していない `dragon` で定義と、定義を渡した見本を確かめるため。
 * HTMLのfile (#3908) は、HTMLの形の図 (`<dg-<種類>>`) と、記法の塊 (`<pre class="dragon">` と `<pre><code class="language-dragon">`) を読む。
 * HTMLの形の図の誤りは、記法の行ではなく、その行を作った要素の行と列と名前 (`<dg-box>`) で返し、崩れは段を始める `<dg-step>` の行で返す。
 */
import { readFigureElement } from "./html-form/convert";
import { type FormError, formMessage, isFigureTag } from "./html-form/figure";
import { attrOf, elementsOf, type HtmlElement, parseHtml, textOf } from "./html-form/html";
import { dedent } from "./embed/dedent";
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

/** 確かめるfileの読み方。Markdownは囲みだけを、HTMLはHTMLの形の図と記法の塊だけを読む */
export type CheckedForm = "notation" | "markdown" | "html";

/** 確かめるfileの拡張子と読み方 */
export const CHECKED_FILES: Readonly<Record<string, CheckedForm>> = { ".dragon": "notation", ".md": "markdown", ".markdown": "markdown", ".html": "html", ".htm": "html" };

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
export function checkText(file: string, text: string, form: CheckedForm, lang: NotationLang, options: CheckTextOptions = {}): Problem[] {
  if (form === "notation" && isBlocksFile(text)) {
    const read = readBlocksFile(file, text, lang);
    return read.ok ? [] : read.problems;
  }
  if (form === "html") return checkHtml(file, text, lang, options);
  const pieces = form === "markdown" ? extractDiagrams(text) : [{ source: text, line: 1 }];
  return notationProblems(file, pieces, lang, options);
}

/** 記法の塊ごとの誤りと知らせ。`line` は塊の1行目のfileの行 */
function notationProblems(file: string, pieces: readonly { source: string; line: number }[], lang: NotationLang, options: CheckTextOptions): Problem[] {
  const { layout, blocks } = options;
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

/** HTMLの形の誤りを出す行の形にする。要素の名前で始まらない文は、頭に要素の名前を付ける */
const formProblem = (file: string, error: FormError, severity: Problem["severity"]): Problem => ({ file, line: error.line, column: error.column, severity, message: formMessage(error) });

/** HTMLの頁の図。HTMLの形の図の要素と、記法の塊の字と1行目の行を、頁の並びで */
function pageFigures(node: HtmlElement): ({ form: HtmlElement } | { source: string; line: number })[] {
  if (isFigureTag(node.name)) return [{ form: node }];
  const classes = (element: HtmlElement): string[] => (attrOf(element, "class") ?? "").split(/\s+/u);
  const block = node.name === "pre" && classes(node).includes("dragon") ? node : node.name === "pre" ? elementsOf(node).find((child) => child.name === "code" && classes(child).includes("language-dragon")) : undefined;
  if (block) {
    const first = block.children[0];
    return [{ source: dedent(textOf(block)), line: first?.line ?? block.line }];
  }
  return elementsOf(node).flatMap(pageFigures);
}

/** HTMLのfileを確かめる (#3908)。HTMLの形の図は要素の行と名前で、記法の塊は塊の中の記法の行をfileの行に直して返す */
function checkHtml(file: string, text: string, lang: NotationLang, options: CheckTextOptions): Problem[] {
  const { layout, blocks } = options;
  return pageFigures(parseHtml(text)).flatMap((figure): Problem[] => {
    if (!("form" in figure)) return notationProblems(file, [figure], lang, options);
    const read = readFigureElement(figure.form, { lang, ...(blocks !== undefined ? { blocks } : {}) });
    if (!read.ok) return read.errors.map((error) => formProblem(file, error, "error"));
    const problems = read.notices.map((notice) => formProblem(file, notice, "warning"));
    if (layout === undefined) return problems;
    let breaks: LayoutBreak[];
    try {
      breaks = diagramBreaks(read.diagram, lang, blocks);
    } catch (error) {
      return [...problems, formProblem(file, { line: read.root.line, column: read.root.column, element: read.root.name, message: error instanceof Error ? error.message : String(error) }, "error")];
    }
    return [
      ...problems,
      ...breaks.map((b): Problem => {
        const step = read.steps[b.step - 1] ?? read.root;
        return { ...formProblem(file, { line: step.line, column: step.column, element: step.name, message: layout(b.step, describeBreak(b, lang)) }, "warning"), layout: b };
      }),
    ];
  });
}

/** 1 件 1 行の形。`<file>:<行>:<列> <重さ> <文>` */
export const problemLine = (p: Problem): string => `${p.file}:${p.line}:${p.column} ${p.severity} ${p.message}`;

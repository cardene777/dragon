/**
 * 軽い入口だけを読む頁が帯つきの図を置く入口 (`@cardenelabs/dragon/light/frame`、#3789)。
 *
 * `@cardenelabs/dragon/frame`と同じ名前を出すが、記法を読む処理と図の再生の部品は軽い入口 (`@cardenelabs/dragon/light`) から読み、既定の入口を読まない。
 * 軽い入口と同じく、書いた図の種類を`loadFor`で読んだ後に、待たずに帯つきの図を置く。
 * 読んでいない種類の記法は、種類の名前を挙げて`loadFor`を待つよう言う誤りで断り、置き先に帯を残さない。
 *
 * ```ts
 * import { loadFor } from "@cardenelabs/dragon/light";
 * import { mountFramedDiagram } from "@cardenelabs/dragon/light/frame";
 *
 * await loadFor(source);
 * mountFramedDiagram(host, source);
 * ```
 */
import { diagramKind, kindLoaded, mountDiagram, NOTATION_WORDS, parseNotation, renderDiagram, type Diagram, type Player, type PlayerOptions } from "@cardenelabs/dragon/light";
import type { PictureDrawer } from "./frame/diagram-actions.mjs";
import { loadCapture } from "./frame/capture-load.mjs";
import { createDragonFrame as createFrame, diagramEditorUrl as editorUrl } from "./frame/dragon-frame.mjs";
import { frameLang } from "./frame/frame-text.mjs";
import { mountNotationInFrame } from "./frame/framed";
import type { DiagramFrame, FrameOptions } from "./frame/index";

export { createFigureHeader } from "./frame/header";
export type { HeaderColors, FigureHeader, FigureHeaderOptions } from "./frame/header";
export type { ActionNotify, DiagramActions } from "./frame/diagram-actions.mjs";
export type { FrameButton } from "./frame/dragon-frame.mjs";
export type { BuiltinButton, CopyKind, EmbedLook, ExportDetail, ExportFormat, ExportOptions, ShareDetail } from "./frame/types";
export type { DiagramFrame, FrameOptions };

/** 記法`source`と図`diagram`の帯を作る。`@cardenelabs/dragon/frame`の`createDragonFrame`と同じ */
/** 判定の表の書き出す絵の形を描く処理 (#3945)。軽い入口の`renderDiagram`で描く */
const drawPicture: PictureDrawer = (diagram, options) => renderDiagram(diagram, { ...options, picture: true });

export const createDragonFrame = (document: Document, source: string, diagram: Diagram, options: FrameOptions = {}): DiagramFrame =>
  createFrame(document, source, diagram, { ...options, words: NOTATION_WORDS, capture: loadCapture, picture: drawPicture });
/** 見本帳のエディタで記法`source`を開く URL */
export const diagramEditorUrl: (source: string) => string = editorUrl;

/** 読んでいない種類の記法を置いた時の誤りの文。記法を読む前に種類で断り、ブロックの名前でなく種類の名前を挙げる */
const KIND_NOT_LOADED = {
  ja: (kind: string) => `${kind}の図の部品を読んでいない。置く前にloadForを待つ`,
  en: (kind: string) => `The ${kind} diagram parts are not loaded. Await loadFor before mounting`,
} as const;

/**
 * 記法`source`を読み、`host`に帯つきの図を置く。書いた図の種類は先に`loadFor`で読んでおく。
 * 記法の誤りの文は帯と同じ言葉 (設定`lang`、置いた所から上の`lang`属性、英語の順) で出す
 */
export function mountFramedDiagram(host: HTMLElement, source: string, options: PlayerOptions & FrameOptions = {}): { player: Player; frame: DiagramFrame; destroy(): void } {
  const kind = diagramKind(source);
  if (kind !== undefined && !kindLoaded(kind)) throw new Error(KIND_NOT_LOADED[frameLang(options.lang, host)](kind));
  return mountNotationInFrame(host, source, options, parseNotation, mountDiagram, NOTATION_WORDS, loadCapture, drawPicture);
}

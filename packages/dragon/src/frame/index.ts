/** Article chrome shared by embedders; the native player owns diagram inputs. */
import { parseNotation, mountDiagram, NOTATION_WORDS, type Diagram, type PlayerOptions, type Player } from '@cardenelabs/dragon';
import { createDragonFrame as createFrame, diagramEditorUrl as editorUrl } from './dragon-frame.mjs';
import { mountInFrame } from './framed';
import type { HeaderColors, FigureHeader } from './header';
import type { ActionNotify, DiagramActions } from './diagram-actions.mjs';
import type { FrameButton } from './dragon-frame.mjs';
import type { BuiltinButton, EmbedLook } from './types';
export { createFigureHeader } from './header';
export type { HeaderColors, FigureHeader, FigureHeaderOptions } from './header';
export type { ActionNotify, DiagramActions } from './diagram-actions.mjs';
export type { FrameButton } from './dragon-frame.mjs';
export type { BuiltinButton, CopyKind, EmbedLook, ExportDetail, ExportFormat, ExportOptions, ShareDetail } from './types';

export interface FrameOptions {
  headerColors?: HeaderColors;
  /** 帯と再生の部品の言葉。書かない時は置いた所から上の`lang`属性に従い、それも無い時は英語 (#3695) */
  lang?: "ja" | "en";
  /** `adoptedStyleSheets`を持たないブラウザで帯の内側に作るstyle要素と、図の SVG の`<style>`に付ける`nonce` (#3695) */
  nonce?: string;
  /** 帯の色と書体と字の大きさと角と高さ、図を囲む枠の線と地 (#3698) */
  look?: EmbedLook;
  /** 帯のボタンの並び。書いた順に並び、書かなかった初めからのボタンは外れる。置く側のボタンも足せる (#3698) */
  buttons?: readonly (BuiltinButton | FrameButton)[];
  /** エクスポートした時とエディタで開いた・コピーした時に呼ぶ (#3698) */
  notify?: ActionNotify;
}

export interface DiagramFrame {
  frame: HTMLElement;
  host: HTMLElement;
  header: FigureHeader;
  /** 帯の言葉 */
  lang: "ja" | "en";
  /** エクスポートとコピーとエディタで開く処理 (#3698) */
  actions: DiagramActions;
  setHeaderColors(colors: HeaderColors): void;
  connect(): void;
  destroy(): void;
}
export const createDragonFrame = (document: Document, source: string, diagram: Diagram, options: FrameOptions = {}): DiagramFrame => createFrame(document, source, diagram, { ...options, words: NOTATION_WORDS });
export const diagramEditorUrl: (source: string) => string = editorUrl;

/** Mount notation with source tabs, editor navigation, fullscreen and exports. */
export function mountFramedDiagram(host: HTMLElement, source: string, options: PlayerOptions & FrameOptions = {}): { player: Player; frame: DiagramFrame; destroy(): void } {
  const parsed = parseNotation(source);
  if (!parsed.ok) throw new Error(parsed.errors.map(e => `${e.line}: ${e.message}`).join('\n'));
  return mountInFrame(host, source, parsed.diagram, options, mountDiagram, NOTATION_WORDS);
}

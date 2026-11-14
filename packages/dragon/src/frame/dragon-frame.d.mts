import type { Diagram } from '../schema';
import type { FigureHeader, HeaderColors } from './header';
import type { NotationLang } from '../words';
import type { ActionNotify, DiagramActions } from './diagram-actions.mjs';
import type { BuiltinButton, EmbedLook } from './types';

/** 帯に足す置く側のボタン。押すと`onClick`が図の処理を受け取る (#3698) */
export interface FrameButton { id: string; label: string; /** 24 四方の SVG の`path`の`d` */ icon?: string; onClick(actions: DiagramActions): void }

export function diagramEditorUrl(source: string): string;
export function createDragonFrame(document: Document, source: string, diagram: Diagram, options: {
  headerColors?: HeaderColors; lang?: NotationLang; nonce?: string;
  look?: EmbedLook; buttons?: readonly (BuiltinButton | FrameButton)[]; notify?: ActionNotify;
  /** コードの窓で色を付ける記法の語の一覧 (`NOTATION_WORDS`、#3699) */
  words: { readonly kinds: readonly string[]; readonly heads: readonly string[] };
}): {
  header: FigureHeader; lang: NotationLang; actions: DiagramActions; setHeaderColors(colors: HeaderColors): void;
  frame: HTMLElement; host: HTMLElement; connect(): void; destroy(): void;
};

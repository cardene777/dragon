import type { Diagram } from '../schema';
import type { FigureHeader, HeaderColors } from './header';
import type { NotationLang } from '../words';
import type { ActionNotify, CaptureLoader, DiagramActions, PictureDrawer } from './diagram-actions.mjs';
import type { RenderOptions } from '@cardenelabs/dragon';
import type { BuiltinButton, EmbedLook } from './types';

/** 帯に足す置く側のボタン。押すと`onClick`が図の処理を受け取る (#3698) */
export interface FrameButton { id: string; label: string; /** 24 四方の SVG の`path`の`d` */ icon?: string; onClick(actions: DiagramActions): void }

export function diagramEditorUrl(source: string): string;
export function createDragonFrame(document: Document, source: string, diagram: Diagram, options: {
  headerColors?: HeaderColors; lang?: NotationLang; nonce?: string;
  look?: EmbedLook; buttons?: readonly (BuiltinButton | FrameButton)[]; notify?: ActionNotify;
  /** コードの窓で色を付ける記法の語の一覧 (`NOTATION_WORDS`、#3699) */
  words: { readonly kinds: readonly string[]; readonly heads: readonly string[] };
  /** 書き出す部品を読む処理 (`capture-load.mjs`、#3786)。渡さない時はエクスポートの窓からHTMLとGIFとMP4を外す */
  capture?: CaptureLoader;
  /** 判定の表の書き出す絵の形を描く処理 (#3945)。渡さない時は判定の表も頁の表を写す */
  picture?: PictureDrawer;
} & Pick<RenderOptions, 'palette' | 'theme' | 'colors'>): {
  header: FigureHeader; lang: NotationLang; actions: DiagramActions; setHeaderColors(colors: HeaderColors): void;
  frame: HTMLElement; host: HTMLElement; connect(): void; destroy(): void;
};

import type { Diagram } from '../schema';
import type { CopyKind, ExportDetail, ExportFormat, ExportOptions, ShareDetail } from './types';

/** エクスポートした時 (`export`) とエディタで開いた・コピーした時 (`share`) に呼ぶ口 */
export type ActionNotify = {
  (type: 'export', detail: ExportDetail): void;
  (type: 'share', detail: ShareDetail): void;
};

/** 置いた図のエクスポートとコピーとエディタで開く処理。帯のボタンと、帯を出さずに置いた図の関数が呼ぶ */
export interface DiagramActions {
  /** 置いた記法 */
  readonly source: string;
  /** コードの窓に出す記法と図の JSON */
  readonly sourceText: { dragon: string; json: string };
  /** 見本帳のエディタで同じ記法を開く URL。記法を縮めて詰める (#3697) */
  editorUrl(): Promise<string>;
  /** 縮めたエディタの URL と、URL の上限 (`EDITOR_URL_LIMIT`) を超えるか */
  editorLink(): Promise<{ url: string; long: boolean }>;
  /** エクスポートの途中か */
  readonly busy: boolean;
  /** 図を形式`format`のファイルの中身にする */
  export(format: ExportFormat, options?: ExportOptions): Promise<Blob>;
  /** 物`kind`をクリップボードに書く。ブラウザが断った時は投げる */
  copy(kind: CopyKind): Promise<void>;
  /** 見本帳のエディタを新しいタブで開く。縮めても長すぎる記法はクリップボードに写してから貼るよう頼むエディタを開き、`true`で終わる */
  openEditor(): Promise<boolean>;
  /** 図の動きの記録を始める。GIF と MP4 はこの記録を流す */
  connect(): void;
  destroy(): void;
}

export const PAPER: string;
export function createDiagramActions(document: Document, host: HTMLElement, source: string, diagram: Diagram, notify?: ActionNotify): DiagramActions;

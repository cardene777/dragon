import type { Diagram, RenderOptions } from '@cardenelabs/dragon';
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

/** 書き出す部品が撮る段の時刻。`renderDiagram`が返す`timeline` */
interface PictureTimeline {
  total: number;
  stills: readonly number[];
  steps: readonly { start: number }[];
}

/**
 * 書き出す絵の形 (`renderDiagram`の`picture`、#3945) を描く処理。入口が渡す。
 * 帯は再生の部品と同じ色味と明るさと言葉を渡し、頁が判定の表を描いている時だけ呼ぶ
 */
export type PictureDrawer = (diagram: Diagram, options: Pick<RenderOptions, 'palette' | 'theme' | 'colors' | 'lang'>) => { svg: string; timeline: PictureTimeline };

/** 書き出す部品 (`capture.js`) のうち、エクスポートが使う関数 (#3786)。判定の表の絵は`capturePng`と`captureSvg`と`captureFilm`で作る (#3945) */
export interface CaptureParts {
  captureFrames(options: {
    width: number; height: number; total: number; format: 'gif' | 'mp4';
    draw: (seconds: number) => Promise<HTMLCanvasElement>;
    signal?: AbortSignal; onProgress?: (fraction: number) => void;
  }): Promise<Blob>;
  captureHtml(source: string): Promise<string>;
  capturePng(figure: SVGSVGElement, options?: { scale?: number; background?: string }): Promise<Blob>;
  captureSvg(figure: SVGSVGElement): Promise<string>;
  captureFilm(figure: SVGSVGElement, options: { formats: readonly ('gif' | 'mp4')[]; fps?: number; gifFps?: number; timeline: PictureTimeline }): Promise<{ gif?: Blob; mp4?: Blob }>;
}
/** 書き出す部品を読む処理。入口が渡す (`capture-load.mjs`) */
export type CaptureLoader = () => Promise<CaptureParts>;

export const PAPER: string;
/** 作る時に書き出す部品を読む形式 */
export const CAPTURE_FORMATS: readonly ExportFormat[];
/** `loadCapture`を渡さない時は、`CAPTURE_FORMATS`の形式のエクスポートを断る。`drawPicture`は再生の部品と同じ設定に結んだ書き出す絵の形を描く処理 (#3945) */
export function createDiagramActions(document: Document, host: HTMLElement, source: string, diagram: Diagram, notify?: ActionNotify, loadCapture?: CaptureLoader, drawPicture?: () => ReturnType<PictureDrawer>): DiagramActions;

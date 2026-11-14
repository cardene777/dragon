/**
 * 帯つきの図とSDKの入口 (`@cardenelabs/dragon/embed`) が共に使う設定と知らせの型 (#3698)。
 * 帯の入口とSDKの入口の両方が同じ名前で出す。
 */
import type { HeaderColors } from './header';

/** 帯に初めから在るボタン。設定`buttons`に書いた順に並び、書かなかったボタンは帯から外れる */
export type BuiltinButton = 'code' | 'editor' | 'copy' | 'export' | 'expand';

/** 帯と図を囲む枠を置き先に合わせる値。書かなかった欄は今の見た目のまま */
export interface EmbedLook {
  /** 帯の色。`headerColors`と同じ欄を持ち、こちらが勝つ */
  colors?: HeaderColors;
  /** 帯の書体 (CSS の`font-family`) */
  font?: string;
  /** 帯の題とボタンの字の大きさ (CSS の長さ) */
  fontSize?: string;
  /** 帯のボタンの角の丸み (CSS の長さ) */
  radius?: string;
  /** 帯の行の高さ (CSS の長さ)。ボタンが収まらない時は伸びる */
  height?: string;
  /** 図を囲む枠 */
  frame?: {
    /** 枠の線 (CSS の`border`) */
    border?: string;
    /** 枠の地 (CSS の`background`) */
    background?: string;
  };
}

/** エクスポートできる形式。画像 (`png`、`svg`)、動き (`html`、`gif`、`mp4`)、記法 (`dragon`、`json`) */
export type ExportFormat = 'png' | 'svg' | 'html' | 'gif' | 'mp4' | 'dragon' | 'json';

/** 画像をエクスポートする時の選び */
export interface ExportOptions {
  /** PNG の画素の倍率。書かなければ 2 */
  scale?: 1 | 2 | 3;
  /** 図の地。`transparent`は地を塗らない。書かなければ`fill` */
  background?: 'fill' | 'transparent';
  /** GIF と MP4 を作る間の進み (0 から 1) */
  onProgress?: (fraction: number) => void;
}

/** コピーできる物。記法 (`source`)、図の JSON (`json`)、PNG の画像 (`image`)、エディタの URL (`url`) */
export type CopyKind = 'source' | 'json' | 'image' | 'url';

/** エクスポートした知らせの中身 */
export interface ExportDetail {
  format: ExportFormat;
}

/** エディタで開いたか、コピーした知らせの中身。コピーの時だけ`kind`を持つ */
export interface ShareDetail {
  via: 'copy' | 'editor';
  kind?: CopyKind;
}

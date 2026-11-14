import { createFigureHeader as create } from './header.mjs';
export interface HeaderColors { surface?: string; background?: string; foreground?: string; muted?: string; border?: string; accent?: string; hover?: string }
export interface FigureHeader { element: HTMLDivElement; title: HTMLParagraphElement; actions: HTMLDivElement; settings: HTMLDivElement; setColors(colors: HeaderColors): void }
/** 帯の頭を作る設定。`mark`は題の左にdragonの印を置き、`styles`を`false`にするとstyle要素を作らない。作る時のstyle要素には`nonce`を付ける */
export interface FigureHeaderOptions { title?: string; colors?: HeaderColors; mark?: { href: string; label?: string }; label?: string; styles?: boolean; nonce?: string }
export const createFigureHeader: (document: Document, options?: FigureHeaderOptions) => FigureHeader = create;

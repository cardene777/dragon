import { createFigureHeader as create } from './header.mjs';
export interface HeaderColors { surface?: string; background?: string; foreground?: string; muted?: string; border?: string; accent?: string; hover?: string }
export interface FigureHeader { element: HTMLDivElement; title: HTMLParagraphElement; actions: HTMLDivElement; settings: HTMLDivElement; setColors(colors: HeaderColors): void }
export const createFigureHeader: (document: Document, options?: { title?: string; colors?: HeaderColors }) => FigureHeader = create;

import type { Diagram } from '../schema';
import type { FigureHeader, HeaderColors } from './header';
import type { NotationLang } from '../words';
export function diagramEditorUrl(source: string): string;
export function createDragonFrame(document: Document, source: string, diagram: Diagram, options?: { headerColors?: HeaderColors; lang?: NotationLang; nonce?: string }): {
  header: FigureHeader; lang: NotationLang; setHeaderColors(colors: HeaderColors): void;
  frame: HTMLElement; host: HTMLElement; connect(): void; destroy(): void;
};

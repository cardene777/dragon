import type { Diagram } from '../schema';
import type { FigureHeader, HeaderColors } from './header';
export function diagramEditorUrl(source: string): string;
export function createDragonFrame(document: Document, source: string, diagram: Diagram, options?: { headerColors?: HeaderColors }): {
  header: FigureHeader; setHeaderColors(colors: HeaderColors): void;
  frame: HTMLElement; host: HTMLElement; connect(): void; destroy(): void;
};

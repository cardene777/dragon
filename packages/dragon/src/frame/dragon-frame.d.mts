import type { Diagram } from '../schema';
export function diagramEditorUrl(source: string): string;
export function createDragonFrame(document: Document, source: string, diagram: Diagram): {
  frame: HTMLElement; host: HTMLElement; connect(): void; destroy(): void;
};

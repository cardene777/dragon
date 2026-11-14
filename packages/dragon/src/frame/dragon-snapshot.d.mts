export interface DiagramSnapshot { width: number; height: number; svg: SVGSVGElement }
export function snapshotDiagram(host: HTMLElement, options?: { animate?: boolean; transparent?: boolean }): DiagramSnapshot;
export function snapshotText(snapshot: DiagramSnapshot, at?: number): string;
export function snapshotCanvas(snapshot: DiagramSnapshot, at?: number, scale?: number, fill?: string | null): Promise<HTMLCanvasElement>;

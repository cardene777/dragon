/** Article chrome shared by embedders; the native player owns diagram inputs. */
import { parseNotation, mountDiagram, type Diagram, type PlayerOptions, type Player } from '@cardenelabs/dragon';
import { createDragonFrame as createFrame, diagramEditorUrl as editorUrl } from './dragon-frame.mjs';
import type { HeaderColors, FigureHeader } from './header';
export { createFigureHeader } from './header';
export type { HeaderColors, FigureHeader } from './header';

export interface FrameOptions { headerColors?: HeaderColors }

export interface DiagramFrame {
  frame: HTMLElement;
  host: HTMLElement;
  header: FigureHeader;
  setHeaderColors(colors: HeaderColors): void;
  connect(): void;
  destroy(): void;
}
export const createDragonFrame: (document: Document, source: string, diagram: Diagram, options?: FrameOptions) => DiagramFrame = createFrame;
export const diagramEditorUrl: (source: string) => string = editorUrl;

/** Mount notation with source tabs, editor navigation, fullscreen and exports. */
export function mountFramedDiagram(host: HTMLElement, source: string, options: PlayerOptions & FrameOptions = {}): { player: Player; frame: DiagramFrame; destroy(): void } {
  const parsed = parseNotation(source);
  if (!parsed.ok) throw new Error(parsed.errors.map(e => `${e.line}: ${e.message}`).join('\n'));
  const controls = createDragonFrame(host.ownerDocument, source, parsed.diagram, options);
  host.append(controls.frame);
  let player: Player;
  try {
    player = mountDiagram(controls.host, parsed.diagram, options);
    controls.connect();
  } catch (error) {
    controls.destroy(); controls.frame.remove(); throw error;
  }
  let disposed = false;
  return { player, frame: controls, destroy() {
    if (disposed) return; disposed = true;
    player.destroy(); controls.destroy(); controls.frame.remove();
  } };
}

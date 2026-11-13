/** Article chrome shared by embedders; the native player owns diagram inputs. */
import { parseNotation, mountDiagram, type Diagram, type PlayerOptions, type Player } from '@cardenelabs/dragon';
import { createDragonFrame as createFrame, diagramEditorUrl as editorUrl } from './dragon-frame.mjs';

export interface DiagramFrame {
  frame: HTMLElement;
  host: HTMLElement;
  connect(): void;
  destroy(): void;
}
export const createDragonFrame: (document: Document, source: string, diagram: Diagram) => DiagramFrame = createFrame;
export const diagramEditorUrl: (source: string) => string = editorUrl;

/** Mount notation with source tabs, editor navigation, fullscreen and exports. */
export function mountFramedDiagram(host: HTMLElement, source: string, options: PlayerOptions = {}): { player: Player; destroy(): void } {
  const parsed = parseNotation(source);
  if (!parsed.ok) throw new Error(parsed.errors.map(e => `${e.line}: ${e.message}`).join('\n'));
  const controls = createDragonFrame(host.ownerDocument, source, parsed.diagram);
  host.append(controls.frame);
  let player: Player;
  try {
    player = mountDiagram(controls.host, parsed.diagram, options);
    controls.connect();
  } catch (error) {
    controls.destroy(); controls.frame.remove(); throw error;
  }
  let disposed = false;
  return { player, destroy() {
    if (disposed) return; disposed = true;
    player.destroy(); controls.destroy(); controls.frame.remove();
  } };
}

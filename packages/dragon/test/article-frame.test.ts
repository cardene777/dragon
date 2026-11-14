// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createDragonFrame, diagramEditorUrl, mountFramedDiagram } from '../dist/frame.js';
import { parseNotation } from '../dist/index.js';
import { snapshotDiagram } from '../src/frame/dragon-snapshot.mjs';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

test('official editor receives the complete UTF-8 notation', () => {
  const source = 'sequence 日本語 [test]\n// </script> & # +';
  const url = new URL(diagramEditorUrl(source));
  expect(url.origin + url.pathname).toBe('https://cardene777.github.io/dragon/editor');
  expect(Buffer.from(new URLSearchParams(url.hash.slice(1)).get('n')!, 'base64url').toString('utf8')).toBe(source);
});

test('frame retains source text and provides all seven export formats', () => {
  const source = 'sequence 注文\nbox a as あなた\nbox b as 店\nstep 確認\n a -> b: 注文';
  const parsed = parseNotation(source);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
  const controls = createDragonFrame(document, source, parsed.diagram);
  document.body.append(controls.frame);
  const root = controls.frame.shadowRoot!;
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.open = false; this.dispatchEvent(new Event('close')); } });
  (root.querySelector('.code-toggle') as HTMLButtonElement).click();
  expect(document.querySelector('dialog')?.parentElement).toBe(document.body);
  expect(root.querySelector('pre')?.textContent).toBe(source);
  expect(root.querySelectorAll('[data-syn]').length).toBeGreaterThan(0);
  expect([...root.querySelectorAll<HTMLElement>('[data-format]')].map(e => e.dataset.format)).toEqual(['png','svg','html','gif','mp4','dragon','json']);
  controls.destroy(); controls.destroy();
});

test('header layout and controls remain the same when the embedder changes its colors', () => {
  const parsed = parseNotation('sequence 配色\na -> b: 確認');
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.errors));
  const controls = createDragonFrame(document, 'sequence 配色\na -> b: 確認', parsed.diagram, {headerColors:{surface:'#fff',accent:'#a23'}});
  const header = controls.header;
  expect(header.title.textContent).toBe('配色');
  expect([...header.actions.children].map(el=>el.getAttribute('data-action'))).toEqual(['code','editor','copy','export','expand']);
  expect(header.element.style.getPropertyValue('--dragon-header-accent')).toBe('#a23');
  controls.setHeaderColors({accent:'#246',surface:undefined});
  expect(header.element.style.getPropertyValue('--dragon-header-accent')).toBe('#246');
  expect(header.element.style.getPropertyValue('--dragon-header-surface')).toBe('');
  expect(header.settings.hidden).toBe(false);
  controls.destroy();
});

test('snapshot preserves used centering margins instead of left-aligning the flow', () => {
  const host = document.createElement('div');
  host.style.cssText = 'display:block;width:400px;height:200px;padding:20px;border:2px solid black';
  const child = document.createElement('div');
  child.id = 'centered'; child.style.cssText = 'display:grid;position:static;transform:none;width:200px;height:50px;margin:0 auto';
  host.append(child); document.body.append(host);
  vi.spyOn(host,'getBoundingClientRect').mockReturnValue(new DOMRect(0,0,400,200));
  vi.spyOn(child,'getBoundingClientRect').mockReturnValue(new DOMRect(100,22,200,50));
  const computed = window.getComputedStyle.bind(window);
  vi.spyOn(window,'getComputedStyle').mockImplementation((node, pseudo) => pseudo ? {content:'none'} as CSSStyleDeclaration : computed(node));
  const copy = snapshotDiagram(host).svg.querySelector<HTMLElement>('#centered')!;
  expect(copy.style.marginLeft).toBe('78px');
  expect(copy.style.marginRight).toBe('78px');
});

test('shared frame mounts the native checkout player and destroys its input view', () => {
  const source = readFileSync(`${process.cwd()}/packages/dragon/examples/checkout/acp-purchase.dragon`,'utf8');
  const host = document.createElement('div'); document.body.append(host);
  const view = mountFramedDiagram(host,source);
  expect(view.player.diagram).toMatchObject({kind:'checkout'});
  expect(view.player.getState?.().quote?.total).toBe(20500);
  view.player.dispatch?.({type:'BUDGET',value:40000});
  expect(view.player.getState?.().budget).toBe(40000);
  view.destroy(); view.destroy();
  expect(host.childElementCount).toBe(0);
});

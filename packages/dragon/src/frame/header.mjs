const COLORS=['surface','background','foreground','muted','border','accent','hover'];
/** dragonの印の形 */
const MARK_PATH='M5 18c0-2 1-3.6 3-4.4 2-.8 3-1.8 3-4.4 0-2 2-3 4-2 2 1 4 0 4-2 0 2-2 4-4 4-2 0-4 2-4 4 0 2-2 4-4 4.6L5 18z';
export const HEADER_CSS=`
[data-dragon-header]{--h-surface:var(--dragon-header-surface,#f7f7f3);--h-bg:var(--dragon-header-background,#fffefa);--h-fg:var(--dragon-header-foreground,#29382e);--h-muted:var(--dragon-header-muted,#748074);--h-line:var(--dragon-header-border,#d6dcd2);--h-accent:var(--dragon-header-accent,#416f48);--h-hover:var(--dragon-header-hover,#eaf0e5);container-type:inline-size;display:block;background:var(--h-surface);color:var(--h-fg);border-bottom:1px solid var(--h-line);font:var(--dragon-header-font-size,12px)/1.5 var(--dragon-header-font,system-ui,sans-serif);min-width:0}
[data-dragon-header] *{box-sizing:border-box}
[data-dragon-header] .dg-header-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px;min-height:var(--dragon-header-height,47px);padding:9px 14px}
[data-dragon-header] .dg-header-title{margin:0;min-width:min(8.5em,100%);flex:1;font-size:var(--dragon-header-font-size,12px);font-weight:650;overflow-wrap:anywhere;line-height:1.6}
[data-dragon-header] .dg-header-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-left:auto}
[data-dragon-header] .dg-header-settings{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:8px 14px;border-top:1px solid var(--h-line);color:var(--h-muted)}
[data-dragon-header] .dg-header-settings:empty{display:none}
[data-dragon-header] :is(button,a){font:inherit;color:inherit}
[data-dragon-header] .dg-header-actions>:is(button,a),[data-dragon-header] .dg-header-actions>:not(button,a)>button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:5px 10px;border:1px solid var(--h-line);border-radius:var(--dragon-header-radius,6px);background:var(--h-bg);text-decoration:none;white-space:nowrap;cursor:pointer}
[data-dragon-header] .dg-header-actions>:is(button,a):hover,[data-dragon-header] .dg-header-actions>:not(button,a)>button:hover{color:var(--h-accent);border-color:var(--h-accent)}
[data-dragon-header] :is(button,a):focus-visible{outline:2px solid var(--h-accent);outline-offset:2px}
[data-dragon-header] .dg-header-actions :is([aria-pressed=true],[aria-expanded=true]){color:var(--h-accent);border-color:var(--h-accent);background:var(--h-hover)}
[data-dragon-header] .dg-header-actions svg{width:15px;height:15px}
[data-dragon-header] .dg-mark{display:inline-flex;align-items:center;gap:6px;flex:none;padding:3px 8px 3px 4px;border:1px solid var(--h-line);border-radius:999px;color:var(--h-muted);text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.02em}
[data-dragon-header] .dg-mark:hover{color:var(--h-accent);border-color:var(--h-accent)}
[data-dragon-header] .dg-mark-glyph{display:grid;place-items:center;width:18px;height:18px;border-radius:999px;background:var(--h-accent);color:var(--h-bg)}
[data-dragon-header] .dg-mark-glyph svg{width:12px;height:12px;fill:currentColor;stroke:none}
@container(max-width:600px){[data-dragon-header] .dg-header-row{gap:5px;padding:9px 10px}[data-dragon-header] .dg-header-title{flex-basis:100%}[data-dragon-header] .dg-header-actions{margin-left:0;width:100%;gap:4px}[data-dragon-header] .dg-header-actions>:is(button,a),[data-dragon-header] .dg-header-actions>:not(button,a)>button{padding:5px 8px}[data-dragon-header] .dg-header-settings{padding:8px 10px;gap:9px}}
`;

/**
 * Shared two-row structure. The font, font size, button corner and row height follow `--dragon-header-font`, `--dragon-header-font-size`,
 * `--dragon-header-radius` and `--dragon-header-height` (#3698). Consumers supply actions and existing player controls.
 * `mark` puts the dragon mark left of the title. `styles:false` skips the `<style>` element so the caller can adopt `HEADER_CSS` itself;
 * otherwise the `<style>` element carries `nonce`.
 */
export function createFigureHeader(document,{title='',colors={},mark,label='図の操作',styles=true,nonce}={}){
  const element=document.createElement('div');element.dataset.dragonHeader='';
  const row=document.createElement('div');row.className='dg-header-row';
  const heading=document.createElement('p');heading.className='dg-header-title';heading.textContent=title;
  const actions=document.createElement('div');actions.className='dg-header-actions';actions.setAttribute('role','toolbar');actions.setAttribute('aria-label',label);
  const settings=document.createElement('div');settings.className='dg-header-settings';
  if(mark){
    const link=document.createElement('a');link.className='dg-mark';link.href=mark.href;link.target='_blank';link.rel='noopener';
    if(mark.label){link.setAttribute('aria-label',mark.label);link.title=mark.label;}
    const glyph=document.createElement('span');glyph.className='dg-mark-glyph';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',MARK_PATH);svg.append(path);glyph.append(svg);
    const name=document.createElement('span');name.textContent='dragon';
    link.append(glyph,name);row.append(link);
  }
  row.append(heading,actions);
  if(styles){
    const style=document.createElement('style');if(nonce)style.setAttribute('nonce',nonce);style.textContent=HEADER_CSS;
    element.append(style);
  }
  element.append(row,settings);
  const setColors=values=>{for(const key of COLORS)if(Object.hasOwn(values,key)){const value=values[key];if(value)element.style.setProperty('--dragon-header-'+key,value);else element.style.removeProperty('--dragon-header-'+key);}};
  setColors(colors);
  return {element,title:heading,actions,settings,setColors};
}

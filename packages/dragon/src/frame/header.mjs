const COLORS=['surface','background','foreground','muted','border','accent','hover'];
/** dragonの印の段の鱗 (#3713)。竜の鱗の面を階段状の隙間で2つに分けた形で、見本帳の見出しの印とファビコンも同じ形を描く */
const MARK_VIEW_BOX='0 0 48 48';
const MARK_PATHS=[
  'M6 6.75A0.75 0.75 0 0 1 6.75 6L41.25 6A0.75 0.75 0 0 1 42 6.75L42 11.25A0.75 0.75 0 0 1 41.25 12L28.75 12A0.75 0.75 0 0 0 28 12.75L28 21.25A0.75 0.75 0 0 1 27.25 22L16.75 22A0.75 0.75 0 0 0 16 22.75L16 29.25A0.75 0.75 0 0 1 15.25 30L10.3107 30A0.75 0.75 0 0 1 9.7803 29.7803L6.2197 26.2197A0.75 0.75 0 0 1 6 25.6893Z',
  'M41.25 18A0.75 0.75 0 0 1 42 18.75L42 25.6893A0.75 0.75 0 0 1 41.7803 26.2197L24.5303 43.4697A0.75 0.75 0 0 1 23.4697 43.4697L17.2803 37.2803A0.75 0.75 0 0 1 17.8107 36L21.25 36A0.75 0.75 0 0 0 22 35.25L22 28.75A0.75 0.75 0 0 1 22.75 28L33.25 28A0.75 0.75 0 0 0 34 27.25L34 18.75A0.75 0.75 0 0 1 34.75 18Z',
];
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
[data-dragon-header] .dg-mark{display:inline-flex;align-items:center;justify-content:center;flex:none;width:30px;height:30px;margin:0 -4px 0 -6px;border-radius:var(--dragon-header-radius,6px);color:var(--h-accent);text-decoration:none}
[data-dragon-header] .dg-mark:hover{background:var(--h-hover)}
[data-dragon-header] .dg-mark svg{display:block;width:22px;height:22px;fill:currentColor;stroke:none}
@container(max-width:600px){[data-dragon-header] .dg-header-row{gap:5px;padding:9px 10px}[data-dragon-header] .dg-header-title{flex:1 1 0}[data-dragon-header] .dg-header-actions{margin-left:0;width:100%;gap:4px}[data-dragon-header] .dg-header-actions>:is(button,a),[data-dragon-header] .dg-header-actions>:not(button,a)>button{padding:5px 8px}[data-dragon-header] .dg-header-settings{padding:8px 10px;gap:9px}}
`;

/**
 * Shared two-row structure. The font, font size, button corner and row height follow `--dragon-header-font`, `--dragon-header-font-size`,
 * `--dragon-header-radius` and `--dragon-header-height` (#3698). Consumers supply actions and existing player controls.
 * `mark` puts the dragon mark (the scale icon only, no text) left of the title; `mark.label` is its accessible name.
 * `styles:false` skips the `<style>` element so the caller can adopt `HEADER_CSS` itself;
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
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',MARK_VIEW_BOX);svg.setAttribute('aria-hidden','true');
    for(const d of MARK_PATHS){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);}
    link.append(svg);row.append(link);
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

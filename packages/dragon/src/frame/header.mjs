const COLORS=['surface','background','foreground','muted','border','accent','hover'];
export const HEADER_CSS=`
[data-dragon-header]{--h-surface:var(--dragon-header-surface,#f7f7f3);--h-bg:var(--dragon-header-background,#fffefa);--h-fg:var(--dragon-header-foreground,#29382e);--h-muted:var(--dragon-header-muted,#748074);--h-line:var(--dragon-header-border,#d6dcd2);--h-accent:var(--dragon-header-accent,#416f48);--h-hover:var(--dragon-header-hover,#eaf0e5);container-type:inline-size;display:block;background:var(--h-surface);color:var(--h-fg);border-bottom:1px solid var(--h-line);font:12px/1.5 system-ui,sans-serif;min-width:0}
[data-dragon-header] *{box-sizing:border-box}
[data-dragon-header] .dg-header-row{display:flex;align-items:center;gap:16px;min-height:47px;padding:9px 14px}
[data-dragon-header] .dg-header-title{margin:0;min-width:0;flex:1;font-size:12px;font-weight:650;overflow-wrap:anywhere;line-height:1.6}
[data-dragon-header] .dg-header-actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-left:auto}
[data-dragon-header] .dg-header-settings{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:8px 14px;border-top:1px solid var(--h-line);color:var(--h-muted)}
[data-dragon-header] .dg-header-settings:empty{display:none}
[data-dragon-header] :is(button,a){font:inherit;color:inherit}
[data-dragon-header] .dg-header-actions>:is(button,a),[data-dragon-header] .dg-header-actions>.export>button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:5px 9px;border:1px solid transparent;border-radius:5px;background:transparent;text-decoration:none;white-space:nowrap;cursor:pointer}
[data-dragon-header] .dg-header-actions :is(button,a):hover{color:var(--h-accent);background:var(--h-hover);border-color:var(--h-line)}
[data-dragon-header] :is(button,a):focus-visible{outline:2px solid var(--h-accent);outline-offset:2px}
[data-dragon-header] .dg-header-actions .export>button{background:var(--h-bg);border-color:var(--h-line)}
[data-dragon-header] .dg-header-actions :is([aria-pressed=true],[aria-expanded=true]){color:var(--h-accent);background:var(--h-hover)}
@container(max-width:600px){[data-dragon-header] .dg-header-row{flex-wrap:wrap;gap:5px;padding:9px 10px}[data-dragon-header] .dg-header-title{flex-basis:100%}[data-dragon-header] .dg-header-actions{margin-left:0;width:100%;gap:2px}[data-dragon-header] .dg-header-actions>:is(button,a){padding:5px 7px}[data-dragon-header] .dg-header-settings{padding:8px 10px;gap:9px}}
`;

/** Shared two-row structure. Consumers supply actions and existing player controls. */
export function createFigureHeader(document,{title='',colors={}}={}){
  const element=document.createElement('div');element.dataset.dragonHeader='';
  const style=document.createElement('style');style.textContent=HEADER_CSS;
  const row=document.createElement('div');row.className='dg-header-row';
  const heading=document.createElement('p');heading.className='dg-header-title';heading.textContent=title;
  const actions=document.createElement('div');actions.className='dg-header-actions';actions.setAttribute('role','toolbar');actions.setAttribute('aria-label','図の操作');
  const settings=document.createElement('div');settings.className='dg-header-settings';
  row.append(heading,actions);element.append(style,row,settings);
  const setColors=values=>{for(const key of COLORS)if(Object.hasOwn(values,key)){const value=values[key];if(value)element.style.setProperty('--dragon-header-'+key,value);else element.style.removeProperty('--dragon-header-'+key);}};
  setColors(colors);
  return {element,title:heading,actions,settings,setColors};
}

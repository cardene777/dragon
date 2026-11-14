import { createFigureHeader, HEADER_CSS } from './header.mjs';
import { EDITOR_BASE, editorPasteUrl, editorUrl } from '../editor-url';
import { adoptStyle, stylesFor } from '../adopt-css';
import { paintSnippet, snippetWords, SNIPPET_CSS } from './dragon-snippet.mjs';
import { createDiagramActions, PAPER } from './diagram-actions.mjs';
import { FRAME_TEXT, frameLang } from './frame-text.mjs';
import { FONT_STACK_VARS } from '../look/values';

export function diagramEditorUrl(source) {
  return editorUrl(source);
}
/** dragonの印が開く見本帳の頁 */
const GALLERY = EDITOR_BASE;
const icons = {
  code:'M8 8l-4 4 4 4M16 8l4 4-4 4',
  open:'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  copy:'M9 9h10v12H9zM5 15V3h10',
  expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  chevron:'m8 10 4 4 4-4',
};
/** 画像の大きさの選び。既定は2倍 */
const SCALES=[1,2,3];
/** 帯に初めから在るボタン (#3698) */
const BUILTIN=['code','editor','copy','export','expand'];
/** 設定`look`の欄と、帯の内側へ渡す変数 (#3698) */
const LOOK_VARS={font:'--dragon-header-font',fontSize:'--dragon-header-font-size',radius:'--dragon-header-radius',height:'--dragon-header-height'};
const FRAME_VARS={border:'--dragon-frame-border',background:'--dragon-frame-background'};

/**
 * 帯と、帯の内側の見た目。図の字の変数は代わりの字の並びで上書きし、同梱した字を読まない頁に置いても明朝に落とさない (#3695)。
 * 再生の部品は字の変数を自分の`style`属性に書くので、`!important`で上書きする
 */
const FRAME_CSS = `
:host{display:block;min-width:0;color:#294533;font:13px/1.5 system-ui,sans-serif;border:var(--dragon-frame-border,1px solid #cfd9cb);border-radius:12px;background:var(--dragon-frame-background,${PAPER});container-type:inline-size;overflow:visible}
*{box-sizing:border-box}[hidden]{display:none!important}button{font:inherit;cursor:pointer}button:disabled{cursor:wait;opacity:.55}button:focus-visible,summary:focus-visible{outline:3px solid #5b8eaa;outline-offset:2px}svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
.pop{position:relative}[data-dragon-header] .dg-header-actions svg.chevron{width:12px;height:12px}
.menu{position:absolute;right:0;top:calc(100% + 8px);z-index:20;width:220px;margin:0;padding:6px;border:1px solid var(--h-line);border-radius:10px;background:var(--h-bg);color:var(--h-fg);box-shadow:0 12px 35px #0002}
.menu[data-menu=export]{width:300px}
.menu>button{display:block;width:100%;text-align:left;border:0;border-radius:6px;padding:8px 11px;background:transparent;color:var(--h-fg);font-size:12px}.menu>button:hover{background:var(--h-hover)}.menu>button+button{margin-top:2px}
.menu .group{margin:8px 11px 2px;font-size:11px;font-weight:700;color:var(--h-muted);letter-spacing:.04em}.menu .group:first-child{margin-top:4px}
.menu .opts{margin-top:8px;padding:10px 11px 6px;border-top:1px solid var(--h-line);display:grid;gap:8px}
.menu .opt{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;color:var(--h-fg)}
.menu .seg{display:inline-flex;border:1px solid var(--h-line);border-radius:6px;overflow:hidden}
.menu .seg button{padding:4px 10px;border:0;border-radius:0;background:var(--h-bg);font-size:12px;color:var(--h-fg)}.menu .seg button+button{border-left:1px solid var(--h-line)}
.menu .seg button[aria-pressed=true]{background:var(--h-hover);color:var(--h-accent);font-weight:700}
.stage{min-width:0;border-radius:0 0 12px 12px;overflow:hidden}.code{background:#19261f;border-radius:0 0 12px 12px;color:#d9e6d5}.code-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #ffffff19}.code-head button{font:11px ui-monospace,monospace;color:#9eaf99;border:1px solid #50624d;border-radius:5px;padding:5px 9px;background:none}.code-head [aria-pressed=true]{background:#354733;color:#f0f6eb}.copy{margin-left:auto}.code pre{margin:0;padding:18px;max-height:620px;min-height:360px;overflow:auto;white-space:pre;tab-size:2;font:12px/1.9 ui-monospace,SFMono-Regular,Menlo,monospace}.status{padding:9px 14px;margin:0;font-size:12px;color:#596e50}.status:empty{display:none}:host(:fullscreen){height:100vh;overflow:auto;background:${PAPER};border:0;border-radius:0}:host(:fullscreen) [data-dragon-header]{position:sticky;top:0;z-index:30}
:host([data-code-open]){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}:host([data-code-open]) [data-dragon-header],:host([data-code-open]) .status{grid-column:1/-1}:host([data-code-open]) .code{border-left:1px solid #53604e;border-radius:0;min-width:0}:host([data-code-open]) .code pre{min-height:0;max-height:calc(100dvh - 150px);font-size:11px}
@media(max-width:700px){:host([data-code-open]){grid-template-columns:minmax(0,1fr)}}
.dg-player,.dg-player svg.dg{${FONT_STACK_VARS.replace(/;|$/gu,'!important;')}}
`;
/** 拡大の窓の後ろを暗くする見た目。窓は帯を置いた所の根に置く */
const EXPANDED_CSS='.dragon-expanded-dialog::backdrop{background:#1b2c25b3;backdrop-filter:blur(3px)}';

/** 帯の中身。字は帯の言葉の表 `t` から入れ、置く人の値は入れない */
const barHtml = t => `<div class="bar"><div class="actions">`
  + `<button class="code-toggle" data-action="code" type="button" aria-pressed="false">${t.code}</button>`
  + `<a class="editor" data-action="editor" target="_blank" rel="noopener" aria-label="${t.editorLabel}" title="${t.editorLabel}">${t.editor}</a>`
  + `<div class="pop" data-action="copy"><button class="copy-toggle" type="button" aria-expanded="false" aria-haspopup="true">${t.copy}</button>`
  + `<div class="menu" data-menu="copy" hidden><button type="button" data-copy="source">${t.copySource}</button><button type="button" data-copy="image">${t.copyImage}</button><button type="button" data-copy="url">${t.copyUrl}</button></div></div>`
  + `<div class="pop" data-action="export"><button class="export-toggle" type="button" aria-expanded="false" aria-haspopup="true">${t.export}</button>`
  + `<div class="menu" data-menu="export" hidden>`
  + `<p class="group" data-group="images">${t.images}</p><button type="button" data-format="png">PNG</button><button type="button" data-format="svg">SVG</button>`
  + `<p class="group" data-group="motion">${t.motion}</p><button type="button" data-format="html">HTML</button><button type="button" data-format="gif">GIF</button><button type="button" data-format="mp4">MP4</button>`
  + `<p class="group" data-group="notation">${t.notation}</p><button type="button" data-format="dragon">${t.dragon}</button><button type="button" data-format="json">JSON</button>`
  + `<div class="opts"><div class="opt" data-option="scale"><span>${t.scale}</span><div class="seg" role="group" aria-label="${t.scaleLabel}">`
  + SCALES.map(n=>`<button type="button" data-value="${n}" aria-pressed="${n===2}">${t.times(n)}</button>`).join('')
  + `</div></div><div class="opt" data-option="background"><span>${t.background}</span><div class="seg" role="group" aria-label="${t.backgroundLabel}">`
  + `<button type="button" data-value="fill" aria-pressed="true">${t.fill}</button><button type="button" data-value="transparent" aria-pressed="false">${t.transparent}</button></div></div></div>`
  + `</div></div>`
  + `<button class="expand" data-action="expand" type="button" aria-label="${t.expand}" title="${t.expand}"></button>`
  + `</div></div><div class="stage"></div><section class="code" hidden><div class="code-head"><button type="button" data-source="dragon" aria-pressed="true">dragon</button><button type="button" data-source="json" aria-pressed="false">JSON</button><button type="button" class="copy">${t.codeCopy}</button></div><pre tabindex="0"></pre></section><p class="status" role="status" aria-live="polite"></p>`;

/**
 * Shared article chrome; diagram-specific inputs remain in the dragon player.
 * `options.lang` picks the bar language, else the page's `lang`, else English. Styles are adopted into the frame's shadow root;
 * browsers without `adoptedStyleSheets` get `<style>` elements carrying `options.nonce`.
 * `options.look` fits the bar and the frame to the embedder, `options.buttons` drops, reorders and adds bar buttons, and
 * `options.notify` hears exports, editor openings and copies (#3698).
 */
export function createDragonFrame(document, source, diagram, options = {}) {
  const environment = document.defaultView;
  const lang = frameLang(options.lang, document.documentElement);
  const t = FRAME_TEXT[lang];
  const frame = document.createElement('div');
  frame.className = 'dragon-frame';
  const root = frame.attachShadow({mode:'open'});
  root.innerHTML = barHtml(t);
  adoptStyle(root,'dragon-frame-css',FRAME_CSS+HEADER_CSS+SNIPPET_CSS,options.nonce);
  const $ = selector => root.querySelector(selector);
  $('.editor').href=diagramEditorUrl(source);
  const header=createFigureHeader(document,{title:diagram.title,colors:options.headerColors,mark:{href:GALLERY,label:t.mark},label:t.toolbar,styles:false});
  header.actions.append(...$('.actions').childNodes);$('.bar').replaceWith(header.element);
  const icon = (name, target, className = '') => {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    if(className)svg.setAttribute('class',className);
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[name]);svg.append(path);if(className==='chevron')target.append(svg);else target.prepend(svg);
  };
  icon('code',$('.code-toggle'));icon('open',$('.editor'));icon('copy',$('.copy-toggle'));
  icon('download',$('.export-toggle'));icon('chevron',$('.export-toggle'),'chevron');icon('expand',$('.expand'));
  const host = document.createElement('div');host.className='dragon-host';$('.stage').append(host);
  const notify=options.notify;
  const actions=createDiagramActions(document,host,source,diagram,notify);
  const sourceText=actions.sourceText;
  const words=snippetWords(options.words);
  // 帯のボタンは設定`buttons`で帯から外れることがあるので、根から引き直さずに持っておく (#3698)
  const codeToggle=$('.code-toggle'),exportToggle=$('.export-toggle'),expandButton=$('.expand'),editorLink=$('.editor');
  let codeMode='dragon', disposed=false, exporting=false;
  let expandedDialog;
  let closeExpandedDialog;
  const urls=new Set();
  const releases=new Set();
  /** エクスポートの窓で選んだ画像の大きさと地 */
  const picked={scale:2,background:'fill'};
  const status=text=>{if(!disposed)$('.status').textContent=text;};
  /** 帯の窓。窓は1つだけ開く */
  const menus=['copy','export'].map(name=>({name,wrap:$(`[data-action="${name}"]`),toggle:$(`.${name}-toggle`),menu:$(`[data-menu="${name}"]`)}));
  const closeMenus=()=>{for(const {toggle,menu} of menus){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}};
  for(const entry of menus)entry.toggle.addEventListener('click',()=>{
    const show=entry.menu.hidden;closeMenus();
    entry.menu.hidden=!show;entry.toggle.setAttribute('aria-expanded',String(show));
    if(show)entry.menu.querySelector('button')?.focus();
  });
  const activateView=view=>{
    const open=view==='code';frame.toggleAttribute('data-code-open',open);
    codeToggle.setAttribute('aria-pressed',String(open));
    $('.stage').hidden=false;$('.code').hidden=!open;
    if(open)paintSnippet($('.code pre'),sourceText[codeMode],codeMode,words);
    closeMenus();
  };
  codeToggle.addEventListener('click',()=>{
    const open=!frame.hasAttribute('data-code-open');activateView(open?'code':'diagram');
    if(open&&!expandedDialog?.open)expandInDialog();
  });
  for(const button of root.querySelectorAll('[data-source]'))button.addEventListener('click',()=>{
    codeMode=button.dataset.source;
    for(const b of root.querySelectorAll('[data-source]'))b.setAttribute('aria-pressed',String(b===button));
    paintSnippet($('.code pre'),sourceText[codeMode],codeMode,words);
  });
  $('.copy').addEventListener('click',async()=>{
    try{await actions.copy(codeMode==='dragon'?'source':'json');status(t.copiedCode);}
    catch{status(t.copyFailed);}
  });
  /** コピーの窓で押した物をクリップボードに書く。ブラウザが断った時は写せなかったことを知らせる */
  async function copy(kind){
    closeMenus();
    try{
      await actions.copy(kind);
      status(kind==='image'?t.copiedImage:kind==='url'?t.copiedUrl:t.copiedSource);
    }catch{status(t.copyFailed);}
  }
  // エディタのボタンは縮めた URL ができたら`href`に入れる。上限を超える記法とまだ縮めている間は、押すと処理が写してから開く (#3697)
  let editorLong=null;
  void actions.editorLink().then(({url,long})=>{editorLong=long;editorLink.href=long?editorPasteUrl():url;});
  editorLink.addEventListener('click',event=>{
    if(editorLong===false){notify?.('share',{via:'editor'});return;}
    event.preventDefault();
    void actions.openEditor().then(pasted=>{if(pasted)status(t.pasteInEditor);},()=>status(t.copyFailed));
  });
  for(const button of root.querySelectorAll('[data-copy]'))button.addEventListener('click',()=>void copy(button.dataset.copy));
  for(const option of root.querySelectorAll('[data-option]'))for(const button of option.querySelectorAll('[data-value]'))button.addEventListener('click',()=>{
    const value=button.dataset.value;picked[option.dataset.option]=option.dataset.option==='scale'?Number(value):value;
    for(const other of option.querySelectorAll('[data-value]'))other.setAttribute('aria-pressed',String(other===button));
  });
  const outside=event=>{const path=event.composedPath();if(!menus.some(({wrap})=>path.includes(wrap)))closeMenus();};
  document.addEventListener('pointerdown',outside);
  root.addEventListener('keydown',event=>{
    const open=menus.find(({menu})=>!menu.hidden);
    if(event.key==='Escape'&&open){closeMenus();open.toggle.focus();}
  });
  const fullscreen=()=>{
    const full=document.fullscreenElement===frame||Boolean(expandedDialog?.open);
    expandButton.setAttribute('aria-label',full?t.collapse:t.expand);
    expandButton.title=full?t.collapse:t.expand;
  };
  const expandInDialog=()=>{
    const marker=document.createComment('dragon-frame-position');frame.before(marker);
    const dialog=document.createElement('dialog');expandedDialog=dialog;
    dialog.setAttribute('aria-label',diagram.title);
    dialog.className='dragon-expanded-dialog';
    dialog.style.cssText=`position:fixed;inset:0;margin:auto;width:min(1400px,calc(100vw - 28px));max-width:none;max-height:calc(100dvh - 28px);padding:0;border:1px solid #cdd9c7;border-radius:12px;background:${PAPER};`;
    stylesFor(marker,options.nonce).adopt('dragon-expanded-css',EXPANDED_CSS);
    marker.parentNode.append(dialog);dialog.append(frame);
    frame.style.maxHeight='calc(100dvh - 32px)';frame.style.overflow='auto';
    closeExpandedDialog=()=>{
      if(expandedDialog!==dialog)return;
      expandedDialog=undefined;
      if(dialog.open)dialog.close();
      marker.replaceWith(frame);frame.style.removeProperty('max-height');frame.style.removeProperty('overflow');dialog.remove();
      activateView('diagram');fullscreen();if(!disposed)expandButton.focus();
    };
    dialog.addEventListener('close',closeExpandedDialog,{once:true});
    dialog.showModal();fullscreen();expandButton.focus();
  };
  expandButton.addEventListener('click',async()=>{
    try{
      if(expandedDialog?.open){closeExpandedDialog();return;}
      if(document.fullscreenElement===frame){await document.exitFullscreen();return;}
      if(document.fullscreenEnabled&&typeof frame.requestFullscreen==='function'){
        try{await frame.requestFullscreen();return;}catch{/* Embedded browsers can forbid fullscreen. */}
      }
      expandInDialog();
    }catch{closeExpandedDialog?.();status(t.expandFailed);}
  });
  document.addEventListener('fullscreenchange',fullscreen);

  function save(blob,extension){
    if(disposed)return;
    const url=URL.createObjectURL(blob);urls.add(url);
    const a=document.createElement('a');a.href=url;a.download=`dragon-diagram.${extension}`;a.click();
    const release=environment.setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);releases.delete(release);},30000);releases.add(release);
  }
  /** エクスポートの窓で押した形式を保存する。図の動きの形式は作る間の進みを知らせの欄に出す */
  async function exportDiagram(format){
    if(exporting||disposed)return;
    exporting=true;closeMenus();
    const notation=format==='dragon'||format==='json';
    if(!notation){exportToggle.disabled=true;status(t.exporting);}
    try{
      if(!notation){
        activateView('diagram');
        await new Promise(resolve=>environment.requestAnimationFrame(resolve));
        if(disposed)return;
      }
      const blob=await actions.export(format,{scale:picked.scale,background:picked.background,onProgress:fraction=>status(t.progress(Math.round(fraction*100)))});
      save(blob,format);
      status(format==='html'?t.savedHtml:t.saved);
    }catch{if(!disposed)status(t.exportFailed);}
    finally{exporting=false;if(!disposed)exportToggle.disabled=false;}
  }
  for(const button of root.querySelectorAll('[data-format]'))button.addEventListener('click',()=>void exportDiagram(button.dataset.format));
  // 設定`look`を帯と枠の変数に入れる。書かなかった欄は今の見た目のまま (#3698)
  const look=options.look??{};
  if(look.colors)header.setColors(look.colors);
  for(const [key,name] of Object.entries(LOOK_VARS))if(look[key])frame.style.setProperty(name,look[key]);
  for(const [key,name] of Object.entries(FRAME_VARS))if(look.frame?.[key])frame.style.setProperty(name,look.frame[key]);
  if(options.buttons!==undefined)arrangeButtons(document,header.actions,options.buttons,actions);
  return {frame,host,header,lang,actions,setHeaderColors:header.setColors,connect:actions.connect,destroy(){
    if(disposed)return;disposed=true;actions.destroy();
    closeExpandedDialog?.();
    document.removeEventListener('pointerdown',outside);document.removeEventListener('fullscreenchange',fullscreen);
    for(const url of urls)URL.revokeObjectURL(url);urls.clear();
    for(const release of releases)environment.clearTimeout(release);releases.clear();
  }};
}

/**
 * 帯のボタンを設定`buttons`の順に並べ直す (#3698)。初めから在るボタンは名前で、置く側のボタンは`id`と`label`と`onClick`で書く。
 * 書かなかった初めからのボタンは帯から外す。置く側のボタンを押すと`onClick`が図の処理 (`actions`) を受け取る
 */
function arrangeButtons(document,actionsBar,buttons,actions){
  const builtin=new Map([...actionsBar.children].map(el=>[el.dataset.action,el]));
  const seen=new Set();
  const placed=buttons.map(entry=>{
    if(typeof entry==='string'){
      if(!BUILTIN.includes(entry))throw new TypeError(`buttons: ${entry} is not a bar button; use ${BUILTIN.join(', ')} or {id, label, onClick}`);
      if(seen.has(entry))throw new TypeError(`buttons: ${entry} is listed twice`);
      seen.add(entry);return builtin.get(entry);
    }
    const {id,label,icon,onClick}=entry??{};
    if(typeof id!=='string'||!id||typeof label!=='string'||typeof onClick!=='function')throw new TypeError('buttons: write an added button as {id, label, onClick}');
    if(BUILTIN.includes(id)||seen.has(id))throw new TypeError(`buttons: the id ${id} is already used`);
    seen.add(id);
    const button=document.createElement('button');button.type='button';button.className='custom';button.dataset.action=id;button.textContent=label;
    if(icon){
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
      const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icon);svg.append(path);button.prepend(svg);
    }
    button.addEventListener('click',()=>onClick(actions));
    return button;
  });
  actionsBar.replaceChildren(...placed);
}

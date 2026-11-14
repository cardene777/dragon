import { createFigureHeader, HEADER_CSS } from './header.mjs';
import { EDITOR_BASE, editorUrl } from '../editor-url';
import { adoptStyle, stylesFor } from '../adopt-css';
import { paintSnippet, SNIPPET_CSS } from './dragon-snippet.mjs';
import { snapshotDiagram, snapshotText, snapshotCanvas } from './dragon-snapshot.mjs';
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
/** 地を塗る時の色。図の地と同じ */
const PAPER='#fffefa';

/**
 * 帯と、帯の内側の見た目。図の字の変数は代わりの字の並びで上書きし、同梱した字を読まない頁に置いても明朝に落とさない (#3695)。
 * 再生の部品は字の変数を自分の`style`属性に書くので、`!important`で上書きする
 */
const FRAME_CSS = `
:host{display:block;min-width:0;color:#294533;font:13px/1.5 system-ui,sans-serif;border:1px solid #cfd9cb;border-radius:12px;background:${PAPER};container-type:inline-size;overflow:visible}
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
  const editorHref=diagramEditorUrl(source);
  $('.editor').href=editorHref;
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
  const sourceText={dragon:source,json:JSON.stringify(diagram,null,2)};
  let codeMode='dragon', disposed=false, busy=false;
  let expandedDialog;
  let closeExpandedDialog;
  const controller=new environment.AbortController();
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
    $('.code-toggle').setAttribute('aria-pressed',String(open));
    $('.stage').hidden=false;$('.code').hidden=!open;
    if(open)paintSnippet($('.code pre'),sourceText[codeMode],codeMode);
    closeMenus();
  };
  $('.code-toggle').addEventListener('click',()=>{
    const open=!frame.hasAttribute('data-code-open');activateView(open?'code':'diagram');
    if(open&&!expandedDialog?.open)expandInDialog();
  });
  for(const button of root.querySelectorAll('[data-source]'))button.addEventListener('click',()=>{
    codeMode=button.dataset.source;
    for(const b of root.querySelectorAll('[data-source]'))b.setAttribute('aria-pressed',String(b===button));
    paintSnippet($('.code pre'),sourceText[codeMode],codeMode);
  });
  $('.copy').addEventListener('click',async()=>{
    try{await environment.navigator.clipboard.writeText(sourceText[codeMode]);status(t.copiedCode);}
    catch{status(t.copyFailed);}
  });
  /** 図を`scale`倍の画素のPNGにする。`transparent`の時は地を塗らない */
  const png=async(scale,transparent)=>{
    const canvas=await snapshotCanvas(snapshotDiagram(host,{transparent}),0,scale,transparent?null:PAPER);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('PNGを作成できませんでした');
    return blob;
  };
  /** コピーの窓で押した物をクリップボードに書く。ブラウザが断った時は写せなかったことを知らせる */
  async function copy(kind){
    closeMenus();
    try{
      const clipboard=environment.navigator.clipboard;
      if(kind==='image'){
        await clipboard.write([new environment.ClipboardItem({'image/png':png(2,false)})]);
        status(t.copiedImage);
      }else{
        await clipboard.writeText(kind==='url'?editorHref:source);
        status(kind==='url'?t.copiedUrl:t.copiedSource);
      }
    }catch{status(t.copyFailed);}
  }
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
    $('.expand').setAttribute('aria-label',full?t.collapse:t.expand);
    $('.expand').title=full?t.collapse:t.expand;
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
      activateView('diagram');fullscreen();if(!disposed)$('.expand').focus();
    };
    dialog.addEventListener('close',closeExpandedDialog,{once:true});
    dialog.showModal();fullscreen();$('.expand').focus();
  };
  $('.expand').addEventListener('click',async()=>{
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
  async function exportDiagram(format){
    if(busy||disposed)return;
    closeMenus();
    if(format==='dragon'||format==='json'){
      save(new environment.Blob([sourceText[format]],{type:format==='json'?'application/json':'text/plain;charset=utf-8'}),format);
      status(t.saved);
      return;
    }
    busy=true;$('.export-toggle').disabled=true;status(t.exporting);
    try{
      activateView('diagram');
      await new Promise(resolve=>environment.requestAnimationFrame(resolve));
      if(disposed)return;
      if(format==='html'){
        const capture=await import('./capture.js');
        const html=await capture.captureHtml(source);
        save(new environment.Blob([html],{type:'text/html;charset=utf-8'}),'html');
        status(t.savedHtml);
        return;
      }
      const transparent=picked.background==='transparent';
      if(format==='svg')save(new environment.Blob([snapshotText(snapshotDiagram(host,{transparent}))],{type:'image/svg+xml'}),'svg');
      else if(format==='png')save(await png(picked.scale,transparent),'png');
      else{
        const current=snapshotDiagram(host);
        const capture=await import('./capture.js');
        const frames=history.length?[...history]:[{shot:current,time:0}];
        frames.push({shot:current,time:(frames.at(-1)?.time??0)+900});
        let total=0;
        const clips=frames.map((frame,i)=>{
          const duration=i<frames.length-1?Math.min(1.1,Math.max(.15,(frames[i+1].time-frame.time)/1000)):.8;
          const clip={...frame,start:total,end:total+duration};total+=duration;return clip;
        });
        const width=Math.ceil(Math.max(...clips.map(c=>c.shot.width))/2)*2,height=Math.ceil(Math.max(...clips.map(c=>c.shot.height))/2)*2;
        const blob=await capture.captureFrames({width,height,total,format,signal:controller.signal,
          onProgress:fraction=>status(t.progress(Math.round(fraction*100))),
          draw:async seconds=>{
            const clip=clips.find(c=>seconds<c.end)??clips.at(-1);
            const image=await snapshotCanvas(clip.shot,seconds-clip.start);
            const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
            const context=canvas.getContext('2d');context.fillStyle=PAPER;context.fillRect(0,0,width,height);context.drawImage(image,0,0);
            return canvas;
          }});
        save(blob,format);
      }
      status(t.saved);
    }catch{if(!disposed)status(t.exportFailed);}
    finally{busy=false;if(!disposed)$('.export-toggle').disabled=false;}
  }
  for(const button of root.querySelectorAll('[data-format]'))button.addEventListener('click',()=>void exportDiagram(button.dataset.format));
  const history=[];
  let observer,queued=false;
  function record(){
    if(disposed||busy||!host.clientWidth)return;
    try{
      const shot=snapshotDiagram(host,{animate:true});
      if(history.length&&history.at(-1).shot.width!==shot.width)history.length=0;
      const time=environment.performance.now();
      if(history.length&&time-history.at(-1).time<150)history.pop();
      history.push({shot,time});if(history.length>12)history.shift();
    }catch{/* A hidden or detached diagram has no capture area. */}
  }
  return {frame,host,header,lang,setHeaderColors:header.setColors,connect(){
    record();observer=new environment.MutationObserver(()=>{
      if(queued||disposed||busy)return;queued=true;
      environment.requestAnimationFrame(()=>{queued=false;record();});
    });
    observer.observe(host.shadowRoot??host,{subtree:true,childList:true,characterData:true,attributes:true});
  },destroy(){
    if(disposed)return;disposed=true;controller.abort();
    observer?.disconnect();history.length=0;
    closeExpandedDialog?.();
    document.removeEventListener('pointerdown',outside);document.removeEventListener('fullscreenchange',fullscreen);
    for(const url of urls)URL.revokeObjectURL(url);urls.clear();
    for(const release of releases)environment.clearTimeout(release);releases.clear();
  }};
}

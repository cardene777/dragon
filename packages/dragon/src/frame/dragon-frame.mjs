import { createFigureHeader } from './header.mjs';
import { editorUrl } from '../editor-url';
import { paintSnippet, SNIPPET_CSS } from './dragon-snippet.mjs';
import { snapshotDiagram, snapshotText, snapshotCanvas } from './dragon-snapshot.mjs';

export function diagramEditorUrl(source) {
  return editorUrl(source);
}
const icons = {
  expand:'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  chevron:'m8 10 4 4 4-4',
};

/** Shared article chrome; diagram-specific inputs remain in the dragon player. */
export function createDragonFrame(document, source, diagram, options = {}) {
  const environment = document.defaultView;
  const frame = document.createElement('div');
  frame.className = 'dragon-frame';
  const root = frame.attachShadow({mode:'open'});
  root.innerHTML = `<style>${SNIPPET_CSS}
    :host{display:block;min-width:0;color:#294533;font:13px/1.5 system-ui,sans-serif;border:1px solid #cfd9cb;border-radius:12px;background:#fffefa;container-type:inline-size;overflow:visible}
    *{box-sizing:border-box}[hidden]{display:none!important}button{font:inherit;cursor:pointer}button:disabled{cursor:wait;opacity:.55}button:focus-visible,summary:focus-visible{outline:3px solid #5b8eaa;outline-offset:2px}svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
    .actions{display:flex;align-items:center;flex-wrap:wrap;gap:4px}.tool{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:5px 9px;border:1px solid transparent;border-radius:5px;background:none;color:inherit;font:inherit;text-decoration:none;cursor:pointer}.tool:hover{background:var(--h-hover);color:var(--h-accent)}.export{position:relative}.chevron{width:12px;height:12px}
    .menu{position:absolute;right:0;top:calc(100% + 8px);z-index:20;width:260px;margin:0;padding:6px;border:1px solid #cdd9c7;border-radius:10px;background:var(--h-bg);box-shadow:0 12px 35px #0002}.menu button{display:flex;flex-direction:column;gap:2px;text-align:left;width:100%;border:0;border-radius:6px;padding:9px 11px;background:transparent;color:var(--h-fg)}.menu button:hover{background:var(--h-hover)}.menu strong{font-size:12px;font-weight:650}.menu small{font-size:11px;color:var(--h-muted)}.menu button+button{margin-top:2px}
    .stage{min-width:0;border-radius:0 0 12px 12px;overflow:hidden}.code{background:#19261f;border-radius:0 0 12px 12px;color:#d9e6d5}.code-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #ffffff19}.code-head button{font:11px ui-monospace,monospace;color:#9eaf99;border:1px solid #50624d;border-radius:5px;padding:5px 9px;background:none}.code-head [aria-pressed=true]{background:#354733;color:#f0f6eb}.copy{margin-left:auto}.code pre{margin:0;padding:18px;max-height:620px;min-height:360px;overflow:auto;white-space:pre;tab-size:2;font:12px/1.9 ui-monospace,SFMono-Regular,Menlo,monospace}.status{padding:9px 14px;margin:0;font-size:12px;color:#596e50}.status:empty{display:none}:host(:fullscreen){height:100vh;overflow:auto;background:#fffefa;border:0;border-radius:0}:host(:fullscreen) [data-dragon-header]{position:sticky;top:0;z-index:30}

    :host([data-code-open]){display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}:host([data-code-open]) [data-dragon-header],:host([data-code-open]) .status{grid-column:1/-1}:host([data-code-open]) .code{border-left:1px solid #53604e;border-radius:0;min-width:0}:host([data-code-open]) .code pre{min-height:0;max-height:calc(100dvh - 150px);font-size:11px}
    @media(max-width:700px){:host([data-code-open]){grid-template-columns:minmax(0,1fr)}.expand-label{display:none}}
  </style><div class="bar"><div class="actions"><button class="tool code-toggle" type="button" aria-pressed="false">コード</button><a class="tool editor" target="_blank" rel="noopener" aria-label="dragonエディタで開く">dragonで開く</a><button class="tool expand" type="button" aria-label="図を拡大" title="図を拡大"><span class="expand-label">拡大</span></button><div class="export"><button class="tool export-toggle" type="button" aria-expanded="false" aria-haspopup="true">書き出す</button><div class="menu" hidden><button type="button" data-format="png"><strong>PNG</strong><small>操作図全体を画像で保存</small></button><button type="button" data-format="svg"><strong>SVG</strong><small>操作図全体を保存</small></button><button type="button" data-format="html"><strong>HTML</strong><small>単独ファイルで操作・初期条件から開始</small></button><button type="button" data-format="gif"><strong>GIF</strong><small>直近の操作を全体で再生</small></button><button type="button" data-format="mp4"><strong>MP4</strong><small>直近の操作を全体で再生</small></button></div></div></div></div><div class="stage" ></div><section class="code"  hidden><div class="code-head"><button type="button" data-source="dragon" aria-pressed="true">dragon</button><button type="button" data-source="json" aria-pressed="false">JSON</button><button type="button" class="copy">コピー</button></div><pre tabindex="0"></pre></section><p class="status" role="status" aria-live="polite"></p>`;
  const $ = selector => root.querySelector(selector);
  $('.editor').href=diagramEditorUrl(source);
  const header=createFigureHeader(document,{title:diagram.title,colors:options.headerColors});
  const expandButton=$('.expand');
  header.actions.append(...$('.actions').childNodes);header.actions.append(expandButton);$('.bar').replaceWith(header.element);
  const icon = (name, target, className = '') => {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    if(className)svg.setAttribute('class',className);
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[name]);svg.append(path);if(className==='chevron')target.append(svg);else target.prepend(svg);
  };
  icon('expand',$('.expand'));icon('download',$('.export-toggle'));icon('chevron',$('.export-toggle'),'chevron');
  const host = document.createElement('div');host.className='dragon-host';$('.stage').append(host);
  const sourceText={dragon:source,json:JSON.stringify(diagram,null,2)};
  let codeMode='dragon', disposed=false, busy=false;
  let expandedDialog;
  let closeExpandedDialog;
  const controller=new environment.AbortController();
  const urls=new Set();
  const releases=new Set();
  const status=text=>{if(!disposed)$('.status').textContent=text;};
  const closeMenu=()=>{ $('.menu').hidden=true;$('.export-toggle').setAttribute('aria-expanded','false'); };
  const activateView=view=>{
    const open=view==='code';frame.toggleAttribute('data-code-open',open);
    $('.code-toggle').setAttribute('aria-pressed',String(open));
    $('.stage').hidden=false;$('.code').hidden=!open;
    if(open)paintSnippet($('.code pre'),sourceText[codeMode],codeMode);
    closeMenu();
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
    try{await environment.navigator.clipboard.writeText(sourceText[codeMode]);status('コードをコピーしました。');}
    catch{status('コピーできませんでした。コードを選択してコピーできます。');}
  });
  $('.export-toggle').addEventListener('click',()=>{
    const show=$('.menu').hidden;$('.menu').hidden=!show;$('.export-toggle').setAttribute('aria-expanded',String(show));
    if(show)$('.menu button').focus();
  });
  const outside=event=>{if(!event.composedPath().includes(frame))closeMenu();};
  document.addEventListener('pointerdown',outside);
  root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('.menu').hidden){closeMenu();$('.export-toggle').focus();}});
  const fullscreen=()=>{
    const full=document.fullscreenElement===frame||Boolean(expandedDialog?.open);
    $('.expand').setAttribute('aria-label',full?'拡大表示を閉じる':'図を拡大');
    $('.expand').title=full?'拡大表示を閉じる':'図を拡大';
    $('.expand-label').textContent=full?'戻す':'拡大';
  };
  const expandInDialog=()=>{
    const marker=document.createComment('dragon-frame-position');frame.before(marker);
    const dialog=document.createElement('dialog');expandedDialog=dialog;
    dialog.setAttribute('aria-label',diagram.title);
    dialog.className='dragon-expanded-dialog';
    dialog.style.cssText='position:fixed;inset:0;margin:auto;width:min(1400px,calc(100vw - 28px));max-width:none;max-height:calc(100dvh - 28px);padding:0;border:1px solid #cdd9c7;border-radius:12px;background:#fffefa;';
    const backdrop=document.createElement('style');backdrop.textContent='.dragon-expanded-dialog::backdrop{background:#1b2c25b3;backdrop-filter:blur(3px)}';
    marker.parentNode.append(dialog);dialog.append(backdrop,frame);
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
    }catch{closeExpandedDialog?.();status('この画面では拡大表示を開始できませんでした。');}
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
    busy=true;closeMenu();$('.export-toggle').disabled=true;status('書き出しています。');
    try{
      activateView('diagram');
      await new Promise(resolve=>environment.requestAnimationFrame(resolve));
      if(disposed)return;
      if(format==='html'){
        const capture=await import('./capture.js');
        const html=await capture.captureHtml(source);
        save(new environment.Blob([html],{type:'text/html;charset=utf-8'}),'html');
        status('操作できるHTMLを書き出しました。開くと初期条件から始まります。');
        return;
      }
      const current=snapshotDiagram(host);
      if(format==='svg')save(new environment.Blob([snapshotText(current)],{type:'image/svg+xml'}),'svg');
      else if(format==='png'){
        const canvas=await snapshotCanvas(current,0,2);
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!blob)throw new Error('PNGを作成できませんでした');save(blob,'png');
      }else{
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
          onProgress:fraction=>status(`書き出しています。${Math.round(fraction*100)}%`),
          draw:async seconds=>{
            const clip=clips.find(c=>seconds<c.end)??clips.at(-1);
            const image=await snapshotCanvas(clip.shot,seconds-clip.start);
            const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
            const context=canvas.getContext('2d');context.fillStyle='#fffefa';context.fillRect(0,0,width,height);context.drawImage(image,0,0);
            return canvas;
          }});
        save(blob,format);
      }
      status('ファイルを書き出しました。');
    }catch(error){if(!disposed)status(`書き出せませんでした。${error instanceof Error?error.message:String(error)}`);}
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
  return {frame,host,header,setHeaderColors:header.setColors,connect(){
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

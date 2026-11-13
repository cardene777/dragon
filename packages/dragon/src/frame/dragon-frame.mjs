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
let sequence = 0;

/** Shared article chrome; diagram-specific inputs remain in the dragon player. */
export function createDragonFrame(document, source, diagram) {
  const environment = document.defaultView;
  const frame = document.createElement('div');
  frame.className = 'dragon-frame';
  const root = frame.attachShadow({mode:'open'});
  root.innerHTML = `<style>${SNIPPET_CSS}
    :host{display:block;min-width:0;color:#294533;font:13px/1.5 system-ui,sans-serif;border:1px solid #cfd9cb;border-radius:12px;background:#fffefa;container-type:inline-size;overflow:visible}
    *{box-sizing:border-box}[hidden]{display:none!important}button{font:inherit;cursor:pointer}button:disabled{cursor:wait;opacity:.55}button:focus-visible,summary:focus-visible{outline:3px solid #5b8eaa;outline-offset:2px}svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:none}
    .bar{position:relative;display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:9px 12px;background:#f4f6ef;border-radius:12px 12px 0 0;border-bottom:1px solid #dce3d6}
    .identity{display:flex;align-items:center;gap:8px;margin-right:3px}.brand{font:650 12px/1.5 ui-monospace,monospace;letter-spacing:.02em}.kind{font:10px/1.5 ui-monospace,monospace;color:#76836f;border:1px solid #d6dfd0;border-radius:4px;padding:1px 5px}
    .tabs{display:flex;gap:2px;border:1px solid #d2ddcd;border-radius:7px;padding:2px;background:#e9eee3}.tabs button{border:0;background:none;padding:4px 13px;color:#788471;border-radius:4px;font-size:12px}.tabs [aria-selected=true]{background:#fffefa;color:#31563a;box-shadow:0 1px 2px #29453317;font-weight:650}
    .actions{display:flex;align-items:center;gap:5px;margin-left:auto}.tool{display:flex;align-items:center;justify-content:center;gap:6px;border:1px solid transparent;border-radius:6px;padding:6px 8px;background:transparent;color:#52664c;font-size:12px}.tool{text-decoration:none}.tool:hover{background:#e5ecde;border-color:#d0dcc8}.export{position:relative}.export>button{border-color:#ccd8c5;background:#fffefa}.chevron{width:13px;height:13px}
    .menu{position:absolute;right:0;top:calc(100% + 8px);z-index:20;width:260px;margin:0;padding:6px;border:1px solid #cdd9c7;border-radius:10px;background:#fffefa;box-shadow:0 12px 35px #29453324}.menu button{display:flex;flex-direction:column;gap:2px;text-align:left;width:100%;border:0;border-radius:6px;padding:9px 11px;background:transparent;color:#294533}.menu button:hover{background:#edf3e6}.menu strong{font-size:12px;font-weight:650}.menu small{font-size:11px;color:#7a8673}.menu button+button{margin-top:2px}
    .stage{min-width:0;border-radius:0 0 12px 12px;overflow:hidden}.code{background:#19261f;border-radius:0 0 12px 12px;color:#d9e6d5}.code-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #ffffff19}.code-head button{font:11px ui-monospace,monospace;color:#9eaf99;border:1px solid #50624d;border-radius:5px;padding:5px 9px;background:none}.code-head [aria-pressed=true]{background:#354733;color:#f0f6eb}.copy{margin-left:auto}.code pre{margin:0;padding:18px;max-height:620px;min-height:360px;overflow:auto;white-space:pre;tab-size:2;font:12px/1.9 ui-monospace,SFMono-Regular,Menlo,monospace}.status{padding:9px 14px;margin:0;font-size:12px;color:#596e50}.status:empty{display:none}:host(:fullscreen){height:100vh;overflow:auto;background:#fffefa;border:0;border-radius:0}:host(:fullscreen) .bar{position:sticky;top:0;z-index:30}
    @container(max-width:450px){.bar{padding:8px;gap:6px}.kind{display:none}.brand{font-size:11px}.tabs button{padding:4px 9px}.tool{padding:6px}.expand-label{display:none}.menu{width:245px}}
  </style><div class="bar" role="toolbar" aria-label="図の操作"><div class="identity"><span class="brand">dragon</span><span class="kind"></span></div><div class="tabs" role="tablist" aria-label="図とコード"><button type="button" role="tab" aria-selected="true" data-view="diagram">図</button><button type="button" role="tab" aria-selected="false" data-view="code">コード</button></div><div class="actions"><a class="tool editor" target="_blank" rel="noopener" aria-label="dragonエディタで開く">エディタで開く</a><button class="tool expand" type="button" aria-label="図を拡大" title="図を拡大"><span class="expand-label">拡大</span></button><div class="export"><button class="tool export-toggle" type="button" aria-expanded="false" aria-haspopup="true">エクスポート</button><div class="menu" hidden><button type="button" data-format="png"><strong>PNG</strong><small>操作図全体を画像で保存</small></button><button type="button" data-format="svg"><strong>SVG</strong><small>操作図全体を保存</small></button><button type="button" data-format="html"><strong>HTML</strong><small>単独ファイルで操作・初期条件から開始</small></button><button type="button" data-format="gif"><strong>GIF</strong><small>直近の操作を全体で再生</small></button><button type="button" data-format="mp4"><strong>MP4</strong><small>直近の操作を全体で再生</small></button></div></div></div></div><div class="stage" role="tabpanel"></div><section class="code" role="tabpanel" hidden><div class="code-head"><button type="button" data-source="dragon" aria-pressed="true">dragon</button><button type="button" data-source="json" aria-pressed="false">JSON</button><button type="button" class="copy">コピー</button></div><pre tabindex="0"></pre></section><p class="status" role="status" aria-live="polite"></p>`;
  const $ = selector => root.querySelector(selector);
  $('.editor').href=diagramEditorUrl(source);
  $('.kind').textContent = diagram.kind;
  const icon = (name, target, className = '') => {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    if(className)svg.setAttribute('class',className);
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[name]);svg.append(path);if(className==='chevron')target.append(svg);else target.prepend(svg);
  };
  icon('expand',$('.expand'));icon('download',$('.export-toggle'));icon('chevron',$('.export-toggle'),'chevron');
  const id=`dragon-frame-${++sequence}`;
  $('.stage').id=id+'-diagram';$('.code').id=id+'-code';
  for(const button of root.querySelectorAll('[data-view]')){
    const view=button.dataset.view;
    button.id=id+'-tab-'+view;
    button.setAttribute('aria-controls',id+'-'+view);
    button.tabIndex=view==='diagram'?0:-1;
    $(view==='diagram'?'.stage':'.code').setAttribute('aria-labelledby',button.id);
  }
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
  const activateView=(view,focus=false)=>{
    for(const button of root.querySelectorAll('[data-view]')){
      const selected=button.dataset.view===view;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
      if(focus&&selected)button.focus();
    }
    $('.stage').hidden=view!=='diagram';$('.code').hidden=view!=='code';
    paintSnippet($('.code pre'),sourceText[codeMode],codeMode);
    closeMenu();
  };
  for(const button of root.querySelectorAll('[data-view]')){
    button.addEventListener('click',()=>activateView(button.dataset.view));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();activateView(event.key==='Home'?'diagram':event.key==='End'?'code':button.dataset.view==='diagram'?'code':'diagram',true);
    });
  }
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
    dialog.style.cssText='width:min(1400px,calc(100vw - 28px));max-width:none;max-height:calc(100dvh - 28px);padding:0;border:1px solid #cdd9c7;border-radius:12px;background:#fffefa;';
    const backdrop=document.createElement('style');backdrop.textContent='.dragon-expanded-dialog::backdrop{background:#1b2c25b3;backdrop-filter:blur(3px)}';
    document.body.append(dialog);dialog.append(backdrop,frame);
    frame.style.maxHeight='calc(100dvh - 32px)';frame.style.overflow='auto';
    closeExpandedDialog=()=>{
      if(expandedDialog!==dialog)return;
      expandedDialog=undefined;
      if(dialog.open)dialog.close();
      marker.replaceWith(frame);frame.style.removeProperty('max-height');frame.style.removeProperty('overflow');dialog.remove();
      fullscreen();if(!disposed)$('.expand').focus();
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
  return {frame,host,connect(){
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

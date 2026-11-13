const SVG='http://www.w3.org/2000/svg';
const HTML='http://www.w3.org/1999/xhtml';
const PROPERTIES=['display','position','inset','top','right','bottom','left','z-index','box-sizing','width','height','min-width','min-height','max-width','max-height','margin','padding','border','border-radius','border-top','border-right','border-bottom','border-left','box-shadow','background','color','opacity','overflow','overflow-x','overflow-y','font','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration','text-transform','white-space','word-break','overflow-wrap','vertical-align','flex','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis','align-items','align-self','justify-content','gap','row-gap','column-gap','grid-template-columns','grid-template-rows','grid-column','grid-row','grid-auto-flow','transform','transform-origin','isolation','object-fit','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-opacity','fill-opacity','filter','visibility','appearance','accent-color','clip-path'];

/** Capture the complete rendered stage, including its shadow DOM and input values. */
export function snapshotDiagram(host, {animate=false}={}) {
  const document=host.ownerDocument,win=document.defaultView;
  const rect=host.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)throw new Error('図を表示してから書き出してください');
  const copyNode=node=>{
    if(node.nodeType===3)return document.createTextNode(node.textContent??'');
    if(node.nodeType!==1)return null;
    if(['SCRIPT','LINK'].includes(node.tagName))return null;
    const inSvg=node.namespaceURI===SVG;
    if(node.tagName==='STYLE'&&!inSvg)return null;
    const copy=document.createElementNS(inSvg?SVG:HTML,node.localName);
    for(const attr of node.attributes){if(!/^on/i.test(attr.name)&&attr.name!=='style')copy.setAttribute(attr.name,attr.value);}
    const style=win.getComputedStyle(node);
    if(style.display==='none')return null;
    for(const property of PROPERTIES){const value=style.getPropertyValue(property);if(value)copy.style.setProperty(property,value);}
    const parent=node.parentElement??node.getRootNode()?.host;
    if(parent&&!inSvg&&['block','flex','grid'].includes(style.display)&&['static','relative'].includes(style.position)){
      const parentStyle=win.getComputedStyle(parent);
      const shifted=style.position==='relative'&&['left','right'].some(key=>style[key]!=='auto'&&Number.parseFloat(style[key])!==0&&Number.isFinite(Number.parseFloat(style[key])));
      if(parentStyle.display==='block'&&style.transform==='none'&&!shifted&&(!parentStyle.transform||parentStyle.transform==='none')){
        const box=node.getBoundingClientRect(),parentBox=parent.getBoundingClientRect();
        const left=box.left-parentBox.left-parseFloat(parentStyle.borderLeftWidth||'0')-parseFloat(parentStyle.paddingLeft||'0');
        const right=parentBox.right-box.right-parseFloat(parentStyle.borderRightWidth||'0')-parseFloat(parentStyle.paddingRight||'0');
        // Resolve centered block margins from geometry; a copied `auto`/zero
        // shorthand otherwise aligns the same measured box against the left edge.
        if(Number.isFinite(left)&&Number.isFinite(right)&&left>=0&&right>=0){
          copy.style.setProperty('margin-left',`${left}px`);copy.style.setProperty('margin-right',`${right}px`);
        }
      }
    }
    if(inSvg){
      // Preserve dragon keyframes and their inherited clock for video replay.
      for(let i=0;i<node.style.length;i++){const key=node.style.item(i);if(key.startsWith('--')&&!['--at','--play'].includes(key))copy.style.setProperty(key,node.style.getPropertyValue(key));}
      if(node.classList.contains('dg-a')){
        copy.style.setProperty('animation','none');
        if(animate&&node.closest('svg.dg')?.style.getPropertyValue('--play')==='running'){
          copy.style.removeProperty('transform');copy.style.removeProperty('opacity');copy.style.removeProperty('visibility');
          copy.style.setProperty('animation-name',node.style.animationName);
          copy.style.setProperty('animation-duration','var(--T)');copy.style.setProperty('animation-delay','calc(var(--at,0) * -1s)');
          copy.style.setProperty('animation-play-state','paused');copy.style.setProperty('animation-timing-function','linear');copy.style.setProperty('animation-fill-mode','both');copy.style.setProperty('animation-iteration-count','1');
        }
      }
    }
    if(node.localName==='input'){
      copy.setAttribute('value',node.value);if(node.checked)copy.setAttribute('checked','');else copy.removeAttribute('checked');
      if(node.type==='range')copy.style.setProperty('accent-color',style.getPropertyValue('--green')||'#729a69');
    }
    if(node.localName==='textarea')copy.textContent=node.value;
    else for(const child of (node.shadowRoot??node).childNodes){const next=copyNode(child);if(next)copy.append(next);}
    if(!inSvg)for(const position of ['::before','::after']){
      const pseudo=win.getComputedStyle(node,position),content=pseudo.content;
      if(!content||content==='none'||content==='normal'||pseudo.display==='none')continue;
      const span=document.createElementNS(HTML,'span');
      for(const property of PROPERTIES){const value=pseudo.getPropertyValue(property);if(value)span.style.setProperty(property,value);}
      span.textContent=/^["']/.test(content)?content.slice(1,-1):content;
      if(position==='::before')copy.prepend(span);else copy.append(span);
    }
    return copy;
  };
  const svg=document.createElementNS(SVG,'svg');const width=Math.ceil(rect.width),height=Math.ceil(rect.height);
  svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  svg.style.setProperty('--bg','#fffefa');svg.style.setProperty('--at','0');
  const foreign=document.createElementNS(SVG,'foreignObject');foreign.setAttribute('width','100%');foreign.setAttribute('height','100%');
  const clone=copyNode(host);clone.style.width=`${width}px`;clone.style.margin='0';clone.style.position='relative';clone.style.transform='none';
  foreign.append(clone);svg.append(foreign);
  return {width,height,svg};
}

export function snapshotText(snapshot,at=0) {
  const copy=snapshot.svg.cloneNode(true);copy.style.setProperty('--at',String(at));
  return new snapshot.svg.ownerDocument.defaultView.XMLSerializer().serializeToString(copy);
}

export async function snapshotCanvas(snapshot,at=0,scale=1) {
  const document=snapshot.svg.ownerDocument,win=document.defaultView;
  const image=new win.Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(snapshotText(snapshot,at))}`;
  await image.decode();
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(snapshot.width*scale);canvas.height=Math.ceil(snapshot.height*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('画像を描画できませんでした');
  ctx.fillStyle='#fffefa';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
  return canvas;
}

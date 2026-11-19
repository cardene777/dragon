function a(r,n){let t=2166136261;for(const o of`${n}
${r.trimEnd()}`)t^=o.codePointAt(0)??0,t=Math.imul(t,16777619);return(t>>>0).toString(16).padStart(8,"0")}async function i(r,n){try{const t=await fetch(`/dragon/pipe-layouts/${a(r,n)}.json`),o=t.ok?await t.json():void 0;return Array.isArray(o)?o:void 0}catch{return}}export{i as pipeLayoutsFor};

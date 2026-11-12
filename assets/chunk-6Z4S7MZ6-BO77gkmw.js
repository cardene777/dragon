function t(s,e){return{...e,carriers:e.carriers.map(r=>{const a=e.steps[r.step];return{...r,start:r.depart,end:Math.max(r.arrive,a?.end??r.end)}})}}export{t as s};

/** Native purchase kind. Ports, edges and carriers use the shared SVG pipeline. */
import { layoutCheckout, type PurchaseLayout } from "./checkout/layout";
import type { KindParts } from "./parts";
import { isCheckoutNotation, parseCheckout } from "../checkout/read";
import { definitionOf, purchaseNotation, validatePurchase, modelOf } from "../checkout/definition";
import { mountCheckoutRuntime } from "../checkout/runtime.mjs";
import { fromModel } from "../model";
import { markParsed } from "../parsed";
import { renderDiagram } from "../render/draw";
import { card } from "../blocks/box/draw";
import type { Player } from "../player";

const mounted = new WeakMap<HTMLElement, Player>();
export const parts: KindParts<PurchaseLayout> = {
  ownBoxes: true,
  validate: validatePurchase,
  times(_diagram, timeline) {
    if (timeline.edges.length !== 1) return timeline;
    return {...timeline,total:4,last:3.8,steps:[{start:0,end:3.2}],
      edges:timeline.edges.map(e=>({...e,start:.1,drawn:3,end:3.2})),
      carriers:timeline.carriers.map(c=>({...c,start:0,depart:.1,arrive:3,end:3.6})),stills:[3.3]};
  },
  notation: {
    matches: isCheckoutNotation,
    print: diagram => purchaseNotation(definitionOf(diagram)),
    read(text) {
      const read = parseCheckout(text);
      return read.ok ? { ok:true, diagram:markParsed(fromModel(modelOf(read.definition), 2)) } : read;
    },
  },
  layout: layoutCheckout,
  draw(layout, _diagram, ctx, subs) {
    const compact = layout.edges.some(e=>Math.abs(e.points[1]![0]-e.points[0]![0])<28);
    return { css: `.dg{background:transparent}.dg-bg{display:none}.dg-env{transform:scale(.52);fill:#fffefa;stroke:#518563;stroke-width:2.2;filter:none}.dg-env-in{transform:scale(.52);fill:none;stroke:#518563;stroke-width:1.5}.dg-e{stroke-dasharray:none;stroke:#c2d1bc;stroke-width:1.4}.dg-e-on,.dg-eh-on{stroke-width:1.8}${compact?'.dg-env{x:-1.5px;y:-1.5px;width:3px;height:3px;rx:1.5px;transform:none;fill:#518563;stroke:#fffefa;stroke-width:.6}.dg-env-in{display:none}':''}`,
      top: layout.overlay ? layout.edges.map(e=>{
        const time=ctx.t.carriers.find(c=>c.step===e.step&&c.event===e.event);
        if(!time)return '';
        const [x,y]=e.points.at(-1)!;
        const animation=ctx.m.kf([[0,{opacity:0}],[time.arrive,{opacity:0,r:'2px'}],[time.arrive+.08,{opacity:.7,r:'3px'}],[time.end,{opacity:0,r:'7px'}],[ctx.m.total,{opacity:0}]]);
        return `<circle class="dg-a" cx="${x}" cy="${y}" r="2" fill="none" stroke="#518563" stroke-width="1.3" style="${animation}"/>`;
      }).join('') : '',
      node: layout.overlay ? "" : layout.boxes.map(b => card(b,ctx,[],subs.get(b.id) ?? [])).join("") };
  },
  mountInput(host, diagram, options) {
    mounted.get(host)?.destroy();
    const definition = definitionOf(diagram);
    const input = mountCheckoutRuntime(host, definition, { ...options, drawFlow(anchors: Record<string,{x:number;y:number;w:number;h:number}>, route?:{from:string;to:string}) {
      const source = structuredClone(diagram);
      if (route) source.steps = [{title:"送受信",body:"購入条件と注文の情報を伝える",events:[{type:"edge",from:route.from,to:route.to,carry:{kind:"envelope"}}]}];
      const rendered = renderDiagram(source,{...options, anchors, overlay:true, width:host.clientWidth});
      return { svg:rendered.svg, timeline:rendered.timeline };
    } });
    const player: Player = {
      get step(){return input.getState().eventCount;}, get playing(){return false;}, diagram,
      dispatch:event=>input.dispatch(event), getState:()=>input.getState(),
      next(){},prev(){},play(){},pause(){},goTo(){},setSpeed(){},mark(){},destroy:()=>input.destroy(),
    };
    mounted.set(host,player);
    return player;
  },
};

import type { DiagramModel } from "../../schema";
import type { Layout, SceneBox } from "../../layout/scene";
import type { KindOptions } from "../parts";
import type { NotationLang } from "../../words";
export type PurchaseLayout = Layout & { overlay?: boolean };
export const CHECKOUT_MARKER = "data-checkout-flow";
export function layoutCheckout(diagram: DiagramModel, _lang: NotationLang, options: KindOptions): PurchaseLayout {
    const width = options.anchors ? Math.max(...Object.values(options.anchors).map(r=>r.x+r.w)) : Math.max(880, options.width ?? 960);
    const gap = options.anchors ? (width < 600 ? 18 : 36) : 64;
    const w = Math.min(160, (width - gap * 3) / 4);
    const boxes: SceneBox[] = diagram.boxes.map((b,i) => {
      const r = options.anchors?.[b.id] ?? { x: (width - 4*w - 3*gap)/2 + i*(w+gap), y:12, w, h:108 };
      return { ...b,...r, color:"green", cx:r.x+r.w/2, cy:r.y+r.h/2 };
    });
    const edges = diagram.steps.flatMap((s,step) => s.events.flatMap((e,event) => {
      if (e.type !== "edge") return [];
      const a=boxes.find(b=>b.id===e.from)!, b=boxes.find(b=>b.id===e.to)!;
      const dir=b.x>a.x?1:-1;
      const port = options.anchors ? 4 : 20;
      const depart = options.anchors ? 3 : port;
      return [{ step,event,from:e.from,to:e.to,carry:e.carry,color:"green" as const,
        points:[[dir>0?a.x+a.w+depart:a.x-depart,a.cy],[dir>0?b.x-port:b.x+b.w+port,b.cy]] as [number,number][] }];
    }));
    return {kind:"checkout",width,height:Math.max(...boxes.map(b=>b.y+b.h))+(options.overlay?0:12),boxes,edges,overlay:options.overlay,
      regions:[],lifelines:[],labels:[],actions:[],badges:[],paths:[],ends:[]};
}

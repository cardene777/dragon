/**
 * 網の描き方 (#3337、#3348)。
 *
 * 部品の題と網の線と節は動かさずに描き、送る側 (`from`) の節は人の絵、作る人 (`to`) の節は箱の絵、ほかの節は機械の絵を丸に載せる。
 * 名札は節の下に描き、隣の名札とぶつかるので上へ逃がした節 (#3478) だけ節の上に描く。
 * 網を運ばれたチップが通った線は、送った段の間だけ強める。
 * 関門で止まったチップ (#3476) の節には、チップが着いた時刻 (`move`) から段の終わりまで輪の印 (`data-stop`) を出す。
 * この file は試す図を描く部品 (`render/try.ts`) だけが読み、見本帳を開いた時に読む塊に入れない (#3248)。
 */
import { hasWide } from "../../layout/measure";
import type { Point } from "../../layout/scene";
import { TRY_LOOK } from "../../look/try";
import { TYPE } from "../../look/values";
import { ALWAYS } from "../../render/ink";
import { esc, pathOf, r1, sansOf, write } from "../../render/parts";
import type { TryKit, TryWindow } from "../../render/try";
import { cs } from "../color/draw";
import { glyph } from "../icon/draw";

const T = TRY_LOOK;

/** 網ごとの題と線と節と、送った段の間だけ強める通った線と、関門で止まった節の印 */
export function routeNet(k: TryKit): void {
  const { layout, ctx, moments, windows, spanOf, title, cls, base, lit, node } = k;
  const { m } = ctx;
  for (const route of layout.routes) {
    const stops = moments
      .map((mo, k) => {
        const at = mo.stop?.route === route.id ? route.nodes.find((n) => n.id === mo.stop?.node) : undefined;
        if (!at) return "";
        const w = windows[k] as TryWindow;
        return `<g class="dg-a" data-stop="${esc(at.id)}" style="${cs(T.color.stop)};${m.vis(w.move, spanOf(mo.step).end)}"><circle class="dg-try-stop" cx="${r1(at.x)}" cy="${r1(at.y)}" r="${T.route.r + T.route.stop}"/></g>`;
      })
      .join("");
    const links = route.links
      .map((l) => `<path class="dg-try-net" d="${pathOf(l.points, ctx.corner)}"/>`)
      .join("");
    const nodes = route.nodes
      .map((n) => {
        const end = n.end !== undefined;
        const icon = n.end === "from" ? "user" : n.end === "to" ? "block" : "server";
        const label = write(
          ctx.ink,
          `${cls("dg-try-nt", n.id)}${end ? " dg-try-nte" : ""}`,
          n.x,
          n.label === "above" ? n.y - T.route.labelUp : n.y + T.route.labelY,
          n.id,
          hasWide(n.id) ? sansOf(TYPE.tryNode) : TYPE.tryNode,
          ALWAYS,
          "middle",
        );
        return `<g data-node="${esc(n.id)}"><circle class="${end ? "dg-try-end" : "dg-try-node"}" cx="${r1(n.x)}" cy="${r1(n.y)}" r="${T.route.r}"/>${glyph(icon, n.x, n.y, T.route.glyph, end ? "dg-gl" : "dg-try-ng")}${label}</g>`;
      })
      .join("");
    base.push(
      `<g data-part="${esc(route.id)}" style="${cs(T.color.part)}">${title(route.title)}${links}</g>`,
    );
    node.push(`<g data-route="${esc(route.id)}" style="${cs(T.color.part)}">${nodes}${stops}</g>`);
    moments.forEach((mo, k) => {
      if (mo.trip?.route !== route.id) return;
      const at = new Map(route.nodes.map((n) => [n.id, n]));
      const path = mo.state.trips.find((t) => t.item === mo.trip?.item)?.path ?? [];
      const points = path.flatMap((id): Point[] => {
        const n = at.get(id);
        return n ? [[n.x, n.y]] : [];
      });
      if (points.length < 2) return;
      const w = windows[k] as TryWindow;
      lit.push(
        `<path class="dg-try-trip dg-a" data-trip="${esc(mo.trip.item)}" d="${pathOf(points, ctx.corner)}" style="${cs(T.color.part)};${m.vis(w.a, spanOf(mo.step).end)}"/>`,
      );
    });
  }
}

/**
 * cdl の SVG に「掴める当たり判定」 を注入する (CAR-2160)。
 *
 * cdl が描く矢印は stroke 4px の線で、 これを正確に click するのは実質不可能に近い。
 * ラベルの text も当たり判定がグリフの輪郭しかなく、 文字の隙間や周囲の余白では反応しない。
 * user から見ると「矢印が選択できない」「囲い部分を click しても選択されない」 状態になる。
 *
 * Miro / Figma は細い線に太い透明の当たり判定を重ねている。 同じ方式で、
 * 描画は一切変えずに掴める範囲だけを広げる。
 *
 * 注入した要素には `data-editor-hit` を付け、 再注入時に古いものを消す = 二重に積まない。
 */

/** 矢印の当たり判定の太さ (client px 換算ではなく SVG user unit)。 */
export const EDGE_HIT_STROKE = 20;
/** ラベルの当たり判定の余白 (SVG user unit)。 */
export const LABEL_HIT_PADDING = 6;

const HIT_ATTR = "data-editor-hit";

/** 既に注入済の当たり判定を全て取り除く。 */
export function clearHitAreas(svg: SVGSVGElement): void {
  svg.querySelectorAll(`[${HIT_ATTR}]`).forEach((el) => el.remove());
}

/**
 * 矢印とラベルに当たり判定を注入する。
 *
 * 矢印 = 実線と同じ `d` を持つ透明 path を、 実線の **前** に挿入する。
 * 後ろに置くと実線より上に来て、 線自体の hover が透明 path に奪われる。
 * 前に置けば z 順で下になり、 線の上では実線が、 線の周囲では透明 path が hit する。
 *
 * ラベル = text の bbox に余白を足した透明 rect を text の直前に挿入する。
 * text より下に来るので、 文字そのものの hit は text が受ける。
 */
export function injectHitAreas(svg: SVGSVGElement): void {
  clearHitAreas(svg);

  svg.querySelectorAll("[data-cdl-edge]").forEach((g) => {
    const line = g.querySelector('path[data-cdl-role="edge-line"]') ?? g.querySelector("path");
    const d = line?.getAttribute("d");
    if (!line || !d) return;
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute(HIT_ATTR, "edge");
    hit.setAttribute("d", d);
    hit.setAttribute("fill", "none");
    hit.setAttribute("stroke", "transparent");
    hit.setAttribute("stroke-width", String(EDGE_HIT_STROKE));
    hit.setAttribute("stroke-linecap", "round");
    hit.style.pointerEvents = "stroke";
    hit.style.cursor = "pointer";
    line.parentNode?.insertBefore(hit, line);
  });

  // ラベル (edge label / node title 等の text) に余白付きの当たり判定を敷く。
  // 既に当たり判定を持つ node / lane の内側の text は対象外 = 二重に反応させない。
  svg.querySelectorAll("text").forEach((t) => {
    if (t.closest("[data-cdl-node], [data-cdl-lane]")) return;
    const bb = safeBBox(t);
    if (!bb || bb.width <= 0 || bb.height <= 0) return;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute(HIT_ATTR, "label");
    rect.setAttribute("x", String(bb.x - LABEL_HIT_PADDING));
    rect.setAttribute("y", String(bb.y - LABEL_HIT_PADDING));
    rect.setAttribute("width", String(bb.width + LABEL_HIT_PADDING * 2));
    rect.setAttribute("height", String(bb.height + LABEL_HIT_PADDING * 2));
    rect.setAttribute("fill", "transparent");
    rect.style.pointerEvents = "all";
    rect.style.cursor = "pointer";
    // text と同じ親に、 text の直前 = z 順で下に置く
    t.parentNode?.insertBefore(rect, t);
    // click した時に元の text を辿れるようにする (hover 判定が text を要求するため)
    rect.setAttribute("data-editor-hit-for", t.getAttribute("data-editor-text-key") ?? "");
  });
}

/**
 * 当たり判定 rect から、 それが代表する text 要素を返す。
 *
 * hover / 選択の判定は text 要素を前提に組まれているので、 rect が hit した時は
 * 対応する text にすり替える。 直後の兄弟が対象 text になる (挿入位置がそう定義されている)。
 */
export function resolveHitTarget(el: Element): Element {
  if (el.getAttribute(HIT_ATTR) !== "label") return el;
  const next = el.nextElementSibling;
  return next && next.tagName === "text" ? next : el;
}

/** `getBBox` は非表示要素で例外を投げるので包む。 */
function safeBBox(el: SVGGraphicsElement): DOMRect | null {
  try {
    return el.getBBox() as DOMRect;
  } catch {
    return null;
  }
}

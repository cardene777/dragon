import { updateActorPosition, updateActorNodePosition, extractAllActorNames, slugify } from "./canvas-pivot-interaction";

/**
 * cdl actor / 図全体のサイズ変更 (CAR-2160)。
 *
 * ## 何を書けばサイズが変わるか
 *
 * 実測すると、 lane の `posW` と配下 node の `posW` / `posH` を書けば箱が実際に大きくなる。
 *
 *   base            header 184x72  lane 340  viewBox 1009x726
 *   1.5 倍を書いた後 header 276x108 lane 510  viewBox  614x866
 *
 * 一方で **文字サイズは追従しない**。 cdl は `fontSize={20}` / `{10}` を SVG user unit の
 * 固定値で持っており、 座標系ごと拡大する仕組みが無いため。 箱だけが大きくなり、
 * 文字は相対的に小さく見える。 これを解消するには cdl 側に「図全体の scale」 を入れる必要がある。
 *
 * ## 縦位置は書かない
 *
 * node の `posY` を書くと衝突解決が spacer / footer を動かして actor が縦に割れる
 * (CAR-2156 で実測)。 高さ (`posH`) は書いてよいが、 位置 (`posY`) は cdl の stack に委ねる。
 */

/** 1 actor の実測サイズ (world 単位)。 */
export type ActorSizeSnapshot = {
  name: string;
  laneX: number;
  laneY: number;
  laneW: number;
  /**
   * 配下 node の実測値。 key は DSL の `nodes: { <key>: ... }` に使う名前。
   *
   * cx / cy も持つ理由 = cdl は `posX` と `posY` が **両方**ある node にしか `posW` / `posH` を
   * 適用しない (`layout/nodes.ts:155`)。 サイズだけ書いても無視されるため、 現在位置を
   * そのまま書き戻してサイズを効かせる。
   */
  nodes: Array<{ key: string; cx: number; cy: number; w: number; h: number }>;
};

/** サイズ変更の下限 / 上限倍率。 潰れて掴めなくなる / 巨大化して破綻するのを防ぐ。 */
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 4;

/** factor を実用範囲に丸める。 */
export function clampScale(factor: number): number {
  if (!Number.isFinite(factor) || factor <= 0) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, factor));
}

/**
 * 指定 actor のサイズを factor 倍した DSL を返す。
 *
 * lane の幅と配下 node の w / h を倍にする。 位置 (posX / posY) は現在値のまま書き戻して
 * 固定する = 他の actor が詰め直されて動くのを防ぐ (CAR-2156 と同じ理由)。
 */
export function scaleActorInDsl(
  src: string,
  targets: readonly ActorSizeSnapshot[],
  targetName: string,
  factor: number,
): string {
  const f = clampScale(factor);
  let out = src;
  for (const a of targets) {
    const scaled = a.name === targetName;
    out = updateActorPosition(out, a.name, a.laneX, a.laneY, scaled ? a.laneW * f : a.laneW);
    if (!scaled) continue;
    for (const n of a.nodes) {
      // 現在位置をそのまま書き戻す = 位置は変えずサイズだけを効かせる。
      // 座標を書かないと cdl が posW / posH を無視する (§ nodes の doc comment)。
      out = updateActorNodeBox(out, a.name, n.key, n.cx, n.cy, n.w * f, n.h * f);
    }
  }
  return out;
}

/**
 * 図全体を factor 倍する。 全 actor の lane 幅と node サイズを一括で変える。
 *
 * 位置は「原点からの距離を factor 倍」 して間隔も一緒に広げる = 図全体が等比で拡大される。
 * 原点は最も左上の lane にする (図が画面外へ逃げないため)。
 */
export function scaleDiagramInDsl(
  src: string,
  targets: readonly ActorSizeSnapshot[],
  factor: number,
): string {
  const f = clampScale(factor);
  if (targets.length === 0) return src;
  const originX = Math.min(...targets.map((a) => a.laneX));
  const originY = Math.min(...targets.map((a) => a.laneY));
  let out = src;
  for (const a of targets) {
    out = updateActorPosition(
      out,
      a.name,
      originX + (a.laneX - originX) * f,
      originY + (a.laneY - originY) * f,
      a.laneW * f,
    );
    for (const n of a.nodes) {
      // 図全体では位置も原点からの距離で拡げる
      out = updateActorNodeBox(
        out,
        a.name,
        n.key,
        originX + (n.cx - originX) * f,
        originY + (n.cy - originY) * f,
        n.w * f,
        n.h * f,
      );
    }
  }
  return out;
}

/**
 * actor 配下 node の `posW` / `posH` だけを書く。
 *
 * `updateActorNodePosition` は座標も必須で書いてしまい、 それが衝突解決を誘発して
 * actor を縦に割る (CAR-2156)。 サイズ変更では位置に触りたくないので、
 * nested map の該当 node に w / h だけを upsert する。
 */
export function updateActorNodeBox(
  src: string,
  actorName: string,
  nodeKey: string,
  posX: number,
  posY: number,
  posW: number,
  posH: number,
): string {
  const segments = src.split(/(\r\n|\n)/);
  const x = Math.round(posX);
  const y = Math.round(posY);
  const w = Math.round(posW);
  const h = Math.round(posH);
  const escaped = actorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headRe = new RegExp(`^([ \\t]*-[ \\t]*)(?:"${escaped}"|${escaped})([ \\t]*:[ \\t]*)\\{(.+)\\}([ \\t]*)$`);
  for (let i = 0; i < segments.length; i += 2) {
    const m = segments[i]!.match(headRe);
    if (!m) continue;
    const [, prefix, sep, inner, suffix] = m;
    const next = upsertNodeBox(inner!, nodeKey, x, y, w, h);
    if (next === null) continue;
    segments[i] = `${prefix}${actorName.includes(" ") ? `"${actorName}"` : actorName}${sep}{ ${next} }${suffix}`;
    return segments.join("");
  }
  // actor 行が inline map を持たない (bare / short form) 場合は先に map 化してから書く
  return src;
}

/**
 * inline map の `nodes: { ... }` に対象 node の posW / posH を upsert する。
 *
 * `nodes` が無ければ作る。 既存の他 field は保持する。
 * 深さを数えて top-level の `nodes` だけを見る = 別の nested map を誤って触らない。
 */
function upsertNodeBox(inner: string, nodeKey: string, x: number, y: number, w: number, h: number): string | null {
  const fields = splitTop(inner);
  const idx = fields.findIndex((f) => f.slice(0, f.indexOf(":")).trim() === "nodes");
  const sizeFields = `posX: ${x}, posY: ${y}, posW: ${w}, posH: ${h}`;
  if (idx < 0) {
    return [...fields, `nodes: { ${nodeKey}: { ${sizeFields} } }`].join(", ");
  }
  const raw = fields[idx]!;
  const open = raw.indexOf("{");
  const close = raw.lastIndexOf("}");
  if (open < 0 || close < open) return null;
  const nodesInner = raw.slice(open + 1, close);
  const entries = splitTop(nodesInner);
  const ei = entries.findIndex((e) => e.slice(0, e.indexOf(":")).trim() === nodeKey);
  if (ei < 0) {
    entries.push(`${nodeKey}: { ${sizeFields} }`);
  } else {
    const e = entries[ei]!;
    const eo = e.indexOf("{");
    const ec = e.lastIndexOf("}");
    if (eo < 0 || ec < eo) return null;
    const kept = splitTop(e.slice(eo + 1, ec)).filter((f) => !/^pos[XYWH]\s*:/.test(f.trim()));
    entries[ei] = `${nodeKey}: { ${[...kept, sizeFields].filter(Boolean).join(", ")} }`;
  }
  fields[idx] = `nodes: { ${entries.join(", ")} }`;
  return fields.join(", ");
}

/** brace 深さを数えて top-level の `,` でだけ分割する。 */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i]!;
    if (quote) {
      if (quote === '"' && ch === "\\") { i += 1; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") depth -= 1;
    else if (ch === "," && depth === 0) { out.push(s.slice(start, i)); start = i + 1; }
  }
  out.push(s.slice(start));
  return out.map((f) => f.trim()).filter((f) => f.length > 0);
}

/**
 * SVG から全 actor の lane と配下 node の実測サイズを読む。
 *
 * lane は `data-cdl-lane-*` 属性、 node は `getBBox` で測る。
 * node の key は `{slug}-{key}` / `s{N}-{slug}` の 2 形式から取り出す。
 */
export function buildSizeSnapshots(svg: SVGSVGElement, src: string): ActorSizeSnapshot[] {
  const out: ActorSizeSnapshot[] = [];
  for (const name of extractAllActorNames(src)) {
    const slug = slugify(name);
    const laneEl = svg.querySelector(`[data-cdl-lane="${cssEsc(slug)}"]`) ?? svg.querySelector(`[data-cdl-lane="${cssEsc(name)}"]`);
    if (!laneEl) continue;
    const num = (k: string): number | null => {
      const v = laneEl.getAttribute(k);
      if (v === null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const lx = num("data-cdl-lane-x");
    const ly = num("data-cdl-lane-y");
    const lw = num("data-cdl-lane-w");
    if (lx === null || ly === null || lw === null) continue;
    const nodes: ActorSizeSnapshot["nodes"] = [];
    svg.querySelectorAll("[data-cdl-node]").forEach((el) => {
      const id = el.getAttribute("data-cdl-node") ?? "";
      const key = nodeKeyOf(id, name, slug);
      if (key === null) return;
      let bb: DOMRect | null = null;
      try { bb = (el as SVGGraphicsElement).getBBox() as DOMRect; } catch { return; }
      if (!bb || bb.width <= 0 || bb.height <= 0) return;
      nodes.push({ key, cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, w: bb.width, h: bb.height });
    });
    out.push({ name, laneX: lx, laneY: ly, laneW: lw, nodes });
  }
  return out;
}

/** node id から actor 配下の key を取り出す。 該当 actor の node でなければ null。 */
export function nodeKeyOf(nodeId: string, actorName: string, actorSlug: string): string | null {
  for (const base of [actorSlug, actorName]) {
    if (!base) continue;
    if (nodeId.startsWith(`${base}__`)) return nodeId.slice(base.length + 2);
    if (nodeId.startsWith(`${base}-`)) return nodeId.slice(base.length + 1);
    const m = nodeId.match(/^(s\d+)-(.+)$/);
    if (m && m[2] === base) return m[1]!;
  }
  return null;
}

function cssEsc(v: string): string {
  const g = globalThis as { CSS?: { escape?: (s: string) => string } };
  if (typeof g.CSS?.escape === "function") return g.CSS.escape(v);
  return v.replace(/["\\]/g, "\\$&");
}

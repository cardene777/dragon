import { updateActorPosition } from "./canvas-pivot-interaction";

/**
 * cdl actor (シーケンス図の縦列) の drag を DSL に書き出す helper (CAR-2156)。
 *
 * ## なぜ lane だけに書き、 配下 node には書かないか
 *
 * cdl の actor は見た目ひとつの縦列だが、 内部では lane 1 個 + node 複数
 * (header / spacer / step box / footer) で構成される。 直感的には全 node に座標を書けば
 * 一体で動きそうだが、 実測すると **node の座標指定は最終的に捨てられる**。
 *
 *   layout.ts:215-220 が全 node の cx を `newLane.x + newLane.width / 2` で無条件に上書きする
 *
 * ため、 node に posX を書いても lane 中央に戻される。 縦 (cy) は posY が一旦効くものの、
 * 衝突解決 (`resolveOverlaps`) が spacer / footer を動かすため、 header だけ指定値に残って
 * 縦にずれる (実測 = header dy 46 に対し footer dy 8)。 これが Phase 4 (CAR-2139) で
 * revert に至った「actor 分裂」 の正体で、 cdl core の欠陥ではなく座標系の取り違えだった。
 *
 * lane にだけ座標を書けば、 配下 node は lane 中央 + row の cy で再配置されるため
 * 相対配置を保ったまま一体で動く (実測 = 全 node が同一 delta)。
 *
 * ## なぜ移動しない actor にも座標を書くか
 *
 * lane の x は「指定が無い lane を順に並べる」 ロジックで決まるため、 1 つの lane にだけ
 * posX を与えると残りが詰め直されて大きく動く (実測 = Client を +200 したら API が -565)。
 * user が最も嫌う「勝手に移動する」 挙動そのものなので、 移動しない actor にも現在位置を
 * 明示して固定する。 これにより掴んだ actor 以外は 1px も動かない (実測で確認済)。
 *
 * ## なぜ横移動だけを扱うか
 *
 * sequence 図の縦軸は時系列そのもので、 node の cy は stack (行番号) から全 lane 共通で決まる。
 * lane に posY を書くと row の起点 (`lanes[0].y`) が動いて全 actor の node が一斉にずれる一方、
 * lane の高さは footer 位置から再計算されるため、 header と footer が別々に動いて縦に割れる
 * (実測 = header dy 46 に対し footer dy 8)。
 *
 * つまり「actor を縦に動かす」 操作は sequence 図の構造上そもそも定義されていない。
 * 無理に座標を書くと分裂するので、 縦の delta は捨てて横だけを反映する。
 * lane の y は現在値をそのまま書き戻して固定する。
 *
 * ## 座標系
 *
 * 引数の座標は全て SVG world 単位。 呼び出し側 (CdlEditor) が client px から変換して渡す。
 */

/** 1 actor の lane 位置とサイズ (world 単位)。 drag 開始時に SVG から読んで渡す。 */
export type ActorLaneSnapshot = {
  /** DSL の actor 名 (alias)。 `- Client: { ... }` の Client */
  name: string;
  /** lane 左端の world x */
  laneX: number;
  /** lane 上端の world y */
  laneY: number;
  /** lane の world 幅。 隣接 lane との重なり判定に使う */
  laneW: number;
};

/**
 * 隣接 lane との間に最低限空ける world 距離。
 *
 * lane が重なる位置に置くと cdl の衝突解決 (`resolveOverlaps`) が「横に重なった node を
 * 縦に逃がす」 ため、 掴んでいない actor の header / footer だけが下にずれて lifeline から
 * 外れる (実測 = 重なり位置まで動かすと API の header と footer が 88px 下がる)。
 * Phase 4 で revert した分裂と見た目上は同じ症状になるので、 重なる位置には置けなくする。
 */
export const MIN_LANE_GAP = 40;

/** drag 対象を含む図全体の snapshot。 */
export type ActorSnapshot = {
  /** drag 対象の actor 名 */
  name: string;
  /** 図中の全 actor の lane 位置 (drag 対象を含む)。 移動しない actor の固定に使う */
  lanes: ActorLaneSnapshot[];
};

/**
 * drag の delta を、 隣接 lane と重ならない範囲に丸める。
 *
 * 重なる位置に置くと cdl の衝突解決が掴んでいない actor を縦に逃がして分裂させる
 * (§ MIN_LANE_GAP)。 発生源で断つため、 隣に寄れる限界で止める。
 * 隣が無い方向 (左端 / 右端) は制限しない。
 */
export function clampDx(snapshot: ActorSnapshot, dx: number): number {
  const target = snapshot.lanes.find((l) => l.name === snapshot.name);
  if (!target) return dx;
  const others = snapshot.lanes.filter((l) => l.name !== snapshot.name);
  const wantLeft = target.laneX + dx;
  const wantRight = wantLeft + target.laneW;
  let out = dx;
  for (const o of others) {
    const oLeft = o.laneX;
    const oRight = o.laneX + o.laneW;
    // 右方向に寄せて o と重なる → o の左辺 - gap まで
    if (dx > 0 && wantRight + MIN_LANE_GAP > oLeft && target.laneX + target.laneW <= oLeft) {
      out = Math.min(out, oLeft - MIN_LANE_GAP - target.laneW - target.laneX);
    }
    // 左方向に寄せて o と重なる → o の右辺 + gap まで
    if (dx < 0 && wantLeft - MIN_LANE_GAP < oRight && target.laneX >= oRight) {
      out = Math.max(out, oRight + MIN_LANE_GAP - target.laneX);
    }
  }
  return out;
}

/**
 * actor を横に dx だけ動かした DSL を返す。
 *
 * 対象 actor は dx を足した位置、 それ以外は現在位置をそのまま書く。
 * 全 actor に座標が入るため、 以降の compile では並べ直しが起きない。
 * 縦位置は全 actor とも現在値のまま (§ なぜ横移動だけを扱うか)。
 * dx は隣接 lane と重ならない範囲に丸める (§ clampDx)。
 */
export function moveActorInDsl(src: string, snapshot: ActorSnapshot, dx: number): string {
  const clamped = clampDx(snapshot, dx);
  let out = src;
  for (const lane of snapshot.lanes) {
    const moved = lane.name === snapshot.name;
    out = updateActorPosition(out, lane.name, lane.laneX + (moved ? clamped : 0), lane.laneY);
  }
  return out;
}

/**
 * SVG から全 actor の lane 位置を読んで snapshot を作る。
 *
 * 座標は cdl が lane の `<g>` に出している `data-cdl-lane-x` / `-y` / `-w` 属性から読む。
 * `getBoundingClientRect` で測ると、 `contain: true` の lane では枠線 (strokeWidth 1.5) が
 * bbox を左右 0.75px ずつ広げ、 `Math.round` と合わさって drag のたびに全 actor が
 * 1px ずつずれ続ける (CAR-2156 review MINOR)。 属性を読めばこの経路ごと消える。
 * 属性が無い場合だけ bbox 実測に落とす。
 *
 * `actorNames` は DSL 上の actor 名 (alias) の一覧。 slug 変換は `toSlug` に委ねる
 * (呼び出し側の `slugifyActorName` と規則を揃えるため)。
 * lane 要素が見つからない actor は snapshot から除く = 座標を書かないので auto layout のまま残る。
 */
export function buildActorSnapshotFromSvg(
  svg: SVGSVGElement,
  targetActorName: string,
  actorNames: readonly string[],
  toSlug: (name: string) => string,
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number },
): ActorSnapshot | null {
  const lanes: ActorLaneSnapshot[] = [];
  for (const name of actorNames) {
    const el = findLaneElement(svg, name, toSlug(name));
    if (!el) continue;
    const attr = readLaneAttrs(el);
    if (attr) {
      lanes.push({ name, laneX: attr.x, laneY: attr.y, laneW: attr.w });
      continue;
    }
    const r = (el as SVGGraphicsElement).getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const tl = clientToWorld(r.left, r.top);
    const br = clientToWorld(r.right, r.bottom);
    lanes.push({ name, laneX: tl.x, laneY: tl.y, laneW: br.x - tl.x });
  }
  // drag 対象の lane が測れなければ drag を起動しない
  if (!lanes.some((l) => l.name === targetActorName)) return null;
  return { name: targetActorName, lanes };
}

/**
 * lane の `<g>` を slug / 生名の順で探す。
 *
 * 属性値は `CSS.escape` を通す。 alias に `"` を含むと (`- "a \" b":` のような DSL)
 * selector が `[data-cdl-lane="a " b"]` になって `querySelector` が SyntaxError を投げ、
 * mousedown handler ごと落ちる (CAR-2156 review MINOR)。
 */
function findLaneElement(svg: SVGSVGElement, name: string, slug: string): Element | null {
  for (const v of [slug, name]) {
    if (!v) continue;
    try {
      const el = svg.querySelector(`[data-cdl-lane="${cssEscape(v)}"]`);
      if (el) return el;
    } catch {
      // selector 組立に失敗した値は諦めて次の候補へ (drag が起動しないだけで壊れない)
    }
  }
  return null;
}

/** `CSS.escape` が無い環境 (古い jsdom 等) では最小限の quote escape に落とす。 */
function cssEscape(v: string): string {
  const g = globalThis as { CSS?: { escape?: (s: string) => string } };
  if (typeof g.CSS?.escape === "function") return g.CSS.escape(v);
  return v.replace(/["\\]/g, "\\$&");
}

/** lane の `<g>` から cdl が出している座標属性を読む。 1 つでも欠けたら null。 */
function readLaneAttrs(el: Element): { x: number; y: number; w: number } | null {
  const num = (k: string): number | null => {
    const raw = el.getAttribute(k);
    if (raw === null) return null;
    const v = Number(raw);
    return Number.isFinite(v) ? v : null;
  };
  const x = num("data-cdl-lane-x");
  const y = num("data-cdl-lane-y");
  const w = num("data-cdl-lane-w");
  if (x === null || y === null || w === null) return null;
  return { x, y, w };
}

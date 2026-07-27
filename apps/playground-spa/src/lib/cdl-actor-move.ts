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

/** 1 actor の lane 位置 (world 単位)。 drag 開始時に SVG から測って渡す。 */
export type ActorLaneSnapshot = {
  /** DSL の actor 名 (alias)。 `- Client: { ... }` の Client */
  name: string;
  /** lane 左端の world x */
  laneX: number;
  /** lane 上端の world y */
  laneY: number;
};

/** drag 対象を含む図全体の snapshot。 */
export type ActorSnapshot = {
  /** drag 対象の actor 名 */
  name: string;
  /** 図中の全 actor の lane 位置 (drag 対象を含む)。 移動しない actor の固定に使う */
  lanes: ActorLaneSnapshot[];
};

/**
 * actor を横に dx だけ動かした DSL を返す。
 *
 * 対象 actor は dx を足した位置、 それ以外は現在位置をそのまま書く。
 * 全 actor に座標が入るため、 以降の compile では並べ直しが起きない。
 * 縦位置は全 actor とも現在値のまま (§ なぜ横移動だけを扱うか)。
 */
export function moveActorInDsl(src: string, snapshot: ActorSnapshot, dx: number): string {
  let out = src;
  for (const lane of snapshot.lanes) {
    const moved = lane.name === snapshot.name;
    out = updateActorPosition(out, lane.name, lane.laneX + (moved ? dx : 0), lane.laneY);
  }
  return out;
}

/**
 * SVG から全 actor の lane 位置を実測して snapshot を作る。
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
    const slug = toSlug(name);
    const el = svg.querySelector(`[data-cdl-lane="${slug}"], [data-cdl-lane="${name}"]`);
    if (!el) continue;
    const r = (el as SVGGraphicsElement).getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const tl = clientToWorld(r.left, r.top);
    lanes.push({ name, laneX: tl.x, laneY: tl.y });
  }
  // drag 対象の lane が測れなければ drag を起動しない
  if (!lanes.some((l) => l.name === targetActorName)) return null;
  return { name: targetActorName, lanes };
}

/**
 * DSL の actors block から actor 名 (alias) を順に取り出す。
 *
 * `- Client` / `- Client: { ... }` / `- "My Actor": { ... }` の 3 形式に対応する。
 * flow / animation 等の別 block は読まない (actors block の中だけを見る)。
 */
export function collectActorNames(src: string): string[] {
  const names: string[] = [];
  let inActors = false;
  for (const line of src.split(/\r?\n/)) {
    if (/^actors[ \t]*:[ \t]*$/.test(line)) {
      inActors = true;
      continue;
    }
    // 次の top-level block (行頭が英字) に入ったら終了
    if (inActors && /^[a-zA-Z_]/.test(line)) break;
    if (!inActors) continue;
    const m = line.match(/^[ \t]*-[ \t]*("(?:[^"\\]|\\.)*"|[^:\s][^:]*?)[ \t]*(?::|$)/);
    if (!m) continue;
    const raw = m[1]!.trim();
    if (!raw) continue;
    names.push(raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1).replace(/\\(.)/g, "$1") : raw);
  }
  return names;
}

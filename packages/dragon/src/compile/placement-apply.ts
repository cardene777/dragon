import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram, LaidDiagram } from "@cardenelabs/cdl";
import {
  orderByDependency,
  resolveRelativePos,
  type AnchorBox,
  type RelativeDirection,
} from "../relative-pos";
import type { DslDocument } from "../types";
import type { CompileNotice } from "./notice";
import { 箱の題 } from "./node-title";
import { partBoxes, partSizes } from "./parts";
import { PLACEMENT_TOLERANCE } from "./placement";
import { slugify } from "./slug";
import { truncateForMessage } from "./subtitle";
/**
 * 書いた位置を図に当てる (#2036 で `compile.ts` から移した)。
 *
 * 相対で書いた位置を絶対座標に直し、置けたかを確かめ、置けていなければずらして置き直す。
 * 色を当てるのと、図枠の起点から座標を伝えるのも ここが持つ。
 *
 * 外へ出す口は 4 つ。 いずれも入口が順に呼ぶ (`resolveRelativeDoc` →
 * `applyCanvasPivotPositions` → `applyLayoutOffsets` → `applyNodeTones`)。
 *
 * ほかに `measureActorBoxes` を持つ。 画面が同じ物差しで箱を測るため `index.ts` が読む。
 * `compile.ts` が再輸出するので、取り込む側の書き方は変わらない。
 */

/**
 * 相対で書かれた位置 (`位置: Web の右 200`) を絶対座標に直した doc を返す。
 *
 * 基準の実座標は配置を 1 度計算しないと分からない。 cdl の `layout` を呼んで測り、
 * 基準の縁から間隔を空けた位置を求める。 元の doc は書き換えず、 座標を入れた複製を返す。
 *
 * 相対指定が 1 件も無ければ何もしない。 配置計算は 1 回 1ms 前後かかるので、 使っていない
 * 図に負担をかけない。
 */
export function resolveRelativeDoc(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
  partsCatalog?: Record<string, CdlDiagram>,
): DslDocument {
  if (!doc.actors.some((a) => a.posRel !== undefined)) return doc;

  // 1. 座標を書いた分を先に反映してから測る。 基準がどこに居るかはここで分かる。
  //
  // 自動配置のまま測ると、 座標で固定した箱を基準にした指定が壊れる。 基準の自動配置位置
  // から狙いを作るため、 実際の位置と食い違い、 最後の確認で「効きません」 と捨てられる
  // (実測 = `Web @1000,500` の右に置くはずの箱が 200 に出て、 そのまま落とされた)。
  const measured = measureActorBoxes(withPositions(diagram, doc, new Map()));
  // パーツの箱は catalog から作る。 組み立て前の図に残っている仮の箱を測ると、 実際に
  // 描かれる大きさと違う値で間隔を計算することになる
  const baseBoxes = new Map(measured);
  if (partsCatalog) {
    for (const [name, box] of partBoxes(diagram, doc, partsCatalog)) baseBoxes.set(name, box);
  }
  const sizeOverride = partsCatalog
    ? partSizes(doc, partsCatalog)
    : new Map<string, { w: number; h: number; dx: number; dy: number }>();
  const want = desiredCenters(doc, baseBoxes, sizeOverride);
  if (want.size === 0) return doc;

  // 2. 狙った中心をそのまま座標として仮に置く。
  //    パーツは渡す座標が段の中心なので、 矩形の中心とのずれを引く
  const naive = new Map(
    [...want].map(([name, c]) => {
      const off = sizeOverride.get(name);
      return [name, { posX: c.cx - (off?.dx ?? 0), posY: c.cy - (off?.dy ?? 0) }] as const;
    }),
  );

  // 3. 測り直して、 狙いとの差を足す。
  //
  // 座標を書いた時に中心がどこに来るかは図種で違う。 順序図の座標は縦列の左端を動かすので、
  // 中心を狙って書くと縦列の幅の半分だけ右にずれる (実測 = 200 空けたいのに 370 空いた)。
  // 図種ごとの規則を書き写すと cdl 側の変更で黙って壊れるため、 実際に置いた結果との差を
  // 使って直す。 差は図種ごとに一定なので 1 度で合う (実測 = 8 図種すべてで狙い通り)。
  const isPart = new Set(doc.actors.filter((a) => a.partId !== undefined).map((a) => a.name));
  // 確かめる時も、 基準になるパーツは catalog 由来の箱で見る。 この時点の図には仮の箱しか
  // 無いため、 測ると解決側と違う基準で期待を作ることになる (実測 = 正しく置いた箱が
  // 「効きません」 と落とされた)
  const partOverride = new Map<string, AnchorBox>();
  for (const [name, box] of baseBoxes) {
    if (isPart.has(name)) partOverride.set(name, box);
  }
  for (const [name, c] of want) {
    if (!isPart.has(name)) continue;
    partOverride.set(name, c);
  }
  const placedBoxes = measureActorBoxes(withPositions(diagram, doc, naive));
  const fixed = new Map<string, { posX: number; posY: number }>();
  for (const [name, pos] of naive) {
    // パーツは補正しない。 merge が座標を中心としてそのまま使うので狙いがそのまま効く。
    // 一方この時点の図にはパーツの仮の箱しか無く、 動いていない位置を測って差を足すと
    // ずれが二重になる (実測 = 狙い 760 に対して 1320 に飛んだ)
    if (isPart.has(name)) {
      fixed.set(name, pos);
      continue;
    }
    const got = placedBoxes.get(name);
    const target = want.get(name)!;
    if (!got) {
      fixed.set(name, pos);
      continue;
    }
    fixed.set(name, {
      posX: pos.posX + (target.cx - got.cx),
      posY: pos.posY + (target.cy - got.cy),
    });
  }

  // 4. 効いたかを確かめ、 効かなかった分は自動配置に戻す。
  //
  // 座標がどの向きにも効く保証は無い。 順序図の縦位置がその例で、 縦列は横に並ぶものなので
  // 下に動かせない。 そのまま出すと基準の上に重なった図が出る (実測)。 動かなかった時は
  // 書かなかった時と同じ配置に戻し、 何が効かなかったかを呼出側に伝える。
  return withDocPositions(doc, verifyPlacement(diagram, doc, fixed, partOverride, onNotice));
}

/**
 * 置いた結果が書いた通りかを確かめ、 外れた分を落とす。
 *
 * 確かめるのは最後の配置での「基準との位置関係」 で、 手順 1 で測った狙いではない。
 * 誰かを固定すると周りの自動配置が動くため、 狙いと突き合わせると基準がずれた分を
 * 見逃す。 書いた言葉 (`Web の右 200`) が最後の図でも成り立つかを見る。
 *
 * **落とす側 (`relative-position-ignored` を出す枝) に届く入力は組めていない** (#2041 の実測)。
 * 試した形は 56 通り = 22 図種 × 右と下、値を持つ `pie` / `bar`、板になる `solidity` と `tree`、
 * 同じ場所に 2 つ置く / 間隔 0 で隣に置く / 縦列をまたいで下に置く / 囲いの外へ 3000 出す。
 * どれも知らせが 0 件だった。
 *
 * 座標が効かない図種は、そもそも面ごとの箱を持たない (`sequence` / `solidity` の板)。
 * その場合は上の `boxes.get(actor.name)` が空になって手前で抜けるため、この枝には来ない。
 * 箱を持つ図種では座標がそのまま効く。 描画側が置いた位置を動かす規則を持った時に備えて残す。
 *
 * **この枝を消さない理由は、知らせが要るかどうかが描画側の都合で変わるから**。 消すと、
 * 動かす規則が入った日に「書いたのに効かない」 が黙って起きる (#2041 で実際に起きた形と同じ)。
 */
function verifyPlacement(
  diagram: CdlDiagram,
  doc: DslDocument,
  assign: ReadonlyMap<string, { posX: number; posY: number }>,
  partOverride: ReadonlyMap<string, AnchorBox>,
  onNotice?: (notice: CompileNotice) => void,
): Map<string, { posX: number; posY: number }> {
  const boxes = measureActorBoxes(withPositions(diagram, doc, assign));
  // パーツは merge 前なので、 図には実寸と違う仮の箱しか無い。 解決側と同じ箱に差し替える。
  //
  // 差し替えないと 2 通りに壊れる。 パーツを基準にした箱は仮の箱から期待を作って落とされ
  // (実測 = 正しく置いた箱が「効きません」 になった)、 パーツ自身も仮の箱の位置と
  // 突き合わせて落とされる。
  for (const [name, box] of partOverride) boxes.set(name, box);
  const kept = new Map(assign);
  for (const actor of doc.actors) {
    const rel = actor.posRel;
    const pos = assign.get(actor.name);
    if (!rel || !pos) continue;
    const self = boxes.get(actor.name);
    const anchor = boxes.get(rel.anchor);
    if (!self || !anchor) continue;
    const expect = resolveRelativePos(rel, anchor, self);
    const offX = Math.abs(expect.posX - self.cx);
    const offY = Math.abs(expect.posY - self.cy);
    if (offX <= PLACEMENT_TOLERANCE && offY <= PLACEMENT_TOLERANCE) continue;
    kept.delete(actor.name);
    onNotice?.({
      kind: "relative-position-ignored",
      actor: actor.name,
      line: actor.pos.line,
      message: `"${actor.name}" の位置 (${rel.anchor} の${DIRECTION_LABEL[rel.dir]}) は${doc.type}図では効きません`,
      hint: "座標 (`位置: 300,200`) で置くか、 自動配置に任せる",
    });
  }
  return kept;
}

/** 向きの表示名。 効かなかった時の知らせで、 書いた言葉に近い形で返すために持つ。 */
const DIRECTION_LABEL: Readonly<Record<RelativeDirection, string>> = {
  right: "右",
  left: "左",
  above: "上",
  below: "下",
};

/**
 * 相対で書かれた分について、 中心をどこに置きたいかを求める。
 *
 * 基準がまた相対で書かれていることがある (`C は B の右`、 `B は A の右`) ため、 依存の浅い順に
 * 解く。 解けた中心は基準として次に使う。
 */
function desiredCenters(
  doc: DslDocument,
  boxes: ReadonlyMap<string, AnchorBox>,
  sizeOverride: ReadonlyMap<string, { w: number; h: number }> = new Map(),
): Map<string, AnchorBox> {
  // 大きさだけを見る。 中心のずれは呼ぶ側が座標に直す時に引く
  const byName = new Map(doc.actors.map((a) => [a.name, a] as const));
  const { order } = orderByDependency(doc.actors.map((a) => ({ name: a.name, rel: a.posRel })));
  // 基準に使う中心。 相対で書かれていない分は測った位置をそのまま使う
  const centers = new Map<string, AnchorBox>(boxes);
  const out = new Map<string, AnchorBox>();

  for (const name of order) {
    const actor = byName.get(name);
    // 自分の大きさ。 パーツは catalog の値を使う (図に残る仮の箱は実寸と違う)
    const override = sizeOverride.get(name);
    const measuredSelf = boxes.get(name);
    const self = override
      ? { cx: measuredSelf?.cx ?? 0, cy: measuredSelf?.cy ?? 0, w: override.w, h: override.h }
      : measuredSelf;
    if (!actor?.posRel || !self) continue;
    const anchor = centers.get(actor.posRel.anchor);
    // 測れない相手を基準にした分は自動配置のまま残す。 相手が居ることは parser が確かめて
    // いるので、 ここに来るのは図に箱として現れない相手 (catalog に無いパーツ等) を指した場合
    if (!anchor) continue;
    const p = resolveRelativePos(actor.posRel, anchor, self);
    const center: AnchorBox = { cx: p.posX, cy: p.posY, w: self.w, h: self.h };
    centers.set(name, center);
    out.set(name, center);
  }
  return out;
}

/**
 * 登場人物ごとの、 図の上での中心と大きさを測る。
 *
 * 対応付けは箱に表示される名前で行う。 id を使わない理由は `applyNodeTones` と同じで、
 * slug の作り方が dragon と cdl で違うため記号を含む名前で一致しない。
 *
 * 1 人が複数の箱に分かれる図種 (順序図の上端 / 下端) では、 全部を囲む矩形を返す。
 * 箱として現れない登場人物は縦列の矩形で代用する。
 */
export function measureActorBoxes(
  diagram: CdlDiagram,
  /**
   * 配置まで済ませた図。 渡すとここでは測り直さない (#1006)。
   *
   * 呼出側が既に組み立てているなら、 ここで `layout` を呼ぶと同じ図の配置を 2 度計算する。
   * 図の規模に比例して重く、 辺 500 本で約 300ms (実測)。
   * 渡す時は `diagram` と対にする = 別の図の配置を渡すと、 測る位置がずれる。
   */
  laidHint?: LaidDiagram,
): Map<string, AnchorBox> {
  const laid = laidHint ?? layout(diagram);
  const bounds = new Map<string, { x0: number; y0: number; x1: number; y1: number }>();
  for (const n of laid.nodes) {
    const title = n.title;
    if (!title) continue;
    const x0 = n.cx - n.w / 2;
    const y0 = n.cy - n.h / 2;
    const x1 = n.cx + n.w / 2;
    const y1 = n.cy + n.h / 2;
    const cur = bounds.get(title);
    if (cur) {
      cur.x0 = Math.min(cur.x0, x0);
      cur.y0 = Math.min(cur.y0, y0);
      cur.x1 = Math.max(cur.x1, x1);
      cur.y1 = Math.max(cur.y1, y1);
    } else {
      bounds.set(title, { x0, y0, x1, y1 });
    }
  }
  const out = new Map<string, AnchorBox>();
  for (const [name, b] of bounds) {
    out.set(name, { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, w: b.x1 - b.x0, h: b.y1 - b.y0 });
  }
  for (const lane of laid.lanes) {
    const label = lane.label;
    if (!label || out.has(label)) continue;
    const y = lane.y ?? 0;
    const h = lane.height ?? 0;
    out.set(label, { cx: (lane.x ?? 0) + lane.width / 2, cy: y + h / 2, w: lane.width, h });
  }
  return out;
}

/** doc の複製に、 決まった座標を入れる。 元の doc は書き換えない。 */
function withDocPositions(
  doc: DslDocument,
  assign: ReadonlyMap<string, { posX: number; posY: number }>,
): DslDocument {
  if (assign.size === 0) return doc;
  return {
    ...doc,
    actors: doc.actors.map((a) => {
      const p = assign.get(a.name);
      return p ? { ...a, posX: p.posX, posY: p.posY } : a;
    }),
  };
}

/** 決まった座標を反映した図の複製を作る。 測り直す時だけ使う捨て図。 */
function withPositions(
  diagram: CdlDiagram,
  doc: DslDocument,
  assign: ReadonlyMap<string, { posX: number; posY: number }>,
): CdlDiagram {
  const probe: CdlDiagram = {
    ...diagram,
    lanes: diagram.lanes.map((l) => ({ ...l })),
    nodes: diagram.nodes.map((n) => ({ ...n })),
  };
  applyCanvasPivotPositions(probe, withDocPositions(doc, assign));
  return probe;
}

/** ずらしを当てる相手 1 つ。 狙いは配置後の位置 (箱は中心、縦列は左上) */
type ずらしの相手 = {
  名前: string;
  line: number;
  箱: { id: string; 狙いX: number; 狙いY: number }[];
  縦列: { id: string; 狙いX: number; 狙いY: number }[];
  /** 縦列に書いたずらしの相手なら、その縦列の id */
  ずらした縦列?: string;
};

/**
 * 書いた位置のずらし (JSON の `pos` / 記法の `offsetX` / `offsetY`) を、配置後の位置に足して置き直す (#1971)。
 *
 * **最後の図の上で置き直す**。 配置は縦列の間隔や視点の間隔を足した後でないと決まらず、途中の
 * 図で測ると、後から足される間隔の分だけ狙いがずれる。
 *
 * 手順は 3 つ。
 *
 * 1. 1 度配置して、ずらす箱の中心と縦列の左上を測る
 * 2. 狙い (測った位置 + ずらし) を `posX` / `posY` に書いてもう 1 度配置する
 * 3. 狙いからずれた分を足して直し (最大 2 回)、それでも 1 を超えてずれる相手は固定を戻して知らせる
 *
 * **縦列は 1 本でもずらすなら全ての縦列を固定する**。 1 本だけ固定すると、残りの縦列が左端から
 * 詰め直されて崩れる (実測 = 3 本のうち最初を動かすと 2 本目が 0 に来た)。 固定する位置と大きさは
 * 配置後の値なので、ずらさない縦列の配置は変わらない (実測 = 6 図種で一致)。
 *
 * **ずらした縦列の箱も同じ量で固定し、他の箱は動いたら元の位置に留める**。 縦列を固定しただけでは、
 * 中の箱は縦列の並ぶ向きにしか付いて来ず (`topology` / `c4` は縦列自身も縦に 32 ずれた)、最初の
 * 縦列を縦にずらすと他の縦列の箱まで動く (実測)。 動いた箱を留めるのは手順 3 の直し。
 *
 * **近すぎる箱を押し下げるのは止めない**。 ずらした箱に同じ縦列の箱が近づくと、描画側が間隔を保つよう
 * そちらを動かす (実測 = 静止した flow で下の箱が 100 下がった)。 これは描画側の規則で、ずらした箱
 * 自身は狙いに置かれる。
 *
 * ずらしを持つ相手が 1 つも無い図は何もしない = 配置を 1 度も計算しない。
 */
export function applyLayoutOffsets(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
): void {
  // `mind` は放射に描けない欄として「配置のずらし」 を既に知らせる (`放射で描けない欄の名前`)。 2 度知らせない
  const ずらす箱 =
    doc.type === "mind" ? [] : doc.actors.filter((a) => a.layoutPos !== undefined);
  const ずらす縦列 = Object.entries(doc.lanes ?? {}).filter(([, l]) => l.layoutPos !== undefined);
  if (ずらす箱.length === 0 && ずらす縦列.length === 0) return;
  // 順序図の板は面ごとの箱を持たない。 効かないことは `reportActorKindNotHonored` が伝える
  if (doc.type === "sequence" || doc.type === "solidity") return;

  const 前 = layout(diagram);
  const 箱の配置 = new Map(前.nodes.map((n) => [n.id, n] as const));
  const 縦列の配置 = new Map(前.lanes.map((l) => [l.id, l] as const));
  const 相手たち: ずらしの相手[] = [];
  const 縦列のずらし = new Map<string, { x: number; y: number }>();
  /** 箱のずらしだけの狙い (縦列のずらしを足さない)。 縦列をずらす図で、ずらさない箱の基準を取るのに使う */
  const 箱だけの狙い = new Map<string, { x: number; y: number }>();

  for (const [id, lane] of ずらす縦列) {
    const laid = 縦列の配置.get(id);
    const d = lane.layoutPos!;
    if (!laid) {
      onNotice?.({
        kind: "position-offset-ignored",
        actor: id,
        line: lane.pos?.line ?? 0,
        message: `縦列 "${id}" の位置のずらしを載せる縦列が図にありません (type: ${doc.type})`,
        hint: "縦列を作る図種で書くか、ずらしを外す",
      });
      continue;
    }
    縦列のずらし.set(id, d);
    相手たち.push({
      名前: id,
      line: lane.pos?.line ?? 0,
      // 縦列を固定しただけでは、中の箱は縦列の並ぶ向きにしか付いて来ない (実測 = flow の縦列を
      // 右へ 120、下へ 40 ずらすと、見出しは両方動き箱は右へ 120 だけ動いた)。 箱も同じ量で固定する
      箱: diagram.nodes.flatMap((n) => {
        const 箱laid = n.lane === id ? 箱の配置.get(n.id) : undefined;
        return 箱laid ? [{ id: n.id, 狙いX: 箱laid.cx + d.x, 狙いY: 箱laid.cy + d.y }] : [];
      }),
      縦列: [{ id, 狙いX: (laid.x ?? 0) + d.x, 狙いY: (laid.y ?? 0) + d.y }],
      ずらした縦列: id,
    });
  }

  for (const a of ずらす箱) {
    const d = a.layoutPos!;
    // 見本は `{名前}__{元の id}` で重なる。 箱と縦列を見本 1 つ分まとめて動かす
    const 前置き = `${a.name}__`;
    const 箱 =
      a.partId !== undefined
        ? diagram.nodes.filter((n) => n.id.startsWith(前置き))
        : diagram.nodes.filter((n) => n.id === slugify(a.name));
    const 縦列 = a.partId !== undefined ? diagram.lanes.filter((l) => l.id.startsWith(前置き)) : [];
    if (箱.length === 0) {
      onNotice?.({
        kind: "position-offset-ignored",
        actor: a.name,
        line: a.pos?.line ?? 0,
        message: `"${truncateForMessage(a.name)}" の位置のずらしを載せる箱が図にありません (type: ${doc.type})`,
        hint: "箱を描く図種で書くか、ずらしを外す",
      });
      continue;
    }
    相手たち.push({
      名前: a.name,
      line: a.pos?.line ?? 0,
      箱: 箱.map((n) => {
        const laid = 箱の配置.get(n.id)!;
        箱だけの狙い.set(n.id, { x: laid.cx + d.x, y: laid.cy + d.y });
        // 箱を固定すると縦列を動かしても付いて来ないので、縦列のずらしも狙いに足す
        const 列 = 縦列のずらし.get(n.lane);
        return { id: n.id, 狙いX: laid.cx + d.x + (列?.x ?? 0), 狙いY: laid.cy + d.y + (列?.y ?? 0) };
      }),
      縦列: 縦列.map((l) => {
        const laid = 縦列の配置.get(l.id)!;
        return { id: l.id, 狙いX: (laid.x ?? 0) + d.x, 狙いY: (laid.y ?? 0) + d.y };
      }),
    });
  }
  if (相手たち.length === 0) return;

  // 固定を戻せるよう、書き換える前の欄を控える
  const 元の箱 = new Map(diagram.nodes.map((n) => [n.id, { posX: n.posX, posY: n.posY }] as const));
  const 元の縦列 = new Map(
    diagram.lanes.map((l) => [l.id, { posX: l.posX, posY: l.posY, posW: l.posW, posH: l.posH }] as const),
  );
  const 箱の狙い = new Map<string, { x: number; y: number }>();
  const 縦列の狙い = new Map<string, { x: number; y: number }>();
  for (const t of 相手たち) {
    for (const b of t.箱) 箱の狙い.set(b.id, { x: b.狙いX, y: b.狙いY });
    for (const l of t.縦列) 縦列の狙い.set(l.id, { x: l.狙いX, y: l.狙いY });
  }
  const 縦列を固定する = 縦列の狙い.size > 0;

  /**
   * 縦列をずらす図で、ずらさない箱を留める位置。
   *
   * 描画側は箱を並べ始める高さを最初の縦列に合わせるので、最初の縦列を縦にずらすと固定しない箱が
   * 全て一緒に動く (実測 = 3 本のうち最初の縦列を 40 下げると他の縦列の箱も 40 下がり、2 本目と
   * 3 本目を下げても動かない)。 箱のずらしだけを当てた配置を基準に取り、そこから動いた箱をその位置に
   * 留める。 基準に箱のずらしを含めるのは、近すぎる箱の押し下げを残すため。
   */
  const 留める位置 = new Map<string, { x: number; y: number }>();
  if (縦列を固定する) {
    let 基準 = 前;
    if (箱だけの狙い.size > 0) {
      for (const node of diagram.nodes) {
        const 狙い = 箱だけの狙い.get(node.id);
        if (!狙い) continue;
        node.posX = 狙い.x;
        node.posY = 狙い.y;
      }
      基準 = layout(diagram);
      for (const node of diagram.nodes) {
        if (!箱だけの狙い.has(node.id)) continue;
        const 元 = 元の箱.get(node.id)!;
        node.posX = 元.posX;
        node.posY = 元.posY;
      }
    }
    const 基準の箱 = new Map(基準.nodes.map((n) => [n.id, n] as const));
    // 縦列と一緒に動かす箱は、押し下げを含む基準の位置から縦列のずらしだけ動かす
    for (const t of 相手たち) {
      const d = t.ずらした縦列 === undefined ? undefined : 縦列のずらし.get(t.ずらした縦列);
      if (!d) continue;
      for (const b of t.箱) {
        const n = 基準の箱.get(b.id);
        if (!n || 箱だけの狙い.has(b.id)) continue;
        箱の狙い.set(b.id, { x: n.cx + d.x, y: n.cy + d.y });
      }
    }
    for (const n of 基準.nodes) {
      if (!箱の狙い.has(n.id)) 留める位置.set(n.id, { x: n.cx, y: n.cy });
    }
  }
  /** 基準から動いたので固定した、ずらさない箱 */
  const 留めた箱 = new Set<string>();

  // 手順 2。 縦列を固定する時は、ずらさない縦列も配置後の位置と大きさで固定する
  const 書く = (直し: ReadonlyMap<string, { x: number; y: number }>): void => {
    if (縦列を固定する) {
      for (const lane of diagram.lanes) {
        const laid = 縦列の配置.get(lane.id);
        if (!laid) continue;
        const 狙い = 縦列の狙い.get(lane.id) ?? { x: laid.x ?? 0, y: laid.y ?? 0 };
        const 差 = 直し.get(`lane:${lane.id}`) ?? { x: 0, y: 0 };
        lane.posX = 狙い.x - 差.x;
        lane.posY = 狙い.y - 差.y;
        lane.posW = laid.width;
        lane.posH = laid.height;
      }
    }
    for (const node of diagram.nodes) {
      const 狙い = 箱の狙い.get(node.id);
      const 留める = 留めた箱.has(node.id) ? 留める位置.get(node.id) : undefined;
      if (!狙い && !留める) continue;
      const 差 = 直し.get(狙い ? `node:${node.id}` : `keep:${node.id}`) ?? { x: 0, y: 0 };
      node.posX = (狙い ?? 留める)!.x - 差.x;
      node.posY = (狙い ?? 留める)!.y - 差.y;
    }
  };
  /** 狙いと実際の差。 縦列を固定する時は、ずらさない縦列と箱も元の位置に居るかを見る */
  const 測る = (): Map<string, { x: number; y: number }> => {
    const 後 = layout(diagram);
    const 差 = new Map<string, { x: number; y: number }>();
    for (const n of 後.nodes) {
      const 狙い = 箱の狙い.get(n.id);
      if (狙い) 差.set(`node:${n.id}`, { x: n.cx - 狙い.x, y: n.cy - 狙い.y });
      const 留める = 留める位置.get(n.id);
      if (留める) 差.set(`keep:${n.id}`, { x: n.cx - 留める.x, y: n.cy - 留める.y });
    }
    if (縦列を固定する) {
      for (const l of 後.lanes) {
        const laid = 縦列の配置.get(l.id);
        if (!laid) continue;
        const 狙い = 縦列の狙い.get(l.id) ?? { x: laid.x ?? 0, y: laid.y ?? 0 };
        差.set(`lane:${l.id}`, { x: (l.x ?? 0) - 狙い.x, y: (l.y ?? 0) - 狙い.y });
      }
    }
    return 差;
  };
  const ずれた = (差: { x: number; y: number } | undefined): boolean =>
    差 !== undefined && (Math.abs(差.x) > PLACEMENT_TOLERANCE || Math.abs(差.y) > PLACEMENT_TOLERANCE);

  const 直し = new Map<string, { x: number; y: number }>();
  書く(直し);
  let 差 = 測る();
  // 手順 3。 狙いからの差を書いた位置から引いて置き直す。 固定した相手の差は図種ごとに一定なので
  // 1 度で合う。 基準から動いた箱はその回に初めて固定し、固定で出る差をもう 1 度で直す。
  //
  // **ずらす箱と縦列そのものの差 (`node:` / `lane:`) を直す入力は組めていない** (#1971 の実測)。
  // 縦列だけを固定していた形では `topology` / `c4` の縦列が縦に 32 ずれたが、中の箱も固定する今の形
  // ではずれない。 試した形 = 7 図種の箱 / 全ての縦列を 1 本ずつ / 箱の無い縦列。 実際に直すのは
  // 留める箱 (`keep:`) で、最初の縦列を縦にずらした図が通る
  for (let 回 = 0; 回 < 2 && [...差.values()].some(ずれた); 回++) {
    for (const [k, v] of 差) {
      if (!ずれた(v)) continue;
      const id = k.slice(k.indexOf(":") + 1);
      if (k.startsWith("keep:") && !留めた箱.has(id)) {
        留めた箱.add(id);
        continue;
      }
      const 前の直し = 直し.get(k) ?? { x: 0, y: 0 };
      直し.set(k, { x: 前の直し.x + v.x, y: 前の直し.y + v.y });
    }
    書く(直し);
    差 = 測る();
  }

  const 戻す箱 = (t: ずらしの相手): void => {
    for (const b of t.箱) {
      const node = diagram.nodes.find((n) => n.id === b.id)!;
      const 元 = 元の箱.get(b.id)!;
      node.posX = 元.posX;
      node.posY = 元.posY;
    }
  };
  const 知らせる = (t: ずらしの相手): void =>
    onNotice?.({
      kind: "position-offset-ignored",
      actor: t.名前,
      line: t.line,
      message: `"${truncateForMessage(t.名前)}" の位置のずらしは type: ${doc.type} の図では書いた量だけ動かせません`,
      hint: "ずらしを外すか、座標 (`位置: 300,200`) で置く",
    });

  // **ここから下の「戻して知らせる」 経路に届く入力は組めていない** (#1971 の実測)。 描画側は
  // `posX` / `posY` を書いた箱と縦列をそのまま置き、囲いの縦列のずれも 1 度の直しで合う。 試した
  // 形 = 大きく正と負にずらす / 図の広さを固定してその外へ出す / 7 図種の箱 / 囲いを持つ 2 図種と
  // クラス図と横長の図の縦列。 描画側が置いた位置を動かす規則を持った時に備えて残す
  //
  // 縦列が 1 本でも狙いに置けないか、ずらさない箱を留められなければ、全ての固定を戻して全ての相手を
  // 知らせる。 縦列を 1 本だけ残すと他が詰め直され、箱の狙いは縦列のずらしを含むので、縦列を戻すと
  // 箱の狙いも崩れる
  if ([...差].some(([k, v]) => (k.startsWith("lane:") || k.startsWith("keep:")) && ずれた(v))) {
    for (const lane of diagram.lanes) {
      const 元 = 元の縦列.get(lane.id);
      if (!元) continue;
      lane.posX = 元.posX;
      lane.posY = 元.posY;
      lane.posW = 元.posW;
      lane.posH = 元.posH;
    }
    for (const node of diagram.nodes) {
      if (!留めた箱.has(node.id)) continue;
      const 元 = 元の箱.get(node.id)!;
      node.posX = 元.posX;
      node.posY = 元.posY;
    }
    for (const t of 相手たち) {
      戻す箱(t);
      知らせる(t);
    }
    return;
  }
  for (const t of 相手たち) {
    if (!t.箱.some((b) => ずれた(差.get(`node:${b.id}`)))) continue;
    戻す箱(t);
    知らせる(t);
  }
}

/**
 * 全図種共通の後処理で、 登場人物に書かれた色を対応する箱に載せる。
 *
 * 箱を作る経路は図種ごとに違い、 cdl の preset を経由する図種 (流れ図 / ER / 状態遷移 / 構成図)
 * では preset の入力型が色の項目を持たない。 箱が出来上がった後に id で対応付けることで、
 * どの図種でも同じ書き方が効く。 座標を伝播する `applyCanvasPivotPositions` と同じ経路。
 *
 * 対応付けは箱に表示される名前との一致で行う。 id は使わない。
 *
 * **表示される名前は `箱の題` が決める** (#2333)。 `actor.name` と直接比べていた間、
 * **題 (`title`) を書いた箱の色が黙って消えていた** = 題を書くと箱に出るのは題なので、
 * 名前と比べた照合が外れる。 実測で箱になる 7 図種のうち 5 図種 (流れ図 / 構成図 /
 * 状態遷移 / クラス図 / ER 図) が落ちており、知らせも出ないため「書いたのに色が付かない」
 * だけが残った。
 *
 * **呼ぶ位置も合わせて決まる**。 題が箱に入る時点は図種で 2 つに割れ、帯図と c4 は登場人物の
 * 名前で箱を作って `applyV05Extensions` が後から題へ書き換える。 そのため本関数は書き換えの
 * 後に呼ぶ (呼出側の説明が SSOT)。 前に呼んだまま照合だけを題へ寄せると、今度はその 2 図種で
 * 色が落ちる (実測)。
 *
 * 題を持たない箱 (始まりと終わりの印、順序図の間隔用) は `箱の題` が空を返す。
 * 空のまま照合すると同じく空の別の箱を巻き込むので、空は対象から外す。
 *
 * id での対応付けは 2 通りに壊れる。 id は名前を slug に変換して作るが、 その変換規則が
 * dragon と cdl で違い、 記号を含む名前では一致しない (実測 = `A_B` が dragon 側で `a_b`、
 * cdl 側で `a-b`)。 逆に、 生成した id (`{slug}-header`) をそのまま名前に持つ登場人物が
 * 居ると、 別人の箱を巻き込む。
 *
 * 表示名は変換を経ないので前者が起きず、 別人と一致しないので後者も起きない。 順序図で
 * 1 人が分かれる複数の箱のうち、 間隔用と手順ごとの anchor は表示名が空なので自然に対象外に
 * なる (色を持っても幅 2 で見えない)。
 *
 * parts は対象外。 parts の `tone` は色ではなく状態の上書きとして parser が扱うため、
 * ここに色として渡ってこない。
 */
export function applyNodeTones(diagram: CdlDiagram, doc: DslDocument): void {
  for (const actor of doc.actors) {
    if (actor.tone === undefined) continue;
    const 題 = 箱の題(actor);
    if (題 === "") continue;
    for (const node of diagram.nodes) {
      if (node.title === 題) node.tone = actor.tone;
    }
  }
}

/**
 * canvas pivot 新 spec = 全 preset 共通の post-process で actor.posX/Y/W/H を CDL 側 lane / node に伝播。
 * preset builder が生成した diagram に対して、 doc.actors の 4 field を絶対座標として反映する。
 * slugify で actor 名 → lane id / node id の逆引き、 posX/Y set 済 actor に対応する lane / node に
 * 座標を書込む。 未指定 actor は従来 auto layout 経路そのまま。
 *
 * **知らせは出さない**。 かつて `sub-node-not-found` を出していたが、 その知らせが見ていた
 * `nodes` の欄を #1976 で外した時に出し所が消えた。 知らせる相手が戻った時に引数を足す。
 */
export function applyCanvasPivotPositions(diagram: CdlDiagram, doc: DslDocument): void {
  for (const actor of doc.actors) {
    if (actor.partId !== undefined) continue; // parts actor は別経路 (mergePartsFromActors) で処理
    const aliasSlug = slugify(actor.name);
    // actor 全体 posX/Y = lane と単一 node に一括反映 (従来経路)
    if (actor.posX !== undefined && actor.posY !== undefined) {
      for (const lane of diagram.lanes) {
        if (lane.id === aliasSlug || lane.id === actor.name) {
          lane.posX = actor.posX;
          lane.posY = actor.posY;
          if (actor.posW !== undefined) lane.posW = actor.posW;
          if (actor.posH !== undefined) lane.posH = actor.posH;
        }
      }
      for (const node of diagram.nodes) {
        if (node.id === aliasSlug || node.id === actor.name) {
          node.posX = actor.posX;
          node.posY = actor.posY;
          if (actor.posW !== undefined) node.posW = actor.posW;
          if (actor.posH !== undefined) node.posH = actor.posH;
        }
      }
    }
  }
}

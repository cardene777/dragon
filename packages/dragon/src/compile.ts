/**
 * AST (DslDocument) → 既存 preset API 経由 → LaidDiagram
 *
 * v0.3 ... アニメーション ブロック full compile 対応 (sequence preset のみ、 他 preset は v0.4 で順次)
 *   - state / tween / set / highlight / badge / body を実 phase に注入
 *   - アニメーション ありなら builder 直接経路 ... preset の標準 phase を置換
 *   - アニメーション なしは v0.2 と同じく preset 経由
 *
 * v0.2 ... 6 preset 全対応 (sequence / flow / swimlane / er / state / topology)
 */

import type { DslDocument, DslPhase } from "./types";
import type { CdlDiagram, ErRelationCardinality, LaidDiagram } from "@cardenelabs/cdl";
import {
  sequence, flow, swimlane, er, stateMachine, topology, diagram, layout,
  rendersRows, requiredRowsHeight, requiredRowsWidth, NODE_KINDS,
} from "@cardenelabs/cdl";
import { parseFocusEntry } from "./focus";
import { isColorValue, stripExternalPaint } from "./color";
import {
  MAX_INPUT_ELEMENTS,
  countDiagramElements,
  countDocElements,
  describeOversize,
} from "./input-size";
import {
  orderByDependency,
  resolveRelativePos,
  type AnchorBox,
  type RelativeDirection,
} from "./relative-pos";

export interface CompileToCdlOpts {
  /**
   * CAR-1657 = parts identifier lookup catalog、 caller (CdlEditor / test) が inject。
   * DslActor.partId が set された actor を検出したら partsCatalog[partId] から CdlDiagram を
   * lookup + mergePartIntoDiagram で target に統合。 未渡し時は parts kind actor を skip + warn。
   */
  partsCatalog?: Record<string, CdlDiagram>;
  /**
   * 組み立ての途中で分かった「書いたのに効かなかったこと」 の受け取り口。
   *
   * 図は出せるので誤りにはしないが、 黙って捨てると書いた人が理由を追えない。 editor は
   * これを受けて画面に出す。 判定は組み立て側だけが持ち、 画面側は表示に徹する。
   */
  onNotice?: (notice: CompileNotice) => void;
  /**
   * edge が DSL のどの行から来たかの受け取り口 (#998)。
   *
   * preset によっては書いた step と生成される edge が一致しない (`type: flow` は actor を鎖状に
   * 繋ぐため `a -> c` と書いても `a -> b` になる)。 edge を起点に本文の行を直す機能は、 この
   * 対応が無いと別の行を書き換える。
   *
   * **対応が取れない edge については呼ばれない**。 「対応が無い」 と「行 0」 を区別するため。
   */
  onEdgeSource?: (edgeId: string, line: number) => void;
}

/** 図は出せるが書いた通りにならなかった、 という知らせ。 */
export type CompileNotice = {
  kind:
    | "relative-position-ignored"
    | "focus-target-missing"
    | "state-override-rejected"
    | "external-paint-dropped"
    // 図の中に描く部品を持たない見本を重ねた (#1017)
    | "part-not-drawn";
  /** 対象の名前。 光らせる相手なら書かれた指定そのまま */
  actor: string;
  /** 書かれていた行 */
  line: number;
  message: string;
  hint?: string;
};

export function compileToCdl(doc: DslDocument, opts?: CompileToCdlOpts): CdlDiagram {
  // 大きすぎる図は組み立てない (#1005)。 組み立てにかかる時間は要素数の 2 乗で伸び、
  // 待機の後に同じ流れの中で走るため、 貼ってしまうと画面が戻らない (実測 = 10,000 要素で 7.6 秒)。
  // 両方の記法がここを通るので、 入口ごとに置かずここで 1 度だけ見る
  const oversize = describeOversize({ elements: countDocElements(doc), bytes: 0 });
  if (oversize) throw new Error(oversize);

  let diagram: CdlDiagram;
  switch (doc.type) {
    case "sequence":
      diagram = compileSequence(doc);
      break;
    case "flow":
      diagram = compileFlow(doc);
      break;
    case "swimlane":
      diagram = compileSwimlane(doc);
      break;
    case "er":
      diagram = compileEr(doc);
      break;
    case "state":
      diagram = compileState(doc);
      break;
    case "topology":
      diagram = compileTopology(doc);
      break;
    case "solidity":
      diagram = compileSolidity(doc);
      break;
    case "gantt":
      diagram = compileGantt(doc);
      break;
    case "class":
      diagram = compileClass(doc);
      break;
    case "pie":
      diagram = compilePie(doc);
      break;
    case "c4":
      diagram = compileC4(doc);
      break;
    case "mind":
      diagram = compileMind(doc);
      break;
    default:
      // switch case で全 type を網羅済のため default は unreachable、 template expression で
      // never 型を直接埋込めないので String() で明示 (defensive runtime error message 用)。
      throw new Error(`unknown type: ${String(doc.type)}`);
  }
  // edge と本文の行の対応は表に集めてから 1 edge = 1 回で知らせる (#998)。 経路ごとに
  // その場で呼ぶと、 同じ edge に別の行を 2 度知らせることになる。
  const edgeSourceLines = opts?.onEdgeSource ? new Map<string, number>() : undefined;
  applyEdgeInlineOptions(diagram, doc, edgeSourceLines);
  // `type: flow` は actor を鎖状に繋ぐため上の (from, to) 一致では取れない。 preset の規則で埋める。
  if (edgeSourceLines) fillFlowEdgeSources(diagram, doc, edgeSourceLines);
  applyGroupContainers(diagram, doc);
  applyNodeTones(diagram, doc);
  // 光らせる相手が実在するかを確かめる。 id への解決は図種ごとに違うが、 名前が居るか
  // 居ないかは記述だけで決まるので 1 か所で見る
  reportMissingFocusTargets(doc, opts?.onNotice);
  // `位置: Web の右` を実際の配置から絶対座標に直す。 以降は座標を直接書いた時と同じ経路
  const placed = resolveRelativeDoc(diagram, doc, opts?.onNotice, opts?.partsCatalog);
  // canvas pivot 新 spec = 全 preset 共通の post-process で actor.posX/Y を CDL lane / node に伝播
  applyCanvasPivotPositions(diagram, placed);
  // CAR-1657 = parts kind actor を merge (opts.partsCatalog 経由)、 applyV05Extensions 後段で実行
  const extended = applyV05Extensions(diagram, placed);
  const merged = mergePartsFromActors(extended, placed, opts?.partsCatalog, opts?.onNotice);
  // 表が揃ってから 1 edge = 1 回で知らせる。 merge 後に残っている edge だけを対象にする =
  // 途中で消えた edge の行を知らせても呼出側が使えない。
  if (edgeSourceLines && opts?.onEdgeSource) {
    const alive = new Set(merged.edges.map((e) => e.id));
    for (const [id, line] of edgeSourceLines) {
      if (alive.has(id)) opts.onEdgeSource(id, line);
    }
  }
  // 図の外を指す値を、 色を塗る位置から落とす (#1004)。
  //
  // 入口ごとに塞ぐ形は採らない。 状態の上書き / phase が入れる値 / 画面が直接書く背景色 /
  // 埋め込んだ JSON と入口が 4 つ以上あり、 1 つ見落とすと穴が残る。 描画へ渡る図は必ず
  // ここを通るので、 出口で 1 度だけ見る。
  for (const dropped of stripExternalPaint(merged)) {
    opts?.onNotice?.({
      kind: "external-paint-dropped",
      actor: dropped.path,
      line: 0,
      message: `図の外を指す値 (${truncateForMessage(dropped.value)}) は色として使えないため外しました`,
      hint: "色は `#ff0000` のような色番号か、 `red` のような色名で書く",
    });
  }
  return merged;
}

/** 知らせに載せる値を短く切る。 長い URL をそのまま出すと画面の帯が読めなくなる */
function truncateForMessage(v: string): string {
  const s = v.trim();
  return s.length <= 40 ? s : `${s.slice(0, 37)}...`;
}

/**
 * 光らせる相手 (`focus:`) が実在しない分を知らせる。
 *
 * 名前が当たらなかった指定は静かに消える。 光らせたい相手を書いたのに光らない状態が、
 * 手掛かりなしで起きる。
 *
 * 見るのは記述だけ。 id の形は図種で違うが、 「その名前の箱が居るか」「その矢印が流れに
 * あるか」 は書かれた内容だけで決まる。 図種ごとの解決経路に検査を分けると、 経路が増える
 * たびに検査が取り残される。
 */
function reportMissingFocusTargets(
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
): void {
  if (!onNotice || !doc.animate) return;
  const names = new Set(doc.actors.map((a) => a.name));
  // 解決側は名前が見つからない時に slug へ落とす。 受理集合もそれに合わせる。
  // 合わせないと、 実際は光る指定 (`API Gateway` を `api-gateway` と書いた形) を
  // 「見つかりません」 と誤報する (実測)
  //
  // 2 つ以上の名前が同じ slug になる時は受理しない。 解決側も曖昧として光らせないため、
  // 受理すると「知らせは出ないのに何も光らない」 状態になる (実測)
  const accepted = new Set(names);
  const slugCount = new Map<string, number>();
  for (const n of names) {
    const sl = slugify(n);
    slugCount.set(sl, (slugCount.get(sl) ?? 0) + 1);
  }
  for (const [sl, count] of slugCount) if (count === 1) accepted.add(sl);
  //
  // 縦列の id は受理しない。 3 つの解決経路はいずれも縦列を光らせないため、 受理すると
  // 「知らせは出ないのに何も光らない」 状態を作る (実測 = `focus: [main]` で activate が空)
  // 矢印は流れに書かれた組合せだけを認める。 名前に空白を含められる (`決済 基盤`) ため、
  // 連結した 1 本の鍵にはしない (`"a b" -> "c"` と `"a" -> "b c"` が同じ鍵になる)
  const steps = new Map<string, Set<string>>();
  for (const st of doc.flow) {
    const tos = steps.get(st.from) ?? new Set<string>();
    tos.add(st.to);
    steps.set(st.from, tos);
  }

  for (const phase of doc.animate.phases) {
    for (const raw of phase.highlight ?? []) {
      const entry = parseFocusEntry(raw, names);
      const found =
        entry.kind === "edge"
          ? (steps.get(entry.from)?.has(entry.to) ?? false)
          : accepted.has(entry.name);
      if (found) continue;
      onNotice({
        kind: "focus-target-missing",
        actor: raw,
        line: phase.pos.line,
        message:
          entry.kind === "edge"
            ? `光らせる矢印が流れにありません: "${raw}"`
            : `光らせる相手が見つかりません: "${raw}"`,
        hint:
          entry.kind === "edge"
            ? "flow: に書いた矢印と同じ向きで書く"
            : `actors: に書かれている名前 = ${[...names].join(", ")}`,
        // 縦列の id は受理しないので、 その旨は hint に出さない (光らせられないため)
      });
    }
  }
}

/**
 * 相対で書かれた位置 (`位置: Web の右 200`) を絶対座標に直した doc を返す。
 *
 * 基準の実座標は配置を 1 度計算しないと分からない。 cdl の `layout` を呼んで測り、
 * 基準の縁から間隔を空けた位置を求める。 元の doc は書き換えず、 座標を入れた複製を返す。
 *
 * 相対指定が 1 件も無ければ何もしない。 配置計算は 1 回 1ms 前後かかるので、 使っていない
 * 図に負担をかけない。
 */
function resolveRelativeDoc(
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
 * 書いた通りに置けたと見なす誤差。
 *
 * 補正が効いた図種では実測 0.0 で一致する。 効かない向き (順序図の縦) は数百ずれるので、
 * その間で切る。 丸めと配置計算の揺れを吸収する幅として 1 を取る。
 */
const PLACEMENT_TOLERANCE = 1;

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

/**
 * 全図種共通の後処理で、 登場人物に書かれた色を対応する箱に載せる。
 *
 * 箱を作る経路は図種ごとに違い、 cdl の preset を経由する図種 (流れ図 / ER / 状態遷移 / 構成図)
 * では preset の入力型が色の項目を持たない。 箱が出来上がった後に id で対応付けることで、
 * どの図種でも同じ書き方が効く。 座標を伝播する `applyCanvasPivotPositions` と同じ経路。
 *
 * 対応付けは箱に表示される名前との一致で行う。 id は使わない。
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
function applyNodeTones(diagram: CdlDiagram, doc: DslDocument): void {
  for (const actor of doc.actors) {
    if (actor.tone === undefined) continue;
    for (const node of diagram.nodes) {
      if (node.title === actor.name) node.tone = actor.tone;
    }
  }
}

/**
 * canvas pivot 新 spec = 全 preset 共通の post-process で actor.posX/Y/W/H を CDL 側 lane / node に伝播。
 * preset builder が生成した diagram に対して、 doc.actors の 4 field を絶対座標として反映する。
 * slugify で actor 名 → lane id / node id の逆引き、 posX/Y set 済 actor に対応する lane / node に
 * 座標を書込む。 未指定 actor は従来 auto layout 経路そのまま。
 */
function applyCanvasPivotPositions(diagram: CdlDiagram, doc: DslDocument): void {
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
    // canvas pivot UX 修正 (B1) = actor.nodes[subKey] を対応 CDL node に個別反映。
    // sub-node id pattern を actor scope 限定の 2 経路に絞る (subagent review MAJOR-1 対応、 CAR-canvas-pivot):
    //   1. `{aliasSlug}-{subKey}` = header / footer / spacer 等 suffix
    //   2. `{subKey}-{aliasSlug}` = sequence step box `s{N}-{aliasSlug}` 等 prefix
    // 旧 `node.id === subKey` 完全一致 fallback は actor scope を持たず cross-actor pollution risk
    // (別 actor が保有する同名 id node に座標が漏れる silent bug) のため削除。 全 sub-node は必ず
    // aliasSlug を接頭 / 接尾に含む形式で生成されるため、 2 経路で網羅済。
    // lane 側は触らない = 他 sub-node の auto layout 経路を保持 (B1 独立性の SSOT)。
    if (actor.nodes) {
      for (const [subKey, override] of Object.entries(actor.nodes)) {
        if (override.posX === undefined || override.posY === undefined) continue;
        for (const node of diagram.nodes) {
          if (
            node.id === `${aliasSlug}-${subKey}` ||
            node.id === `${subKey}-${aliasSlug}`
          ) {
            node.posX = override.posX;
            node.posY = override.posY;
            if (override.posW !== undefined) node.posW = override.posW;
            if (override.posH !== undefined) node.posH = override.posH;
          }
        }
      }
    }
  }
}

/**
 * catalog からパーツ 1 個の図を引く。
 *
 * `Object.hasOwn` で引く。 素の添字だと `__proto__` 等の既定の持ち物が引けてしまう
 * (catalog は呼出側が渡す untrusted な値)。
 */
function lookupPart(
  partsCatalog: Record<string, CdlDiagram>,
  partId: string | undefined,
): CdlDiagram | undefined {
  if (typeof partId !== "string" || partId.length === 0) return undefined;
  if (Object.hasOwn(partsCatalog, partId)) return partsCatalog[partId];
  if (Object.hasOwn(partsCatalog, `parts-${partId}`)) return partsCatalog[`parts-${partId}`];
  return undefined;
}

/**
 * 箱の大きさを書かなかった時に cdl が使う値。
 *
 * 幅は実測で 340 固定 (縦列の幅を変えても変わらない)。 高さは種類で変わるため、 よく使われる
 * 値を既定にする。 パーツの図が大きさを書いていれば、 こちらは使われない。
 */
const CDL_DEFAULT_NODE_W = 340;
const CDL_DEFAULT_NODE_H = 200;

/** 有限で正の数だけを通す。 catalog は呼出側が渡す値なので、 異常値を計算に入れない。 */
function positiveOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * 配列の最大値 / 最小値。 spread で展開しない (要素数が多い catalog で stack が溢れる)。
 *
 * 空の時だけ既定値を返す。 既定値を初期値にすると、 全要素が既定値より小さい (大きい) 時に
 * 存在しない値を範囲に含める (実測 = stack 5 だけのパーツで 0 を含め、 高さが 5 段分になった)。
 */
function maxOf(values: readonly number[], fallback: number): number {
  if (values.length === 0) return fallback;
  let out = values[0]!;
  for (const v of values) if (v > out) out = v;
  return out;
}

function minOf(values: readonly number[], fallback: number): number {
  if (values.length === 0) return fallback;
  let out = values[0]!;
  for (const v of values) if (v < out) out = v;
  return out;
}

/**
 * merge がパーツを縦に送る幅。 `mergePartIntoDiagram` の `STACK_PITCH_APPROX` と同じ値。
 *
 * 大きさの見積りは merge が実際に置く形と揃える。 別の規則で見積ると、 間隔が狂う
 * (実測 = 2 段のパーツで 200 空けたいところが 90 になった)。
 */
const PART_STACK_PITCH = 220;

/**
 * `大きさ:` を書いた時に、見本を何倍にするか (#1018)。
 *
 * 横は縦列の幅、縦は段の数から出す。 どちらも書かなければ 1 倍。
 *
 * **縦は「書いた高さにする」 ではなく「段の送り幅の合計に対する倍率」**。 `大きさ: 2000,300` を
 * 1 段の見本に書くと、横は 2000 になるが縦は 300 ではなく 409 になる (段の送り幅 220 に対して
 * 300 なので 1.36 倍、それが箱の高さ 300 に掛かる)。 意図した仕様かは怪しいが、既に本文が
 * この前提で書かれているため変えない。 画面側も同じ規則で拡大する。
 *
 * 組み立て側 (`partExtent`) と画面側 (playground) の両方から呼ぶ。 別々に持つと、`大きさ:` を
 * 書いた見本だけ経路で大きさが変わる。
 */
export function partTargetScale(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { x: number; y: number } {
  const none = { x: 1, y: 1 };
  if (!Array.isArray(part.lanes) || !Array.isArray(part.nodes)) return none;
  // 箱が 1 つも無い図でも縦列があれば取り込み側は伸縮する。 ここで 1 に倒すと、
  // 箱を持たない外部の見本だけ画面が等倍のまま残る

  let x = 1;
  if (targetW !== undefined && targetW > 0) {
    const lefts: number[] = [];
    const rights: number[] = [];
    for (const l of part.lanes) {
      const lx = typeof l.x === "number" && Number.isFinite(l.x) ? l.x : 0;
      const lw = positiveOr(l.width, 400);
      lefts.push(lx);
      rights.push(lx + lw);
    }
    const bboxW = positiveOr(maxOf(rights, 400) - minOf(lefts, 0), 400);
    x = targetW / bboxW;
  }

  let y = 1;
  if (targetH !== undefined && targetH > 0) {
    const stacks = part.nodes.map((n) =>
      typeof n.stack === "number" && Number.isFinite(n.stack) ? n.stack : 0,
    );
    const origH = Math.max(1, (maxOf(stacks, 0) - minOf(stacks, 0) + 1) * PART_STACK_PITCH);
    y = targetH / origH;
  }

  return {
    x: Number.isFinite(x) && x > 0 ? x : 1,
    y: Number.isFinite(y) && y > 0 ? y : 1,
  };
}

/**
 * パーツ 1 個が図の上で占める外接矩形。
 *
 * `w` / `h` は大きさ、 `dx` / `dy` は矩形の中心が「merge に渡す座標」 からどれだけずれるか。
 *
 * merge がパーツを置く時に基準にするのは段の中心で、 外接矩形の中心とは一致しない。 段ごとに
 * 箱の高さが違うと、 上下の伸び方が非対称になるため (実測 = 段 0 に高さ 50、 段 5 に高さ 200 の
 * パーツで中心が 37.5 下にずれる)。 ずれを返して呼ぶ側が引く。
 *
 * 箱ごとに位置と大きさを見る。 一番高い箱の高さと段の数から概算すると実際の矩形と合わない
 * (実測 = 段 5 だけのパーツで 200 空けたいところが 750、 段 0,5 で高さが違うと 275 になった)。
 *
 * 段の送り幅は merge の近似 (`PART_STACK_PITCH`) を使う。 パーツを自分の図として配置計算した
 * 実寸とは段を持つパーツで 3% ほど違うが (実測 = 3 段で実高 620 に対して 640)、 ここで見たいのは
 * 「merge がどこに置くか」 なので merge の規則に合わせる。
 */
function partExtent(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { w: number; h: number; dx: number; dy: number } {
  const fallback = { w: 400, h: 200, dx: 0, dy: 0 };
  if (!Array.isArray(part.lanes) || !Array.isArray(part.nodes)) return fallback;
  if (part.nodes.length === 0) return fallback;

  // 縦列の位置と幅を先に正す。 catalog は呼出側が渡す値なので、 数でない値を計算に入れない
  const lanes = new Map<string, { x: number; w: number }>();
  const laneLefts: number[] = [];
  const laneRights: number[] = [];
  for (const l of part.lanes) {
    const x = typeof l.x === "number" && Number.isFinite(l.x) ? l.x : 0;
    const w = positiveOr(l.width, 400);
    lanes.set(l.id, { x, w });
    laneLefts.push(x);
    laneRights.push(x + w);
  }
  const bboxW = positiveOr(maxOf(laneRights, 400) - minOf(laneLefts, 0), 400);
  const bboxCenterX = minOf(laneLefts, 0) + bboxW / 2;
  const { x: scaleX, y: scaleY } = partTargetScale(part, targetW, targetH);

  const stacks = part.nodes.map((n) =>
    typeof n.stack === "number" && Number.isFinite(n.stack) ? n.stack : 0,
  );
  const maxStack = maxOf(stacks, 0);
  const minStack = minOf(stacks, 0);
  const centerStack = (minStack + maxStack) / 2;

  // 箱ごとに、 merge が置く位置 (基準からの相対) と大きさから上下左右の端を出す
  const tops: number[] = [];
  const bottoms: number[] = [];
  const lefts: number[] = [];
  const rights: number[] = [];
  part.nodes.forEach((n, i) => {
    const lane = lanes.get(n.lane) ?? { x: 0, w: 320 };
    const cx = (lane.x + lane.w / 2 - bboxCenterX) * scaleX;
    const cy = ((stacks[i] ?? 0) - centerStack) * PART_STACK_PITCH * scaleY;
    const halfW = (positiveOr(n.w, CDL_DEFAULT_NODE_W) * scaleX) / 2;
    const halfH = (positiveOr(n.h, CDL_DEFAULT_NODE_H) * scaleY) / 2;
    lefts.push(cx - halfW);
    rights.push(cx + halfW);
    tops.push(cy - halfH);
    bottoms.push(cy + halfH);
  });
  const x0 = minOf(lefts, 0);
  const x1 = maxOf(rights, 400);
  const y0 = minOf(tops, 0);
  const y1 = maxOf(bottoms, 200);

  return {
    w: positiveOr(x1 - x0, 400),
    h: positiveOr(y1 - y0, 200),
    dx: Number.isFinite((x0 + x1) / 2) ? (x0 + x1) / 2 : 0,
    dy: Number.isFinite((y0 + y1) / 2) ? (y0 + y1) / 2 : 0,
  };
}

/**
 * パーツ 1 個が実際に描かれる大きさ (#937)。
 *
 * 図枠 (`viewBox`) を返す。 箱の外接矩形 (`partVisualSize`) ではない。 2 つは別物で、
 * 実測では図枠 525x520 に対し箱 380x400 と余白の分だけ違う。 SVG は図枠を基準に
 * `preserveAspectRatio` で収めるため、 箱の値を渡すと縮んで描いた大きさと食い違う
 * (実測 = achievement が箱の値で描くと約 275x275 になった)。
 *
 * 箱を持たないパーツ (実体が操作パネルの部品である 17 件) でも図枠は出る。 箱だけを見ると
 * 1x1 になり、 その値で描くと潰れる。
 *
 * ただし **図枠は場所を確保するだけで、図の中に何か描かれることは保証しない**。 上の 17 件は
 * 図の中に描く部品を持たず、重ねても図には出ない (`partDrawsInDiagram`、#1017)。
 *
 * 画面が描く大きさと、 組み立て側の格子が確保する場所の両方がこれを見る。 別々の物差しを
 * 持っていた頃は、 同じ本文でも通った経路でパーツの位置が変わっていた (#937)。
 *
 * 組み立てに失敗する図では、 既定の大きさに落とす (呼出側は catalog を渡すので通常起きない)。
 */
export function partRenderSize(part: CdlDiagram): { w: number; h: number } {
  const g = partFrameGeometry(part);
  return { w: g.w, h: g.h };
}

/**
 * この見本が、図の中に描かれる部品を持っているか (#1017)。
 *
 * 見本の中には実体が **操作パネルの部品** (`readouts`) だけのものがある。 配置計算も描画も
 * `readouts` を図の中では扱わないため、図として重ねても何も出ない。 位置決めのための
 * 1x1 の箱が 1 つあるだけになる。
 *
 * catalog 80 件を測ると、この 2 群は `readouts` の有無で完全に分かれた。
 * `readouts` を持つ 17 件は箱と図枠の面積比が全件 0.0000 (箱は 1x1)、
 * 持たない 63 件は最小でも 0.1877。 境目に入る件は無い。
 *
 * 判定は面積の閾値ではなく **`readouts` を持ち、かつ箱が図枠に対して極小** の 2 条件で行う。
 * 閾値だけで見ると、小さい箱を意図して置いた見本を巻き込む。 `readouts` だけで見ると、
 * 箱も実体も両方持つ見本 (現状 0 件だが作れる) を誤って弾く。
 *
 * 測れない図では「持っている」 側に倒す。 弾く側に倒すと、測れないだけの見本が使えなくなる。
 */
export function partDrawsInDiagram(part: CdlDiagram): boolean {
  const readouts = (part as { readouts?: unknown }).readouts;
  if (!Array.isArray(readouts) || readouts.length === 0) return true;
  const g = partFrameGeometry(part);
  if (!(g.w > 0) || !(g.h > 0)) return true;
  // 箱が図枠の 1% にも満たなければ、実体は図の外にある。
  //
  // 比が出せない時は「持っている」 側に倒す。 桁の大きい図で面積を先に出すと
  // Infinity / Infinity = NaN になり、比較が常に false = 「描かない」 に倒れる
  // (実測 = 1e200 四方の図で、面積比 1 のはずが弾かれた)。
  //
  // 辺ごとに割ってから掛けるのは桁溢れを避けるため。 catalog の見本では上の判定と結果が
  // 変わらないので、これ自体は保険 (変異試験で差が出ないことを確認済)
  const ratio = (g.boxW / g.w) * (g.boxH / g.h);
  if (!Number.isFinite(ratio)) return true;
  return ratio >= 0.01;
}

/**
 * 図枠の中で、 箱の外接矩形がどこにどれだけの大きさで描かれるか (#1014)。
 *
 * `left` / `top` は図枠の左上からの余白、 `w` / `h` は箱の大きさ。 図枠は 1 対 1 で描かれるので、
 * 画面上の箱の位置は「図枠の左上 + `left`/`top`」 になる。
 *
 * 相対で書いた位置 (`位置: Web の右 200`) の間隔は、 見えている箱の縁から測る。 図枠の縁で
 * 測ると余白のぶんだけ広がる (実測 = 200 と書いて画面では 260 空いた)。 画面側が間隔を解く時に
 * 図枠ではなくこちらを使うことで、 組み立て側と同じ間隔になる。
 *
 * 測れない図では図枠と同じ大きさ・余白 0 を返す。 箱を持たない図でも同じで、 図枠がそのまま
 * 箱として扱われる。
 */
export function partBoxInFrame(part: CdlDiagram): {
  w: number;
  h: number;
  left: number;
  top: number;
} {
  const g = partFrameGeometry(part);
  return { w: g.boxW, h: g.boxH, left: g.left, top: g.top };
}

/**
 * 見本 1 個の図枠と、 その中の箱の外接矩形 (位置と大きさ)。
 *
 * 図枠の大きさ・余白・箱の大きさは同じ配置計算から出るので、 1 回で全部を取る。 別々に呼ぶと
 * 同じ図を何度も組み立てることになり、 パーツを 1 個置くたびに配置計算が 2 回走る。
 *
 * 結果は見本ごとに覚えておく。 catalog の見本は複数の別名から同じものを指すため、 覚えないと
 * 別名の数だけ組み立て直す (相対指定があると 1 個につき 4 回になる)。 覚えるのは大きさだけで、
 * 色などの見た目は含まないため、 呼出側が色を差し替えても古い値にはならない。
 *
 * 組み立てと違い画面を描くたびに呼ばれるので、 大きすぎる図は測る前に止める。 上限は
 * 組み立て側と同じ物差しを使う (#1005)。 catalog の見本は数十要素なので通常は掛からない。
 *
 * 測れない図では既定の大きさと余白 0 に落とす。
 */
type PartFrameGeometry = {
  w: number;
  h: number;
  left: number;
  top: number;
  boxW: number;
  boxH: number;
};

const PART_FRAME_CACHE = new WeakMap<CdlDiagram, PartFrameGeometry>();

function partFrameGeometry(part: CdlDiagram): PartFrameGeometry {
  const cached = PART_FRAME_CACHE.get(part);
  if (cached) return cached;
  const fallback = { w: 400, h: 200, left: 0, top: 0, boxW: 400, boxH: 200 };
  let out = fallback;
  if (countDiagramElements(part) <= MAX_INPUT_ELEMENTS) {
    try {
      const own = layout(part);
      const vb = own.viewBox;
      const w = positiveOr(vb.w, 400);
      const h = positiveOr(vb.h, 200);
      if (own.nodes.length === 0) {
        // 箱を持たない図では図枠をそのまま箱として扱う。 相対指定の間隔は図枠の縁から測る
        out = { w, h, left: 0, top: 0, boxW: w, boxH: h };
      } else {
        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;
        for (const n of own.nodes) {
          x0 = Math.min(x0, n.cx - n.w / 2);
          x1 = Math.max(x1, n.cx + n.w / 2);
          y0 = Math.min(y0, n.cy - n.h / 2);
          y1 = Math.max(y1, n.cy + n.h / 2);
        }
        const left = x0 - vb.x;
        const top = y0 - vb.y;
        out = {
          w,
          h,
          left: Number.isFinite(left) ? left : 0,
          top: Number.isFinite(top) ? top : 0,
          boxW: positiveOr(x1 - x0, w),
          boxH: positiveOr(y1 - y0, h),
        };
      }
    } catch {
      out = fallback;
    }
  }
  PART_FRAME_CACHE.set(part, out);
  return out;
}

/**
 * パーツ 1 個が図の上で確保する図枠 (merge に渡す座標での表し方)。
 *
 * `w` / `h` は図枠の大きさ、 `dx` / `dy` は図枠の中心が「merge に渡す座標」 からどれだけ
 * ずれるか。 画面側は図枠をそのまま置くので、 格子が図枠で場所を決めれば 2 経路が揃う。
 *
 * **合わせるのは箱の中心ではなく左上**。 段を 2 つ以上持つパーツは、 取り込んだ後に本体の
 * 送り幅で並び直すため箱の高さが単体の時と変わる (実測 = 単体 300 が取り込むと 320)。
 * 中心で合わせると、 高さの差の半分だけ上端がずれて段内の揃いが崩れる (実測で 12.5)。
 * 左上で合わせれば、 高さが変わっても上端は動かない。
 *
 * 図枠にも箱にも `大きさ:` の伸縮を掛ける。 画面側も同じ率で伸縮するので、掛けないと
 * 確保する場所だけが元の大きさのまま残る (実測 = 240 ずれた、#1018)。
 *
 * 確保するのは図枠と箱の両方を含む矩形。 縦横で率が違うと箱が図枠からはみ出すことがあり、
 * 図枠だけを確保すると隣に重なる (実測 = `大きさ: 2000,300` の箱が x=60..2060 に伸び、
 * 隣が 725 から始まって 1335 重なった)。 `大きさ:` を書かなければ図枠が箱を包むので、
 * 和は図枠と一致して 2 経路の一致は保たれる。
 */
function partFrameExtent(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { w: number; h: number; dx: number; dy: number } {
  const box = partExtent(part, targetW, targetH);
  const geom = partFrameGeometry(part);
  // 図枠にも `大きさ:` の伸縮を掛ける。 掛けないと箱だけが伸びて、確保する場所が足りなくなる
  // (実測 = `大きさ: 2000,300` で組み立て側の箱が 60..2060、画面側が 300..2300 と 240 ずれた、#1018)
  const t = partTargetScale(part, targetW, targetH);
  const frame = {
    w: geom.w * t.x,
    h: geom.h * t.y,
    left: geom.left * t.x,
    top: geom.top * t.y,
  };
  // merge に渡す座標を原点にした時の、 図枠の中心
  const frameDx = box.dx + frame.w / 2 - frame.left - box.w / 2;
  const frameDy = box.dy + frame.h / 2 - frame.top - box.h / 2;
  const x0 = Math.min(frameDx - frame.w / 2, box.dx - box.w / 2);
  const x1 = Math.max(frameDx + frame.w / 2, box.dx + box.w / 2);
  const y0 = Math.min(frameDy - frame.h / 2, box.dy - box.h / 2);
  const y1 = Math.max(frameDy + frame.h / 2, box.dy + box.h / 2);
  return {
    w: positiveOr(x1 - x0, frame.w),
    h: positiveOr(y1 - y0, frame.h),
    dx: Number.isFinite((x0 + x1) / 2) ? (x0 + x1) / 2 : frameDx,
    dy: Number.isFinite((y0 + y1) / 2) ? (y0 + y1) / 2 : frameDy,
  };
}

/**
 * パーツ 1 個の箱の外接矩形。
 *
 * 図枠 (`partRenderSize`) とは別で、 余白を含まない。 相対指定を解く時の「縁からの距離」 に使う。
 */
export function partVisualSize(
  part: CdlDiagram,
  targetW?: number,
  targetH?: number,
): { w: number; h: number } {
  const e = partExtent(part, targetW, targetH);
  return { w: e.w, h: e.h };
}

/** 格子に並べる時の 1 行あたりの個数と隙間。 */
const PARTS_PER_ROW = 3;
const PARTS_GAP = 120;
/**
 * 既存の図の下に置く時の目安。
 *
 * 既存の箱は自動配置なので、 この時点では座標を持たない。 箱の数から概算する。
 * 1 段あたりの高さは cdl の既定の縦送り幅に合わせる。
 */
const STACK_PITCH = 280;

/**
 * 位置を書かなかったパーツを格子に並べた時の、 矩形の中心。
 *
 * 組み立て側 (`mergePartsFromActors`) と画面側 (playground の overlay) の両方から呼ぶ。
 * 別々に計算すると、 同じ本文でも経路によってパーツの位置が変わる。
 *
 * 列の送り幅は並べる全パーツの最大幅で揃える。 個々の幅で送ると、 幅の違うパーツが混ざった時に
 * 隣と重なる (実測 = 400 の次に 200 を置くと 280 重なった)。 段の高さも段内の最大高で揃える。
 * 縦は自分の高さの半分だけ段の上端から下げて、 段内で上端を揃える。
 *
 * @param baseNodeCount パーツ以外の箱の数。 既存の図の下から並べ始めるために使う
 */
export function partsGridCenters(
  baseNodeCount: number,
  items: ReadonlyArray<{ id: string; w: number; h: number }>,
): Map<string, { cx: number; cy: number }> {
  const out = new Map<string, { cx: number; cy: number }>();
  if (items.length === 0) return out;
  // 公開している関数なので、 呼出側が渡す値を入口で閉じる。 数でない箱の数や桁溢れを
  // そのまま計算に入れると、 描けない座標を返すことになる
  const safeCount =
    Number.isSafeInteger(baseNodeCount) && baseNodeCount >= 0 ? baseNodeCount : 0;
  const top = safeCount * STACK_PITCH + PARTS_GAP * 2;
  // 同じ名前が 2 度来たら先の方だけを見る。 後の分を残すと、 どちらを指したか決められない
  // まま列の送り幅にも影響する
  const seen = new Set<string>();
  const unique = items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
  const cellW = maxOf(
    unique.map((i) => positiveOr(i.w, 400)),
    400,
  );
  const rowTops: number[] = [];
  {
    let y = top;
    for (let i = 0; i < unique.length; i += PARTS_PER_ROW) {
      rowTops.push(y);
      const rowH = maxOf(
        unique.slice(i, i + PARTS_PER_ROW).map((x) => positiveOr(x.h, 200)),
        200,
      );
      y += rowH + PARTS_GAP;
    }
  }
  unique.forEach((item, i) => {
    const col = i % PARTS_PER_ROW;
    const row = Math.floor(i / PARTS_PER_ROW);
    const cx = col * (cellW + PARTS_GAP) + cellW / 2;
    const cy = (rowTops[row] ?? top) + positiveOr(item.h, 200) / 2;
    // 桁溢れした座標は描けない。 返さずに落として、 呼出側が自動配置に倒せるようにする
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
    out.set(item.id, { cx, cy });
  });
  return out;
}

/**
 * 位置を書かなかったパーツの、 merge に渡す座標。
 *
 * 格子の規則は `partsGridCenters` が持つ。 merge は矩形の中心を渡された座標に合わせるので、
 * 中心をそのまま渡す。
 */
function partGridCenters(
  target: CdlDiagram,
  doc: DslDocument,
  partsCatalog: Record<string, CdlDiagram>,
): Map<string, { cx: number; cy: number }> {
  const partsActors = doc.actors.filter((a) => a.partId !== undefined);
  // 格子に並ぶのは座標を 1 つも書かず相対でも書かなかった分だけ。
  //
  // merge 側は「縦横どちらも書かなかった時」 に格子へ落とす。 条件が食い違うと、 片方だけ
  // 書いたパーツが格子の枠を 1 つ消費して後続がずれる (実測 = 後続の中心が 200 から 720 に動いた)
  const autoActors = partsActors.filter(
    (a) => a.posX === undefined && a.posY === undefined && a.posRel === undefined,
  );
  if (autoActors.length === 0) return new Map();
  // パーツ自身の仮の箱は数えない。 この時点では未削除で残っており、 数えるとパーツを足すたびに
  // 置き場所が下へずれる。
  //
  // 名札 (`title`) だけを見ると、 順序図で 1 人につき作られる 3 つの箱のうち間隔用のものが
  // 漏れる (名札が空のため)。 パーツ 1 個につき 1 つ残り、 格子の起点が 1 段ぶん下がって
  // 画面側とずれていた (実測 = 縦が 840 = 3 段ぶん違った)。
  //
  // 属する列で特定するが、 列の id は名前を slug に変換して作るため名前とは一致しない
  // (実測 = `My Part` の列 id は `My-Part`)。 名前で引くと記号を含む名前だけ取りこぼす。
  // 列の `label` は slug の経路によらず名前の生値を持つので、 そちらで引く (§ merge の
  // 仮の箱の掃除が同じ方法を採っている)。
  //
  // どの列がパーツのものか決められない時は、 数から外さない。 外す側に倒すと本体の箱まで
  // 消えて、 パーツが本体の図に重なる (実測 = 同じ名前を本体とパーツの両方に書くと、
  // 上端が 1140 から 300 に飛んで本体の中に入った)。 外さなければ間隔が 1 段ぶん広がるだけで済む
  const otherActorNames = new Set(
    doc.actors.filter((a) => a.partId === undefined).map((a) => a.name),
  );
  // 本体にも同じ名前がある分は外さない。 名札でも列でも本体と区別できないため
  const partsActorNames = new Set(
    partsActors.map((a) => a.name).filter((n) => !otherActorNames.has(n)),
  );
  // 明示的に他の列へ張ったパーツは、 その列を専有していない (本体と共有している)
  const sharedLaneIds = new Set(
    partsActors.map((a) => a.lane).filter((l): l is string => l !== undefined),
  );
  const partsLaneIds = new Set<string>();
  for (const l of target.lanes) {
    if (l.label === undefined) continue;
    if (!partsActorNames.has(l.label)) continue;
    if (sharedLaneIds.has(l.id)) continue;
    partsLaneIds.add(l.id);
  }
  const baseNodes = target.nodes.filter(
    (n) => !partsActorNames.has(n.title) && !partsLaneIds.has(n.lane),
  );
  const extents = new Map<string, { w: number; h: number; dx: number; dy: number }>();
  for (const a of autoActors) {
    const part = lookupPart(partsCatalog, a.partId);
    if (!part) {
      extents.set(a.name, { w: 400, h: 200, dx: 0, dy: 0 });
      continue;
    }
    // 格子は図枠で決める。 画面側も図枠をそのまま置くので、 同じ物差しで並べれば
    // 2 経路の置き場所が揃う (#937)
    extents.set(a.name, partFrameExtent(part, a.posW, a.posH));
  }
  const centers = partsGridCenters(
    baseNodes.length,
    autoActors.map((a) => ({ id: a.name, ...extents.get(a.name)! })),
  );
  // merge に渡すのは段の中心。 矩形の中心とのずれを引く。 引かないと、 段ごとに箱の高さが
  // 違うパーツで段内の上端が揃わない (実測 = 対称なパーツの上端 520 に対して 507.5)
  const out = new Map<string, { cx: number; cy: number }>();
  for (const [name, c] of centers) {
    const e = extents.get(name)!;
    out.set(name, { cx: c.cx - e.dx, cy: c.cy - e.dy });
  }
  return out;
}

/**
 * パーツごとの外接矩形 (catalog 由来)。 相対指定を解く時に自分の大きさとして使う。
 *
 * `dx` / `dy` は矩形の中心と merge に渡す座標のずれ。 狙った中心から引いて座標にする。
 */
function partSizes(
  doc: DslDocument,
  partsCatalog: Record<string, CdlDiagram>,
): Map<string, { w: number; h: number; dx: number; dy: number }> {
  const out = new Map<string, { w: number; h: number; dx: number; dy: number }>();
  for (const a of doc.actors) {
    if (a.partId === undefined) continue;
    const part = lookupPart(partsCatalog, a.partId);
    if (part) out.set(a.name, partExtent(part, a.posW, a.posH));
  }
  return out;
}

/**
 * パーツの箱 (中心と大きさ)。 相対指定を解く時の基準として使う。
 *
 * 大きさは catalog の図から求める。 組み立て前の図に残っている仮の箱を測ると、 実際に
 * 描かれる大きさと違う値で間隔を計算することになる。
 */
function partBoxes(
  target: CdlDiagram,
  doc: DslDocument,
  partsCatalog: Record<string, CdlDiagram>,
): Map<string, AnchorBox> {
  const grid = partGridCenters(target, doc, partsCatalog);
  const out = new Map<string, AnchorBox>();
  for (const a of doc.actors) {
    if (a.partId === undefined) continue;
    const part = lookupPart(partsCatalog, a.partId);
    if (!part) continue;
    const size = partExtent(part, a.posW, a.posH);
    const placed =
      a.posX !== undefined && a.posY !== undefined
        ? { cx: a.posX, cy: a.posY }
        : grid.get(a.name);
    // 相対で書いた分はここでは決まらない (解決側が後で埋める)
    if (!placed) continue;
    // 渡す座標は段の中心。 矩形の中心はそこからずれる
    out.set(a.name, { cx: placed.cx + size.dx, cy: placed.cy + size.dy, w: size.w, h: size.h });
  }
  return out;
}

/**
 * CAR-1657 = doc.actors 中の partId set actor を検出、 partsCatalog から CdlDiagram を lookup、
 * mergePartIntoDiagram で target に prefix 付き統合する。 partsCatalog 未渡し or 該当 partId
 * 未登録なら warn を残して skip、 diagram render は継続 (壊さない設計)。
 */
function mergePartsFromActors(
  target: CdlDiagram,
  doc: DslDocument,
  partsCatalog?: Record<string, CdlDiagram>,
  onNotice?: (notice: CompileNotice) => void,
): CdlDiagram {
  const partsActors = doc.actors.filter((a) => a.partId !== undefined);
  if (partsActors.length === 0) return target;
  if (!partsCatalog) {
    if (typeof console !== "undefined" && console.warn) {
      const names = partsActors.map((a) => `${a.name} (kind: ${a.partId ?? "?"})`).join(", ");
      console.warn(`[dragon] parts kind actors detected but no partsCatalog provided: ${names}`);
    }
    return target;
  }
  // 位置を書かなかったパーツの置き場所は `partGridCenters` が決める。
  //
  // 以前はここで格子を組んでいたが、 相対指定を解く側も同じ位置を知る必要がある。
  // 別々に計算すると、 解決側が想定した位置と実際の置き場所がずれる。 規則を共有する。
  const gridCenters = partGridCenters(target, doc, partsCatalog);

  for (const actor of partsActors) {
    const partId = actor.partId;
    // codex-review CAR-1657 MAJOR fix (§ security) = partsCatalog は untrusted、 Object.hasOwn で
    // inherited property (`__proto__` 等) を除外する prototype pollution 対策。 `parts-` prefix 経路も
    // Object.hasOwn 経由で確認する。
    if (typeof partId !== "string" || partId.length === 0) continue;
    let part: CdlDiagram | undefined;
    if (Object.hasOwn(partsCatalog, partId)) {
      part = partsCatalog[partId];
    } else if (Object.hasOwn(partsCatalog, `parts-${partId}`)) {
      part = partsCatalog[`parts-${partId}`];
    }
    if (!part) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(`[dragon] parts kind "${partId}" not found in partsCatalog (actor: ${actor.name})`);
      }
      continue;
    }
    // codex-review MAJOR fix (§ sequence header/footer/spacer 削除) = preset (sequence 等) が生成した
    // parts actor 由来の node/edge を alias 経由で全削除する。 sequence は `{slug}-header / -spacer /
    // -footer / s{N}-{slug}` を生成、 slug prefix match で全 sweep。
    //
    // sweep に使う slug は 2 系統ある (#873)。 dragon の slugify は `_` / 全角を保持するが、 非 animate
    // sequence / solidity の node は cdl preset 側の slugify (`_` → `-` 置換、 NFKC なし) で生成される
    // ため、 dragon slug だけで sweep すると `arc_one` → 実 id `arc-one-header` を取りこぼし、 header /
    // footer (title = actor 名) が残って actor 名が多重表示される。
    //
    // seq-like preset は「actor 専用 lane に属する node」 を exact set で特定する経路を使う。
    // lane.label === actor.name で lane を引き当て (label は両 slug 経路とも actor.name 生値)、 その
    // lane に属する node (header / spacer / footer / step anchor は全て actor lane 所属) を node.lane で
    // 厳密収集する。 slug の prefix 推測を挟まないため、 slug 実装差の取りこぼしと、 別 actor を巻き込む
    // 誤削除 (parts actor `a_b` の lane id `a-b` が actor `a-b-c` の `a-b-c-header` に prefix match する)
    // の両方を同時に排除する。
    const aliasSlug = slugify(actor.name);
    const ownedLaneIds = new Set<string>();
    if (doc.type === "sequence" || doc.type === "solidity") {
      for (const l of target.lanes) {
        // 明示 lane mapping (actor.lane) 先は part の張替え先で actor 専用 lane ではないため除外
        if (actor.lane !== undefined && l.id === actor.lane) continue;
        if (l.label === actor.name) ownedLaneIds.add(l.id);
      }
    }
    const ownedNodeIds = new Set<string>();
    for (const n of target.nodes) {
      if (ownedLaneIds.has(n.lane)) ownedNodeIds.add(n.id);
    }
    // actor 専用 lane を引き当てられない経路 (flow / topology 等の共有 lane preset) は従来どおり dragon
    // slug の prefix match に fallback する。 これらは 1 actor = 1 node (id = slug) の生成規則。
    const matchesAliasSlug = (id: string): boolean => {
      if (id === aliasSlug) return true;
      if (id.startsWith(`${aliasSlug}-`)) return true;
      // sequence step anchor = `s{N}-{aliasSlug}` pattern
      if (/^s\d+-/.test(id) && id.endsWith(`-${aliasSlug}`)) return true;
      return false;
    };
    const relatedToActor = (id: string): boolean =>
      ownedLaneIds.size > 0 ? ownedNodeIds.has(id) : matchesAliasSlug(id);
    target.nodes = target.nodes.filter((n) => !relatedToActor(n.id));
    // edge も同経路で削除 (parts actor に接続していた flow を除去、 parts merge 後の flow は user が
    // 別途書く経路になる)。 削除した edge の id は phase.activate に残ると dangling 参照になるため回収する。
    const removedEdgeIds = new Set<string>();
    target.edges = target.edges.filter((e) => {
      const drop = relatedToActor(e.from) || relatedToActor(e.to);
      if (drop) removedEdgeIds.add(e.id);
      return !drop;
    });
    // lane も削除 = sequence preset は parts actor 用に lane (id = aliasSlug、 label = actor 名) を
    // 生成する。 node/edge だけ消して lane を残すと、 merge 後の part 側 lane (label = alias) と 2 本が
    // 同じ label を lane-label として描画し二重表示になる (actor ラベル二重表示 bug の root cause)。
    //
    // 削除は seq-like preset (sequence / solidity = compileSequence 経由) に限定する。 これらは
    // 1 actor = 1 lane (lane.label === actor.name、 lane.id は actor 名の slug) の生成規則が成立し、
    // parts actor 用 lane を安全に削除できる。 他 preset (flow / topology / class / pie 等) は複数
    // actor が共有 lane (id = "main" 等) を参照するため、 一致 lane を消すと通常 actor の node が
    // 削除済 lane を参照する不正 diagram になる (cc-codex MAJOR 指摘)。
    //
    // leftover lane の特定は lane.label === actor.name を第一に使う。 seq-like preset は非 animate 経路
    // (cdl preset の slugify) と animate 経路 (dragon の slugify) で lane.id の slug 規則が異なり
    // (`_`/全角の扱い等)、 aliasSlug (dragon slugify) と lane.id が不一致になる actor 名がある。 lane.label
    // は両経路とも actor.name 生値なので slug 差の影響を受けず確実に一致する。 id === aliasSlug は
    // label 未設定 preset への fallback (exact match のみ、 prefix は false match risk のため付けない)。
    if (doc.type === "sequence" || doc.type === "solidity") {
      target.lanes = target.lanes.filter((l) => {
        // 明示 lane mapping (actor.lane) 先は part の張替え先なので保持する。
        if (actor.lane !== undefined && l.id === actor.lane) return true;
        if (l.label === actor.name) return false;
        if (l.id === aliasSlug) return false;
        return true;
      });
    }
    // 削除された node / edge を activate 参照している既存 phase の cleanup (node 削除と同じ判定経路
    // = 取りこぼすと存在しない id が activate に残り dangling 参照になる、 #873)
    for (const phase of target.phases) {
      phase.activate = phase.activate.filter((id) => !relatedToActor(id) && !removedEdgeIds.has(id));
    }
    const merged = applyColorHex(part, actor.colorHex, actor.stateOverride ?? {});
    // 位置を書いていないパーツは格子に並べる。 書いてあればその位置を使う
    let placeX = actor.posX;
    let placeY = actor.posY;
    // 格子に落とすのは縦横どちらも書かなかった時だけ。 片方だけ書いた時に残りを格子で
    // 埋めると、 書いた値と格子が混ざった位置になる (従来の条件をそのまま保つ)
    if (placeX === undefined && placeY === undefined) {
      const center = gridCenters.get(actor.name);
      placeX = center?.cx;
      placeY = center?.cy;
    }
    mergePartIntoDiagram(target, part, actor.name, merged, actor.lane, placeX, placeY, actor.posW, actor.posH, onNotice, actor.pos?.line ?? 0);
  }
  return target;
}

/**
 * 状態の初期値に上書きを当てた結果と、 色として読めないため捨てたかどうか。
 *
 * **元の値が色の状態は、 上書きも色に限る** (#1004)。 状態の値は `fill` に入るため、
 * `url(https://example.invalid/x)` のような外部を指す値を通すと、 図を開いた人の環境から
 * その URL へ要求が飛ぶ。 書き出した SVG を配布しても同じことが起きる。
 * 色として読めない上書きは捨てて元の色を残す = 図は出るが外部は指さない。
 *
 * 元の値が色でない状態 (数値 / 文字列) は制限しない。 色として描かれないため、
 * 一律に弾くとゲージの値や説明文の差し替えという正当な用途を壊す。
 *
 * 捨てたことは呼出側が知らせる。 黙って捨てると、 書いた人は色が変わらない理由
 * (書き間違い / 拒否 / 描画不具合) を区別できない。
 */
function resolveStateOverride(
  original: number | string,
  override: number | string | boolean | undefined,
): { initial: number | string; rejected: boolean } {
  if (override === undefined) return { initial: original, rejected: false };
  if (isColorValue(original) && !isColorValue(override)) return { initial: original, rejected: true };
  return { initial: override as number | string, rejected: false };
}

/**
 * `色:` に書かれた色番号を、 パーツが持つ色の状態に入れる。
 *
 * 色を保持する状態の名前はパーツごとに違う (`bg` / `stFill` / `gFill` / `hue` など)。 名前を
 * 決め打ちすると、 別の名前を使うパーツで色を書いても何も起きない。
 *
 * パーツの状態のうち初期値が色番号のものを探して、 そこに入れる。 複数あれば全部に入れる
 * (`cpuC` / `memC` / `netC` のように系統ごとに分かれている場合、 1 つだけ変えるとちぐはぐになる)。
 */
function applyColorHex(
  part: CdlDiagram,
  colorHex: string | undefined,
  stateOverride: Record<string, number | string | boolean>,
): Record<string, number | string | boolean> {
  if (!colorHex) return stateOverride;
  const colorStates = part.states.filter((st) => isColorValue(st.initial));
  if (colorStates.length === 0) return stateOverride;
  const out = { ...stateOverride };
  for (const st of colorStates) {
    // 名前を指定して書いた値が優先。 `色:` はまとめて塗る指定
    if (out[st.id] === undefined) out[st.id] = colorHex;
  }
  return out;
}

/**
 * CAR-1657 = parts CdlDiagram (単一 part 内容) を target CdlDiagram に prefix 付きで merge する。
 * alias = user が書く actor 名 ('arc1')、 全 id を '{alias}__{origId}' で prefix、 lane 参照 rename、
 * state initial は stateOverride で上書き可、 shape / subtitle / value 内の '{stateName}' template も
 * '{alias__stateName}' に rewrite する。 phase parallel merge (activate / tweens / sets の id 参照 rename)。
 */
function mergePartIntoDiagram(
  target: CdlDiagram,
  part: CdlDiagram,
  alias: string,
  stateOverride: Record<string, number | string | boolean>,
  laneMapping: string | undefined,
  /**
   * parts drop 位置 (drag-and-drop or click 追加時に呼出側が SVG viewBox 座標を書出す)。
   * 未指定 = 従来 (lane.x = 0 baked-in で canvas 左端に描画)、 指定時 = parts 内部 lane の
   * x / y に加算して drop 座標付近に描画。 D1 forensic (drop 座標乖離) の core fix。
   */
  offsetX?: number,
  offsetY?: number,
  /**
   * parts 全体 resize 対応 (I2 forensic) = parts を Miro 相当の「1 unit」 として扱い、
   * user が SE handle drag で拡大すると actor.posW/posH が書出される。 compile で受け取り、
   * parts 全 sub-node の w / h と cx / cy 相対位置に scale 係数を適用して等比拡大する。
   * 未指定 = 従来の parts 原寸 で描画 (scale なし)。
   */
  targetW?: number,
  targetH?: number,
  /** 書いたのに使わなかった上書きを知らせる口。 黙って捨てると理由を追えない (#1004) */
  onNotice?: (notice: CompileNotice) => void,
  /** 知らせに載せる行。 パーツを書いた行を指す。 行が取れない経路 (JSON) では 0 */
  noticeLine = 0,
): void {
  const prefix = (id: string): string => `${alias}__${id}`;
  const stateIdSet = new Set(part.states.map((s) => s.id));
  const rewriteTemplate = (s: string | undefined): string | undefined => {
    if (!s) return s;
    return s.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, (m, name: string) => {
      return stateIdSet.has(name) ? `{${prefix(name)}}` : m;
    });
  };

  // 決定的 lane 参照 = user が書いた lane 指定を優先、 なければ parts 内部 lane を prefix 付きで作る
  const targetLaneId = laneMapping;
  const laneIdMap = new Map<string, string>();
  // parts lane の横位置。
  //   offset (drop / click 座標) 指定時 = part 中心を offsetX に合わせる = user が置いた位置に
  //     parts の中心が来る。 node は lane 中心 (lane.x + laneW/2) に描画されるため、 lane 左端を
  //     offsetX - laneW/2 に置くと node 中心 = offsetX となり cursor / viewport 中央に一致する
  //     (縦方向 offsetY と対称、 offsetY 側は partCenterStack で既に中心合わせ済)。
  //     従来の auto-adjust (max(offsetX, existingMax + gap) で既存 lane 右端へ強制右寄せ) は user
  //     directive で廃止 (2026-07-21)。 重なりは user の意図位置を優先し、 手動移動で回避する経路。
  //   未指定 (座標なし fallback) 時のみ existingMax + gap で右外配置 (通常経路は drop/click で座標を渡す)。
  const PARTS_LANE_GAP = 300;
  const existingLaneMaxX = target.lanes.length > 0
    ? Math.max(...target.lanes.map((l) => (l.x ?? 0) + l.width))
    : 0;
  // parts 全体 resize (I2 forensic): user が SE handle drag で targetW/H 指定 = actor.posW/H。
  // scale 基準は part 全体の bbox 幅 (全 lane の最左端〜最右端) にする。 lane[0] 幅だけを基準にすると
  // multi-lane part (複数 lane を横に並べた part) で全体幅を過小評価し、 非先頭 lane の node が自 lane
  // 中心からずれる (#880)。
  // 縦列の位置と幅を先に正す。 catalog は呼出側が渡す値で、 生値のまま bbox を出すと
  // 拡大の基準が 1 に落ちて箱が桁違いに大きくなる (実測 = 指定間隔 200 が -31800 になった)
  const partLaneGeom = new Map<string, { x: number; w: number }>();
  for (const l of part.lanes) {
    partLaneGeom.set(l.id, {
      x: typeof l.x === "number" && Number.isFinite(l.x) ? l.x : 0,
      w: positiveOr(l.width, 400),
    });
  }
  const laneXs = [...partLaneGeom.values()].map((g) => g.x);
  const laneRights = [...partLaneGeom.values()].map((g) => g.x + g.w);
  const partMinLaneX = minOf(laneXs, 0);
  const partMaxLaneRight = maxOf(laneRights, 400);
  // 幅は max >= min で常に非負。 正の幅 (極小 sub-pixel 含む) はそのまま scale 基準に使い、
  // 0 (全 lane が同一 x + 幅 0 の退化ケース) の時だけ除算保護で 1 に fallback する。
  // Math.max(1, w) だと 0 < w < 1 の正当な幅まで 1 に floor して over-scale するため使わない。
  const rawBboxW = partMaxLaneRight - partMinLaneX;
  const partsBboxW = rawBboxW > 0 ? rawBboxW : 1;
  // 非有限は 1 に倒す。 桁が溢れた `大きさ:` (`Number()` が Infinity を返す長さ) を
  // そのまま掛けると描けない座標になり、 大きさを見積る側 (`partTargetScale`) だけが
  // 1 に倒していたため経路で食い違っていた (#1018)
  const rawLaneScaleX = targetW !== undefined && targetW > 0 ? targetW / partsBboxW : 1;
  const laneScaleX = Number.isFinite(rawLaneScaleX) && rawLaneScaleX > 0 ? rawLaneScaleX : 1;
  // part 全体を「元 bbox 中心 → drop 座標」 の scale 変換で写す単一式 mapLaneX。 lane も node も同じ式で
  // 変換し、 lane.x = mapLaneX(元 lane 左端) にすることで全 lane / 全 node が一貫して drop 座標を中心に
  // scale 配置される (cc-codex #879 の mapPartX と同じ発想を lane push まで前倒し、 #880 root fix)。
  const partOrigBboxCenterX = partMinLaneX + partsBboxW / 2;
  const dropCenterX = offsetX !== undefined
    ? offsetX
    : existingLaneMaxX + PARTS_LANE_GAP + (partsBboxW * laneScaleX) / 2;
  const mapLaneX = (x: number): number => (x - partOrigBboxCenterX) * laneScaleX + dropCenterX;

  for (const laneOrig of part.lanes) {
    if (targetLaneId) {
      laneIdMap.set(laneOrig.id, targetLaneId);
    } else {
      const newLaneId = prefix(laneOrig.id);
      laneIdMap.set(laneOrig.id, newLaneId);
      // lane の左端を mapLaneX で変換 = 元 lane 左端 (x) を scale 変換後の位置に置く。 lane 幅も
      // scale して lane 中心が mapLaneX(元 lane 中心) に一致する。 これで multi-lane でも各 lane が
      // part 全体の scale 変換に沿って配置される。
      const geom = partLaneGeom.get(laneOrig.id) ?? { x: 0, w: 400 };
      target.lanes.push({
        ...laneOrig,
        id: newLaneId,
        label: laneOrig.label ?? alias,
        x: mapLaneX(geom.x),
        width: geom.w * laneScaleX,
      });
    }
  }

  // parts drop 位置 fix (D1 + D2 root fix):
  //   D2 = parts の stack 番号 (0/1/2/…) が target sequence の stack と衝突すると
  //        CDL layout の rowH 計算で全 lane の同 row cy が拡張、 sequence footer 等が縦 shift。
  //        → 2 段防御 で分離する:
  //             (1) 全 parts node に posX/posY 明示 set (CDL layout の絶対配置経路 = stack 計算 skip)
  //             (2) parts の stack 番号を target 側 max stack + STACK_ISOLATION_OFFSET (1000) に shift
  //                 = 万一 layout が rowH で参照しても sequence stack と重ならず影響 0 化
  //   D1 = drop 座標尊重の縦方向 = parts の元 stack (0..N) から近似 pitch で cy を組み立て、
  //        offsetY を加算して drop 座標付近に描画。 lane.x + lane.width/2 + offsetX で横位置。
  //
  const STACK_ISOLATION_OFFSET = 1000;
  const shouldForcePos = offsetX !== undefined || offsetY !== undefined;
  // target 側の現在 max stack + isolation offset で parts node の stack を shift、
  // sequence の rowH 計算と完全分離 (D2 fix、 posX/posY 明示との 2 段防御)。
  const targetMaxStack = shouldForcePos && target.nodes.length > 0
    ? Math.max(...target.nodes.map((n) => n.stack ?? 0))
    : 0;
  const stackShiftBase = shouldForcePos ? targetMaxStack + STACK_ISOLATION_OFFSET : 0;
  // parts 全体 resize scale (I2 forensic 対応): targetW / targetH 指定時、 parts の元 total size
  // に対する比率 = scale 係数、 全 sub-node の w / h + cx / cy 相対位置に scale 反映。
  // scaleX は lane push と同じ part bbox 幅基準 (laneScaleX) を使う = multi-lane で lane と node の
  // scale 係数が一致する (#880、 lane[0] 幅基準だと非先頭 lane の node がずれる)。
  // parts 内部 stack 別の垂直 pitch (world unit)。 CDL layout の実 stackGap (~100) +
  // 標準 node h (~140-200) の合計相当。 parts の cy を厳密に再現しないが、 渡した座標付近に
  // parts が中心配置される見た目に十分な近似。
  //
  // 実配置に置き換える案を試したが、 拡大の基準 (縦列基準 → 箱基準) まで変わって既存の
  // 期待 14 件が崩れた。 段を持つパーツ (実 catalog で 80 件中 7 件) の内部比率が実配置と
  // 3% ずれるが、 見た目の大きさは呼出側が揃えるため観測される差は無い
  const STACK_PITCH_APPROX = 220;
  // 数でない段は 0 として扱う。 大きさを見積る側 (`partTargetScale`) が同じ判定をしており、
  // ここだけ NaN を通すと段の数が NaN になって倍率が経路で食い違う (#1018)
  const partStacks = part.nodes.map((n) =>
    typeof n.stack === "number" && Number.isFinite(n.stack) ? n.stack : 0,
  );
  const minStack = partStacks.length > 0 ? Math.min(...partStacks) : 0;
  const maxStack = partStacks.length > 0 ? Math.max(...partStacks) : 0;
  const partCenterStack = (minStack + maxStack) / 2;
  const partOrigH = Math.max(1, (maxStack - minStack + 1) * STACK_PITCH_APPROX);
  const scaleX = laneScaleX;
  const rawScaleY = targetH !== undefined && targetH > 0 ? targetH / partOrigH : 1;
  const scaleY = Number.isFinite(rawScaleY) && rawScaleY > 0 ? rawScaleY : 1;

  // node merge = id prefix + lane 参照 rewrite + shape / subtitle / value 内 template rewrite
  for (const nodeOrig of part.nodes) {
    const mappedLane = laneIdMap.get(nodeOrig.lane) ?? nodeOrig.lane;
    // codex-review MAJOR fix (§ nested shape template) = recursive walk で shape 内 nested object /
    // array の string leaf 全対象、 前実装は 1 depth のみで `fill: { gradient: "{v}" }` 等 miss。
    let newShape = nodeOrig.shape
      ? deepRewriteStrings(nodeOrig.shape as unknown, rewriteTemplate)
      : undefined;
    // parts 全体 resize (I2 forensic): shape 内 radius / outerRadius / innerRadius / thickness に
    // scale 反映 = user が SE handle drag で拡大すると shape の見た目も比例拡大される。 scaleX を採用
    // (等比 scale 相当、 縦方向 scaleY と乖離する場合は近似)、 shape 内数値 field のうち幾何寸法系
    // のみ scale 適用 (fill / stroke 色 field 等 non-numeric は影響なし)。
    if (newShape && (scaleX !== 1 || scaleY !== 1)) {
      const shapeScale = Math.min(scaleX, scaleY); // 等比 scale で circle 崩れ回避
      const geomKeys = new Set(["radius", "outerRadius", "innerRadius", "thickness"]);
      const scaleGeom = (obj: unknown): unknown => {
        if (obj === null || typeof obj !== "object") return obj;
        if (Array.isArray(obj)) return obj.map(scaleGeom);
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          if (geomKeys.has(k) && typeof v === "number") {
            out[k] = v * shapeScale;
          } else if (typeof v === "object" && v !== null) {
            out[k] = scaleGeom(v);
          } else {
            out[k] = v;
          }
        }
        return out;
      };
      newShape = scaleGeom(newShape) as typeof newShape;
    }
    // parts drop 位置 offset 反映:
    //   - node.posX set 済 (parts が絶対座標を持つ) = その posX を part 中心基準で scale 変換
    //   - offsetX 指定時 (drop 経路) で posX 未設定 = node が属する lane 中央を同じ式で変換
    //   - offset なし (従来経路) は auto layout 継続 (posX undefined)
    //
    // 明示 posX と auto-layout の両経路を、 lane push と同じ単一式 mapLaneX で変換する
    // (cc-codex #879 Round 2/3 MAJOR + #880)。 mapLaneX は part bbox 中心 → drop 座標の scale 変換で、
    // lane / node / 明示 posX / auto-layout の全経路がこの 1 式を共有するため、 lane.x != 0 でも
    // multi-lane でも node 中心と自 lane 中心が一致する。
    let nodePosX: number | undefined = nodeOrig.posX !== undefined ? mapLaneX(nodeOrig.posX) : undefined;
    let nodePosY: number | undefined = nodeOrig.posY !== undefined ? nodeOrig.posY + (offsetY ?? 0) : undefined;
    if (shouldForcePos && nodePosX === undefined) {
      // posX を持たない node は所属 lane の中央 (auto layout の cx 相当) を同じ mapLaneX で変換する。
      const geom = partLaneGeom.get(nodeOrig.lane) ?? { x: 0, w: 320 };
      nodePosX = mapLaneX(geom.x + geom.w / 2);
    }
    if (shouldForcePos && nodePosY === undefined) {
      // parts の元 stack から近似 pitch で cy を組み立て、 全 parts の中心が offsetY に来るよう調整
      const stack = nodeOrig.stack ?? 0;
      nodePosY = (stack - partCenterStack) * STACK_PITCH_APPROX * scaleY + (offsetY ?? 0);
    }
    // parts sub-node の w / h に scale 適用 (I2 forensic 対応、 targetW/H 指定時のみ)
    // catalog の値は呼出側が渡すので、 拡大しない時も数として通るか確かめる。 通さないと
    // 座標が非有限になって図が描けない (実測 = 箱の中心が NaN になった)
    const rawNodeW = nodeOrig.w !== undefined ? positiveOr(nodeOrig.w, 200) : undefined;
    const rawNodeH = nodeOrig.h !== undefined ? positiveOr(nodeOrig.h, 200) : undefined;
    const nodeW = rawNodeW !== undefined && (scaleX !== 1 || scaleY !== 1)
      ? rawNodeW * scaleX
      : rawNodeW;
    const nodeH = rawNodeH !== undefined && (scaleX !== 1 || scaleY !== 1)
      ? rawNodeH * scaleY
      : rawNodeH;
    target.nodes.push({
      ...nodeOrig,
      id: prefix(nodeOrig.id),
      lane: mappedLane,
      title: rewriteTemplate(nodeOrig.title) ?? nodeOrig.title,
      subtitle: rewriteTemplate(nodeOrig.subtitle),
      value: rewriteTemplate(nodeOrig.value),
      // parts stack を target 側と分離 (D2 fix、 posX/posY 明示との 2 段防御)
      stack: (nodeOrig.stack ?? 0) + stackShiftBase,
      ...(newShape ? { shape: newShape as CdlDiagram["nodes"][number]["shape"] } : {}),
      ...(nodePosX !== undefined ? { posX: nodePosX } : {}),
      ...(nodePosY !== undefined ? { posY: nodePosY } : {}),
      ...(nodeW !== undefined ? { w: nodeW } : {}),
      ...(nodeH !== undefined ? { h: nodeH } : {}),
    });
  }

  // state merge = id prefix + initial override
  for (const stateOrig of part.states) {
    const { initial, rejected } = resolveStateOverride(stateOrig.initial, stateOverride[stateOrig.id]);
    if (rejected) {
      onNotice?.({
        kind: "state-override-rejected",
        actor: alias,
        line: noticeLine,
        message: `"${alias}" の ${stateOrig.id} に書いた値は色として読めないため使いません`,
        hint: "色は `#ff0000` のような色番号か、 `red` のような色名で書く",
      });
    }
    target.states.push({ id: prefix(stateOrig.id), initial });
  }

  // edge merge = id / from / to prefix (parts 内 edge は稀だが対応)
  for (const edgeOrig of part.edges) {
    target.edges.push({
      ...edgeOrig,
      id: prefix(edgeOrig.id),
      from: prefix(edgeOrig.from),
      to: prefix(edgeOrig.to),
    });
  }

  // codex-review CRITICAL fix (§ readouts merge) = readout 系 parts (percent-ring / sparkline /
  // donut / KPI 等) は node/state だけでは render されず、 readouts field が必須。 全 readout の
  // id prefix + source / historySource / *Source field の state template rewrite で対応。
  if (part.readouts && part.readouts.length > 0) {
    if (!target.readouts) target.readouts = [];
    for (const readoutOrig of part.readouts) {
      const rewritten = deepRewriteStrings(readoutOrig as unknown, rewriteTemplate) as CdlDiagram["readouts"] extends readonly (infer R)[] ? R : never;
      // id は shape 全 walk で rewrite されないので個別に prefix
      target.readouts.push({
        ...(rewritten as { id: string }),
        id: prefix((rewritten as { id: string }).id),
      } as CdlDiagram["readouts"] extends readonly (infer R)[] ? R : never);
    }
  }

  // codex-review MAJOR fix (§ phase parallel merge) = 前実装は append (sequential)、 spec は parallel
  // default = parts phase を target 側 phase 個別に merge、 duration は max、 activate / tweens / sets
  // は union。 stateOverride.phase === false 時は parts phase 破棄 (opt-out)。
  const phaseOptOut = stateOverride["phase"] === false;
  if (phaseOptOut) {
    return; // parts phase を破棄、 activate / tweens / sets の rewrite 不要
  }
  if (target.phases.length === 0) {
    // target に phase なし = parts phase をそのまま追加 (prefix 付き)
    for (const phaseOrig of part.phases) {
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: prefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: prefix(s.stateId) })),
      });
    }
  } else {
    // parallel merge = 各 target phase に対応する parts phase を index-wise で合成 (min の phase 数まで)、
    // 残 parts phase は追加 append (target より parts phase 数が多い場合)
    const targetLen = target.phases.length;
    const partsLen = part.phases.length;
    const commonLen = Math.min(targetLen, partsLen);
    for (let i = 0; i < commonLen; i++) {
      const targetPhase = target.phases[i]!;
      const partPhase = part.phases[i]!;
      targetPhase.duration = Math.max(targetPhase.duration, partPhase.duration);
      targetPhase.activate = [...targetPhase.activate, ...partPhase.activate.map(prefix)];
      targetPhase.tweens = [...targetPhase.tweens, ...partPhase.tweens.map((t) => ({ ...t, stateId: prefix(t.stateId) }))];
      targetPhase.sets = [...targetPhase.sets, ...partPhase.sets.map((s) => ({ ...s, stateId: prefix(s.stateId) }))];
    }
    // parts phase 余剰は append (target より parts が長い場合)
    for (let i = commonLen; i < partsLen; i++) {
      const phaseOrig = part.phases[i]!;
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: prefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: prefix(s.stateId) })),
      });
    }
  }
}

/**
 * codex-review MAJOR fix = shape / readout の nested object / array 内 string leaf を全て
 * rewrite 関数に通す再帰 walk。 非 string leaf (number / boolean / null) は保持、
 * 循環参照は Set で防御 (現状 shape / readout は tree 構造で cycle なし想定、 defensive)。
 */
function deepRewriteStrings(
  value: unknown,
  rewrite: (s: string | undefined) => string | undefined,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (typeof value === "string") return rewrite(value) ?? value;
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value as object)) return value;
  seen.add(value as object);
  if (Array.isArray(value)) {
    return value.map((v) => deepRewriteStrings(v, rewrite, seen));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = deepRewriteStrings(v, rewrite, seen);
  }
  return out;
}

/**
 * v0.5+ flow inline option (guard / cardinality / labelOffsetX / labelOffsetY) を
 * 既存 preset 経由で生成された CdlEdge に対し、 doc.flow の (from, to) 一致順マッチングで反映する。
 *
 * 設計:
 * - preset 経路ごとに edge id 命名規則が異なる (sequence: e{idx}-..、 ER: rel-{idx}-..、 FSM: t{idx}-..、
 *   topology: c{idx}-..、 flow preset: e-{prev}-{node}、 swimlane: e{idx}-..) ため、 id 直接マッチは脆い。
 * - 代わりに doc.flow の 1 step に対し、 同じ (slugified-from, slugified-to) を持つ未マッチ edge を
 *   順に 1 つ消費する double-pointer 走査で対応付ける。 同 from-to の重複は出現順で順番に対応。
 * - ER preset で cardinality が author 明示なら、 既存の label "places (1:N)" に "(1:N)" を再付与せず、
 *   既に label に含まれている場合はスキップ (`label.includes(cardinality)` で判定)。
 */
function applyEdgeInlineOptions(
  diagram: CdlDiagram,
  doc: DslDocument,
  /** 対応が取れた edge を記録する表。 callback は呼ばない (1 edge = 1 回にするため)。 */
  sourceLines?: Map<string, number>,
): void {
  const used = new Set<string>();
  // sequence preset では actor 名 が lane id、 edge.from は `s{stepIdx}-{laneId}` 形式。
  // solidity は sorted-actor を sequence preset 経由するため sequence と同形。
  // それ以外 (flow / swimlane / er / state / topology / gantt / class / pie / c4 / mind) は
  // edge.from / edge.to が plain slug (slugify(actor 名))。
  const isSeqLike = doc.type === "sequence" || doc.type === "solidity";
  doc.flow.forEach((s, stepIdx) => {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    const target = diagram.edges.find((e) => {
      if (used.has(e.id)) return false;
      if (isSeqLike) {
        // edge.from / edge.to は `s{stepIdx}-{laneId}` 命名規則
        return (
          (e.from === `s${stepIdx}-${fromId}` || e.from === fromId) &&
          (e.to === `s${stepIdx}-${toId}` || e.from === e.to)
        );
      }
      return e.from === fromId && e.to === toId;
    });
    if (!target) return;
    used.add(target.id);
    sourceLines?.set(target.id, s.pos.line);
    if (s.guard !== undefined) {
      target.guard = s.guard;
      // FSM preset では sub が guard 同期、 author 明示 guard を sub に反映 (sub 既存なら上書きしない)
      if (doc.type === "state" && target.sub === undefined) target.sub = s.guard;
    }
    if (s.cardinality !== undefined) {
      target.cardinality = s.cardinality;
      // ER preset の場合 label に "(1:N)" 形式で併記 (既に含まれていればスキップ)
      if (doc.type === "er" && !target.label.includes(s.cardinality)) {
        target.label = target.label
          ? `${target.label} (${s.cardinality})`
          : `(${s.cardinality})`;
      }
    }
    if (s.labelOffsetX !== undefined) target.labelOffsetX = s.labelOffsetX;
    if (s.labelOffsetY !== undefined) target.labelOffsetY = s.labelOffsetY;
  });
}

/**
 * 描画側が大きさを持つ種別。
 *
 * 記法の `kind` は描画の種別より広い。 そのまま渡すと大きさを引けずに描画が落ちる
 * (実測 = solidity の golden 4 件が `Cannot read properties of undefined`)。
 */
const DRAWABLE_KINDS: ReadonlySet<string> = new Set(NODE_KINDS);

/**
 * 描画側に無い記法の種別を、 意味の近い描画の種別に読み替える。
 *
 * Solidity の記法は `eoa` / `contract` のように領域固有の語を使う。 描画側に同じ名前は無いが、
 * 意味の対応する形はある (`shape-wallet` / `shape-smart-contract`)。 読み替えないと名札が
 * 一律 `card` になり、 「書いたとおりの形になる」 が Solidity の図だけ成立しない。
 *
 * 並び順 (`compileSolidity` の `kindOrder`) はこの読み替えの前の値で決まる = 読み替えても
 * 縦線の並びは変わらない。
 */
const KIND_ALIAS: Readonly<Record<string, string>> = {
  eoa: "shape-wallet",
  wallet: "shape-wallet",
  multisig: "signer",
  contract: "shape-smart-contract",
  proxy: "shape-smart-contract",
  library: "shape-code-block",
  interface: "shape-code-block",
};

/** 記法の種別を描画の種別に直す。 描けない種別のままなら `undefined`。 */
function drawableKind(kind: string | undefined): string | undefined {
  if (kind === undefined) return undefined;
  const mapped = KIND_ALIAS[kind] ?? kind;
  return DRAWABLE_KINDS.has(mapped) ? mapped : undefined;
}

/**
 * 順序図の名札 (lifeline 上端 / 下端) の高さを揃える。
 *
 * `kind` を書いたとおりに載せると、 種別ごとに要る高さが変わる (行を持つ storage は 206、
 * card は 72)。 揃えないと縦線の始まる位置がばらけ、 「同じ高さから下りる」 読み方が崩れる。
 *
 * 上端は最も高いものに合わせる。 下端も同じ値にする = 上下で形が違うと、 同じ登場人物が
 * 別物に見える。
 */
function alignSeqHeaderHeights(diagram: CdlDiagram, doc: DslDocument): void {
  if (doc.type !== "sequence" && doc.type !== "solidity") return;
  // 名札の id は `{laneId}-header` / `{laneId}-footer` の構造。 末尾の一致だけで見ると、
  // 登場人物名が `Auth Header` の時に step の目印 `s0-auth-header` を拾い、 見えない 2px の
  // 箱を名札の高さまで広げてしまう (#883 と同根)。
  const isEnd = (n: CdlDiagram["nodes"][number]): boolean =>
    n.id === `${n.lane}-header` || n.id === `${n.lane}-footer`;
  const ends = diagram.nodes.filter(isEnd);
  if (ends.length === 0) return;
  // `posH` を書いた名札は揃えの外に置く。 「その名札だけを指定の大きさにし、 他には影響させない」
  // という指定なので (`types.ts` の `nodes` override)、 値を変えるのも、 他の名札を引きずるのも
  // 契約に反する (実測 = `posH: 400` を 1 つ書くと、 無関係な名札まで 72 → 400 になった)。
  const auto = ends.filter((n) => n.posH === undefined);
  if (auto.length === 0) return;
  const tallest = Math.max(...auto.map((n) => n.h ?? 0));
  if (tallest <= 0) return;
  for (const n of auto) n.h = tallest;
}

/**
 * `(from, to)` の一致では取れない preset について、 edge と DSL の行の対応を埋める。
 *
 * `type: flow` は **actor を宣言順に一直線に並べ、 隣り合う actor の間に edge を引く**。
 * n 本目の edge は `actors[n]` から `actors[n+1]` へ向かい、 その label は
 * `doc.flow.find((s) => s.to === actors[n+1].name)` で選ばれる (`compileFlow`)。 そのため
 * `a -> c` / `c -> b` と書いても edge は `a -> b` / `b -> c` になり、 `(from, to)` の一致では
 * 1 件も取れない。
 *
 * **label を選ぶのと同じ規則で引く**。 `slugify` を挟んだ照合にすると、 別の名前が同じ slug に
 * なる形 (`API Gateway` と `api-gateway`) で label の出どころと違う step を返す。
 *
 * **汎用の `(from, to)` 照合が入れた値は上書きする**。 `type: flow` では label の出どころが
 * この規則で決まるので、 こちらが正しい。 上書きしないと、 たまたま `(from, to)` が一致した
 * 別の step の行が残る (実測 = `c -> b: いち` / `a -> b: に` の順で書くと、 edge の label は
 * `いち` なのに `に` の行を返した)。
 *
 * 対応が取れない edge には何も入れない (呼出側が「対応が無い」 と「行 0」 を区別できるように
 * するため、 #998)。
 */
function fillFlowEdgeSources(diagram: CdlDiagram, doc: DslDocument, sourceLines: Map<string, number>): void {
  if (doc.type !== "flow") return;
  // animation ありは別経路 (`compileGenericWithAnimate`) で、 鎖の規則が当てはまらない。
  if (doc.animate && doc.animate.phases.length > 0) return;
  diagram.edges.forEach((e, idx) => {
    const to = doc.actors[idx + 1];
    if (to === undefined) return;
    const step = doc.flow.find((s) => s.to === to.name);
    if (step === undefined) return;
    sourceLines.set(e.id, step.pos.line);
  });
}

/**
 * v0.5+ groups section を topology preset 経由の diagram に container lane として反映。
 * group.lanes に含まれる lane id 集合に対し、 wrap する `group-{id}` lane を contain: true で生成。
 *
 * 簡易実装 ... group container lane を独立 lane として並べ、 lane label に group.label を採用。
 * lane の物理的内包 (子 lane を group container の x 内に再配置) は engine layout に委ねる範囲外なので、
 * 本実装は CdlDiagram 上に「contain: true な group container lane」 を追加する最小骨格に留める。
 */
function applyGroupContainers(diagram: CdlDiagram, doc: DslDocument): void {
  if (!doc.groups || Object.keys(doc.groups).length === 0) return;
  for (const [id, g] of Object.entries(doc.groups)) {
    const containerId = `group-${id}`;
    if (diagram.lanes.some((l) => l.id === containerId)) continue;
    diagram.lanes.push({
      id: containerId,
      width: 800,
      label: g.label ?? id,
      contain: true,
      // 束ねる lane 群に重ねて描く枠。 横に並べる lane ではないので、 engine の間隔調整
      // (lane を詰めた分を幅で埋め合わせる処理) の対象から外す。
      role: "overlay",
    });
  }
}

/**
 * Solidity 専用 preset。
 *
 * 設計:
 * - actors を kind=contract / eoa / multisig 等で配置 (EOA は左、 contract は中央、 storage は右など layered layout)
 * - flow は function call の sequence (msg.sender → contract.fn() → internal call → emit event)
 * - storage 更新は state + rows binding で自動 (kind: storage の actor に rows: ["bal[A]: {balA}", ...])
 * - event は kind: event の actor を右端に並べ、 emit edge で発火を表現
 * - revert は tone: error の edge で表現
 *
 * sequence preset を base に使い、 Solidity 文脈に最適化した default を載せる:
 * - default tone: accent (call) / success (emit) / error (revert)
 * - default style: solid (call) / dotted-flow (state-change)
 */
function compileSolidity(doc: DslDocument): CdlDiagram {
  // sequence preset と同等構造で組み立てる、 lane 順は eoa / contract / storage / event の優先順で sort
  const kindOrder: Record<string, number> = {
    eoa: 0,
    actor: 0,
    multisig: 0,
    signer: 0,
    wallet: 0,
    contract: 1,
    proxy: 1,
    library: 1,
    interface: 1,
    storage: 2,
    event: 3,
  };
  const sorted = [...doc.actors].sort(
    (a, b) => (kindOrder[a.kind] ?? 5) - (kindOrder[b.kind] ?? 5),
  );
  // sorted を doc.actors に上書きしてから sequence preset 経由で compile
  const sortedDoc: DslDocument = { ...doc, actors: sorted };
  return compileSequence(sortedDoc);
}

/**
 * Gantt preset (横棒 timeline 専用 layout)
 *
 * 設計 ... 各 actor = 1 行 (= 1 task) として、 actor.subtitle ("Q1" / "Q2" / "Q3" / "Q4") を
 * 横軸 (時間軸) 上の位置にマッピングし、 actor を上下に縦 stack する形で「横棒 timeline」 を
 * 視覚的に作る。
 *
 * 寸法 ... 全体 timeline 幅 1400px / 各 task 横棒 w=280 h=64 / 中央 cx は Q1=200 / Q2=600 /
 * Q3=900 / Q4=1200。
 *
 * 実装 ... 背景 container lane (gantt-timeline) を 1 本 + 各 actor 用個別 lane (lane.x 明示) を
 * 1 本ずつ。 actor の stack は row index で、 全 lane 共通の row cy が layout で計算される。
 * kind: card 強制、 w / h を明示することで Gantt bar の視覚 size を担保。
 *
 * flow は依存関係を edge で表現 (横棒間の矢印)。
 */
function compileGantt(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const TASK_W = 280;
  const TASK_H = 64;
  const QUARTER_CX: Record<string, number> = { Q1: 200, Q2: 600, Q3: 900, Q4: 1200 };
  // task lane を上に重ねる背景の帯。 横に並べる lane ではないので、 engine の間隔調整の
  // 対象から外す (帯の幅 1400 を隣との重なりとして扱われると task lane が異常に太る)。
  b.lane("gantt-timeline", { x: 0, width: 1400, label: doc.title, role: "overlay" });

  doc.actors.forEach((a, idx) => {
    const subtitle = (a.subtitle ?? "").trim().toUpperCase();
    const cx = QUARTER_CX[subtitle] ?? 200;
    const laneX = cx - TASK_W / 2;
    const laneId = `gantt-${slugify(a.name) || `t${idx}`}`;
    b.lane(laneId, { x: laneX, width: TASK_W, label: "" });
    const nodeId = slugify(a.name) || `t${idx}`;
    b.node(nodeId, {
      lane: laneId,
      stack: idx,
      kind: "card",
      title: a.name,
      w: TASK_W,
      h: TASK_H,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * Class preset (UML class diagram 専用 layout)
 *
 * 設計 ... 各 class を 1 storage node として配置、 縦に stack する。 storage node renderer は
 * title (class 名) + divider + rows (fields / methods) を UML class box 風に表示する。
 *
 * 実装 ... 全 class を 1 lane に縦 stack 配置。 actor の kind を強制 storage、 rows / subtitle は
 * applyV05Extensions で node に merge される。
 *
 * flow ... 継承 / 関連を edge で表現 (label に "extends" / "implements" 等を author が指定)。
 */
function compileClass(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const CLASS_W = 400;
  b.lane("class-stack", { width: CLASS_W, label: doc.title });

  doc.actors.forEach((a, idx) => {
    const nodeId = slugify(a.name) || `c${idx}`;
    b.node(nodeId, {
      lane: "class-stack",
      stack: idx,
      kind: "storage",
      title: a.name,
      w: CLASS_W,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * Pie preset (円グラフ風 slice list 専用 layout)
 *
 * 設計 ... 円グラフの SVG arc 描画は engine 改修が大きいため、 簡易版として「slice list + value (%) 表示」
 * で代替する。 1 lane に slice を縦並びにし、 value 属性 (例 "30%") は applyV05Extensions が
 * node.value に merge することで「[Slice A] 30%」 「[Slice B] 25%」 のような pie chart 意図を伝える。
 *
 * 実装 ... 全 slice を 1 lane に縦 stack。 kind: card 強制、 w=480 h=120。
 *
 * flow は通常なし (slice 間に依存関係はない)、 author 明示時のみ edge を描く。
 */
function compilePie(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const SLICE_W = 480;
  b.lane("pie-slices", { width: SLICE_W, label: doc.title });

  doc.actors.forEach((a, idx) => {
    const nodeId = slugify(a.name) || `p${idx}`;
    b.node(nodeId, {
      lane: "pie-slices",
      stack: idx,
      kind: "card",
      title: a.name,
      w: SLICE_W,
      h: 120,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * C4 preset (C4 model 階層 system context 専用 layout)
 *
 * 設計 ... actor.subtitle に "L1" / "L2" / "L3" マーカーを置き、 階層 lane を生成。
 * - L1 = System Context (左 lane)
 * - L2 = Container (中央 lane)
 * - L3 = Component (右 lane)
 *
 * 実装 ... 3 lane を横並び (contain: true で囲む) 配置し、 各 actor を対応 L lane に配置する。
 * 同 L lane 内の actor は内部 stack で縦並びになる (横並びは layout 制約上不可、
 * 段の区別が視覚的に最重要)。 subtitle marker 未指定なら L1 fallback。
 *
 * flow ... actor 間の関係を edge で表現。
 */
function compileC4(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const LANE_W = 400;
  b.lane("c4-l1", { x: 0, width: LANE_W, label: "System Context", contain: true });
  b.lane("c4-l2", { x: LANE_W + 80, width: LANE_W, label: "Container", contain: true });
  b.lane("c4-l3", { x: (LANE_W + 80) * 2, width: LANE_W, label: "Component", contain: true });

  const stackPerLane: Record<string, number> = { "c4-l1": 0, "c4-l2": 0, "c4-l3": 0 };
  doc.actors.forEach((a, idx) => {
    const subtitle = (a.subtitle ?? "").trim().toUpperCase();
    const lid = subtitle === "L2" ? "c4-l2" : subtitle === "L3" ? "c4-l3" : "c4-l1";
    const stack = stackPerLane[lid]!;
    stackPerLane[lid] = stack + 1;
    const nodeId = slugify(a.name) || `n${idx}`;
    b.node(nodeId, {
      lane: lid,
      stack,
      kind: a.kind,
      title: a.name,
    });
  });

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  return b.build();
}

/**
 * Mind map preset (中央 root + leaf 専用 layout)
 *
 * 設計 ... 1 つ目の actor を root として中央 lane に配置、 残りを leaf として root の左右の
 * lane に交互配置する。 完全な放射状 (8 方向) は実装が大きいので、 簡略実装 layer 1 として
 * left / center (root) / right の 3 lane に leaf を交互配置する。
 *
 * 実装 ... 3 lane (mind-left / mind-center / mind-right)。 root を center に stack=中央 で配置
 * (leaf 数の半分相当の stack で root を中央化)、 leaf を奇数番 → left、 偶数番 → right に分配。
 * kind: card 強制。
 *
 * flow ... 宣言なしなら root → 各 leaf の暗黙 edge を自動生成、 宣言ありならそれを採用。
 */
function compileMind(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const LEAF_W = 280;
  const ROOT_W = 320;
  b.lane("mind-left", { x: 0, width: LEAF_W, label: "" });
  b.lane("mind-center", { x: LEAF_W + 80, width: ROOT_W, label: doc.title });
  b.lane("mind-right", { x: LEAF_W + 80 + ROOT_W + 80, width: LEAF_W, label: "" });

  if (doc.actors.length === 0) return b.build();

  const root = doc.actors[0]!;
  const rootId = slugify(root.name) || "root";
  const leafCount = doc.actors.length - 1;
  const rootStack = Math.floor(leafCount / 2);
  b.node(rootId, {
    lane: "mind-center",
    stack: rootStack,
    kind: "card",
    title: root.name,
    w: ROOT_W,
  });

  const stackLeft = { v: 0 };
  const stackRight = { v: 0 };
  doc.actors.slice(1).forEach((a, i) => {
    const isLeft = i % 2 === 0;
    const lid = isLeft ? "mind-left" : "mind-right";
    const counter = isLeft ? stackLeft : stackRight;
    const nodeId = slugify(a.name) || `leaf-${i}`;
    b.node(nodeId, {
      lane: lid,
      stack: counter.v,
      kind: "card",
      title: a.name,
      w: LEAF_W,
    });
    counter.v += 1;
  });

  if (doc.flow.length === 0 && doc.actors.length > 1) {
    doc.actors.slice(1).forEach((a) => {
      const leafId = slugify(a.name);
      b.edge(rootId, leafId, { label: "" });
    });
  } else {
    for (const s of doc.flow) {
      const fromId = slugify(s.from);
      const toId = slugify(s.to);
      b.edge(fromId, toId, {
        label: s.label,
        ...(s.sub ? { sub: s.sub } : {}),
        ...(s.tone ? { tone: s.tone } : {}),
        ...(s.style ? { style: s.style } : {}),
      });
    }
  }

  return b.build();
}

/**
 * v0.5+ inline option (subtitle / eyebrow / value / rows / stack / lane) +
 * top-level lanes / viewport / groups を post-process で反映。
 *
 * 設計: preset compile が既に基本 layout を作るので、 後付けで
 * - actor の inline option を該当 node に merge
 * - top-level lanes section の x / width / contain / lifeline / label を該当 lane に merge
 * - viewport の laneWidth (default lane width override) を全 lane に適用
 *
 * これにより v0.5 syntax で 19 機能のうち以下が動く:
 * subtitle / eyebrow / value / rows / contain / lifeline / label / lane.x / lane.width / laneWidth
 */
function applyV05Extensions(diagram: CdlDiagram, doc: DslDocument): CdlDiagram {
  // actor の主要 node を preset 種別で回収する。 sequence / solidity は header/footer を対で生成する
  // preset で主要 node は header、 それ以外の preset は actor 名 slug がそのまま node id になる。
  //
  // seq-like の非 animate 経路は実 node id を CDL preset 側 slugify (`_` → `-` 置換 + 全角正規化) で
  // 生成する。 dragon slugify (`_` / 全角 保持) で `{slug}-header` を決め打つと、 actor `A_B` の
  // primaryNodeId `a_b-header` が実 node `a-b-header` と食い違い、 inline option (subtitle / eyebrow /
  // value / rows) が drop する (#881、 #873 / #877 と同根の dragon⇔CDL slug 不一致)。 lane.label は
  // 両 slug 経路とも actor.name の生値なので (#877)、 actor 専用 lane を label 一致で引き当て、 その
  // lane 内の `-header` node を権威 primary として回収する。 slug 決め打ちを廃して実装差を構造的に吸収。
  //
  // 経路を preset 種別 (isSeqLike) で分け、 かつ lane.label / node id を actor.name の exact 一致で
  // 引くことで、 actor 名 "A Header" の slug `a-header` が actor "A" の node に漏れる cross-actor leak
  // (#879) も同時に断つ。
  const isSeqLike = doc.type === "sequence" || doc.type === "solidity";
  // actor inline option → node merge
  for (const a of doc.actors) {
    const dragonSlug = slugify(a.name);
    let primaryNodes: CdlDiagram["nodes"];
    if (isSeqLike) {
      const ownedLaneIds = new Set(
        diagram.lanes.filter((l) => l.label === a.name).map((l) => l.id),
      );
      // lane.label で actor 専用 lane を引けた場合はその lane の header node を回収する。 引けない
      // (label 未設定等の) preset は従来どおり dragon slug の `{slug}-header` 決め打ちに fallback する。
      //
      // header node id は `{laneId}-header` の構造。 `endsWith("-header")` で判定すると step box
      // `s{idx}-{laneId}` が actor 名末尾 "Header" (slug `...-header`) で誤マッチし、 option が invisible
      // な step anchor にも copy される (cc-codex #883 MAJOR)。 lane id との構造 exact 一致で header だけを
      // 引くことで step box / spacer / footer を排除する。
      primaryNodes = ownedLaneIds.size > 0
        ? diagram.nodes.filter((n) => ownedLaneIds.has(n.lane) && n.id === `${n.lane}-header`)
        : diagram.nodes.filter((n) => n.id === `${dragonSlug}-header`);
    } else {
      // 非 seq preset は 1 actor = 1 node (id = dragon slug) で node id と dragon slug が一致する。
      primaryNodes = diagram.nodes.filter((n) => n.id === dragonSlug);
    }
    for (const node of primaryNodes) {
      if (a.subtitle !== undefined) node.subtitle = a.subtitle;
      if (a.eyebrow !== undefined) node.eyebrow = a.eyebrow;
      if (a.value !== undefined) node.value = a.value;
      if (a.rows !== undefined) node.rows = a.rows;
      // seq-like preset の header / footer は kind を card 固定で作る。 書いた kind を載せる
      // (#975)。 載せないと「書いたのに効かない項目」 が残り、 `rows` を書いた時は行が card に
      // 付いて画面から消える (#387、 cdl 側 Axis 67 rows-not-rendered が検知する)。
      //
      // 以前は「行を描く kind かつ rows あり」 に絞っていた。 header の見た目を kind ごとに
      // 変えると読み方が変わることを懸念したためだが、 **書いたとおりにならない方が読み手を
      // 惑わせる**。 見本 412 図で影響を受けるのは 1 図 (4 actor) だけと実測した。
      // 書いた種別を名札に載せる。 描画側に無い語は意味の近い形に読み替える (#975)。
      const drawn = isSeqLike ? drawableKind(a.kind) : undefined;
      if (drawn !== undefined) {
        node.kind = drawn as typeof node.kind;
        // 下端の名札も同じ形にする。 上下で形が違うと、 同じ登場人物が別物に見える。
        // `rows` は上端にだけ載る (`primaryNodes` が上端しか拾わない) ので、 行は 2 度出ない。
        const footer = diagram.nodes.find((n) => n.id === `${node.lane}-footer`);
        if (footer) footer.kind = drawn as typeof node.kind;
      }
      // 行を書いた時は枠に収まる高さと幅にする。 header は w / h を固定値で作られ、 cdl 側は
      // `n.w` / `n.h` を明示した node の自動拡張を尊重する (著者指定を壊さない) 設計なので、
      // preset が置いた固定値がそのまま残る。
      //
      // 必要な寸法は cdl の SSOT (`requiredRowsHeight` / `requiredRowsWidth`) から引く。
      // 式を dragon 側に写すと、 描画を変えた時に片方だけ古くなる。
      if (isSeqLike && a.rows !== undefined && a.rows.length > 0 && rendersRows(a.kind)) {
        node.h = Math.max(node.h ?? 0, requiredRowsHeight(a.kind, a.rows.length) ?? 0);
        node.w = Math.max(node.w ?? 0, requiredRowsWidth(a.rows));
      }
      // 名札の大きさも書いたとおりにする (#975)。 縦線の位置は `位置:` の x が lane に効く
      // (実測) が、 大きさはどこにも載っていなかった。
      //
      // 高さは指定をそのまま使わず、 揃える側 (`alignSeqHeaderHeights`) に渡す候補にする。
      // 1 本だけ高い名札を作ると、 縦線の始まる位置がばらける。
      if (isSeqLike) {
        // 書いた値をそのまま使う。 大きい方を採ると、 縮める指定 (`大きさ: 80,60`) が効かない。
        if (a.posW !== undefined) node.w = a.posW;
        if (a.posH !== undefined) node.h = a.posH;
        const footer = diagram.nodes.find((n) => n.id === `${node.lane}-footer`);
        if (footer && a.posW !== undefined) footer.w = a.posW;
      }
    }
  }
  // 名札の高さを揃える。 kind ごとに高さが変わると縦線の始まる位置がばらけ、 順序図の
  // 「同じ高さから下りる」 読み方が崩れる (実測 = 行を持つ名札だけ 134px 下にずれた)。
  alignSeqHeaderHeights(diagram, doc);
  // v0.5+ animation phase 後段注入 (CAR-1657 fix、 元 dragon PR #413 report user)。
  // preset (class / pie / c4 / mind / gantt) が doc.animate を無視して build するケースを補償。
  // 既に preset が phase を生成済 (sequence / flow / swimlane / er / state / topology 経由 = compileGenericWithAnimate) なら skip。
  // doc に phase 指定があって diagram.phases が空なら、 preset 由来 lane/node/edge に対して generic phase を注入する。
  if (doc.animate && doc.animate.phases.length > 0 && diagram.phases.length === 0) {
    injectPhasesFallback(diagram, doc);
  }
  // top-level lanes section → lane merge
  if (doc.lanes) {
    for (const [id, laneOpt] of Object.entries(doc.lanes)) {
      const lane = diagram.lanes.find((l) => l.id === id);
      if (lane) {
        if (laneOpt.x !== undefined) lane.x = laneOpt.x;
        if (laneOpt.width !== undefined) lane.width = laneOpt.width;
        if (laneOpt.label !== undefined) lane.label = laneOpt.label;
        if (laneOpt.contain !== undefined) lane.contain = laneOpt.contain;
        if (laneOpt.lifeline !== undefined) lane.lifeline = laneOpt.lifeline;
      } else {
        // lane が preset で作られていなければ新規追加
        diagram.lanes.push({
          id,
          x: laneOpt.x ?? 0,
          width: laneOpt.width ?? 320,
          label: laneOpt.label,
          contain: laneOpt.contain,
          lifeline: laneOpt.lifeline,
        });
      }
    }
  }
  // viewport.laneWidth → 全 lane width に override
  if (doc.viewport?.laneWidth !== undefined) {
    for (const lane of diagram.lanes) {
      lane.width = doc.viewport.laneWidth;
    }
  }
  // viewport.width / height / gap / laneGap / nodeGap / scale / labelMargin → CdlDiagram.viewport に集約
  if (doc.viewport) {
    diagram.viewport = {
      ...(diagram.viewport ?? {}),
      ...(doc.viewport.width !== undefined ? { width: doc.viewport.width } : {}),
      ...(doc.viewport.height !== undefined ? { height: doc.viewport.height } : {}),
      ...(doc.viewport.gap !== undefined ? { gap: doc.viewport.gap } : {}),
      ...(doc.viewport.laneGap !== undefined ? { laneGap: doc.viewport.laneGap } : {}),
      ...(doc.viewport.nodeGap !== undefined ? { nodeGap: doc.viewport.nodeGap } : {}),
      ...(doc.viewport.scale !== undefined ? { scale: doc.viewport.scale } : {}),
      ...(doc.viewport.labelMargin !== undefined ? { labelMargin: doc.viewport.labelMargin } : {}),
    };
  }
  return diagram;
}

/**
 * v0.5+ animation phase 後段 fallback 注入 (CAR-1657)。
 *
 * class / pie / c4 / mind / gantt preset は独自 layout を持ち、 compileGenericWithAnimate 経路に
 * 乗らないため、 doc.animate.phases があっても diagram.phases が空になる。
 * 本 helper が applyV05Extensions から呼ばれて post-hoc に phase を差込む、 lane/node/edge は
 * 既存 preset 出力を保持したまま animation だけ追加する。
 *
 * highlight resolution = actor 名 = slugify → diagram.nodes.id 対応、 edge の "A -> B" は
 * from/to の slug で 1:1 対応する edge を検索。 preset 由来 edge id は各種 (`e-{from}-{to}` /
 * `e{idx}-{fromId}-{toId}` 等) 揺れがあるため、 (edge.from === slug(A) && edge.to === slug(B))
 * で辞書 lookup せず走査で解決する。
 */
function injectPhasesFallback(diagram: CdlDiagram, doc: DslDocument): void {
  if (!doc.animate) return;

  // states 反映 (未登録なら追加、 既存は上書きしない)。 CdlState は id field (name ではない)。
  const existingStateIds = new Set(diagram.states.map((s) => s.id));
  for (const st of doc.animate.states) {
    if (!existingStateIds.has(st.name)) {
      diagram.states.push({ id: st.name, initial: st.initial });
    }
  }

  // highlight 解決関数 = actor 名 or "A -> B" / "A → B" を node.id / edge.id に変換。
  // codex-review CAR-1659 MAJOR fix = 全角矢印 `→` を対応 (generic 経路との互換)、
  // 同 from/to で複数 edge がある場合は全件 activate (`.find` → filter loop)。
  // 実在する名前。 矢印を含む名前 (`"A -> B"`) を矢印と読み違えないために渡す
  const knownNames = new Set(doc.actors.map((a) => a.name));
  const resolveIds = (highlight: readonly string[]): string[] => {
    const out: string[] = [];
    for (const h of highlight) {
      const entry = parseFocusEntry(h, knownNames);
      if (entry.kind === "edge") {
        const fromSlug = slugify(entry.from);
        const toSlug = slugify(entry.to);
        for (const e of diagram.edges) {
          if (e.from === fromSlug && e.to === toSlug) out.push(e.id);
        }
        continue;
      }
      const nodeSlug = slugify(entry.name);
      const node = diagram.nodes.find((n) => n.id === nodeSlug || n.id === `${nodeSlug}-header`);
      if (node) out.push(node.id);
    }
    return out;
  };

  // phase 注入。 CdlPhase.tweens[].stateId / sets[].stateId で state 参照 (state ではない)。
  for (const p of doc.animate.phases) {
    const activateIds: string[] = [...resolveIds(p.highlight ?? [])];
    diagram.phases.push({
      id: slugify(p.name) || p.name,
      duration: p.durationMs,
      title: p.name,
      body: p.body ?? "",
      activate: activateIds,
      tweens: (p.tweens ?? []).map((t) => ({ stateId: t.state, from: t.from, to: t.to })),
      sets: (p.sets ?? []).map((s) => ({ stateId: s.state, value: s.value })),
      ...(p.badge ? { badge: p.badge } : {}),
    });
  }
}

function compileSequence(doc: DslDocument): CdlDiagram {
  // v0.3 ... アニメーション 有無で経路を分岐。
  // 有り = builder 直接経路で state / 複数 phase を注入。
  // 無し = v0.2 と同じく sequence preset の標準 phase を採用。
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileSequenceWithAnimate(doc);
  }
  const seqBuilder = sequence({
    id: slugify(doc.title),
    topic: doc.title,
    actors: doc.actors.map((a) => a.name),
  });
  for (const s of doc.flow) {
    seqBuilder.step({
      from: s.from,
      to: s.to,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }
  return seqBuilder.build();
}

/**
 * v0.3 ... アニメーション full compile (sequence 向け)。
 * sequence preset と同じ構造 (lane / header / spacer / step box / footer) を builder 直接で組み立て、
 * 標準の 1 phase を DSL の複数 phase に置き換える。
 *
 * 標準 phase 1 個 → DSL phases N 個に展開。
 * state / tween / set / badge / body / highlight 全反映。
 */
function compileSequenceWithAnimate(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const laneW = 340;

  // actor 名 → lane id / header / footer / spacer の slug 生成 (sequence preset と整合)
  const actorIds = new Map<string, string>();
  const headerNodeIds: string[] = [];
  doc.actors.forEach((a, i) => {
    const id = slugify(a.name) || `actor-${i}`;
    actorIds.set(a.name, id);
    actorIds.set(id, id);
    // canvas pivot 新 spec = actor.posX/posY set 済なら CDL layout skip 経路に流す。
    // sequence preset の lane はここで生成、 posW/posH は lane 全体の rect を上書き。
    const laneOpts: Parameters<typeof b.lane>[1] = { width: laneW, label: a.name, lifeline: true };
    if (a.posX !== undefined && a.posY !== undefined) {
      laneOpts.posX = a.posX;
      laneOpts.posY = a.posY;
      if (a.posW !== undefined) laneOpts.posW = a.posW;
      if (a.posH !== undefined) laneOpts.posH = a.posH;
    }
    b.lane(id, laneOpts);
    const headerId = `${id}-header`;
    // header/footer 幅を title 長に応じて auto-size (text-readability warning 解消)。
    // formula = 22px/char + 52px padding (visualValidate text-readability と完全一致)、 min 140 で従来 sample 互換維持。
    const actorW = Math.max(140, a.name.length * 22 + 52);
    b.node(headerId, { lane: id, stack: 0, kind: "card", title: a.name, w: actorW, h: 72 });
    headerNodeIds.push(headerId);
    const spacerId = `${id}-spacer`;
    b.node(spacerId, { lane: id, stack: 1, kind: "card", title: "", w: 2, h: 40 });
  });

  // step boxes (sequence preset と同じ命名 ... `s${idx}-${laneId}` / `e${idx}-${from}-${to}`)
  // step ごとに DSL flow item に対応、 actor 名 → lane id の slugify を活用。
  const stepEdgeIds: string[] = [];
  doc.flow.forEach((s, idx) => {
    const fromLaneId = actorIds.get(s.from) ?? s.from;
    const toLaneId = actorIds.get(s.to) ?? s.to;
    const stack = idx + 2;
    const fromBoxId = `s${idx}-${fromLaneId}`;
    const toBoxId = `s${idx}-${toLaneId}`;
    b.node(fromBoxId, { lane: fromLaneId, stack, kind: "card", title: "", w: 2, h: 2 });
    if (fromLaneId !== toLaneId) {
      b.node(toBoxId, { lane: toLaneId, stack, kind: "card", title: "", w: 2, h: 2 });
    }
    const edgeId = `e${idx}-${fromLaneId}-${toLaneId}`;
    b.edge(fromBoxId, fromLaneId === toLaneId ? fromBoxId : toBoxId, {
      id: edgeId,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.guard ? { guard: s.guard } : {}),
      ...(s.cardinality ? { cardinality: s.cardinality } : {}),
      ...(s.labelOffsetX !== undefined ? { labelOffsetX: s.labelOffsetX } : {}),
      ...(s.labelOffsetY !== undefined ? { labelOffsetY: s.labelOffsetY } : {}),
    });
    stepEdgeIds.push(edgeId);
  });

  // footer (sequence preset と整合)
  const footerStack = doc.flow.length + 2;
  doc.actors.forEach((a) => {
    const laneId = actorIds.get(a.name) ?? slugify(a.name);
    const footerId = `${laneId}-footer`;
    const actorW = Math.max(140, a.name.length * 22 + 52);
    b.node(footerId, { lane: laneId, stack: footerStack, kind: "card", title: a.name, w: actorW, h: 72 });
  });

  // state を builder に登録
  for (const st of doc.animate!.states) {
    b.state(st.name, { initial: st.initial });
  }

  // phase を順次注入 ... highlight / tween / set / badge / body 全反映
  for (const p of doc.animate!.phases) {
    b.phase(
      slugify(p.name) || p.name,
      {
        duration: p.durationMs,
        title: p.name,
        body: p.body ?? "",
      },
      (pb) => {
        // highlight ... DSL の name (actor 名 or "from→to") を実 id に解決
        const activateIds = resolveHighlight(p, doc, actorIds, stepEdgeIds);
        if (activateIds.length > 0) {
          pb.activate(...activateIds);
        }
        // tween
        for (const t of p.tweens ?? []) {
          pb.tween(t.state, t.from, t.to);
        }
        // set
        for (const s of p.sets ?? []) {
          pb.set(s.state, s.value);
        }
        // badge
        if (p.badge) {
          pb.badge(p.badge);
        }
        return pb;
      },
    );
  }

  return b.build();
}

/**
 * DSL の highlight item (actor 名 or "A→B" or "A-B" 等) を実 node/edge id に解決する。
 */
function resolveHighlight(
  phase: DslPhase,
  doc: DslDocument,
  actorIds: Map<string, string>,
  _stepEdgeIds: string[],
): string[] {
  const out: string[] = [];
  const knownNames = new Set(actorIds.keys());
  for (const raw of phase.highlight ?? []) {
    const entry = parseFocusEntry(raw, knownNames);
    // 矢印つき → 該当 step edge を全部探して active
    if (entry.kind === "edge") {
      const fromLaneId = actorIds.get(entry.from) ?? slugify(entry.from);
      const toLaneId = actorIds.get(entry.to) ?? slugify(entry.to);
      // 該当 edge を flow から検索
      doc.flow.forEach((s, idx) => {
        const sFromId = actorIds.get(s.from) ?? slugify(s.from);
        const sToId = actorIds.get(s.to) ?? slugify(s.to);
        if (sFromId === fromLaneId && sToId === toLaneId) {
          out.push(`e${idx}-${fromLaneId}-${toLaneId}`);
        }
      });
      // 関連する step box も active 化
      const stackIdx = doc.flow.findIndex((s) => {
        const sFromId = actorIds.get(s.from) ?? slugify(s.from);
        const sToId = actorIds.get(s.to) ?? slugify(s.to);
        return sFromId === fromLaneId && sToId === toLaneId;
      });
      if (stackIdx >= 0) {
        out.push(`s${stackIdx}-${fromLaneId}`);
        if (fromLaneId !== toLaneId) out.push(`s${stackIdx}-${toLaneId}`);
      }
      continue;
    }
    // actor 名 → header + footer + 全 step box を active
    const laneId = actorIds.get(entry.name) ?? slugLookup(actorIds, entry.name);
    if (laneId) {
      out.push(`${laneId}-header`);
      out.push(`${laneId}-footer`);
      // この lane の全 step box
      doc.flow.forEach((s, idx) => {
        const sFromId = actorIds.get(s.from) ?? slugify(s.from);
        const sToId = actorIds.get(s.to) ?? slugify(s.to);
        if (sFromId === laneId || sToId === laneId) {
          out.push(`s${idx}-${laneId}`);
        }
      });
    }
  }
  return out;
}

/**
 * 名前が見つからない時に、 slug の形でも探す。
 *
 * 記法は表示名で書くが、 書く人は id の形 (`api-gateway`) で書くこともある。 図種によって
 * 受理する / しないが分かれると、 同じ記述が別の意味になる。
 *
 * 2 つ以上の名前が同じ slug になる時は解決しない。 どちらを指したか決められないため、
 * 黙ってどちらかを選ぶより光らせない方が書いた人が気付ける。
 */
function slugLookup(byName: ReadonlyMap<string, string>, wanted: string): string | undefined {
  let hit: string | undefined;
  for (const [name, id] of byName) {
    if (slugify(name) !== wanted) continue;
    if (hit !== undefined) return undefined;
    hit = id;
  }
  return hit;
}

function compileFlow(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路で複数 phase 注入
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "flow", laneId: "main", laneWidth: 400 });
  }
  // flow preset は actors を順に step として配置、 step 間に edge auto
  const flowBuilder = flow({
    id: slugify(doc.title),
    topic: doc.title,
  });
  // 各 actor を step として登録、 edge label は流れ から拾う
  for (let i = 0; i < doc.actors.length; i++) {
    const a = doc.actors[i]!;
    // 直前の step との edge label = この actor を to に持つ flow から拾う
    const incomingEdge = doc.flow.find((s) => s.to === a.name);
    const edgeLabel = incomingEdge?.label;
    flowBuilder.step(
      {
        id: slugify(a.name) || `n${i}`,
        kind: a.kind,
        title: a.name,
      },
      edgeLabel,
    );
  }
  return flowBuilder.build();
}

function compileSwimlane(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 actor 別 lane で配置)
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "swimlane", laneWidth: 400 });
  }
  // swimlane preset は lane 配置 + 自由 node/edge。
  // v0.2 では actors を lane 化、 流れ の各 step から node を生成、 edge を引く。
  const swim = swimlane({
    id: slugify(doc.title),
    topic: doc.title,
    lanes: doc.actors.map((a) => a.name),
  });

  // 各 step で from / to の node を lane 内 stack 配置
  const placedNodes = new Set<string>();
  const laneStackCount = new Map<string, number>();
  let edgeIdx = 0;

  for (const s of doc.flow) {
    for (const actorName of [s.from, s.to]) {
      if (placedNodes.has(actorName)) continue;
      const laneId = swim.laneId(actorName);
      const actor = doc.actors.find((a) => a.name === actorName);
      const stack = laneStackCount.get(laneId) ?? 0;
      const nodeId = slugify(actorName) || `n${placedNodes.size}`;
      swim.node(nodeId, {
        lane: laneId,
        stack,
        kind: actor?.kind ?? "actor",
        title: actorName,
      });
      laneStackCount.set(laneId, stack + 1);
      placedNodes.add(actorName);
    }
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    swim.edge(fromId, toId, {
      id: `e${edgeIdx++}-${fromId}-${toId}`,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.guard ? { guard: s.guard } : {}),
      ...(s.cardinality ? { cardinality: s.cardinality } : {}),
      ...(s.labelOffsetX !== undefined ? { labelOffsetX: s.labelOffsetX } : {}),
      ...(s.labelOffsetY !== undefined ? { labelOffsetY: s.labelOffsetY } : {}),
    });
  }
  return swim.build();
}

function compileEr(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (entity を box として配置)
  if (doc.animate && doc.animate.phases.length > 0) {
    // 460 は preset 側の旧既定に合わせた値だった。 preset が箱 400 + 余白 25 × 2 = 450 を
    // 宣言するようになった (cardene777/cdl#359) ので、 同じ図が animate の有無で 10 world
    // ずれないようここも 450 にする。
    return compileGenericWithAnimate(doc, { kind: "er", laneWidth: 450 });
  }
  // er preset ... actors を entity に、 流れ を relation に
  const erBuilder = er({
    id: slugify(doc.title),
    topic: doc.title,
  });
  for (const a of doc.actors) {
    // entity rows は DSL では宣言できないので、 actor 名のみ entity 化
    // v0.3 で「列定義」 ブロックを追加検討
    erBuilder.entity({
      id: slugify(a.name) || a.name,
      title: a.name,
      rows: [], // v0.2 では rows なし
    });
  }
  for (const s of doc.flow) {
    erBuilder.relation({
      from: slugify(s.from),
      to: slugify(s.to),
      cardinality: parseCardinalityFromLabel(s.label) ?? "1:N",
      label: stripCardinality(s.label),
      ...(s.tone ? { tone: s.tone } : {}),
    });
  }
  return erBuilder.build();
}

function compileState(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 state を lane で配置、 transition を edge)
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "state", laneWidth: 360 });
  }
  // stateMachine preset ... actors を state に、 流れ を transition に
  const fsm = stateMachine({
    id: slugify(doc.title),
    topic: doc.title,
  });
  for (let i = 0; i < doc.actors.length; i++) {
    const a = doc.actors[i]!;
    // 初期 / 最終 は (initial) / (final) を kind 部分に書く慣習、 もしくは順序で決め打ち
    const initial = i === 0;
    const final = i === doc.actors.length - 1 && doc.actors.length > 1;
    fsm.state({
      id: slugify(a.name) || `s${i}`,
      title: a.name,
      ...(initial ? { initial: true } : {}),
      ...(final ? { final: true } : {}),
    });
  }
  for (const s of doc.flow) {
    fsm.transition({
      from: slugify(s.from),
      to: slugify(s.to),
      trigger: s.label,
      ...(s.sub ? { guard: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
    });
  }
  return fsm.build();
}

function compileTopology(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 actor を別 lane に)
  if (doc.animate && doc.animate.phases.length > 0) {
    return compileGenericWithAnimate(doc, { kind: "topology", laneWidth: 460 });
  }
  // topology preset ... actors を 1 つの group 内 container として配置
  // v0.3 で「group」 ブロックを追加して複数 group 対応検討
  const topo = topology({
    id: slugify(doc.title),
    topic: doc.title,
  });
  const groupId = "main";
  const groupBuilder = topo.group(groupId, { label: doc.title });
  for (const a of doc.actors) {
    groupBuilder.add({
      id: slugify(a.name) || a.name,
      kind: a.kind,
      title: a.name,
    });
  }
  for (const s of doc.flow) {
    topo.connect(slugify(s.from), slugify(s.to), {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }
  return topo.build();
}

/**
 * v0.4 ... 5 preset (flow / swimlane / er / state / topology) 共通 animation compile。
 * sequence preset と異なり header / footer / step box 構造はない、 シンプルな lane + node + edge 構造。
 * preset kind ごとに lane 配置と layout を切替。
 */
type GenericKind = "flow" | "swimlane" | "er" | "state" | "topology";

type GenericOpts = {
  kind: GenericKind;
  /** flow / topology は 1 lane に全 actor、 swimlane / state は actor ごと lane */
  laneId?: string;
  laneWidth: number;
};

function compileGenericWithAnimate(doc: DslDocument, opts: GenericOpts): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title });
  const { kind, laneWidth } = opts;

  // lane / node 配置 ... preset kind に応じて切替
  const actorToNodeId = new Map<string, string>();
  if (kind === "flow" || kind === "topology") {
    // 1 lane に全 actor を縦 stack
    const lid = opts.laneId ?? "main";
    b.lane(lid, { width: laneWidth, label: doc.title, ...(kind === "topology" ? { contain: true } : {}) });
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      b.node(id, { lane: lid, stack: idx, kind: a.kind, title: a.name });
    });
  } else {
    // swimlane / er / state ... actor ごとに 1 lane (横並び)
    doc.actors.forEach((a, idx) => {
      const lid = `lane-${slugify(a.name) || idx}`;
      b.lane(lid, { width: laneWidth, label: a.name });
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      // er は entity、 state は initial/final marker、 swimlane はそのまま actor
      const isInitial = kind === "state" && idx === 0;
      const isFinal = kind === "state" && idx === doc.actors.length - 1 && doc.actors.length > 1;
      b.node(id, {
        lane: lid,
        stack: 0,
        kind: a.kind,
        title: a.name,
        ...(isInitial ? { eyebrow: "初期" } : {}),
        ...(isFinal ? { eyebrow: "最終" } : {}),
      });
    });
  }

  // edge ... flow の各 step を edge として登録
  const edgeIds: string[] = [];
  doc.flow.forEach((s, idx) => {
    const fromId = actorToNodeId.get(s.from) ?? slugify(s.from);
    const toId = actorToNodeId.get(s.to) ?? slugify(s.to);
    const edgeId = `e${idx}-${fromId}-${toId}`;
    // ER preset では cardinality を label に "(1:N)" 形式で併記、 他 preset は label そのまま。
    const labelWithCard =
      kind === "er" && s.cardinality && !s.label.includes(s.cardinality)
        ? s.label
          ? `${s.label} (${s.cardinality})`
          : `(${s.cardinality})`
        : s.label;
    b.edge(fromId, toId, {
      id: edgeId,
      label: labelWithCard,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.guard ? { guard: s.guard } : {}),
      ...(s.cardinality ? { cardinality: s.cardinality } : {}),
      ...(s.labelOffsetX !== undefined ? { labelOffsetX: s.labelOffsetX } : {}),
      ...(s.labelOffsetY !== undefined ? { labelOffsetY: s.labelOffsetY } : {}),
    });
    edgeIds.push(edgeId);
  });

  // state 登録
  for (const st of doc.animate!.states) {
    b.state(st.name, { initial: st.initial });
  }

  // phase 注入
  for (const p of doc.animate!.phases) {
    b.phase(
      slugify(p.name) || p.name,
      {
        duration: p.durationMs,
        title: p.name,
        body: p.body ?? "",
      },
      (pb) => {
        const activateIds = resolveHighlightGeneric(p, doc, actorToNodeId, edgeIds);
        if (activateIds.length > 0) {
          pb.activate(...activateIds);
        }
        for (const t of p.tweens ?? []) {
          pb.tween(t.state, t.from, t.to);
        }
        for (const s of p.sets ?? []) {
          pb.set(s.state, s.value);
        }
        if (p.badge) {
          pb.badge(p.badge);
        }
        return pb;
      },
    );
  }

  return b.build();
}

/**
 * 5 preset 共通 ... highlight item (actor 名 or "A→B") を node/edge id に解決。
 * sequence と異なり header/footer/step box はないのでシンプル。
 */
function resolveHighlightGeneric(
  phase: DslPhase,
  doc: DslDocument,
  actorToNodeId: Map<string, string>,
  edgeIds: string[],
): string[] {
  const out: string[] = [];
  const knownNames = new Set(actorToNodeId.keys());
  for (const raw of phase.highlight ?? []) {
    const entry = parseFocusEntry(raw, knownNames);
    // 矢印あり → edge を特定
    if (entry.kind === "edge") {
      const fromId = actorToNodeId.get(entry.from) ?? slugify(entry.from);
      const toId = actorToNodeId.get(entry.to) ?? slugify(entry.to);
      // edge id は `e{idx}-{fromId}-{toId}` の形。 末尾一致で見る。
      // 部分一致で見ると、 名前に `-` を含む箱 (`api-gateway`) の id が別の矢印の id に
      // 混ざって当たる (実測 = 箱を光らせたい指定で矢印が光った)
      for (const edgeId of edgeIds) {
        if (edgeId.endsWith(`-${fromId}-${toId}`)) {
          out.push(edgeId);
        }
      }
      continue;
    }
    // actor 名 → node id。 見つからなければ slug の形でも探す。
    // 順序図だけが slug を受理する状態にすると、 同じ記述が図種で別の意味になる
    // (実測 = `api-gateway` が順序図では光り、 流れ図では何も光らなかった)
    const nodeId = actorToNodeId.get(entry.name) ?? slugLookup(actorToNodeId, entry.name);
    if (nodeId) {
      out.push(nodeId);
    }
  }
  return out;
}

// ─── helpers ──────────────────────────────────────────────────

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龯\-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "n"
  );
}

const CARDINALITY_PATTERNS: Array<[RegExp, ErRelationCardinality]> = [
  [/1:1/, "1:1"],
  [/1:N/i, "1:N"],
  [/N:1/i, "N:1"],
  [/N:M/i, "N:M"],
  [/0\.\.1/, "0..1"],
  [/1\.\.\*/, "1..*"],
];

// cardinality token を「単語の途中でない」 境界で囲んだ RegExp を作る (parse / strip で共有する SSOT)。
// 前後が identifier 文字 (英数字 + アンダースコア) なら token とみなさない = `column:Metadata` の `n:M` /
// `10:11:12` の `1:1` / `field_1:N` の `1:N` を cardinality と誤認して壊すのを防ぐ
// (cc-codex #879 Round 9/10/11)。 `_` を含むのは ER label が DB schema 由来で snake_case 命名が多く、
// `_` 直後に cardinality 様の部分列が来る label が現実的に起こるため (`field_1:N` / `parent_N:M_child`)。
// strip と parse で別々に pattern.test / replace すると境界規則が drift するため、 この 1 関数を両経路で使う。
function boundedCardinalityRegExp(pattern: RegExp, extraFlags = ""): RegExp {
  const base = pattern.flags.includes("i") ? "i" : "";
  return new RegExp(`(?<![A-Za-z0-9_])(?:${pattern.source})(?![A-Za-z0-9_])`, base + extraFlags);
}

function parseCardinalityFromLabel(label: string): ErRelationCardinality | null {
  for (const [pattern, card] of CARDINALITY_PATTERNS) {
    if (boundedCardinalityRegExp(pattern).test(label)) return card;
  }
  return null;
}

// stripCardinality が「水平空白」 として畳んでよい文字を明示列挙する (space / tab / 全角空白 U+3000)。
// 改行系 (LF / CR / U+2028 line separator / U+2029 paragraph separator / vertical tab / form feed) は
// 含めない = これらは label の行構造として保持する (cc-codex #879 Round 5/6 指摘 = `\s` / `[^\S\r\n]`
// では Unicode 行区切りや CRLF を誤って畳んでしまう)。 括弧除去側と正規化側で同じ class を共有する。
const HORIZONTAL_WS = " \\t\\u3000";
const HWS = `[${HORIZONTAL_WS}]`;

function stripCardinality(label: string): string {
  let r = label;
  let removed = false;
  for (const [pattern] of CARDINALITY_PATTERNS) {
    // cardinality token を「それを囲む括弧ごと 1 単位」 で除去する。
    // まず `(1:N)` のように token を直接包む括弧つき形を除去し、 次に裸の token を除去する。
    // 括弧を token 単位で消すことで、 label 中の cardinality と無関係な正当な括弧 (例
    // `fn() now` の `()`) を壊さない (cc-codex #879 Round 4 指摘 = 空括弧の全域除去は過剰)。
    // 括弧と token の間は水平空白のみ許容し、 改行を挟む形 (`(\n1:N\n)`) は括弧除去の対象外にする
    // (改行を消費して行構造を壊すのを防ぐ、 Round 6 Finding 2)。
    const src = pattern.source;
    const flags = pattern.flags.includes("i") ? "gi" : "g";
    const before = r;
    r = r.replace(new RegExp(`\\(${HWS}*${src}${HWS}*\\)`, flags), "");
    // 裸 token 除去 = parse と同じ単語境界付き matcher (boundedCardinalityRegExp) を global で適用する。
    // 前後が英数字なら token とみなさないため、 timestamp (`10:11:12`) / 比率 (`10:11`) / alphabet 埋め込み
    // (`column:Metadata`) を壊さず、 同一 token の複数出現 (`1:N and 1:N`) は全て消す。 parse 側と境界規則を
    // 単一 SSOT にすることで strip/parse の乖離 (strip は消すが parse は残す等) を構造的に防ぐ
    // (cc-codex #879 Round 9/10 = 数字境界だけ / strip 側だけの修正では 2 経路 drift + alphabet 埋め込み穴)。
    r = r.replace(boundedCardinalityRegExp(pattern, "g"), "");
    if (r !== before) removed = true;
  }
  // token を除去していない label は空白を一切いじらない (無条件適用でも改行 / 複数空白を保持する、
  // cc-codex #879 Round 5 指摘 = 無条件正規化は改行を含む label を破壊した)。
  if (!removed) return label;
  // 除去で生じた水平空白 (space / tab / 全角空白) のみ単一化する (例 "A 1:N B" → "A  B" → "A B")。
  // 改行系は HWS に含めないため保持される。
  //   - 各行内の連続水平空白を単一化
  //   - 改行 (LF / CR) の前後の水平空白を除去 (改行直前の trailing 空白も落とす)
  r = r
    .replace(new RegExp(`${HWS}{2,}`, "g"), " ")
    .replace(new RegExp(`${HWS}*([\\r\\n])${HWS}*`, "g"), "$1")
    .replace(new RegExp(`^${HWS}+|${HWS}+$`, "g"), "");
  // fallback = cardinality 除去後に「視覚的に意味のある文字」 が残らない場合は元 label を返す
  // (Round 6 Finding 1 = 除去後に空白/不可視文字だけ残ると不可視 label になるのを防ぐ)。
  //
  // 「意味のある文字」 の判定は個別の空白/不可視文字を列挙 (denylist) すると際限が無く、
  // Round 7 で `\s` → `\p{White_Space}` に変えたら NEL は拾えたが BOM を落とす等のいたちごっこに
  // なった (cc-codex #879 Round 7/8/9)。 そこで Unicode の「見えない文字」 を 4 カテゴリで構造的に
  // 判定する = 以下のいずれでもない可視文字が 1 つでもあれば意味あり。
  //   - White_Space ... 全空白 (space / tab / NBSP / NEL / 全角空白 / 各種 Unicode space / 改行系)
  //   - Cf (Format) ... BOM / ZWSP / ZWNJ / ZWJ / WORD JOINER / soft hyphen 等
  //   - Cc (Control) ... 制御文字
  //   - Default_Ignorable_Code_Point ... variation selector (Mn) / Hangul filler (Lo) 等、 Cf に
  //     入らない不可視文字 (Cf/Cc/White_Space だけでは取りこぼすと Round 9 で判明)
  // 4 カテゴリで Unicode の非表示文字を網羅する (Braille blank U+2800 や通常文字は content 維持)。
  const hasVisible = /[^\p{White_Space}\p{Cf}\p{Cc}\p{Default_Ignorable_Code_Point}]/u.test(r);
  return hasVisible ? r : label;
}

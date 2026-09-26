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

import type { DslDocument, DslLane, DslStep, DslEventBinding, PresetType } from "./types";
// 図種ごとの組み立てを分けた先 (#2030)。 共有の小道具から順に出している。
// どれも他の file を取り込まない葉なので、図種ごとの file と両方から呼んでも輪にならない
import { 向きを選べる図種, 縦列より向きが勝つ図種, 既定の向き } from "./compile/direction";
import { actorRefTable, canonicalizeFlowActors } from "./compile/actors";
import { compileC4 } from "./compile/c4";
import { compileClass } from "./compile/class";
import { 鎖でつなぐ形か, 鎖に並べる登場人物, 鎖にしない書き方の案内 } from "./compile/chain";
import { compileEr } from "./compile/er";
import { compileFlow } from "./compile/flow";
import { compileFunnel } from "./compile/funnel";
import { 共通の組み立てへ回す } from "./compile/generic";
import { compileGantt } from "./compile/gantt";

import { compileJourney } from "./compile/journey";
import { compileMind } from "./compile/mind";
import { compileQuadrant } from "./compile/quadrant";
import { compileSequence } from "./compile/sequence";
import { compileSolidity } from "./compile/solidity";
import { compileState } from "./compile/state";
import { compileFlowchart } from "./compile/flowchart";
import { compileSwimlane } from "./compile/swimlane";
import { compileTopology } from "./compile/topology";
import { compileTree } from "./compile/tree";
import { compileValueChart } from "./compile/value-chart";
import { deepRewriteStrings } from "./compile/deep-rewrite";
import {
  効かない箱の欄を並べる,
  板が伝えない箱の欄,
  木の図が伝えない箱の欄,
  値として読む図種,
  値として読む図が伝えない箱の欄,
  骨組みの図種,
  骨組みの図が伝えない箱の欄,
} from "./compile/actor-option-notice";
import {
  効かない矢印の欄を並べる,
  向きだけを使う図が伝えない矢印の欄,
} from "./compile/edge-option-notice";
import { recordDerivedSourceLine } from "./compile/derived-source";
import { mergePartsFromActors, reportPartNodeNotHonored } from "./compile/parts";
// 見本の取り込みが外へ出していた 13 個を、この file から出していた形のまま渡す (#2034)。
// `index.ts` と検査が `./compile` から取り込んでいるので、窓口をここに残す
export {
  MAX_PART_SCALE,
  normalizePartScale,
  partBoxInFrame,
  partDrawsInDiagram,
  partIsMeasurable,
  partRenderSize,
  partScaleFactor,
  partTargetScale,
  partTargetSize,
  partVisualSize,
  partsBaseBottom,
  partsGridCenters,
  部品に上書きを当てる,
  測るために受け取った知らせの数,
} from "./compile/parts";
import { SINGLE_BOX_KINDS, 図種の作り } from "./compile/kinds";
import { collectRenamedTargets, disambiguateActorIds, restoreActorNames } from "./compile/actor-ids";
import { 書いた多重度を読む, 端の形が決まる語 } from "./compile/er-relation";
import { attachDerivedValues, foldValueTriggers, 鎖のどの行から来たか } from "./compile/values";
import {
  applyCanvasPivotPositions,
  applyLayoutOffsets,
  applyNodeTones,
  resolveRelativeDoc,
} from "./compile/placement-apply";
// 箱を測る物差しを、この file から出していた形のまま外へ渡す (#2036)。
// `index.ts` が画面側の測りに使う
export { measureActorBoxes } from "./compile/placement-apply";
import { 縦列を選べる図種, 書いた縦列に置く, 縦列の判定に数える箱 } from "./compile/lanes";
import type { CompileNotice } from "./compile/notice";
// 分けた先の型を、この file から出していた形のまま外へ渡す (#2030)。
// `index.ts` と 47 個の検査が `./compile` から取り込んでいるので、窓口をここに残す
export type { CompileNotice } from "./compile/notice";
import { 段を読み取る } from "./compile/rows";
import { truncateForMessage } from "./compile/subtitle";
import { slugify } from "./compile/slug";
import { 語の状態を図の語へ直す } from "./compile/word-state";
import type { CdlDiagram, CdlEdge, CdlNode, RowMark } from "@cardenelabs/cdl";
import { FSM_ACTION_MARK, layout, parseFormula, extractIdentifiers, inputDefaultValue } from "@cardenelabs/cdl";
import { parseFocusEntry } from "./focus";
import { DRAW_TARGETS } from "./v05/parser";
import { pointsOutside, stripExternalPaint } from "./color";
import { countDocElements, describeOversize } from "./input-size";
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

export function compileToCdl(doc: DslDocument, opts?: CompileToCdlOpts): CdlDiagram {
  // 大きすぎる図は組み立てない (#1005)。 組み立てにかかる時間は要素数の 2 乗で伸び、
  // 待機の後に同じ流れの中で走るため、 貼ってしまうと画面が戻らない (実測 = 10,000 要素で 7.6 秒)。
  // 両方の記法がここを通るので、 入口ごとに置かずここで 1 度だけ見る
  const oversize = describeOversize({ elements: countDocElements(doc), bytes: 0 });
  if (oversize) throw new Error(oversize);

  // 矢印の指す先を `actors` に書いた名前へ揃える (#1209)。 **図種ごとの組み立てより前**。
  //
  // 動きを書いた図は slug に落として引き、 書いていない図は名前の完全一致で引く。 揃えないと
  // 同じ本文が図種ごとに別の相手を指す = 知らせは出ないのに label が消える / 題が slug に
  // 化ける / 依存が切れる (Round 1 で実測)。
  doc = canonicalizeFlowActors(doc);

  // 知らせは **落とす前の矢印** を見る (#1219)。 落とした後を渡すと、 図が壊れないように
  // 外した矢印が書いた人に届かなくなる
  const 書いたまま = doc;
  // 解決できない矢印を組み立てから外す (#1219)。 残すと、 存在しない箱や枠を指す図ができて
  // 描画の直前で落ちる (実測 = 8 図種)
  doc = dropUnresolvedFlow(doc);

  // 名前から作る id が重なる分を解く (#1220)。 **矢印を落とした後**に見る = 落とした矢印の
  // 端にしか出てこない名前で id を分けても、 その箱は作られない
  const 分けた = disambiguateActorIds(doc, opts?.onNotice);
  doc = 分けた.doc;

  // 図種の組み立てが知らせた行を控える (#2107 / #2111)。 同じ行に多重度の知らせを重ねない。
  // 知らせる図種も知らせの種類も手で並べず、実際に出た知らせで決める
  const 受け取り口 = opts?.onNotice;
  const 図種が知らせた行 = new Set<number>();
  const 図種の知らせ = 受け取り口
    ? (n: CompileNotice): void => {
        図種が知らせた行.add(n.line);
        受け取り口(n);
      }
    : undefined;

  let diagram: CdlDiagram;
  switch (doc.type) {
    case "sequence":
      diagram = compileSequence(doc);
      break;
    case "flow":
      diagram = compileFlow(doc, opts?.partsCatalog);
      break;
    case "flowchart":
      diagram = compileFlowchart(doc);
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
      diagram = compileGantt(doc, 図種の知らせ);
      break;
    case "class":
      diagram = compileClass(doc);
      break;
    case "pie":
      diagram = compileValueChart(doc, "pie", "chart-pie", 図種の知らせ);
      break;
    case "bar":
      diagram = compileValueChart(doc, "bar", "chart-bar", 図種の知らせ);
      break;
    case "line":
      diagram = compileValueChart(doc, "line", "chart-line", 図種の知らせ);
      break;
    case "gauge":
      diagram = compileValueChart(doc, "gauge", "chart-gauge", 図種の知らせ);
      break;
    case "radial":
      diagram = compileValueChart(doc, "radial", "chart-radial", 図種の知らせ);
      break;
    case "stat":
      diagram = compileValueChart(doc, "stat", "chart-stat", 図種の知らせ);
      break;
    case "waffle":
      diagram = compileValueChart(doc, "waffle", "chart-waffle", 図種の知らせ);
      break;
    case "stacked":
      diagram = compileValueChart(doc, "stacked", "chart-stacked-bar", 図種の知らせ);
      break;
    case "slope":
      diagram = compileValueChart(doc, "slope", "chart-slope", 図種の知らせ);
      break;
    case "funnel":
      diagram = compileFunnel(doc, 図種の知らせ);
      break;
    case "tree":
      diagram = compileTree(doc, 図種の知らせ);
      break;
    case "journey":
      diagram = compileJourney(doc, 図種の知らせ);
      break;
    case "quadrant":
      diagram = compileQuadrant(doc, 図種の知らせ);
      break;
    case "c4":
      diagram = compileC4(doc);
      break;
    case "mind":
      diagram = compileMind(doc, 図種の知らせ);
      break;
    default:
      // switch case で全 type を網羅済のため default は unreachable、 template expression で
      // never 型を直接埋込めないので String() で明示 (defensive runtime error message 用)。
      throw new Error(`unknown type: ${String(doc.type)}`);
  }
  // 作り替えた名前を持つ箱と枠を、 **組み立て直後に** 控える (#1220)。 出口で題の文字だけを
  // 見て戻すと、 後から足された見本の中の箱がたまたま同じ題を持っていた時に書き換えてしまう
  const 作り替えた対象 = collectRenamedTargets(diagram, 分けた.元の名前);

  // edge と本文の行の対応は表に集めてから 1 edge = 1 回で知らせる (#998)。 経路ごとに
  // その場で呼ぶと、 同じ edge に別の行を 2 度知らせることになる。
  const edgeSourceLines = opts?.onEdgeSource ? new Map<string, number>() : undefined;
  // 矢印ごとに、どの行から来たか。 部品へ引いた矢印を部品の要素へ繋ぎ直す時に、その行に書いた
  // 名指し (`toPartNode`) を読む (#1979)。 矢印の id は部品の取り込みで変わらない
  const 矢印の行 = new Map<string, DslStep>();
  applyEdgeInlineOptions(diagram, doc, edgeSourceLines, 矢印の行, opts?.partsCatalog);
  const 作った組の枠 = applyGroupContainers(diagram, doc);
  // 光らせる相手が実在するかを確かめる。 id への解決は図種ごとに違うが、 名前が居るか
  // 居ないかは記述だけで決まるので 1 か所で見る。
  // 記法にはあるのに図がその相手を持たない形 (#2398) は、組み上がった図と突き合わせる
  reportMissingFocusTargets(書いたまま, opts?.onNotice, diagram);
  // 矢印が指す名前が actors に居るかを確かめる。 図種ごとの解決より前に、 記述だけで決まる
  reportMissingFlowActors(書いたまま, opts?.onNotice);
  // 両端が同じ矢印を伝える (#1227)。 落とす前の `flow` を見る
  // 静止した `type: flow` で書いた矢印の端が使われないことを伝える (#1269)。
  // 自分へ戻る形と居ない名前を指す形は既に落ちた後の `doc` を見る = 上の 2 件と重ねない
  reportFlowEndpointNotHonored(doc, 分けた.元の名前, opts?.onNotice, opts?.partsCatalog);
  reportLaneNotHonored(書いたまま, opts?.onNotice);
  /*
   * 箱の知らせが出た行を控える (#2368)。 片方だけの位置の知らせ (#2362) を同じ行に重ねない。
   *
   * 知らせる図種も知らせの種類も手で並べず、実際に出た知らせで決める (`図種の知らせ` と同じ形)。
   */
  const 箱に知らせた行 = new Set<number>();
  const 箱の知らせ = 受け取り口
    ? (n: CompileNotice): void => {
        箱に知らせた行.add(n.line);
        受け取り口(n);
      }
    : undefined;
  reportActorKindNotHonored(書いたまま, 箱の知らせ);
  reportTreeActorOptionNotHonored(書いたまま, 箱の知らせ);
  reportValueChartActorOptionNotHonored(書いたまま, 箱の知らせ);
  reportSkeletonActorOptionNotHonored(書いたまま, 箱の知らせ);
  reportHalfWrittenPosition(書いたまま, 箱に知らせた行, opts?.onNotice);
  // 出した行を `図種が知らせた行` に控える = 多重度の知らせ (#2107) を同じ行に重ねない
  reportSkeletonEdgeOptionNotHonored(書いたまま, 図種が知らせた行, 図種の知らせ);
  reportMessageOptionNotHonored(書いたまま, opts?.onNotice);
  reportBandProblems(書いたまま, diagram, opts?.onNotice);
  reportCardinalityNotHonored(書いたまま, 図種が知らせた行, opts?.onNotice);
  reportFlowOffsetNotHonored(書いたまま, opts?.onNotice);
  reportDocEyebrowNotHonored(書いたまま, opts?.onNotice);
  reportDirectionNotHonored(書いたまま, opts?.onNotice);
  reportDrawNotHonored(書いたまま, opts?.onNotice);
  reportChartFieldsNotHonored(書いたまま, opts?.onNotice);
  reportAxesNotHonored(書いたまま, opts?.onNotice);
  reportPartNodeNotHonored(書いたまま, opts?.onNotice);
  // `位置: Web の右` を実際の配置から絶対座標に直す。 以降は座標を直接書いた時と同じ経路
  const placed = resolveRelativeDoc(diagram, doc, opts?.onNotice, opts?.partsCatalog);
  // canvas pivot 新 spec = 全 preset 共通の post-process で actor.posX/Y を CDL lane / node に伝播
  applyCanvasPivotPositions(diagram, placed);
  // CAR-1657 = parts kind actor を merge (opts.partsCatalog 経由)、 applyV05Extensions 後段で実行
  const 追加した縦列: DslLane[] = [];
  const extended = applyV05Extensions(diagram, placed, 追加した縦列);
  /*
   * 書いた色を箱に載せる (#2333)。 **題を写した後に呼ぶ**。
   *
   * 照合は箱に出る題で行う (理由は `applyNodeTones` の説明)。 その題が箱に入る時点が
   * 図種で 2 つに割れており、15 図種は組み立て器が `箱の題` で入れる一方、
   * 順序図 / solidity / 帯図 / c4 は登場人物の名前で箱を作り、`applyV05Extensions` が
   * 題へ書き換える。 書き換えより前に照合すると、後者の 4 図種で題と名前が食い違う。
   *
   * 実測 = ここより前で呼んでいた間、題を書いた箱の色が 5 図種 (フロー / 構成図 /
   * 状態遷移 / クラス図 / ER 図) で消え、名前で照合していたため帯図と c4 だけが通っていた。
   * 呼ぶ位置を変えずに照合だけを題へ寄せると、今度は帯図と c4 が落ちる (実測)。
   */
  applyNodeTones(extended, placed);
  // 値の知らせは、本文なら値を書いた行、見本なら見本を置いた行を指す。 `derived` 自体には
  // source position が無いため、見本を重ねる間だけ別表で宣言元を持ち回る (#1180)。
  const inheritedDerivedSourceLines = opts?.onNotice ? new Map<string, number[]>() : undefined;
  for (const value of extended.derived ?? []) {
    recordDerivedSourceLine(inheritedDerivedSourceLines, value.id, 0);
  }
  const merged = mergePartsFromActors(
    extended,
    placed,
    opts?.partsCatalog,
    opts?.onNotice,
    inheritedDerivedSourceLines,
    矢印の行,
  );
  // 箱が 1 つも入らなかった縦列を伝える (#1241)。
  //
  // **見本 (parts) を重ねた後に見る**。 見本の箱は `lane` で行き先を選べるため、
  // `lanes:` で作った縦列に後から入る (実測 = 重ねる前に見ると、箱が入っている縦列にまで
  // 知らせが出た)。
  //
  // 字の集合では防げない = 全角 (`lane-Ａ` に対し生成は `lane-a`) でも打ち間違い
  // (`lane-idl`) でも結果は同じで、新しい縦列が増えるだけで書いた幅は元の縦列に届かない。
  // 受け付けを字で絞るのではなく、合わなかったこと自体を伝える
  reportEmptyDeclaredLanes(merged, 追加した縦列, opts?.onNotice);

  // 表が揃ってから 1 edge = 1 回で知らせる。 merge 後に残っている edge だけを対象にする =
  // 途中で消えた edge の行を知らせても呼出側が使えない。
  if (edgeSourceLines && opts?.onEdgeSource) {
    const alive = new Set(merged.edges.map((e) => e.id));
    for (const [id, line] of edgeSourceLines) {
      if (alive.has(id)) opts.onEdgeSource(id, line);
    }
  }
  // 動かない図に段を 1 つ入れる (#1086)。
  //
  // 描画側は「段が 1 件以上」 を要求するが、 段を作るかどうかは種類ごとにばらけている。
  // 実測 = `animation:` を書かない同じ記法を 12 種に与えると、 6 種 (sequence / flow / er /
  // state / topology / solidity) は描かれ、 6 種 (swimlane / gantt / class / pie / c4 / mind)
  // は「phase が 0 件です」 で弾かれた。 書く人から見ると区別する手がかりが無い。
  //
  // **出口で 1 度だけ見る**。 種類ごとに塞ぐと 12 経路のどれかを見落とす。 図は必ずここを
  // 通るので、 ここで段が無ければ入れる。
  injectStaticPhase(merged);
  // 書いた状態を図に載せる (#1162)。 段を書かない図でも値が届くようにする。
  // **値を載せるより先に呼ぶ**。 状態が空のまま式を解くと、参照が全て「無い名前」 になる。
  materializeStates(merged, doc);
  /*
   * 矢印をいつ出すか (#1470)。 描き手がそのまま読む欄なので、書いた語を素通しする。
   *
   * **出口で 1 度だけ載せる**。 図の種類ごとに組み立てが分かれており、経路ごとに書くと
   * どれかを見落とす (`injectStaticPhase` / `materializeStates` と同じ理由)。
   */
  if (doc.reveal !== undefined) merged.edgeReveal = doc.reveal;
  if (doc.relations !== undefined) merged.relationFocus = doc.relations;
  // 語の欄が状態を読むとき、その状態には記法の語が入っている。 図の語へ直す (#1201)
  語の状態を図の語へ直す(merged);
  // きっかけ形の値を段の時計を読む式へ畳む (#1161 段 2)。 **値を載せるより先に呼ぶ** =
  // 畳んだ式を `attachDerivedValues` が他の値と同じ経路で載せるため、 順序 / 重なり / 知らせの
  // 扱いが式形と揃う。 時計の状態と段の補間もここで足す
  const 畳んだきっかけ = foldValueTriggers(merged, doc, opts?.onNotice);
  attachDerivedValues(merged, doc, opts?.onNotice, inheritedDerivedSourceLines, 畳んだきっかけ);
  // 値を見せる部品を図に載せる (#1374)。 parts が持つ部品は merge 済みなので残したまま足す。
  // **外部参照を落とす前に載せる**。 後から足すと readout の color / colors だけが出口の検査を
  // 迂回し、 `url(https://...)` がそのまま SVG の paint 属性へ届く。
  if (doc.readouts && doc.readouts.length > 0) {
    // 出口の paint 検査は diagram を直接書き換える。 doc の object を共有すると、検査が
    // compileToCdl の入力まで書き換えて入力不変性を壊すため、nested field も含めて写す。
    //
    // **書いた行は図へ載せない** (#2405)。 行は読む元の名前を突き合わせた知らせのために持つ。
    // 残すと、行を足しただけで組み上がる図が変わる。
    type 図の読み取り値 = NonNullable<CdlDiagram["readouts"]>[number];
    const ownReadouts = doc.readouts.map(({ pos: _書いた行, ...readout }) =>
      deepRewriteStrings(readout, (value) => value) as 図の読み取り値,
    );
    merged.readouts = [...(merged.readouts ?? []), ...ownReadouts];
  }
  /*
   * 読む人が動かすつまみを図に載せる (#1389)。
   *
   * 部品と同じく写して載せる = 出口の paint 検査が diagram を直接書き換えるため、doc の
   * object を共有すると `compileToCdl` の入力まで書き換わって入力不変性が壊れる。
   */
  if (doc.inputs && doc.inputs.length > 0) {
    const ownInputs = doc.inputs.map(
      (input) => deepRewriteStrings(input, (value) => value) as typeof input,
    );
    merged.inputs = [...(merged.inputs ?? []), ...ownInputs];
  }
  /*
   * つまみの値から決まる値を図に載せる (#1391)。
   *
   * 部品やつまみと同じく写して載せる。 式の文字列は色を塗る位置に届かないが、
   * 入力を書き換えない形を 3 経路で揃える方が読み手に説明しやすい。
   */
  if (doc.formulas && doc.formulas.length > 0) {
    const ownFormulas = doc.formulas.map((formula) => ({
      id: formula.id,
      expression: formula.expression,
      // 名札は操作部が式の名前として描く (#1916、cdl#853)。 書かなければ欄ごと付けない
      ...(formula.label !== undefined ? { label: formula.label } : {}),
      line: formula.pos?.line ?? 0,
    }));
    /*
     * 式が読む名前が、どこにも書かれていないことを知らせる (#1391)。
     *
     * engine が読める名前は、つまみと **先に宣言した式** だけ。綴り違い、状態、
     * `values:`、後から宣言する式を渡すと、描画時に未定義参照として例外になる。
     *
     * **解けない式は図へ載せない**。 engine は未定義参照や input/formula の同名衝突を
     * runtime error にするため、残すと図全体が描けない。式以外の図は出し、知らせを返す。
     */
    const つまみ = new Map((merged.inputs ?? []).map((input) => [input.id, input]));
    const 先に書かれた式 = new Set((merged.formulas ?? []).map((formula) => formula.id));
    const 載せる式 = [...(merged.formulas ?? [])];
    for (const formula of ownFormulas) {
      if (つまみ.has(formula.id) || 先に書かれた式.has(formula.id)) {
        opts?.onNotice?.({
          kind: "formula-unresolved",
          actor: formula.id,
          line: formula.line,
          message: `式 "${formula.id}" の名前が、先に書かれたつまみまたは式と重なっています`,
          hint: "`inputs:` と `formulas:` では重ならない名前を使う",
        });
        continue;
      }
      let 名前たち: Set<string>;
      try {
        名前たち = extractIdentifiers(parseFormula(formula.expression));
      } catch {
        // 読めない式は記法の読み取りが既に知らせている。 ここで二重に出さない
        continue;
      }
      let 解けない = false;
      for (const 名 of 名前たち) {
        if (先に書かれた式.has(名)) continue;
        const input = つまみ.get(名);
        if (input) {
          const 初期値 = inputDefaultValue(input);
          if (typeof 初期値 === "number" || typeof 初期値 === "boolean") continue;
          解けない = true;
          opts?.onNotice?.({
            kind: "formula-unresolved",
            actor: formula.id,
            line: formula.line,
            message: `式 "${formula.id}" が、数でも真偽でもないつまみ "${名}" を読んでいます`,
            hint: "式が読めるつまみは slider / number / stepper / timeline / toggle",
          });
          continue;
        }
        解けない = true;
        opts?.onNotice?.({
          kind: "formula-unresolved",
          actor: formula.id,
          line: formula.line,
          message: `式 "${formula.id}" が、つまみまたは先に書かれた式ではない名前 "${名}" を読んでいます`,
          hint: "`inputs:` に書くか、参照される式をこの式より前に書く",
        });
      }
      if (解けない) continue;
      載せる式.push({
        id: formula.id,
        expression: formula.expression,
        ...(formula.label !== undefined ? { label: formula.label } : {}),
      });
      先に書かれた式.add(formula.id);
    }
    if (載せる式.length > 0) merged.formulas = 載せる式;
    else delete merged.formulas;
  }
  // **3 つの節を全て載せ終えてから呼ぶ** = 読む元は `states` / `inputs` / `formulas` に散っており、
  // 途中で呼ぶと、後から載る節の名前を「無い」 と知らせる
  // **つまみを載せ終えてから呼ぶ** = 記法は `states:` を `inputs:` より前に書けるため、
  // 途中で呼ぶと後から載るつまみを見落とす
  reportStateInputMismatch(doc, merged, opts?.onNotice);
  reportReadoutSourceMissing(doc, merged, opts?.onNotice);
  /*
   * 押下などの出来事で動く仕掛けを図に載せる (#1393)。
   *
   * **相手の名前を識別子へ直す**。 記法は識別子を書けないため名前で指す。 指す先が
   * 見つからない形は載せずに知らせる = 描画側は知らない識別子を黙って無視するため、
   * 残すと「書いたのに押しても何も起きない」 が手掛かりなしで起きる。
   *
   * 識別子は書いた順に `evt-1` から振る (組み立て API と同じ)。
   */
  if (doc.events && doc.events.length > 0) {
    const 載せる: NonNullable<CdlDiagram["eventBindings"]> = [...(merged.eventBindings ?? [])];
    for (const e of doc.events) {
      const 相手 = 出来事の相手を解く(merged, doc, e);
      if (相手 === undefined) {
        /*
         * **原因を 2 つに分ける** (#2336)。 書いた名前が本文に在るかで、直し方が正反対になる。
         *
         * 無い = 綴り違いなので「名前で書く」 の案内が効く。
         * 在る = その図種が登場人物を箱 / 矢印にしないので、同じ案内に従っても永久に直らない。
         * 1 つの知らせにまとめていた間、後者は書き直しの繰り返しに入る形だった
         * (実測 = 24 図種のうち箱を指せるのは 7 図種)。
         */
        const 呼び名 = 出来事の相手の呼び名[e.target.kind];
        opts?.onNotice?.(
          出来事の相手が本文に在る(doc, e)
            ? {
                kind: "event-target-not-honored",
                actor: e.handlerId,
                line: e.pos.line,
                message:
                  `type: ${doc.type} は書いた名前を${呼び名}にしないため、` +
                  ` 出来事 "${e.handlerId}" を付けられません`,
                hint: `名前の書き方の問題ではありません。 図そのもの (\`diagram: true\`) を指すか、${呼び名}を作る図種に変えてください`,
              }
            : {
                kind: "event-target-missing",
                actor: e.handlerId,
                line: e.pos.line,
                message: `出来事 "${e.handlerId}" が指す相手が見つかりません`,
                hint: "box は箱の名前、 lane は縦列の名前、 arrow は `A -> B` で書く",
              },
        );
        continue;
      }
      載せる.push({
        id: `evt-${載せる.length + 1}`,
        event: e.event,
        target: 相手,
        handlerId: e.handlerId,
      });
    }
    if (載せる.length > 0) merged.eventBindings = 載せる;
  }
  // 巻き上げに応じて進む値を図に載せる (#1393)。 相手を持たないのでそのまま写す
  if (doc.scrolls && doc.scrolls.length > 0) {
    merged.scrollTriggers = [
      ...(merged.scrollTriggers ?? []),
      ...doc.scrolls.map((x) => ({ ...x })),
    ];
  }
  // 図の外を指す値を、 色を塗る位置から落とす (#1004)。
  //
  // 入口ごとに塞ぐ形は採らない。 状態の上書き / phase が入れる値 / 画面が直接書く背景色 /
  // 埋め込んだ JSON / states / values と入口が複数あり、 1 つ見落とすと穴が残る。
  // **図への追加を全て終えた後**、 出口で 1 度だけ見る。 この後に状態を足すと検査を迂回する。
  const 外した部品の配色 = stripExternalReadoutPalettes(merged);
  for (const dropped of [...stripExternalPaint(merged), ...外した部品の配色]) {
    opts?.onNotice?.({
      kind: "external-paint-dropped",
      actor: dropped.path,
      line: 0,
      message: `図の外を指す値 (${truncateForMessage(dropped.value)}) は色として使えないため外しました`,
      hint: "色は `#ff0000` のような色番号か、 `red` のような色名で書く",
    });
  }
  // 作り替えた名前を表示だけ戻す (#1220)。 **図への追加を全て終えた後**に戻す = 途中で戻すと、
  // 後続の処理が名前で引く時に作り替え前と後が混ざる
  restoreActorNames(merged, 分けた.元の名前, 作り替えた対象);
  // 配色と行の縞は **図への追加を全て終えた後**に当てる (#1553)。 図種ごとの組み立ては
  // 20 か所以上あり、そのどれに足しても残りが取り残される
  配色と縞を当てる(merged, doc);
  静止した図の焦点を外す(merged, doc);
  // 位置のずらしは **配置に効く欄を全て載せた後** に当てる (#1971)。 縦列の幅や視点の間隔を
  // 足す前に測ると、後から足された分だけ狙いがずれる
  applyLayoutOffsets(merged, doc, opts?.onNotice);
  // 組の枠は **縦列の位置が全て決まった後** に置く (#1972)。 位置のずらしより前に置くと、
  // ずらした縦列から枠が離れる
  applyGroupFrames(merged, doc, 作った組の枠, opts?.onNotice);
  return merged;
}

/**
 * 段を書かない図では、どの箱も「いま」 にしない (#1557)。
 *
 * ## 何が起きていたか
 *
 * `animation:` を書かない図でも段は 1 つ作られる。 作るのは 2 経路あり、cdl の組み立て器
 * (`er()` / `flow()` / `topology()` 等) が図種ごとに 1 段を作る経路と、どちらも作らない図種に
 * dragon が 1 段を足す経路 (`injectStaticPhase`)。 どちらも **全ての箱と矢印を段に載せる**。
 *
 * 描画側は段に載った箱を「いま」 として描く (枠を主役色にして太くする)。 その結果、静止した図は
 * 全ての箱が「いま」 になり、止まっている箱の枠が 1 度も出ない (実測 = ER 図 3 箱 / フロー 2 箱)。
 *
 * 全部を強調するのと何も強調しないのは、どちらも「区別が無い」 状態。 後者の方が落ち着いて読める。
 *
 * ## 矢印は段に載せたまま置く
 *
 * 描画側の既定 (`edgeReveal: "phase"`) は「段が名指しする矢印は、その段が来るまで描かない」。
 * 矢印まで外すと、静止した図から線が 1 本も出なくなる。
 *
 * ## 判定は書いた内容で決める
 *
 * 「段に全ての箱が載っている図」 を目印にしない = 書き手が 1 段だけ書いて全部を焦点にした図と
 * 見分けが付かない。 見るのは `animation:` を書いたかどうかで、これは書き手が段のために書く値。
 */
function 静止した図の焦点を外す(diagram: CdlDiagram, doc: DslDocument): void {
  if ((doc.animate?.phases.length ?? 0) > 0) return;
  const 箱 = new Set(diagram.nodes.map((n) => n.id));
  for (const phase of diagram.phases) {
    phase.activate = phase.activate.filter((id) => !箱.has(id));
  }
}

const 既定の配色を持つ図種: ReadonlySet<DslDocument["type"]> = new Set(["er", "class"]);

/**
 * 図の配色と、表の箱の行の縞を当てる (#1553)。
 *
 * ## 配色
 *
 * cdl は色を持たない。 名前だけを `data-cdl-palette` として markup に出し、消費側
 * (`cdl-theme.css`) が名前を見て 7 つの口 (台 / 行の面 / 縞 / 枠 / 字 / 型名 / 線) に色を当てる。
 *
 * ER 図とクラス図は書かなくても `kinari` (生成りに茶) になる。
 * どちらも箱の作りが同じ (行頭の印 + 左に名前 + 右に型) で、名前と型が離れて並ぶため、
 * 行を横に追う目印 (行の縞) が要る。
 * 縞の色は配色からしか来ないので、既定が無いと縞が箱の面と同じ色に落ちて 1 本も出ない。
 * 書き手が `palette:` を書いた時はそちらが勝つ。
 *
 * クラス図の意匠は `docs/design/class/note.md` が持つ。
 *
 * ## 行の縞
 *
 * cdl の `er()` 組み立て器は縞を既定で敷くが、**動きを持つ ER 図はその経路を通らない**
 * (`compileGenericWithAnimate` が箱を直に組む)。 同じ図が動きの有無で縞を持ったり持たなかったり
 * しないよう、出口で揃える。
 *
 * 縞を描くのは表の箱 (`storage`) だけ。 他の種別の箱に書いても描画側が読まないので、
 * ここで対象を絞って「書いたのに出ない」 欄を残さない。
 */
function 配色と縞を当てる(diagram: CdlDiagram, doc: DslDocument): void {
  const 配色 = doc.palette ?? (既定の配色を持つ図種.has(doc.type) ? "kinari" : undefined);
  if (配色 !== undefined) diagram.palette = 配色;
  if (doc.type !== "er") return;
  for (const node of diagram.nodes) {
    if (node.kind === "storage") node.rowStripe = true;
  }
}

/**
 * readout の配色配列から外部参照を落とす (#1374)。
 *
 * 共通の `stripExternalPaint` は `color` / `fill` のような key を見るが、 `colors` の中へ
 * 入ると配列要素には key が無い。 `heat-cell` が公開した配色だけはここで要素ごとに閉じる。
 */
function stripExternalReadoutPalettes(diagram: CdlDiagram): Array<{ path: string; value: string }> {
  const stripped: Array<{ path: string; value: string }> = [];
  for (let i = 0; i < (diagram.readouts?.length ?? 0); i += 1) {
    const readout = diagram.readouts?.[i] as { colors?: readonly string[] } | undefined;
    if (!readout?.colors) continue;
    const colors = [...readout.colors];
    for (let j = 0; j < colors.length; j += 1) {
      const color = colors[j];
      if (color === undefined || !pointsOutside(color)) continue;
      colors[j] = "none";
      stripped.push({ path: `readouts[${i}].colors[${j}]`, value: color });
    }
    readout.colors = colors;
  }
  return stripped;
}

/**
 * 書いた状態 (`states:`) を図に載せる (#1162)。
 *
 * 状態を図に登録するのは `animation:` を書いた経路だけだった (`compileGenericWithAnimate` と
 * `injectPhasesFallback` のどちらも段がある時しか走らない)。 このため `states:` と `values:`
 * だけを書いた図では図の状態が 0 件になり、描画側が組み立てる値が空になる。 書いた値は
 * 1 つも届かず、箱には `{waiting}` の生の形が出ていた (実測)。
 *
 * **出口で 1 度だけ載せる**。 段を作る経路は図の種類ごとにばらけており、経路ごとに書くと
 * どれかを見落とす (`injectStaticPhase` と同じ理由)。
 *
 * 既に載っている名前は触らない。 段の経路が登録した初期値と、見本から引き継いだ状態
 * (`alias__id` の形) の両方を保つ。
 */
function materializeStates(diagram: CdlDiagram, doc: DslDocument): void {
  const 載っている = new Set(diagram.states.map((s) => s.id));
  for (const st of doc.animate?.states ?? []) {
    if (載っている.has(st.name)) continue;
    diagram.states.push({ id: st.name, initial: st.initial });
    載っている.add(st.name);
  }
}

/**
 * 動かない図に段を 1 つ入れる (#1086)。
 *
 * 描画側は段が 1 件以上あることを要求する。 一方で段を作るかどうかは種類ごとにばらけており、
 * `animation:` を書かない図は 12 種のうち 6 種だけが描かれ、 残り 6 種は弾かれていた。
 *
 * ## 空の段にはしない
 *
 * 描画側の既定 (`edgeReveal: "phase"`) は「段が名指しする矢印は、その段が来るまで描かない」。
 * 空の段を入れると、静止した図から線が 1 本も出ない。
 *
 * **箱は段に載せた後で外す** (#1557)。 ここで載せるのは矢印を描かせるためで、箱まで
 * 「いま」 のままにすると静止した図の全ての箱が主役色の枠になる。 外すのは出口の
 * `静止した図の焦点を外す` が 1 か所で行う = 段を作る経路は cdl の組み立て器にもあり、
 * ここだけ直しても図種によって残る。
 *
 * ## 既に段がある図には触らない
 *
 * `animation:` を書いた図と、 描画側が段を作る 6 種はここに入らない。 段の数と中身は書いた
 * とおりに保たれる。
 */
function injectStaticPhase(diagram: CdlDiagram): void {
  if (diagram.phases.length > 0) return;
  // 光らせる相手が 1 つも無い図 (要素ゼロ) でも段は入れる。 描画側が要求するのは段の存在で
  // あって中身ではなく、 ここで諦めると「空の図は描けない」 という別の欠落になる
  const activate = [...diagram.nodes.map((n) => n.id), ...diagram.edges.map((e) => e.id)];
  diagram.phases.push({
    id: "static",
    duration: 1000,
    title: diagram.topic ?? "全体",
    body: "",
    activate,
    tweens: [],
    sets: [],
  });
}

/**
 * 解決できない矢印を落とした `flow` を返す (#1219)。
 *
 * 落とすのは **組み立てに渡す分だけ**。 知らせ (`reportMissingFlowActors`) は元の `flow` を
 * 見るので、 落とした矢印も書いた人に届く。
 */
function dropUnresolvedFlow(doc: DslDocument): DslDocument {
  if (図種の作り[doc.type] === "図全体を 1 箱") return doc;
  const 表 = actorRefTable(doc);
  const flow = doc.flow.filter((s) => 表.has(s.from) && 表.has(s.to));
  return flow.length === doc.flow.length ? doc : { ...doc, flow };
}

/**
 * 箱ごとに分かれる図種で最上位の小見出しを書いた時に伝える (#1247)。
 *
 * 小見出しは **箱 1 つに対して 1 つ**。 図全体を 1 箱にする図種 (`pie` / `bar` 等) では
 * 相手が決まるが、 箱ごとに分かれる図種では「どの箱の小見出しか」 が決まらない。
 *
 * 黙って捨てると「書いたのに出ない」 が手掛かりなしで起きる。 箱ごとに書く形
 * (`- A: { eyebrow: "..." }`) を案内する = そちらは従来どおり効く。
 */
function reportDocEyebrowNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.eyebrow === undefined) return;
  if (図種の作り[doc.type] === "図全体を 1 箱") return;
  onNotice({
    kind: "eyebrow-not-honored",
    actor: doc.title,
    // 図の `pos` は常に 1 行目を指す。 書いた行に辿り着けるよう `eyebrowPos` を優先する
    line: doc.eyebrowPos?.line ?? doc.pos?.line ?? 0,
    message: `最上位に書いた eyebrow は効きません (type: ${doc.type} は箱ごとに分かれるため相手が決まりません)`,
    hint: '箱ごとに書いてください (`- A: { eyebrow: "..." }`)',
  });
}

/**
 * 起点から描く動きを持たない図種で段に `draw:` を書いた時に伝える (#1312 / #1318)。
 *
 * 対応する 8 図種以外では書いても何も起きないため、黙って捨てると
 * 「書いたのに現れない」 が手掛かりなしで起きる。
 *
 * 段ごとに知らせる = 5 段のうち 1 段だけに書いた形で、どの段が効いていないかを読めるようにする。
 */
function reportDrawNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  for (const phase of doc.animate?.phases ?? []) {
    if (phase.draw === undefined) continue;
    // 段の `pos` は `- step:` の行を指す。 書いた行に辿り着けるよう `drawPos` を優先する
    const line = phase.drawPos?.line ?? phase.pos?.line ?? 0;
    if (!DRAWABLE_DOC_TYPES.has(doc.type)) {
      onNotice({
        kind: "draw-not-honored",
        actor: phase.name,
        line,
        message: `段 "${phase.name}" に書いた draw は効きません (type: ${doc.type} は起点から描く動きを持ちません)`,
        hint: `draw が効くのは type: ${[...DRAWABLE_DOC_TYPES].join(" / ")} です`,
      });
      continue;
    }
    // 語が別の図種を指している形 (#1314)。 図は描けるので誤りにはしない
    const 語の図種 = DRAW_TARGETS.get(phase.draw);
    if (語の図種 !== undefined && 語の図種 !== doc.type) {
      onNotice({
        kind: "draw-target-mismatch",
        actor: phase.name,
        line,
        message: `段 "${phase.name}" の draw: ${phase.draw} は type: ${doc.type} では効きません (${phase.draw} は type: ${語の図種} の図に書きます)`,
        hint: `この図では draw: ${doc.type} と書いてください`,
      });
    }
  }
}

/**
 * 段の `draw:` が効く図種 (#1312 / #1314 / #1318)。
 *
 * **語と図種の対応表から導く** (`DRAW_TARGETS`)。 一覧を写すと、語を足した時に片方だけ
 * 古いまま残る。 描画側 (`cdl` の `DRAW_KINDS`) が対応する種別と一致する。
 */
const DRAWABLE_DOC_TYPES: ReadonlySet<PresetType> = new Set<PresetType>(DRAW_TARGETS.values());

/**
 * 縦列を選べる図種で、一部の箱だけが縦列を書いた時に伝える (#1263)。
 *
 * 書かなかった箱の行き先を決める規則が要るが、既定の縦列に集めても自分の縦列を作っても
 * 書いた人の意図と一致する保証が無い。 **全部書くか 1 つも書かないか** を求める。
 *
 * 1 つも書いていない形は従来どおりの並びになるだけなので知らせない。
 *
 * 数える箱は置く側と同じ `縦列の判定に数える箱` から採る (#2372)。 別々に数えると、
 * 見本だけの図で「一部だけ書いた」 形が知らせずに落ちる。
 */
function reportLaneMixed(doc: DslDocument, onNotice: (n: CompileNotice) => void): void {
  const 対象 = 縦列の判定に数える箱(doc);
  const 書いた = 対象.filter((a) => a.lane !== undefined);
  if (書いた.length === 0 || 書いた.length === 対象.length) return;
  const 書いていない = 対象.filter((a) => a.lane === undefined);
  onNotice({
    kind: "lane-not-honored",
    actor: 書いていない[0]?.name ?? "",
    line: 書いていない[0]?.pos?.line ?? 0,
    message: `type: ${doc.type} では縦列を書くなら全ての箱に書きます (書いていない箱: ${書いていない.map((a) => truncateForMessage(a.name)).join(" / ")})`,
    hint: "書かなかった箱をどの縦列に置くかを決められないため、全部書くか 1 つも書かないかにしてください",
  });
}

/**
 * 静止した `type: flow` で、書いた矢印の端が使われないことを伝える (#1269)。
 *
 * この図種は **登場人物を書いた順に鎖状に繋ぐ**。 矢印の説明文は「その箱を to に持つ行」
 * から拾い、書いた側の端 (from) は使わない (`compileFlow`)。
 *
 * そのため `A -> C` と書いても出来るのは `A -> B` で、書いた形と違う図になる。
 * 実測 = `A -> C` / `C -> B` と書くと `A -> B` に `"y"`、`B -> C` に `"x"` が載った。
 * 知らせは 1 件も出ていなかった。
 *
 * ## 鎖にすること自体は変えない
 *
 * 線形の流れを描く図種なので、鎖にするのは仕様。 書いた端どおりに繋ぎたい形は
 * 箱に `lane:` を書くか (#1266)、`direction:` を書けば別の経路へ回る (#1494)。 知らせの hint で
 * それを案内する。 `direction: 縦` を先に挙げるのは、箱ごとに書かずに済み、並びも鎖の時と変わらないため。
 *
 * ## 偶然一致する形では知らせない
 *
 * `A -> B` / `B -> C` のように書いた端がそのまま鎖になる形は、書いたとおりの図になる。
 * ここで知らせると、正しく書いた人にまで出る。
 *
 * ## 既に落ちた行は見ない
 *
 * 居ない名前を指す形 (`flow-actor-missing`) は別の知らせが担う。 落とした後の `doc` を
 * 見ることで、同じ 1 行に知らせが 2 件並ぶのを避ける。
 *
 * 自分へ戻る形は #1462 で落とさなくなった (描画側が輪として描ける)。
 */
function reportFlowEndpointNotHonored(
  doc: DslDocument,
  元の名前: Map<string, string>,
  onNotice?: (n: CompileNotice) => void,
  /** 鎖に並べない部品を決める一覧 (#1987)。 `compileFlow` に渡したものと同じ */
  partsCatalog?: Record<string, CdlDiagram>,
): void {
  if (!onNotice) return;
  if (!鎖でつなぐ形か(doc)) return;
  // 名前が重なった登場人物は組み立ての間だけ尾を付けて分けている (`disambiguateActorIds`)。
  // **判定は分けた後の名前で行い、伝える時は書いた名前に戻す** = 判定は `compileFlow` の
  // 繋ぎ方と揃える必要があり、伝える先は本文なので書いていない名前を指すと直せない
  // (実測 = `"A B 546d26" の端は使われません` と出て、本文にその名前は無い)
  const 書いた名前 = (name: string): string => 元の名前.get(name) ?? name;
  // 鎖が作る組を集める。 登場人物が 1 人以下なら矢印が 1 本も出来ないので、
  // 書いた矢印は全て使われない扱いになる
  const 鎖の組 = new Set<string>();
  const 並び = 鎖に並べる登場人物(doc, partsCatalog);
  並び.forEach((a, i) => {
    const 次 = 並び[i + 1];
    if (次 === undefined) return;
    鎖の組.add(`${a.name}\u0000${次.name}`);
  });
  for (const s of doc.flow) {
    if (鎖の組.has(`${s.from}\u0000${s.to}`)) continue;
    onNotice({
      kind: "flow-endpoint-not-honored",
      actor: 書いた名前(s.from),
      line: s.pos.line,
      message: `"${truncateForMessage(書いた名前(s.from))} -> ${truncateForMessage(書いた名前(s.to))}" の端は使われません (type: flow は登場人物を書いた順に繋ぎます)`,
      hint: `書いた端どおりに繋ぐには次のどれかを書いてください: ${鎖にしない書き方の案内()} (どれも書いた端がそのまま矢印になります)`,
    });
  }
}

/**
 * 板の言づてで、効かないと伝えない矢印の欄 (#2356)。
 *
 * **除外側を書く**。 効かない欄を並べる形にすると、矢印に欄を足した日にその欄だけが
 * 一覧から漏れ、書いた人には「書いたのに何も起きない」 としか見えない。
 *
 * | 区分 | 欄 |
 * |---|---|
 * | 板が描く | 出どころ / 行き先 / 語 / 言づての種類 と、行番号と書いた場所 |
 * | 別の知らせが受け持つ | 部品の端 (`part-node-ignored` が 1 件ずつ伝える) |
 */
const 板が伝えない矢印の欄: ReadonlySet<string> = new Set([
  "no",
  "from",
  "to",
  "label",
  "msgKind",
  "pos",
  "fromPartNode",
  "toPartNode",
]);

/**
 * 順序図の言づてに書いた飾りが使われないことを伝える (#1466)。
 *
 * 板は言づてを **語と向きと種類** で描き、それ以外の飾りを載せる場所が無い = 矢印だった頃は
 * 色味 (`tone`) / 添え字 (`sub`) / 寄せ (`side`) が矢印に付いていたが、板では行になった。
 * 黙って落とすと、書いた側は効いていると思い込む。
 *
 * **伝える欄を並べない** (#2356)。 以前は色味 / 添え字 / 寄せ / 名前のずらし / 多重度 を手で並べて
 * いたため、後から足した項目がどこにも入らなかった (実測 = 矢印に書ける 21 項目のうち 13 件が、
 * 図も変わらず知らせも出ないまま落ちていた)。 板が描く欄を **除いた残り全部** を伝える。
 *
 * `actors` に無い名前を指す言づては見ない (#2111)。 その言づては組み立ての前に落ちて板に載らず、
 * 同じ行を居ない名前の知らせ (`reportMissingFlowActors`) が指している。
 */
function reportMessageOptionNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.type !== "sequence" && doc.type !== "solidity") return;
  const 名前の表 = actorRefTable(doc);
  for (const s of doc.flow) {
    if (!名前の表.has(s.from) || !名前の表.has(s.to)) continue;
    const 効かない = 効かない矢印の欄を並べる(s, 板が伝えない矢印の欄);
    if (効かない.length === 0) continue;
    onNotice({
      kind: "message-option-not-honored",
      actor: s.from,
      line: s.pos?.line ?? 0,
      message: `"${truncateForMessage(s.label)}" に書いた ${効かない.join(" / ")} は効きません (type: ${doc.type} の板は語と向きと種類だけを描きます)`,
      hint: "板には矢印が無いため飾りを載せる先がありません。 言づての種類 (kind: call / return / fire) で描き分けてください",
    });
  }
}

/**
 * 名前を指す欄かどうかを、 綴りで決める (#2405)。
 *
 * 部品の表 (`readout-table.generated.ts`) の 107 種が持つ欄のうち、 別の所に書いた値を名前で
 * 指すのは `source` / `〜Source` / `sourceA` の 3 つの形。 表そのものは「文字列」 としか
 * 言わないため、 どの文字列が名前かは綴りからしか決められない。
 *
 * **規則から外れた綴りで名前の欄が足されると、 その欄だけが黙る**。 規則に当たらない欄の
 * 一覧を検査で固定し、 増えた日に人が 1 件ずつ見分ける形にする
 * (`test/readout-source-2405.test.ts`)。
 */
function 名前を指す欄(欄名: string): boolean {
  return 欄名 === "source" || 欄名.endsWith("Source") || /^source[A-Z]$/.test(欄名);
}

/**
 * 値を見せる部品 (`readouts:`) が読む元の名前を突き合わせて知らせる (#2405)。
 *
 * ## 直す前に起きていたこと
 *
 * 読み取り値は `source: done` の形で、 別の所に書いた値を名前で指す。 **その名前が在るかを
 * 誰も見ていなかった** = 状態を指す図も、 どこにも無い名前を指す図も、 大文字小文字を
 * 間違えた図も、 すべて知らせ 0 件で同じ形のまま描く側へ渡っていた (実測 6 通り)。
 * 描く側は知らない名前を読むと何も出さないので、 書いた人には「部品を置いたのに数字が
 * 出ない」 だけが残る。
 *
 * ## 読む元は 3 つ
 *
 * `states` / `inputs` / `formulas`。 式の名前の突き合わせ (`formula-unresolved`) は
 * つまみと先に書いた式の 2 つしか見ないが、 読み取り値は状態も読めるので 3 つを合わせる。
 *
 * ## 3 つの節を全て載せ終えてから呼ぶ
 *
 * 記法は `readouts:` を 3 つの節より前に書ける。 途中で呼ぶと、 後から載る節の名前を
 * 「無い」 と知らせる。
 *
 * ## 見る欄を `source` だけにしない
 *
 * `stacked-bar` は `source` を持たず `sourceA` / `sourceB` だけを持つ。 `source` だけを
 * 見る形にすると、 その種類が丸ごと黙ったまま残る (表の 107 種が持つ名前の欄は 24 種類)。
 *
 * ## 1 つの部品で 2 つ外れたら 2 件とも出す
 *
 * 片方で打ち切ると、 直した次の回にもう片方が初めて出る。
 */
function reportReadoutSourceMissing(
  doc: DslDocument,
  merged: CdlDiagram,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  const 読み取り値 = doc.readouts ?? [];
  if (読み取り値.length === 0) return;
  const 書かれた名前 = new Set<string>([
    ...(merged.states ?? []).map((x) => x.id),
    ...(merged.inputs ?? []).map((x) => x.id),
    ...(merged.formulas ?? []).map((x) => x.id),
  ]);
  const hint = 書ける値の案内(書かれた名前);
  for (const r of 読み取り値) {
    for (const [欄, 値] of Object.entries(r)) {
      if (!名前を指す欄(欄) || typeof 値 !== "string") continue;
      if (書かれた名前.has(値)) continue;
      onNotice({
        kind: "readout-source-missing",
        actor: 値,
        line: r.pos?.line ?? 0,
        message: `部品 "${truncateForMessage(r.id)}" の ${欄} が、 状態でもつまみでも式でもない名前 "${truncateForMessage(値)}" を読んでいます`,
        hint,
      });
    }
  }
}

/**
 * 状態 (`states:`) とつまみ (`inputs:`) に同じ名前を書いて、 値がずれたことを知らせる (#2413)。
 *
 * ## 両方に書くこと自体は意図された書き方
 *
 * 状態が静止した図の値を決め、 つまみが読み手に値を変えさせる。 カタログの見本 105 箇所が
 * この形で書かれているので、 重なりそのものは誤りにしない。
 *
 * ## ずれると状態の初期値は図のどこにも出ない
 *
 * 描く側は `mergeStateValues(base, overrides)` でつまみの既定値を状態の上に塗り、
 * 静止した最初の一枚にもつまみの既定値が入る。 見本 77 組は 1 組もずれておらず、
 * 書き手が全部手で揃えている決まりなのに、 守れているかを見る仕組みが無かった。
 *
 * ## 効く既定値を自前で導かない
 *
 * 種類によって値の作り方が違い、 欄の名前からは導けない (`timeline` は `defaultSpeedIdx` を
 * 持つが効く既定値は 0)。 描く側が書き出している `inputDefaultValue` をそのまま呼ぶ。
 *
 * ## 突き合わせは文字列で行う
 *
 * 描く側が `merged[key] = String(v)` で文字列にしてから塗るため、 `42` と `"42"` は
 * 同じ値として扱う。
 *
 * ## 式と巻き上げは対象にしない
 *
 * 静止した最初の一枚 (`serverSnapshot`) に入るのはつまみの既定値だけで、 式や巻き上げが
 * 値を作るまでは状態の初期値が見える。 置き値として役に立つので、 ずれていても誤りにならない。
 */
function reportStateInputMismatch(
  doc: DslDocument,
  merged: CdlDiagram,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  const つまみ = merged.inputs ?? [];
  if (つまみ.length === 0) return;
  const 状態 = new Map((doc.animate?.states ?? []).map((s) => [s.name, s]));
  if (状態.size === 0) return;
  for (const input of つまみ) {
    const s = 状態.get(input.id);
    if (s === undefined) continue;
    const 既定 = inputDefaultValue(input);
    if (既定 === undefined) continue;
    if (String(s.initial) === String(既定)) continue;
    onNotice({
      kind: "state-shadowed-by-input",
      actor: input.id,
      line: s.pos.line,
      message: `"${truncateForMessage(input.id)}" を states と inputs の両方に書いていますが、 値が違います (states の ${truncateForMessage(String(s.initial))} は出ません。 つまみの ${truncateForMessage(String(既定))} が使われます)`,
      hint: `states の初期値をつまみの既定値 ${truncateForMessage(String(既定))} に揃えるか、 どちらか一方だけに書く`,
    });
  }
}

/**
 * 「states / inputs / formulas に書いた名前で指す」 の直し方を 1 本作る (#2405)。
 *
 * 並べる件数と 1 件ずつの長さを切るのは `書ける面の案内` と同じ理由 = 名前を上限まで書いた
 * 図で知らせが数百 MB になる。
 */
function 書ける値の案内(書かれた名前: ReadonlySet<string>): string {
  const 見せる数 = 8;
  const 全部 = [...書かれた名前];
  if (全部.length === 0) return "states / inputs / formulas のどれかに値を書く";
  const 一覧 = 全部.slice(0, 見せる数).map(truncateForMessage).join(" / ");
  const 残り = 全部.length - 見せる数;
  return `states / inputs / formulas に書いた名前で指す (${一覧}${残り > 0 ? ` ほか ${残り} 件` : ""})`;
}

/**
 * 順序図の帯 (`bands:`) に書いた面の名前と言づての番号を突き合わせて知らせる (#2404)。
 *
 * ## なぜ誤りにせず知らせにするか
 *
 * 帯が 1 本ずれても図は出る。 「別の所に書いた名前を指す」 欄は 4 つとも知らせで扱っており
 * (箱の `lane` / 組の `lanes` / 出来事の `box` / 矢印の端)、 帯だけを誤りにする理由が無い。
 *
 * ## 帯を描かない図種は、 それを先に知らせて打ち切る
 *
 * 帯は板の縦線に重ねる四角なので、 板を作らない図種には載せる先が無い
 * (実測 = 24 図種のうち 22 図種が `bands:` を読んだうえで黙って捨てていた)。
 * その図で名前や番号を直しても帯は出ないため、 直しても直らない案内を返さない。
 *
 * **図種を手で並べない**。 組み上がった図が板を持つかで決める = 図種を足した日にずれない
 * (`rules/quality.md` の導出可能記述)。
 *
 * ## なぜ読む側ではなくここで確かめるか
 *
 * 記法は `bands:` を `actors:` より前に書ける = 読む途中では面の一覧が揃っていない。
 * 板に載る言づての数も `flow:` を読み終えるまで決まらない。 組み立ての入口は両方を持っている。
 *
 * ## 突き合わせ先は「書いた `actors`」
 *
 * 板の図種は箱が 1 つしか無く、 面は箱の中の行になる = 組み上がった図と突き合わせる相手が居ない
 * (段の注目先 #2398 と同じ)。 名前の受け方は矢印の端と同じ表 (`actorRefTable`) を使うので、
 * id の形 (`api-gateway`) で書いた指定も通る。
 *
 * ## 番号が指すのは言づての行で、 0 から数える
 *
 * 記法の `- DB: 1..2` は段 (`animation` の `step`) ではなく **板に載る言づての行**を指す
 * (実測 = 描く側は `rowY(from)` と `rowY(to)` で四角の上下を決め、 `rowY(i)` は i 通目の
 * 言づての高さを返す)。 見本もその読み方で書かれている (面 4 つ ・ 言づて 7 通の図で
 * `ブラウザ: 0..5` / `DB: 6..6`)。
 *
 * 段と言づては数も起点も違う = 段で数えると、 正しく書いた見本を範囲外として知らせてしまう。
 *
 * ## 板に載らない言づてを数に入れない
 *
 * `actors` に無い名前を指す言づては組み立ての前に落ちて板に載らない (実測 = 3 通のうち 1 通が
 * 落ちて 2 通になる)。 書いた行数で数えると、 落ちた分だけ上限が広がって範囲外を見逃す。
 *
 * ## 言づてが 1 通も無い図でも黙らない
 *
 * 比べる相手が無いからと飛ばすと、 帯を書いたのに何も描かれない図が黙る経路になる。
 * 範囲を示せないので、 理由を「言づてが 1 通も無い」 に変えて同じ知らせを出す。
 *
 * ## 負の番号はここで見ない
 *
 * 記法は数字だけを受ける形 (`\d+`) で読み、 JSON は「0 以上の整数」 を要求する = 2 つの入口が
 * どちらも先に断っている。 ここに枝を置いても 1 度も通らない。 入口の側が緩んだら気付けるよう、
 * 断ることそのものを検査で固定する。
 *
 * ## 名前と番号で打ち切らない
 *
 * 両方外れた帯には 2 件とも出す。 片方で止めると、 名前を直した次の回に番号の誤りが初めて出る。
 */
function reportBandProblems(
  doc: DslDocument,
  diagram: CdlDiagram,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  const 帯 = doc.bands ?? [];
  if (帯.length === 0) return;
  const 板がある = diagram.nodes.some((n) => n.sequenceData !== undefined);
  if (!板がある) {
    for (const b of 帯) {
      onNotice({
        kind: "band-not-honored",
        actor: b.actor,
        line: b.pos?.line ?? 0,
        message: `type: ${doc.type} は帯を描きません (書いた帯は図に出ません)`,
        hint: "帯は板の縦線に重ねる四角なので、 type: sequence か type: solidity で使う",
      });
    }
    return;
  }
  const 名前の表 = actorRefTable(doc);
  const hint = 書ける面の案内(doc);
  const 言づての数 = doc.flow.filter((s) => 名前の表.has(s.from) && 名前の表.has(s.to)).length;
  for (const b of 帯) {
    const line = b.pos?.line ?? 0;
    if (!名前の表.has(b.actor)) {
      onNotice({
        kind: "band-actor-missing",
        actor: b.actor,
        line,
        message: `帯が "${truncateForMessage(b.actor)}" を指していますが、 actors に書かれていません (先頭の面に帯が出ます)`,
        hint,
      });
    }
    const 外れ =
      言づての数 === 0
        ? "板に載る言づてが 1 通もありません"
        : b.to > 言づての数 - 1
          ? `板に載る言づては ${言づての数} 通で、 最後は ${言づての数 - 1} 番です`
          : b.from > b.to
            ? "始まりが終わりより後ろです"
            : undefined;
    if (外れ === undefined) continue;
    onNotice({
      kind: "band-row-out-of-range",
      actor: b.actor,
      line,
      message: `帯 "${truncateForMessage(b.actor)}: ${b.from}..${b.to}" の区間が言づての並びに収まりません (${外れ})`,
      hint:
        言づての数 === 0
          ? "帯は言づての行に重ねる四角なので、 flow に言づてを書く"
          : `0..${言づての数 - 1} の範囲で、 始まりを終わり以下にする (番号は flow に書いた言づての行、 段ではありません)`,
    });
  }
}

/**
 * 矢印に書いた多重度 (`cardinality`) から端の形を描けない時に伝える (#2107)。
 *
 * 多重度で端の形が決まるのは `type: er` の 6 語だけ (描画側の `ER_CARDINALITY_HEAD`)。
 * `er` でそれ以外の語を書くと名前に `(語)` と添えるだけで、`er` 以外では何も描かない。
 * 黙って通すと、書いた側は端の形が付くと思い込む (`N:M` の代わりに `N:N` と書く形で起きる)。
 *
 * `er` で端を両方とも書いていれば、描かない端が無いので伝えない = 6 語に無い個数 (`2..5`) を
 * 名前に添えて、端は自分で描く書き方を止めない。
 *
 * 同じ行に 2 件並べない。 避ける行は 3 つあり、どれも知らせる図種や知らせの種類を並べずに決める。
 *
 * | 避ける行 | 決め方 | 既に知らせているもの |
 * |---|---|---|
 * | 順序図の板の言づて | 図種 | `reportMessageOptionNotHonored` が他の飾りと合わせて伝える |
 * | `actors` に無い名前を指す矢印 | 名前の解決に使う表 (`actorRefTable`) | 居ない名前の知らせ (`reportMissingFlowActors`) |
 * | 図種の組み立てが知らせた行 | 実際に出た知らせ | 捨てた矢印 / 自分を親にする矢印 / ガントチャートの矢印の飾り (多重度を含む) など |
 *
 * 値の図 (`pie` 等) は捨てた本数を最初の矢印の行でまとめて伝えるため、2 本目以降の矢印に書いた
 * 多重度はここで伝わる。
 *
 * 行は、図種の知らせと矢印を結ぶ唯一の手掛かり。 行を持たない矢印は全て 0 行になり、図種の組み立てが
 * 0 行を指して 1 件でも知らせると、その文書の多重度の知らせは出ない。 矢印を見分けられない以上、
 * 同じ矢印に 2 件出す側ではなく重ねない側に倒す。
 *
 * 行を持たないのは、書いた場所の表を渡さずに JSON を読んだ文書 (#2117)。 表を渡す入口 (編集画面の
 * YAML 欄) は矢印ごとに別の行を持つため、ここでも矢印ごとに判定できる。
 */
function reportCardinalityNotHonored(
  doc: DslDocument,
  図種が知らせた行: ReadonlySet<number>,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  if (doc.type === "sequence" || doc.type === "solidity") return;
  const 名前の表 = actorRefTable(doc);
  for (const s of doc.flow) {
    const 書いた = 書いた多重度を読む(s.cardinality);
    if (書いた === undefined) continue;
    if (!名前の表.has(s.from) || !名前の表.has(s.to)) continue;
    const line = s.pos?.line ?? 0;
    if (図種が知らせた行.has(line)) continue;
    const 矢印 = `${truncateForMessage(s.from)} -> ${truncateForMessage(s.to)}`;
    const 字 = truncateForMessage(書いた.字);
    if (doc.type !== "er") {
      onNotice({
        kind: "cardinality-not-honored",
        actor: s.from,
        line,
        message: `${矢印} に書いた多重度 "${字}" は効きません (type: ${doc.type} は多重度を描きません)`,
        // クラス図は多重度を別の欄で受け取り、端の横に添える (`compile/class.ts`)
        hint:
          doc.type === "class"
            ? "クラス図の多重度は、行き先の側を sub、出どころの側を tailSub に書いてください"
            : "多重度から両端の形を描くのは type: er です",
      });
      continue;
    }
    if (書いた.語 !== null) continue;
    const 描かない端 = [
      s.tailHead === undefined ? "出どころ側" : "",
      s.head === undefined ? "行き先側" : "",
    ].filter((x) => x !== "");
    if (描かない端.length === 0) continue;
    onNotice({
      kind: "cardinality-not-honored",
      actor: s.from,
      line,
      message: `${矢印} の多重度 "${字}" は端の形が決まる語ではないため、${描かない端.length === 2 ? "両端" : 描かない端[0]}の形を描きません (名前に (${字}) と添えるだけです)`,
      hint: `端の形が決まる語は ${端の形が決まる語.join(" / ")} です。 それ以外の個数を示す時は、端の形を tailHead / head に書いてください`,
    });
  }
}

/**
 * 名前の無い矢印に書いた位置のずらしを知らせる (#1971)。
 *
 * 矢印の位置のずらしは名前をずらす欄に足す。 名前が無い矢印では動くものが無く、書いても図は
 * 変わらない。 順序図の板は `reportMessageOptionNotHonored` が知らせるので、ここでは見ない。
 */
function reportFlowOffsetNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.type === "sequence" || doc.type === "solidity") return;
  for (const s of doc.flow) {
    if (s.layoutPos === undefined) continue;
    if (s.label !== undefined && s.label.trim() !== "") continue;
    onNotice({
      kind: "position-offset-ignored",
      actor: s.from,
      line: s.pos?.line ?? 0,
      message: `${s.from} -> ${s.to} の位置のずらしは、名前の無い矢印では動かすものがありません`,
      hint: "矢印の位置のずらしは名前をずらします。 名前を書くか、ずらしを外す",
    });
  }
}

/**
 * 順序図で面に書いた飾りが使われないことを伝える (#1466)。
 *
 * 順序図は 1 つの板が図を丸ごと描く形になり、面は上端の見出しに **名前と呼び名だけ** で並ぶ。
 * 面ごとの箱が無いので、種類 / 大きさ / 位置 / 行 / 色 / 小見出し / 値 / 図形を載せる先も無い。
 * 黙って落とすと、書いた側は効いていると思い込む。
 *
 * **伝える欄を並べない** (#2358)。 以前は 8 種を手で並べていたため、後から足した項目が
 * どこにも入らなかった (実測 = 箱に書ける 31 項目のうち 11 件が、図も変わらず知らせも出ない)。
 * 板が描く欄を **除いた残り全部** を伝える。
 *
 * 見本 (`parts`) を重ねた面は対象外 = 見本は別経路で図に取り込まれ、板の見出しには並ばない。
 */
function reportActorKindNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.type !== "sequence" && doc.type !== "solidity") return;
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    /*
     * 種類は `sequence` でだけ落ちる。
     *
     * `solidity` は種類で **面の並びを決める** (`compileSolidity`) ので、絵にならなくても
     * 書いた意味は figure に出ている。 落ちたと伝えると、正しく効いている指定に毎回鳴る。
     *
     * 記法を通すと既定の `actor` が必ず入るため、値ではなく書いたかどうかの印で見る。
     * 記法を通さず直接組み立てた場合はこの印が無いので、種類を置いたこと自体を「書いた」 とみなす
     */
    const 判定で外す = doc.type !== "sequence" || a.kindWritten === false ? ["kind"] : [];
    const 効かない = 効かない箱の欄を並べる(a, 板が伝えない箱の欄, 判定で外す);
    if (効かない.length === 0) continue;
    onNotice({
      kind: "actor-kind-not-honored",
      actor: a.name,
      line: a.pos?.line ?? 0,
      message: `"${truncateForMessage(a.name)}" に書いた ${効かない.join(" / ")} は効きません (type: ${doc.type} の板は名前と呼び名だけを描きます)`,
      hint: "板には面ごとの箱が無いため飾りを載せる先がありません。 呼び名 (subtitle) に書くか、箱を持つ図種を使ってください",
    });
  }
}

/**
 * 矢印を骨格として描く図種 (#2364)。
 *
 * 木の図と思考の地図は矢印を親子のつながりとして描き、線の形も向きも階層から決める。
 * 飾りを載せる先が無い。
 *
 * ガントチャート (`gantt`) も同じ性質を持つが、知らせを図種ごとの組み立て (`compile/gantt.ts`) の
 * 中で出しているので、ここには入れない。
 */
const 矢印を骨格にする図種: ReadonlySet<string> = new Set(["tree", "mind"]);

/**
 * 矢印を骨格として描く図で、矢印に書いた飾りが使われないことを伝える (#2364)。
 *
 * 実測 = 矢印に書ける 21 項目のうち 18 件が、図も変わらず知らせも出なかった (2 図種とも)。
 * 文字を足すと 19 件になる。
 *
 * 呼び名は板と同じ表を使う (`効かない矢印の欄の呼び名`) = 同じ欄を 2 つの文言で呼ぶと、
 * 図種を変えた読み手が同じ飾りだと気付けない。
 */
function reportSkeletonEdgeOptionNotHonored(
  doc: DslDocument,
  図種が知らせた行: ReadonlySet<number>,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  if (!矢印を骨格にする図種.has(doc.type)) return;
  const 名前の表 = actorRefTable(doc);
  for (const s of doc.flow) {
    if (!名前の表.has(s.from) || !名前の表.has(s.to)) continue;
    /*
     * 図種の組み立てが知らせた行には重ねない (#2107 と同じ決まり)。
     *
     * 捨てた矢印 (自分を親にする形など) は組み立てが既に伝えており、そこへ飾りの知らせを
     * 足すと同じ行に 2 件並ぶ。 実測 = `A -> A` に多重度を書いた木の図で 2 件出た。
     */
    if (図種が知らせた行.has(s.pos?.line ?? 0)) continue;
    const 効かない = 効かない矢印の欄を並べる(s, 向きだけを使う図が伝えない矢印の欄);
    if (効かない.length === 0) continue;
    onNotice({
      kind: "edge-option-not-honored",
      actor: s.from,
      line: s.pos?.line ?? 0,
      message: `type: ${doc.type} で "${truncateForMessage(s.from)} -> ${truncateForMessage(s.to)}" に書いた ${効かない.join(" / ")} は描けません (矢印は親子のつながりだけを描きます)`,
      hint: "つながりの線は階層から決まるため飾りを載せる先がありません。 箱の名前で伝えるか、矢印を自分で引く図種を使ってください",
    });
  }
}

/**
 * 木の図で、箱に書いた指定が使われないことを伝える (#2360)。
 *
 * 木の図は箱を階層の節として描き、位置も大きさも親子関係から決める。 箱ごとの飾りを
 * 載せる先が無いのは設計どおりだが、**書いても知らせが出なかった** (実測 = 箱に書ける
 * 31 項目のうち 21 件が、図も変わらず知らせも出ない)。
 *
 * 呼び名は板と同じ表を使う (`箱の欄の呼び名`) = 同じ欄を 2 つの文言で呼ぶと、
 * 図種を変えた読み手が同じ指定だと気付けない。
 */
function reportTreeActorOptionNotHonored(
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  if (doc.type !== "tree") return;
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    // 種類は書かなくても既定の `actor` が入るため、値ではなく書いたかどうかの印で見る (#1058)
    const 効かない = 効かない箱の欄を並べる(
      a,
      木の図が伝えない箱の欄,
      a.kindWritten === false ? ["kind"] : [],
    );
    if (効かない.length === 0) continue;
    onNotice({
      kind: "actor-option-not-honored",
      actor: a.name,
      line: a.pos?.line ?? 0,
      message: `"${truncateForMessage(a.name)}" に書いた ${効かない.join(" / ")} は効きません (type: tree は名前と値だけを描き、位置も大きさも親子関係から決めます)`,
      hint: "木の図の箱は階層の節なので飾りを載せる先がありません。 呼び名 (subtitle) に書くか、箱を並べる図種を使ってください",
    });
  }
}

/**
 * 知らせの文に出す「その図種が読むもの」 (#2370)。
 *
 * 表に無い図種は「名前と値」 とする = 足し忘れても文が消えず、読み手に伝わる。
 */
const 図種が読むものの呼び名: ReadonlyMap<string, string> = new Map([
  ["pie", "名前と値と色"],
  ["bar", "名前と値と色"],
  ["line", "名前と値と色"],
  ["gauge", "名前と値と色"],
  ["radial", "名前と値と色"],
  ["stat", "名前と値と色"],
  ["waffle", "名前と値と色"],
  ["stacked", "名前と値と色"],
  ["slope", "名前と値と色"],
  ["gantt", "名前と時期と色と担当"],
  ["journey", "名前と気持ちと接点"],
]);

/**
 * 箱を名前と値の組として読む図で、箱に書いた指定が使われないことを伝える (#2368 / #2370)。
 *
 * 対象の図種と、図種ごとに読む欄は `値として読む図種` が持つ (実装が SSOT)。
 *
 * 実測 = 箱に書ける 30 項目のうち、値の図で 17 件 / じょうごで 19 件 /
 * ガントチャートと体験の地図と四象限で 22-23 件が、図も変わらず知らせも出なかった。
 *
 * 位置 (`posX` + `posY`) は片方だけだと別の知らせ (#2362) が出るため、1 項目ずつ足す走査では
 * 「知らせる」 に数えられ、組で書いた時の穴が隠れていた。
 *
 * 呼び名は板と木の図と同じ表を使う (`効かない箱の欄の呼び名`) = 同じ欄を 2 つの文言で呼ぶと、
 * 図種を変えた読み手が同じ指定だと気付けない。
 */
function reportValueChartActorOptionNotHonored(
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  if (!値として読む図種.has(doc.type)) return;
  const 伝えない欄 = 値として読む図が伝えない箱の欄(doc.type);
  // 何を読むかを知らせの文に出す。 図種ごとに違うので表から引く (実装が SSOT)
  const 読む欄 = 図種が読むものの呼び名.get(doc.type) ?? "名前と値";
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    const 判定で外す: string[] = [];
    // 種類は書かなくても既定の `actor` が入るため、値ではなく書いたかどうかの印で見る (#1058)
    if (a.kindWritten === false) 判定で外す.push("kind");
    /*
     * 呼び名は **値を書いていない箱でだけ** 値として読まれる (#2390)。
     * 読む側と同じ式 (`a.value ?? a.subtitle`) に合わせる = 条件を写すと、
     * 読む側を直した日に伝える側が古くなる。
     */
    if (a.value === undefined) 判定で外す.push("subtitle");
    const 効かない = 効かない箱の欄を並べる(a, 伝えない欄, 判定で外す);
    if (効かない.length === 0) continue;
    onNotice({
      kind: "actor-option-not-honored",
      actor: a.name,
      line: a.pos?.line ?? 0,
      message: `"${truncateForMessage(a.name)}" に書いた ${効かない.join(" / ")} は効きません (type: ${doc.type} は${読む欄}だけを読み、1 枚の図にまとめて描きます)`,
      hint: 値として読む図の案内(効かない),
    });
  }
}

/**
 * 値として読む図の案内を、伝えた欄から組み立てる (#2390)。
 *
 * **固定の 1 文を添えない** (#2382 の決まり)。 飾りの欄 (位置 / 大きさ / 図形 ほか) は
 * 「箱を並べる図種を使ってください」 が行き先になるが、呼び名の行き先は同じ図種の中にある =
 * 値を消せば値として読まれ、題 (`title`) を書けば箱に出る。
 * 1 文で済ませると、呼び名だけを書いた読み手が図種を変えろと読まされる。
 */
function 値として読む図の案内(効かない: readonly string[]): string | undefined {
  const 案内: string[] = [];
  if (効かない.includes("呼び名")) {
    案内.push(
      "呼び名を値として読ませるなら同じ箱の値 (value) を消します。 箱に題を出すなら title を書きます",
    );
  }
  if (効かない.some((欄) => 欄 !== "呼び名")) {
    案内.push(
      "値の図は箱ごとの絵を持たないため飾りを載せる先がありません。 箱を並べる図種を使ってください",
    );
  }
  return 案内.length === 0 ? undefined : 案内.join("、");
}

/**
 * 箱を並べて線で繋ぐ図で、箱に書いた指定が使われないことを伝える (#2376)。
 *
 * 対象の図種と、図種ごとに読まない欄は `骨組みの図種` が持つ (実装が SSOT)。
 *
 * 実測 = フロー 447 枚 ・ 泳路の図 35 枚 ・ 配置の図 8 枚の見本すべてで、始まりの印
 * (`initial`) ・ 終わりの印 (`final`) ・ 印 (`marks`) ・ 前の値 (`previous`) の 4 件が、
 * 図も変わらず知らせも出なかった。 構成の図とクラス図はこれに 1 件ずつ足した形になる。
 *
 * 始まりと終わりの印を読むのは状態遷移図だけ (`compile/generic.ts` の札)。
 * 同じ記法をフローに書いても札は出ないが、書き手には状態遷移図と同じに見える。
 *
 * 印 (`marks`) は **行と組にして読み替えられる図種でだけ** 外す (#2377)。
 * 読み替えの表は `行頭の印にする` が持つので、図種の一覧をここに写さず関数に聞く。
 * 行を書いていない印は、どの図種でも読み替える先が無いので伝える。
 *
 * 案内は **伝えた欄から組み立てる** (#2382)。 3 つの行き先を並べた 1 文を固定で添えていたが、
 * 状態遷移図を族に入れた時に 2 つが誤りになった = 読み手は既に状態遷移図に居るのに
 * 「始まりと終わりの印は type: state が描きます」 と読まされ、印については
 * 「type: er が描きます」 と読まされる (状態遷移図も描く。 足りないのは行のほう)。
 *
 * 段 (`stack`) は **図 1 枚ごとに読むかが決まる** (#2386)。 書いた番号の段に置くのは
 * 全ての箱が縦列を書いた図だけで、1 つでも書いていない箱があると図全体が別の並べ方に落ち、
 * 段はどの箱でも読まれない。 図種では表せない条件なので、置く側と同じ関数
 * (`書いた縦列に置く`) に聞く。
 *
 * ER 図の種類 (`kind`) も同じ形 (#2388)。 表の経路は実体 1 つにつき表の箱を作るので種類を
 * 持たないが、縦列や動きを書いた図は共通の組み立てへ回って種類が届く。 同じ図種の中で
 * 2 通りに分かれるため、組む側と同じ判定 (`ERを共通の組み立てで組むか`) に聞く。
 */
function reportSkeletonActorOptionNotHonored(
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  if (!骨組みの図種.has(doc.type)) return;
  const 伝えない欄 = 図ごとの条件も見た伝えない箱の欄(doc);
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    const 判定で外す: string[] = [];
    // 種類は書かなくても既定の `actor` が入るため、値ではなく書いたかどうかの印で見る (#1058)
    if (a.kindWritten === false) 判定で外す.push("kind");
    // 行と組にして読み替えられる印は効く = 効いている指定には鳴らさない
    if (
      a.rows !== undefined &&
      a.marks !== undefined &&
      行頭の印にする(doc.type, a.marks) !== null
    ) {
      判定で外す.push("marks");
    }
    const 効かない = 効かない箱の欄を並べる(a, 伝えない欄, 判定で外す);
    if (効かない.length === 0) continue;
    onNotice({
      kind: "actor-option-not-honored",
      actor: a.name,
      line: a.pos?.line ?? 0,
      message: `"${truncateForMessage(a.name)}" に書いた ${効かない.join(" / ")} は効きません (type: ${doc.type} は箱を並べて線で繋ぐ図です)`,
      hint: 骨組みの図の案内(doc.type, 効かない),
    });
  }
}

/**
 * その図で、効かないと伝えない箱の欄 (#2386 / #2388)。
 *
 * 図種ごとの違いは族の表 (`骨組みの図種`) が持つ。 **図 1 枚ごとに** 読むかが決まる欄は
 * 表では表せないので、ここで読まない図から抜いて伝える側へ回す。
 *
 * 条件は使う側と同じ関数に聞く = 2 か所に写すと、使う側を直した日に伝える側が古くなる。
 * 段 (`stack`) は縦列を選べる図種すべてに同じ条件が掛かるので `書いた縦列に置く` を直に呼び、
 * 図種ごとに違う条件 (ER 図の種類) は族の表が関数を持つ。
 *
 * @param doc 組み立てる本文
 * @returns 族の除外から、この図では読まない欄を抜いた集合
 */
function 図ごとの条件も見た伝えない箱の欄(doc: DslDocument): ReadonlySet<string> {
  const 族の除外 = 骨組みの図が伝えない箱の欄(doc.type);
  const 読まない欄: string[] = [];
  // 段を読まない図では伝える側へ回す。 既に抜けている図種 (c4) は下の `delete` が空振りする
  if (!書いた縦列に置く(doc.type, doc)) 読まない欄.push("stack");
  for (const [欄, 読む] of 骨組みの図種.get(doc.type)?.図ごと ?? []) {
    if (!読む(doc)) 読まない欄.push(欄);
  }
  const 残り = new Set(族の除外);
  let 抜いた = false;
  for (const 欄 of 読まない欄) if (残り.delete(欄)) 抜いた = true;
  return 抜いた ? 残り : 族の除外;
}

/**
 * 行頭の印を読む図種 (#2382)。 `行頭の印にする` に聞いて導く。
 *
 * 図種の名前を案内の文に写すと、読み替える図種を足した日に案内だけが古くなる。
 * 走査の範囲は骨組みの族に閉じる = この案内が出るのも族の中だけ。
 */
const 行頭の印を読む図種: readonly string[] = [...骨組みの図種.keys()].filter(
  (t) => 行頭の印にする(t as DslDocument["type"], [""]) !== null,
);

/**
 * 骨組みの図の知らせに添える案内を、伝えた欄から組み立てる (#2382)。
 *
 * **伝えていない欄の行き先を書かない**。 3 つの行き先を並べた 1 文を固定で添えていた間、
 * 状態遷移図では 2 つが誤りになっていた。
 *
 * **行き先を持たない欄では案内を付けない**。 当たり障りのない 1 文で埋めると、
 * 読み手は次に何をすればよいか分からないまま「案内は読んだ」 状態になる。
 *
 * @param 図種 いま組んでいる図の種類
 * @param 効かない 知らせに並べた呼び名 (`効かない箱の欄を並べる` の返り値)
 * @returns 案内の文。 行き先を持つ欄が 1 つも無ければ `undefined`
 */
function 骨組みの図の案内(図種: string, 効かない: readonly string[]): string | undefined {
  const 案内: string[] = [];
  /*
   * 段は **縦列を選べる図種でだけ** 書き方の行き先を持つ (#2386)。 その図種で伝えたということは
   * 縦列を書いていない箱が在ったということなので、足せば効く。
   * 縦列を選べない図種 (構成の図) では、どう書いても効かないので行き先が無い。
   */
  if (効かない.includes("段") && 縦列を選べる図種.has(図種 as never)) {
    案内.push("段は全ての箱に縦列 (lane) を書いた図で効きます");
  }
  /*
   * 種類も **図 1 枚ごとに決まる図種でだけ** 行き先を持つ (#2388)。 ER 図は共通の組み立てへ
   * 回った図で種類を読むので、縦列を足せば効く。 どう書いても読まない図種 (クラス図) では
   * 行き先が無いので、族の表に聞いて分ける。
   */
  if (効かない.includes("種類") && (骨組みの図種.get(図種)?.図ごと ?? []).some(([欄]) => 欄 === "kind")) {
    案内.push("種類は全ての箱に縦列 (lane) を書いた図で効きます");
  }
  if (効かない.includes("始まりの印") || 効かない.includes("終わりの印")) {
    案内.push("始まりと終わりの印は type: state が描きます");
  }
  if (効かない.includes("前の値")) 案内.push("前の値は値を並べる図が描きます");
  /*
   * この族で「色」 に立つのは色番号だけ (#2384)。 色味 (`tone`) は共通の除外に入っているので
   * ここへ来ない = 呼び名が同じでも、伝えているのは 16 進数で書いた形に限る。
   */
  if (効かない.includes("色")) {
    案内.push("色番号が効くのは部品を置いた箱だけです。 色の名前 (color: 成功) は箱の色になります");
  }
  if (効かない.includes("印")) {
    案内.push(
      行頭の印を読む図種.includes(図種)
        ? "行頭の印は行 (rows) と組にして書くと記号になります"
        : `行頭の印は ${行頭の印を読む図種.map((t) => `type: ${t}`).join(" と ")} が、行 (rows) と組にした時に描きます`,
    );
  }
  return 案内.length === 0 ? undefined : 案内.join("、");
}

/**
 * 箱の座標を片方だけ書いた時に伝える (#2362)。
 *
 * 座標を図に写す処理 (`applyCanvasPivotPositions`) は **横と縦の両方が書かれている** 時だけ
 * 動く。 片方だけの時は何もしないまま通るため、図が 1 bit も変わらず知らせも出なかった
 * (実測 = 座標が効く 5 図種すべてで消えた)。
 *
 * **効かせる側には倒さない**。 片方だけ動かす書き方は既にずらし (`offsetX` / `offsetY`) が
 * 受け持っており、座標に同じ役目を持たせると 2 つの書き方が同じことをする。
 *
 * 大きさ (`posW` / `posH`) は片方だけでも効くので見ない (実測)。
 * 部品として置いた箱は別経路 (`mergePartsFromActors`) が位置を決めるので外す。
 */
function reportHalfWrittenPosition(
  doc: DslDocument,
  箱に知らせた行: ReadonlySet<number>,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    /*
     * 箱の知らせが出た行には重ねない (#2368)。
     *
     * 位置そのものが効かない図種では「片方だけでは決まらない」 という案内が誤りになる
     * (両方書いても効かない)。 その図種では箱の知らせが位置を含めて伝えている。
     */
    if (箱に知らせた行.has(a.pos?.line ?? 0)) continue;
    const 書いた = a.posX !== undefined ? "posX" : a.posY !== undefined ? "posY" : undefined;
    if (書いた === undefined) continue;
    if (a.posX !== undefined && a.posY !== undefined) continue;
    const 足りない = 書いた === "posX" ? "posY" : "posX";
    onNotice({
      kind: "position-axis-missing",
      actor: a.name,
      line: a.pos?.line ?? 0,
      message: `"${truncateForMessage(a.name)}" に書いた ${書いた} だけでは位置が決まりません (${足りない} も書くと効きます)`,
      hint: `横と縦を両方書くか、片方だけ動かすなら ずらし (offsetX / offsetY) を使ってください`,
    });
  }
}

/**
 * 箱に書いた縦列が効かないことを伝える (#1246)。
 *
 * 縦列は **図種が決める**。 `flow` / `topology` は 1 本にまとめ、 `swimlane` / `er` / `state`
 * は箱ごとに 1 本作り、 `sequence` はそれがそのまま生命線になる。 図全体を 1 箱にする図種
 * (`pie` / `bar` 等) では箱が 1 つしかない。
 *
 * **箱の `lane` を読むのは、 `縦列を選べる図種` で全ての箱が書いた時だけ** (#1263)。
 * 一部の箱だけが書いた形は `reportLaneMixed` が伝えるので、 ここではそれ以外の図種に書いた
 * 縦列を伝える。
 *
 * 黙って捨てると、 書いた縦列は消え、 `lanes:` で宣言した縦列だけが中身のないまま残る。
 * 実測 (#1246) = `type: flow` で `lane: ui` / `lane: api` を書くと箱は両方 `flow` に入り、
 * 宣言した `ui` / `api` は空のまま増えた。 知らせは 1 件も出なかった。
 *
 * ## なぜ組み立ての側で伝えるのか
 *
 * 記法の解析は図種を見ずに 1 行ずつ読む。 そこで弾くと **見本 (parts) の張替え先** まで
 * 巻き添えになる = 見本では `lane` が実際に読まれる (`mergePartsFromActors` が読む)。
 * 図種を知っているのは組み立ての側なので、 効くかどうかの判断もここに置く。
 *
 * ## 見本と `type: mind` では伝えない
 *
 * 見本は上のとおり実際に効く。 `type: mind` は描けない欄をまとめて 1 件で伝えており
 * (`compileMind` の「名前と副題 / 値、 枝の色しか描けません」)、 そこに `枠の指定` が既に
 * 入っている。 二重に伝えると同じ 1 行について知らせが 2 件並ぶ。
 */
function reportLaneNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.type === "mind") return;
  // 縦列を選べる図種では、全ての箱が書いていれば効く (#1263)。 効く形では知らせない
  const 効く図種 = 縦列を選べる図種.has(doc.type);
  if (効く図種 && 書いた縦列に置く(doc.type, doc)) return;
  if (効く図種) {
    reportLaneMixed(doc, onNotice);
    return;
  }
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    if (a.lane === undefined) continue;
    onNotice({
      kind: "lane-not-honored",
      actor: a.name,
      line: a.pos?.line ?? 0,
      message: `"${truncateForMessage(a.name)}" に書いた lane は効きません (縦列は type: ${doc.type} が決めます)`,
      hint: "縦列は図種が決めるため箱からは選べません。 lane を消してください (見本では張替え先として使えます)",
    });
  }
}

/**
 * 「actors に書いた名前で指す」 の直し方を 1 本作る (#1209、 #2404 で帯と共有)。
 *
 * **1 度だけ作る**。 知らせごとに全ての面の名前を並べ直すと、 名前も矢印も上限 (各 1,000) まで
 * 書いた図で数百 MB になる。 並べる数にも上限を置く。
 *
 * **1 件ずつの長さも切る**。 件数だけを絞っても、 名前 1 つが 2 万字なら知らせも 2 万字になる
 * (実測)。 名前も指定も外から来る文字列なので、 表示に使う所はすべて `truncateForMessage` を通す。
 *
 * 矢印の端と帯で同じ文を使う = 同じ「actors に無い名前を指した」 という誤りに、 欄ごとに違う
 * 直し方が返らないようにする。
 */
function 書ける面の案内(doc: DslDocument): string {
  const 見せる数 = 8;
  if (doc.actors.length === 0) return "actors に登場人物を書く";
  const 名前一覧 = doc.actors
    .slice(0, 見せる数)
    .map((a) => truncateForMessage(a.name))
    .join(" / ");
  const 残り = doc.actors.length - 見せる数;
  return `actors に書いた名前で指す (${名前一覧}${残り > 0 ? ` ほか ${残り} 件` : ""})`;
}

/**
 * 矢印が `actors` に無い名前を指したことを知らせる (#1209)。
 *
 * 知らせずに通すと、 **どちらに転んでも書いた人の意図が消える**。 動きを書いていない図では
 * 種類ごとの組み立てが actors を順に繋ぐため、 書いた矢印そのものが捨てられて label も
 * 消える (実測 = "変換" が "→" になった)。 動きを書いた図では名前がそのまま下流へ渡り、
 * 存在しない node を指す図ができて描画の直前で落ちる
 * (実測 = `unknown-ref: edge "e0-v-c" の from "v" が node に存在しません`)。
 *
 * 落ちる場所も消える場所も本文から遠いので、 書いた行で知らせる。
 */
function reportMissingFlowActors(
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
): void {
  if (!onNotice) return;
  const 表 = actorRefTable(doc);
  // hint は **1 度だけ作る**。 知らせごとに全 actor 名を並べ直すと、 名前も矢印も上限
  // (各 1,000) まで書いた図で数百 MB になる (Round 1 の指摘)。 並べる数にも上限を置く
  //
  // **1 件ずつの長さも切る**。 件数だけを絞っても、 名前 1 つが 2 万字なら知らせも 2 万字に
  // なる (Round 4 の実測)。 名前も矢印の指定も外から来る文字列なので、 表示に使う所は
  // すべて `truncateForMessage` を通す (光らせる相手の知らせと同じ扱い)。
  const hint = 書ける面の案内(doc);
  const 知らせた = new Set<string>();
  for (const s of doc.flow) {
    for (const ref of [s.from, s.to]) {
      if (表.has(ref) || 知らせた.has(ref)) continue;
      知らせた.add(ref);
      onNotice({
        kind: "flow-actor-missing",
        actor: ref,
        line: s.pos.line,
        message: `矢印が "${truncateForMessage(ref)}" を指していますが、 actors に書かれていません`,
        hint,
      });
    }
  }
}

/**
 * 光らせる相手 (`focus:`) が届かない分を知らせる。 理由で 2 通りに分ける。
 *
 * 名前が当たらなかった指定は静かに消える。 光らせたい相手を書いたのに光らない状態が、
 * 手掛かりなしで起きる。
 *
 * | 理由 | 見るもの | 知らせ |
 * |---|---|---|
 * | 記法にその名前が無い | 記述だけ | `focus-target-missing` (綴り違い) |
 * | 記法にはあるが、書いたとおりに光らない | 組み上がった図 | `focus-target-not-honored` (#2398) |
 *
 * **2 つを 1 つにまとめない**。 直し方が正反対で、前者は書き直せば直り、後者は同じ案内に
 * 従っても永久に直らない。 出来事 (`events:`) の側は #2336 で同じ分け方を持っており、
 * 注目先の側だけ持っていなかった。
 *
 * 綴り違いの側は **記述だけを見る**。 id の形は図種で違うが「その名前の箱が居るか」
 * 「その矢印が流れにあるか」 は書かれた内容だけで決まる。 図種ごとの解決経路に検査を分けると、
 * 経路が増えるたびに検査が取り残される。
 *
 * ## 何が光るかは図種で 3 通りに分かれる (実測)
 *
 * | 光り方 | 図種 | 知らせる条件 |
 * |---|---|---|
 * | 書いた箱 / 矢印が光る | `c4` `class` `er` `flow` `state` `swimlane` `topology` | 図がその相手を持たない時 |
 * | 書いた名前に合う言づてまで板が進む | `sequence` `solidity` | 知らせない (下記) |
 * | 図全体の 1 箱が光る | 残る 15 図種 | 書かなかった箱がある時と、矢印を書いた時 |
 *
 * **板の 2 図種では知らせない**。 板は箱も矢印も持たないが、書いた名前は捨てられておらず
 * 板が何通目まで描くかを決めている (`段の番号`、 実測 = 3 通の図で `focus: ["あ -> い"]` が
 * 0 通目、 `["う -> あ"]` が 2 通目)。 図に相手が居ないことだけを見ると、効いている指定に
 * 「選べません」 と知らせることになる。
 *
 * **図全体が光る図種でも、全ての箱を書いた段では知らせない**。 光る結果 (全ての箱) と
 * 書いたこと (全ての箱) が一致するため、伝えることが無い。 知らせるのは **書かなかった箱も
 * 光る時** = 4 本の棒のうち 1 本だけを書いても 4 本とも光る形で、ここだけが書いたとおりに
 * ならない。
 *
 * @param diagram 組み上がった図。 渡さない時は綴り違いだけを見る
 */
function reportMissingFocusTargets(
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
  diagram?: CdlDiagram,
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

  // 矢印の両端は **流れと同じ表で名前へ揃えてから** 照合する (#1209 Round 2)。
  //
  // 流れは入口で名前へ揃えている (`canonicalizeFlowActors`) 一方、 光らせる指定は生のまま
  // 来る。 揃えずに比べると、 slug で書いた矢印 (`api-gateway -> db`) が実際は光るのに
  // 「見つかりません」 と誤報する (実測)
  const 名前へ = actorRefTable(doc);
  const 揃える = (ref: string): string => 名前へ.get(ref) ?? ref;

  // 部品の中の要素と線は `{部品の名前}__{要素}` で名指しする (#2151)。 ここでは部品の一覧を持たず、
  // 要素があるかは部品を取り込んだ後にしか決まらない = 名前の前半が部品の名前なら知らせず、
  // 取り込む側 (`部品の名前で光らせる`) に任せる。 両方で知らせると同じ名前に 2 件出る
  const 部品の名前 = doc.actors.filter((a) => a.partId !== undefined).map((a) => a.name);
  const 部品の中を指す = (name: string): boolean => 部品の名前.some((p) => name.startsWith(`${p}__`));

  // 部品そのものの名前は、取り込む側が図の相手を決める (`部品の名前で光らせる`)。
  // ここで図を見ると、取り込む前の図にしか当たらず「選べません」 の誤報になる
  const 部品そのもの = new Set(部品の名前);

  // 板の 2 図種は書いた名前を板の番号に使う (doc comment の表)。 図と突き合わせない
  const 板になる = doc.type === "sequence" || doc.type === "solidity";
  const 見比べる図 = 板になる ? undefined : diagram;

  // 綴り違いの補足は **1 度だけ作る**。 知らせごとに全ての名前を並べ直すと、名前も注目先も
  // 上限 (各 1,000) まで書いた図で知らせが数百 MB になる (矢印の端の知らせが #1209 で踏んだ形)
  const 名前の案内 = `actors: に書かれている名前 = ${並べて切る([...names])}`;

  for (const phase of doc.animate.phases) {
    /** 記法には書いてあるのに、書いたとおりに光らない指定 (#2398) */
    const 選べない: string[] = [];
    /** その段が名指しした箱。 図全体が光る図種で「書かなかった箱があるか」 を見る */
    const 書いた箱 = new Set<string>();
    /** 選べない指定に矢印が混じったか。 図全体が光る図種は矢印を 1 本も描かない */
    let 矢印も書いた = false;
    /** 書いた箱のうち 1 つでも図に居たか。 居るなら図全体が光る形ではない */
    let 箱が図に居た = false;
    for (const raw of phase.highlight ?? []) {
      const entry = parseFocusEntry(raw, names);
      const found =
        entry.kind === "edge"
          ? (steps.get(揃える(entry.from))?.has(揃える(entry.to)) ?? false)
          : accepted.has(entry.name) || 部品の中を指す(entry.name);
      if (!found) {
        onNotice({
          kind: "focus-target-missing",
          actor: raw,
          line: phase.pos.line,
          message:
            entry.kind === "edge"
              ? `光らせる矢印が流れにありません: "${truncateForMessage(raw)}"`
              : `光らせる相手が見つかりません: "${truncateForMessage(raw)}"`,
          hint: entry.kind === "edge" ? "flow: に書いた矢印と同じ向きで書く" : 名前の案内,
          // 縦列の id は受理しないので、 その旨は hint に出さない (光らせられないため)
        });
        continue;
      }
      if (見比べる図 === undefined) continue;
      if (entry.kind === "node") 書いた箱.add(揃える(entry.name));
      if (entry.kind === "node" && (部品そのもの.has(entry.name) || 部品の中を指す(entry.name)))
        continue;
      const 相手 =
        entry.kind === "edge"
          ? 図の矢印を探す(見比べる図, doc, entry.from, entry.to)
          : 図の箱を探す(見比べる図, entry.name);
      if (相手 === undefined) {
        選べない.push(raw);
        if (entry.kind === "edge") 矢印も書いた = true;
      } else if (entry.kind === "node") 箱が図に居た = true;
    }
    if (選べない.length === 0) continue;
    /*
     * 全ての箱を書いた段は、光る結果 (図全体) と書いたことが一致する (doc comment の表)。
     *
     * **1 つでも図に居た段はここへ入れない**。 箱を 1 つずつ選べる図種で 1 箱だけが図から
     * 落ちた時、全ての名前を書いていると「一致している」 と読めてしまう。 図全体が光る図種は
     * どの名前も図に当たらないので、この条件で落ちることはない
     */
    if (!矢印も書いた && !箱が図に居た && [...names].every((n) => 書いた箱.has(n))) continue;
    /*
     * **1 行に 1 件だけ出す** (#2398)。 同じ段に書いた名前はどれも同じ理由で選べないので、
     * 1 つずつ知らせると同じ文が 1 行に並ぶ。 書いた名前は文に並べる。
     */
    const 書かなかった箱 = [...names].filter((n) => !書いた箱.has(n));
    onNotice({
      kind: "focus-target-not-honored",
      actor: 選べない[0]!,
      line: phase.pos.line,
      message:
        `type: ${doc.type} は箱を 1 つずつ選べず図全体が光るため、` +
        ` ${並べて切る(選べない, (x) => `"${x}"`)} を注目先に書いても` +
        (書かなかった箱.length > 0
          ? ` 書かなかった箱 (${並べて切る(書かなかった箱)}) も光ります`
          : " 図全体が光ります"),
      hint: "名前の書き方の問題ではありません。 全ての箱を書くか、箱を 1 つずつ選べる図種 (flow / class など) に変えてください",
    });
  }
}

/**
 * 知らせの本文に名前を並べる。 件数も 1 件あたりの長さも切る (#2398)。
 *
 * **件数だけを絞っても足りない**。 名前は外から来る文字列なので、1 つが 2 万字なら
 * 知らせも 2 万字になる (矢印の端の知らせが #1209 で踏んだ形)。 箱の上限は 1,000 件で、
 * 全て並べると 1 件の知らせが数百 KB になる。
 */
function 並べて切る(一覧: readonly string[], 包む = (s: string): string => s): string {
  const 見せる数 = 8;
  const 並び = 一覧.slice(0, 見せる数).map((x) => 包む(truncateForMessage(x)));
  const 残り = 一覧.length - 見せる数;
  return 残り > 0 ? `${並び.join(" / ")} ほか ${残り} 件` : 並び.join(" / ");
}

/**
 * 図の中から、書いた名前の箱を探す (#2336 / #2398)。
 *
 * 名前から作った識別子と、名前そのものと、描かれる題の 3 通りで探す。 記法は名前で書き、
 * 図の識別子はそこから作られるが、見本を重ねた図など識別子が名前と揃わない形もある。
 *
 * **出来事の相手と注目先が同じ探し方を使う**。 片方だけ厳しくすると、正しく書いた名前が
 * 一方では光り、もう一方では「見つからない」 と知らされる。
 */
function 図の箱を探す(diagram: CdlDiagram, 名: string): CdlNode | undefined {
  const slug = slugify(名);
  return diagram.nodes.find((n) => n.id === slug || n.id === 名 || n.title === 名);
}

/**
 * 図の中から、書いた両端の矢印を探す (#2336 / #2398)。
 *
 * 板になる 2 図種 (`sequence` / `solidity`) は識別子に行の番号が入るので、書いた組が
 * 流れの何番目かを先に引いてから照合する。
 */
function 図の矢印を探す(
  diagram: CdlDiagram,
  doc: DslDocument,
  fromName: string,
  toName: string,
): CdlEdge | undefined {
  const from = slugify(fromName);
  const to = slugify(toName);
  if (doc.type === "sequence" || doc.type === "solidity") {
    const stepIdx = doc.flow.findIndex(
      (step) => slugify(step.from) === from && slugify(step.to) === to,
    );
    if (stepIdx < 0) return undefined;
    return diagram.edges.find(
      (x) =>
        (x.from === `s${stepIdx}-${from}` || x.from === from) &&
        (x.to === `s${stepIdx}-${to}` || x.from === x.to),
    );
  }
  return diagram.edges.find((x) => x.from === from && x.to === to);
}

/**
 * v0.5+ flow inline option (guard / cardinality / labelOffsetX / labelOffsetY / overlay) を
 * 既存 preset 経由で生成された CdlEdge に対し、 doc.flow の (from, to) 一致順マッチングで反映する。
 *
 * 設計:
 * - preset 経路ごとに edge id 命名規則が異なる (sequence: e{idx}-..、 ER: rel-{idx}-..、 FSM: t{idx}-..、
 *   topology: c{idx}-..、 flow preset: e-{prev}-{node}、 swimlane: e{idx}-..) ため、 id 直接マッチは脆い。
 * - 代わりに doc.flow の 1 step に対し、 同じ (slugified-from, slugified-to) を持つ未マッチ edge を
 *   順に 1 つ消費する double-pointer 走査で対応付ける。 同 from-to の重複は出現順で順番に対応。
 * - ER の多重度は名前にも端にも写さない。 名前 / 名前の下の行 / 両端は組み立ての時に
 *   `compile/er-relation.ts` が決めている (#2105)。
 */
function applyEdgeInlineOptions(
  diagram: CdlDiagram,
  doc: DslDocument,
  /** 対応が取れた edge を記録する表。 callback は呼ばない (1 edge = 1 回にするため)。 */
  sourceLines?: Map<string, number>,
  /** 対応が取れた edge の行そのもの。 部品の取り込みが、行に書いた要素の名指しを読む (#1979) */
  edgeSteps?: Map<string, DslStep>,
  /** 鎖に並べない部品を決める一覧 (#1987)。 `compileFlow` に渡したものと同じ */
  partsCatalog?: Record<string, CdlDiagram>,
): void {
  // **静止した `type: flow` は書いた端で対応が取れない** (#1267)。 鎖の規則で先に埋める
  if (鎖でつなぐ形か(doc)) {
    const 並び = 鎖に並べる登場人物(doc, partsCatalog);
    diagram.edges.forEach((e, idx) => {
      const s = 鎖のどの行から来たか(doc, 並び, idx);
      if (s === undefined) return;
      sourceLines?.set(e.id, s.pos.line);
      edgeSteps?.set(e.id, s);
      矢印へ書き写す(e, s, doc);
    });
    return;
  }
  const used = new Set<string>();
  // edge.from / edge.to は plain slug (slugify(actor 名))。
  //
  // 順序図系 (`sequence` / `solidity`) はここに来ない = #1466 で板になり矢印を作らない。
  doc.flow.forEach((s) => {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    const target = diagram.edges.find((e) => {
      if (used.has(e.id)) return false;
      return e.from === fromId && e.to === toId;
    });
    if (!target) return;
    used.add(target.id);
    sourceLines?.set(target.id, s.pos.line);
    edgeSteps?.set(target.id, s);
    矢印へ書き写す(target, s, doc);
  });
}

/**
 * 出来事が指す相手を、図の識別子へ直す (#1393)。 見つからなければ `undefined`。
 *
 * 箱と縦列は **名前から作った識別子** と **描かれる題** の両方で探す。 記法は名前で書き、
 * 図の識別子はそこから作られるが、見本を重ねた図など識別子が名前と揃わない形もある。
 * 矢印は両端の名前から識別子を作って突き合わせる。
 */
function 出来事の相手を解く(
  diagram: CdlDiagram,
  doc: DslDocument,
  e: DslEventBinding,
): NonNullable<CdlDiagram["eventBindings"]>[number]["target"] | undefined {
  if (e.target.kind === "diagram") return { kind: "diagram" };
  if (e.target.kind === "edge") {
    const 矢印 = 図の矢印を探す(diagram, doc, e.target.from, e.target.to);
    return 矢印 ? { kind: "edge", id: 矢印.id } : undefined;
  }
  const 名 = e.target.name;
  if (e.target.kind === "node") {
    const 箱 = 図の箱を探す(diagram, 名);
    return 箱 ? { kind: "node", id: 箱.id } : undefined;
  }
  const slug = slugify(名);
  const 列 = (diagram.lanes ?? []).find((l) => l.id === slug || l.id === 名 || l.label === 名);
  return 列 ? { kind: "lane", id: 列.id } : undefined;
}

/**
 * 出来事が指す名前を、書いた人が本文に書いているか (#2336)。
 *
 * 相手が解けなかった原因を 2 つに分けるために使う。 **本文に在るなら書き直しても直らない** =
 * その図種が登場人物を箱にしない (値を並べる図種は図全体で 1 つの箱、 順序図と solidity は
 * 1 枚の板)。 本文に無いなら綴り違いで、書き直せば直る。
 *
 * 分けないと、直る件と直らない件に同じ「名前で書く」 という案内が付く。 案内に従っても
 * 直らない側では、書いた人は綴りを疑って何度も書き直すことになる (実測 = 24 図種のうち
 * 箱を指せるのは 7 図種)。
 *
 * 照合は図の識別子と同じ作り方に揃える = 箱は名前と題の両方で探し (`出来事の相手を解く` と
 * 同じ 2 経路)、矢印は両端の名前から作った識別子で突き合わせる。 ここだけ厳しくすると、
 * 正しく書いた名前を綴り違いとして知らせてしまう。
 */
function 出来事の相手が本文に在る(doc: DslDocument, e: DslEventBinding): boolean {
  if (e.target.kind === "diagram") return true;
  if (e.target.kind === "edge") {
    const from = slugify(e.target.from);
    const to = slugify(e.target.to);
    return doc.flow.some((s) => slugify(s.from) === from && slugify(s.to) === to);
  }
  const 名 = e.target.name;
  const slug = slugify(名);
  if (e.target.kind === "node") {
    return doc.actors.some(
      (a) => a.name === 名 || slugify(a.name) === slug || (a.title ?? a.name) === 名,
    );
  }
  return Object.entries(doc.lanes ?? {}).some(
    ([id, 列]) => id === 名 || slugify(id) === slug || 列.label === 名,
  );
}

/** 出来事の相手の呼び名。 知らせの本文で「何を指したか」 を言うために使う */
const 出来事の相手の呼び名: Record<DslEventBinding["target"]["kind"], string> = {
  node: "箱",
  lane: "縦列",
  edge: "矢印",
  diagram: "図そのもの",
};

/** 本文に書いた矢印の指定を、対応が取れた矢印へ書き写す。 対応の取り方は呼出側が決める。 */
function 矢印へ書き写す(target: CdlEdge, s: DslStep, doc: DslDocument): void {
  // **書いた補足が勝つ** (#1275)。 ここで写さないと 2 つ落ちる。 静止した `type: flow` は
  // 鎖を作る時に説明文しか渡さないため補足が消え、`er` は見本が多重度から作った補足が
  // 残って書いた値が無視される (どちらも実測)
  //
  // **クラス図の `sub` は多重度なので写さない** (#1769)。 クラス図の組み立てが既に `cardinality` として
  // 渡し、engine が行き先の端に添える (cdl#821)。 ここで札の下の行にも写すと、`1..*` が札と端の
  // 2 か所に出て、組み立て器で書いた同じ図と食い違う (実測 = 記法の見本が組み立て器の見本と一致しなくなった)
  if (s.sub !== undefined && doc.type !== "class") target.sub = s.sub;
  if (s.guard !== undefined) {
    target.guard = s.guard;
    // FSM preset では sub が guard 同期、 author 明示 guard を sub に反映 (sub 既存なら上書きしない)
    if (doc.type === "state" && target.sub === undefined) target.sub = s.guard;
  }
  // 色味と線の種類も、図種ごとの組み立てではなくここで写す (#2394)。
  //
  // **渡す側を図種ごとに並べる形にしない**。 この 2 欄は図種ごとの組み立てが個別に渡していて、
  // 渡し忘れた図種でそのまま落ちていた (実測 = 線の種類は `er` / `state` / 鎖でつないだ `flow`、
  // 色味は鎖でつないだ `flow` で黙って消える)。 図種を足した日に同じ落とし方が再発するため、
  // 矢印を描く図種が必ず通るここへ移す。 図種ごとの組み立てに置いていた同じ受け渡しは外した =
  // 2 か所に置くと、片方だけ直した日に食い違う。 板になる 2 図種 (`sequence` / `solidity`) は
  // 矢印を作らずここを通らないので、そちらは組み立てが持ったまま
  if (s.tone !== undefined) target.tone = s.tone;
  if (s.style !== undefined) target.style = s.style;
  // 出どころの端に添える字 (#2394)。 engine は `tailLabel` として端に置く (cdl#825)。
  //
  // **クラス図だけ写さない** = 組み立てが既に `tailCardinality` として渡しており、
  // ここで重ねると同じ字が端に 2 度出る (`sub` を外すのと同じ理由)
  if (s.tailSub !== undefined && doc.type !== "class") target.tailLabel = s.tailSub;
  // ER の多重度が名前と端にどう出るかは組み立ての時に決まっている (`compile/er-relation.ts`、#2105)。
  // ここで名前へ `(1:N)` を足すと、組み立てが名前の下の行に出した語と 2 度並ぶ
  if (s.cardinality !== undefined) target.cardinality = s.cardinality;
  // 矢印がどの辺から出るか (#1385)。 書かなければ描画側が自動で選ぶ
  if (s.side !== undefined) target.side = s.side;
  // 矢印の先の形 (#1462)。 書かない矢印には値を入れない = 既存の図が変わらない。
  //
  // **矢印を作る 9 図種すべてがここを通る**。 図種ごとの組み立てにも同じ形を置いたが、
  // 外しても 9 図種とも渡っていた (変異試験で実測) = 余分だったので消した
  if (s.head !== undefined) target.head = s.head;
  // 端の残り 3 欄 (#1466)。 出どころ側の印と、両端の塗り。 ER は端ごとに違う個数を示す
  if (s.tailHead !== undefined) target.tailHead = s.tailHead;
  if (s.headFill !== undefined) target.headFill = s.headFill;
  if (s.tailHeadFill !== undefined) target.tailHeadFill = s.tailHeadFill;
  // 辺の役目と名前の下地 (cdl#618)。 主となる道を朱で引き、丸い下地を外せる。
  // 書かない辺には値を入れない = 既存の図が変わらない
  if (s.role !== undefined) target.role = s.role;
  if (s.labelPlate !== undefined) target.labelPlate = s.labelPlate;
  if (s.labelOffsetX !== undefined) target.labelOffsetX = s.labelOffsetX;
  if (s.labelOffsetY !== undefined) target.labelOffsetY = s.labelOffsetY;
  // 矢印の位置のずらし (#1971)。 矢印は自分の位置を持たず、通り道は両端の箱で決まるので、
  // 動かせるのは名前だけ。 名前のずらしに足す = 両方書いた時は合わせた量だけ動く
  if (s.layoutPos !== undefined) {
    target.labelOffsetX = (s.labelOffsetX ?? 0) + s.layoutPos.x;
    target.labelOffsetY = (s.labelOffsetY ?? 0) + s.layoutPos.y;
  }
  if (s.overlay !== undefined) target.overlay = s.overlay;
  // 値に追随する 3 欄 (#1396)。 太さ / 色 / 破線の位置が値に合わせて動く。
  // 通り道そのものは動かないので、配置計算と重なり解消には影響しない
  if (s.widthBind !== undefined) target.widthBind = s.widthBind;
  if (s.strokeBind !== undefined) target.strokeBind = s.strokeBind;
  if (s.dashOffsetBind !== undefined) target.dashOffsetBind = s.dashOffsetBind;
}

/**
 * v0.5+ groups section を、 束ねる縦列に重ねる枠の縦列 (`group-{id}`、 contain: true) として図に足す。
 *
 * ここでは枠を作るだけで、 位置と大きさは縦列の位置が全て決まった後に `applyGroupFrames` が決める。
 * 作った枠の id を返す = 同じ id の縦列を書き手が `lanes:` に書いていた時は作らず、 後で置き直さない。
 */
function applyGroupContainers(diagram: CdlDiagram, doc: DslDocument): Set<string> {
  const 作った = new Set<string>();
  if (!doc.groups || Object.keys(doc.groups).length === 0) return 作った;
  for (const [id, g] of Object.entries(doc.groups)) {
    const containerId = `group-${id}`;
    // 書き手が `lanes:` に同じ id を書いた縦列は、ここより後で図に入る。 枠として作ると書いた縦列と
    // 重なって 1 本になり、 置き直しが書き手の位置と幅を上書きする
    if (diagram.lanes.some((l) => l.id === containerId) || doc.lanes?.[containerId]) continue;
    diagram.lanes.push({
      id: containerId,
      width: 800,
      label: g.label ?? id,
      contain: true,
      // 束ねる lane 群に重ねて描く枠。 横に並べる lane ではないので、 engine の間隔調整
      // (lane を詰めた分を幅で埋め合わせる処理) の対象から外す。
      role: "overlay",
      // 置き直すまでは座標を固定しておく。 固定しない枠は縦列の並びに加わり、 他の縦列の間隔を
      // 広げる (実測 = 3 本の縦列の 2 本目が 666 から 710 へ動いた)。 並びから外した配置で測らないと、
      // 枠を置いた後に縦列が詰め直されて枠から外れる
      posX: 0,
      posY: 0,
      posW: 1,
      posH: 1,
    });
    作った.add(containerId);
  }
  return 作った;
}

/**
 * 組の枠と束ねた縦列の間の余白。
 *
 * | 向き | 値 | 理由 (実測) |
 * |---|---|---|
 * | 上 | 40 | 枠の名札を縦列の名札に重ねない高さ。 0 で 74 重なり、 40 で重ならない |
 * | 下 | 20 | 箱の下端から枠を離す |
 * | 横 (囲いを持つ縦列) | 20 | 枠を縦列の囲いの線に重ねない。 囲いを持つ縦列の間は矢印の名前が入る広さがある |
 * | 横 (囲いの無い縦列) | 0 | 縦列の端は箱から既に離れている。 20 取ると、 縦列の間に置いた矢印の名前を枠の線が貫く (箱の種別 `person` で 8 食い込んだ) |
 */
const 組の枠の余白 = { 上: 40, 下: 20, 囲いの横: 20, 囲いの無い横: 0 } as const;

/**
 * 組 (`groups:`) の枠を、 束ねた縦列とその中の箱を全て囲む位置と大きさに置く (#1972)。
 *
 * **縦列の位置が全て決まった後に 1 度だけ配置して測る**。 枠は作った時から座標を固定してあるので、
 * 枠を置いても他の縦列は動かない (固定した縦列は並びに加わらない)。
 *
 * 束ねた縦列の扱い。
 *
 * | 状態 | 扱い |
 * |---|---|
 * | 図に無い縦列を書いた | その縦列を除いて囲み、 無いことを知らせる |
 * | 図に在る縦列が 1 本も無い | 枠を作らず、 知らせる (図の端に何も囲まない枠を描かない) |
 * | 間に束ねない縦列を挟む | 間の縦列ごと囲み、 挟んだ縦列を知らせる (縦列の並びは書いた順を変えない) |
 */
function applyGroupFrames(
  diagram: CdlDiagram,
  doc: DslDocument,
  作った枠: ReadonlySet<string>,
  onNotice?: (notice: CompileNotice) => void,
): void {
  if (作った枠.size === 0) return;
  const 置く: { 枠: CdlDiagram["lanes"][number]; 名前: string; line: number; 縦列: string[] }[] = [];
  for (const [id, g] of Object.entries(doc.groups ?? {})) {
    const 枠 = diagram.lanes.find((l) => l.id === `group-${id}`);
    if (!枠 || !作った枠.has(枠.id)) continue;
    const 書いた = Array.isArray(g.lanes) ? g.lanes : [];
    const 在る = 書いた.filter((x) => diagram.lanes.some((l) => l.id === x && !作った枠.has(l.id)));
    const 無い = 書いた.filter((x) => !在る.includes(x));
    if (在る.length === 0) {
      diagram.lanes = diagram.lanes.filter((l) => l !== 枠);
      onNotice?.({
        kind: "group-lane-missing",
        actor: id,
        line: g.pos?.line ?? 0,
        message:
          書いた.length === 0
            ? `組 "${truncateForMessage(id)}" は束ねる縦列を書いていないので、枠を描きません`
            : `組 "${truncateForMessage(id)}" が束ねる縦列 ${無い.map((x) => `"${truncateForMessage(x)}"`).join(", ")} が図に無いので、枠を描きません`,
        hint: "`lanes: [縦列の名前, ...]` に `lanes:` で書いた縦列の名前を並べる",
      });
      continue;
    }
    if (無い.length > 0) {
      onNotice?.({
        kind: "group-lane-missing",
        actor: id,
        line: g.pos?.line ?? 0,
        message: `組 "${truncateForMessage(id)}" が束ねる縦列 ${無い.map((x) => `"${truncateForMessage(x)}"`).join(", ")} が図に無いので、残りの縦列だけを囲みます`,
        hint: "`lanes:` で書いた縦列の名前か確かめる",
      });
    }
    置く.push({ 枠, 名前: id, line: g.pos?.line ?? 0, 縦列: 在る });
  }
  if (置く.length === 0) return;

  // **ここで作った枠を測る図から外す** (#2300)。 枠はまだ置いていない = `posX: 0, posY: 0` の
  // 仮置きなので、 渡すと組の名札が全部同じ `x = 16` に積み上がり、 記法の engine が
  // 実物と合わない重なりを知らせる (組を 2 つ書くと `1994px²`、 組を N 個書くと最大 N(N-1)/2 件)。
  // 出来上がった図では 1 度も重ならない (名札の箱は `16.0..87.2` と `564.0..682.4`)。
  //
  // 外しても測る値は変わらない。 枠は `posX` と `posY` を持つ縦列として並べ直しの対象から
  // 外れており (`role: "overlay"` で間隔の調整からも外れる)、 結果からは元から捨てていた。
  // 渡す時点で外すだけで、 縦列と箱の位置は 1 単位も動かない。
  const 配置 = layout({ ...diagram, lanes: diagram.lanes.filter((l) => !作った枠.has(l.id)) });
  const 並びの縦列 = 配置.lanes;
  for (const { 枠, 名前, line, 縦列 } of 置く) {
    const 束 = 並びの縦列.filter((l) => 縦列.includes(l.id));
    const 左 = Math.min(...束.map((l) => l.x ?? 0));
    const 右 = Math.max(...束.map((l) => (l.x ?? 0) + l.width));
    // 束ねた縦列の左端と右端の間に入る縦列は、 束ねなくても枠に入る
    const 挟んだ = 並びの縦列.filter(
      (l) => !縦列.includes(l.id) && (l.x ?? 0) < 右 && (l.x ?? 0) + l.width > 左,
    );
    if (挟んだ.length > 0) {
      onNotice?.({
        kind: "group-lanes-apart",
        actor: 名前,
        line,
        message: `組 "${truncateForMessage(名前)}" が束ねる縦列の間に ${挟んだ.map((l) => `"${truncateForMessage(l.id)}"`).join(", ")} があるので、その縦列も枠に入ります`,
        hint: "束ねる縦列を `lanes:` で隣り合う順に並べる",
      });
    }
    const 囲む縦列 = new Set([...束, ...挟んだ].map((l) => l.id));
    const 囲む = [...束, ...挟んだ];
    const 箱 = 配置.nodes.filter((n) => 囲む縦列.has(n.lane));
    const 上 = Math.min(...囲む.map((l) => l.y ?? 0));
    const 下 = Math.max(
      ...囲む.map((l) => (l.y ?? 0) + (l.height ?? 0)),
      ...箱.map((n) => n.cy + n.h / 2),
    );
    const 囲いを持つ = diagram.lanes.some((l) => 囲む縦列.has(l.id) && l.contain === true);
    const 横 = 囲いを持つ ? 組の枠の余白.囲いの横 : 組の枠の余白.囲いの無い横;
    枠.posX = 左 - 横;
    枠.posY = 上 - 組の枠の余白.上;
    枠.posW = 右 - 左 + 横 * 2;
    枠.posH = 下 - 上 + 組の枠の余白.上 + 組の枠の余白.下;
  }
}

/**
 * ユーザージャーニーの欄を、 それを描けない図種で書いた時に伝える (#1251)。
 *
 * `touchpoint` と `opportunity` は `type: journey` の段だけが持つ。 他の図種では相手が無く、
 * 黙って捨てると「書いたのに出ない」 が手掛かりなしで起きる。
 *
 * `type: mind` では伝えない = `compileMind` が描けない欄をまとめて 1 件で伝えており、
 * そこに 2 つとも入っている (`放射で描けない欄`)。 二重に伝えない (#1246 と同じ扱い)。
 */
function reportChartFieldsNotHonored(
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): void {
  if (!onNotice) return;
  if (doc.type === "mind") return;
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    const 道筋 =
      doc.type === "journey"
        ? []
        : [
            ...(a.touchpoint !== undefined ? ["touchpoint"] : []),
            ...(a.opportunity !== undefined ? ["opportunity"] : []),
          ];
    const 工程 =
      doc.type === "gantt"
        ? []
        : [...(a.owner !== undefined ? ["owner"] : []), ...(a.end !== undefined ? ["end"] : [])];
    if (道筋.length > 0) {
      onNotice({
        kind: "chart-value-unreadable",
        actor: a.name,
        line: a.pos?.line ?? 0,
        message: `"${truncateForMessage(a.name)}" に書いた ${道筋.join(" / ")} は効きません (type: ${doc.type} にはユーザージャーニーの欄がありません)`,
        hint: "ユーザージャーニーを描くなら type: journey を使ってください",
      });
    }
    if (工程.length > 0) {
      onNotice({
        kind: "chart-value-unreadable",
        actor: a.name,
        line: a.pos?.line ?? 0,
        message: `"${truncateForMessage(a.name)}" に書いた ${工程.join(" / ")} は効きません (type: ${doc.type} には工程の並びの欄がありません)`,
        hint: "工程の並びを描くなら type: gantt を使ってください",
      });
    }
  }
}

/**
 * 軸の名前を、それを持たない図種で書いた時に伝える (#1251)。
 *
 * 軸を持つのは `type: quadrant` だけ。 他の図種では相手が無く、黙って捨てると
 * 「書いたのに出ない」 が手掛かりなしで起きる。
 */
function reportAxesNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.axes === undefined) return;
  if (doc.type === "quadrant") return;
  onNotice({
    kind: "chart-value-unreadable",
    actor: doc.title,
    line: doc.axesPos?.line ?? doc.pos?.line ?? 0,
    message: `最上位に書いた axes は効きません (type: ${doc.type} には軸がありません)`,
    hint: "2 つの軸で仕分ける図を描くなら type: quadrant を使ってください",
  });
}

/**
 * 行を組み立て器が加工する図の種類 (#1466)。
 *
 * ここに載る種類では、記法に書いた行をそのまま箱へ載せ直さない = 組み立て器が行頭の印に
 * 合わせて字を落としているため。
 */
function 行を組み立て器が持つ(type: DslDocument["type"]): boolean {
  return type === "class";
}

/**
 * 行と印を組む (#1466)。 群の分け方は図の種類が決める。
 *
 * ER は **鍵の群を上にまとめる** (組み立て器 `er()` と同じ形)。
 * 状態遷移は群を分けないので、書いた並びのまま。
 *
 * **空の行では開けない** (cdl `#606`)。 群の区切りは行頭の印が持っている = ER は鍵の名前に
 * 下線が付く。 空の行はその 2 つ目の手掛かりで、代わりに行の間隔を不揃いにしていた
 * (鍵と値を持つ箱だけ境目が広がる)。 組み立て器が cdl 0.23.0 で空の行をやめたので、
 * こちらも同時にやめる = 片方だけ残ると記法と図の照合が落ちる。
 */
function 行と印を組む(
  type: DslDocument["type"],
  rows: readonly string[],
  marks: readonly string[],
): { rows: string[]; rowMarks: (RowMark | null)[] } | null {
  const 印 = 行頭の印にする(type, marks);
  if (印 === null) return null;
  if (type !== "er") {
    return { rows: [...rows], rowMarks: rows.map((_, i) => 印[i] ?? null) };
  }
  const 鍵: number[] = [];
  const 値: number[] = [];
  rows.forEach((_, i) => ((印[i]?.underline === true ? 鍵 : 値).push(i)));
  const 並び = [...鍵, ...値];
  return {
    rows: 並び.map((i) => rows[i] ?? ""),
    rowMarks: 並び.map((i) => 印[i] ?? null),
  };
}

/**
 * 書いた語を行頭の印に読み替える (#1466)。
 *
 * **軸の意味は図の種類が決める**。 印そのものは 形 (四角 / 山形) × 塗り (塗る / 中空) の
 * 2 軸で共通だが、その軸が何を指すかは種類ごとに違う。
 *
 * | 種類 | 山形 | 塗り |
 * |---|---|---|
 * | `er` | 外を指す列 (`fk`) | 空にできない (`opt` を書かない) |
 * | `state` | 出入りの瞬間 (`entry` / `exit`) | 続く・入る側 (`entry` / `do`) |
 *
 * ER の `pk` は印の 2 軸とは別の段 (名前の下線) に載るので、`fk` と重ねて書ける。
 *
 * 語を 1 つも知らない図の種類では `null` を返す = 印を付けない。
 */
function 行頭の印にする(
  type: DslDocument["type"],
  marks: readonly string[],
): (RowMark | null)[] | null {
  if (type === "er") {
    return marks.map((m) => {
      const 語 = m.trim().split(/\s+/).filter(Boolean);
      /*
       * **語を書かない行は「ただの値」**。 印を付けない行にはしない (#1466)。
       *
       * ER の印は 2 軸とも既定を持つ = 四角 (外を指さない) で塗る (空にできない)。
       * 印なしにすると、書かなかった列だけ行頭が空いて群の間と見分けが付かなくなる。
       */
      return {
        shape: 語.includes("fk") ? ("chevron" as const) : ("square" as const),
        filled: !語.includes("opt"),
        ...(語.includes("pk") ? { underline: true } : {}),
      };
    });
  }
  if (type === "state") {
    return marks.map((m) => {
      const 語 = m.trim();
      if (語 === "") return null;
      const 表 = FSM_ACTION_MARK as Record<string, RowMark>;
      return 表[語] ?? null;
    });
  }
  return null;
}

/**
 * `lanes:` で作った縦列と、見本 (parts) が作った同一idの縦列を 1 つに重ねる (#1241)。
 *
 * `lanes:` の中身を読むのは見本を重ねるより前で、その時点では見本の縦列がまだ無い。
 * そのため同じ id を書くと **縦列が 2 つできて、書いた幅は箱の入っていない方に付く**
 * (実測 = `g__l` が 777 と 400 の 2 本になり、箱は 400 の方に入った)。
 *
 * 後から来た見本の縦列に書いた値を移し、先に作った空の方を外す。 書いた人から見れば
 * 「id を書けば効く」 が成り立つ。
 */
function mergeDuplicateDeclaredLanes(diagram: CdlDiagram, 追加した縦列: readonly DslLane[]): void {
  for (const 宣言 of 追加した縦列) {
    const { id } = 宣言;
    const 同一idの縦列 = diagram.lanes.filter((l) => l.id === id);
    if (同一idの縦列.length < 2) continue;
    // 宣言 lane は parts より先に追加されるため、後から作った parts lane を残す。
    const 残す = 同一idの縦列.at(-1);
    if (残す === undefined) continue;
    const 元の中心X = (残す.x ?? 0) + 残す.width / 2;
    // 新規 lane に入れた既定値ではなく、DSL に明示された値だけを parts lane へ重ねる。
    if (宣言.x !== undefined) 残す.x = 宣言.x;
    if (宣言.width !== undefined) 残す.width = 宣言.width;
    if (宣言.label !== undefined) 残す.label = 宣言.label;
    if (宣言.contain !== undefined) 残す.contain = 宣言.contain;
    if (宣言.lifeline !== undefined) 残す.lifeline = 宣言.lifeline;
    const 移動X = (残す.x ?? 0) + 残す.width / 2 - 元の中心X;
    // parts node は絶対座標を持つため、lane だけ動かすと箱が元の場所に残る。
    for (const node of diagram.nodes) {
      if (node.lane === id && node.posX !== undefined) node.posX += 移動X;
    }
    for (let i = diagram.lanes.length - 1; i >= 0; i -= 1) {
      if (diagram.lanes[i]?.id === id && diagram.lanes[i] !== 残す) diagram.lanes.splice(i, 1);
    }
  }
}

/**
 * `lanes:` で作った縦列に箱が 1 つも入らなかったら伝える (#1241)。
 *
 * 意図して空の縦列を置くことはあるが、その場合も「置いた」 と分かる形で知らせる方が、
 * 書き間違いを黙って捨てるより良い。
 */
function reportEmptyDeclaredLanes(
  diagram: CdlDiagram,
  追加した縦列: readonly DslLane[],
  onNotice?: (n: CompileNotice) => void,
): void {
  if (追加した縦列.length === 0) return;
  mergeDuplicateDeclaredLanes(diagram, 追加した縦列);
  if (!onNotice) return;
  const 使われている = new Set(diagram.nodes.map((n) => n.lane));
  const ある縦列 = diagram.lanes.map((l) => l.id).filter((x) => 使われている.has(x));
  for (const { id, pos } of 追加した縦列) {
    if (使われている.has(id)) continue;
    onNotice({
      kind: "lane-declared-empty",
      actor: id,
      line: pos?.line ?? 0,
      message: `lanes に書いた ${truncateForMessage(id)} はどの箱も入らない縦列です (新しく作りました)`,
      hint:
        ある縦列.length > 0
          ? `この図が持つ縦列 = ${ある縦列.join(" / ")}`
          : "この図は箱の入った縦列を持ちません",
    });
  }
}

/**
 * 登場人物に書いた欄と、最上位の `lanes:` / `viewport:` を、組み立て済みの図へ後から重ねる。
 *
 * 図種ごとの組み立て器が基本の並びを作った後に、次の 3 つを重ねる。
 *
 * - 登場人物に書いた欄を、同じ id の箱へ写す
 * - `lanes:` に書いた x / width / label / contain / lifeline を、同じ id の縦列へ写す。
 *   無ければ縦列を作り、`追加した縦列out` に積む
 * - `viewport:` の `laneWidth` を全ての縦列の幅にし、残りの欄を図の `viewport` にまとめる
 *
 * どの欄を写すかは本体が持つ。 `groups:` は `applyGroupContainers` が扱う。
 */
function applyV05Extensions(
  diagram: CdlDiagram,
  doc: DslDocument,
  /** `lanes:` が新しく作った縦列。 箱が入ったかは見本を重ねた後でないと分からない (#1241) */
  追加した縦列out?: DslLane[],
): CdlDiagram {
  // actor の主要 node を preset 種別で回収する。 sequence / solidity は header/footer を対で生成する
  // preset で主要 node は header、 それ以外の preset は actor 名 slug がそのまま node id になる。
  //
  // seq-like の非 animate 経路は実 node id を CDL preset 側 slugify (`_` → `-` 置換 + 全角正規化) で
  // 生成する。 dragon slugify (`_` / 全角 保持) で `{slug}-header` を決め打つと、 actor `A_B` の
  // primaryNodeId `a_b-header` が実 node `a-b-header` と食い違い、 inline option (subtitle / eyebrow /
  // value / rows) が drop する (#881、 #873 / #877 と同根の dragon⇔CDL slug 不一致)。
  //
  // **順序図系はここを通らない** (#1466)。 `sequence` / `solidity` は 1 枚の板になり、面ごとの
  // 箱も縦列も作らなくなった = 書いた欄を写す相手が無い。 面に書いた内容が効かないことは
  // `reportActorKindNotHonored` が伝える。
  // actor inline option → node merge
  for (const a of doc.actors) {
    const dragonSlug = slugify(a.name);
    // 1 actor = 1 node (id = dragon slug) で node id と dragon slug が一致する。
    const primaryNodes = diagram.nodes.filter((n) => n.id === dragonSlug);
    for (const node of primaryNodes) {
      // 識別に使う名前と、箱に出す題を分ける (#1381)。 preset が actor 名で
      // node を作る経路 (sequence / solidity / swimlane / c4) もここで書き換える。
      if (a.title !== undefined) node.title = a.title;
      // `type: c4` では説明の先頭に段の目印 (`L1` / `L2` / `L3`) を書く。 目印は組み立てに
      // 段を伝えるためのもので読む人に意味を持たず、 段の名前は枠のラベルが既に出している。
      // ここで落とさないと、 組み立てが読み取った目印がそのまま箱の説明として出る (#1098)
      const 説明 = doc.type === "c4" ? 段を読み取る(a.subtitle).説明 : a.subtitle;
      if (説明 !== undefined) node.subtitle = 説明;
      if (a.eyebrow !== undefined) node.eyebrow = a.eyebrow;
      if (a.value !== undefined) node.value = a.value;
      /*
       * 行は **組み立て器が持つ図では上書きしない** (#1466)。
       *
       * クラス図は行頭の印を出すために、公開の記号 (`+` / `-`) と呼び出しの括弧を字から
       * 落とし、群の区切り (`───`) を空の行に置き換える。 書いた字をそのまま載せ直すと
       * その加工が消え、印と字が同じことを 2 度言う形に戻る (実測)。
       */
      if (a.rows !== undefined && !行を組み立て器が持つ(doc.type)) node.rows = a.rows;
      // 行頭の印 (#1466)。 書いた語を図の種類ごとの意味で読み、群の分け方も種類が決める
      if (a.marks !== undefined && a.rows !== undefined) {
        const 組 = 行と印を組む(doc.type, a.rows, a.marks);
        if (組 !== null) {
          node.rows = 組.rows;
          node.rowMarks = 組.rowMarks;
        }
      }
      /*
       * **行を持たない状態でも欄を置く** (#1466)。
       *
       * 描き手は `rowMarks` の有無で新しい意匠かどうかを決める (`storage.tsx`)。 行の無い箱で
       * 欄ごと省くと、その箱だけ従来の意匠に落ちて呼び名が消える (組み立て API 側の
       * `stateMachine` は同じ理由で空の欄を置いている)。
       */
      if (doc.type === "state" && node.kind === "storage" && node.rowMarks === undefined) {
        node.rows = a.rows ?? [];
        node.rowMarks = [];
      }
      // 箱の大きさを反映する (#1259)。 **animation の有無に関係なく** = 動く図専用の
      // 組み立てだけで渡すと、同じ記法でも静止図では指定が消える。
      //
      // **幅が図に出るかは縦列との大小で決まる**。 縦列に収まれば箱だけが変わり、
      // 縦列より広ければ縦列ごと押し広げる (実測 = 状態遷移図の 320 は縦列 370 に収まって
      // 図が変わらないが、入れ子の状態遷移図の 280 に対し既定 640 は縦列 330 を押し広げた)。
      // #1260 で 1 件だけ見て「見た目に出ない」 と判断し配線を外した = 同じ誤りを繰り返さない
      if (a.posW !== undefined) node.w = a.posW;
      if (a.posH !== undefined) node.h = a.posH;
      // 箱の中に描く図形 (#1374)。 renderer が shape を描くのは dyn-* kind だけなので、
      // shape 自身を SSOT にして対応する kind へ揃える。 card 等のまま shape だけ渡すと、指定を
      // 保持しているのに画面には何も出ない。 paint 検査が入力を mutate しないよう object も写す。
      if (a.shape !== undefined) {
        const dynamicKind = `dyn-${a.shape.kind}` as typeof node.kind;
        node.kind = dynamicKind;
        node.shape = { ...a.shape };
      }
      // その箱を出すかどうかの条件 (#1381)
      if (a.visibleIf !== undefined) node.visibleIf = a.visibleIf;
      /*
       * 値に追随する 5 欄 (#1392)。
       *
       * 見た目の大きさ / 濃さ / ずらしを、書いた箱にだけ効かせる。
       */
      if (a.wBind !== undefined) node.wBind = a.wBind;
      if (a.hBind !== undefined) node.hBind = a.hBind;
      if (a.opacity !== undefined) node.opacity = a.opacity;
      if (a.renderOffsetX !== undefined) node.renderOffsetX = a.renderOffsetX;
      if (a.renderOffsetY !== undefined) node.renderOffsetY = a.renderOffsetY;
    }
  }
  // v0.5+ animation phase 後段注入 (CAR-1657 fix、 元 dragon PR #413 report user)。
  // preset (class / pie / c4 / mind / gantt) が doc.animate を無視して build するケースを補償。
  // 既に preset が phase を生成済 (sequence / flow / swimlane / er / state / topology 経由 = compileGenericWithAnimate) なら skip。
  // doc に phase 指定があって diagram.phases が空なら、 preset 由来 lane/node/edge に対して generic phase を注入する。
  if (doc.animate && doc.animate.phases.length > 0 && diagram.phases.length === 0) {
    injectPhasesFallback(diagram, doc);
  }
  // top-level lanes section → lane merge
  //
  // **書いた id がどの縦列とも合わない形を後で伝える** (#1241)。 合わない id は新しい縦列を
  // 作るだけで、書いた幅や見出しは元の縦列に届かない。 書き間違い (`lane-idl` / 全角の
  // `lane-Ａ`) がこの形になり、黙って捨てられていた (実測 = 幅 999 を持つ空の縦列が増え、
  // 元の縦列は 360 のままだった)
  const 追加した縦列: DslLane[] = 追加した縦列out ?? [];
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
        // lane が preset で作られていなければ新規追加。
        //
        // **横位置を書いていなければ横位置を持たせない** (#2147)。 描画側は横位置を持たない縦列を
        // 書いた順に前の縦列の右へ並べ、横位置を持つ縦列は横位置の順に並べる。 0 を入れると、
        // 型が作った縦列 (横位置を持たない) の間に割り込む (実測 = 登場人物 受付 / 出荷 の後に書いた
        // `置き場` が 受付 と 出荷 の間に描かれた)
        diagram.lanes.push({
          id,
          ...(laneOpt.x !== undefined ? { x: laneOpt.x } : {}),
          width: laneOpt.width ?? 320,
          label: laneOpt.label,
          contain: laneOpt.contain,
          lifeline: laneOpt.lifeline,
        });
        追加した縦列.push(laneOpt);
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
  // 矢印は半角 (`->`) と全角 (`→`) の両方を受ける (他の経路が全角で書かれても同じ結果になる)。
  // 同じ from / to の線が複数ある時は 1 本目で止めず、全件を光らせる。
  // 実在する名前。 矢印を含む名前 (`"A -> B"`) を矢印と読み違えないために渡す
  const knownNames = new Set(doc.actors.map((a) => a.name));
  // 図全体を 1 つの箱で描く種類は、 登場人物ごとの箱を持たない。
  // 箱が 1 つの時だけ対象にする = 2 つ以上あるとどれを指したのか決められない
  const singleBoxNodes = diagram.nodes.filter((n) => SINGLE_BOX_KINDS.has(String(n.kind)));
  const singleBoxNode = singleBoxNodes.length === 1 ? singleBoxNodes[0] : undefined;
  const resolveIds = (highlight: readonly string[]): string[] => {
    const out: string[] = [];
    for (const h of highlight) {
      const entry = parseFocusEntry(h, knownNames);
      if (entry.kind === "edge") {
        const fromSlug = slugify(entry.from);
        const toSlug = slugify(entry.to);
        let 見つかった = false;
        for (const e of diagram.edges) {
          if (e.from === fromSlug && e.to === toSlug) {
            out.push(e.id);
            見つかった = true;
          }
        }
        // 線を持たない種類 (帯の依存等) では矢印が edge にならない。 両端が実在するなら
        // その箱を光らせる = 矢印を指した段で何も光らないより意図に近い (#1077)
        if (
          !見つかった &&
          singleBoxNode !== undefined &&
          knownNames.has(entry.from) &&
          knownNames.has(entry.to)
        ) {
          out.push(singleBoxNode.id);
        }
        continue;
      }
      const nodeSlug = slugify(entry.name);
      const node = diagram.nodes.find((n) => n.id === nodeSlug || n.id === `${nodeSlug}-header`);
      if (node) {
        out.push(node.id);
        continue;
      }
      // 図全体が 1 つの箱になる種類 (円グラフ等) では、 登場人物ごとの箱が無い。 名前で
      // 指しても解決できず、 書いた `focus:` が丸ごと消える (#1076 で pie を 1 箱にした時に
      // 発生)。 **書いた名前が実在するなら、 その箱を光らせる** = 何も光らないより意図に近い。
      // 実在しない名前は従来どおり無視する (綴り誤りを黙って光らせない)
      if (knownNames.has(entry.name) && singleBoxNode !== undefined) out.push(singleBoxNode.id);
    }
    // 同じ箱を複数回指した時に重複させない (円グラフで 4 人を指すと 4 回入る)
    return [...new Set(out)];
  };

  // phase 注入。 CdlPhase.tweens[].stateId / sets[].stateId で state 参照 (state ではない)。
  for (const p of doc.animate.phases) {
    const activateIds: string[] = [...resolveIds(p.highlight ?? [])];
    // `draw:` を描画側の欄へ写す (#1312 / #1314 / #1318)。 相手は 1 箱で図全体を描く
    // 対象の箱で、必ず 1 つに決まるため名前を書かせずに引ける。
    //
    // **`activate` と兼ねない**。 描画側は焦点と別集合で持つ (`cdl#512`) = 焦点が当たり
    // 続ける図で毎段引き直しになるため。 書いた段だけが欄を持つ
    const drawIds =
      p.draw !== undefined && DRAW_TARGETS.get(p.draw) === doc.type && singleBoxNode !== undefined
        ? [singleBoxNode.id]
        : [];
    diagram.phases.push({
      id: slugify(p.name) || p.name,
      duration: p.durationMs,
      title: p.name,
      body: p.body ?? "",
      activate: activateIds,
      ...(drawIds.length > 0 ? { draw: drawIds } : {}),
      // 描く速さ (#1441)。 **描く相手が決まった段にだけ載せる** = 語が効かない図種
      // (`drawIds` が空) で割合だけ渡すと、描画側が「draw が空なのに割合がある」 と知らせる
      ...(drawIds.length > 0 && p.drawRatio !== undefined ? { drawRatio: p.drawRatio } : {}),
      tweens: (p.tweens ?? []).map((t) => ({ stateId: t.state, from: t.from, to: t.to })),
      sets: (p.sets ?? []).map((s) => ({ stateId: s.state, value: s.value })),
      ...(p.badge ? { badge: p.badge } : {}),
    });
  }
}

/**
 * 向きの行を外しても、同じ組み立ての経路を通るか (#2421)。
 *
 * **向きを書くこと自体が経路を切り替える**。 フローは鎖をやめて書いた端のとおりに繋ぎ
 * (`鎖にしない書き方`)、担当の図は静止図の組み立てから共通の組み立てへ回る
 * (`共通の組み立てへ回す` の図種ごとの理由)。
 *
 * だから「既定と同じ値なら何もしない」 は成り立たない。 実測 = 動きを書かないフローに
 * `direction: 縦` を足すと、viewBox が 490×539 から 504×631 に変わり、矢印の線種も変わる。
 *
 * 同じ経路を通る時だけ、書いた向きは本当に何もしない。 その経路の中で向きを読むのは
 * `並べる向き` だけで、既定と同じ値ならそこも同じ値を返す。
 *
 * **判定は経路を決める関数から導く**。 条件を手で並べると、`鎖にしない書き方` に行が増えた日に
 * ここだけ古くなる。
 */
function 向きを外しても同じ経路か(doc: DslDocument): boolean {
  const 向きなし: DslDocument = { ...doc, direction: undefined };
  if (doc.type === "flow") return 鎖でつなぐ形か(向きなし) === 鎖でつなぐ形か(doc);
  if (doc.type === "swimlane") {
    return 共通の組み立てへ回す("swimlane", 向きなし, false) === 共通の組み立てへ回す("swimlane", doc, true);
  }
  /*
   * 分かれ道の図は向きで経路が変わらない (#2524)。 組み立ては 1 本で、向きは中で
   * 「縦列 1 本に積むか」 の 1 点だけを切り替える。 既定と同じ値を書いた図は同じ並びになる。
   */
  if (doc.type === "flowchart") return true;
  return false;
}

/**
 * 書いた向きが図を変えない時に伝える (#1494 / #2421)。
 *
 * 変えない形は 3 つある。 向きを選べない図種に書いた形と、全ての箱が縦列を書いた形と、
 * 既定と同じ向きを書いて経路も変わらない形。
 * 前の 2 つは書いた向きが捨てられる形なので `direction-not-honored`、
 * 3 つ目は書いても書かなくても同じ図になる形なので `direction-same-as-default`。
 *
 * **読み手が次に取る手が違うので 1 つにまとめない**。 前者は書き方を変えれば効くが、
 * 後者は既に効いている値と同じで、行を外すか別の値を書くかの選択になる。
 *
 * 黙って捨てると「書いたのに変わらない」 が手掛かりなしで起きる。
 */
function reportDirectionNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.direction === undefined) return;
  const 行 = doc.directionPos?.line ?? doc.pos?.line ?? 0;
  if (!向きを選べる図種.has(doc.type)) {
    onNotice({
      kind: "direction-not-honored",
      actor: doc.title,
      line: 行,
      message: `書いた direction は効きません (type: ${doc.type} は並び方そのものが読み方を決めます)`,
      hint: `direction を書けるのは ${[...向きを選べる図種].join(" / ")} です`,
    });
    return;
  }
  if (!縦列より向きが勝つ図種.has(doc.type) && 書いた縦列に置く(doc.type, doc)) {
    onNotice({
      kind: "direction-not-honored",
      actor: doc.title,
      line: 行,
      message: "書いた direction は効きません (全ての箱が縦列を書いているので、そちらが優先されます)",
      hint: "direction で並べたい時は箱の `lane` を外してください",
    });
    return;
  }
  const 既定 = 既定の向き(doc.type);
  if (doc.direction === 既定 && 向きを外しても同じ経路か(doc)) {
    onNotice({
      kind: "direction-same-as-default",
      actor: doc.title,
      line: 行,
      message: `書いた direction は図を変えません (${既定} は type: ${doc.type} の既定で、この図は向きの行を外しても同じ並びになります)`,
      hint: `並びを変えるなら ${既定 === "縦" ? "横" : "縦"} を書いてください。 今の並びのままにするなら direction の行は外せます`,
    });
  }
}

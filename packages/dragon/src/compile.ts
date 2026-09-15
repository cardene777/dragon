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

import type {
  DslActor,
  DslDocument,
  DslLane,
  DslPhase,
  DslStep,
  DslEventBinding,
  DslValue,
  PresetType,
} from "./types";
import type {
  CdlDiagram,
  CdlEdge,
  ErRelationCardinality,
  FormulaAst,
  LaidDiagram,
  NodeKind,
  RowMark,
} from "@cardenelabs/cdl";
import {
  sequence,
  flow,
  swimlane,
  er,
  stateMachine,
  classDiagram,
  FSM_ACTION_MARK,
  sequenceStepId,
  topology,
  diagram,
  layout,
  applyDerivedValues,
  parseFormula,
  extractIdentifiers,
  inputDefaultValue,
} from "@cardenelabs/cdl";
import { parseFocusEntry } from "./focus";
import { DRAW_TARGETS, DSL_ONLY_KINDS } from "./v05/parser";
import { isColorValue, pointsOutside, stripExternalPaint } from "./color";
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

/**
 * 記法だけが持つ種類を、描画できる種類へ読み替える (#1420)。
 *
 * 記法は `contract` / `eoa` のような **描画側に無い種類** を受け付ける
 * (`v05/parser.ts` の `DSL_ONLY_KINDS`)。 図種ごとの役割分け (`solidity` の縦列の並べ替え
 * など) に使うためで、記法としては正しい。
 *
 * **そのまま描画側へ渡すと図の組み立てが落ちる**。 描画側は知らない種類の大きさを引けず、
 * `Cannot read properties of undefined (reading 'h')` で止まる (実測)。
 *
 * `solidity` と `er` は組み立ての中で別の種類に置き換えていたが、`flow` / `swimlane` /
 * `state` / `topology` は `a.kind` をそのまま渡していた。 記法が受ける値で図が出ない状態
 * だったので、渡す手前で必ず通す。
 *
 * ## 読み替え先
 *
 * | 種類 | 読み替え先 | なぜ |
 * |---|---|---|
 * | `entity` | `storage` | 表を持つ = ER 図の実体 |
 * | `state` | `card` | 状態は札で表す |
 * | `contract` / `proxy` / `library` / `interface` | `card` | 契約は札で表す (`solidity` の置き換え先に合わせた) |
 * | `eoa` | `person` | 人が持つ財布 |
 * | `multisig` | `signer` | 複数人で署名する (`solidity` の置き換え先に合わせた) |
 *
 * **表は `DSL_ONLY_KINDS` を鍵にして書く**。 種類を足した時に読み替え先が無いと
 * 型検査が落ちるので、足し忘れが残らない。
 */
const 記法だけの種類の読み替え: Readonly<
  Record<(typeof DSL_ONLY_KINDS)[number], NodeKind>
> = {
  entity: "storage",
  state: "card",
  contract: "card",
  proxy: "card",
  library: "card",
  interface: "card",
  eoa: "person",
  multisig: "signer",
};

/** 描画側へ渡せる種類にする。 記法だけの種類はここで読み替わる (#1420) */
function 描ける種別(kind: string | undefined): NodeKind {
  if (kind === undefined) return "actor";
  const 読み替え先 = (
    記法だけの種類の読み替え as Record<string, NodeKind | undefined>
  )[kind];
  return 読み替え先 ?? (kind as NodeKind);
}


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
    | "part-not-drawn"
    // 向きが効かない形で `向き:` を書いた (#1494)
    | "direction-not-honored"
    // `倍率:` を書いた見本が、同じ名前の状態も持っていた (#1026)
    | "scale-reserved"
    // 部品に書いた色が効かない (#1973)。 色番号を入れる状態を 1 つも持たない部品に色番号を
    // 書いた時と、色番号でなく色の名前を書いた時
    | "part-color-ignored"
    // 部品に、部品が持たない状態の名前で値を書いた (#1976)。 綴り違いと、外した欄 (`nodes`) を書いた時
    | "part-state-missing"
    // 部品へ引いた矢印を、部品の中のどの要素にも繋げず外した (#1979)。 要素が 2 つ以上あり名指しが無い時、
    // 名指しした要素が部品に無い時、部品を取り込まなかった時
    | "part-edge-dropped"
    // 矢印に部品の要素の名指し (`fromPartNode` / `toPartNode`) を書いたが、その端が部品でない (#1979)
    | "part-node-ignored"
    // 縦列に置くはずの部品が他の箱の位置の基準になっていて、縦列に置けなかった (#1980)
    | "part-lane-ignored"
    // 値で描く図 (`pie` / `bar` / `line`) で値を読めなかった (#1154)
    | "chart-value-unreadable"
    // 同上で矢印を書いた。 これらの図は関係を描けない (#1154)
    | "chart-edge-dropped"
    // 同じ名前を `states` と `values` の両方に書いた (#1162)
    | "value-shadows-state"
    // 式を解けず、その値を止めた (輪 / 無い名前 / 読めない式 / 数として読めない値、 #1162)
    | "value-unresolved"
    // 同じ名前を `values` に 2 度書いた。 先に書いた式を使う (#1162)
    | "value-duplicate"
    // 矢印が `actors` に無い名前を指した (#1209)
    | "flow-actor-missing"
    // きっかけ形の値を段に畳めなかった (段が無い / 相手が境目を通らない / 段からはみ出す、 #1161)
    | "value-trigger-unresolved"
    // 箱に `lane:` を書いたが、 縦列は図種が決めるため効かなかった (#1246)
    | "lane-not-honored"
    // `lanes:` に書いた縦列に箱が 1 つも入らなかった (#1241)
    | "lane-declared-empty"
    // 最上位に `eyebrow:` を書いたが、 箱ごとに分かれる図種で相手が決まらなかった (#1247)
    | "eyebrow-not-honored"
    // 静止した `type: flow` で、書いた矢印の端が使われなかった (#1269)
    | "flow-endpoint-not-honored"
    // 起点から描く動きを持たない図種で段に `draw:` を書いた (#1312)
    | "draw-not-honored"
    // `draw:` の語がその図種と食い違う (`type: bar` に `draw: pie`、 #1314)
    | "draw-target-mismatch"
    // 式が、どこにも書かれていない名前を読んだ (#1391)
    | "formula-unresolved"
    // 出来事が指す相手が図に無い (#1393)
    | "event-target-missing"
    // 順序図で面に種類を書いたが、板は名前と呼び名しか描かない (#1466)
    | "actor-kind-not-honored"
    // 順序図の言づてに、板が描かない飾り (色味 / 添え字 / 寄せ) を書いた (#1466)
    | "message-option-not-honored"
    // 位置のずらし (`pos` / `offsetX` / `offsetY`) を載せる相手が無いか、書いた量だけ動かせなかった (#1971)
    | "position-offset-ignored"
    // 組 (`groups:`) が束ねる縦列が図に無い (#1972)
    | "group-lane-missing"
    // 組が束ねる縦列の間に、束ねない縦列を挟んでいる (#1972)
    | "group-lanes-apart";
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
      diagram = compileValueChart(doc, "pie", "chart-pie", opts?.onNotice);
      break;
    case "bar":
      diagram = compileValueChart(doc, "bar", "chart-bar", opts?.onNotice);
      break;
    case "line":
      diagram = compileValueChart(doc, "line", "chart-line", opts?.onNotice);
      break;
    case "gauge":
      diagram = compileValueChart(doc, "gauge", "chart-gauge", opts?.onNotice);
      break;
    case "radial":
      diagram = compileValueChart(doc, "radial", "chart-radial", opts?.onNotice);
      break;
    case "stat":
      diagram = compileValueChart(doc, "stat", "chart-stat", opts?.onNotice);
      break;
    case "waffle":
      diagram = compileValueChart(doc, "waffle", "chart-waffle", opts?.onNotice);
      break;
    case "stacked":
      diagram = compileValueChart(doc, "stacked", "chart-stacked-bar", opts?.onNotice);
      break;
    case "slope":
      diagram = compileValueChart(doc, "slope", "chart-slope", opts?.onNotice);
      break;
    case "funnel":
      diagram = compileFunnel(doc, opts?.onNotice);
      break;
    case "tree":
      diagram = compileTree(doc, opts?.onNotice);
      break;
    case "journey":
      diagram = compileJourney(doc, opts?.onNotice);
      break;
    case "quadrant":
      diagram = compileQuadrant(doc, opts?.onNotice);
      break;
    case "c4":
      diagram = compileC4(doc);
      break;
    case "mind":
      diagram = compileMind(doc, opts?.onNotice);
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
  applyEdgeInlineOptions(diagram, doc, edgeSourceLines, 矢印の行);
  const 作った組の枠 = applyGroupContainers(diagram, doc);
  applyNodeTones(diagram, doc);
  // 光らせる相手が実在するかを確かめる。 id への解決は図種ごとに違うが、 名前が居るか
  // 居ないかは記述だけで決まるので 1 か所で見る
  reportMissingFocusTargets(書いたまま, opts?.onNotice);
  // 矢印が指す名前が actors に居るかを確かめる。 図種ごとの解決より前に、 記述だけで決まる
  reportMissingFlowActors(書いたまま, opts?.onNotice);
  // 両端が同じ矢印を伝える (#1227)。 落とす前の `flow` を見る
  // 静止した `type: flow` で書いた矢印の端が使われないことを伝える (#1269)。
  // 自分へ戻る形と居ない名前を指す形は既に落ちた後の `doc` を見る = 上の 2 件と重ねない
  reportFlowEndpointNotHonored(doc, 分けた.元の名前, opts?.onNotice);
  reportLaneNotHonored(書いたまま, opts?.onNotice);
  reportActorKindNotHonored(書いたまま, opts?.onNotice);
  reportMessageOptionNotHonored(書いたまま, opts?.onNotice);
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
  applyCanvasPivotPositions(diagram, placed, opts?.onNotice);
  // CAR-1657 = parts kind actor を merge (opts.partsCatalog 経由)、 applyV05Extensions 後段で実行
  const 追加した縦列: DslLane[] = [];
  const extended = applyV05Extensions(diagram, placed, 追加した縦列);
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
    const ownReadouts = doc.readouts.map(
      (readout) => deepRewriteStrings(readout, (value) => value) as typeof readout,
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
        opts?.onNotice?.({
          kind: "event-target-missing",
          actor: e.handlerId,
          line: e.pos.line,
          message: `出来事 "${e.handlerId}" が指す相手が見つかりません`,
          hint: "box は箱の名前、 lane は縦列の名前、 arrow は `A -> B` で書く",
        });
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
 * 全ての箱が「いま」 になり、止まっている箱の枠が 1 度も出ない (実測 = ER 図 3 箱 / 流れ図 2 箱)。
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
/**
 * 矢印の指す先を `actors` に書いた **正規の名前** へ解決する表 (#1209)。
 *
 * 名前そのものに加えて **一意な slug も受ける**。 動きを書いた図の組み立ては `slugify` に
 * 落として引くため、 `API Gateway` を `api-gateway` と書いた形が届く。 2 つ以上の名前が
 * 同じ slug になる時は受けない = どちらを指したか決められない。
 *
 * **返すのは正規の名前で、 slug ではない**。 slug を返すと、 動きを書いていない図の組み立て
 * (名前の完全一致で引く) と食い違う = 知らせは出ないのに label が消える / 題が slug に化ける /
 * 依存が切れる、 という形になる (Round 1 で実測)。 中央で名前へ揃えれば全経路が同じ相手を指す。
 */
function actorRefTable(doc: DslDocument): Map<string, string> {
  const 表 = new Map<string, string>();
  const slug数 = new Map<string, number>();
  for (const a of doc.actors) {
    const sl = slugify(a.name);
    slug数.set(sl, (slug数.get(sl) ?? 0) + 1);
  }
  for (const a of doc.actors) {
    表.set(a.name, a.name);
    const sl = slugify(a.name);
    if ((slug数.get(sl) ?? 0) === 1) 表.set(sl, a.name);
  }
  return 表;
}

/**
 * 矢印の指す先を正規の名前へ揃えた `flow` を返す (#1209)。
 *
 * 解決できない矢印はそのまま残す = 図種ごとに扱いが違う (木は独自の知らせを出し、 値で描く図は
 * 落とす)。 中央で消すとその扱いが効かなくなる。 残した分は `reportMissingFlowActors` が
 * 知らせ、 動きを書いた図の組み立てが落とす。
 */
function canonicalizeFlowActors(doc: DslDocument): DslDocument {
  const 表 = actorRefTable(doc);
  let 変えた = false;
  const flow = doc.flow.map((s) => {
    const from = 表.get(s.from) ?? s.from;
    const to = 表.get(s.to) ?? s.to;
    if (from === s.from && to === s.to) return s;
    変えた = true;
    return { ...s, from, to };
  });
  return 変えた ? { ...doc, flow } : doc;
}

/**
 * 図種ごとの図の作り (#1219 / #1220)。
 *
 * 2 つの判断がここから決まる。 解決できない矢印を中央で落とすか (#1219) と、 名前が同じ id に
 * 潰れる登場人物を作り替えるか (#1220)。 どちらも **登場人物の名前が箱や枠の id になる図種**
 * でだけ要る。
 *
 * `#1209` は動きを書いた 2 経路だけを塞いだ。 残る経路では **知らせは出るのに図まで壊れる**
 * 状態だった (実測 = 8 図種が `compile` の `unknown-ref` で落ちる)。
 *
 * | 作り | 解決できない矢印 | 同じ id に潰れる名前 |
 * |---|---|---|
 * | 登場人物ごとに箱 | 中央で落とす | 名前を作り替えて id を分ける |
 * | 図全体を 1 箱 | 図種に任せる | 触らない |
 *
 * **1 箱で描く図種を中央で落とさない**。 これらは矢印そのものを描かず、 書かれた本数を数えて
 * 独自の知らせを出す (`chart-edge-dropped` / 木の親子の知らせ)。 中央で外すと本数が変わり、
 * 全部が解決できない図では知らせごと消える。 同じ id に潰れる名前も、 中身を payload が
 * 持つため箱の id にならず、 木と放射は独自の知らせを出す。
 *
 * `Record<PresetType, ...>` にしてあるので、 図種を足した時にどちらかを決めないと型検査が
 * 落ちる (`rules/quality.md § 多層 SSOT 経路の全 registration 保証` と同じ形)。
 */
const 図種の作り: Record<PresetType, "登場人物ごとに箱" | "図全体を 1 箱"> = {
  // 矢印の端と登場人物の名前が、 そのまま箱や枠の id になる
  sequence: "登場人物ごとに箱",
  flow: "登場人物ごとに箱",
  swimlane: "登場人物ごとに箱",
  er: "登場人物ごとに箱",
  state: "登場人物ごとに箱",
  topology: "登場人物ごとに箱",
  solidity: "登場人物ごとに箱",
  class: "登場人物ごとに箱",
  c4: "登場人物ごとに箱",
  // 中身は payload が持ち、 図そのものは 1 箱。 矢印は描かず本数を数えて知らせる
  gantt: "図全体を 1 箱",
  pie: "図全体を 1 箱",
  bar: "図全体を 1 箱",
  line: "図全体を 1 箱",
  gauge: "図全体を 1 箱",
  radial: "図全体を 1 箱",
  stat: "図全体を 1 箱",
  waffle: "図全体を 1 箱",
  stacked: "図全体を 1 箱",
  slope: "図全体を 1 箱",
  funnel: "図全体を 1 箱",
  tree: "図全体を 1 箱",
  journey: "図全体を 1 箱",
  quadrant: "図全体を 1 箱",
  mind: "図全体を 1 箱",
};

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
 * 図全体を 1 箱にする図種で、 その箱の上に出す小見出しを渡す (#1247)。
 *
 * 書かなければ何も渡さない = 従来どおり小見出しは付かない。 `undefined` を明示して渡すと、
 * 組立て側が「空の小見出しを書いた」 と区別できなくなるので、 項目ごと落とす。
 */
function 図の小見出し(doc: DslDocument): { eyebrow?: string } {
  return doc.eyebrow === undefined ? {} : { eyebrow: doc.eyebrow };
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
 */
function reportLaneMixed(doc: DslDocument, onNotice: (n: CompileNotice) => void): void {
  const 対象 = doc.actors.filter((a) => a.partId === undefined);
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
  doc.actors.forEach((a, i) => {
    const 次 = doc.actors[i + 1];
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
      hint: "書いた端どおりに繋ぐには、direction: 縦 を書くか箱に lane: を書いてください (向きか縦列を書いた形は書いた端がそのまま矢印になります)",
    });
  }
}

/**
 * 箱に書いた縦列が効かないことを伝える (#1246)。
 *
 * 縦列は **図種が決める**。 `flow` / `topology` は 1 本にまとめ、 `swimlane` / `er` / `state`
 * は箱ごとに 1 本作り、 `sequence` はそれがそのまま生命線になる。 図全体を 1 箱にする図種
 * (`pie` / `bar` 等) では箱が 1 つしかない。 **どの図種も箱の `lane` を読まない**。
 *
 * 黙って捨てると、 書いた縦列は消え、 `lanes:` で宣言した縦列だけが中身のないまま残る。
 * 実測 = `type: flow` で `lane: ui` / `lane: api` を書くと箱は両方 `flow` に入り、
 * 宣言した `ui` / `api` は空のまま増えた。 知らせは 1 件も出なかった。
 *
 * ## なぜ組み立ての側で伝えるのか
 *
 * 記法の解析は図種を見ずに 1 行ずつ読む。 そこで弾くと **見本 (parts) の張替え先** まで
 * 巻き添えになる = 見本では `lane` が実際に読まれる (`mergePartsFromActors` が唯一の読み手)。
 * 図種を知っているのは組み立ての側なので、 効くかどうかの判断もここに置く。
 *
 * ## 見本と `type: mind` では伝えない
 *
 * 見本は上のとおり実際に効く。 `type: mind` は描けない欄をまとめて 1 件で伝えており
 * (`compileMind` の「名前と副題 / 値、 枝の色しか描けません」)、 そこに `枠の指定` が既に
 * 入っている。 二重に伝えると同じ 1 行について知らせが 2 件並ぶ。
 */
/**
 * 順序図で面に書いた飾りが使われないことを伝える (#1466)。
 *
 * 順序図は 1 つの板が図を丸ごと描く形になり、面は上端の見出しに **名前と呼び名だけ** で並ぶ。
 * 面ごとの箱が無いので、種類 / 大きさ / 位置 / 行 / 色 / 小見出し / 値 / 図形を載せる先も無い。
 * 黙って落とすと、書いた側は効いていると思い込む。
 *
 * 見本 (`parts`) を重ねた面は対象外 = 見本は別経路で図に取り込まれ、板の見出しには並ばない。
 */
/**
 * 順序図の言づてに書いた飾りが使われないことを伝える (#1466)。
 *
 * 板は言づてを **語と向きと種類** で描く。 色味 (`tone`) / 添え字 (`sub`) / 寄せ (`side`) を
 * 載せる場所が無い = 矢印だった頃はその 3 つが矢印に付いていたが、板では行になった。
 * 黙って落とすと、書いた側は効いていると思い込む。
 */
function reportMessageOptionNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.type !== "sequence" && doc.type !== "solidity") return;
  for (const s of doc.flow) {
    const 効かない = [
      s.tone !== undefined ? "色味" : "",
      s.sub !== undefined ? "添え字" : "",
      s.side !== undefined ? "寄せ" : "",
      // 名前のずらしも板には載せる先が無い (#1971)。 位置のずらし (`pos`) は名前のずらしに足す欄なので同じ扱い
      s.layoutPos !== undefined || s.labelOffsetX !== undefined || s.labelOffsetY !== undefined
        ? "名前のずらし"
        : "",
    ].filter((x) => x !== "");
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

function reportActorKindNotHonored(doc: DslDocument, onNotice?: (n: CompileNotice) => void): void {
  if (!onNotice) return;
  if (doc.type !== "sequence" && doc.type !== "solidity") return;
  for (const a of doc.actors) {
    if (a.partId !== undefined) continue;
    const 効かない = [
      /*
       * 種類は `sequence` でだけ落ちる。
       *
       * `solidity` は種類で **面の並びを決める** (`compileSolidity`) ので、絵にならなくても
       * 書いた意味は figure に出ている。 落ちたと伝えると、正しく効いている指定に毎回鳴る。
       *
       * 記法を通すと既定の `actor` が必ず入るため、値ではなく書いたかどうかの印で見る。
       * 記法を通さず直接組み立てた場合はこの印が無いので、種類を置いたこと自体を「書いた」 とみなす
       */
      doc.type === "sequence" && a.kindWritten !== false && a.kind !== undefined ? "種類" : "",
      a.posW !== undefined || a.posH !== undefined ? "大きさ" : "",
      a.posX !== undefined ||
      a.posY !== undefined ||
      a.posRel !== undefined ||
      // 位置のずらし (#1971)。 板は面ごとの箱を持たないので動かす相手が無い
      a.layoutPos !== undefined
        ? "位置"
        : "",
      a.rows !== undefined ? "行" : "",
      a.tone !== undefined ? "色" : "",
      a.eyebrow !== undefined ? "小見出し" : "",
      a.value !== undefined ? "値" : "",
      a.shape !== undefined ? "図形" : "",
    ].filter((x) => x !== "");
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
 * 名前から作る id の重なりを解く (#1220)。
 *
 * 箱と枠の id は登場人物の名前から作る (`slugify`)。 **違う名前が同じ id に潰れる** と、
 * どちらも正しく書いているのに図が組み立たない (実測 = `foo-bar` と `Foo Bar` を書くと
 * 9 図種が `duplicate-id` で落ちる)。 知らせも出ない = どちらの名前も `actors` に在るため。
 *
 * ## なぜ名前を作り替えるのか
 *
 * id を作る所は 90 箇所を超え、 さらに **cdl 側の組み立てが名前から id を作る経路** がある
 * (`swimlane()` / `er()` は渡した名札から lane id を作る)。 dragon 側だけを直しても届かない。
 *
 * そこで **渡す名前を変え、 最後に表示だけ戻す**。 作り替えた名前は組み立ての間だけ使い、
 * 出口で `nodes[].title` と `lanes[].label` を元に戻す (`restoreActorNames`)。
 *
 * ## 尾は名前から作る
 *
 * 書き順で決めると、 登場人物を並べ替えただけで id が入れ替わる。 元の名前だけから決まる
 * 短い値を尾に付ければ、 並べ替えても同じ id になる。
 *
 * ## まったく同じ名前は畳む
 *
 * 名前が 1 文字も違わない登場人物は区別できない。 2 つの箱に同じ題が付くだけなので、
 * 先に書いた方を残して知らせる。
 */
function 名前の尾(name: string): string {
  // FNV-1a。 短くて名前だけから決まればよく、 衝突しても下の検査が拾う
  let h = 0x811c9dc5;
  for (const c of name) {
    h ^= c.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").slice(0, 6);
}

/**
 * cdl 側が名札から id を作る時の規則 (`presets.ts` の `slugify`)。
 *
 * **dragon の規則と違う**。 dragon は `-` と `_` を残し `NFKC` で揃え 64 字で切るが、 cdl は
 * どちらも `-` に潰し、 長さも切らない。 このため `a_b` と `a-b` は **dragon では別 id、 cdl では
 * 同じ id** になる (実測 = 動きを書かない `sequence` / `solidity` が `duplicate-id` で落ちる)。
 *
 * ここに写している = cdl は `slugify` を公開していない。 **ずれると衝突を見落とす** ので、
 * 下の検査が既知の組で対応を固定する。
 */
function cdl側のslug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9぀-ゟ゠-ヿ一-龯]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * cdl 側が「形が空になった名前」 に付ける id の頭 (#1220 Round 2 / 3)。
 *
 * cdl は形が空になった時に並びの位置へ逃げる。 逃げ先を鍵に入れないと、 逃げ先と同じ名前の
 * 登場人物が居る図で重なる (実測 = `sequence` の `😀` と `actor-0`)。
 *
 * **図種ごとに違う** (Round 3 の指摘)。 両方を入れると、 その図種では使われない逃げ先まで
 * 衝突とみなして **重なっていない図の id を変える**。 実測した対応は次のとおり。
 *
 * | 図種 | `😀` だけを書いた時に付く id |
 * |---|---|
 * | `sequence` / `solidity` | 枠 `actor-0` (cdl の `sequence()`) |
 * | `swimlane` | 枠 `lane-0` (cdl の `swimlane()`) |
 * | 残る 6 図種 | 箱 `n` (dragon 側の逃げ先。 cdl の逃げ道を通らない) |
 *
 * 空配列は「cdl の逃げ道を通らない」 を表す。 1 箱で描く図種はここに来ない (作り替え自体を
 * しない) が、 図種を足した時に決め忘れないよう全種を並べる。
 *
 * **この表が効くのは動きを書いていない図だけ** (Round 4 の指摘)。 動きを書くと組み立てが別経路に
 * 切り替わり、 id は dragon 側の規則で作られる = cdl の逃げ道を通らない。 使う側で条件を見る。
 */
const 空の形の逃げ先: Record<PresetType, string[]> = {
  sequence: ["actor-"],
  solidity: ["actor-"],
  swimlane: ["lane-"],
  flow: [],
  er: [],
  state: [],
  topology: [],
  class: [],
  c4: [],
  // 図全体を 1 箱で描く群 (作り替えないのでここは使わない)
  gantt: [],
  pie: [],
  bar: [],
  line: [],
  gauge: [],
  radial: [],
  stat: [],
  waffle: [],
  stacked: [],
  slope: [],
  funnel: [],
  tree: [],
  journey: [],
  quadrant: [],
  mind: [],
};

/**
 * その名前が下流で id になりうる形。 どれか 1 つでも重なれば衝突する。
 *
 * 位置と逃げ先が分からない時 (作り替えた候補を確かめる時) は逃げ先を数えない。 作り替えた
 * 名前は尾が付いて形が空にならないので、 そもそも逃げ道を通らない。
 */
function idになる形(name: string, 位置?: number, 逃げ先の頭: string[] = []): string[] {
  const cdl = cdl側のslug(name);
  const out = [slugify(name), cdl];
  if (cdl === "" && 位置 !== undefined) {
    for (const 頭 of 逃げ先の頭) out.push(`${頭}${位置}`);
  }
  return out;
}

function disambiguateActorIds(
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
): { doc: DslDocument; 元の名前: Map<string, string> } {
  const 元の名前 = new Map<string, string>();
  if (図種の作り[doc.type] !== "登場人物ごとに箱") return { doc, 元の名前 };

  // 1. まったく同じ名前を畳む
  const 見た = new Set<string>();
  const 残す: DslActor[] = [];
  for (const a of doc.actors) {
    if (見た.has(a.name)) {
      onNotice?.({
        kind: "chart-value-unreadable",
        actor: a.name,
        line: a.pos?.line ?? 0,
        message: `"${truncateForMessage(a.name)}" を 2 度書いています (先に書いた方だけ描きます)`,
        hint: "違う名前にするか、 1 つにまとめる",
      });
      continue;
    }
    見た.add(a.name);
    残す.push(a);
  }

  // 2. どの名前が重なるかを見る。 **両方の規則で見る** = 片方だけだと cdl 側の経路で落ちる
  const 形ごとの名前 = new Map<string, Set<string>>();
  const 位置 = new Map<string, number>();
  残す.forEach((a, i) => 位置.set(a.name, i));
  // **動きを書いた図では cdl の逃げ道を通らない** (Round 4 の指摘)。 動きがあると組み立てが
  // 別経路 (`compileGenericWithAnimate` / `compileSequenceWithAnimate`) に切り替わり、 id は
  // dragon 側の規則で作られる (実測 = `😀` は 枠 `n` / `lane-n` になり、 位置を使わない)。
  //
  // 逃げ先を鍵に入れたままにすると、 その経路で **重なっていない図の id を変える**。
  // dragon 側の規則で作る分は、 1 つ目の鍵 (`slugify`) が既に見ている。
  const 動きを書いた = (doc.animate?.phases.length ?? 0) > 0;
  const 逃げ先の頭 = 動きを書いた ? [] : 空の形の逃げ先[doc.type];
  for (const a of 残す) {
    for (const 形 of idになる形(a.name, 位置.get(a.name), 逃げ先の頭)) {
      const 群 = 形ごとの名前.get(形) ?? new Set<string>();
      群.add(a.name);
      形ごとの名前.set(形, 群);
    }
  }
  const 重なる = (name: string): boolean =>
    idになる形(name, 位置.get(name), 逃げ先の頭).some(
      (形) => (形ごとの名前.get(形)?.size ?? 0) > 1,
    );

  // **見本 (`parts`) を重ねた登場人物は作り替えない**。 見本の中身は `別名__元の id` の形で
  // 名前空間を持ち、 別名は名前から作るため、 作り替えると見本の id が総入れ替えになる。
  //
  // ただし **重なりの判定には数える** (Round 1 の指摘)。 数えないと、 素の登場人物と見本が
  // 同じ id の仮置きを共有し、 見本を片付ける時に素の登場人物の箱まで消える。
  const 作り替える = 残す.filter((a) => a.partId === undefined && 重なる(a.name));

  // 3. 名前から決まる尾を付ける。 **できあがる id が一意になるまで見る**
  //
  // 尾は元の名前だけから決まる = 並べ替えても同じ id になる。 それでも重なる時 (尾そのものが
  // 重なる形) は、 名前を並べ替えた順で番号を足す = ここも書き順に依らない
  const 使う形 = new Set<string>();
  for (const a of 残す) {
    if (作り替える.some((b) => b.name === a.name)) continue;
    for (const 形 of idになる形(a.name)) 使う形.add(形);
  }
  const 新しい名前 = new Map<string, string>();
  // 名前で並べてから配る = 書いた順に依らない
  for (const a of [...作り替える].sort((x, y) =>
    x.name < y.name ? -1 : x.name > y.name ? 1 : 0,
  )) {
    const 尾 = 名前の尾(a.name);
    // **id の長さの上限のぶん、 元の名前を先に切る** (Round 1 の指摘)。 切らないと尾が
    // 64 字で落ちて、 同じ頭を持つ長い名前どうしが元のまま重なる
    const 余地 = ID_MAX - (尾.length + 1);
    const 基底 = a.name.slice(0, 余地);
    let 候補 = `${基底} ${尾}`;
    let n = 0;
    while (idになる形(候補).some((形) => 使う形.has(形))) {
      n += 1;
      候補 = `${基底.slice(0, 余地 - String(n).length)} ${尾}${n}`;
    }
    for (const 形 of idになる形(候補)) 使う形.add(形);
    新しい名前.set(a.name, 候補);
    元の名前.set(候補, a.name);
  }

  if (新しい名前.size === 0 && 残す.length === doc.actors.length) return { doc, 元の名前 };

  const 直す = (名: string): string => 新しい名前.get(名) ?? 名;
  const 次: DslDocument = {
    ...doc,
    actors: 残す.map((a) => (新しい名前.has(a.name) ? { ...a, name: 直す(a.name) } : a)),
    flow: doc.flow.map((s) => {
      const from = 直す(s.from);
      const to = 直す(s.to);
      return from === s.from && to === s.to ? s : { ...s, from, to };
    }),
    events: doc.events?.map((event) => {
      const target = event.target;
      if (target.kind === "node") {
        const name = 直す(target.name);
        return name === target.name ? event : { ...event, target: { ...target, name } };
      }
      if (target.kind === "edge") {
        const from = 直す(target.from);
        const to = 直す(target.to);
        return from === target.from && to === target.to
          ? event
          : { ...event, target: { ...target, from, to } };
      }
      // sequence 系の縦列は登場人物から作るため、同じ名前の読み替えが必要。
      if (target.kind === "lane" && (doc.type === "sequence" || doc.type === "solidity")) {
        const name = 直す(target.name);
        return name === target.name ? event : { ...event, target: { ...target, name } };
      }
      return event;
    }),
  };
  // 光らせる指定と位置の基準も名前で書くので、 同じ表で直す
  if (次.animate) {
    次.animate = {
      ...次.animate,
      phases: 次.animate.phases.map((ph) =>
        ph.highlight ? { ...ph, highlight: ph.highlight.map((h) => 直す(h)) } : ph,
      ),
    };
  }
  次.actors = 次.actors.map((a) =>
    a.posRel ? { ...a, posRel: { ...a.posRel, anchor: 直す(a.posRel.anchor) } } : a,
  );
  return { doc: 次, 元の名前 };
}

/**
 * 作り替えた名前を持つ箱と枠を控える (#1220)。
 *
 * **組み立て直後に控える** (Round 1 の指摘)。 出口で題の文字だけを見て戻すと、 後から足された
 * 見本の中の箱がたまたま同じ題を持っていた時に、 その表示まで書き換えてしまう。
 */
function collectRenamedTargets(
  diagram: CdlDiagram,
  元の名前: Map<string, string>,
): { 箱: Set<string>; 枠: Set<string> } {
  const 箱 = new Set<string>();
  const 枠 = new Set<string>();
  if (元の名前.size === 0) return { 箱, 枠 };
  for (const n of diagram.nodes) if (元の名前.has(n.title)) 箱.add(n.id);
  for (const l of diagram.lanes) if (l.label !== undefined && 元の名前.has(l.label)) 枠.add(l.id);
  return { 箱, 枠 };
}

/**
 * 作り替えた名前を、 図の表示だけ元に戻す (#1220)。
 *
 * 戻すのは題と名札だけ。 id は作り替えたまま = 分けるために作り替えたので、 戻すと元の
 * 重なりに帰る。
 */
function restoreActorNames(
  diagram: CdlDiagram,
  元の名前: Map<string, string>,
  対象: { 箱: Set<string>; 枠: Set<string> },
): void {
  if (元の名前.size === 0) return;
  for (const n of diagram.nodes) {
    if (!対象.箱.has(n.id)) continue;
    const 元 = 元の名前.get(n.title);
    if (元 !== undefined) n.title = 元;
  }
  for (const l of diagram.lanes) {
    if (!対象.枠.has(l.id) || l.label === undefined) continue;
    const 元 = 元の名前.get(l.label);
    if (元 !== undefined) l.label = 元;
  }
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
  const 見せる数 = 8;
  const 名前一覧 = doc.actors
    .slice(0, 見せる数)
    .map((a) => truncateForMessage(a.name))
    .join(" / ");
  const 残り = doc.actors.length - 見せる数;
  const hint =
    doc.actors.length > 0
      ? `actors に書いた名前で指す (${名前一覧}${残り > 0 ? ` ほか ${残り} 件` : ""})`
      : "actors に登場人物を書く";
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

  // 矢印の両端は **流れと同じ表で名前へ揃えてから** 照合する (#1209 Round 2)。
  //
  // 流れは入口で名前へ揃えている (`canonicalizeFlowActors`) 一方、 光らせる指定は生のまま
  // 来る。 揃えずに比べると、 slug で書いた矢印 (`api-gateway -> db`) が実際は光るのに
  // 「見つかりません」 と誤報する (実測)
  const 名前へ = actorRefTable(doc);
  const 揃える = (ref: string): string => 名前へ.get(ref) ?? ref;

  for (const phase of doc.animate.phases) {
    for (const raw of phase.highlight ?? []) {
      const entry = parseFocusEntry(raw, names);
      const found =
        entry.kind === "edge"
          ? (steps.get(揃える(entry.from))?.has(揃える(entry.to)) ?? false)
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
function applyLayoutOffsets(
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
function applyCanvasPivotPositions(
  diagram: CdlDiagram,
  doc: DslDocument,
  // 下見 (`probe`) の呼出では渡さない = 同じ知らせが 2 度出る
  onNotice?: (notice: CompileNotice) => void,
): void {
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

/**
 * catalog からパーツ 1 個の図を引く。
 *
 * `Object.hasOwn` で引く。 素の添字だと `__proto__` 等の既定の持ち物が引けてしまう
 * (catalog は呼出側が渡す untrusted な値)。
 *
 * **測れない図は「無い」 として扱う** (#1015)。 大きさを測れないまま取り込むと、既定の
 * 400x200 の枠を確保した場所に中身が全て展開される。 上限を置いた目的 (大きすぎる入力で
 * 止まらないようにする) も達成されない。
 */
function lookupPart(
  partsCatalog: Record<string, CdlDiagram>,
  partId: string | undefined,
): CdlDiagram | undefined {
  const found = lookupPartRaw(partsCatalog, partId);
  if (found === undefined) return undefined;
  return partIsMeasurable(found) ? found : undefined;
}

/** catalog を引くところだけ。 測れるかは見ない。 */
function lookupPartRaw(
  partsCatalog: Record<string, CdlDiagram>,
  partId: string | undefined,
): CdlDiagram | undefined {
  if (typeof partId !== "string" || partId.length === 0) return undefined;
  if (Object.hasOwn(partsCatalog, partId)) return partsCatalog[partId];
  if (Object.hasOwn(partsCatalog, `parts-${partId}`)) return partsCatalog[`parts-${partId}`];
  return undefined;
}

/**
 * この図を取り込んでよいか (#1015)。
 *
 * 見るのは **要素数が上限 (`MAX_INPUT_ELEMENTS`) を超えていないこと** だけ。
 * 超えた図を取り込むと、既定の 400x200 の枠を確保した場所に中身が全て展開される。
 * 上限を置いた意図 (大きすぎる入力で止まらないようにする) も達成されない。
 *
 * **配置計算が通るかは見ない**。 取り込みは lane を張り替えるため、単体では配置計算が
 * 通らない図でも取り込みは成功する (実測 = 存在しない lane を指す箱を持つ見本が、
 * 取り込み後は正しい lane に載った)。 配置計算で弾くと、動いている本文が描けなくなる。
 */
export function partIsMeasurable(part: CdlDiagram): boolean {
  return countDiagramElements(part) <= MAX_INPUT_ELEMENTS;
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
 * 倍率の上限 (#1020)。
 *
 * 図枠は数百 world 単位なので、1000 倍で数十万になる。 これを超える倍率は画面上で意味を持たず、
 * 掛けた先が非有限になる危険だけが残る。
 */
export const MAX_PART_SCALE = 1000;

/**
 * 本文に書かれた倍率を、描ける値に直す (#1020 / #1026)。
 *
 * 記法は `倍率: -2` も `倍率: 0` も、桁が溢れて `Infinity` になる値も書ける。 置き場所と
 * 描画で別々に直すと、同じ見本が「置き場所は等倍・画面では消える」 状態になる (実測 =
 * `scale: 0` が等倍の場所を占めるのに画面には出なかった)。 読んだ時点で直す。
 *
 * **画面側と組み立て側の両方から呼ぶ**。 別々に持つと、同じ本文が経路で別の絵になる (#1026)。
 */
export function normalizePartScale(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(value, MAX_PART_SCALE);
}

/**
 * `大きさ:` と `倍率:` を合成した最終の伸縮率 (#1026)。
 *
 * **上限は合成した後に 1 度だけ掛ける**。 率ごとに掛けると、`大きさ:` 由来 1000 倍と
 * `倍率: 2` で合わせて 2000 倍になり、1 度だけ掛ける経路 (1000 倍) と食い違う (実測)。
 *
 * 基準は `大きさ:` と同じ物差し (縦列の外接矩形と段の送り幅)。 図枠を基準にすると、
 * 図枠と外接矩形の差のぶんだけ余分に掛かる (実測 = 3 倍と書いて 4.0875 倍になった)。
 *
 * 画面側 (重ねて描く時の `transform`) と組み立て側 (取り込む時の伸縮) が同じ値を使う。
 */
export function partScaleFactor(
  part: CdlDiagram,
  posW: number | undefined,
  posH: number | undefined,
  scale: number | undefined,
): { x: number; y: number } {
  const base = partScaleBase(part);
  const k = scale === undefined ? 1 : normalizePartScale(scale);
  const rx = posW !== undefined && posW > 0 ? posW / base.w : 1;
  const ry = posH !== undefined && posH > 0 ? posH / base.h : 1;
  return { x: normalizePartScale(rx * k), y: normalizePartScale(ry * k) };
}

/**
 * 見本 1 件の狙いの大きさ (#1026)。
 *
 * 合成した率を基準に掛けて返す。 取り込み側はこの値から自分で率を出し直すため、
 * ここで上限を掛けておかないと「見積りは上限どまり・実体は青天井」 になる (実測 =
 * 見積り 1000 倍に対して実体 10000 倍)。
 *
 * 何も書かれていない辺は「狙いなし」 のまま返す。 基準の値を入れると、取り込み側が
 * 自前で測る外接矩形との差だけ伸縮が掛かってしまう。
 */
export function partTargetSize(
  part: CdlDiagram,
  posW: number | undefined,
  posH: number | undefined,
  scale: number | undefined,
): { w: number | undefined; h: number | undefined } {
  if (posW === undefined && posH === undefined && scale === undefined) {
    return { w: undefined, h: undefined };
  }
  const base = partScaleBase(part);
  const f = partScaleFactor(part, posW, posH, scale);
  return {
    w: posW === undefined && scale === undefined ? undefined : base.w * f.x,
    h: posH === undefined && scale === undefined ? undefined : base.h * f.y,
  };
}

/**
 * `大きさ:` と `倍率:` が掛かる時の基準の大きさ (#1026)。
 *
 * 横は縦列の外接矩形、縦は段の送り幅の合計。 **図枠 (`partRenderSize`) ではない**。
 * 図枠は余白を含むため、これを基準にすると書いた倍率より大きく掛かる。
 *
 * `partTargetScale` と `partTargetSize` が同じ物差しを使うことで、
 * `partTargetScale(part, base.w * k, base.h * k)` が丁度 `k` 倍を返す関係が保たれる。
 */
function partScaleBase(part: CdlDiagram): { w: number; h: number } {
  const lanes = Array.isArray(part.lanes) ? part.lanes : [];
  const nodes = Array.isArray(part.nodes) ? part.nodes : [];
  const lefts: number[] = [];
  const rights: number[] = [];
  for (const l of lanes) {
    const lx = typeof l.x === "number" && Number.isFinite(l.x) ? l.x : 0;
    const lw = positiveOr(l.width, 400);
    lefts.push(lx);
    rights.push(lx + lw);
  }
  const stacks = nodes.map((n) =>
    typeof n.stack === "number" && Number.isFinite(n.stack) ? n.stack : 0,
  );
  return {
    w: positiveOr(maxOf(rights, 400) - minOf(lefts, 0), 400),
    h: Math.max(1, (maxOf(stacks, 0) - minOf(stacks, 0) + 1) * PART_STACK_PITCH),
  };
}

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

  // 倍率を書かない場合の合成率。 上限の掛け方を 1 箇所に閉じるため同じ関数を通す
  return partScaleFactor(part, targetW, targetH, undefined);
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
  // **辺ごとに割ってから掛ける**。 面積を先に出すと桁の大きい図で溢れ、判定が反転する
  // (実測 = 箱 1.7e305 x 1e4 / 図枠 1.7e308 x 1e4 は比 0.001 で「描かない」 が正しいのに、
  // 面積を先に出すと Infinity / Infinity = NaN になって「描く」 に倒れた)。
  //
  // それでも出せない時は「持っている」 側に倒す。 弾く側に倒すと、
  // 測れないだけの見本が使えなくなる
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
 * 既存の図が縦に何段ぶんを占めるかの目安 (#1481)。
 *
 * **箱の数では数えない**。 数で数えると、図を丸ごと 1 つの箱で描く種別が 1 段に潰れる。
 * 順序図は `#1466` で 1 枚の板になり、高さ 432 の箱 1 つになった = 1 段 (280) と見積もられ、
 * その下に置いたパーツが板に 31px 重なっていた (実測)。
 *
 * 大きさを自分で持つ箱は、その高さから段数を出す。 持たない箱は今までどおり 1 段と数えるので、
 * 高さを書かない図の並び方は変わらない。
 */
export function partsBaseRows(nodes: ReadonlyArray<{ h?: number }>): number {
  return nodes.reduce((acc, n) => acc + Math.max(1, Math.ceil(positiveOr(n.h, 0) / STACK_PITCH)), 0);
}

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
 * @param baseRows 既存の図が占める段数の目安 (`partsBaseRows`)。 図の下から並べ始めるために使う
 */
export function partsGridCenters(
  baseRows: number,
  items: ReadonlyArray<{ id: string; w: number; h: number }>,
): Map<string, { cx: number; cy: number }> {
  const out = new Map<string, { cx: number; cy: number }>();
  if (items.length === 0) return out;
  // 公開している関数なので、 呼出側が渡す値を入口で閉じる。 数でない箱の数や桁溢れを
  // そのまま計算に入れると、 描けない座標を返すことになる
  const safeCount = Number.isSafeInteger(baseRows) && baseRows >= 0 ? baseRows : 0;
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
 * 取り込んでよい見本の名前 (#1015)。
 *
 * 1 件ずつが上限以下でも、同じ見本を別名で何度も参照すれば合計は上限を超える
 * (実測 = 1,001 要素の見本を 3 名で参照して最終図が 3,005 要素になった)。
 * 本体の分を引いた残りを予算とし、本文に書かれた順に配る。
 *
 * 順に配るのは、どれを落とすかを決める規則が要るため。 先に書いたものを優先する形なら、
 * 書いた人から見て「後ろが落ちる」 と読める。
 */
function partsBudget(
  target: CdlDiagram,
  partsActors: ReadonlyArray<{ name: string; partId?: string }>,
  partsCatalog: Record<string, CdlDiagram>,
): Set<number> {
  // 名前ではなく **書かれた順番** で覚える。 名前で覚えると、同じ名前を 2 度書いた時に
  // 先の 1 件が入れた名前で後の 1 件まで採用扱いになる
  const accepted = new Set<number>();
  let used = countDiagramElements(target);
  partsActors.forEach((a, i) => {
    const part = lookupPart(partsCatalog, a.partId);
    if (part === undefined) return;
    const cost = countDiagramElements(part);
    if (used + cost > MAX_INPUT_ELEMENTS) return;
    used += cost;
    accepted.add(i);
  });
  return accepted;
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
  /** 取り込む見本の書かれた順番。 渡さなければ全部を並べる */
  accepted?: ReadonlySet<number>,
  /** 順番の元になった一覧 (本文に書かれた順) */
  acceptedFrom?: ReadonlyArray<{ name: string }>,
): Map<string, { cx: number; cy: number }> {
  const partsActors = doc.actors.filter((a) => a.partId !== undefined);
  // 格子に並ぶのは座標を 1 つも書かず相対でも書かなかった分だけ。
  //
  // merge 側は「縦横どちらも書かなかった時」 に格子へ落とす。 条件が食い違うと、 片方だけ
  // 書いたパーツが格子の枠を 1 つ消費して後続がずれる (実測 = 後続の中心が 200 から 720 に動いた)
  //
  // 縦列に置く部品も外す (#1980)。 格子の枠を使うと、縦列へ動かした後に後続の部品との間に
  // 空きが残る。 相対の位置を解く側 (`partBoxes`) も同じ関数を通るので、基準の位置は揃う
  const 縦列の部品 = 縦列に置く部品(target, doc).縦列;
  const autoActors = partsActors.filter(
    (a) =>
      a.posX === undefined &&
      a.posY === undefined &&
      a.posRel === undefined &&
      !縦列の部品.has(a.name),
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
  // 取り込まれない見本は格子の枠を使わない (#1015)。 枠を使うと、落とした見本の分だけ
  // 後続がずれる (実測 = 隣の見本の左端が 60 から 725 に動いた)
  const acceptedNames =
    accepted === undefined || acceptedFrom === undefined
      ? undefined
      : new Set(acceptedFrom.filter((_, i) => accepted.has(i)).map((a) => a.name));
  const placedActors = autoActors.filter(
    (a) =>
      lookupPart(partsCatalog, a.partId) !== undefined &&
      (acceptedNames === undefined || acceptedNames.has(a.name)),
  );
  const extents = new Map<string, { w: number; h: number; dx: number; dy: number }>();
  for (const a of placedActors) {
    const part = lookupPart(partsCatalog, a.partId)!;
    // 格子は図枠で決める。 画面側も図枠をそのまま置くので、 同じ物差しで並べれば
    // 2 経路の置き場所が揃う (#937)
    const t = partTargetSize(part, a.posW, a.posH, a.scale);
    extents.set(a.name, partFrameExtent(part, t.w, t.h));
  }
  const centers = partsGridCenters(
    partsBaseRows(baseNodes),
    placedActors.map((a) => ({ id: a.name, ...extents.get(a.name)! })),
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
    if (part) {
      const t = partTargetSize(part, a.posW, a.posH, a.scale);
      out.set(a.name, partExtent(part, t.w, t.h));
    }
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
    const t = partTargetSize(part, a.posW, a.posH, a.scale);
    const size = partExtent(part, t.w, t.h);
    const placed =
      a.posX !== undefined && a.posY !== undefined ? { cx: a.posX, cy: a.posY } : grid.get(a.name);
    // 相対で書いた分はここでは決まらない (解決側が後で埋める)
    if (!placed) continue;
    // 渡す座標は段の中心。 矩形の中心はそこからずれる
    out.set(a.name, { cx: placed.cx + size.dx, cy: placed.cy + size.dy, w: size.w, h: size.h });
  }
  return out;
}

/**
 * 部品へ引いた矢印を、部品の図の要素へ繋ぎ直す手順を作る (#1979)。
 *
 * 部品を置くと組み立ては仮の箱を消し、部品の図の要素を `{名前}__{要素の id}` で足す。 仮の箱へ
 * 引いた矢印は繋ぎ先を失うため、以前は知らせも無く消えていた。
 *
 * | 部品 | 繋ぎ先 |
 * |---|---|
 * | 要素 1 つ | その要素 |
 * | 要素 2 つ以上 | 矢印の行に書いた `fromPartNode` / `toPartNode` の要素 |
 *
 * **要素が 2 つ以上ある部品で 1 つを自動で選ばない**。 カタログの部品は外枠を持たず同格の要素が並ぶ
 * (信号の 3 灯、星 5 つ、棒 5 本) ため、最初の要素や一番大きい要素を選ぶと「その 1 つだけ」 を
 * 指す矢印に見える。 名指しが無い時、名指しした要素が無い時、部品を取り込まなかった時 (`part` が
 * `undefined`) は矢印を外し、矢印ごとに 1 件知らせる。
 *
 * **繋ぐのは書いた矢印だけ** = 矢印を書いた行の端の名前が、この部品の名前と一致する時。 静止した
 * `type: flow` は行を書かなくても箱を並び順で繋ぐが、その矢印は書き手が部品へ引いたものではないので
 * 従来どおり知らせずに外す。 繋ぐと、部品を本文から抜いて図の上に重ねる編集画面 (行が部品を指す
 * 本文だけを抜かずに描く) と絵が食い違う (実測 = 箱と部品を並べただけの本文に、組み立て側だけ矢印が出た)。
 */
function 部品の要素へ繋ぐ(
  部品の名前: string,
  partId: string,
  part: CdlDiagram | undefined,
  edgeSteps: Map<string, DslStep> | undefined,
  onNotice: ((notice: CompileNotice) => void) | undefined,
): (edge: CdlEdge, 端: { from: boolean; to: boolean }) => CdlEdge | undefined {
  const 要素 = (part?.nodes ?? []).map((n) => n.id);
  const 見せる数 = 8;
  const 要素の一覧 = `${要素.slice(0, 見せる数).map(truncateForMessage).join(", ")}${要素.length > 見せる数 ? ` ほか ${要素.length - 見せる数} 件` : ""}`;
  return (edge, 端) => {
    const s = edgeSteps?.get(edge.id);
    const 繋いだ: CdlEdge = { ...edge };
    for (const 側 of ["from", "to"] as const) {
      if (!端[側]) continue;
      // 書いていない矢印 (並び順で作られた矢印) は知らせずに外す
      if (s === undefined || s[側] !== 部品の名前) return undefined;
      const 欄 = 側 === "from" ? "fromPartNode" : "toPartNode";
      const 名指し = s[欄];
      let 理由: { message: string; hint: string } | undefined;
      if (part === undefined) {
        理由 = {
          message: "を図に取り込まなかった",
          hint: "部品が図に入らないため、矢印の端にできません",
        };
      } else if (名指し !== undefined) {
        if (要素.includes(名指し)) 繋いだ[側] = `${部品の名前}__${名指し}`;
        else
          理由 = {
            message: `の中に ${欄} に書いた "${truncateForMessage(名指し)}" という要素が無い`,
            hint: `この部品の要素 = ${要素の一覧}`,
          };
      } else if (要素.length === 1) {
        繋いだ[側] = `${部品の名前}__${要素[0]}`;
      } else {
        理由 =
          要素.length === 0
            ? { message: "の中に繋げる要素が無い", hint: "この部品は要素を持たないため、矢印の端にできません" }
            : {
                message: "の中のどの要素に繋ぐかが決まらない",
                hint: `要素が 2 つ以上ある部品は、矢印に ${欄}: <要素の id> を書いて繋ぐ要素を選ぶ (要素 = ${要素の一覧})`,
              };
      }
      if (理由 === undefined) continue;
      const 矢印 = `"${truncateForMessage(s.from)}" から "${truncateForMessage(s.to)}" への矢印`;
      onNotice?.({
        kind: "part-edge-dropped",
        actor: 部品の名前,
        line: s.pos.line,
        message: `${矢印}は、"${truncateForMessage(部品の名前)}" (${truncateForMessage(partId)}) ${理由.message}ため外しました`,
        hint: 理由.hint,
      });
      return undefined;
    }
    return 繋いだ;
  };
}

/**
 * 矢印に書いた部品の要素の名指し (`fromPartNode` / `toPartNode`) が効かないことを知らせる (#1979)。
 *
 * 名指しは部品の端でだけ読む。 部品でない箱の端に書くと値はどこにも届かず、黙って捨てると
 * 「書いたのに繋ぎ先が変わらない」 が手掛かりなしで起きる。
 *
 * 順序図 (`sequence` / `solidity`) は板の言づてが縦の線に届き、部品の要素へは繋がないため、
 * 部品の端に書いても効かない。 部品の一覧に無い部品は組み立てが部品を引いてから知らせる。
 */
function reportPartNodeNotHonored(
  doc: DslDocument,
  onNotice?: (notice: CompileNotice) => void,
): void {
  if (!onNotice) return;
  const 順序図 = doc.type === "sequence" || doc.type === "solidity";
  const 部品 = new Set(doc.actors.filter((a) => a.partId !== undefined).map((a) => a.name));
  const 居る = new Set(doc.actors.map((a) => a.name));
  for (const s of doc.flow) {
    for (const [側, 欄] of [
      ["from", "fromPartNode"],
      ["to", "toPartNode"],
    ] as const) {
      const 値 = s[欄];
      if (値 === undefined) continue;
      const 名 = s[側];
      // 居ない名前は `flow-actor-missing` が知らせる
      if (!居る.has(名)) continue;
      if (!順序図 && 部品.has(名)) continue;
      onNotice({
        kind: "part-node-ignored",
        actor: 名,
        line: s.pos.line,
        message: 順序図
          ? `順序図の言づては "${truncateForMessage(名)}" の縦の線に届くため、${欄} に書いた "${truncateForMessage(値)}" は効きません`
          : `"${truncateForMessage(名)}" は部品ではないため、${欄} に書いた "${truncateForMessage(値)}" は効きません`,
        hint: 順序図
          ? "部品の中の要素へ矢印を繋ぐのは、矢印を箱の間に引く図種 (flow / swimlane など)"
          : "部品の中の要素の名指しは、kind に部品の名前を書いた箱の端にだけ効く",
      });
    }
  }
}

/**
 * 部品のために作られた仮の箱の id かを見分ける。
 *
 * 仮の箱の id は部品の名前の slug か、それを頭に持つ形 (`a-header` / `s0-a`) で作られる。
 * 仮の箱を消す側 (`cleanupPlaceholderActor`) と、部品を置く縦列を探す側 (`縦列に置く部品`) が
 * 同じ判定を使う = 別々に持つと、消した箱と縦列を探した箱が食い違う。
 *
 * 素の登場人物が持つ id は仮の箱に数えない (#1466)。 名前が重なった素の登場人物は
 * `重なりを解く` 側で `a-c40bf6` のような id に作り替えられるため、同じ頭で始まり
 * **本体の箱まで巻き込む** (実測で `flow` / `swimlane` / `er` / `state` / `topology` /
 * `class` / `c4` の 7 図種すべてで素の箱が黙って消えていた)。
 *
 * 名前の頭が自分と重なる別の登場人物 (`設備` に対する `設備-予備`) の仮の箱も数えない (#1980)。
 * 数えると `設備` の仮の箱が 2 本の縦列にまたがって見え、`設備` を消す時に `設備-予備` の
 * 仮の箱と縦列まで消す。 部品同士でも起き、後から組み込む `設備-予備` が消えた縦列を指して
 * 配置が止まっていた (`cdl layout: node "設備-予備__ind" の lane "設備-予備" が定義されていない`)。
 */
function 仮の箱のidか(doc: DslDocument, name: string): (id: string) => boolean {
  const aliasSlug = slugify(name);
  const 素の箱のid = new Set(
    doc.actors.filter((x) => x.partId === undefined).map((x) => slugify(x.name)),
  );
  const 頭が重なるid = [
    ...new Set(
      doc.actors
        .filter((x) => x.name !== name)
        .map((x) => slugify(x.name))
        .filter((s) => s.startsWith(`${aliasSlug}-`) || s.endsWith(`-${aliasSlug}`)),
    ),
  ];
  // sequence step anchor = `s{N}-{slug}` pattern
  const 自分の形か = (id: string, slug: string): boolean =>
    id === slug || id.startsWith(`${slug}-`) || (/^s\d+-/.test(id) && id.endsWith(`-${slug}`));
  return (id: string): boolean => {
    if (素の箱のid.has(id)) return false;
    if (頭が重なるid.some((s) => 自分の形か(id, s))) return false;
    return 自分の形か(id, aliasSlug);
  };
}

/**
 * 縦列の中に置く部品と、その縦列の id (#1980)。
 *
 * 位置を書かない部品は格子に並ぶが、格子は縦列の位置を読まない。 部品が縦列に属する図では、
 * 部品の要素だけが縦列に属し、描く位置は別の縦列の上になっていた (実測 = 縦列 b 480〜890 に
 * 属する部品が 60〜420 に描かれた)。
 *
 * 縦列に置くのは、位置 (`posX` / `posY` / `位置:`) を書かない部品のうち次のどちらかに当たるもの。
 *
 * | 形 | 縦列 |
 * |---|---|
 * | `lane:` に図にある縦列を書いた | 書いた縦列 |
 * | 仮の箱が自分だけの縦列を持つ (`swimlane` / `state` / `er` / `class` の作り方) | その縦列 |
 *
 * **自分だけの縦列は図の形で見分ける**。 図種の名前で分けると、縦列の作り方を変えた図種で
 * 黙って外れる。 仮の箱が入った縦列に他の登場人物の箱が無く、図に縦列が 2 本以上ある時に
 * 限る = 全員が 1 本の縦列を共有する図種 (`flow` / `topology` / `c4`) は格子のまま残る。
 * 仮の箱が作られない形 (流れに現れない `swimlane` の登場人物) は、名札が部品の名前の空の縦列で引く。
 *
 * **順序図 (`sequence` / `solidity`) は対象にしない**。 1 枚の板で描き、縦列を持たない (#1466)。
 *
 * **他の箱の位置の基準になっている部品は縦列に置かない**。 相対の位置 (`位置: 印 の右 200`) は
 * 組み立ての前に格子の位置を基準に解くため、基準の部品だけを縦列へ動かすと書いた位置関係が
 * 崩れる。 外した部品は `基準のため外した` に入れ、呼出側が知らせる。
 */
function 縦列に置く部品(
  target: CdlDiagram,
  doc: DslDocument,
): { 縦列: Map<string, string>; 基準のため外した: Map<string, string> } {
  const 縦列 = new Map<string, string>();
  const 基準のため外した = new Map<string, string>();
  if (doc.type === "sequence" || doc.type === "solidity") return { 縦列, 基準のため外した };
  const 基準の名前 = new Set(
    doc.actors.map((a) => a.posRel?.anchor).filter((n): n is string => n !== undefined),
  );
  const 縦列のid = new Set(target.lanes.map((l) => l.id));
  for (const a of doc.actors) {
    if (a.partId === undefined) continue;
    // 同じ名前を 2 度書いた時は先の 1 件を使う (組み立て側の他の判定と同じ)
    if (縦列.has(a.name) || 基準のため外した.has(a.name)) continue;
    if (a.posX !== undefined || a.posY !== undefined || a.posRel !== undefined) continue;
    const 置く縦列 = 部品の縦列(target, doc, a, 縦列のid);
    if (置く縦列 === undefined) continue;
    if (基準の名前.has(a.name)) 基準のため外した.set(a.name, 置く縦列);
    else 縦列.set(a.name, 置く縦列);
  }
  return { 縦列, 基準のため外した };
}

/** 部品を置く縦列。 書いた縦列か、仮の箱が自分だけで使う縦列。 どちらも無ければ `undefined` */
function 部品の縦列(
  target: CdlDiagram,
  doc: DslDocument,
  a: DslActor,
  縦列のid: ReadonlySet<string>,
): string | undefined {
  if (a.lane !== undefined) return 縦列のid.has(a.lane) ? a.lane : undefined;
  if (target.lanes.length < 2) return undefined;
  const 仮の箱か = 仮の箱のidか(doc, a.name);
  const 仮の箱の縦列 = new Set(target.nodes.filter((n) => 仮の箱か(n.id)).map((n) => n.lane));
  // 2 本にまたがる入力は見つかっていない (実測 = 縦列に置く 7 図種とも仮の箱は登場人物ごとに 1 つ。
  // 名前の頭が重なる登場人物の箱は `仮の箱のidか` が外す)。 またがった時にどちらかの縦列を選ぶと
  // 他の縦列を部品が占めるため、格子に残す
  if (仮の箱の縦列.size > 1) return undefined;
  const [入っていた] = [...仮の箱の縦列];
  const 候補 =
    入っていた ?? target.lanes.find((l) => l.label === a.name && !target.nodes.some((n) => n.lane === l.id))?.id;
  if (候補 === undefined) return undefined;
  // 他の登場人物の箱が同じ縦列に居れば、自分だけの縦列ではない
  return target.nodes.some((n) => n.lane === 候補 && !仮の箱か(n.id)) ? undefined : 候補;
}

/**
 * パーツ用に作られた仮の箱 / 線 / 列を掃除する (#1015 で helper 化)。
 *
 * 取り込む時だけでなく **落とす時にも呼ぶ**。 落とした時に残すと、格子から外した後続の見本と
 * 重なる (実測で 64,000 の重なりが出た)。
 */
function cleanupPlaceholderActor(
  target: CdlDiagram,
  doc: DslDocument,
  a: { name: string; lane?: string },
  /**
   * 仮の箱に繋がっていた矢印を、部品の図の要素へ繋ぎ直す (#1979)。 仮の箱の側の端を受け取り、
   * 繋ぎ直した矢印を返す。 `undefined` を返した矢印は外す。 渡さなければ全て外す
   */
  繋ぎ直す?: (edge: CdlEdge, 端: { from: boolean; to: boolean }) => CdlEdge | undefined,
): void {
  const aliasSlug = slugify(a.name);
  const ownedLaneIds = new Set<string>();
  if (doc.type === "sequence" || doc.type === "solidity") {
    for (const l of target.lanes) {
      // 明示 lane mapping (a.lane) 先は part の張替え先で actor 専用 lane ではないため除外
      if (a.lane !== undefined && l.id === a.lane) continue;
      if (l.label === a.name) ownedLaneIds.add(l.id);
    }
  }
  const ownedNodeIds = new Set<string>();
  for (const n of target.nodes) {
    if (ownedLaneIds.has(n.lane)) ownedNodeIds.add(n.id);
  }
  // actor 専用 lane を引き当てられない経路 (flow / topology 等の共有 lane preset) は従来どおり dragon
  // slug の prefix match に fallback する。 これらは 1 actor = 1 node (id = slug) の生成規則。
  const matchesAliasSlug = 仮の箱のidか(doc, a.name);
  const relatedToActor = (id: string): boolean =>
    ownedLaneIds.size > 0 ? ownedNodeIds.has(id) : matchesAliasSlug(id);
  // 仮の箱が入っていた縦列。 仮の箱を消して空になった縦列は下で消す (#1973)
  const 仮の箱の縦列 = new Set(target.nodes.filter((n) => relatedToActor(n.id)).map((n) => n.lane));
  target.nodes = target.nodes.filter((n) => !relatedToActor(n.id));
  // 仮の箱に繋がっていた矢印は、部品の要素へ繋ぎ直せたものだけ残す (#1979)。 以前は全て消しており、
  // 部品へ引いた矢印が知らせも無く図から消えていた。 繋ぎ直した矢印は id を変えないので、段の
  // 点灯 (`activate`) からも外さない。 外した矢印の id は `activate` に残ると存在しない参照になるため回収する
  const removedEdgeIds = new Set<string>();
  const 残す矢印: CdlEdge[] = [];
  for (const e of target.edges) {
    const 端 = { from: relatedToActor(e.from), to: relatedToActor(e.to) };
    if (!端.from && !端.to) {
      残す矢印.push(e);
      continue;
    }
    const 繋いだ = 繋ぎ直す?.(e, 端);
    if (繋いだ) 残す矢印.push(繋いだ);
    else removedEdgeIds.add(e.id);
  }
  target.edges = 残す矢印;
  // lane も削除 = sequence preset は parts actor 用に lane (id = aliasSlug、 label = actor 名) を
  // 生成する。 node/edge だけ消して lane を残すと、 merge 後の part 側 lane (label = alias) と 2 本が
  // 同じ label を lane-label として描画し二重表示になる (actor ラベル二重表示 bug の root cause)。
  //
  // 削除は seq-like preset (sequence / solidity = compileSequence 経由) に限定する。 これらは
  // 1 actor = 1 lane (lane.label === a.name、 lane.id は actor 名の slug) の生成規則が成立し、
  // parts actor 用 lane を安全に削除できる。 他 preset (flow / topology / class / pie 等) は複数
  // actor が共有 lane (id = "main" 等) を参照するため、 一致 lane を消すと通常 actor の node が
  // 削除済 lane を参照する不正 diagram になる (cc-codex MAJOR 指摘)。
  //
  // leftover lane の特定は lane.label === a.name を第一に使う。 seq-like preset は非 animate 経路
  // (cdl preset の slugify) と animate 経路 (dragon の slugify) で lane.id の slug 規則が異なり
  // (`_`/全角の扱い等)、 aliasSlug (dragon slugify) と lane.id が不一致になる actor 名がある。 lane.label
  // は両経路とも a.name 生値なので slug 差の影響を受けず確実に一致する。 id === aliasSlug は
  // label 未設定 preset への fallback (exact match のみ、 prefix は false match risk のため付けない)。
  /*
   * **図種で分けない** (#1466)。 以前は順序図系だけを掃除していたが、順序図が板になって
   * 面ごとの縦列を作らなくなり、この分岐は誰も通らなくなった。 一方で縦列を作る他の図種
   * (`swimlane` 等) では見本の仮の縦列が空のまま残っていた (実測)。
   *
   * **中身が残っている縦列は消さない**。 1 本の縦列を全員で共有する図種 (`flow` / `topology`)
   * では、その縦列の名札がたまたま登場人物の名前と一致することがある。 消すと本体の箱が
   * 行き場を失う。
   */
  const 残る箱を持つ = new Set(target.nodes.map((n) => n.lane));
  target.lanes = target.lanes.filter((l) => {
    // 明示 lane mapping (a.lane) 先は part の張替え先なので保持する。
    if (a.lane !== undefined && l.id === a.lane) return true;
    if (残る箱を持つ.has(l.id)) return true;
    if (l.label === a.name) return false;
    if (l.id === aliasSlug) return false;
    // 図種が自動で作った縦列 (`flow` 等) に部品の箱しか無かった図では、仮の箱を消すと縦列が
    // 空のまま残る (実測 = 部品 1 つだけの図に中身の無い `flow` の縦列)。 書き手が `lanes:` に
    // 書いた縦列は、空でも書いたとおりに残す (#1973)
    if (仮の箱の縦列.has(l.id) && !Object.hasOwn(doc.lanes ?? {}, l.id)) return false;
    return true;
  });
  // 削除された node / edge を activate 参照している既存 phase の cleanup (node 削除と同じ判定経路
  // = 取りこぼすと存在しない id が activate に残り dangling 参照になる、 #873)
  for (const phase of target.phases) {
    phase.activate = phase.activate.filter((id) => !relatedToActor(id) && !removedEdgeIds.has(id));
  }
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
  derivedSourceLines?: Map<string, number[]>,
  /** 矢印の id から、その矢印を書いた行。 行に書いた要素の名指しを読む (#1979) */
  edgeSteps?: Map<string, DslStep>,
): CdlDiagram {
  const partsActors = doc.actors.filter((a) => a.partId !== undefined);
  if (partsActors.length === 0) return target;
  // 値と状態の名前に使う前置きを **書いた順に 1 度だけ** 決める (#1189)。 見本ごとに作ると
  // 同じ形に潰れた時の番号が揃わず、後から重ねた見本が先の名前空間を踏む
  const 値の前置き = 値の前置きを作る(partsActors.map((a) => a.name));
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
  // 取り込んでよい合計を先に決める (#1015)。 1 件ずつ上限以下でも、同じ見本を別名で何度も
  // 参照すれば合計は上限を超える (実測 = 1,001 要素の見本を 3 名で参照して 3,005 要素になった)。
  // 本体の分を引いた残りを予算として、順に配って超えた分を落とす。
  //
  // 格子より先に決める。 後にすると、落とす見本が格子の枠を消費して後続がずれる
  const budget = partsBudget(target, partsActors, partsCatalog);
  const gridCenters = partGridCenters(target, doc, partsCatalog, budget, partsActors);
  // 縦列の中に置く部品 (#1980)。 仮の箱を消す前に探す = 消した後は自分だけの縦列を見分けられない
  const { 縦列: 縦列の部品, 基準のため外した } = 縦列に置く部品(target, doc);
  const 縦列に置いた: 縦列に置いた部品[] = [];

  for (const [actorIndex, actor] of partsActors.entries()) {
    const partId = actor.partId;
    // codex-review CAR-1657 MAJOR fix (§ security) = partsCatalog は untrusted、 Object.hasOwn で
    // inherited property (`__proto__` 等) を除外する prototype pollution 対策。 `parts-` prefix 経路も
    // Object.hasOwn 経由で確認する。
    if (typeof partId !== "string" || partId.length === 0) continue;
    const found = lookupPartRaw(partsCatalog, partId);
    // 見つかっても大きすぎる図は取り込まない (#1015)。 黙って落とすと「書いたのに出ない」 に
    // なるため、見つからなかった時と分けて知らせる。
    // 1 件では収まっても合計で超える分も同じく落とす
    if (found !== undefined && !budget.has(actorIndex)) {
      const overOne = !partIsMeasurable(found);
      onNotice?.({
        kind: "part-not-drawn",
        actor: actor.name,
        line: 0,
        message: `"${actor.name}" (${partId}) は大きすぎるため取り込みません。`,
        hint: overOne
          ? `要素数が上限 (${MAX_INPUT_ELEMENTS}) を超えています`
          : `図全体の要素数が上限 (${MAX_INPUT_ELEMENTS}) を超えます`,
      });
      // 落とす時も仮の箱を掃除する。 残すと格子から外した後続の見本と重なる。
      // 部品が図に入らないので、部品へ引いた矢印も繋ぎ先が無い = 矢印ごとに知らせて外す
      cleanupPlaceholderActor(
        target,
        doc,
        actor,
        部品の要素へ繋ぐ(actor.name, partId, undefined, edgeSteps, onNotice),
      );
      continue;
    }
    const part = found;
    if (!part) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn(
          `[dragon] parts kind "${partId}" not found in partsCatalog (actor: ${actor.name})`,
        );
      }
      // 一覧に無い部品は仮の箱のまま描かれ、矢印も仮の箱に繋がる。 要素の名指しは効かない
      for (const s of doc.flow) {
        for (const [側, 欄] of [
          ["from", "fromPartNode"],
          ["to", "toPartNode"],
        ] as const) {
          const 値 = s[欄];
          if (値 === undefined || s[側] !== actor.name) continue;
          // 順序図は部品の有無に依らず名指しが効かない。 そちらの知らせと 2 度出さない
          if (doc.type === "sequence" || doc.type === "solidity") continue;
          onNotice?.({
            kind: "part-node-ignored",
            actor: actor.name,
            line: s.pos.line,
            message: `"${truncateForMessage(actor.name)}" (${truncateForMessage(partId)}) は部品の一覧に無いため、${欄} に書いた "${truncateForMessage(値)}" は効きません`,
            hint: "kind に部品の名前を書く (綴りを確かめる)",
          });
        }
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
    //
    // 仮の箱に繋がっていた矢印は、部品の図の要素へ繋ぎ直す (#1979)。
    // 縦列に置く部品は、仮の箱の縦列を消さずに残す (#1980)。 部品用の縦列 (`名前__l`) を足すと、
    // 縦列が書いた順ではなく仮に置いた横位置の順に並ぶ (実測 = 3 人目に書いた部品が真ん中になった)
    const 置く縦列 = 縦列の部品.get(actor.name);
    cleanupPlaceholderActor(
      target,
      doc,
      置く縦列 !== undefined ? { name: actor.name, lane: 置く縦列 } : actor,
      部品の要素へ繋ぐ(actor.name, partId, part, edgeSteps, onNotice),
    );
    const 外した縦列 = 基準のため外した.get(actor.name);
    if (外した縦列 !== undefined) {
      onNotice?.({
        kind: "part-lane-ignored",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        message: `"${actor.name}" は他の箱の位置の基準になっているため、縦列 "${target.lanes.find((l) => l.id === 外した縦列)?.label ?? 外した縦列}" には置かず図の下に並べました`,
        hint: `縦列に置きたい時は、"${actor.name}" を基準にした位置 (位置: ${actor.name} の右 200 など) を座標で書く`,
      });
    }
    const merged = applyColorHex(part, actor.colorHex, actor.stateOverride ?? {});
    // 色番号は部品の色の状態へ入れる。 塗りを図形に直接書いた部品 (`arc-gauge` 等) は入れる先が
    // 無く、書いても絵が変わらない。 黙って既定の色で描くと手掛かりが残らないので知らせる (#1973)
    if (actor.colorHex && !(part.states ?? []).some((st) => isColorValue(st.initial))) {
      onNotice?.({
        kind: "part-color-ignored",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        message: `"${actor.name}" (${partId}) は色を変えられる状態を持たないため、色番号 ${actor.colorHex} は効きません`,
        hint: "色を変えられる部品は、初期値が色番号の状態を持つもの (例 = state-indicator)",
      });
    }
    // 色の名前は箱の色にしか効かず、部品の色の状態は色番号しか受けない。 名前の色は描く側の
    // 配色の変数 (`--cdl-tone-*`) で決まり固定の色番号を持たないため、置き換えて入れることもしない
    if (actor.partColorName) {
      onNotice?.({
        kind: "part-color-ignored",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        // 残っている名前は読み替えた後の正規の名前 (`成功` なら `success`) なので文には出さない
        message: `"${actor.name}" (${partId}) の色は色の名前では変わりません`,
        hint: '部品の色は色番号で書く (例 = color: "#d9534f")',
      });
    }
    // 上書きが読むのは部品の状態の名前と `phase` (段を外す) だけで、他の名前は何も変えない。
    // 綴り違いや、外した欄 (`nodes`、#1976) を書いた時に、効いていない値を黙って持たない
    const 部品の状態 = new Set((part.states ?? []).map((st) => st.id));
    const 無い状態 = Object.keys(actor.stateOverride ?? {}).filter(
      (k) => k !== "phase" && !部品の状態.has(k),
    );
    if (無い状態.length > 0) {
      onNotice?.({
        kind: "part-state-missing",
        actor: actor.name,
        line: actor.pos?.line ?? 0,
        message: `"${actor.name}" (${partId}) は ${無い状態.map((k) => `"${truncateForMessage(k)}"`).join(" / ")} という状態を持たないため、書いた値は効きません`,
        hint:
          部品の状態.size > 0
            ? `この部品の状態 = ${[...部品の状態].join(", ")}`
            : "この部品は状態を持たないため、値を書いても変わりません",
      });
    }
    // 位置を書いていないパーツは格子に並べる。 書いてあればその位置を使う
    let placeX = actor.posX;
    let placeY = actor.posY;
    // 格子に落とすのは縦横どちらも書かなかった時だけ。 片方だけ書いた時に残りを格子で
    // 埋めると、 書いた値と格子が混ざった位置になる (従来の条件をそのまま保つ)
    if (置く縦列 !== undefined) {
      // 縦列の位置は図を配置するまで決まらない。 ここでは座標で置く形にだけして、
      // 全部の部品を組み込んだ後に縦列へ寄せる (`縦列に置いた部品を揃える`)
      placeX = 0;
      placeY = 0;
    } else if (placeX === undefined && placeY === undefined) {
      const center = gridCenters.get(actor.name);
      placeX = center?.cx;
      placeY = center?.cy;
    }
    // `倍率` / `scale` は図形の倍率として予約した (#1026)。 同じ名前の状態を持つ見本では、
    // 予約する前は状態の上書きとして効いていた。 黙って意味が変わると気付けないので知らせる
    // 判定は **書かれた名前** で行う。 読めた値で判定すると `scale: x` のように値が
    // 読めない形で知らせが消え、逆に `scale` を書いて見本が `倍率` の状態を持つだけの
    // 組合せ (元から衝突していない) にも知らせてしまう
    const written = new Set(actor.scaleKeys ?? []);
    if (written.size > 0) {
      const clashed = (part.states ?? []).find((st) => written.has(String(st.id ?? "")));
      if (clashed) {
        onNotice?.({
          kind: "scale-reserved",
          actor: actor.name,
          line: actor.pos?.line ?? 0,
          message: `"${clashed.id}" は見本の大きさを変える項目として扱いました (${clashed.id} という名前の状態は変えていません)`,
          hint: `状態を変えたい時は \`state: { ${clashed.id}: ... }\` と書く`,
        });
      }
    }
    const t = partTargetSize(part, actor.posW, actor.posH, actor.scale);
    const 組み込む前の箱の数 = target.nodes.length;
    mergePartIntoDiagram(
      target,
      part,
      actor.name,
      merged,
      置く縦列 ?? actor.lane,
      placeX,
      placeY,
      t.w,
      t.h,
      onNotice,
      actor.pos?.line ?? 0,
      derivedSourceLines,
      値の前置き.get(actor.name),
    );
    if (置く縦列 !== undefined) {
      縦列に置いた.push({
        縦列: 置く縦列,
        要素: new Set(target.nodes.slice(組み込む前の箱の数).map((n) => n.id)),
      });
    }
  }
  縦列に置いた部品を揃える(target, 縦列に置いた);
  return target;
}

type 縦列に置いた部品 = { 縦列: string; 要素: ReadonlySet<string> };

/** 部品が縦列より広い時に、縦列の左右に残す余白。 描画側が縦列の中の箱に取る最小の余白と同じ */
const 部品の縦列の余白 = 25;

/**
 * 縦列に置いた部品を、縦列の中心と図の下へ動かす (#1980)。
 *
 * 部品は座標で置く (部品の中の要素の並びを保つため)。 座標で置いた箱は描画側の配置が動かさないので、
 * 縦列の位置を知るには図を 1 度配置する。
 *
 * **配置は 1 度で足りる**。 縦列の横位置は縦列の幅・中の箱の幅・矢印の札で決まり、座標で置いた箱の
 * 座標には依らない。 部品を動かしても縦列は動かない。
 *
 * | 向き | 置き方 |
 * |---|---|
 * | 横 | 部品の中心を縦列の中心に合わせる。 部品が縦列より広ければ縦列を広げ、配置し直す |
 * | 縦 | 部品以外の箱の一番下から `PARTS_GAP` 空ける。 同じ縦列の部品は書いた順に下へ積む |
 *
 * **縦列の段には入れない**。 段の高さは縦列をまたいで共有され、背の高い部品を段に入れると隣の
 * 縦列の箱まで伸びる (実測 = `受付` の高さが 68 から 380 になった)。
 *
 * 配置できない図 (描画側が止める図) では動かさない。 描画でも同じ所で止まるので、ここで
 * 別の知らせは足さない。
 */
function 縦列に置いた部品を揃える(target: CdlDiagram, 置いた: readonly 縦列に置いた部品[]): void {
  if (置いた.length === 0) return;
  const 配置する = (): LaidDiagram | undefined => {
    try {
      return layout(target);
    } catch {
      return undefined;
    }
  };
  let laid = 配置する();
  if (!laid) return;
  const 範囲 = (d: LaidDiagram, 要素: ReadonlySet<string>) => {
    const 箱 = d.nodes.filter((n) => 要素.has(n.id));
    if (箱.length === 0) return undefined;
    return {
      x0: Math.min(...箱.map((n) => n.cx - n.w / 2)),
      x1: Math.max(...箱.map((n) => n.cx + n.w / 2)),
      y0: Math.min(...箱.map((n) => n.cy - n.h / 2)),
      y1: Math.max(...箱.map((n) => n.cy + n.h / 2)),
    };
  };
  // 部品より狭い縦列を広げる。 描画側は縦列を中の箱 1 つの幅までしか広げず、要素を横に並べた
  // 部品は隣の縦列へはみ出す
  let 広げた = false;
  for (const p of 置いた) {
    const r = 範囲(laid, p.要素);
    const 縦列 = target.lanes.find((l) => l.id === p.縦列);
    const 描いた縦列 = laid.lanes.find((l) => l.id === p.縦列);
    if (!r || !縦列 || !描いた縦列) continue;
    const 要る幅 = r.x1 - r.x0 + 部品の縦列の余白 * 2;
    if (要る幅 > 描いた縦列.width && 要る幅 > 縦列.width) {
      縦列.width = 要る幅;
      広げた = true;
    }
  }
  if (広げた) {
    laid = 配置する();
    if (!laid) return;
  }
  // 動かした後に配置し直して確かめ、狙いと合うまで繰り返す。 座標で置いた箱が他の箱と重なると
  // 描画側は他の箱を下げるため、仮の位置 (図の上端) のまま測った下端は実際より下にずれる
  // (実測 = 狙った上端 316 が 400 になった)。 部品を図の下へ動かせば重ならなくなり、2 回目で合う
  const 部品の要素 = new Set(置いた.flatMap((p) => [...p.要素]));
  for (let 回 = 0; 回 < 部品を揃え直す上限; 回 += 1) {
    // 下端は部品以外の箱 (格子に並べた部品を含む) と縦列の名札で測る。 箱を囲む縦列 (`contain`) は
    // 仮に置いた部品まで囲んでいるため数えない = 中の箱は箱として数えている
    const 他の箱の下端 = Math.max(
      ...laid.nodes.filter((n) => !部品の要素.has(n.id)).map((n) => n.cy + n.h / 2),
      ...laid.lanes.filter((l) => !l.contain).map((l) => l.y + l.height),
    );
    const 次の上端 = new Map<string, number>();
    let 動かした = false;
    for (const p of 置いた) {
      const r = 範囲(laid, p.要素);
      const 縦列 = laid.lanes.find((l) => l.id === p.縦列);
      if (!r || !縦列) continue;
      const 上端 = 次の上端.get(p.縦列) ?? 他の箱の下端 + PARTS_GAP;
      const dx = 縦列.x + 縦列.width / 2 - (r.x0 + r.x1) / 2;
      const dy = 上端 - r.y0;
      次の上端.set(p.縦列, 上端 + (r.y1 - r.y0) + PARTS_GAP);
      if (Math.abs(dx) <= PLACEMENT_TOLERANCE && Math.abs(dy) <= PLACEMENT_TOLERANCE) continue;
      for (const n of target.nodes) {
        if (!p.要素.has(n.id) || n.posX === undefined || n.posY === undefined) continue;
        n.posX += dx;
        n.posY += dy;
      }
      動かした = true;
    }
    if (!動かした) return;
    laid = 配置する();
    if (!laid) return;
  }
}

/** 縦列に置いた部品を配置し直して確かめる回数の上限。 実測では 2 回目で動かなくなる */
const 部品を揃え直す上限 = 3;

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
  if (isColorValue(original) && !isColorValue(override))
    return { initial: original, rejected: true };
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
 * 本文に書いた状態の上書きと色番号を、部品の図そのものに当てて返す (#1973)。
 *
 * 編集画面の本文欄は、部品を図から抜いて別に重ねて描く。 重ねる側が部品の図をそのまま
 * 描くと、`state: { lvl: 0.4 }` や `color: "#d9534f"` がカタログの絵にだけ効き、
 * 編集画面では既定の値で描かれる。 値の決め方は組み立て側と同じ 2 つの関数を通す。
 *
 * `phase: false` は組み立て側と同じく部品の段を外す。 段の数は残し、中身 (点灯と値の変化)
 * だけを空にする = 段を消すと、重ねた部品だけ段の進みが止まらない形になる。
 *
 * 色として読めない上書きは組み立て側と同じく捨てる。 知らせは組み立て側が出すため、
 * ここでは出さない (同じ本文で 2 度出さない)。
 */
export function 部品に上書きを当てる(
  part: CdlDiagram,
  actor: Pick<DslActor, "stateOverride" | "colorHex">,
): CdlDiagram {
  const 上書き = applyColorHex(part, actor.colorHex, actor.stateOverride ?? {});
  const 段を外す = 上書き["phase"] === false;
  if (Object.keys(上書き).length === 0) return part;
  return {
    ...part,
    states: part.states.map((st) => ({
      ...st,
      initial: resolveStateOverride(st.initial, 上書き[st.id]).initial,
    })),
    phases: 段を外す
      ? part.phases.map((ph) => ({ ...ph, activate: [], tweens: [], sets: [] }))
      : part.phases,
  };
}

/**
 * CAR-1657 = parts CdlDiagram (単一 part 内容) を target CdlDiagram に prefix 付きで merge する。
 * alias = user が書く actor 名 ('arc1')、 全 id を '{alias}__{origId}' で prefix、 lane 参照 rename、
 * state initial は stateOverride で上書き可、 shape / subtitle / value 内の '{stateName}' template も
 * '{alias__stateName}' に rewrite する。 phase parallel merge (activate / tweens / sets の id 参照 rename)。
 */
/**
 * 値と状態の名前に使う前置きを、登場人物の名前から作る (#1189)。
 *
 * `{名前}` に書ける字種は engine が 1 箇所で決めており (`template-name.ts`)、英数字と `_` に
 * 限る。 **読む側 (置き換え) と書ける側 (式) の両方がその定義を使う** ため、記法の側だけ
 * 広げることはできない。
 *
 * この記法では日本語の名前が普通なので、名前をそのまま前置きにすると値が 1 つも届かない。
 * 実測 = `受付 1` に見本を重ねると、状態は表に載るのに箱の `{受付 1__v}` が置き換わらず、
 * 見本の中の式は識別子として読めずに止まる (`value-unresolved`)。
 *
 * **箱 / 縦列 / 矢印の id は変えない**。 これらは `{名前}` の対象ではなく、画面側が id から
 * 登場人物の名前を取り出す経路があるため、変えると別の場所が壊れる。
 *
 * ## 同じ形に潰れる名前
 *
 * `受付 1` と `受付-1` はどちらも英数字だけにすると同じ形になる。 潰れたまま使うと 2 つの
 * 見本が同じ名前空間を共有し、片方の値がもう片方を上書きする。
 *
 * そこで **書いた順に番号を足して分ける**。 先に書いた方が番号なしを取り、後から同じ形に
 * なった方が `_2` / `_3` と続く。 英数字の名前しか無い図では 1 つも番号が付かないため、
 * 既存の図の名前は変わらない。
 */
function 値の前置きを作る(名前たち: readonly string[]): Map<string, string> {
  const 出力 = new Map<string, string>();
  const 使用中 = new Set<string>();
  const 次の番号 = new Map<string, number>();
  for (const 名前 of 名前たち) {
    if (出力.has(名前)) continue;
    let 素 = 名前
      .normalize("NFKC")
      .replace(/[^A-Za-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");
    // 空になる形 (記号だけの名前) と数字始まりは、そのままでは名前として使えない
    if (素 === "" || /^[0-9]/.test(素)) 素 = `p${素}`;
    // 接尾辞で分けた名前も使用済みとして扱う。 `p1` / `p1!` / `p1_2` の順では、
    // base ごとの回数だけを見ると後ろ 2 つがどちらも `p1_2` になって再衝突する
    let 候補 = 素;
    let 番号 = 次の番号.get(素) ?? 2;
    while (使用中.has(候補)) {
      候補 = `${素}_${番号}`;
      番号 += 1;
    }
    次の番号.set(素, 番号);
    使用中.add(候補);
    出力.set(名前, 候補);
  }
  return 出力;
}

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
  /** 見本から引き継いだ値の宣言元。 notice を見本を書いた行へ戻すために使う */
  derivedSourceLines?: Map<string, number[]>,
  /**
   * 値と状態の名前に使う前置き (#1189)。 `{名前}` は英数字と `_` しか読めないため、
   * 登場人物の名前をそのまま使えない。 渡されない経路では従来どおり名前をそのまま使う
   */
  valueAlias?: string,
): void {
  const prefix = (id: string): string => `${alias}__${id}`;
  // 値と状態だけ別の前置きを使う (#1189)。 箱 / 縦列 / 矢印の id は `prefix` のまま
  const 値前置き = valueAlias ?? alias;
  const valuePrefix = (id: string): string => `${値前置き}__${id}`;
  // 見本が自分で持つ名前。 **状態と、他の値から決まる値の両方** (#1180)。
  //
  // 値を含めないと、見本の中の `{決まる値}` が名前を付け替えられずに残り、重ねた先の同名の
  // 値を指してしまう (見本どうしが互いの値を読む形になる)。
  const ownIdSet = new Set([
    ...part.states.map((s) => s.id),
    ...(part.derived ?? []).map((d) => d.id),
  ]);
  const rewriteTemplate = (s: string | undefined): string | undefined => {
    if (!s) return s;
    return s.replace(/\{(\w+)\}/g, (m, name: string) => {
      return ownIdSet.has(name) ? `{${valuePrefix(name)}}` : m;
    });
  };
  // 値の式は見本の名前空間の中で閉じる。 見本が持つ名前だけを書き換えると、綴り違いの参照が
  // 取り込み先の同名の値に偶然つながり、単体では止まる見本の意味が置いた場所で変わる。
  //
  // **どれが参照かは engine に決めさせる**。 engine は `{v}` と裸の `v` の両方を参照として
  // 読み、関数名 (`min` / `Math.max` 等) は参照に数えない (実測)。 ここで関数の一覧を持つと
  // 記法側 (`value-syntax.ts`) と engine に続く 3 つ目の写しになり、engine が関数を足した時に
  // 静かにずれる。
  const rewriteDerivedExpression = (expression: string): string => {
    try {
      return writeFormula(renameFormulaIdentifiers(parseFormula(expression), valuePrefix));
    } catch {
      // 読めない式は engine が止めて伝える (`value-unresolved`)。 書き換えられないので
      // そのまま載せる = 名前は前置き無しのままだが、式自体が解けないため値は出ない
      return expression;
    }
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
  const existingLaneMaxX =
    target.lanes.length > 0 ? Math.max(...target.lanes.map((l) => (l.x ?? 0) + l.width)) : 0;
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
  const dropCenterX =
    offsetX !== undefined
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
  const targetMaxStack =
    shouldForcePos && target.nodes.length > 0
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

  // 縦列を 2 本以上持つ部品を 1 本の縦列へまとめる時は、要素ごとに別の段番号を振る (#1980)。
  // 元の段番号のままだと横に並んでいた要素が同じ段で重なり、配置が止まる (実測 =
  // `lane "b" の stack=1000 に node が重複`)。 座標で置く要素の位置は段番号で決まらないので、
  // 振り直しても絵は変わらない
  const 段を振り直す = targetLaneId !== undefined && shouldForcePos && part.lanes.length > 1;
  // node merge = id prefix + lane 参照 rewrite + shape / subtitle / value 内 template rewrite
  for (const [nodeIndex, nodeOrig] of part.nodes.entries()) {
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
    let nodePosX: number | undefined =
      nodeOrig.posX !== undefined ? mapLaneX(nodeOrig.posX) : undefined;
    let nodePosY: number | undefined =
      nodeOrig.posY !== undefined ? nodeOrig.posY + (offsetY ?? 0) : undefined;
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
    const nodeW =
      rawNodeW !== undefined && (scaleX !== 1 || scaleY !== 1) ? rawNodeW * scaleX : rawNodeW;
    const nodeH =
      rawNodeH !== undefined && (scaleX !== 1 || scaleY !== 1) ? rawNodeH * scaleY : rawNodeH;
    target.nodes.push({
      ...nodeOrig,
      id: prefix(nodeOrig.id),
      lane: mappedLane,
      title: rewriteTemplate(nodeOrig.title) ?? nodeOrig.title,
      subtitle: rewriteTemplate(nodeOrig.subtitle),
      value: rewriteTemplate(nodeOrig.value),
      // parts stack を target 側と分離 (D2 fix、 posX/posY 明示との 2 段防御)
      stack: (段を振り直す ? nodeIndex : (nodeOrig.stack ?? 0)) + stackShiftBase,
      ...(newShape ? { shape: newShape as CdlDiagram["nodes"][number]["shape"] } : {}),
      ...(nodePosX !== undefined ? { posX: nodePosX } : {}),
      ...(nodePosY !== undefined ? { posY: nodePosY } : {}),
      ...(nodeW !== undefined ? { w: nodeW } : {}),
      ...(nodeH !== undefined ? { h: nodeH } : {}),
    });
  }

  // state merge = id prefix + initial override
  for (const stateOrig of part.states) {
    const { initial, rejected } = resolveStateOverride(
      stateOrig.initial,
      stateOverride[stateOrig.id],
    );
    if (rejected) {
      onNotice?.({
        kind: "state-override-rejected",
        actor: alias,
        line: noticeLine,
        message: `"${alias}" の ${stateOrig.id} に書いた値は色として読めないため使いません`,
        hint: "色は `#ff0000` のような色番号か、 `red` のような色名で書く",
      });
    }
    target.states.push({ id: valuePrefix(stateOrig.id), initial });
  }

  // 見本が持つ「他の値から決まる値」 を引き継ぐ (#1180)。
  //
  // 引き継がないと、見本の中で書いた関係が重ねた先で解かれず、その値を読む箱に `{名前}` の
  // 生の形が出る。 名前は状態と同じ規則で前置きを付ける = 見本を 2 つ重ねても互いの値を
  // 読まない。 式の中の参照は、未定義の名前も含めて見本の名前空間へ閉じ込める。
  for (const derivedOrig of part.derived ?? []) {
    if (!target.derived) target.derived = [];
    const id = valuePrefix(derivedOrig.id);
    target.derived.push({
      id,
      expression: rewriteDerivedExpression(derivedOrig.expression),
    });
    recordDerivedSourceLine(derivedSourceLines, id, noticeLine);
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
      const rewritten = deepRewriteStrings(
        readoutOrig as unknown,
        rewriteTemplate,
      ) as CdlDiagram["readouts"] extends readonly (infer R)[] ? R : never;
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
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: valuePrefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: valuePrefix(s.stateId) })),
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
      targetPhase.tweens = [
        ...targetPhase.tweens,
        ...partPhase.tweens.map((t) => ({ ...t, stateId: valuePrefix(t.stateId) })),
      ];
      targetPhase.sets = [
        ...targetPhase.sets,
        ...partPhase.sets.map((s) => ({ ...s, stateId: valuePrefix(s.stateId) })),
      ];
    }
    // parts phase 余剰は append (target より parts が長い場合)
    for (let i = commonLen; i < partsLen; i++) {
      const phaseOrig = part.phases[i]!;
      target.phases.push({
        ...phaseOrig,
        id: prefix(phaseOrig.id),
        activate: phaseOrig.activate.map(prefix),
        tweens: phaseOrig.tweens.map((t) => ({ ...t, stateId: valuePrefix(t.stateId) })),
        sets: phaseOrig.sets.map((s) => ({ ...s, stateId: valuePrefix(s.stateId) })),
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
 * v0.5+ flow inline option (guard / cardinality / labelOffsetX / labelOffsetY / overlay) を
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
  /** 対応が取れた edge の行そのもの。 部品の取り込みが、行に書いた要素の名指しを読む (#1979) */
  edgeSteps?: Map<string, DslStep>,
): void {
  // **静止した `type: flow` は書いた端で対応が取れない** (#1267)。 鎖の規則で先に埋める
  if (鎖でつなぐ形か(doc)) {
    diagram.edges.forEach((e, idx) => {
      const s = 鎖のどの行から来たか(doc, idx);
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
    const from = slugify(e.target.from);
    const to = slugify(e.target.to);
    let 矢印: CdlEdge | undefined;
    if (doc.type === "sequence" || doc.type === "solidity") {
      const stepIdx = doc.flow.findIndex(
        (step) => slugify(step.from) === from && slugify(step.to) === to,
      );
      if (stepIdx >= 0) {
        矢印 = diagram.edges.find(
          (x) =>
            (x.from === `s${stepIdx}-${from}` || x.from === from) &&
            (x.to === `s${stepIdx}-${to}` || x.from === x.to),
        );
      }
    } else {
      矢印 = diagram.edges.find((x) => x.from === from && x.to === to);
    }
    return 矢印 ? { kind: "edge", id: 矢印.id } : undefined;
  }
  const 名 = e.target.name;
  const slug = slugify(名);
  if (e.target.kind === "node") {
    const 箱 = diagram.nodes.find((n) => n.id === slug || n.id === 名 || n.title === 名);
    return 箱 ? { kind: "node", id: 箱.id } : undefined;
  }
  const 列 = (diagram.lanes ?? []).find((l) => l.id === slug || l.id === 名 || l.label === 名);
  return 列 ? { kind: "lane", id: 列.id } : undefined;
}

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
  if (s.cardinality !== undefined) {
    target.cardinality = s.cardinality;
    // ER preset の場合 label に "(1:N)" 形式で併記 (既に含まれていればスキップ)
    if (doc.type === "er" && !target.label.includes(s.cardinality)) {
      target.label = target.label ? `${target.label} (${s.cardinality})` : `(${s.cardinality})`;
    }
  }
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
 * 静止した `type: flow` かどうか。 この形だけ矢印を鎖状に作る (`compileFlow`)。
 *
 * 段を持つ形・縦列を書いた形・向きを書いた形は generic 経路へ回るため鎖にならない。
 *
 * **`compileFlow` の分岐もこの判定を使う**。 判定を 2 か所に書くと、組み立てだけが別経路へ回り、
 * 行の対応と端の知らせが鎖のまま残る。 向きを書いた形 (#1494) は組み立てにだけ足され、`A -> C` に
 * 書いた `head` が `C -> B` に載り、書いた端のとおりの矢印に「端は使われません」 が出ていた (#1986)。
 */
function 鎖でつなぐ形か(doc: DslDocument): boolean {
  if (doc.type !== "flow") return false;
  if (doc.animate && doc.animate.phases.length > 0) return false;
  if (doc.direction !== undefined) return false;
  return !書いた縦列に置く("flow", doc);
}

/**
 * 鎖の N 本目の矢印が、本文のどの行から来たかを返す (#1267)。
 *
 * `compileFlow` は登場人物を書いた順に繋ぎ、説明文は **その箱を to に持つ行** から拾う。
 * 書いた側の端 (from) は使わない。 そのため `A -> C` と書いても矢印は `A -> B` になり、
 * (from, to) の一致では対応が取れない (実測 = 説明文だけが載り、指定が黙って落ちていた)。
 *
 * 説明文を決めた規則と同じ規則で指定も決める = 説明文と指定が必ず同じ行から来る。
 */
function 鎖のどの行から来たか(doc: DslDocument, edgeIndex: number): DslStep | undefined {
  const to = doc.actors[edgeIndex + 1];
  if (to === undefined) return undefined;
  return doc.flow.find((s) => s.to === to.name);
}

/**
 * 記法の `values:` を図に載せる (#1162)。
 *
 * `values` は「他の値から自動で決まる値」 で、 時間を持たない。 参照した値が動けば常に
 * 追随する。 解くのは描画側 (`@cardenelabs/cdl` の `applyDerivedValues`) で、 段の値を出した
 * 後に参照順で解いて `stateValues` に載せる。 **毎 frame ここを通る**ので、 掛け算や比較の
 * ように端点 2 点では表せない関係も段の補間の途中で正しい値になる。
 *
 * ここは載せるだけで、 式は評価しない。 評価を compile 時に畳むと段の補間中に決まり直せない。
 *
 * **出口で 1 度だけ載せる**。 図の種類は 18 あり、 経路ごとに書くとどれかを見落とす
 * (`injectStaticPhase` と同じ理由)。
 *
 * 名前が `states` と重なった場合は `values` を優先し、 重なったことを伝える。 spec の
 * 4 節で決めた挙動で、 黙って一方を捨てると「書いたのに効かない」 が残る。
 */
/** 数を式に埋める。 指数表記 (`1e-7`) は engine の式が読めないため十進で書く */
function 式に書く数(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const text = String(n);
  if (!/[eE]/.test(text)) return text;

  // Number の有効桁を丸めず、指数表記だけを通常の十進表記へ展開する。 `toFixed(6)` では
  // 1e-7 が 0 になり、正しく読める `to` の値が動かなくなる。
  const [coefficient = "0", exponentText = "0"] = text.toLowerCase().split("e");
  const negative = coefficient.startsWith("-");
  const unsigned = negative ? coefficient.slice(1) : coefficient;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const digits = `${whole}${fraction}`;
  const decimalAt = whole.length + Number(exponentText);
  let expanded: string;
  if (decimalAt <= 0) expanded = `0.${"0".repeat(-decimalAt)}${digits}`;
  else if (decimalAt >= digits.length)
    expanded = `${digits}${"0".repeat(decimalAt - digits.length)}`;
  else expanded = `${digits.slice(0, decimalAt)}.${digits.slice(decimalAt)}`;
  return negative ? `-${expanded}` : expanded;
}

/** 段の中で 1 本の値が動く区間。 `from` から `to` へ `[start, end]` の間で線形に動く */
type 動く区間 = { 段: number; start: number; end: number; dur: number; from: number; to: number };

/**
 * 相手の値が境目を通る時刻を求める。
 *
 * 相手は段の中で線形に動くので、 境目を通る時刻は逆算できる。 始めから成り立っているなら
 * 相手が動き始めた時刻、 終わりまで成り立たないなら「通らない」 とする。
 *
 * `>` と `!=` の厳密な瞬間は境目の直後だが、 1 frame 未満の差なので境目そのものを返す。
 */
function 境目を通る時刻(区間: 動く区間, op: string, 境目: number): number | null {
  const 満たす = (x: number): boolean => {
    switch (op) {
      case ">=":
        return x >= 境目;
      case ">":
        return x > 境目;
      case "<=":
        return x <= 境目;
      case "<":
        return x < 境目;
      case "==":
        return x === 境目;
      case "!=":
        return x !== 境目;
      default:
        return false;
    }
  };
  if (満たす(区間.from)) return 区間.start;
  // `==` は終点が一致しなくても、線形補間の途中で境目を通る。 終点だけを見ると
  // 0 → 100 に対する `== 50` を「満たさない」と誤判定する。
  if (op === "==") {
    const min = Math.min(区間.from, 区間.to);
    const max = Math.max(区間.from, 区間.to);
    if (境目 < min || 境目 > max) return null;
  } else if (!満たす(区間.to)) {
    return null;
  }
  if (区間.to === 区間.from) return null;
  const t = 区間.start + (区間.dur * (境目 - 区間.from)) / (区間.to - 区間.from);
  if (!Number.isFinite(t)) return null;
  return Math.min(Math.max(t, 区間.start), 区間.end);
}

/**
 * きっかけ形の値 (`trigger` / `to` / `dur`) を、段の時計を読む式へ畳む (#1161 段 2)。
 *
 * ## なぜ式へ畳むのか
 *
 * 描画側の動きの模型は段と、 段の中の線形補間しか持たない。 条件で動き出す仕組みも、 値ごとの
 * 長さも無い (実測)。 そのままでは `trigger` も `dur` も渡せない。
 *
 * 一方で描画側は `derived` の式を **毎 frame** 解く。 そこで段に時計を 1 本引き
 * (`0` から段の長さまでの補間)、 各値を「時計を読む傾斜」 として書けば、 段を割らずに
 * 値ごとの長さを守れる。
 *
 * ```
 * 値 = from + (to - from) * min(max((時計 - 開始) / 長さ, 0), 1)
 * ```
 *
 * `min` / `max` で挟むのは、 開始前は `from` のまま、 終了後は `to` のまま止めるため。
 *
 * ## 段を割らない
 *
 * 段は見出し / 本文 / 印を持つ表示物なので、 割ると段送りの見え方と件数が変わる。 時計を使えば
 * 段は 1 つのまま値だけが順に動く。 収まらない形 (開始 + 長さ > 段の長さ) は畳まずに知らせる。
 *
 * ## 連鎖の解き方
 *
 * `trigger: <相手> >= <境目>` は、 相手も段の中で線形に動くため境目を通る時刻を逆算できる。
 * 相手が動く値でない (式だけ、 または初期値のまま) 場合は時刻が決まらないので畳まない。
 *
 * 返すのは名前から式への表で、 `attachDerivedValues` がこれを `derived` に載せる。 畳めなかった
 * 値は表に入らないため図に載らない = 半端に止まった値を黙って置かない。
 */
function foldValueTriggers(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): Map<string, string> {
  const 出力 = new Map<string, string>();
  const きっかけ付き = (doc.values ?? []).filter((v) => v.trigger !== undefined);
  if (きっかけ付き.length === 0) return 出力;

  // 同じ名前を 2 度書いた時は先に書いた方を使う (`values` の既存の扱いと揃える)
  const 宣言 = new Map<string, DslValue>();
  for (const v of きっかけ付き) if (!宣言.has(v.name)) 宣言.set(v.name, v);

  const 初期値 = new Map<string, number>();
  for (const s of diagram.states) {
    const n = Number(s.initial);
    if (Number.isFinite(n)) 初期値.set(s.id, n);
  }

  // 段は書いた名前でも slug でも指せる。 `focus:` が名前で指せるのと揃える
  const 段の番号 = new Map<string, number>();
  diagram.phases.forEach((p, i) => {
    if (!段の番号.has(p.title)) 段の番号.set(p.title, i);
    if (!段の番号.has(p.id)) 段の番号.set(p.id, i);
  });

  const 解けた = new Map<string, 動く区間>();
  const 解けない = new Set<string>();
  const 解決中 = new Set<string>();

  const 知らせる = (v: DslValue, message: string, hint: string): void => {
    onNotice?.({
      kind: "value-trigger-unresolved",
      actor: v.name,
      line: v.pos?.line ?? 0,
      message,
      hint,
    });
  };

  const 解く = (name: string): 動く区間 | null => {
    const 既出 = 解けた.get(name);
    if (既出) return 既出;
    if (解けない.has(name)) return null;
    const v = 宣言.get(name);
    if (!v || !v.trigger) return null;
    if (解決中.has(name)) {
      解けない.add(name);
      知らせる(
        v,
        `"${name}" のきっかけが一周しています`,
        "どれか 1 つを `trigger: step ...` に変える",
      );
      return null;
    }
    解決中.add(name);
    const 区間 = 組み立てる(v);
    解決中.delete(name);
    if (!区間) {
      解けない.add(name);
      return null;
    }
    解けた.set(name, 区間);
    return 区間;
  };

  const 組み立てる = (v: DslValue): 動く区間 | null => {
    const trigger = v.trigger!;
    const from = 初期値.get(v.name) ?? 0;
    const to = v.to ?? 0;
    const dur = v.durationMs ?? 0;
    let 段 = 0;
    let start = 0;
    if (trigger.kind === "step") {
      const idx = 段の番号.get(trigger.step);
      if (idx === undefined) {
        知らせる(
          v,
          `"${trigger.step}" という段がありません`,
          "`animation:` にその名前の段を書くか、 段の名前に合わせる",
        );
        return null;
      }
      段 = idx;
      start = 0;
    } else {
      const 相手 = 解く(trigger.source);
      if (!相手) {
        知らせる(
          v,
          `"${trigger.source}" が動く値でないため、 きっかけの時刻を決められません`,
          "見張る相手も `trigger:` を持つ値にする",
        );
        return null;
      }
      const at = 境目を通る時刻(相手, trigger.op, trigger.threshold);
      if (at === null) {
        知らせる(
          v,
          `"${trigger.source}" は ${trigger.op} ${trigger.threshold} を満たしません`,
          "相手が通る値を境目にするか、 相手の `to` を見直す",
        );
        return null;
      }
      段 = 相手.段;
      start = at;
    }
    const 段の長さ = diagram.phases[段]?.duration ?? 0;
    if (start + dur > 段の長さ) {
      知らせる(
        v,
        `段 "${diagram.phases[段]?.title ?? ""}" (${段の長さ}ms) に収まりません (${Math.round(start + dur)}ms 必要)`,
        "段を長くするか `dur` を短くする",
      );
      return null;
    }
    return { 段, start, end: start + dur, dur, from, to };
  };

  for (const v of 宣言.values()) 解く(v.name);
  if (解けた.size === 0) return 出力;

  // 時計は段ごとに 1 本。 名前が既にある時は末尾に数を足してずらす = 書いた値を上書きしない
  const 使用中 = new Set(diagram.states.map((s) => s.id));
  for (const v of doc.values ?? []) 使用中.add(v.name);
  const 段ごとの時計 = new Map<number, string>();
  const 時計を用意する = (段: number): string => {
    const 既出 = 段ごとの時計.get(段);
    if (既出) return 既出;
    let 名前 = `__step_clock_${段}`;
    let 連番 = 2;
    while (使用中.has(名前)) 名前 = `__step_clock_${段}_${連番++}`;
    使用中.add(名前);
    段ごとの時計.set(段, 名前);
    diagram.states.push({ id: 名前, initial: 0 });
    const 段の中身 = diagram.phases[段];
    if (段の中身)
      段の中身.tweens = [...段の中身.tweens, { stateId: 名前, from: 0, to: 段の中身.duration }];
    return 名前;
  };

  for (const [name, 区間] of 解けた) {
    const 時計 = 時計を用意する(区間.段);
    const 進み = `min(max(({${時計}} - ${式に書く数(区間.start)}) / ${式に書く数(区間.dur)}, 0), 1)`;
    出力.set(name, `((${進み} * ${式に書く数(区間.to - 区間.from)}) + ${式に書く数(区間.from)})`);
  }
  return 出力;
}

function attachDerivedValues(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
  inheritedSourceLines?: ReadonlyMap<string, readonly number[]>,
  foldedTriggers?: ReadonlyMap<string, string>,
): void {
  const values = doc.values ?? [];
  // 本文に値を書いていなくても、重ねた見本が値を持つことがある (#1180)。 その場合も
  // 解けなかった分は伝える = 見本の中で止まった値も、画面には `{名前}` の生の形で出る
  if (values.length === 0) {
    if ((diagram.derived?.length ?? 0) > 0) {
      reportUnresolvedValues(diagram, doc, onNotice, inheritedSourceLines);
    }
    return;
  }

  // 名前が重なったかは **図に載った状態** で見る。 書いた `states:` だけを見ると、見本から
  // 引き継いだ状態 (`alias__id`) との重なりを見落とす
  const 状態の名前 = new Set(diagram.states.map((s) => s.id));
  for (const v of values) {
    if (!状態の名前.has(v.name)) continue;
    // きっかけ形は `states:` の値を **動き始めの値として使う**。 両方書くのが正しい形なので
    // 重なりとして知らせない (#1161)。 知らせると、 仕様どおりに書いた図が毎回警告を出す
    if (v.trigger !== undefined) continue;
    onNotice?.({
      kind: "value-shadows-state",
      actor: v.name,
      line: v.pos?.line ?? 0,
      message: `"${v.name}" を states と values の両方に書いています。 values を使います`,
      hint: "states から外すか、 values の名前を変える",
    });
  }

  // **見本から引き継いだ分に足す** (#1180)。 代入で書くと、重ねた見本が持つ値が消える。
  //
  // 本文に書いた分を先に置く = engine は同じ名前では先に書いた式を使うため、名前が重なった
  // 時に本文が勝つ。 重なったことは engine の知らせ (`duplicate-id`) がそのまま伝える
  // きっかけ形は `foldValueTriggers` が畳んだ式を使う。 畳めなかった値はここに現れないため
  // 図に載らない = 半端に止まった値を黙って置かない (知らせは畳む時点で出している)
  const 載せる: Array<{ id: string; expression: string }> = [];
  for (const v of values) {
    const expression = v.expression ?? foldedTriggers?.get(v.name);
    if (expression === undefined) continue;
    載せる.push({ id: v.name, expression });
  }
  diagram.derived = [...載せる, ...(diagram.derived ?? [])];
  reportUnresolvedValues(diagram, doc, onNotice, inheritedSourceLines);
}

/**
 * 式の中の名前を付け替える (#1180)。
 *
 * **字句ではなく木を経由する**。 engine の式は `{v}` / 裸の `v` / 数字始まり / `$` 入りと
 * 参照の書き方が複数あり、正規表現で追うと書き方が 1 つ増えるたびに漏れる (review が 3 round
 * 続けて別の漏れを見つけた)。 木は識別子をそのまま持つので、字句を網羅しなくてよい。
 *
 * 関数呼び出し (`min` / `Math.max`) は木の上で別の種類なので、名前と取り違えない。
 */
function renameFormulaIdentifiers(ast: FormulaAst, rename: (name: string) => string): FormulaAst {
  switch (ast.type) {
    case "number":
      return ast;
    case "identifier":
      return { type: "identifier", name: rename(ast.name) };
    case "unaryOp":
      return { ...ast, operand: renameFormulaIdentifiers(ast.operand, rename) };
    case "binaryOp":
      return {
        ...ast,
        left: renameFormulaIdentifiers(ast.left, rename),
        right: renameFormulaIdentifiers(ast.right, rename),
      };
    case "ternary":
      return {
        type: "ternary",
        condition: renameFormulaIdentifiers(ast.condition, rename),
        whenTrue: renameFormulaIdentifiers(ast.whenTrue, rename),
        whenFalse: renameFormulaIdentifiers(ast.whenFalse, rename),
      };
    case "call":
      return { ...ast, args: ast.args.map((a) => renameFormulaIdentifiers(a, rename)) };
  }
}

/**
 * 数を、engine の読み手が受け付ける形で書く (#1180)。
 *
 * **指数表記を出さない**。 `0.0000001` は JavaScript の既定では `"1e-7"` になるが、engine の
 * 読み手は指数表記を読めない (実測 = `unexpected token after expression`)。 そのまま書くと、
 * 元は解けていた式が書き換えた後だけ止まる。
 *
 * 展開は桁をずらすだけで、丸めない。 `String` が返す最短の形をそのまま使うため、値は変わらない。
 * 有限でない数は書けないので投げる (呼出側が元の式のまま載せる)。
 */
function writeNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`cannot write non-finite number: ${String(value)}`);
  const s = String(value);
  if (!/[eE]/.test(s)) return s;
  const m = /^(-?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/.exec(s);
  if (!m) throw new Error(`cannot write number: ${s}`);
  const sign = m[1] ?? "";
  const int = m[2] ?? "";
  const frac = m[3] ?? "";
  const digits = int + frac;
  // 小数点の位置。 元の整数部の桁数を指数のぶんだけずらす
  const point = int.length + Number(m[4] ?? "0");
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${"0".repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

/**
 * 式の木を文字列へ戻す (#1180)。
 *
 * **括弧を全て付ける**。 演算子の優先順位を再現しようとすると engine の表を写すことになり、
 * 表がずれた時に式の意味が静かに変わる。 括弧が増えても解いた結果は変わらない。
 */
function writeFormula(ast: FormulaAst): string {
  switch (ast.type) {
    case "number":
      return writeNumber(ast.value);
    case "identifier":
      // **裸で書ける形とそうでない形がある**。 engine は裸の名前を `[A-Za-z_$][\w$]*` で読む
      // 一方、波括弧の中は `\w+` なので数字始まりの名前は波括弧付きでしか書けない。
      // 名前は前置きで変わる (`1p__v` のように数字始まりになりうる) ため、書ける方を選ぶ
      return /^[A-Za-z_$][\w$]*$/.test(ast.name) ? ast.name : `{${ast.name}}`;
    case "unaryOp":
      // 空白は挟まない。 読み手は負の数を字面として持たず (`-5` は単項 `-` と `5` の木になる)、
      // `--5` も単項の 2 段として読む (実測)。 挟んでも挟まなくても意味が同じなので足さない
      return `(${ast.op}${writeFormula(ast.operand)})`;
    case "binaryOp":
      return `(${writeFormula(ast.left)} ${ast.op} ${writeFormula(ast.right)})`;
    case "ternary":
      return `(${writeFormula(ast.condition)} ? ${writeFormula(ast.whenTrue)} : ${writeFormula(ast.whenFalse)})`;
    case "call":
      return `${ast.fn}(${ast.args.map(writeFormula).join(", ")})`;
  }
}

/** `derived` の同名宣言を、engine が読む順のまま行番号の列として残す。 */
function recordDerivedSourceLine(
  sourceLines: Map<string, number[]> | undefined,
  id: string,
  line: number,
): void {
  if (!sourceLines) return;
  const lines = sourceLines.get(id) ?? [];
  lines.push(line);
  sourceLines.set(id, lines);
}

/**
 * 解けなかった値を書いた人に伝える (#1162)。
 *
 * 描画側は解けない値を黙って飛ばす (`computeStateValues` が engine の知らせを捨てている)。
 * 書き間違えても図は描かれ、箱に `{waiting}` の生の形が出るだけになる。 綴りを疑う以外に
 * 手掛かりが無いので、組み立ての時点で分かる分をここで伝える。
 *
 * **判定は engine にさせる**。 解く順序と、止める条件 (輪 / 無い名前 / 読めない式 / 数として
 * 読めない値) は engine が持つ。 同じ判定を書き直すと、描画は動くのに知らせだけ出る
 * (またはその逆) 状態を作る。
 *
 * 見るのは初期値 1 組だけ。 輪 / 無い名前 / 読めない式 / 二重宣言は値に依らないのでこれで
 * 全て取れる。 段の途中でだけ起きる形 (割る数が段の途中で 0 になる等) は取れない =
 * 毎 frame の知らせは engine 側が返し口を持たないため、ここでは扱わない。
 */
function reportUnresolvedValues(
  diagram: CdlDiagram,
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
  inheritedSourceLines?: ReadonlyMap<string, readonly number[]>,
): void {
  if (!onNotice) return;
  // 描画側 (`computeStateValues`) が段を進める前に組み立てるのと同じ形。 値を解く手順は
  // engine に渡すので、ここで組み立てるのは初期値の表だけにする
  //
  // **継承を持たない入れ物で作る**。 engine 側 (`computeStateValues` /
  // `applyDerivedValues`) が同じ形で組むため、ここを通常の object にすると
  // `__proto__` のような名前で **組み立てだけが「値が無い」 と知らせる** 状態ができる
  // (実測 = 描画は `a = 5` を出すのに、知らせは `value-unresolved` を出していた)。
  //
  // engine が `{}` で組んでいた頃はここも `{}` で揃えていた。 cdl 側が継承なしに
  // 揃えた (cdl#456 / cdl#490) ので、こちらも合わせる。 **揃っていることが要点**で、
  // どちらの形にするかは engine が決める
  const 初期値: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const s of diagram.states) 初期値[s.id] = String(s.initial);

  // engine は同じ名前では先に書いた式を使う。 Map の一括生成で後ろから
  // 上書きすると、先の式の未解決を後の行の問題として伝えてしまう
  const 最初の行 = new Map<string, number>();
  const 重複した行 = new Map<string, number[]>();
  for (const v of doc.values ?? []) {
    if (!最初の行.has(v.name)) {
      最初の行.set(v.name, v.pos?.line ?? 0);
      continue;
    }
    const 同じ名前の行 = 重複した行.get(v.name) ?? [];
    同じ名前の行.push(v.pos?.line ?? 0);
    重複した行.set(v.name, 同じ名前の行);
  }
  // 本文の値は `attachDerivedValues` が先頭へ置き、見本から引き継いだ値はその後ろに残る。
  // 同じ順で行を足すことで、duplicate-id を「後から書かれた宣言」へ正確に戻す。
  for (const [id, lines] of inheritedSourceLines ?? []) {
    for (const line of lines) {
      if (!最初の行.has(id)) {
        最初の行.set(id, line);
        continue;
      }
      const 同じ名前の行 = 重複した行.get(id) ?? [];
      同じ名前の行.push(line);
      重複した行.set(id, 同じ名前の行);
    }
  }
  for (const n of applyDerivedValues(初期値, diagram.derived).notices) {
    onNotice({
      kind: n.kind === "duplicate-id" ? "value-duplicate" : "value-unresolved",
      actor: n.id,
      // 重複は後から書いた宣言そのものを、式の問題は engine が使う最初の宣言を指す
      line:
        n.kind === "duplicate-id"
          ? (重複した行.get(n.id)?.shift() ?? 最初の行.get(n.id) ?? 0)
          : (最初の行.get(n.id) ?? 0),
      message: n.message,
      hint: VALUE_NOTICE_HINT[n.kind],
    });
  }
}

/** 止まった理由ごとの直し方。 engine の知らせは何が起きたかまでで、直し方は記法側が持つ */
const VALUE_NOTICE_HINT: Readonly<Record<string, string>> = {
  cycle: "参照が一周しています。 どれか 1 つを states の初期値に変える",
  "unknown-reference": "その名前の states / values を足すか、綴りを直す",
  "parse-error": "式に書けるのは四則 (+ - * /) と括弧、比較、min / max だけ",
  "eval-error": "初期値で計算できない形です。 割る数や、数として読めない初期値を見直す",
  "duplicate-id": "同じ名前が 2 度あります。 片方を消すか名前を変える",
  "invalid-id": "名前に使えるのは英数字と _ だけ",
};


/**
 * 図全体を 1 つの箱で描く種別。
 *
 * これらは中身 (扇 / 帯 / 枝) を payload で受け取り、 1 node で図全体を描く。 登場人物ごとの箱を
 * 持たないので、 段の `focus:` で名前を指しても引く先が無い。 `injectPhasesFallback` が
 * この一覧を使って「実在する名前ならその箱を光らせる」 に読み替える (#1076 / #1077)。
 *
 * `mind-map` は一時期 **記法から到達しなかった** (`#1174`)。 この種別を作っていたのは
 * `compileRadial` だけで `#1170` で消え、 記法の `type: mind` は `card` を 3 列に並べる
 * 別実装だった。
 *
 * それでも一覧に残すのは、 ここが「1 箱で図全体を描く種別」 という **性質の一覧** だから。
 * `mind-map` は engine 側でその性質を持ち続けており、 記法が到達しないのは当時の
 * `compileMind` の実装によるものだった。 `#1177` で `compileMind` を `mind-map` に寄せたため、
 * **今は記法からも到達する** (一覧へ戻す作業が要らなかったのはこのため)。
 *
 * ## 図表の種別は 1 つ残らず載せる (#1668)
 *
 * 弧と帯で量を表す 3 種 (`chart-gauge` / `chart-radial` / `chart-stacked-bar`) と、
 * 値 1 つを大きく示す 2 種 (`chart-stat` / `chart-waffle`) が抜けていた。 5 種とも中身を
 * payload で受け取って 1 箱で描く = この一覧が言う性質をそのまま持つ。
 *
 * 抜けている間、段の `draw:` を書いても指す先が引けず **書けるのに動かない** 状態になる
 * (`draw` の解決は「1 箱で描く箱がちょうど 1 つ」 を条件にしている)。 `focus:` で登場人物の
 * 名前を書いた時に何も光らないのも同じ穴で、載せると図の箱が光るようになる。
 */
const SINGLE_BOX_KINDS: ReadonlySet<string> = new Set([
  "chart-pie",
  "chart-line",
  "chart-bar",
  "gantt-timeline",
  "mind-map",
  "funnel-stages",
  "quadrant-matrix",
  "tree-hierarchy",
  "journey-map",
  // 2 時点を直線でつなぐ図も 1 箱で全体を描く (#1647)
  "chart-slope",
  // 弧と帯で量を表す 3 種も 1 箱で全体を描く (#1668)
  "chart-gauge",
  "chart-radial",
  "chart-stacked-bar",
  // 値 1 つを大きく示す図と、1 個 = 1% の印を埋める図も同じ (#1668)。
  // 段の `draw:` は受けない (描画側が起点から描く動きを持たない) が、性質は同じなので載せる
  "chart-stat",
  "chart-waffle",
]);


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

  const 配置 = layout(diagram);
  const 並びの縦列 = 配置.lanes.filter((l) => !作った枠.has(l.id));
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
/**
 * `{名前}` が指す状態が取りうる値を、記法に書かれた範囲で集める (#1251)。
 *
 * 初期値と、段が動かす先 (`tween:` の両端と `set:` の値) を見る。 数として読めない値は
 * 落とす = 位置として使われないため、下限の判定には関係しない。
 */
function 状態が取る値(参照: string, doc: DslDocument): number[] {
  const 名 = 参照.slice(1, -1);
  const out: number[] = [];
  const 数にする = (v: unknown): void => {
    if (typeof v === "number") {
      if (Number.isFinite(v)) out.push(v);
      return;
    }
    // **空文字と空白だけの値を数にしない**。 `Number("")` は 0 を返すため、そのままだと
    // 位置 0 として扱われ、始まりが 1 以降の帯に誤った知らせが出る。 描画側はこの値を
    // 解けず始まりへ倒すので、警告する相手ではない
    const 文字 = String(v).trim();
    if (文字 === "") return;
    const n = Number(文字);
    if (Number.isFinite(n)) out.push(n);
  };
  for (const st of doc.animate?.states ?? []) if (st.name === 名) 数にする(st.initial);
  for (const p of doc.animate?.phases ?? []) {
    for (const t of p.tweens ?? []) {
      if (t.state !== 名) continue;
      数にする(t.from);
      数にする(t.to);
    }
    for (const v of p.sets ?? []) if (v.state === 名) 数にする(v.value);
  }
  return out;
}

/**
 * 工程が終わる位置を決める (#1251)。
 *
 * 書かなければ始まりと同じ = 帯が 1 コマ (従来の挙動)。
 *
 * `{名前}` を書いたらそのまま渡す。 描画側が状態を解いて位置に直すため、段で帯が伸び縮みする。
 * その場合 **時期の名前は始まりのものを使う** = 状態が指すのは位置であって時期の名前ではなく、
 * 帯の端に出す字が段ごとに変わるわけではない。
 *
 * 時期の名前を書いたら、その名前の位置に終わる。 書いた名前が目盛りに無い形は始まりと同じに
 * 倒す = 目盛りは書かれた順に作るため、載っていない名前は位置を持たない。
 */
function 終わる位置(
  end: string | undefined,
  始まり: number,
  目盛り: readonly string[],
  名前: string,
  伝える: (名: string, message: string) => void,
  doc: DslDocument,
): { idx: number | string; label?: string } {
  if (end === undefined) return { idx: 始まり };
  if (/^\{\w+\}$/.test(end)) {
    // **状態が取る値は記法に全部書いてある**。 初期値と、段が動かす先 (`tween:` の両端と
    // `set:` の値) を集めれば、始まりより前に落ちる値をここで見つけられる。
    //
    // 覆えないのは `values:` の式から決まる値だけ = 他の状態から計算されるため、
    // 段ごとの結果を組み立ての時点では出せない
    const 低い = 状態が取る値(end, doc).filter((v) => v < 始まり);
    if (低い.length > 0) {
      伝える(
        名前,
        `type: gantt で ${truncateForMessage(名前)} の終わり (${truncateForMessage(end)}) が始まりより前になる値を取ります (${[...new Set(低い)].join(", ")})。 始まりは ${始まり} 番目です`,
      );
    }
    return { idx: end };
  }
  const i = 目盛り.indexOf(end);
  if (i < 0) return { idx: 始まり };
  // 始まりより前に終わる帯は描けない。 そのまま渡すと横幅が負になり、帯が始まりの位置から
  // 左へはみ出す。 始まりと同じに倒して伝える (黙って倒すと「書いたのに 1 コマのまま」 になる)
  if (i < 始まり) {
    伝える(
      名前,
      `type: gantt で ${truncateForMessage(名前)} の終わり (${truncateForMessage(end)}) が始まりより前です (始まりと同じに倒しました)`,
    );
    return { idx: 始まり };
  }
  return { idx: i, label: end };
}

function compileGantt(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "gantt" });
  const CHART_W = 720;
  b.lane("gantt", { width: CHART_W });

  // 目盛りは **書かれた順** に並べる。 以前は `Q1=200 / Q2=600 / ...` の決め打ちで、 Q1-Q4 以外は
  // 全て同じ位置に落ちていた。 順に並べれば月名でも週番号でも同じ規則で置ける
  const 目盛り: string[] = [];
  const 目盛りなし: string[] = [];
  const タスク: {
    name: string;
    title: string;
    label: string;
    tone?: DslDocument["actors"][number]["tone"];
    owner?: string;
    end?: string;
  }[] = [];
  for (const a of doc.actors) {
    const label = (a.value ?? a.subtitle ?? "").trim();
    if (label === "") {
      目盛りなし.push(a.name);
      continue;
    }
    if (!目盛り.includes(label)) 目盛り.push(label);
    // 色は帯にそのまま渡す。 箱が 1 つになっても、 書いた色が消えないようにする
    タスク.push({
      name: a.name,
      title: 箱の題(a),
      label,
      ...(a.tone !== undefined ? { tone: a.tone } : {}),
      ...(a.owner !== undefined ? { owner: a.owner } : {}),
      ...(a.end !== undefined ? { end: a.end } : {}),
    });
  }
  if (目盛りなし.length > 0 && typeof console !== "undefined" && console.warn) {
    console.warn(
      `[dragon] type: gantt で時期を読めない項目があります (帯に載せません): ${目盛りなし.join(", ")}。` +
        ` \`- 設計: "Q1"\` の形で書いてください`,
    );
  }

  // 矢印は依存として読む (`- 設計 -> 実装` = 実装は設計の後)。 帯どうしを結ぶ線は描画側が
  // 依存として描くので、 書いた矢印を捨てずに使う。 居ない名前を指した矢印は伝える
  const タスク名 = new Set(タスク.map((t) => t.name));
  const 依存元 = new Map<string, string>();
  const 居ない: string[] = [];
  const 装飾つき: string[] = [];
  for (const s of doc.flow) {
    if (!タスク名.has(s.from) || !タスク名.has(s.to)) {
      居ない.push(`${s.from} -> ${s.to}`);
      continue;
    }
    依存元.set(s.to, s.from);
    // 帯の依存は「どちらが先か」 だけを持つ。 矢印に書いた文字や色は描けないので伝える
    if (
      (s.label ?? "") !== "" ||
      (s.sub ?? "") !== "" ||
      s.tone !== undefined ||
      s.style !== undefined
    ) {
      装飾つき.push(`${s.from} -> ${s.to}`);
    }
  }
  if (居ない.length > 0 && typeof console !== "undefined" && console.warn) {
    console.warn(
      `[dragon] type: gantt で依存を結べない矢印があります (居ない項目か時期なし): ${居ない.join(", ")}`,
    );
  }
  if (装飾つき.length > 0 && typeof console !== "undefined" && console.warn) {
    console.warn(
      `[dragon] type: gantt の矢印は前後の関係だけを使います (文字 / 色 / 線種は描けません): ${装飾つき.join(", ")}`,
    );
  }

  // 帯の向きの誤りは `console.warn` に出す。 この図種の他の知らせ (時期なし / 依存が結べない /
  // 矢印の飾り) が同じ経路を使っており、揃えないとどれが出るかが書き方で変わる
  const 逆向きを伝える = (_名: string, message: string): void => {
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };

  // 高さは件数から決める。 描画側は 1 行 28 以上 + 行間 20 で積み、 上下に 32 / 44 の余白を取る
  // (`kinds/gantt.tsx`)。 360 の固定だと 8 件目から最後の帯が枠の外に出る (実測 = 8 件で 56 はみ出す)
  const CHART_H = Math.max(360, 48 * タスク.length + 96);

  b.node(`${slugify(doc.title) || "gantt"}-chart`, {
    lane: "gantt",
    stack: 0,
    kind: "gantt-timeline",
    title: doc.title,
    ...図の小見出し(doc),
    w: CHART_W,
    h: CHART_H,
    ganttData: タスク.map((t) => {
      const idx = 目盛り.indexOf(t.label);
      const from = 依存元.get(t.name);
      const 終わり = 終わる位置(t.end, idx, 目盛り, t.name, 逆向きを伝える, doc);
      return {
        id: slugify(t.name) || t.name,
        title: t.title,
        startIdx: idx,
        endIdx: 終わり.idx,
        startLabel: t.label,
        endLabel: 終わり.label ?? t.label,
        ...(t.owner !== undefined ? { owner: t.owner } : {}),
        ...(from !== undefined ? { dependsOn: slugify(from) || from } : {}),
        ...(t.tone !== undefined ? { tone: t.tone } : {}),
      };
    }),
  });

  return b.build();
}

/**
 * クラス図の組み立て。
 *
 * 各クラスを 1 つの箱 (`storage`) にする。 描画側は題 (クラス名) と区切り線と行
 * (項目 / 手続き) を UML のクラス箱として描く。
 *
 * **クラスごとに縦列を 1 本作り、横に並べる** (#1263)。 組立て API 側がそう並べており、
 * 1 本にまとめると同じ内容でも横並びが縦並びになる (実測 = 見本は 3 縦列 450 幅)。
 * 縦列に見出しは付けない = クラスの名前は箱が既に描いており、縦列は並べるための入れ物
 * (`er` / `state` と同じ扱い、#1241)。
 *
 * 箱の種類は `storage` に強制する。 行と小見出しは `applyV05Extensions` が後から載せる。
 *
 * 矢印は継承や保有を表す (`extends` / `aggregates` 等を書き手が説明に書く)。
 */
function compileClass(doc: DslDocument): CdlDiagram {
  /*
   * **組み立て器 (`classDiagram`) に渡す** (#1466)。
   *
   * 以前は箱と矢印を直に組んでいたため、行頭の印・端の塗り・印が付く側・段の配置が
   * 1 つも出なかった = 画面の図と記法の図が別物になっていた。 組み立て器へ渡せば、
   * 意匠の決まり (`CLASS_RELATION_LOOK`) を 1 箇所から引ける。
   */
  const b = classDiagram({ id: slugify(doc.title), topic: doc.title });
  // 登場人物が 0 人なら枠も作らない。 先に作ると中身の無い枠が 1 つ残る (#1096)
  if (doc.actors.length === 0)
    return diagram(slugify(doc.title), { topic: doc.title, type: "class" }).build();

  /*
   * 縦列は `lane:` の順、段は `stack:` で決まる (#1466)。
   *
   * 書かない図は宣言した順に横 1 列 = 従来どおり。 1 つでも書けば格子に置く =
   * **箱の 1 つの辺には関係を 1 本まで** を守るには段が要る。
   */
  const 列番号 = new Map<string, number>();
  for (const a of doc.actors) {
    if (a.lane === undefined) continue;
    if (!列番号.has(a.lane)) 列番号.set(a.lane, 列番号.size);
  }

  for (const a of doc.actors) {
    /*
     * 行を持ち物と振る舞いに割る (#1466)。 **1 行ずつ括弧の有無で見る**。
     *
     * 区切りの行 (`───`) の位置では割らない = 振る舞いしか持たない箱は区切りを書けず、
     * 全部が持ち物に落ちる (実測 = `Auditable` の `audit()` が四角の印で出た)。
     * 区切りの行そのものは、組み立て器が群の間を空の行で作るので捨てる。
     */
    const rows = (a.rows ?? []).filter((r) => !/^[─-]+$/.test(r.trim()));
    const 振る舞い = (r: string): boolean => r.includes("(");
    const attributes = rows.filter((r) => !振る舞い(r));
    const methods = rows.filter(振る舞い);
    b.class({
      id: slugify(a.name),
      title: 箱の題(a),
      ...(attributes.length > 0 ? { attributes: [...attributes] } : {}),
      ...(methods.length > 0 ? { methods: [...methods] } : {}),
      ...(a.eyebrow ? { stereotype: a.eyebrow } : {}),
      ...(a.lane !== undefined ? { col: 列番号.get(a.lane) ?? 0 } : {}),
      ...(a.stack !== undefined ? { row: a.stack } : {}),
    });
  }

  for (const s2 of doc.flow) {
    b.relation({
      from: slugify(s2.from),
      to: slugify(s2.to),
      // 種類を書かない矢印は「使う」 扱い = 端が開いた矢になり、線と印の組が最も素直
      type: s2.relation ?? "uses",
      ...(s2.label ? { label: s2.label } : {}),
      ...(s2.sub ? { cardinality: s2.sub } : {}),
      // 出どころ側の多重度 (#1771)。 engine が出どころの端に添える (cdl#825)
      ...(s2.tailSub ? { tailCardinality: s2.tailSub } : {}),
      ...(s2.tone ? { tone: s2.tone } : {}),
      ...(s2.style ? { style: s2.style } : {}),
      ...(s2.head ? { head: s2.head } : {}),
      ...(s2.headFill ? { headFill: s2.headFill } : {}),
      ...(s2.tailHead ? { tailHead: s2.tailHead } : {}),
    });
  }

  const built = b.build();
  /*
   * 記法が段を書いた図では、組み立て器が作る 1 つの段を捨てる (#1466)。
   *
   * 段の注入 (`injectPhasesFallback`) は「段が 1 つも無い」 図にだけ効く。 組み立て器へ
   * 渡すようにしたことで自動の段が 1 つ付き、書いた段が届かなくなった (実測 = 6 段書いた
   * 図が 1 段で出た)。
   */
  const 書いた段がある = (doc.animate?.phases.length ?? 0) > 0;
  return 書いた段がある ? { ...built, phases: [] } : built;
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
/**
 * 割合の書き方から数値を読む。 読めなければ `null`。
 *
 * 受けるのは `"45%"` / `"45"` / `"45.5%"` と、 前後の空白。 `"四割"` や `"0.45"` のような
 * 別の言い方は読まない = **黙って 0 にすると、 その分だけ欠けた円が「正しい図」 として出る**。
 * 読めなかったことは呼出側が警告に出す。
 */
function parseShareValue(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  if (m === null) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

/**
 * 状態を読む欄かどうか (`{名前}`)。
 *
 * **`{名前}` そのものだけを受ける**。 `{v} 件` のような混ざった形は、描画側が数として
 * 読めず既定値に落ちて印が付くだけになる (`render/payload-binding.ts` は解いた文字列を
 * そのまま数にする)。 書けたのに効かない形を作らない。
 *
 * `%` を付けた形も受けない。 同じ理由で `"45%"` は数に直せるが `"{v}%"` は直せない。
 *
 * 名前に使えるのは英数字と `_` で、読む側 (cdl の `interpolate`) と同じ範囲に合わせる。
 * 決まった accessor (`.sum` 等) は付けてよい。
 */
function parseBoundValue(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const t = raw.trim();
  return /^\{\w+(?:\.(?:length|sum|max|min|avg)|\[\d+\])?\}$/.test(t) ? t : null;
}

/**
 * 図表の数の欄を読む。 数そのものか、状態を読む `{名前}` を返す。
 *
 * 数として解けない `{名前}` は、そのまま図表の中身に渡して描画側が段ごとに解く。
 * 受け取る側の型 (`BoundNumber`) は元から 2 通りを想定している = 入口だけが塞がっていた。
 */
function parseChartValue(raw: string | undefined): number | string | null {
  const n = parseShareValue(raw);
  if (n !== null) return n;
  return parseBoundValue(raw);
}

/** 状態を読む欄が指している名前 (`{v.sum}` なら `v`)。 欄でなければ null */
function 参照する名前(value: number | string | null): string | null {
  if (typeof value !== "string") return null;
  const m = value.match(/^\{(\w+)/);
  return m ? m[1]! : null;
}

/**
 * 棒 / 折れ線の組立て。 円グラフと **入力の形が同じ**なので 1 つにまとめる。
 *
 * 3 種とも `- 名前: "45"` の 1 行 1 値で書く。 違うのは描画側の種別と、 値の意味だけ。
 *
 * | 型 | 種別 | 値の意味 |
 * |---|---|---|
 * | `pie` | `chart-pie` | 全体に対する取り分 |
 * | `bar` | `chart-bar` | 棒の高さ (単位は問わない) |
 * | `line` | `chart-line` | 線の高さ。 **書いた順に並ぶ** |
 *
 * 値を読めない項目は載せず、 まとめて警告に出す。 **黙って 0 にしない** = その項目だけ欠けた
 * 図が「正しい図」 として出てしまうため。
 *
 * 矢印は描けない。 書かれていたら警告に出して捨てる (「書いたのに効かない」 を残さない)。
 */
function compileValueChart(
  doc: DslDocument,
  型: "pie" | "bar" | "line" | "gauge" | "radial" | "stat" | "waffle" | "stacked" | "slope",
  kind:
    | "chart-pie"
    | "chart-bar"
    | "chart-line"
    | "chart-gauge"
    | "chart-radial"
    | "chart-stat"
    | "chart-waffle"
    | "chart-stacked-bar"
    | "chart-slope",
  onNotice?: (notice: CompileNotice) => void,
): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "chart" });
  const CHART_W = 640;
  // **高さは型で違い、 格子に載せる**。 描画側 (`cdl` の `chart()` preset) は `pie` を 320、
  // 棒と折れ線を 360 とした上で **16 の倍数へ切り上げる** (360 は 16 で割り切れないので 368)。
  // 切り上げないと下端が格子から外れ、 全図で位置の警告が出る (review 指摘)
  // 半円と弧は縦を使わないので円と同じ 320。 描画側 (`cdl` の `chart()` preset) が
  // `pie` / `gauge` / `radial` を 320、棒と折れ線を 360 とし、16 の倍数へ切り上げる
  // 縦に余白が要らない型。 描画側 (`cdl` の `chart()` preset) と揃える。
  // 半円 / 弧 / 割合の印 は縦を使わず、値 1 つを大きく示す図も縦に伸びない
  const 低い型 =
    型 === "pie" || 型 === "gauge" || 型 === "radial" || 型 === "waffle" || 型 === "stat";
  const CHART_H = 低い型 ? 320 : 368;
  b.lane("chart", { width: CHART_W + 64 });

  const data: NonNullable<CdlDiagram["nodes"][number]["chartData"]> = [];
  const 読めない: string[] = [];
  const 前が読めない: string[] = [];
  let 前が読めない行 = 0;
  const 未宣言: string[] = [];
  let 未宣言行 = 0;
  const 参照できる = 数の欄から参照できる名前(doc);
  // 最初に読めなかった行を覚える。 画面が案内できるようにする
  let 読めない行 = 0;
  for (const a of doc.actors) {
    // 値の置き場所は記法で 2 通りある。 略記 (`- TypeScript: "45%"`) は説明文に、
    // 縦書きの map (`- SliceA: { kind: card, value: "30%" }`) は値に入る。 両方を読む
    const value = parseChartValue(a.value ?? a.subtitle);
    // **負を受けるのは折れ線と傾き図だけ**。 どちらも増減を追う図なので、気温や損益のように
    // 0 を跨ぐ値が来る。 円は取り分、 棒は高さで、 どちらも負に意味が無い (review 指摘)。
    // 状態を読む欄 (`{名前}`) は書いた時点で符号が決まらないため、この検査を通す
    if (
      value === null ||
      (typeof value === "number" && value < 0 && 型 !== "line" && 型 !== "slope")
    ) {
      // `pos` を持たない経路がある (JSON 経路で組み立てた actor)。 無ければ 0 のまま
      if (読めない.length === 0) 読めない行 = a.pos?.line ?? 0;
      読めない.push(a.name);
      continue;
    }
    // 数にならない参照は落とす。 通すと図は出るのに数が入っていない状態になる
    const 名前 = 参照する名前(value);
    if (名前 !== null && !参照できる.has(名前)) {
      if (未宣言.length === 0) 未宣言行 = a.pos?.line ?? 0;
      未宣言.push(a.name);
      continue;
    }
    // 色はそのまま渡す。 箱が 1 つになっても、 書いた色が消えないようにする
    // 前の時点の値 (#1450)。 読めない形は黙って捨てず知らせる = 書いたのに 2 本目の帯が
    // 出ない状態になり、手掛かりが残らない
    const 前 = a.previous === undefined ? null : parseChartValue(a.previous);
    if (a.previous !== undefined && 前 === null) {
      if (前が読めない.length === 0) 前が読めない行 = a.pos?.line ?? 0;
      前が読めない.push(a.name);
    }
    data.push({
      label: 箱の題(a),
      value,
      ...(前 === null ? {} : { previous: 前 }),
      ...(a.tone !== undefined ? { tone: a.tone } : {}),
    });
  }
  // 案内の言葉は型ごとに変える。 共通化した時に `pie` の「割合 / 円 / 45%」 が「値 / 図 / 45」 に
  // 薄まり、 既存の案内が後退した (review 指摘)。 何を書けばよいかは型ごとに違う
  // 何を書けばよいかは型ごとに違う。 まとめると「割合 / 円 / 45%」 が「値 / 図 / 45」 に薄まる
  //
  // **表で持つ**。 三項の連鎖にすると、型が増えるたびに深さが増え、最後の枝が
  // 「それ以外」 になるため型検査が新しい型の漏れを教えてくれない
  const 語の表: Record<typeof 型, { 量: string; 図: string; 例: string }> = {
    pie: { 量: "割合", 図: "円", 例: '"45%"' },
    bar: { 量: "値", 図: "棒", 例: '"420"' },
    line: { 量: "値", 図: "折れ線", 例: '"180"' },
    gauge: { 量: "値", 図: "半円", 例: '"680"' },
    radial: { 量: "値", 図: "弧", 例: '"72"' },
    stat: { 量: "値", 図: "大きな数字", 例: '"1200"' },
    waffle: { 量: "割合", 図: "100 個の印", 例: '"45%"' },
    stacked: { 量: "内訳の値", 図: "帯", 例: '"320"' },
    slope: { 量: "値", 図: "傾き図", 例: '"320"' },
  };
  const 語 = 語の表[型];

  /**
   * 利用者に伝える。 **`console.warn` だけにしない**。 エディタは受け取った notice を画面に
   * 出す経路を持っており、 log だけだと項目が消えた理由が誰にも見えない (review 指摘)。
   */
  const 伝える = (種類: CompileNotice["kind"], 名前: string, message: string, line = 0) => {
    onNotice?.({ kind: 種類, actor: 名前, line, message });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };

  if (読めない.length > 0) {
    伝える(
      "chart-value-unreadable",
      読めない[0]!,
      `type: ${型} で${語.量}を読めない項目があります (${語.図}に載せません): ${読めない.join(", ")}。` +
        ` \`- 名前: ${語.例}\` の形で書いてください`,
      読めない行,
    );
  }
  if (未宣言.length > 0) {
    伝える(
      "chart-value-unreadable",
      未宣言[0]!,
      `type: ${型} で数にならない値を参照した項目があります (${語.図}に載せません): ${未宣言.join(", ")}。` +
        ` \`states:\` にその名前を数で書いてください`,
      未宣言行,
    );
  }
  if (前が読めない.length > 0) {
    伝える(
      "chart-value-unreadable",
      前が読めない[0]!,
      `type: ${型} で前の時点の値を読めない項目があります (前の値を使いません): ${前が読めない.join(", ")}。` +
        " `- 名前: { value: " + 語.例 + ", previous: " + 語.例 + " }` の形で書いてください",
      前が読めない行,
    );
  }
  if (doc.flow.length > 0) {
    伝える(
      "chart-edge-dropped",
      doc.flow[0]?.from ?? "",
      `type: ${型} では矢印を描けません (${doc.flow.length} 本を無視しました)。` +
        ` 関係を描くなら type: flow を使ってください`,
      doc.flow[0]?.pos?.line ?? 0,
    );
  }

  b.node(`${slugify(doc.title) || 型}-chart`, {
    lane: "chart",
    stack: 0,
    kind,
    title: doc.title,
    ...図の小見出し(doc),
    w: CHART_W,
    h: CHART_H,
    chartData: data,
  });

  return b.build();
}

/**
 * 図表 4 種の組立て (#1154 段 2 / 段 3)。
 *
 * 描画側に 1 node で渡す形は値で描く 3 型と同じ。 違うのは **actor から何を読むか**。
 *
 * | 型 | 読むもの | 書き方 |
 * |---|---|---|
 * | `funnel` | 数 | `- 訪問: "12000"` |
 * | `tree` | 親子 | `flow` の矢印 (`親 -> 子`) |
 * | `journey` | 気持ち | `- 登録: "不満"` |
 * | `quadrant` | どの区画か | `- 重複削除: "左上"` |

 * `tree` だけ `flow` を読む = 親子は 2 つの名前の関係で、 1 行 1 値では書けないため。
 */

/**
 * 図表の大きさ。 **格子 (16) の倍数にする**。
 *
 * 描画側 (`cdl` の `chart()` preset) は高さを 16 の倍数へ切り上げる。 揃えないと下端が格子から
 * 外れ、 正しい記法でも位置の警告が出る (review 指摘、 360 のまま 5 型が該当していた)。
 */
/**
 * 図表の箱の大きさ (#1260)。
 *
 * **組立て API と同じ値を使う**。 別の値にすると、同じ内容を書いても描いた図の大きさが変わる
 * (実測 = 記法の `funnel` は 640x368、組立て API は 560x480 で、描いた図の viewBox が
 * 785x488 対 712x600 になっていた)。
 *
 * 組立て API 側は中身の件数で変えない (実測 = 2 / 4 / 8 件のどれでも同じ値)。 そのため
 * こちらも定数で持つ。 `gantt` だけは件数で高さを変える = 8 件目から最後の帯が枠の外に
 * 出るため (`compileGantt` の実測)、組立て API の固定 360 より正しい。
 */
const 図表の大きさ = {
  funnel: { w: 560, h: 480 },
  tree: { w: 720, h: 480 },
  mind: { w: 720, h: 480 },
  journey: { w: 720, h: 480 },
  quadrant: { w: 640, h: 480 },
} as const;

/** 気持ちの言葉。 書きやすさのため日本語で受ける。 */
//
// **`Map` で持つ**。 plain object だと `__proto__` / `constructor` が親から引けてしまい、
// 書ける語の一覧に無い入力が値として通る (review 指摘)。 型は付いていても中身は object や
// function になり、 描画側へそのまま流れる。
const 気持ち = new Map<string, "delighted" | "happy" | "neutral" | "frustrated" | "angry">([
  ["最高", "delighted"],
  ["満足", "happy"],
  ["普通", "neutral"],
  ["不満", "frustrated"],
  ["怒り", "angry"],
]);

/** 区画の言葉。 縦横の位置をそのまま書く。 */
// 同上の理由で `Map`。
const 区画 = new Map<string, "topLeft" | "topRight" | "bottomLeft" | "bottomRight">([
  ["左上", "topLeft"],
  ["右上", "topRight"],
  ["左下", "bottomLeft"],
  ["右下", "bottomRight"],
]);

/**
 * 図表の欄が `{名前}` で読む値を、**1 か所で** 確かめる (#1200)。
 *
 * 図表には数の欄 (割合 / 段の人数) と語の欄 (気持ち / 区画) があり、どちらも `{名前}` で
 * 状態を読める。 確かめることは欄の種類で違うが、**土台は同じ** = 同じ名前を 2 回書いた時に
 * 後ろが効くこと、段で状態に入る値 (切り替え / 補間) も見ること、の 2 つ。
 *
 * #1198 と #1201 では欄ごとに検査を書き足しており、同じ土台を 3 度書いていた。 3 度とも
 * review で同じ形の穴を指摘されている (最初の宣言で判定する / 段で入る値を見落とす)。
 * 土台を 1 つにして、欄ごとの違いだけを外から渡す。
 *
 * ## 確かめること
 *
 * | 欄 | 通す値 | 段で入る値 |
 * |---|---|---|
 * | 数 | 数として読める (空文字は弾く、`Number("")` が 0 を返すため) | 切り替え先が数 |
 * | 語 | 語表にある語 | 切り替え先が語表にあり、補間されない (補間の行き先は数) |
 *
 * 自動で決まる値 (`values:`) は式の評価結果で必ず数になるため、数の欄からは参照できて
 * 語の欄からは参照できない。 式そのものの不備 (語を読む / 名前が無い) は
 * `value-unresolved` の警告が別に出る (実測で確認済)。
 *
 * ## 責務境界 (#1198 / #1200)
 *
 * **見るのは組み立ての時点で決まっている範囲だけ**。 記法の値は実行時に決まるため、ここで
 * 全部を判定しようとすると式の評価を組み立て側で再現することになる。 実際に #1199 の review で
 * 4 round 続けて同じ形の指摘が出て収束せず、境界を決めて切り分けた (穴を 1 つ塞ぐと別の形が
 * 出る = 塞ぎ方ではなく責務の置き場所の問題だった)。
 *
 * | 見る | 見ない | 見ない理由 |
 * |---|---|---|
 * | 名前が宣言されているか | 段の行き先が負になる形 | 描画側が問題なく描く (負の大きさも `NaN` も出ないことを実測) |
 * | 宣言の時点で読める値か | 式が実行時に返す値 | 式の不備は `value-unresolved` の警告が別に出る (実測で確認) |
 * | 段で状態に入る値 | | |
 *
 * 見ない範囲は描画側が受け持つ = 解けない値は既定値で描いて `data-cdl-unresolved` を付ける。
 */
function 図表の欄から参照できる名前(
  doc: DslDocument,
  欄: {
    読めるか: (v: number | string) => boolean;
    補間で壊れるか: boolean;
    自動の値を許すか: boolean;
  },
): Set<string> {
  // 同じ名前を 2 回宣言した時は後ろが効く。 描画側が後の宣言を有効値として扱うため、
  // 前の宣言で判定すると「読めると判定したのに読めない値が入る」 状態になる (実測)
  const 実効 = new Map<string, number | string>();
  for (const s of doc.animate?.states ?? []) 実効.set(s.name, s.initial);

  const 壊れる = new Set<string>();
  for (const p of doc.animate?.phases ?? []) {
    for (const st of p.sets ?? []) if (!欄.読めるか(st.value)) 壊れる.add(st.state);
    if (欄.補間で壊れるか) for (const tw of p.tweens ?? []) 壊れる.add(tw.state);
  }

  const out = new Set<string>();
  for (const [名前, 値] of 実効) {
    if (!欄.読めるか(値)) continue;
    if (壊れる.has(名前)) continue;
    out.add(名前);
  }
  if (欄.自動の値を許すか) for (const v of doc.values ?? []) out.add(v.name);
  return out;
}

/** 数の欄が読める値か。 空文字と空白だけは弾く (`Number("")` は 0 を返す) */
function 数として読めるか(v: number | string): boolean {
  if (typeof v === "number") return Number.isFinite(v);
  const t = v.trim();
  if (t === "") return false;
  return Number.isFinite(Number(t));
}

function 数の欄から参照できる名前(doc: DslDocument): Set<string> {
  return 図表の欄から参照できる名前(doc, {
    読めるか: 数として読めるか,
    // 補間の行き先は数なので、数の欄では壊れない
    補間で壊れるか: false,
    自動の値を許すか: true,
  });
}

function 語の欄から参照できる名前(doc: DslDocument, 語表: Map<string, string>): Set<string> {
  return 図表の欄から参照できる名前(doc, {
    読めるか: (v) => 語表.has(String(v).trim()),
    // 補間の行き先は数。 語の欄が読む状態を補間すると、その段で語が数に変わる
    補間で壊れるか: true,
    // 式の評価結果は数になるため、語の欄からは読めない
    自動の値を許すか: false,
  });
}

/**
 * 記法の語で書いた状態を、図の語へ直す (#1201)。
 *
 * 語の欄が `{名前}` を持つとき、その名前が指す状態には記法の語 (「不満」 「左上」) が
 * 入っている。 描画側が知っているのは図の語 (`frustrated` / `topLeft`) なので、ここで直す。
 *
 * **記法の語彙に engine の内部語を混ぜないため**にこの形にしている。 状態にも図の語を
 * 書かせる形なら直す処理は要らないが、記法の語と内部語が同じ file に並ぶことになる。
 *
 * 直すのは語の欄から参照されている名前だけ。 同じ名前を数の欄からも参照している図では
 * 直さない (数として読めなくなるため)。
 *
 * **この「数の欄からも参照している」 分岐は、到達する入力を今は作れない**。 記法の図は
 * 1 つの型しか持たず、語の欄を持つ型 (`journey` / `quadrant`) と数の欄を持つ型
 * (`bar` / `line` / `pie` / `funnel`) は同時に現れないため。 変異試験でもこの行を外して
 * 検査が落ちないことを確かめた = 覆えていない。 見本を重ねる経路で両方の欄を持つ箱が
 * できた時のために残す。
 */
function 語の状態を図の語へ直す(diagram: CdlDiagram): void {
  const 対象 = new Map<string, Map<string, string>>();
  const 数の欄から = new Set<string>();
  const 拾う = (v: unknown, 語表: Map<string, string>) => {
    const m = typeof v === "string" ? v.match(/^\{(\w+)/) : null;
    if (m) 対象.set(m[1]!, 語表);
  };
  for (const n of diagram.nodes) {
    for (const st of n.journeyData ?? []) 拾う(st.emotion, 気持ち);
    for (const it of n.quadrantData?.items ?? []) 拾う(it.quadrant, 区画);
    for (const d of n.chartData ?? []) {
      const m = typeof d.value === "string" ? d.value.match(/^\{(\w+)/) : null;
      if (m) 数の欄から.add(m[1]!);
    }
    for (const f of n.funnelData ?? []) {
      const m = typeof f.count === "string" ? f.count.match(/^\{(\w+)/) : null;
      if (m) 数の欄から.add(m[1]!);
    }
  }
  if (対象.size === 0) return;

  const 直す = (名前: string, 値: string | number): string | number => {
    const 語表 = 対象.get(名前);
    if (!語表 || 数の欄から.has(名前)) return 値;
    return 語表.get(String(値).trim()) ?? 値;
  };
  for (const s of diagram.states) s.initial = 直す(s.id, s.initial);
  for (const p of diagram.phases) {
    for (const st of p.sets) st.value = 直す(st.stateId, st.value);
  }
}

function compileFunnel(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "funnel" });
  const { w: W, h: H } = 図表の大きさ.funnel;
  b.lane("chart", { width: W + 64 });
  const data: NonNullable<CdlDiagram["nodes"][number]["funnelData"]> = [];
  const 読めない: string[] = [];
  const 未宣言: string[] = [];
  const 参照できる = 数の欄から参照できる名前(doc);
  for (const a of doc.actors) {
    const v = parseChartValue(a.value ?? a.subtitle);
    // 段の数なので負に意味が無い (状態を読む欄は符号が決まらないので通す)
    if (v === null || (typeof v === "number" && v < 0)) {
      読めない.push(a.name);
      continue;
    }
    // 数にならない参照は落とす (棒 / 折れ線 / 円と同じ扱い)
    const 名前 = 参照する名前(v);
    if (名前 !== null && !参照できる.has(名前)) {
      未宣言.push(a.name);
      continue;
    }
    data.push({ id: slugify(a.name), title: 箱の題(a), count: v });
  }
  if (未宣言.length > 0) {
    const m3 = `type: funnel で数にならない値を参照した項目があります (段に載せません): ${未宣言.join(", ")}。 \`states:\` にその名前を数で書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 未宣言[0]!, line: 0, message: m3 });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m3}`);
  }
  if (読めない.length > 0) {
    const m = `type: funnel で数を読めない項目があります (段に載せません): ${読めない.join(", ")}。 \`- 訪問: "12000"\` の形で書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 読めない[0]!, line: 0, message: m });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m}`);
  }
  // 矢印は描けない。 書かれていたら伝える (黙って捨てると「書いたのに効かない」 が残る)
  if (doc.flow.length > 0) {
    const m2 = `type: funnel では矢印を描けません (${doc.flow.length} 本を無視しました)。 関係を描くなら type: flow を使ってください`;
    onNotice?.({
      kind: "chart-edge-dropped",
      actor: doc.flow[0]?.from ?? "",
      line: doc.flow[0]?.pos?.line ?? 0,
      message: m2,
    });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m2}`);
  }
  b.node(`${slugify(doc.title) || "funnel"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "funnel-stages",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    funnelData: data,
  });
  return b.build();
}

/**
 * 矢印から親子を決める (#1251)。
 *
 * 矢印の先が子で、 どこからも指されない名前が根になる。 `type: tree` と `type: mind` が
 * 同じ規則を使う = 同じ本文を書いた時に、 図種を変えただけで親子の解釈が変わらないようにする。
 *
 * **黙って上書きしない**。 同じ子に 2 本来たら後勝ちで消えるし、 書いていない名前を指した
 * 矢印は無い親を作る。 どちらも図が静かに変わるので伝える。
 *
 * 親を辿って自分に戻る形は木にならないため、 その枝を切って伝える。
 */
function 矢印から親を決める(
  doc: DslDocument,
  図種: "tree" | "mind",
  名前: ReadonlySet<string>,
  伝える: (名: string, message: string, line?: number) => void,
): Map<string, string> {
  const 親 = new Map<string, string>();
  for (const f of doc.flow) {
    const 子 = slugify(f.to);
    const 親名 = slugify(f.from);
    if (!名前.has(親名)) {
      伝える(
        f.from,
        `type: ${図種} で書いていない名前を親にしています: ${f.from} -> ${f.to}`,
        f.pos?.line ?? 0,
      );
      continue;
    }
    // 子の側も見る。 書いていない名前への矢印は、 黙って捨てると図から関係が消える
    if (!名前.has(子)) {
      伝える(
        f.to,
        `type: ${図種} で書いていない名前を子にしています: ${f.from} -> ${f.to}`,
        f.pos?.line ?? 0,
      );
      continue;
    }
    if (子 === 親名) {
      伝える(f.to, `type: ${図種} で自分を親にしています: ${f.to}`, f.pos?.line ?? 0);
      continue;
    }
    const 既存 = 親.get(子);
    if (既存 !== undefined && 既存 !== 親名) {
      伝える(
        f.to,
        `type: ${図種} で ${f.to} に親が 2 つあります (後の ${f.from} は使いません)`,
        f.pos?.line ?? 0,
      );
      continue;
    }
    親.set(子, 親名);
  }
  // 親を辿って自分に戻る形は木にならない。 その枝を切って伝える
  for (const 子 of [...親.keys()]) {
    const 見た = new Set<string>([子]);
    let p2 = 親.get(子);
    while (p2 !== undefined) {
      if (見た.has(p2)) {
        伝える(子, `type: ${図種} で親を辿ると輪になります (${子} の親を外しました)`);
        親.delete(子);
        break;
      }
      見た.add(p2);
      p2 = 親.get(p2);
    }
  }
  return 親;
}

function compileTree(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "tree" });
  const { w: W, h: H } = 図表の大きさ.tree;
  b.lane("chart", { width: W + 64 });
  // **同じ slug になる名前を先に見る**。 違う名前が同じ id に潰れると、 自分を親にしたと
  // 誤判定したり、 同じ id の要素が 2 つできたりする (review 指摘)
  const slug別 = new Map<string, string[]>();
  for (const a of doc.actors) {
    const k = slugify(a.name);
    slug別.set(k, [...(slug別.get(k) ?? []), a.name]);
  }
  const 名前 = new Set(slug別.keys());
  // **行番号を渡す**。 `DslActor` / `DslStep` は `pos.line` を持つので遡れる。 前回「持てない」
  // と書いたのは誤り (review 指摘)。 0 にすると画面が問題の行を案内できない
  const 伝える = (名: string, message: string, line = 0) => {
    onNotice?.({ kind: "chart-value-unreadable", actor: 名, line, message });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };
  for (const [k, 群] of slug別) {
    if (群.length > 1) {
      伝える(
        群[0]!,
        `type: tree で ${群.join(" / ")} が同じ id (${k}) になります。 名前を変えてください`,
      );
    }
  }
  const 親 = 矢印から親を決める(doc, "tree", 名前, 伝える);
  const data: NonNullable<CdlDiagram["nodes"][number]["treeData"]> = doc.actors.map((a) => {
    const id = slugify(a.name);
    const p3 = 親.get(id);
    // 木も放射と同じく名前と補足を分けて渡す (#1332)。 分けないと補足が捨てられ、
    // 書いた文字が図に出ない
    return { id, ...放射に出す文字(a), ...(p3 !== undefined ? { parent: p3 } : {}) };
  });
  b.node(`${slugify(doc.title) || "tree"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "tree-hierarchy",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    treeData: data,
  });
  return b.build();
}

/**
 * 体験の道筋の段に添える欄 (#1251)。
 *
 * 書かなければ項目ごと落とす = `undefined` を明示して渡すと、 組立て側が「空を書いた」 と
 * 区別できなくなる (`図の小見出し` と同じ理由)。
 */
function 道筋の欄(a: DslActor): { touchpoint?: string; opportunity?: string } {
  return {
    ...(a.touchpoint !== undefined ? { touchpoint: a.touchpoint } : {}),
    ...(a.opportunity !== undefined ? { opportunity: a.opportunity } : {}),
  };
}

/**
 * 体験の道筋の欄を、 それを描けない図種で書いた時に伝える (#1251)。
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
        message: `"${truncateForMessage(a.name)}" に書いた ${道筋.join(" / ")} は効きません (type: ${doc.type} には体験の道筋の欄がありません)`,
        hint: "体験の道筋を描くなら type: journey を使ってください",
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

function compileJourney(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "journey" });
  const { w: W, h: H } = 図表の大きさ.journey;
  b.lane("chart", { width: W + 64 });
  const data: NonNullable<CdlDiagram["nodes"][number]["journeyData"]> = [];
  const 読めない: string[] = [];
  const 参照できる = 語の欄から参照できる名前(doc, 気持ち);
  for (const a of doc.actors) {
    const 語 = (a.value ?? a.subtitle ?? "").trim();
    // 状態を読む欄はそのまま渡す。 指す先の語は `語の状態を図の語へ直す` が図の語に直す
    const 参照 = 語.match(/^\{(\w+)\}$/);
    if (参照) {
      if (!参照できる.has(参照[1]!)) {
        読めない.push(a.name);
        continue;
      }
      data.push({ id: slugify(a.name), title: 箱の題(a), emotion: 語 as never, ...道筋の欄(a) });
      continue;
    }
    const e = 気持ち.get(語);
    if (e === undefined) {
      読めない.push(a.name);
      continue;
    }
    data.push({ id: slugify(a.name), title: 箱の題(a), emotion: e, ...道筋の欄(a) });
  }
  if (読めない.length > 0) {
    const m = `type: journey で気持ちを読めない項目があります (道筋に載せません): ${読めない.join(", ")}。 \`- 登録: "不満"\` の形で、 ${[...気持ち.keys()].join(" / ")} のどれかを書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 読めない[0]!, line: 0, message: m });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m}`);
  }
  // 矢印は描けない。 書かれていたら伝える (黙って捨てると「書いたのに効かない」 が残る)
  if (doc.flow.length > 0) {
    const m2 = `type: journey では矢印を描けません (${doc.flow.length} 本を無視しました)。 関係を描くなら type: flow を使ってください`;
    onNotice?.({
      kind: "chart-edge-dropped",
      actor: doc.flow[0]?.from ?? "",
      line: doc.flow[0]?.pos?.line ?? 0,
      message: m2,
    });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m2}`);
  }
  b.node(`${slugify(doc.title) || "journey"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "journey-map",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    journeyData: data,
  });
  return b.build();
}

/** 軸を書かなかった時の名前。 何の軸か分からないため、位置をそのまま出す */
const 軸の既定 = {
  xAxis: { left: "小さい", right: "大きい" },
  yAxis: { bottom: "小さい", top: "大きい" },
  quadrantLabels: { topLeft: "左上", topRight: "右上", bottomLeft: "左下", bottomRight: "右下" },
} as const;

/**
 * 2 軸で仕分ける図の軸と区画の名前を決める (#1251)。
 *
 * `axes:` を書かなければ従来どおり位置の名前 (`左上` 等) を出す = 既に描いてある図が動かない。
 *
 * 書いたら区画の名前は **軸の名前から決める** (`{上} × {右}`)。 組立て API 側が同じ規則で
 * 導いており (実測 = `xAxis: {left: "L", right: "R"}` / `yAxis: {bottom: "B", top: "T"}` で
 * `topLeft: "T × L"`)、 別の規則にすると同じ内容を書いても図が食い違う。
 *
 * 片側だけ書いた形では、書かなかった側は既定のままにする。 空文字を渡すと名前の無い軸が描かれる。
 */
function 軸と区画の名前(doc: DslDocument): {
  xAxis: { left: string; right: string };
  yAxis: { bottom: string; top: string };
  quadrantLabels: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
} {
  if (doc.axes === undefined) return 軸の既定;
  const left = doc.axes.x?.left ?? 軸の既定.xAxis.left;
  const right = doc.axes.x?.right ?? 軸の既定.xAxis.right;
  const bottom = doc.axes.y?.bottom ?? 軸の既定.yAxis.bottom;
  const top = doc.axes.y?.top ?? 軸の既定.yAxis.top;
  return {
    xAxis: { left, right },
    yAxis: { bottom, top },
    quadrantLabels: {
      topLeft: `${top} × ${left}`,
      topRight: `${top} × ${right}`,
      bottomLeft: `${bottom} × ${left}`,
      bottomRight: `${bottom} × ${right}`,
    },
  };
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

function compileQuadrant(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "quadrant" });
  const { w: W, h: H } = 図表の大きさ.quadrant;
  b.lane("chart", { width: W + 64 });
  const items: NonNullable<CdlDiagram["nodes"][number]["quadrantData"]>["items"] = [];
  const 読めない: string[] = [];
  const 参照できる = 語の欄から参照できる名前(doc, 区画);
  for (const a of doc.actors) {
    const 語 = (a.value ?? a.subtitle ?? "").trim();
    const 参照 = 語.match(/^\{(\w+)\}$/);
    if (参照) {
      if (!参照できる.has(参照[1]!)) {
        読めない.push(a.name);
        continue;
      }
      items.push({ id: slugify(a.name), title: 箱の題(a), quadrant: 語 as never });
      continue;
    }
    const q = 区画.get(語);
    if (q === undefined) {
      読めない.push(a.name);
      continue;
    }
    items.push({ id: slugify(a.name), title: 箱の題(a), quadrant: q });
  }
  if (読めない.length > 0) {
    const m = `type: quadrant で区画を読めない項目があります (図に載せません): ${読めない.join(", ")}。 \`- 重複削除: "左上"\` の形で、 ${[...区画.keys()].join(" / ")} のどれかを書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 読めない[0]!, line: 0, message: m });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m}`);
  }
  // 矢印は描けない。 書かれていたら伝える (黙って捨てると「書いたのに効かない」 が残る)
  if (doc.flow.length > 0) {
    const m2 = `type: quadrant では矢印を描けません (${doc.flow.length} 本を無視しました)。 関係を描くなら type: flow を使ってください`;
    onNotice?.({
      kind: "chart-edge-dropped",
      actor: doc.flow[0]?.from ?? "",
      line: doc.flow[0]?.pos?.line ?? 0,
      message: m2,
    });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m2}`);
  }
  b.node(`${slugify(doc.title) || "quadrant"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "quadrant-matrix",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    quadrantData: { ...軸と区画の名前(doc), items },
  });
  return b.build();
}

/**
 * 段の目印を読み取る。 目印と、 それを落とした残りの説明を返す (#1098)。
 *
 * 目印 (`L1` / `L2` / `L3`) は「どの段に置くか」 を組み立てに伝えるためのもので、 読む人には
 * 意味を持たない。 段の名前は枠のラベル (`全体の見取り図` 等) が出すので二重でもある。
 * 読み取ったら説明から落とす = 書いた人が説明として書いた部分だけが箱に出る。
 *
 * | 書いた文字 | 段 | 残る説明 |
 * |---|---|---|
 * | `"L1"` | 1 | (無し) |
 * | `"L2: container"` | 2 | `container` |
 * | `"L1 利用者"` | 1 | `利用者` |
 * | `"利用者"` | 1 (既定) | `利用者` |
 *
 * 目印の直後の区切り (`:` と空白) も落とす。 残さないと `: container` のように区切りだけが
 * 先頭に残る。 `L2X` のような別の語を目印と読み違えないよう、 数字の直後が英数字でないことを
 * 条件にする。
 */
function 段を読み取る(subtitle: string | undefined): { 段: number; 説明: string | undefined } {
  const 元 = (subtitle ?? "").trim();
  const m = 元.match(/^L([123])(?![0-9A-Za-z])/i);
  if (m === null) return { 段: 1, 説明: subtitle };
  // 目印と、 その直後の区切り (`:` / 全角コロン / 空白) を落とす
  const 残り = 元
    .slice(m[0].length)
    .replace(/^[:：\s]+/, "")
    .trim();
  return { 段: Number(m[1]), 説明: 残り === "" ? undefined : 残り };
}

/**
 * C4 preset (C4 model 階層 system context 専用 layout)
 *
 * 設計 ... actor.subtitle の先頭に "L1" / "L2" / "L3" を置き、 階層 lane を生成。
 * - L1 = 全体の見取り図 (C4 model の System Context)
 * - L2 = 動かす単位 (同 Container = 単体で動かす application や保管庫)
 * - L3 = 部品 (同 Component)
 *
 * 実装 ... **中身のある段だけ** lane を作り、 使う段を左から順に詰めて横並び (contain: true で
 * 囲む) 配置する。 3 lane を常に作ると中身のない枠が画面に残り、 描かれ損ねたように見える (#1078)。
 * 同 lane 内の actor は内部 stack で縦並びになる (横並びは layout 制約上不可、
 * 段の区別が視覚的に最重要)。 subtitle marker 未指定なら L1 fallback。
 *
 * flow ... actor 間の関係を edge で表現。
 */
function compileC4(doc: DslDocument): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "infrastructure" });
  const LANE_W = 400;
  const LANE_GAP = 80;
  // 段の名前は **枠に描く字** で、記法に打ち込む識別子ではない (#1886)。 打ち込む字は目印
  // (`L1` / `L2` / `L3`) の側で、そちらは綴りを変えない
  const 段の名前: Record<number, string> = { 1: "全体の見取り図", 2: "動かす単位", 3: "部品" };

  // 段は **先頭一致** で読み、 読んだ目印は説明から落とす (`段を読み取る` の説明を参照)
  const 割当 = doc.actors.map((a, idx) => {
    const { 段, 説明 } = 段を読み取る(a.subtitle);
    return { 段, 説明, id: slugify(a.name) || `n${idx}`, actor: a };
  });

  // **中身のある段だけ枠を作る**。 3 段を必ず作ると、 書いていない段が空の点線枠として残り、
  // 見た人には「何かが描かれ損ねた」 ようにしか見えない
  const 使う段 = [1, 2, 3].filter((lv) => 割当.some((x) => x.段 === lv));
  使う段.forEach((lv, i) => {
    b.lane(`c4-l${lv}`, {
      // 空の段を飛ばした分だけ左に詰める。 飛ばした位置に隙間を残すと、 やはり
      // 「何かが抜けている」 ように見える
      x: i * (LANE_W + LANE_GAP),
      width: LANE_W,
      label: 段の名前[lv]!,
      contain: true,
    });
  });

  const stackPerLane: Record<string, number> = { "c4-l1": 0, "c4-l2": 0, "c4-l3": 0 };
  for (const x of 割当) {
    const lid = `c4-l${x.段}`;
    const stack = stackPerLane[lid]!;
    stackPerLane[lid] = stack + 1;
    b.node(x.id, {
      lane: lid,
      stack,
      kind: 描ける種別(x.actor.kind),
      title: x.actor.name,
    });
  }

  for (const s of doc.flow) {
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    b.edge(fromId, toId, {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),

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
/**
 * 記法の `type: mind` を engine の `mind-map` 種別に寄せる (#1177)。
 *
 * 以前は `card` を 3 列 (`mind-left` / `mind-center` / `mind-right`) に並べる別実装で、
 * engine の `mind-map` を使っていなかった。 そのため 2 つの穴があった。
 *
 * | 穴 | 中身 |
 * |---|---|
 * | 枝の親を見る規則が届かない | `ruleMindMapParentReference` は `kind === "mind-map"` かつ `mindData` を持つ node にしか当たらない |
 * | `SINGLE_BOX_KINDS` の `mind-map` が到達しない | 一覧に載っているのに記法から辿り着けない項目として残る |
 *
 * **枝の親は書けない**。 記法の `actors` は「1 つ目が根、 残りが枝」 の並びで、 `parent` を
 * 書く場所が無い。 全ての枝を根の直下に置く。 親子を矢印で書く形は `type: tree` が持っており、
 * `mind` は簡便形として別に残す (Issue の 実装しない条件)。
 *
 * したがって **矢印は描けない**。 書かれていたら伝える = 黙って捨てると「書いたのに効かない」
 * が残る (`type: journey` / `type: quadrant` と同じ扱い)。
 *
 * 絵は変わる (3 列の箱 → 中心から放射)。 破壊的変更として `CHANGELOG` に記録している。
 */
/**
 * 1 箱で描く放射が **描ける欄**。 これ以外は書いても出ない (#1177 Round 3)。
 *
 * 数え上げは 3 度直した。 副題 / 値 / 行 → 位置 / 大きさ → 種類 / 枠 / 積む順 …と、 見落とした
 * 欄が review のたびに出た。 数え漏らしても検査は通ってしまう = 「書いたのに出ない」 が黙って
 * 残る形が繰り返し発生した。
 *
 * そこで **`DslActor` の全ての欄を、 描ける側か描けない側のどちらかに必ず割り当てる**。
 * 欄が増えた時に両方へ入れ忘れると型検査が落ちるので、 「描けるのか描けないのか」 を必ず
 * 判断することになる (`rules/quality.md § 多層 SSOT 経路の全 registration 保証` と同じ形)。
 */
type 放射で描ける欄 =
  /** 中心の名前 / 枝の名前になる */
  | "name"
  /** 名前と分けて中心 / 枝に出す題。 書かなければ名前を出す */
  | "title"
  /**
   * 名前とは分けて補足に出す 2 欄。
   *
   * `- 描く量を減らす: "{draw} ms"` の形は副題として解析されるため、 値の欄だけを見ると
   * 記法で最も普通な書き方が届かない (#1230 で実測)。 明示的に書いた値の欄も同じ場所へ出す。
   *
   * 描画側は枝の `subtitle` と中心の `rootSubtitle` を名前とは別の行に描く。 2 欄を
   * `放射に出す文字` で 1 つの補足にまとめ、 名前とは分けて渡す。
   */
  | "subtitle"
  | "value"
  /** 枝の色 (`MindBranchNode.tone`)。 中心は持てないので `描けない欄` が別に見る */
  | "tone"
  /** 見本は放射に載せず、 見本の中身だけを描く (別経路で伝える) */
  | "partId"
  /** 種類を書いたかどうかの印。 `kind` と対で見るので単独では扱わない */
  | "kindWritten"
  /** 本文の行番号。 知らせに載せるために使う */
  | "pos";

/**
 * 箱に出す題 (#1381)。 書いていなければ名前をそのまま使う。
 *
 * 名前は図の中で 1 つに決まる必要がある (`focus:` と `flow:` が名前で指す) 一方、題は
 * 重なってよい。 同じ題の箱を並べる図と、題を持たない箱は、名前と切り離さないと書けない。
 *
 * **始まりと終わりの印は題を持たない** (#1466)。 塗った丸と輪で描くもので、名前を出す場所が
 * 無い。 名前は矢印の端として指すために要るので、名前をそのまま題にすると `begin` の字が
 * 丸の上に乗る (組み立て API 側の `.mark()` は題を空で作る)。 書いた題があればそれを使う。
 */
const 題を持たない種類: ReadonlySet<string> = new Set(["mark-start", "mark-end"]);

function 箱の題(a: DslActor): string {
  if (a.title === undefined && a.kind !== undefined && 題を持たない種類.has(a.kind)) return "";
  return a.title ?? a.name;
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

/** 放射では描けない欄。 書かれていたら伝える */
type 放射で描けない欄 =
  | "kind"
  | "eyebrow"
  | "touchpoint"
  | "opportunity"
  | "owner"
  | "end"
  | "rows"
  | "marks"
  | "lane"
  | "stack"
  | "initial"
  | "final"
  // 前の時点の値 (#1450)。 放射の枝は 1 時点しか描かない = 2 本目の帯に当たるものが無い
  | "previous"
  | "colorHex"
  // 部品に書いた色の名前 (#1973)。 色番号と同じく部品にしか残らない
  | "partColorName"
  | "stateOverride"
  | "posX"
  | "posY"
  | "posW"
  | "posH"
  | "scale"
  | "scaleKeys"
  | "posRel"
  | "layoutPos"
  // 箱の中に描く図形 (#1374)。 放射の枝は箱の中に図形を持たない
  | "shape"
  // 出す条件 (#1381)。 放射の枝は個別に出し分けられない
  | "visibleIf"
  // 値に追随する 5 欄 (#1392)。 放射の枝は大きさも位置も中心からの配置で決まる
  | "wBind"
  | "hBind"
  | "opacity"
  | "renderOffsetX"
  | "renderOffsetY";

/** 引数が `never` でなければ型検査が落ちる */
type 空であること<T extends never> = T;

/** `DslActor` に割り当て漏れの欄があると落ちる */
export type _放射の欄を覆えている = 空であること<
  Exclude<keyof DslActor, 放射で描ける欄 | 放射で描けない欄>
>;

/** `DslActor` に無い欄を割り当てていると落ちる */
export type _放射の欄に余りがない = 空であること<
  Exclude<放射で描ける欄 | 放射で描けない欄, keyof DslActor>
>;

/** 描ける側と描けない側が重なっていると落ちる */
export type _放射の欄が重なっていない = 空であること<Extract<放射で描ける欄, 放射で描けない欄>>;

/**
 * 描けない欄と、 知らせに出す名前。
 *
 * **欄ごとに式を持たせない** (Round 5 の指摘)。 `{ 説明, 書いたか }` の形にすると、 項目名と式が
 * 型で結ばれず `scale: { 書いたか: () => false }` のように **判定を骨抜きにしても型検査が通る**。
 * 名前だけを持ち、 書かれていたかは下の 1 つの式で見る。
 *
 * `Record<放射で描けない欄, string>` なので、 欄を足すと項目も要る。 判定の側は欄ごとに書く所が
 * 無いため、 書き忘れも骨抜きも起きない。
 *
 * 表示の名前は複数の欄で同じでよい (`posX` と `posY` はどちらも「位置 (座標)」)。 出す時に
 * 重複を除く。
 */
const 放射で描けない欄の名前: Record<放射で描けない欄, string> = {
  kind: "種類",
  eyebrow: "上の小見出し",
  touchpoint: "場所 (体験の道筋の欄)",
  opportunity: "改善の余地 (体験の道筋の欄)",
  owner: "担当 (工程の並びの欄)",
  end: "終わる時期 (工程の並びの欄)",
  rows: "行",
  marks: "印",
  lane: "枠の指定",
  stack: "積む順",
  initial: "始まり / 終わり の印",
  final: "始まり / 終わり の印",
  previous: "前の時点の値",
  colorHex: "色番号",
  partColorName: "色の名前",
  stateOverride: "状態の上書き",
  // 位置は「登場人物ごとの箱をどこに置くか」 の指定で、 箱が 1 つの図では置く先が無い
  posX: "位置 (座標)",
  posY: "位置 (座標)",
  posW: "大きさ",
  posH: "大きさ",
  scale: "倍率",
  scaleKeys: "倍率",
  posRel: "位置 (相対)",
  layoutPos: "配置のずらし",
  shape: "箱の中の図形",
  visibleIf: "出す条件",
  wBind: "値に追随する大きさ",
  hBind: "値に追随する大きさ",
  opacity: "濃さ",
  renderOffsetX: "描く時のずらし",
  renderOffsetY: "描く時のずらし",
};

/**
 * その欄が書かれていたか。 **全ての欄をこの 1 つの式で見る**。
 *
 * 欄ごとに式を持たせると、 1 つだけ骨抜きにしても型検査が通る (Round 5 の指摘)。 1 つにすれば
 * 骨抜きにした時点で全ての欄の検査が落ちる。
 *
 * 例外は種類だけ。 既定値 (`actor`) が必ず入るので、 書いたかどうかの印 (`kindWritten`) で見る。
 * 真偽を持つ欄 (`initial` / `final`) は `false` を「書いていない」 として扱う = 既定と同じ意味で、
 * 伝えると書いていない人にも出る。
 */
function 放射で描けない欄を書いたか(a: DslActor, 欄: 放射で描けない欄): boolean {
  if (欄 === "kind") return a.kindWritten === true;
  const v = a[欄];
  if (typeof v === "boolean") return v;
  return v !== undefined;
}

/**
 * 放射と木の箱に出す名前と補足 (#1332)。
 *
 * **連結しない**。 描画側は名前と補足を別々に受け取れば箱の中で 2 行に積む。 1 つの文字列に
 * すると 1 行に全部入り、箱幅を超えて末尾が切られる (実測 = 箱 120px に対し文字 163px)。
 *
 * `subtitle` と `value` の両方が書かれた場合は空白で繋いで 1 つの補足にする。 描画側の
 * 補足は 1 行なので、2 つを別々の行にはできない。
 */
function 放射に出す文字(a: DslActor): { title: string; subtitle?: string } {
  const 続き = [a.subtitle, a.value].map((x) => x?.trim()).filter((x): x is string => !!x);
  return { title: 箱の題(a), ...(続き.length > 0 ? { subtitle: 続き.join(" ") } : {}) };
}

function compileMind(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  // 図の型は描画側の組み立て関数 `mindMap()` と同じ綴り (cdl 0.63.0 で `mindmap` から `mind` に揃った)
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "mind" });
  const { w: W, h: H } = 図表の大きさ.mind;

  const 伝える = (kind: CompileNotice["kind"], 名: string, message: string, line = 0): void => {
    onNotice?.({ kind, actor: 名, line, message });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };

  // **見本 (`parts`) を重ねた登場人物は中心にも枝にもしない** (review 指摘)。 後段の
  // `mergePartsFromActors` が見本の中身を別の箱として足すため、 こちらにも載せると同じ
  // 登場人物が 2 箇所に描かれる。 中心だけ外し忘れると、 中心が見本の記法で二重になる
  const 見本でない: DslActor[] = [];
  for (const a of doc.actors) {
    if (a.partId !== undefined) {
      伝える(
        "part-not-drawn",
        a.name,
        `type: mind では見本 (${a.partId}) を中心にも枝にもできません。 見本はそのまま描き、 放射には載せません`,
        a.pos?.line ?? 0,
      );
      continue;
    }
    見本でない.push(a);
  }
  // 枝の親は矢印で決まる (#1251)。 書かなければ全て中心の直下 = 従来と同じ図になる。
  // 規則は `type: tree` と共有する = 同じ本文で図種だけ変えた時に親子の解釈が割れない。
  //
  // **早期 return より前に置く** = 見本しか居ない記法で矢印を書いた時、 枝が 1 本も無いため
  // どの矢印も親にできない。 後ろに置くと、その形で矢印が黙って消える (Round 3 の指摘と同じ理由)
  const 枝の名前 = new Set(見本でない.map((a) => slugify(a.name)));
  const 親 = 矢印から親を決める(doc, "mind", 枝の名前, (名, message, line) =>
    // 親にできなかった矢印は描かれない。 知らせの種別も「矢印を落とした」 にする
    伝える("chart-edge-dropped", 名, message, line ?? 0),
  );

  // 放射に載る登場人物が 0 人なら枠も作らない。 中身の無い枠が 1 つ残るのを避ける (#1096)。
  // **枠を作る前に見る** = 見本しか居ない記法で作ると、 見本だけが描かれた図に空の枠が残る
  if (見本でない.length === 0) return b.build();

  b.lane("chart", { width: W + 64 });

  // **同じ slug になる名前を先に見る** (`type: tree` と同じ理由)。 違う名前が同じ id に潰れると、
  // 枝が 1 本消えたり、 枝の親を見る規則が別の枝を指したりする
  const slug別 = new Map<string, string[]>();
  for (const a of 見本でない) {
    const k = slugify(a.name);
    slug別.set(k, [...(slug別.get(k) ?? []), a.name]);
  }
  for (const [k, 群] of slug別) {
    if (群.length > 1) {
      伝える(
        "chart-value-unreadable",
        群[0]!,
        `type: mind で ${群.join(" / ")} が同じ id (${k}) になります。 名前を変えてください`,
      );
    }
  }

  const root = 見本でない[0]!;
  const rootId = slugify(root.name) || "root";

  // **中心を子にする矢印は表せない** (#1251 Round 1 の指摘)。 中心は枝の並びに居ないため
  // 親を持てず、 解決はできても誰にも読まれずに消える。 黙って捨てると「書いたのに
  // 図が変わらない」 が手掛かりなしで起きるので、 行番号付きで伝える
  for (const f of doc.flow) {
    if (slugify(f.to) !== rootId) continue;
    伝える(
      "chart-edge-dropped",
      f.to,
      `type: mind で中心 (${truncateForMessage(f.to)}) を子にはできません (${truncateForMessage(f.from)} -> ${truncateForMessage(f.to)} を使いません)。 中心は放射の真ん中に置く 1 つだけです`,
      f.pos?.line ?? 0,
    );
  }

  // **1 箱で描く種別が持てる欄は限られる**。 枝は名前と色、 中心は名前だけ。 書いても描けない
  // 欄は伝える = 箱ごとに描いていた頃は載っていた欄で、 黙って消すと「書いたのに出ない」 が残る
  const 描けない欄 = (a: DslActor): string[] => {
    const out: string[] = [];
    for (const 欄 of Object.keys(放射で描けない欄の名前) as 放射で描けない欄[]) {
      if (!放射で描けない欄を書いたか(a, 欄)) continue;
      const 名前 = 放射で描けない欄の名前[欄];
      // 同じ名前を持つ欄 (`posX` と `posY`) は 1 度だけ出す
      if (!out.includes(名前)) out.push(名前);
    }
    return out;
  };
  const 消えた欄 = new Map<string, string[]>();
  const 記録する = (a: DslActor): void => {
    const 欄 = 描けない欄(a);
    if (欄.length > 0) 消えた欄.set(a.name, 欄);
  };

  const branches: NonNullable<CdlDiagram["nodes"][number]["mindData"]>["branches"] = [];
  const 使った = new Set<string>([rootId]);
  記録する(root);
  // 中心は色の欄を持たない (`MindBranchPayload` に `tone` が無い)
  if (root.tone)
    消えた欄.set(root.name, [...(消えた欄.get(root.name) ?? []), "色 (中心は持てない)"]);

  見本でない.slice(1).forEach((a, i) => {
    const id = slugify(a.name) || `leaf-${i}`;
    if (使った.has(id)) {
      伝える(
        "chart-value-unreadable",
        a.name,
        `type: mind で ${a.name} が既にある id (${id}) と重なります (枝に載せません)`,
        a.pos?.line ?? 0,
      );
      return;
    }
    使った.add(id);
    記録する(a);
    // 矢印を書かなかった枝は中心の直下。 中心を親に指した矢印も同じ値になる
    // (中心は `見本でない` の先頭なので、 その名前の slug が `rootId` そのもの)
    // 枝は色を持てる (`MindBranchNode.tone`)
    branches.push({
      id,
      ...放射に出す文字(a),
      parent: 親.get(id) ?? rootId,
      ...(a.tone ? { tone: a.tone } : {}),
    });
  });

  if (消えた欄.size > 0) {
    const 一覧 = [...消えた欄].map(([名, 欄]) => `${名} の${欄.join(" / ")}`).join("、 ");
    伝える(
      "chart-value-unreadable",
      [...消えた欄.keys()][0]!,
      `type: mind は名前と副題 / 値、 枝の色しか描けません (描かない欄: ${一覧})。 これらを描くなら type: tree か type: flow を使ってください`,
    );
  }

  b.node(`${slugify(doc.title) || "mind"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "mind-map",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    mindData: (() => {
      const 中心 = 放射に出す文字(root);
      return {
        rootId,
        rootTitle: 中心.title,
        ...(中心.subtitle === undefined ? {} : { rootSubtitle: 中心.subtitle }),
        branches,
      };
    })(),
  });
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
        // lane が preset で作られていなければ新規追加
        diagram.lanes.push({
          id,
          x: laneOpt.x ?? 0,
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
  // codex-review CAR-1659 MAJOR fix = 全角矢印 `→` を対応 (generic 経路との互換)、
  // 同 from/to で複数 edge がある場合は全件 activate (`.find` → filter loop)。
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

function compileSequence(doc: DslDocument): CdlDiagram {
  // v0.3 ... アニメーション 有無で経路を分岐。
  // 有り = builder 直接経路で state / 複数 phase を注入。
  /*
   * **段があっても組み立て器へ渡す** (#1466)。
   *
   * 順序図は 1 つの箱が図を丸ごと描く形になり、言づては箱の中の行になった。 段ごとに
   * 別経路で箱と縦線を組む形 (`compileSequenceWithAnimate`) では、その骨格が出ない。
   */
  const seqBuilder = sequence({
    id: slugify(doc.title),
    topic: doc.title,
    /*
     * 見出しに出すのは **書いた題** (#1466)。 名前は矢印の端として指すためのもので、
     * `title:` を書いたらそちらを出す (`箱の題`)。 板でも他の図種と同じ規約にする。
     */
    actors: doc.actors.map((a) =>
      a.subtitle ? { name: 箱の題(a), subtitle: a.subtitle } : 箱の題(a),
    ),
    ...(doc.bands && doc.bands.length > 0 ? { bands: doc.bands } : {}),
  });
  for (const s of doc.flow) {
    seqBuilder.step({
      from: s.from,
      to: s.to,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),
      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
      ...(s.msgKind ? { kind: s.msgKind } : {}),
    });
  }
  const built = seqBuilder.build();
  const 段 = doc.animate?.phases ?? [];
  if (段.length === 0) return built;
  /*
   * 書いた段を「今どの言づてか」 に読み替える (#1466)。
   *
   * 記法は段ごとに光らせる矢印を並べる (`focus: [A -> B, ...]`) が、言づては矢印ではなく
   * 箱の中の行になった = 光らせる先が無い。 代わりに **その段までに出た言づての番号** を
   * 状態へ書き、箱がそこまでを描く。
   */
  const 番号 = new Map<string, number>();
  doc.flow.forEach((f, i) => 番号.set(`${slugify(f.from)} -> ${slugify(f.to)}`, i));
  const 状態名 = sequenceStepId();
  return {
    ...built,
    states: [...built.states, { id: 状態名, initial: "0" }],
    phases: 段.map((p, i) => {
      const 番 = Math.max(
        0,
        ...(p.highlight ?? []).map(
          (f) => 番号.get(f.split("->").map((x) => slugify(x.trim())).join(" -> ")) ?? -1,
        ),
      );
      return {
        id: `p${i}`,
        duration: p.durationMs,
        title: p.name,
        body: p.body ?? "",
        activate: [slugify(doc.title)],
        ...(p.badge ? { badge: p.badge } : {}),
        /*
         * **書いた状態の動きも一緒に運ぶ** (#1466)。 板の段は「今どの言づてか」 を状態に
         * 書くが、記法は同じ段に `遷移:` / `切替:` も書ける。 板の分だけを載せると、
         * 書いた動きが黙って落ちる (実測で `tweens` が 0 件になっていた)。
         */
        sets: [...(p.sets ?? []).map((x) => ({ stateId: x.state, value: x.value })), { stateId: 状態名, value: 番 }],
        tweens: (p.tweens ?? []).map((t) => ({ stateId: t.state, from: t.from, to: t.to })),
      };
    }),
  };
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
  // **縦列を書いた形は動きの有無に関わらず generic 経路へ** (#1263)。 動く図だけで効かせると、
  // 同じ記法でも静止図では指定が黙って消える (実測 = 縦列 3 本のはずが 1 本になり知らせも出ない)
  // **向きを書いた形も generic 経路へ** (#1494)。 静止図の経路は並びを固定で持つので、
  // ここを通さないと書いた向きが黙って消える (縦列を書いた形と同じ理由)
  //
  // 振り分けは行の対応と端の知らせと同じ判定で行う (#1986)
  if (!鎖でつなぐ形か(doc)) {
    return compileGenericWithAnimate(doc, { kind: "flow", laneId: "main", laneWidth: 400 });
  }
  // 登場人物が 0 人なら枠も作らない。 描画側の `flow()` は枠を必ず 1 つ作るため、 そのまま
  // 通すと中身の無い枠が残る (実測 = `title` と `type` だけの本文で枠 `flow` が空)。
  // 枠を持たない図として返す = `swimlane` / `c4` が 0 人で枠 0 になるのと揃う
  if (doc.actors.length === 0) {
    return diagram(slugify(doc.title), { topic: doc.title, type: "flow" }).build();
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
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
      },
      edgeLabel,
    );
  }
  return flowBuilder.build();
}

function compileSwimlane(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 actor 別 lane で配置)
  // **縦列を書いた形は動きの有無に関わらず generic 経路へ** (#1263)。 動く図だけで効かせると、
  // 同じ記法でも静止図では指定が黙って消える (実測 = 縦列 3 本のはずが 1 本になり知らせも出ない)
  // **向きを書いた形も generic 経路へ** (#1494)。 静止図の経路は並びを固定で持つので、
  // ここを通さないと書いた向きが黙って消える (縦列を書いた形と同じ理由)
  if (
    (doc.animate && doc.animate.phases.length > 0) ||
    書いた縦列に置く("swimlane", doc) ||
    doc.direction !== undefined
  ) {
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
        kind: 描ける種別(actor?.kind),
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
      ...(s.side ? { side: s.side } : {}),

      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  // **箱が 1 つも置けなかった時は、 登場人物をそのまま置く** (#1219)。
  //
  // この図種は矢印の端から箱を作るため、 矢印が 1 本も無いと箱が 0 件になり `compile` が
  // 落ちる (実測 = 矢印を書かない図は本 Issue の前から落ちていた)。 解決できない矢印を
  // 外すと同じ形になるので、 受け皿を置く。
  //
  // **1 つでも置けた時は触らない**。 矢印に出てこない登場人物にも箱を置くと、 今まで枠だけ
  // だった所に箱が増えて既存の図の見た目が変わる (それを変えるかは別の判断)。
  if (placedNodes.size === 0) {
    doc.actors.forEach((a, i) => {
      swim.node(slugify(a.name) || `n${i}`, {
        lane: swim.laneId(a.name),
        stack: 0,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
      });
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
      title: 箱の題(a),
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

/**
 * 状態遷移図で、どの箱を始まり / 終わりとみなすか (#1275)。
 *
 * **書いた値が勝つ**。 `initial:` / `final:` は記法で書けるのに 1 度も読まれておらず、
 * 位置だけで決まっていた (実測 = 中央の箱に `final: true` を書いても、最後に書いた箱が
 * 「最終」 になった)。
 *
 * 1 つも書いていなければ従来どおり位置で決める = 書かない記法の図は変わらない。
 * 片方だけ書いた形も、書いた側だけが切り替わる。
 */
function 始まりと終わりの決め方(doc: DslDocument): {
  始まり: (a: DslActor, idx: number) => boolean;
  終わり: (a: DslActor, idx: number) => boolean;
} {
  const 書いた始まり = doc.actors.some((a) => a.initial === true);
  const 書いた終わり = doc.actors.some((a) => a.final === true);
  return {
    始まり: (a, idx) => (書いた始まり ? a.initial === true : idx === 0),
    終わり: (a, idx) =>
      書いた終わり ? a.final === true : idx === doc.actors.length - 1 && doc.actors.length > 1,
  };
}

/** 状態の図で `stateMachine` preset が全ての箱に使う種類 */
const 状態の図の既定の種類: NodeKind = "card";

/**
 * 状態の図で、既定と違う種類を書いた登場人物がいるか (#1450)。
 *
 * `stateMachine` preset は全ての状態を `card` で描くため、書いた `kind:` が黙って消える。
 * 始点終点の印 (`mark-start` / `mark-end`) を書けるようにするには、書いた形を効かせる必要がある。
 *
 * **「書いたか」 だけでは広すぎる**。 記法だけの種類 (`kind: state` 等) は `card` に読み替わり、
 * preset の出す形と同じになる = 書いても何も変わらないので経路を切り替える理由が無い。
 * 切り替えると既存の図の id と枠の作りが変わる (実測で golden 8 件が落ちた)。
 *
 * 読み替えた後の種類が既定と違う時だけ切り替える。 こうすると「書いたのに効かない」 は消え、
 * 「書いたが結果が同じ」 は従来の経路に留まる。
 */
function 既定と違う種類を書いた(doc: DslDocument): boolean {
  return doc.actors.some(
    (a) => a.kindWritten === true && 描ける種別(a.kind) !== 状態の図の既定の種類,
  );
}

function compileState(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 state を lane で配置、 transition を edge)
  //
  // **種類を書いた形は動きの有無に関わらず generic 経路へ** (#1450、 #1263 と同じ理由)。
  // 動く図だけで効かせると、同じ記法でも静止図では指定が黙って消える
  // (実測 = `kind: mark-start` を書いた箱が `card` になり知らせも出ない)
  if ((doc.animate && doc.animate.phases.length > 0) || 既定と違う種類を書いた(doc)) {
    return compileGenericWithAnimate(doc, { kind: "state", laneWidth: 360 });
  }
  // stateMachine preset ... actors を state に、 流れ を transition に
  const fsm = stateMachine({
    id: slugify(doc.title),
    topic: doc.title,
  });
  const 決め方 = 始まりと終わりの決め方(doc);
  for (let i = 0; i < doc.actors.length; i++) {
    const a = doc.actors[i]!;
    // 書いた `initial:` / `final:` が勝つ。 1 つも書いていなければ順序で決める
    const initial = 決め方.始まり(a, i);
    const final = 決め方.終わり(a, i);
    fsm.state({
      id: slugify(a.name) || `s${i}`,
      title: 箱の題(a),
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
  // **縦列を書いた形は動きの有無に関わらず generic 経路へ** (#1263)。 動く図だけで効かせると、
  // 同じ記法でも静止図では指定が黙って消える (実測 = 縦列 3 本のはずが 1 本になり知らせも出ない)
  if ((doc.animate && doc.animate.phases.length > 0) || 書いた縦列に置く("topology", doc)) {
    return compileGenericWithAnimate(doc, { kind: "topology", laneWidth: 460 });
  }
  // 登場人物が 0 人なら枠も作らない。 描画側の `topology()` は枠を必ず 1 つ作るため、 そのまま
  // 通すと中身の無い枠が残る (#1096)
  if (doc.actors.length === 0) {
    return diagram(slugify(doc.title), { topic: doc.title, type: "topology" }).build();
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
      kind: 描ける種別(a.kind),
      title: 箱の題(a),
    });
  }
  for (const s of doc.flow) {
    topo.connect(slugify(s.from), slugify(s.to), {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),

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

/**
 * 後ろへ戻る矢印か (#1260)。
 *
 * 状態の図は、後ろの状態へ戻る矢印を **箱の上を回して** 描く (`routing: "back-detour"`)。
 * 組立て API 側がそうしており、記法側で付けないと **描いた図の高さが変わる**
 * (実測 = viewBox が 404 対 486 で、戻る矢印が箱の右横を回っていた)。
 *
 * 判定は並び順。 指す先が指す元より前にあれば戻る矢印
 * (実測 = `stateMachine()` は c -> a と c -> b の 2 本だけに付け、a -> b と b -> c には付けない)。
 *
 * **状態の図だけに付ける**。 他の図種の組立て API は付けない (実測 = `er()` は付けなかった)。
 */
function 後ろへ戻る矢印か(
  kind: GenericKind,
  fromId: string,
  toId: string,
  箱の並び: ReadonlyMap<string, number>,
): boolean {
  if (kind !== "state") return false;
  const 元 = 箱の並び.get(fromId);
  const 先 = 箱の並び.get(toId);
  if (元 === undefined || 先 === undefined) return false;
  return 先 < 元;
}

/**
 * 向きを選べる図種 (#1494)。
 *
 * **並び方そのものが読み方を担う図種は外す**。 表の図は「1 縦列 1 表」、クラス図と状態の図は
 * 設計が格子に置く形、順序図は 1 枚の板で、どれも向きを入れ替えると図の意味が変わる。
 *
 * `topology` も外す = 入れ物 (`contain`) を持つ図で、縦列の中に箱を囲む作りが向きと結びついている。
 */
const 向きを選べる図種: ReadonlySet<PresetType> = new Set<PresetType>(["flow", "swimlane"]);

/** その図種の既定の向き。 書かなかった時は今までどおりの並びになる。 */
function 既定の向き(kind: PresetType): "縦" | "横" {
  return kind === "flow" || kind === "topology" ? "縦" : "横";
}

/**
 * 実際に使う向き (#1494)。
 *
 * 書いていない図と、効かない図種に書いた図は既定のまま = **書かない図の並びは 1 つも動かない**。
 */
function 並べる向き(kind: PresetType, doc: DslDocument): "縦" | "横" {
  if (doc.direction === undefined) return 既定の向き(kind);
  if (!向きを選べる図種.has(kind)) return 既定の向き(kind);
  return doc.direction;
}

/**
 * 書いた向きが効かない時に伝える (#1494)。
 *
 * 効かない形は 2 つある。 向きを選べない図種に書いた形と、全ての箱が縦列を書いた形。
 * 後者は書いた縦列が勝つので、向きだけが黙って捨てられる。
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
  if (書いた縦列に置く(doc.type, doc)) {
    onNotice({
      kind: "direction-not-honored",
      actor: doc.title,
      line: 行,
      message: "書いた direction は効きません (全ての箱が縦列を書いているので、そちらが優先されます)",
      hint: "direction で並べたい時は箱の `lane` を外してください",
    });
  }
}

/**
 * 縦列を選べる図種 (#1263)。
 *
 * 縦列を **箱を並べるための入れ物** として使う図種だけを許す。 順序図と solidity は
 * 縦列がそのまま生命線として描かれる骨格なので許さない (#1248 の判断はこちらに当たる)。
 *
 * `er` は「1 縦列 1 箱」 が図の読み方そのもの (表が横に並ぶ) なので、2 つの箱を同じ縦列へ
 * 入れられる形にはしない。
 *
 * **クラス図と状態遷移図は外した** (#1466)。 設計が格子に置く形になり (クラス 3 列 3 段 /
 * 状態 2 列 5 段)、「箱の 1 つの辺には関係を 1 本まで」 を守るには 1 つの縦列に複数の箱が要る。
 * 「1 縦列 1 箱」 が読み方だった前提はここで崩れている。
 */
const 縦列を選べる図種: ReadonlySet<PresetType> = new Set<PresetType>([
  "flow",
  "topology",
  "swimlane",
  "class",
  "state",
  /*
   * ER 図 (#1571)。
   *
   * `er` の組み立て器は実体 1 つにつき帯を 1 本作り、必ず段 0 に置く = 表が横 1 列にしか
   * 並ばない。 関係を 4 本持つ実体があると、どう並べ替えても 2 本は隣を飛び越す
   * (意匠帳 `docs/design/er/note.md` § 記法の制約 が 4 通りを実測しており、1 列は縦横比 7.0 /
   * 最長の線 4068、格子は 3.5 / 836)。
   *
   * **全ての箱が縦列を書いた時だけ** 効くので、書かない図はいままでどおり組み立て器が並べる。
   */
  "er",
]);

/**
 * 書いた縦列に箱を置く形か (#1263)。
 *
 * **全ての箱が縦列を書いた時だけ** この形にする。 一部だけ書いた形は、書かなかった箱の
 * 行き先を決める規則が要る (既定の縦列に集める / 自分の縦列を作る) が、どちらも
 * 書いた人の意図と一致する保証が無い。 混ざった形は `reportLaneMixed` が知らせる。
 *
 * 見本 (parts) は縦列を張替え先として使うため、この判定からは外す。
 */
function 書いた縦列に置く(kind: PresetType, doc: DslDocument): boolean {
  if (!縦列を選べる図種.has(kind)) return false;
  const 対象 = doc.actors.filter((a) => a.partId === undefined);
  return 対象.length > 0 && 対象.every((a) => a.lane !== undefined);
}

function compileGenericWithAnimate(doc: DslDocument, opts: GenericOpts): CdlDiagram {
  const { kind, laneWidth } = opts;
  const b = diagram(slugify(doc.title), { topic: doc.title, type: kind });

  // lane / node 配置 ... preset kind に応じて切替
  const actorToNodeId = new Map<string, string>();
  if (書いた縦列に置く(kind, doc)) {
    /*
     * **書いた縦列に置く** (#1263)。 縦列を並べるための入れ物として使う図種でだけ効く。
     *
     * 縦列の並びは **`lanes:` に書いた順** を優先する (#1394)。 箱が最初に使った順で
     * 並べていた間、`lanes:` で左から順に宣言しても箱の書き順で入れ替わっていた
     * (実測 = 中心を先に書いた放射の図で、左端の縦列が中心の右へ回った)。
     *
     * `lanes:` に無い縦列は、これまでどおり箱が使った順で後ろに続ける。
     */
    const 使った: string[] = [];
    for (const a of doc.actors) {
      const lid = a.lane;
      if (lid !== undefined && !使った.includes(lid)) 使った.push(lid);
    }
    const 書いた順 = doc.lanes ? Object.keys(doc.lanes) : [];
    const 並び = [
      ...書いた順.filter((lid) => 使った.includes(lid)),
      ...使った.filter((lid) => !書いた順.includes(lid)),
    ];
    for (const lid of 並び) {
      b.lane(lid, { width: laneWidth, ...(kind === "topology" ? { contain: true } : {}) });
    }
    /*
     * 段は **書いた番号をそのまま持つ** (#1394)。
     *
     * 書き順で 0 から詰め直していた間、`stack: 1` と書いた箱が 0 へ落ちていた。
     * 決定木のように「同じ高さに並ばない」 ことが図の意味そのものになる形では、
     * 詰めた瞬間に別の図になる (実測 = 3 段の木の根が 1 段目へ上がった)。
     *
     * 書かなかった箱は、その縦列で **空いている一番小さい段** に置く。 単に数え上げると
     * 書いた番号と重なり、2 つの箱が同じ段に載る。
     */
    const 埋まった段 = new Map<string, Set<number>>();
    const 埋める = (lid: string, stack: number): void => {
      const 集合 = 埋まった段.get(lid) ?? new Set<number>();
      集合.add(stack);
      埋まった段.set(lid, 集合);
    };
    for (const a of doc.actors) {
      if (a.lane !== undefined && a.stack !== undefined) 埋める(a.lane, a.stack);
    }
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      const lid = a.lane!;
      let stack = a.stack;
      if (stack === undefined) {
        stack = 0;
        const 集合 = 埋まった段.get(lid);
        while (集合?.has(stack)) stack += 1;
        埋める(lid, stack);
      }
      b.node(id, {
        lane: lid,
        stack,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
      });
    });
  } else if (並べる向き(kind, doc) === "縦") {
    // 1 lane に全 actor を縦 stack
    const lid = opts.laneId ?? "main";
    b.lane(lid, {
      width: laneWidth,
      /*
       * **見出しは自然に縦へ積む図種だけ** (#1494)。
       *
       * `direction: 縦` を書いた泳法図がここへ来るようになった。 その図に題を渡すと、図の題が
       * 縦列の見出しとしてもう 1 度出る (実測 = 「認証の流れ」 が題と見出しの 2 箇所に並んだ)。
       */
      ...(kind === "flow" || kind === "topology" ? { label: doc.title } : {}),
      ...(kind === "topology" ? { contain: true } : {}),
    });
    doc.actors.forEach((a, idx) => {
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      b.node(id, {
        lane: lid,
        stack: idx,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
      });
    });
  } else {
    // actor ごとに 1 lane (横並び)。 `swimlane` / `er` / `state` の既定と、
    // `向き: 横` を書いた流れ図がここに来る (#1494)
    //
    // **見出しを付けるのは `swimlane` だけ** (#1241)。 3 図種とも箱を 1 つずつ持ち、
    // その箱が既に名前を描く。 縦列にも同じ名前を渡すと **同じ字が縦に 2 つ並ぶ**
    // (実測 = 描いた絵に `Alpha` `Beta` が 2 度出る)。
    //
    // `swimlane` は縦列そのものが「誰の担当か」 を読ませる図なので見出しが要る。
    // `er` の縦列は表を並べるための入れ物、 `state` の縦列は状態を並べるための入れ物で、
    // どちらも読む人に見せる意味を持たない (組立て API 側も見出しを空のまま置く)。
    const 見出しを付ける = kind === "swimlane";
    const 決め方2 = 始まりと終わりの決め方(doc);
    doc.actors.forEach((a, idx) => {
      const lid = `lane-${slugify(a.name) || idx}`;
      b.lane(lid, { width: laneWidth, ...(見出しを付ける ? { label: a.name } : {}) });
      const id = slugify(a.name) || `n${idx}`;
      actorToNodeId.set(a.name, id);
      // er は entity、 state は initial/final marker、 swimlane はそのまま actor
      const isInitial = kind === "state" && 決め方2.始まり(a, idx);
      const isFinal = kind === "state" && 決め方2.終わり(a, idx);
      b.node(id, {
        lane: lid,
        stack: 0,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
        ...(isInitial ? { eyebrow: "初期" } : {}),
        ...(isFinal ? { eyebrow: "最終" } : {}),
      });
    });
  }

  // edge ... flow の各 step を edge として登録
  //
  // 解決できない名前の矢印は **落とす** (#1209)。 以前は名前をそのまま id として使っており、
  // 存在しない node を指す図ができて描画の直前で落ちていた
  // (実測 = `unknown-ref: edge "e0-v-c" の from "v" が node に存在しません`)。
  // 書いた人には `flow-actor-missing` の知らせが届く。
  // 箱の並び。 後ろへ戻る矢印を見分けるために使う (#1260)
  const 箱の並び = new Map([...actorToNodeId.values()].map((id, i) => [id, i]));
  const edgeIds: string[] = [];
  doc.flow.forEach((s, idx) => {
    // 名前は入口で正規化済 (`canonicalizeFlowActors`)。 ここで slug を受け直すと、
    // 動きを書いていない図の組み立てと扱いが割れる
    const fromId = actorToNodeId.get(s.from);
    const toId = actorToNodeId.get(s.to);
    if (fromId === undefined || toId === undefined) return;
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
      ...(後ろへ戻る矢印か(kind, fromId, toId, 箱の並び)
        ? { routing: "back-detour" as const }
        : {}),
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),

      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
    edgeIds.push(edgeId);
  });

  // state 登録
  for (const st of doc.animate?.states ?? []) {
    b.state(st.name, { initial: st.initial });
  }

  // phase 注入
  for (const p of doc.animate?.phases ?? []) {
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

/** id の長さの上限。 `slugify` が切る幅で、 尾を付ける側もこの値から余地を決める (#1220) */
const ID_MAX = 64;

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龯\-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, ID_MAX) || "n"
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

/**
 * Text DSL の AST 型定義
 * docs/cdl/text-dsl-spec.md の文法を AST に変換した中間表現
 */

import type { CdlDiagram, NodeKind, Tone, EdgeStyle } from "@cardenelabs/cdl";
import type { DslOnlyKind } from "./v05/parser";

/**
 * 記法が書ける箱の種類 (#1420)。
 *
 * 描画できる種類 (`NodeKind`) に、**記法だけが持つ種類** (`contract` / `eoa` など) を足す。
 * 後者は図種ごとの役割分け (`solidity` の縦列の並べ替えなど) に使い、描画側へ渡す手前で
 * `compile.ts` の `描ける種別` が読み替える。
 *
 * `NodeKind` だけに縛っていた間、記法が受ける値を型が表せていなかった。
 */
export type DslNodeKind = NodeKind | DslOnlyKind;
import type { RelativePos } from "./relative-pos";

/**
 * 箱の中に描く図形 (#1374)。 **描画側の型をそのまま使う**。
 *
 * 写して持つと欄が増えた時にずれる。 指した先が変われば型検査が教える。
 */
export type DslDynShape = NonNullable<CdlDiagram["nodes"][number]["shape"]>;

/** 値を見せる部品 (#1374)。 図形と同じ理由で描画側の型をそのまま使う */
export type DslReadout = NonNullable<CdlDiagram["readouts"]>[number];

/** 読む人が動かすつまみ (#1389)。 部品と同じ理由で描画側の型をそのまま使う */
export type DslInput = NonNullable<CdlDiagram["inputs"]>[number];

/** つまみの値から決まる値 (#1391)。 描画側の型に、知らせ用の記述位置だけを足す。 */
export type DslFormula = NonNullable<CdlDiagram["formulas"]>[number] & { pos?: Position };

/** 巻き上げに応じて進む値 (#1393)。 描画側の型をそのまま使う */
export type DslScrollTrigger = NonNullable<CdlDiagram["scrollTriggers"]>[number];

/**
 * 押下などの出来事で動く仕掛け (`events:`、 #1393)。
 *
 * **描画側の型をそのまま使わない**。 描画側は相手を識別子で持つ (`{ kind: "node", id }`) が、
 * 記法は識別子を書けず名前で指す。 名前から識別子への読み替えは組み立てが行うため、
 * 記法の段階では「何をどう指したか」 だけを持つ。
 */
export type DslEventBinding = {
  /** 出来事の種類 (`click` / `hover` など、描画側の `CdlEventKind` と同じ語) */
  event: NonNullable<CdlDiagram["eventBindings"]>[number]["event"];
  /** 何を指したか。 名前は記法に書かれたまま持ち、組み立てが識別子へ直す */
  target:
    | { kind: "node"; name: string }
    | { kind: "lane"; name: string }
    | { kind: "edge"; from: string; to: string }
    | { kind: "diagram" };
  /** 呼び出す仕掛けの名前。 実体は画面側が持つ */
  handlerId: string;
  pos: Position;
};

export type PresetType =
  | "sequence"
  | "flow"
  | "swimlane"
  | "er"
  | "state"
  | "topology"
  | "solidity"
  | "gantt"
  | "class"
  | "pie"
  | "bar"
  | "line"
  | "gauge"
  | "radial"
  | "stat"
  | "waffle"
  | "stacked"
  | "funnel"
  | "tree"
  | "journey"
  | "quadrant"
  | "c4"
  | "mind";

export type Position = {
  line: number;
  column?: number;
};

/**
 * canvas pivot (CAR-1693 Phase 1) の DSL 表面 `pos: {x, y}` を保持する型。
 * auto layout の compute value からの offset (dx, dy) を表す。 element の `layoutPos:` が
 * undefined なら auto layout の値をそのまま採用 (catalog 100+ backward compat)、 set 済なら
 * Phase 2 の applyPosOffset pass が offset として適用する。
 *
 * naming = DSL 表面 syntax は user 提案 wording (`pos:`) を維持、 内部 AST は既存 `pos: Position`
 * (source line/column) との collision 回避のため `layoutPos:` に rename する 2 層設計。
 */
export type LayoutPos = {
  x: number;
  y: number;
};

/**
 * diagram-level layout mode (CAR-1693 Phase 1)。 未指定は "auto" default で catalog 100+ は
 * byte-identical 動作。 "manual" は Phase 4 で drag interaction が「auto layout を skip して
 * pos: 値をそのまま採用する」 mode として使う予定。
 */
export type LayoutMode = "auto" | "manual";

/** トップレベル AST */
export type DslDocument = {
  title: string;
  type: PresetType;
  /**
   * 図全体を 1 箱にする図種 (`pie` / `bar` / `line` / `funnel` / `tree` / `journey` /
   * `quadrant` / `mind` / `gantt`) で、 その箱の上に出す小見出し (#1247)。
   *
   * これらの図種は箱を 1 つしか作らないため「どの箱の小見出しか」 が決まる。 箱ごとに
   * 分かれる図種では決まらないので、 書かれていたら組み立て側が知らせる。
   */
  eyebrow?: string;
  /**
   * `eyebrow` を書いた行 (#1247)。 知らせの行番号に使う。
   *
   * 図の `pos` は常に 1 行目を指すため、 そこを使うと「10 行目に書いた `eyebrow` が効かない」
   * を 1 行目として知らせることになり、 書いた場所に辿り着けない。
   */
  eyebrowPos?: Position;
  /**
   * 2 軸で仕分ける図 (`type: quadrant`) の軸の名前 (#1251)。
   *
   * 書かないと「小さい / 大きい」 のままになり、何を判断する図か読めない。
   * 区画の名前 (`右上` 等) は軸の名前から `{上} × {右}` の形で決まる。
   *
   * 他の図種には軸が無いため、書かれていたら組み立て側が知らせる。
   */
  axes?: DslAxes;
  /** `axes` を書いた行 (#1251)。 知らせの行番号に使う */
  axesPos?: Position;
  actors: DslActor[];
  flow: DslStep[];
  animate?: DslAnimate;
  /**
   * 他の値から自動で決まる値 (`values:`)。 時間を持たず、 参照した値が動けば常に追随する。
   *
   * `states` (初期値だけを持つ) と `animation` (いつ何を動かすか) の間に置く層で、
   * 値どうしの関係を書く場所。 書かなければ今までと同じ挙動。
   */
  values?: DslValue[];
  /** v0.5+ 拡張 ... viewport / lanes / groups */
  viewport?: DslViewport;
  lanes?: Record<string, DslLane>;
  groups?: Record<string, DslGroup>;
  /**
   * 値を見せる部品 (`readouts:`、 #1374)。 割合の輪や数え上げを図の脇に出す。
   *
   * 箱ではないので縦列に載らない。 図全体に 1 つの並びとして持つ。
   */
  readouts?: DslReadout[];
  /**
   * 読む人が動かすつまみ (`inputs:`、 #1389)。 つまみが握る値は状態と同じ名前で参照できる。
   *
   * 部品と同じく箱ではないので縦列に載らない。 図全体に 1 つの並びとして持つ。
   */
  inputs?: DslInput[];
  /**
   * つまみの値から決まる値 (`formulas:`、 #1391)。
   *
   * **`values:` とは経路が別**。 あちらは段が動かす状態を読んで毎 frame 決まり直す
   * (`derived`) のに対し、こちらはつまみが握る値を読む反応の網に載る (`formulas`)。
   * 描画側がこの 2 つを別の欄として持つため、記法でも別の項目にする。
   *
   * 式は描画側の書き方。 名前は中括弧で囲っても囲わなくてもよい (描画側の parser が
   * どちらも同じ名前として読む)。
   */
  formulas?: DslFormula[];
  /**
   * 押下などの出来事で動く仕掛け (`events:`、 #1393)。
   *
   * 相手は名前で指す。 組み立てが識別子へ直し、指す先が無ければ知らせる。
   */
  events?: DslEventBinding[];
  /**
   * 巻き上げに応じて進む値 (`scrolls:`、 #1393)。
   *
   * 画面を巻き上げた量から 0 から 1 の進み具合を作る。 描画側はこれを値として読む。
   */
  scrolls?: DslScrollTrigger[];
  /**
   * canvas pivot (CAR-1693 Phase 1) diagram-level layout mode。 未指定は "auto" default で
   * catalog 100+ backward compat。 "manual" は Phase 4 で drag → pos: 保存の完全 manual mode。
   */
  layout?: LayoutMode;
  pos: Position;
};

/** 2 軸で仕分ける図の軸の名前 (#1251) */
export type DslAxes = {
  x?: { left?: string; right?: string };
  y?: { bottom?: string; top?: string };
};

/** 登場人物 (v0.5+ ... inline option 拡張) */
export type DslActor = {
  name: string;
  kind: DslNodeKind;
  /**
   * 著者が種類を書いたか。 書かなかった時 `kind` には既定の `actor` が入るため、
   * `kind` の値だけでは「書いた `actor`」 と「書かなかった」 を区別できない。
   *
   * 順序図の名札は小型の箱 (`h: 72`) で作られる。 描画側は `card` に小型用の分岐を持つが
   * `actor` には無く、 名札の文字が箱の下端をはみ出す。 書いた時だけ種類を名札に載せ、
   * 書かなかった時は小型に耐える形のまま残すために、 この 2 つを区別する (#1058)。
   */
  kindWritten?: boolean;
  /** v0.5+ inline option */
  subtitle?: string;
  eyebrow?: string;
  value?: string;
  /**
   * 前の時点の値 (#1450)。
   *
   * 内訳の変化を帯で示す図 (`type: stacked`) が 2 本目の帯として描き、値 1 つを大きく示す図
   * (`type: stat`) が差として出す。 書かない図は 1 本のまま (従来と同じ)。
   *
   * **3 時点以上は持たない**。 描画側が 2 時点で設計されており (`cdl#551`)、足すなら欄の形ごと
   * 決め直すことになる。
   */
  previous?: string;
  rows?: string[];
  /**
   * 箱の中に描く図形 (`shape:`、 #1374)。 水位や角度を状態で動かせる。
   *
   * 種類ごとに書ける欄が違う (`図形の表`)。 知らない種類と欄は読み取りが知らせる。
   */
  shape?: DslDynShape;
  /**
   * 箱に出す題 (`title:`、 #1381)。 書かなければ名前がそのまま題になる。
   *
   * 名前は図の中で 1 つに決まる必要がある (`focus:` と `flow:` が名前で指すため) 一方、
   * 題は重なってよい。 同じ題の箱を並べる図と、題を持たない箱を、名前と切り離して書ける。
   */
  title?: string;
  /**
   * その箱を出すかどうかの条件 (`visibleIf:`、 #1381)。
   *
   * 状態を差し込める文字列で、描画側が真偽を判定する。 `"0"` / `"false"` / 空文字が偽で、
   * それ以外は真。 値だけを見せる図が、場所を空けるためだけの見えない箱を置くのに使う。
   */
  visibleIf?: string;
  /**
   * 箱の幅と高さを値に追随させる (`wBind:` / `hBind:`、 #1392)。
   *
   * 状態の名前を `{名前}` の形で書く。 配置計算は追随前の `posW` / `posH` を使い、
   * 描く時だけ値に合わせて伸び縮みする (矢印の通り道が動かないようにするための分離)。
   */
  wBind?: string;
  hBind?: string;
  /**
   * 箱の濃さ (`opacity:`、 #1392)。 0 から 1 の数か、状態の名前を書く。
   *
   * 書かなければ完全に見える状態になる。 `visibleIf` が出す / 出さないの 2 値なのに対し、
   * こちらは途中の濃さを持てる。
   */
  opacity?: number | string;
  /**
   * 描く時だけ箱をずらす量 (`renderOffsetX:` / `renderOffsetY:`、 #1392)。
   *
   * 配置計算と矢印はずらす前の位置を使うため、円周上に並べて見せる等の見た目専用。
   * 数か、状態の名前を書く。
   */
  renderOffsetX?: number | string;
  renderOffsetY?: number | string;
  /**
   * 工程の並び (`type: gantt`) で、その工程の担当 (#1251)。
   *
   * 他の図種では相手が無いため、書かれていたら組み立て側が知らせる。
   */
  owner?: string;
  /**
   * 工程の並び (`type: gantt`) で、その工程が終わる時期 (#1251)。
   *
   * 書かなければ始まりと同じ時期に終わる (帯が 1 コマ)。 `{名前}` を書くと状態から取り、
   * 段で帯が伸び縮みする様子を見せられる。
   *
   * 他の図種では相手が無いため、書かれていたら組み立て側が知らせる。
   */
  end?: string;
  /**
   * 体験の道筋 (`type: journey`) で、その段階が起きる場所 (#1251)。
   *
   * 「どこで起きたか」 を段の下に出す。 他の図種では相手が無いため、書かれていたら
   * 組み立て側が知らせる。
   */
  touchpoint?: string;
  /**
   * 体験の道筋 (`type: journey`) で、その段階の改善の余地 (#1251)。
   *
   * 気持ちが落ちる段に「何を直せるか」 を添える。 他の図種では相手が無いため、
   * 書かれていたら組み立て側が知らせる。
   */
  opportunity?: string;
  lane?: string;
  stack?: number;
  initial?: boolean;
  final?: boolean;
  /**
   * 箱の色。 未指定なら種類ごとの既定色。
   *
   * 矢印 (`DslStep.tone`) と同じ名前と別名を受け付ける (`成功` / `success` 等)。
   * 効く種類は cdl 側の 26 種で、 それ以外は指定しても色が変わらない。
   */
  tone?: Tone;
  /**
   * CAR-1657 parts unified syntax = kind が既存 NODE_KIND_VALID に無い値 (parts identifier 候補)
   * だった時、 parser は partId に格納して compile 側に委譲する。 compile 時に partsCatalog から
   * 対応する CdlDiagram を lookup + merge する経路。 partId set 時は kind = "actor" (default) fallback。
   */
  partId?: string;
  /**
   * `色:` に色番号を書いた時の値。 どの状態に入れるかは組み立て時に決める。
   *
   * 色を保持する状態の名前はパーツごとに違う (`bg` / `stFill` / `gFill` / `hue` など 17 種)。
   * 解析の時点ではパーツの定義を知らないため、 名前を決めずに持っておく。
   */
  colorHex?: string;
  /**
   * parts state override (partId set 時のみ有効)。 kind + 既存 reserved fields を除いた
   * inline option の残り (`v: 50` / `count: 100` 等) を state 名 → initial 値 map として保持。
   * compile 時に parts.states[i].initial を上書きする。
   */
  stateOverride?: Record<string, number | string | boolean>;
  /**
   * canvas pivot 新 spec (dragon canvas pivot spec §layout-role-conversion)。
   * user drag / resize で明示的に固定した絶対座標 / サイズ。 4 field set 済なら CDL layout が
   * 該当 actor 由来 lane / node の位置計算を skip、 posX / posY / posW / posH をそのまま採用する。
   * 未指定なら従来の auto layout (catalog 100+ backward compat 保証)。
   */
  posX?: number;
  posY?: number;
  posW?: number;
  posH?: number;
  /**
   * 見本を何倍で描くか (`倍率: 2` / `scale: 2`、 #1026)。 partId set 時のみ有効。
   *
   * `大きさ:` (`posW` / `posH`) とは掛け合わさる。 画面側も同じ意味で読むため、
   * `scale` は状態の名前としては使えない (予約語)。 状態を上書きしたい時は
   * `state: { scale: 2 }` と明示するか、別の名前を使う。
   */
  scale?: number;
  /**
   * 倍率として書かれた項目名 (`scale` / `倍率`、 #1026)。
   *
   * 値が読めない形 (`scale: x`) と書いていない形を見分けるために持つ。 見本が同じ名前の
   * 状態を持つ時の知らせ (`scale-reserved`) が、値の読めなさに左右されないようにする。
   */
  scaleKeys?: string[];
  /**
   * 位置を他の要素からの相対で書いた時の指定 (`位置: Web の右 200`)。
   *
   * 組み立ての段階で 1 度配置を計算し、 基準の実座標から `posX` / `posY` に直す。 解決後は
   * 座標を直接書いた時と同じ経路を通るため、 効き方は書き方によって変わらない。
   */
  posRel?: RelativePos;
  /**
   * canvas pivot UX 修正 (B1 individual node isolation)。 actor 1 件が生成する複数 sub-node
   * (sequence の header / spacer / footer / s{N} 等) の中で「特定 sub-node だけを固定 / resize」
   * するための nested override map。 key = sub-node id 相当の short key (`header` / `footer` /
   * `spacer` / `s0` 等)、 value = posX/Y/W/H の 4 field。 compile 側は対応 CDL node に単独反映、
   * 同 actor の他 sub-node は影響を受けない (lane 全体 posX とは独立経路)。
   */
  nodes?: Record<string, DslActorNodeOverride>;
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` 由来の layout offset。 未指定は auto
   * layout の compute value そのまま (backward compat)、 set 済なら Phase 2 の applyPosOffset で
   * (auto x + layoutPos.x, auto y + layoutPos.y) に shift される。 既存 posX/posY (絶対座標) は
   * 別 mechanism で、 layoutPos は auto layout からの nudge (dx, dy)。
   */
  layoutPos?: LayoutPos;
  pos: Position;
};

/**
 * canvas pivot UX 修正 (B1) = actor 内 sub-node 単位で「絶対座標 / サイズ」 を固定するための
 * override 値。 全 field optional、 posX / posY が両方 set 済なら CDL 側で該当 sub-node の
 * auto layout を skip、 明示座標をそのまま採用する。 posW / posH は width / height の上書き。
 */
export type DslActorNodeOverride = {
  posX?: number;
  posY?: number;
  posW?: number;
  posH?: number;
};

/** 流れ (1 行 = 1 step) (v0.5+ ... inline option 拡張) */
export type DslStep = {
  no: number;
  from: string;
  to: string;
  label: string;
  sub?: string;
  tone?: Tone;
  style?: EdgeStyle;
  /** v0.5+ inline option */
  guard?: string;
  cardinality?: string;
  /**
   * 矢印を値に追随させる欄 (`widthBind:` / `strokeBind:` / `dashOffsetBind:`、 #1396)。
   *
   * 箱の `wBind` (#1392) と同じ形で、状態やつまみの名前を `{名前}` で書く。
   * 太さ / 色 / 破線の位置がその値に合わせて動く。 通り道そのものは動かない。
   */
  widthBind?: string;
  strokeBind?: string;
  dashOffsetBind?: string;
  /** 矢印がどの辺から出るか (#1385)。 書かなければ描画側が自動で選ぶ */
  side?: "top" | "right" | "bottom" | "left";
  labelOffsetX?: number;
  labelOffsetY?: number;
  /** true で説明文を矢印の線の上に重ねる。 分岐図の条件ラベル用。 */
  overlay?: boolean;
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` 由来の layout offset。 step の edge
   * label 位置を auto layout compute から (dx, dy) shift する。 未指定は auto、 set 済は Phase 2 で適用。
   */
  layoutPos?: LayoutPos;
  pos: Position;
};

/** lane 宣言 (v0.5+ top-level lanes section) */
export type DslLane = {
  id: string;
  x?: number;
  width?: number;
  label?: string;
  contain?: boolean;
  lifeline?: boolean;
  /**
   * canvas pivot (CAR-1693 Phase 1) DSL 表面 `pos: {x, y}` 由来の layout offset。 lane の x 座標を
   * auto layout compute から (dx, dy) shift する。 未指定は auto、 set 済は Phase 2 で適用。
   */
  layoutPos?: LayoutPos;
  pos: Position;
};

/** group 宣言 (v0.5+ top-level groups section、 topology preset 専用) */
export type DslGroup = {
  id: string;
  label?: string;
  lanes: string[]; // 内包する lane id
  pos: Position;
};

/** viewport 全体仕様 (v0.5+ top-level viewport section) */
export type DslViewport = {
  width?: number;
  height?: number;
  /**
   * 図全体の倍率 (default 1)。 箱 / 文字 / 線 / 間隔のすべてが等比で拡大縮小される。
   *
   * `laneWidth` / `laneGap` / `nodeGap` は **間隔だけ**を動かすため、 箱の大きさは変わらず
   * 図に占める割合はむしろ下がる。 本 field は cdl 側で座標系ごと拡大するので、
   * 見た目の比率が完全に保たれる (SVG user unit 固定の font-size も追従する)。
   */
  scale?: number;
  laneWidth?: number;
  /** 全体 default gap (互換維持、 個別 laneGap / nodeGap / labelMargin の fallback) */
  gap?: number;
  /** lanes 間 horizontal gap */
  laneGap?: number;
  /** nodes 間 vertical gap within lane */
  nodeGap?: number;
  /** edge label 周辺余白 */
  labelMargin?: number;
  pos: Position;
};

/** アニメーション ブロック */
export type DslAnimate = {
  states: DslState[];
  phases: DslPhase[];
  pos: Position;
};

/** 状態宣言 */
export type DslState = {
  name: string;
  initial: number | string;
  pos: Position;
};

/**
 * 値が動き出すきっかけ (#1161 段 2)。
 *
 * `step` は段が始まった時、 `reaches` は別の値が境目を越えた時。 どちらも「成り立った瞬間の
 * 出来事」 で、 常に成り立つ関係を表す式とは別物 (spec § 2.3)。
 */
export type DslValueTrigger =
  | { kind: "step"; step: string }
  | {
      kind: "reaches";
      /** 見張る相手の値の名前 */
      source: string;
      op: ">=" | ">" | "<=" | "<" | "==" | "!=";
      threshold: number;
    };

/**
 * 記法の `values:` の 1 件。 形は 2 つある。
 *
 * | 形 | 持つもの | 意味 |
 * |---|---|---|
 * | 式 | `expression` | 常に成り立つ関係。 時間を持たない |
 * | きっかけ | `trigger` / `to` / `durationMs` | きっかけから `to` まで動く。 時間を持つ |
 *
 * 両方を持つ形は無い (parser が弾く)。 きっかけ形は組み立ての時点で段の時計を読む式へ畳まれる
 * ため、 図に載る時にはどちらも `derived` になる。
 */
export type DslValue = {
  name: string;
  pos: Position;
} & (
  | {
      /** 式そのもの。 評価は描画側が毎 frame 行う */
      expression: string;
      trigger?: never;
      to?: never;
      durationMs?: never;
    }
  | {
      expression?: never;
      /** 動き出すきっかけ */
      trigger: DslValueTrigger;
      /** 動いた先の値 */
      to: number;
      /** 動く長さ (ms) */
      durationMs: number;
    }
);

/** ステップ (phase) */
export type DslPhase = {
  name: string;
  durationMs: number;
  highlight?: string[]; // active 化対象 (node 名 / edge 名)
  tweens?: DslTween[]; // state lerp
  sets?: DslSet[]; // state 即時遷移
  body?: string;
  badge?: string;
  /**
   * その段で起点から描くもの (#1312 / #1314 / #1318)。
   *
   * 受ける語は `line` / `bar` / `pie` / `journey` / `mind` / `tree` / `gantt` / `funnel`。
   * 語と同じ図種で、その段の間に線・棒・扇・枝・帯・段が各図の起点から現れる。
   *
   * **最上位ではなく段に置く**。 記法は動き (`tween` / `set` / `focus` / `badge`) を段に、
   * 静的な性質 (`eyebrow` / `axes`) を最上位に書く分け方を既に持つ。 起点から描くのは動き。
   *
   * 相手の名前は書かせない = 対象の 8 図種はいずれも図全体を 1 箱で描くため相手が決まる。
   */
  draw?: string;
  /**
   * 描き終えるまでに段の何割を使うか (#1441)。
   *
   * `draw: line 0.4` のように語の後ろに書く。 0 より大きく 1 以下。
   * 書かなければ段の終わりに描き終わる (従来どおり)。
   *
   * **段の長さと描く速さを切り離すための欄**。 伸び具合は段の進みそのものなので、
   * これが無いと「線はゆっくり引きたいが値の移りは短くしたい」 が書けず、描く速さのために
   * 段の長さを動かすことになる。 段の長さを動かすと同じ段の `tween` まで遅くなる。
   *
   * **`draw` と同じ行に書かせる**。 別の項目にすると「割合だけ書いて `draw` が無い段」 が
   * 書けてしまい、何も起きない指定になる。 同じ行なら書けない。
   */
  drawRatio?: number;
  /**
   * `draw` を書いた行 (#1312)。 知らせの行番号に使う。
   *
   * 段の `pos` は `- step:` の行を指すため、そこを使うと「段の 3 行目に書いた `draw` が
   * 効かない」 を段の先頭行として知らせることになる。
   */
  drawPos?: Position;
  pos: Position;
};

/** state lerp (遷移) */
export type DslTween = {
  state: string;
  from: number;
  to: number;
  pos: Position;
};

/** state 即時遷移 (切替) */
export type DslSet = {
  state: string;
  value: string | number;
  pos: Position;
};

/** Parser error (行番号付き) */
export type DslError = {
  line: number;
  message: string;
  hint?: string;
};

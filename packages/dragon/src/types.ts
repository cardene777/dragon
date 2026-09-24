/**
 * Text DSL の AST 型定義
 * docs/cdl/text-dsl-spec.md の文法を AST に変換した中間表現
 */

import type { CdlDiagram, NodeKind, Tone, EdgeStyle, EdgeHead, EdgeHeadFill, EdgeReveal, RelationFocus, ClassRelationType, SequenceMessageKind } from "@cardenelabs/cdl";
import type { DslOnlyKind } from "./v05/parser";
import type { DslDirection, DslPalette } from "./keywords";

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

/**
 * 値を見せる部品 (#1374)。 図形と同じ理由で描画側の型をそのまま使う。
 *
 * `pos` は書いた行 (#2405)。 読む元の名前を突き合わせた知らせが、直す行を指すのに使う。
 * **図へ載せる時に外す** (`compile.ts` の読み取り値を載せる所) = 残すと、行を足しただけで
 * 組み上がる図が変わる。 JSON から読んだ文書は行を持たないため `undefined` になる。
 */
export type DslReadout = NonNullable<CdlDiagram["readouts"]>[number] & { pos?: Position };

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
  | "flowchart"
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
  | "slope"
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
 * 自動で決まった位置からのずらし (dx, dy) (#1971)。
 *
 * JSON は `pos: { x, y }`、記法は `offsetX` / `offsetY` で書く。 内部では、行番号を持つ
 * `pos: Position` と名前が重ならないよう `layoutPos` に入れる。
 *
 * 書かなければ自動の配置のまま。 書くと組み立ての出口 (`applyLayoutOffsets`) が 1 度配置してから
 * 配置後の位置に足して置き直す。 箱と縦列は位置が動き、矢印は名前のずらしに足す。
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
  /**
   * 動いている間の帯 (#1466)。 順序図だけが読む。
   *
   * 書かなければ面ごとに「最初に関わった段から最後まで」 の 1 本。 途中で手が空く面を
   * 分けたい図だけ書く = どこで手が空くかは言づての並びからは決まらない。
   */
  bands?: DslBand[];
  /**
   * 矢印をいつ出すか (`reveal:`、 #1470)。
   *
   * 既定 (`phase`) は「段が名指しする矢印は、その段が来るまで描かない」。 `all` と書くと
   * 段に関わらず最初から全部描く。 描き手の `CdlDiagram.edgeReveal` にそのまま渡る。
   */
  reveal?: EdgeReveal;
  /**
   * 箱に触れると関係する線だけを光らせるか (`relations:`、 #1757)。
   *
   * 既定 (`off`) は何もしない。 `hover` と書くと、箱に触れた時に その箱 ・ 繋がる線 ・
   * 相手の箱だけが光り、他が沈む。 描き手の `CdlDiagram.relationFocus` にそのまま渡る。
   *
   * クラス図と ER 図は **順番を持たない** 図で、段を追う見せ方は「どの順で読ませるか」 しか
   * 運ばない。 触れた箱の関係を光らせれば、読み手の問いにその場で答えられる。
   */
  relations?: RelationFocus;
  /**
   * 図の並ぶ向き (`direction:`、 #1494)。
   *
   * `縦` は 1 つの縦列に積み、`横` は 1 人ずつ縦列を作る。 効くのはフローと泳法図だけで、
   * 他の図種は並び方そのものが読み方を担うため書いても効かない (知らせを出す)。
   *
   * 全ての箱が縦列を書いた形では、書いた縦列が勝つ (同じく知らせを出す)。
   */
  direction?: DslDirection;
  /** `direction:` を書いた行。 効かない時の知らせで、書いた場所を指すために持つ */
  directionPos?: { line: number };
  /**
   * 図の配色 (`palette:`、 #1553)。
   *
   * 名前だけを持つ。 実際の色は消費側 (`cdl-theme.css`) が決めるので、ここには値を書かない。
   * ER 図とクラス図は書かなくても `kinari` (生成りに茶) になる。 どちらも箱の作りが同じ
   * (行頭の印 + 左に名前 + 右に型) で、名前と型が離れて並ぶため、行を横に追う目印
   * (行の縞) が要る。 縞の色は配色からしか来ないので、既定が無いと縞が箱の面と同じ色に
   * 落ちて 1 本も出ない。 書き手が `palette:` を書いた時はそちらが勝つ。
   */
  palette?: DslPalette;
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
   * 行頭の印 (#1466)。 `rows` と同じ並びで、空文字はその行に印を付けない。
   *
   * **語の意味は図の種類が決める**。 ER は `pk` / `fk` / `opt`、状態遷移は
   * `entry` / `exit` / `do` / `internal`。 印の 2 軸 (形 × 塗り) は共通だが、その軸が
   * 何を指すかは種類ごとに違う。
   */
  marks?: string[];
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
   * 部品に `color:` で書いた色の名前 (`成功` 等) (#1973)。
   *
   * 部品の色の状態は色番号しか受けず、色の名前は箱の色 (`tone`) にしか効かない。 部品には
   * 箱の色を渡さないため、書いても絵が変わらない。 黙って捨てると手掛かりが残らないので、
   * 書いた名前を残して組み立て側が知らせる。
   */
  partColorName?: Tone;
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
   * 箱の位置のずらし (#1971)。 配置後の箱の中心を (x, y) だけ動かす。 `posX` / `posY` (座標) とは
   * 別の欄で、座標も書いた時は座標で置いた位置からずらす。 見本 (parts) は見本 1 つ分をまとめて動かす。
   * 同じ縦列の箱に近づくと、描画側が間隔を保つようそちらを押し下げる。
   */
  layoutPos?: LayoutPos;
  pos: Position;
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
  /**
   * 矢印の先の形 (#1462)。 書かなければ従来どおり塗った三角。
   *
   * 4 図の設計は **端の形で関係の種類を示す** = 三角 (継承・実装) / 菱 (集約・コンポジション) /
   * 開いた矢 (関連・依存) / 鳥の足 (多)。 書けないと 4 種とも同じ三角になり、
   * 線の種類 (実線 / 点線) だけで 6 種の関係を区別することになる。
   *
   * 受ける語は描画側の `EDGE_HEADS` から導く = 描画側が増やせば書けるようになる。
   */
  head?: EdgeHead;
  /** 出どころ側の端の形 (#1466)。 ER は端ごとに違う個数を示すので両端に要る */
  tailHead?: EdgeHead;
  /** 端の印の塗り (#1466)。 白抜きの菱が集約、塗った菱がコンポジション */
  headFill?: EdgeHeadFill;
  /** 出どころ側の印の塗り (#1466) */
  tailHeadFill?: EdgeHeadFill;
  /**
   * クラス図の出どころ側の多重度 (#1771)。 `sub` (行き先の端の多重度) と対。
   *
   * クラス図でだけ効く (関係の語 `relation` と同じ)。 engine が出どころの端の近くに添える。
   */
  tailSub?: string;
  /**
   * クラス図の関係の種類 (#1466)。 書くと線と端の形と塗りと付く側がまとめて決まる。
   *
   * 4 つを個別に書かせないのは、組合せが 6 通りしか無く、1 つでも書き違えると読み手に
   * 別の意味で伝わるため (菱を逆に置くと持ち主が入れ替わる)。
   */
  relation?: ClassRelationType;
  /**
   * 言づての種類 (#1466)。 順序図で線と矢の形がまとめて決まる。
   *
   * `kind` にしないのは、箱の種類 (`DslActor.kind`) と同じ語が別の意味を持つため。
   */
  msgKind?: SequenceMessageKind;
  /** 辺の役目 (cdl#618)。 `main` を書いた辺だけ「いま」 の色で引く */
  role?: "main";
  /** 名前の下地を敷くか (cdl#618)。 書かなければ敷く */
  labelPlate?: boolean;
  labelOffsetX?: number;
  labelOffsetY?: number;
  /** true で説明文を矢印の線の上に重ねる。 分岐図の条件ラベル用。 */
  overlay?: boolean;
  /**
   * 矢印の位置のずらし (#1971)。 矢印の通り道は両端の箱で決まるので、名前のずらし
   * (`labelOffsetX` / `labelOffsetY`) に足して名前だけを動かす。
   */
  layoutPos?: LayoutPos;
  /**
   * 部品 (parts) の端で、矢印を繋ぐ部品の中の要素の id (#1979)。 出どころ側が `fromPartNode`、
   * 行き先側が `toPartNode`。
   *
   * 要素を 1 つだけ持つ部品は書かなくてもその要素に繋ぐ。 要素を 2 つ以上持つ部品は外枠を持たず
   * 同格の要素が並ぶため、1 つを自動で選ぶと「その要素だけ」 を指す矢印に見える。 書き手が名指しする。
   */
  fromPartNode?: string;
  toPartNode?: string;
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
   * 縦列の位置のずらし (#1971)。 配置後の縦列の左上を (x, y) だけ動かし、中の箱も一緒に動く。
   * 1 本でもずらすと全ての縦列を配置後の位置と大きさで固定し、動いた箱を元の位置に留めるので、
   * 他の縦列とその箱は動かない。
   */
  layoutPos?: LayoutPos;
  pos: Position;
};

/**
 * 組の宣言 (v0.5+ top-level groups section)。
 *
 * `lanes` に並べた縦列とその中の箱を、 縦列の位置が決まった後に 1 つの枠 (`group-{id}`) で囲む (#1972)。
 * 図に無い縦列は除いて囲み、 1 本も無ければ枠を描かない。 間に束ねない縦列を挟むと、 その縦列ごと囲む。
 * どちらも知らせで伝える。
 */
export type DslGroup = {
  id: string;
  label?: string;
  lanes: string[]; // 囲む縦列の id
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

/**
 * 動いている間の帯 (#1466)。 順序図で、面がいつ動いているかを言づての番号で持つ。
 *
 * `from` / `to` が指すのは **板に載る言づての行** で、0 から数える (#2404 で実測)。
 * 段 (`animation` の `step`) ではない = 数も起点も違う。
 *
 * `pos` は書いた行 (#2404)。 名前と番号を突き合わせた知らせが、直す行を指すのに使う。
 * JSON から読んだ文書は行を持たないため `undefined` になる (矢印の飾りの知らせと同じ扱い)。
 */
export type DslBand = { actor: string; from: number; to: number; pos?: Position };

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

/**
 * 後から読む図の種類の部品の組の形 (#3656)。
 *
 * 描く本体 (`render/draw.ts`) は、後から読む種類の並べ方、札の時刻の直し、描き方、段で動く物を、種類の名前で登録簿 (`kinds/registry.ts`) から引いたこの組から呼ぶ。
 * 種類ごとの描く部品の入口 (`kinds/<種類>.ts`) が `parts` の名前で組を1つ出し、描く本体は種類の名前を並べた分かれ道を持たない。
 * 種類を足す時は組を足し、描く本体を直さない。組に書かない部品は、描く本体が全ての種類と同じ描き方で描く。
 * この file は型だけを持ち、最初に読む script に字を足さない
 */
import type { SubChange } from "../blocks/box/draw";
import type { CarrierTime } from "../blocks/carry/timing";
import type { FieldChange } from "../blocks/strip/draw";
import type { Layout, Rect, SceneEdge, SceneField } from "../layout/scene";
import type { ColorKey } from "../look/values";
import type { RenderOptions } from "../render/draw";
import type { Motion } from "../render/motion";
import type { Ctx } from "../render/parts";
import type { DiagramModel } from "../schema";
import type { Timeline } from "../timeline";
import type { NotationLang } from "../words";

/** 並べ方と並べる前の直しが読む、描く時に渡した設定。枠の幅と、開く呼び出しの番号と、呼ぶ側が渡す語 */
export type KindOptions = Pick<RenderOptions, "width" | "open" | "words" | "anchors" | "overlay">;

/** 種類の描き方が描いた物。図の層ごとの字と、描く本体に渡す物 */
export interface KindDrawn {
  /** 線の下に描く物 */
  base?: string;
  /** 光った線 */
  lit?: string;
  /** 箱と同じ層に描く物 */
  node?: string;
  /** 線と箱の上に描く物 */
  top?: string;
  /** 共通の線と箱と札を描いた後に、いちばん上に描く物。動きの名前は呼んだ順に付くので、描く本体が共通の線を描いた後に呼ぶ */
  after?(this: void): string;
  /** その種類の図の SVG にだけ書く見た目の規則 */
  css?: string;
  /** 図の `svg` の要素に足す属性 */
  attrs?: string;
  /** 段ごとに光らせる箱。書かない種類は、段の線と処理が触る箱を光らせる */
  on?: Map<string, number[]>;
  /** 共通の描き方で線を描き始める時刻。描かない線は `undefined`。書かない種類は全ての線を描く */
  edge?(this: void, edge: SceneEdge): number | undefined;
}

/** 全体図に描く部品。`band` は地の枠、そうでなければ札 */
export interface OverviewShape {
  rect: Rect;
  band: boolean;
  color: ColorKey;
}

/** 後から読む種類の部品の組。`L` はその種類の並べ方が返す置き場所 */
export interface KindParts<L extends Layout = Layout> {
  model?: {
    from(this: void, model: DiagramModel, version: number): import('../schema').Diagram;
    to(this: void, diagram: import('../schema').Diagram): DiagramModel;
  };
  validate?(this: void, diagram: import("../schema").Diagram): string[];
  notation?: {
    matches(text: string): boolean;
    print?(this: void, diagram: import("../schema").Diagram): string;
    read(text: string): import("../parser").Parsed;
  };
  mountInput?(this: void, host: HTMLElement, diagram: import("../schema").Diagram, options: import("../player").PlayerOptions): import("../player").Player;

  /** 並べる前に原本を直す。配管の図は、開くと頼まれていない呼び出しの内側の段を 1 つの段にまとめる (#3389) */
  fold?(this: void, model: DiagramModel, options: KindOptions, lang: NotationLang): DiagramModel;
  /** 並べ方 */
  layout(this: void, diagram: DiagramModel, lang: NotationLang, options: KindOptions): L;
  /** 札の時刻の直し。図の種類を問わず組んだ時刻の表 (`buildTimeline`) を受け取る */
  times?(this: void, diagram: DiagramModel, timeline: Timeline): Timeline;
  /** 描く間だけ使う、運ぶ物の見えている間。書かない種類は時刻の表のまま */
  carried?(this: void, timeline: Timeline): CarrierTime[];
  /** 描く道具に足す口 (手順の図の箱の縁と名前)。描く道具を作る時に 1 度だけ呼ぶ */
  hooks?(this: void, m: Motion, timeline: Timeline): Partial<Ctx>;
  /** 描き方。`subs` は箱の下の字、`follow` は寄って追う窓で描くか、`fields` は値の欄ごとの移り変わり */
  draw?(
    this: void,
    layout: L,
    diagram: DiagramModel,
    ctx: Ctx,
    subs: Map<string, SubChange[]>,
    follow: boolean,
    fields: ReadonlyMap<string, FieldChange[]>,
  ): KindDrawn;
  /** 値の表の物差しの欄 (時間軸の図、#3165) */
  meter?(this: void, field: SceneField & { meter: NonNullable<SceneField["meter"]> }, keys: [number, number][], ctx: Ctx): string;
  /** 段で動く物。寄って追う窓が寄せる所を決める時に見る */
  focus?(this: void, layout: L, diagram: DiagramModel, step: number): Rect[];
  /** 寄って追う窓が段の終わりに見せる所の真ん中。書いた種類は番号の丸へ寄せ直さない。`undefined` なら前の段の所に留まる */
  aim?(this: void, layout: L, timeline: Timeline, step: number, parts: Rect[], vw: number, vh: number): [number, number] | undefined;
  /** 寄って追う窓が見せ始める高さ */
  top?(this: void, layout: L): number;
  /** 全体図に描く部品 */
  overview?(this: void, layout: L): OverviewShape[];
  /** 箱の札を種類の描き方が描く。描く本体は共通の箱の札を描かず、崩れの確かめにも数えない */
  ownBoxes?: true;
  /** 状態遷移図と同じく、済んだ線と番号を灰にし、着いた箱を光らせる */
  states?: true;
}

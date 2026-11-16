/**
 * 時系列図の見た目 (#3720) の名前と、見た目の部品の組の置き場。
 *
 * 種類の行に `[shape: pipe]` を書いた時系列図は、パイプ図の部品で並べて描く (Tracelyth #86、#91、#93、#97)。
 * 並べ方と描き方 (`layout/sequence-pipe.ts` と `render/sequence.ts`) は大きいので、軽い入口が最初に読む量に入れず、置き場だけを最初から持つ。
 * 全部を持つ入口と書き出しは読み込みの時に組を置き (`look-all.ts`)、軽い入口は `loadLook` が後から読んで置く (`light.ts`)。
 * 見た目を書かない時系列図は、組を使わずに今の並べ方と描き方で描く。
 */
import { FIGURE_TEXT } from "../figure-text";
import type { Layout, Rect } from "../layout/scene";
import type { Corner, Palette, Theme } from "../look/values";
import { type DiagramModel, SEQUENCE_SHAPES, type SequenceShape } from "../schema";
import type { Timeline } from "../timeline";
import { isBlankOrComment, tokenize } from "../tokenize";
import type { NotationLang } from "../words";
import type { Motion } from "./motion";
import type { Ctx } from "./parts";

/** 見た目の部品が描いた部品を積む層。下から順に帯、線と生存線、光る線、列の頭、段の番号、札 */
export interface LookLayers {
  band: string[];
  base: string[];
  lit: string[];
  node: string[];
  badge: string[];
  top: string[];
}

/**
 * 時系列図の見た目の部品の組。並べ方が返した置き場所 (`layout`) を、同じ組の描き方へ渡す。
 * 寄って追う形では、列の頭と器と札を窓の上端に留める帯 (`band`) を描き、帯の下端 (`shelf`) から見せ始める
 */
export interface SequenceLook {
  /** 並べ方 */
  layout(diagram: DiagramModel, lang: NotationLang): Layout;
  /** 列の頭と線と札と段の番号と処理の札を層へ描く。共通の部品はこれらを描かない */
  draw(layout: Layout, timeline: Timeline, ctx: Ctx, layers: LookLayers): void;
  /** 寄って追う形で窓の上端に留める帯 */
  band(layout: Layout, timeline: Timeline, m: Motion, pad: number, corner: Corner): string;
  /** 留める帯の高さ */
  bandHeight(layout: Layout, pad: number): number;
  /** 列の頭の下の器と札の下端 */
  shelf(layout: Layout): number;
  /** 段 `step` を見せる窓の真ん中。`focus` は段で動く物を囲んだ範囲、`prev` は前の段の真ん中、`vw` と `below` は窓の幅と帯の下の高さ */
  follow(layout: Layout, step: number, focus: Rect | undefined, prev: [number, number], vw: number, below: number): [number, number];
  /** 寄って追う形の窓の高さを幅の何倍にするか */
  followAspect: number;
  /** 見た目の規則。この見た目の図の SVG にだけ書く */
  css: string;
  /** 色味と明暗ごとの値。図の値の行に足す */
  vars(palette: Palette, theme: Theme): string;
}

let pipe: SequenceLook | undefined;

/** パイプ図の部品で描く時系列図の見た目の組を置く */
export function registerSequenceLook(look: SequenceLook): void {
  pipe = look;
}

/** パイプ図の部品で描く時系列図の見た目の組を今すぐ使える形で持っているか */
export const sequenceLookLoaded = (): boolean => pipe !== undefined;

const isShape = (value: unknown): value is SequenceShape => (SEQUENCE_SHAPES as readonly unknown[]).includes(value);

/** 記法の種類の行の最後の `[...]` に書いた `shape` の値 */
function headShape(text: string): string | undefined {
  const head = tokenize(text).find((source) => !isBlankOrComment(source))?.text ?? "";
  if (head.split(/\s/u)[0] !== "sequence") return undefined;
  const attrs = /\[([^\]]*)\]\s*$/u.exec(head)?.[1] ?? "";
  return /(?:^|[\s,])shape\s*:\s*"?([^\s,"\]]+)/u.exec(attrs)?.[1];
}

/**
 * 記法か原本 (版1か版2) か読んだ図が選んだ時系列図の見た目。時系列図でない図と、見た目を書かない時系列図は `undefined`。
 * 知らない見た目の名前も `undefined` を返し、読む処理がその誤りを返す
 */
export function lookOf(source: unknown): SequenceShape | undefined {
  if (typeof source === "string") {
    const shape = headShape(source);
    return isShape(shape) ? shape : undefined;
  }
  if (typeof source !== "object" || source === null) return undefined;
  const { kind, sequence } = source as { kind?: unknown; sequence?: { shape?: unknown } };
  return kind === "sequence" && isShape(sequence?.shape) ? sequence.shape : undefined;
}

/** 読んだ図 `diagram` が選んだ見た目の組。見た目を書かない図は `undefined`。組を読んでいない時は `lang` の言葉で断る */
export function sequenceLookFor(diagram: DiagramModel, lang: NotationLang): SequenceLook | undefined {
  if (lookOf(diagram) === undefined) return undefined;
  if (pipe === undefined) throw new Error(FIGURE_TEXT[lang].sequenceLookNotLoaded);
  return pipe;
}

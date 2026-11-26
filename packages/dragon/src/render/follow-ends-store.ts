/**
 * 種類の部品の組を持たない構成図 (`architecture`) の、寄って追う窓の線の端の箱と名前の札 (#3871) の置き場。
 *
 * 札を描く処理 (`render/follow-ends.ts`) は寄って追う窓でだけ使うので、軽い入口が最初に読む量に入れず、置き場だけを最初から持つ。
 * 全部を持つ入口と頁の再生の script と書き出しは読み込みの時に置き (`look-all.ts`)、軽い入口は `loadFor` が構成図を描く前に後から読んで置く。
 * 置く前に描いた構成図は、窓を引いても切れた箱に名前の札を出さない。
 */
import type { EndView, FollowEnds } from "../kinds/parts";
import type { Layout } from "../layout/scene";
import type { DiagramModel } from "../schema";

/** 線の端の箱を挙げる部品を組む関数 */
export type EndsMaker = (layout: Layout, diagram: DiagramModel, view: EndView) => FollowEnds;

let architecture: EndsMaker | undefined;

/** 構成図の線の端の箱の部品を置く */
export function registerArchitectureEnds(ends: EndsMaker): void {
  architecture = ends;
}

/** 置いた構成図の線の端の箱の部品。置く前は `undefined` */
export const architectureEnds = (): EndsMaker | undefined => architecture;

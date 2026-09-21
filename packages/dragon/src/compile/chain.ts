import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslActor, DslDocument } from "../types";
import { 書いた縦列に置く } from "./lanes";
import { lookupPartRaw } from "./parts-lookup";
/**
 * 箱を鎖のように 1 本につなぐ形か (#2030 で `compile.ts` から移した)。
 *
 * 図種ごとの file と、`compile.ts` に残る部品の取り込みの両方が呼ぶ。
 */

/**
 * 静止した `type: flow` かどうか。 この形だけ矢印を鎖状に作る (`compileFlow`)。
 *
 * 段を持つ形・縦列を書いた形・向きを書いた形は generic 経路へ回るため鎖にならない。
 *
 * **`compileFlow` の分岐もこの判定を使う**。 判定を 2 か所に書くと、組み立てだけが別経路へ回り、
 * 行の対応と端の知らせが鎖のまま残る。 向きを書いた形 (#1494) は組み立てにだけ足され、`A -> C` に
 * 書いた `head` が `C -> B` に載り、書いた端のとおりの矢印に「端は使われません」 が出ていた (#1986)。
 */
export function 鎖でつなぐ形か(doc: DslDocument): boolean {
  if (doc.type !== "flow") return false;
  return !鎖にしない書き方.some((x) => x.あてはまる(doc));
}

/**
 * 鎖をやめて、書いた端どおりに繋ぐ書き方 (#2374)。
 *
 * **判定と案内を組にして持つ**。 以前は判定が 3 つの条件を見るのに、知らせの案内は
 * 手で並べた 2 つだった (実測 = 動きを書く経路が案内に無く、読み手はその道を知れなかった)。
 *
 * 表から判定を導き、案内も同じ表から作る。 条件を足した日に案内が自動で追随する。
 *
 * どれも図の見た目を変えるので、**優先順位は付けない**。 向きを書けば並びが変わり、
 * 縦列を書けば列ができ、動きを書けば段が付く。 どれを選ぶかは書き手が決める。
 */
export const 鎖にしない書き方: readonly {
  /** 検査と読み手のための短い呼び名 */
  名: string;
  /** その書き方をしているか */
  あてはまる: (doc: DslDocument) => boolean;
  /** 知らせの案内に出す文 */
  案内: string;
}[] = [
  {
    名: "動き",
    あてはまる: (doc) => doc.animate !== undefined && doc.animate.phases.length > 0,
    案内: "動き (animation:) を書く",
  },
  {
    名: "向き",
    あてはまる: (doc) => doc.direction !== undefined,
    案内: "向き (direction: 縦) を書く",
  },
  {
    名: "縦列",
    あてはまる: (doc) => 書いた縦列に置く("flow", doc),
    案内: "箱に縦列 (lane:) を書く",
  },
];

/** 知らせの案内に出す、鎖をやめる書き方の並び (#2374) */
export function 鎖にしない書き方の案内(): string {
  return 鎖にしない書き方.map((x) => x.案内).join(" / ");
}

/**
 * 静止したフローの鎖に並べる登場人物 (#1987)。
 *
 * **どの行にも書かれていない部品は鎖に並べない**。 並べると、部品の前後の並び順の矢印は書き手が
 * 部品へ引いたものではないため部品へ繋がずに外され (#1979)、部品を途中に置いた図から矢印が全て
 * 消えていた (実測 = `受付 / 印 / 出荷` で矢印 0 本、知らせ 0 件)。 編集画面は部品を本文から抜いてから
 * 鎖を作るので `受付 -> 出荷` を描き、カタログと絵が食い違っていた。 部品は図の下の格子に置くため、
 * 鎖から外しても流れの列に空きは生まれない。
 *
 * - 部品の一覧に無い部品は仮の箱のまま描かれるので残す (一覧を渡さない組み立ても同じ)
 * - 大きすぎて取り込まない部品は一覧にあるので外す (図に入らない場所へ鎖を通さない)
 * - 行の端に書かれた部品は残し、#1979 の繋ぎ方に従う
 *
 * 鎖を作る `compileFlow`、行との対応 (`鎖のどの行から来たか`)、端の知らせ
 * (`reportFlowEndpointNotHonored`) の 3 つがこの並びを使う。 1 つでも `doc.actors` を見ると、
 * N 本目の矢印と行の対応がずれる。
 */
export function 鎖に並べる登場人物(
  doc: DslDocument,
  partsCatalog: Record<string, CdlDiagram> | undefined,
): DslActor[] {
  if (!partsCatalog) return doc.actors;
  const 行に書かれた = new Set(doc.flow.flatMap((s) => [s.from, s.to]));
  // 部品でない箱は `partId` を持たず一覧を引けないので、一覧に無い部品と同じく残る
  return doc.actors.filter(
    (a) => 行に書かれた.has(a.name) || lookupPartRaw(partsCatalog, a.partId) === undefined,
  );
}

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
  if (doc.animate && doc.animate.phases.length > 0) return false;
  if (doc.direction !== undefined) return false;
  return !書いた縦列に置く("flow", doc);
}

/**
 * 静止した流れ図の鎖に並べる登場人物 (#1987)。
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

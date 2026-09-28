import type { DslDocument, PresetType } from "../types";

/**
 * 箱を並べる順 (`order:`、 #2655)。
 *
 * ## 型ではなく語で持つ
 *
 * 並べ替えの鍵しか持たない図種 (`solidity`) が在り、独自の組み立てを 1 行も持たずに
 * 箱を種類で並べ替えてから順序図の組み立てをそのまま呼んでいた。
 *
 * 型として持つと、振る舞いを書くたびに「順序図 または その型」 という条件を並べることになる。
 * 実際 `compile.ts` に 6 か所あり、**次に条件を足す人が片方を書き忘れれば黙って外れる**
 * 形になっていた。 差が並べ替えだけなら語で表す。
 *
 * ## 種類の順は 4 段
 *
 * 人 → 契約 → しまう場所 → 出来事 の順に置く。 元の実装が持っていた並びをそのまま移した。
 * **同じ段の中では書いた順のまま** = 比べる値が等しい時の並びは変わらない。
 *
 * 表に無い種類は最後に置く。 知らない種類を先頭へ寄せると、書き手が種類を書き間違えた図で
 * 並びが大きく崩れて原因が読めない。
 */
const 種類の段: Record<string, number> = {
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

/** 表に無い種類を置く段。 どの段よりも後ろになる数にする */
const 表に無い種類の段 = 5;

/**
 * 並び順を書ける図種 (#2655)。
 *
 * 順序図だけ。 他の図種は並び方そのものが読み方を担う (縦列が役割を表す / 段が階層を表す)
 * ので、外から並べ替えると図の意味が変わる。 書いても効かせず、書いたことを知らせる。
 */
export const 並び順を選べる図種: ReadonlySet<PresetType> = new Set<PresetType>(["sequence"]);

/** 書いた並び順が効くか (#2655) */
export function 並び順が効くか(doc: DslDocument): boolean {
  return doc.order !== undefined && 並び順を選べる図種.has(doc.type);
}

/**
 * 並び順を当てた文書を返す (#2655)。
 *
 * 効かない図種と、書かなかった図はそのまま返す = **書かない図の並びは 1 つも動かない**。
 */
export function 並べ替えた文書(doc: DslDocument): DslDocument {
  if (!並び順が効くか(doc)) return doc;
  const 段 = (kind: string): number => 種類の段[kind] ?? 表に無い種類の段;
  return { ...doc, actors: [...doc.actors].sort((a, b) => 段(a.kind) - 段(b.kind)) };
}

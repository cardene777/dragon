import type { NodeKind } from "@cardenelabs/cdl";

import { DSL_ONLY_KINDS } from "../v05/parser";
/**
 * 記法に書く種類を描画側の種類へ読み替える (#2030 で `compile.ts` から移した)。
 *
 * 記法は描画側に無い種類 (`contract` / `eoa` 等) を受け付けるため、渡す前に読み替える。
 * 読み替えずに渡すと描画側が大きさを引けず、図の組み立てが落ちる。
 */

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
export const 記法だけの種類の読み替え: Readonly<Record<(typeof DSL_ONLY_KINDS)[number], NodeKind>> =
  {
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
export function 描ける種別(kind: string | undefined): NodeKind {
  if (kind === undefined) return "actor";
  const 読み替え先 = (記法だけの種類の読み替え as Record<string, NodeKind | undefined>)[kind];
  return 読み替え先 ?? (kind as NodeKind);
}

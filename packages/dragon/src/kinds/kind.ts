/**
 * 図の種類の定義の型 (#3342、#3345)。
 *
 * 図の種類ごとに `kinds/<種類>/` の置き場を1つ持ち、並べ方 (`layout.ts`) と、受け付ける付け方の定義 (`kind.ts`) だけを置く。
 * 図の種類はブロックを描かず、付け方の合うブロックを並べる。描くのはブロックの描き方 (`blocks/<名前>/draw.ts`) と描く所 (`render/draw.ts`)。
 * 一覧 (`kinds/index.ts` の `KIND_FOLDERS`) は `scripts/build-blocks.mjs` が置き場の dir から書き出す。
 *
 * 見本帳を開いた時に読まず、描く時に後から読む図の種類 (状態遷移図と枝分かれの図、#3248) は、
 * 定義が並べ方を読むと、描く所が最初に読む一覧を通して並べ方が最初に読む塊へ入る。
 * その種類の定義は並べ方を持たずに `later: true` を名乗り、描く所は後から読んだ部品の登録簿 (`kinds/registry.ts`) から並べ方を引く (#3347)。
 * 最初に読む図の種類 (時系列図と構成図) の定義も並べ方を持たず、描く所は登録簿から並べ方を引く (#3763)。
 */
import type { AttachHow, KindName } from "../blocks/block";

interface KindBase {
  /** 置き場の dir の名前。最初の行の頭の語と同じ */
  name: KindName;
  /** 受け付ける付け方 */
  accepts: readonly AttachHow[];
  /** Semantic input blocks read by the kind's own notation reader. */
  fields?: readonly string[];
  /**
   * 宣言と段を省いた短い記法を読むか (#3438)。箱を線で結ぶ図の種類 (時系列図、構成図、状態遷移図) が名乗る。
   * 名乗った図は、1 行目の題と、段と、段の本文 (`say`) と、箱の宣言を省ける。省き方の決まりは `short-form.ts` が持つ
   */
  short?: true;
}

/**
 * 最初に読む図の種類 (時系列図と構成図)。定義は並べ方を持たず、並べ方は種類の登録の file (`kind-use/<種類>.ts`) が登録簿へ登録する (#3763)。
 * 定義が並べ方を読むと、描く所が読む一覧を通して、描く所を読む全ての検査が並べ方へたどり着く
 */
export interface EagerKind extends KindBase {
  later?: false;
  layout?: undefined;
}

/** 後から読む図の種類。並べ方は置き場の `layout.ts` に持ち、後から読む入口 (`kinds/<種類>.ts`) が出す */
export interface LaterKindFolder extends KindBase {
  later: true;
  layout?: undefined;
}

export type Kind = EagerKind | LaterKindFolder;

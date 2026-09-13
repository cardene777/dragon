/**
 * 検査の対象が一覧を覆っているかを見るための道具 (#1409)。
 *
 * ## なぜ要るか
 *
 * カタログを走査する検査は、対象の module を **手で並べる**。 一覧 (`CATALOG_ITEMS`) と
 * 繋がっていないため、ページを足した時にここへ足し忘れる。
 *
 * 忘れても何も落ちない。 検査の件数が減るだけで、通っている図が減ったことに誰も
 * 気付かない。
 *
 * 実際 4 度起きた。
 *
 * | Issue | 対象 | 漏れていたもの |
 * |---|---|---|
 * | #1403 | 図の一致検査 | `charts` / `text-dsl` (22 件) |
 * | #1405 | 重なりの検査 | `charts` (9 図) |
 * | #1407 | 動きの検査 | `ethereum` (4 図) |
 * | #1409 | 図になる前の検査 | `charts` |
 *
 * 3 度は各 file に同じ突き合わせを書いて直した。 4 度目でここに括る。
 *
 * ## 対象を動的に集めない
 *
 * 「module を全部読んで対象にする」 形にはしない。 図を持たない module まで拾って
 * 別の壊れ方をする。 対象は各検査が手で並べたまま、**漏れをここが落とす**。
 */
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";

/**
 * 一覧に載る図の id を集める。
 *
 * `parts` は `CATALOG_ITEMS` で空配列 (画面が後から読み込む) なので明示的に足す。
 * 足さないと 80 図が範囲から漏れ、それらを対象に持つ検査が「一覧に無い図を見ている」 と
 * 誤って落ちる。
 *
 * **重複を潰さない**。 集合にすると、同じ id を持つ図が 2 つある module を足し忘れても
 * 既存の 1 件が id を覆い隠して差が 0 件になる (#1405 で実際に指摘を受けた)。
 *
 * **変種も一覧のうち** (#1696)。 中身が違う見本は行を持たず `パターン` の切替に入るが、
 * 画面には出るので検査の対象から外れてはいけない。 外れると「対象だが一覧に無い図」 として
 * 4 つの検査が落ち、直す先が「変種を消す」 に見えてしまう。
 */
export async function 一覧の図(): Promise<string[]> {
  const out: string[] = [];
  const 足す = (it: CatalogItem): void => {
    // 変種の並びは先頭が元の見本なので、並びを持つ見本は並びだけを見れば重複しない
    if (it.patterns && it.patterns.length > 0) for (const p of it.patterns) out.push(p.diagram.id);
    else out.push(it.id);
  };
  for (const items of Object.values(CATALOG_ITEMS)) for (const it of items) 足す(it);
  for (const it of await loadPartsItems()) 足す(it);
  return out;
}

/**
 * 一覧に載る図のうち、記法 (`sourceYaml`) を持つものの名前を集める。
 *
 * 図の id ではなく **export の名前** を返す。 記法の一致を見る検査は module の export 名で
 * 対象を引くため。
 *
 * 変種の記法も一覧のうち (#1696)。 画面の `パターン` を押すとコード欄がその記法に入れ替わる。
 */
export async function 一覧の記法つき(): Promise<string[]> {
  const out: string[] = [];
  const 足す = (it: CatalogItem): void => {
    if (it.patterns && it.patterns.length > 0) {
      for (const p of it.patterns) if (p.sourceYaml !== undefined) out.push(p.鍵);
      return;
    }
    if (it.sourceYaml !== undefined) out.push(it.title);
  };
  for (const items of Object.values(CATALOG_ITEMS)) for (const it of items) 足す(it);
  for (const it of await loadPartsItems()) 足す(it);
  return out;
}

/**
 * 重複数を保ったまま、左にだけある名前を返す。
 *
 * 右に 1 つしか無い名前が左に 2 つあれば 1 件を返す。 集合の差では 0 件になる。
 */
export function 差分(left: readonly string[], right: readonly string[]): string[] {
  const 残り = new Map<string, number>();
  for (const id of right) 残り.set(id, (残り.get(id) ?? 0) + 1);
  return left
    .filter((id) => {
      const n = 残り.get(id) ?? 0;
      if (n === 0) return true;
      残り.set(id, n - 1);
      return false;
    })
    .sort();
}

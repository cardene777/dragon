/**
 * 検査の対象が一覧を覆っているかを見るための道具 (#1409)。
 *
 * ## なぜ要るか
 *
 * 見本帳を走査する検査は、対象の module を **手で並べる**。 一覧 (`CATALOG_ITEMS`) と
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
import { CATALOG_ITEMS, loadPartsItems } from "./catalog-items";

/**
 * 一覧に載る図の id を集める。
 *
 * `parts` は `CATALOG_ITEMS` で空配列 (画面が後から読み込む) なので明示的に足す。
 * 足さないと 80 図が範囲から漏れ、それらを対象に持つ検査が「一覧に無い図を見ている」 と
 * 誤って落ちる。
 *
 * **重複を潰さない**。 集合にすると、同じ id を持つ図が 2 つある module を足し忘れても
 * 既存の 1 件が id を覆い隠して差が 0 件になる (#1405 で実際に指摘を受けた)。
 */
export async function 一覧の図(): Promise<string[]> {
  const out: string[] = [];
  for (const items of Object.values(CATALOG_ITEMS)) for (const it of items) out.push(it.id);
  for (const it of await loadPartsItems()) out.push(it.id);
  return out;
}

/**
 * 一覧に載る図のうち、記法 (`sourceYaml`) を持つものの名前を集める。
 *
 * 図の id ではなく **export の名前** を返す。 記法の一致を見る検査は module の export 名で
 * 対象を引くため。
 */
export async function 一覧の記法つき(): Promise<string[]> {
  const out: string[] = [];
  for (const items of Object.values(CATALOG_ITEMS))
    for (const it of items) if (it.sourceYaml !== undefined) out.push(it.title);
  for (const it of await loadPartsItems()) if (it.sourceYaml !== undefined) out.push(it.title);
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

import type { DslActor, DslDocument } from "../types";
import { 箱の題 } from "./node-title";
import { slugify } from "./slug";
/**
 * 親子の木を扱う小道具 (#2030 で `compile.ts` から移した)。
 *
 * `type: tree` と `type: mind` の 2 図種が使う。 同じ本文を書いた時に、図種を変えただけで
 * 親子の解釈が変わらないようにするため、規則を 1 箇所に置く。
 */

/**
 * 矢印から親子を決める (#1251)。
 *
 * 矢印の先が子で、 どこからも指されない名前が根になる。
 *
 * **黙って上書きしない**。 同じ子に 2 本来たら後勝ちで消えるし、 書いていない名前を指した
 * 矢印は無い親を作る。 どちらも図が静かに変わるので伝える。
 *
 * 親を辿って自分に戻る形は木にならないため、 その枝を切って伝える。
 */
export function 矢印から親を決める(
  doc: DslDocument,
  図種: "tree" | "mind",
  名前: ReadonlySet<string>,
  伝える: (名: string, message: string, line?: number) => void,
): Map<string, string> {
  const 親 = new Map<string, string>();
  for (const f of doc.flow) {
    const 子 = slugify(f.to);
    const 親名 = slugify(f.from);
    if (!名前.has(親名)) {
      伝える(
        f.from,
        `type: ${図種} で書いていない名前を親にしています: ${f.from} -> ${f.to}`,
        f.pos?.line ?? 0,
      );
      continue;
    }
    // 子の側も見る。 書いていない名前への矢印は、 黙って捨てると図から関係が消える
    if (!名前.has(子)) {
      伝える(
        f.to,
        `type: ${図種} で書いていない名前を子にしています: ${f.from} -> ${f.to}`,
        f.pos?.line ?? 0,
      );
      continue;
    }
    if (子 === 親名) {
      伝える(f.to, `type: ${図種} で自分を親にしています: ${f.to}`, f.pos?.line ?? 0);
      continue;
    }
    const 既存 = 親.get(子);
    if (既存 !== undefined && 既存 !== 親名) {
      伝える(
        f.to,
        `type: ${図種} で ${f.to} に親が 2 つあります (後の ${f.from} は使いません)`,
        f.pos?.line ?? 0,
      );
      continue;
    }
    親.set(子, 親名);
  }
  // 親を辿って自分に戻る形は木にならない。 その枝を切って伝える
  for (const 子 of [...親.keys()]) {
    const 見た = new Set<string>([子]);
    let p2 = 親.get(子);
    while (p2 !== undefined) {
      if (見た.has(p2)) {
        伝える(子, `type: ${図種} で親を辿ると輪になります (${子} の親を外しました)`);
        親.delete(子);
        break;
      }
      見た.add(p2);
      p2 = 親.get(p2);
    }
  }
  return 親;
}

/**
 * 放射と木の箱に出す名前と補足 (#1332)。
 *
 * **連結しない**。 描画側は名前と補足を別々に受け取れば箱の中で 2 行に積む。 1 つの文字列に
 * すると 1 行に全部入り、箱幅を超えて末尾が切られる (実測 = 箱 120px に対し文字 163px)。
 *
 * `subtitle` と `value` の両方が書かれた場合は空白で繋いで 1 つの補足にする。 描画側の
 * 補足は 1 行なので、2 つを別々の行にはできない。
 */
export function 放射に出す文字(a: DslActor): { title: string; subtitle?: string } {
  const 続き = [a.subtitle, a.value].map((x) => x?.trim()).filter((x): x is string => !!x);
  return { title: 箱の題(a), ...(続き.length > 0 ? { subtitle: 続き.join(" ") } : {}) };
}

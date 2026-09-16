import type { DslActor, DslDocument } from "../types";
import { slugify } from "./slug";
/**
 * 登場人物の参照表と、並びの整え (#2030 で `compile.ts` から移した)。
 */

/**
 * 矢印の指す先を `actors` に書いた **正規の名前** へ解決する表 (#1209)。
 *
 * 名前そのものに加えて **一意な slug も受ける**。 動きを書いた図の組み立ては `slugify` に
 * 落として引くため、 `API Gateway` を `api-gateway` と書いた形が届く。 2 つ以上の名前が
 * 同じ slug になる時は受けない = どちらを指したか決められない。
 *
 * **返すのは正規の名前で、 slug ではない**。 slug を返すと、 動きを書いていない図の組み立て
 * (名前の完全一致で引く) と食い違う = 知らせは出ないのに label が消える / 題が slug に化ける /
 * 依存が切れる、 という形になる (Round 1 で実測)。 中央で名前へ揃えれば全経路が同じ相手を指す。
 */
export function actorRefTable(doc: DslDocument): Map<string, string> {
  const 表 = new Map<string, string>();
  const slug数 = new Map<string, number>();
  for (const a of doc.actors) {
    const sl = slugify(a.name);
    slug数.set(sl, (slug数.get(sl) ?? 0) + 1);
  }
  for (const a of doc.actors) {
    表.set(a.name, a.name);
    const sl = slugify(a.name);
    if ((slug数.get(sl) ?? 0) === 1) 表.set(sl, a.name);
  }
  return 表;
}

/**
 * 矢印の指す先を正規の名前へ揃えた `flow` を返す (#1209)。
 *
 * 解決できない矢印はそのまま残す = 図種ごとに扱いが違う (木は独自の知らせを出し、 値で描く図は
 * 落とす)。 中央で消すとその扱いが効かなくなる。 残した分は `reportMissingFlowActors` が
 * 知らせ、 動きを書いた図の組み立てが落とす。
 */
export function canonicalizeFlowActors(doc: DslDocument): DslDocument {
  const 表 = actorRefTable(doc);
  let 変えた = false;
  const flow = doc.flow.map((s) => {
    const from = 表.get(s.from) ?? s.from;
    const to = 表.get(s.to) ?? s.to;
    if (from === s.from && to === s.to) return s;
    変えた = true;
    return { ...s, from, to };
  });
  return 変えた ? { ...doc, flow } : doc;
}

/**
 * 状態遷移図で、どの箱を始まり / 終わりとみなすか (#1275)。
 *
 * **書いた値が勝つ**。 `initial:` / `final:` は記法で書けるのに 1 度も読まれておらず、
 * 位置だけで決まっていた (実測 = 中央の箱に `final: true` を書いても、最後に書いた箱が
 * 「最終」 になった)。
 *
 * 1 つも書いていなければ従来どおり位置で決める = 書かない記法の図は変わらない。
 * 片方だけ書いた形も、書いた側だけが切り替わる。
 */
export function 始まりと終わりの決め方(doc: DslDocument): {
  始まり: (a: DslActor, idx: number) => boolean;
  終わり: (a: DslActor, idx: number) => boolean;
} {
  const 書いた始まり = doc.actors.some((a) => a.initial === true);
  const 書いた終わり = doc.actors.some((a) => a.final === true);
  return {
    始まり: (a, idx) => (書いた始まり ? a.initial === true : idx === 0),
    終わり: (a, idx) =>
      書いた終わり ? a.final === true : idx === doc.actors.length - 1 && doc.actors.length > 1,
  };
}

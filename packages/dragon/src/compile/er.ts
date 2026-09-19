import { er } from "@cardenelabs/cdl";
import { 箱の題 } from "./node-title";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { ERの関係の指定を作る } from "./er-relation";
import { compileGenericWithAnimate, 共通の組み立てへ回す } from "./generic";

import { slugify } from "./slug";

export function compileEr(doc: DslDocument): CdlDiagram {
  // 動きを書いた形と縦列を書いた形は共通の組み立てへ (#1263 / #2348)。
  // 縦列は #2348 まで抜けており、動きを書かない図では書いた縦列が黙って消えていた
  if (共通の組み立てへ回す("er", doc)) {
    // 460 は preset 側の旧既定に合わせた値だった。 preset が箱 400 + 余白 25 × 2 = 450 を
    // 宣言するようになった (cardene777/cdl#359) ので、 同じ図が animate の有無で 10 world
    // ずれないようここも 450 にする。
    return compileGenericWithAnimate(doc, { kind: "er", laneWidth: 450 });
  }
  // er preset ... actors を entity に、 流れ を relation に
  const erBuilder = er({
    id: slugify(doc.title),
    topic: doc.title,
  });
  for (const a of doc.actors) {
    // entity rows は DSL では宣言できないので、 actor 名のみ entity 化
    // v0.3 で「列定義」 ブロックを追加検討
    erBuilder.entity({
      id: slugify(a.name) || a.name,
      title: 箱の題(a),
      rows: [], // v0.2 では rows なし
    });
  }
  for (const s of doc.flow) {
    // 多重度と名前と端は、段を持つ図と同じ 1 か所で決める (#2105)。
    // 語を書かない関係に `1:N` を補わない = 書いていない語を字と端に出さない
    erBuilder.relation({
      from: slugify(s.from),
      to: slugify(s.to),
      ...ERの関係の指定を作る(s),
      ...(s.tone ? { tone: s.tone } : {}),
    });
  }
  return erBuilder.build();
}

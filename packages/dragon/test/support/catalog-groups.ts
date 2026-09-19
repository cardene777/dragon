/**
 * カタログの群 (`apps/playground-spa/src/topics/catalog/*.cdl.ts`) の実体を dir から読む (#2314)。
 *
 * 「カタログの全図」 を名乗る走査は `responsive-accepted.ts` の `全図` (`import.meta.glob`) を
 * 読む。 走査に変えただけでは、**走査の書き方を間違えて 0 件になっても気付けない**ので、
 * 読んだ群が dir の実体と一致することを各走査が見る。 その相手をここが出す。
 *
 * `import.meta.glob` と `readdirSync` で **別の経路** から数えるのが要点。 同じ経路で 2 度
 * 数えても、経路そのものが壊れた時に両方が同じだけ壊れる。
 *
 * #2004 が `responsive-accepted.ts` を走査に変えた時、突き合わせは
 * `catalog-population.test.ts` の中に閉じていた。 そのため同じ突き合わせを持たない走査が
 * 6 本残り、`parts-in-box` (#1973 で足した群) が 6 本すべてで抜けたままになっていた。
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ここ = dirname(fileURLToPath(import.meta.url));

/** カタログの群を置いている dir。 */
export const カタログの置き場 = join(
  ここ,
  "..",
  "..",
  "..",
  "..",
  "apps",
  "playground-spa",
  "src",
  "topics",
  "catalog",
);

/**
 * dir にある群の名前 (`*.cdl.ts` の `*`、並べ替え済)。
 *
 * 図の中身ではなく **どの群が在るか** を見る値。 図を 1 枚も持たない群も数に入る。
 */
export const 実在する群 = (): string[] =>
  readdirSync(カタログの置き場)
    .filter((f) => f.endsWith(".cdl.ts"))
    .map((f) => f.slice(0, -".cdl.ts".length))
    .sort();

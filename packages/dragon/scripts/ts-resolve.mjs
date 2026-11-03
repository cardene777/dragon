/**
 * Node で package の TypeScript の file を読むための読み込みの hook (#3346)。
 *
 * Node は TypeScript の file の型を外して読める (型を外すだけで、`enum` のような型を外すだけでは読めない書き方は使えない)。
 * ただし package の file は拡張子を書かずに import し (`../block`)、Node はそれを解かないので、
 * 拡張子の無い相対の import が解けない時だけ `.ts` を足して解き直す。
 * `node --import ./scripts/ts-resolve.mjs <script>` で、script の import より前に読み込む。
 */
import { registerHooks } from "node:module";

/** 拡張子を持たない相対の指定 */
const BARE_RELATIVE = /^\.\.?\/(?:[^/]+\/)*[^./][^/]*$/u;

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!BARE_RELATIVE.test(specifier)) throw error;
      return nextResolve(`${specifier}.ts`, context);
    }
  },
});

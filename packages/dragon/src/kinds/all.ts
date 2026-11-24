/**
 * 全ての種類の部品と、全てのブロックの読み方を読み込みの時に登録する (#3248、#3349)。全部入りの入口が読む。
 * 種類ごとの登録は種類の登録の file (`kind-use/<種類>.ts`) が持ち、ここは全ての種類の分と共通の登録 (`basics.ts`) を読むだけ (#3763)。
 * 読むだけで登録するので、`package.json` の `sideEffects` に載せて束ねる道具に消させない。
 */
import "./basics";
import "../kind-use/architecture";
import "../kind-use/chart";
import "../kind-use/checkout";
import "../kind-use/cycle";
import "../kind-use/er";
import "../kind-use/flow";
import "../kind-use/git";
import "../kind-use/judge";
import "../kind-use/lineup";
import "../kind-use/matrix";
import "../kind-use/mind";
import "../kind-use/pipe";
import "../kind-use/sankey";
import "../kind-use/sequence";
import "../kind-use/state";
import "../kind-use/time";
import "../kind-use/tree";
import "../kind-use/try";
import "../kind-use/venn";

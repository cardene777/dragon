/**
 * 配管の原本の全てを書いたままの形で描き、畳んだ箱を 1 つだけ開いた形を先に組んでから、全ての形を描き直す (#3753)。
 * 準備の file (`pipe-stored-layout.prepare.ts`) が `tsx` で起こす。並べ方の覚えは process の中だけに在るので、新しい process は前に描いた覚えを持たない。
 *
 * 頁の入口と同じく最初に見える形を描いてから先に組む。空いた時間に回す仕事は、預かった時にすぐ回す。
 * 原本を読む部品と種類の部品の組は、jsDelivr の入口と同じ物を渡す。
 * 原本ごとに、描き直した形の並べ方と SVG の指紋と、描き直した時に道を探した回数を、最後の 1 行の JSON で出す。
 *
 * 使い方: `tsx pipe-ahead-child.ts`
 */
import { createHash } from "node:crypto";
import { join } from "node:path";
import { renderDiagram } from "../src/core";
import { partsOf } from "../src/kinds/registry";
import { toModel } from "../src/model";
import { Router } from "../src/pipe-route";
import { withUserBlocks } from "../src/user-blocks";
import { readDiagram } from "../src/version";
import { langOfFile, PIPE_SOURCES, readSource, REPO } from "./pipe-stored-layout-support";
import "../src/kind-use/pipe";

type Laid = { svg: string; layout: { folds?: { call: number }[] } };
type ComposeAhead = (source: unknown, options: { lang: "ja" | "en" }, use: unknown, idle: (run: () => void) => void) => void;

const fingerprint = (text: string): string => createHash("sha256").update(text).digest("hex");
const render = (source: unknown, options: Record<string, unknown>): Laid => renderDiagram(source, options) as unknown as Laid;

let routeCalls = 0;
// 置き換える前の route を取っておき、置き換えた関数が受けた this を渡して呼ぶ
// eslint-disable-next-line @typescript-eslint/unbound-method
const route = Router.prototype.route;
Router.prototype.route = function (this: Router, ask: Parameters<typeof route>[0]) {
  routeCalls++;
  return route.call(this, ask);
};

// まだ作っていない file を読んでも落とさないよう、path を字で渡して読む
const entry = join(REPO, "packages/dragon/src/pipe-ahead.ts");
const ahead = ((await import(/* @vite-ignore */ entry).catch(() => undefined)) as { composeAhead?: ComposeAhead } | undefined)?.composeAhead;
if (typeof ahead !== "function") {
  console.log(JSON.stringify({ error: "先に組む処理 composeAhead (src/pipe-ahead.ts) が無い" }));
} else {
  const files: Record<string, unknown> = {};
  for (const file of PIPE_SOURCES) {
    try {
      const source = readSource(file);
      const lang = langOfFile(file);
      const closed = render(source, { lang });
      // jsDelivr の入口 (`script.ts`) と同じ部品を渡す
      ahead(source, { lang }, { readDiagram, toModel, partsOf, withUserBlocks }, (run) => run());
      const forms = [[], ...(closed.layout.folds ?? []).map((fold) => [fold.call])].map((open) => {
        const before = routeCalls;
        const drawn = render(source, { lang, open });
        return { open, layout: fingerprint(JSON.stringify(drawn.layout)), svg: fingerprint(drawn.svg), routeCalls: routeCalls - before };
      });
      files[file] = { forms };
    } catch (error) {
      files[file] = { error: error instanceof Error ? error.message : String(error) };
    }
  }
  console.log(JSON.stringify({ files }));
}

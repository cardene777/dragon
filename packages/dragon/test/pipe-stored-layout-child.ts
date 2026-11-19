/**
 * 新しい process で 1 回目に配管の図を描き、道を探した回数と描く本体の thread の CPU を JSON で出す (#3748)。
 * 準備の file (`pipe-stored-layout.prepare.ts`) が `tsx` で起こす。並べ方の覚えは process の中だけに在るので、新しい process は覚えを持たない。
 *
 * 使い方: `tsx pipe-stored-layout-child.ts <原本の JSON の file> <開く呼び出しの番号を , で並べた字> [収めた並べ方の JSON の file]`
 */
import { readFileSync } from "node:fs";
import { renderDiagram } from "../src/index";
import { Router } from "../src/pipe-route";

const [sourceFile, openText, layoutsFile] = process.argv.slice(2);
if (!sourceFile || openText === undefined) throw new Error("原本の file と開く呼び出しの番号を渡す");
const source: unknown = JSON.parse(readFileSync(sourceFile, "utf8"));
const open = openText === "" ? [] : openText.split(",").map(Number);
const layouts: unknown = layoutsFile ? JSON.parse(readFileSync(layoutsFile, "utf8")) : undefined;

let routeCalls = 0;
// 置き換える前の route を取っておき、置き換えた関数が受けた this を渡して呼ぶ
// eslint-disable-next-line @typescript-eslint/unbound-method
const route = Router.prototype.route;
Router.prototype.route = function (this: Router, ask: Parameters<typeof route>[0]) {
  routeCalls++;
  return route.call(this, ask);
};
const cpu = (): number => {
  const used = process.threadCpuUsage();
  return (used.user + used.system) / 1e6;
};
const started = cpu();
renderDiagram(source, { lang: "ja", open, ...(layouts === undefined ? {} : { layouts }) } as Parameters<typeof renderDiagram>[1]);
console.log(JSON.stringify({ routeCalls, cpu: cpu() - started }));

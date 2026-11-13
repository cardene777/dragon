import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import type { UserBlock } from "./src/user-blocks";
import { readBlocks } from "./src/user-blocks-read";
// 共有の定義は Tabler の絵柄を持てる (#3489)。読む前に絵柄集の表を登録する。表は build が tsup の前に書き出す (`scripts/build-tabler.mjs`)
import "./src/blocks/icon/sets-all";

/** 字の package の入れた版。script の1行の入口が jsDelivr から同じ版の字の CSS を読む (#3343) */
const fontVersion = (name: string): string =>
  (JSON.parse(readFileSync(new URL(`./node_modules/@fontsource-variable/${name}/package.json`, import.meta.url), "utf8")) as { version: string }).version;
const FONT_VERSIONS = { "noto-sans-jp": fontVersion("noto-sans-jp"), "jetbrains-mono": fontVersion("jetbrains-mono") };
/** package の版。script の1行の入口の案内役が、同じ版の場所から本体を読む (#3375) */
const VERSION = (JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string }).version;

/**
 * 共有のブロック集 (#3455)。`blocks/` の 1 定義 1 file を読み、読んだ定義を本体に埋める (`__DRAGON_SHARED_BLOCKS__`)。
 * 読めない file、定義を 1 つだけ持たない file、file の名前とブロックの名前が違う file が在れば build を止める。
 * file の名前を名前に揃えると、同じ名前の定義が 2 つの file に分かれない
 */
function sharedBlocks(): UserBlock[] {
  const dir = new URL("./blocks/", import.meta.url);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".dragon"))
    .sort()
    .map((file) => {
      const read = readBlocks(readFileSync(new URL(file, dir), "utf8"), { lang: "en" });
      if (!read.ok) throw new Error(`blocks/${file}: ${read.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`);
      const [block, ...rest] = read.blocks.blocks;
      if (block === undefined || rest.length > 0) throw new Error(`blocks/${file}: write exactly one block definition in a file`);
      if (block.name !== `+${file.slice(0, -".dragon".length)}`) throw new Error(`blocks/${file}: name the file after its block (${block.name})`);
      return block;
    });
}
/**
 * 本体を束ねる全ての設定に渡す。定義を引く処理 (`user-blocks.ts`) がどの入口にも入るため。
 * Tabler の絵柄を持つ共有のブロックの名前も入れ、軽い入口が絵柄集の表を読むかを最初に読む束で決める (#3489)
 */
const SHARED = sharedBlocks();
const SHARED_BLOCKS = {
  __DRAGON_SHARED_BLOCKS__: JSON.stringify(SHARED),
  __DRAGON_SHARED_TABLER__: JSON.stringify(SHARED.flatMap((b) => (b.icon?.startsWith("tabler:") ? [b.name] : []))),
};

export default defineConfig([
  {
    // 字を読み込む入口 (fonts) は CSS を読むだけなので型を出さない。
    // 書き出し (export) と命令 (cli) は node で動き、画面なしのブラウザを動かす。原本の file を移す入口 (node) も node で動く。
    // ブラウザで描いた図を画像にする入口 (capture) は頁で動き、詰める道具 (gifenc、mediabunny) を束ねずに読む (#3644)
    entry: { index: "src/index.ts", fonts: "src/load-fonts.ts", export: "src/export/index.ts", node: "src/node.ts", cli: "src/cli.ts", capture: "src/capture/index.ts" },
    format: ["esm", "cjs"],
    dts: {
      resolve: true,
      entry: { index: "src/index.ts", export: "src/export/index.ts", node: "src/node.ts", capture: "src/capture/index.ts" },
      compilerOptions: { composite: false },
    },
    splitting: false,
    sourcemap: true,
    // 設定は同時に走るので、ほかの設定が書いた物 (頁の script、軽い入口、script の1行の入口、埋める script) を消さない
    clean: ["!frame.*", "!player.global.js", "!light/**", "!cdn/**", "!offline.global.js"],
    shims: true,
    treeshake: true,
    // 字の package は束ねず、頁を束ねる道具に CSS と字の file を運ばせる
    external: ["@fontsource-variable/noto-sans-jp", "@fontsource-variable/jetbrains-mono", "@cardenelabs/dragon", "./capture.js"],
    // 命令の `dragon --version` は package の版を出す (#3455)
    define: { ...SHARED_BLOCKS, __DRAGON_VERSION__: JSON.stringify(VERSION) },
    outDir: "dist",
    target: "es2022",
  },
  {
    // 軽い入口 (#3248)。種類の部品を種類ごとの塊に分ける。塊と入口が同じ登録簿を読むよう、共有の部品も塊にする。
    // 塊の名前は版ごとに替わるので、前の build の塊が残らないよう自分の置き場だけを消す
    entry: { index: "src/light.ts" },
    format: ["esm", "cjs"],
    dts: { resolve: true, compilerOptions: { composite: false } },
    splitting: true,
    sourcemap: true,
    clean: true,
    shims: true,
    define: SHARED_BLOCKS,
    outDir: "dist/light",
    target: "es2022",
  },
  {
    // HTML に書き出す頁へ埋める script。依存ごと 1 file に束ね、`DragonPlayer.mountDiagram` として頁に置く
    entry: { player: "src/player-global.ts" },
    format: ["iife"],
    globalName: "DragonPlayer",
    platform: "browser",
    noExternal: [/.*/],
    minify: true,
    sourcemap: false,
    clean: false,
    dts: false,
    define: SHARED_BLOCKS,
    outDir: "dist",
    target: "es2022",
  },
  {
    // script の1行の入口 (#3343)。頁が jsDelivr から ES module として読む。依存ごと束ね、種類の部品は軽い入口と同じく塊に分けて後から読む。
    // 塊の名前は版ごとに替わるので、自分の置き場を消す。案内役の設定が同時に書く dragon.js は消さない。
    // source map は塊がどの種類の部品を持つかを検査が読むのに使う
    entry: { "dragon-main": "src/script.ts" },
    format: ["esm"],
    platform: "browser",
    splitting: true,
    noExternal: [/.*/],
    minify: true,
    sourcemap: true,
    clean: ["!dragon.js", "!dragon.js.map"],
    dts: false,
    define: { ...SHARED_BLOCKS, __DRAGON_FONT_VERSIONS__: JSON.stringify(FONT_VERSIONS) },
    outDir: "dist/cdn",
    target: "es2022",
  },
  {
    // 頁が読む script の1行の入口の案内役 (#3375)。同じ版の場所から本体 dragon-main を読む。
    // 本体と同じ設定で束ねると、esbuild が本体と分け合う部品 (値が object の define も) を塊に分け、案内役がそれを範囲の場所から読む。
    // 分け合う物が出ないよう、別の設定で 1 file に束ねる
    entry: { dragon: "src/script-loader.ts" },
    format: ["esm"],
    platform: "browser",
    splitting: false,
    minify: true,
    sourcemap: true,
    clean: false,
    dts: false,
    define: { __DRAGON_VERSION__: JSON.stringify(VERSION) },
    outDir: "dist/cdn",
    target: "es2022",
  },
  {
    // `dragon embed` が頁に埋める script (#3343)。外を読めない頁で動くよう、全ての種類の部品を 1 file に束ねる
    entry: { offline: "src/script-offline.ts" },
    format: ["iife"],
    platform: "browser",
    noExternal: [/.*/],
    minify: true,
    sourcemap: false,
    clean: false,
    dts: false,
    define: SHARED_BLOCKS,
    outDir: "dist",
    target: "es2022",
  },
]);

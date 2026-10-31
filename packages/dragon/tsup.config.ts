import { defineConfig } from "tsup";

export default defineConfig([
  {
    // 字を読み込む入口 (fonts) は CSS を読むだけなので型を出さない。
    // 書き出し (export) と命令 (cli) は node で動き、画面なしのブラウザを動かす。原本の file を移す入口 (node) も node で動く
    entry: { index: "src/index.ts", fonts: "src/load-fonts.ts", export: "src/export/index.ts", node: "src/node.ts", cli: "src/cli.ts" },
    format: ["esm", "cjs"],
    dts: {
      resolve: true,
      entry: { index: "src/index.ts", export: "src/export/index.ts", node: "src/node.ts" },
      compilerOptions: { composite: false },
    },
    splitting: false,
    sourcemap: true,
    // 2 つの設定は同時に走るので、もう一方が書いた頁の script (player.global.js) を消さない
    clean: ["!player.global.js", "!light/**"],
    shims: true,
    treeshake: true,
    // 字の package は束ねず、頁を束ねる道具に CSS と字の file を運ばせる
    external: ["@fontsource-variable/noto-sans-jp", "@fontsource-variable/jetbrains-mono"],
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
    outDir: "dist",
    target: "es2022",
  },
]);

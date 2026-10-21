import { defineConfig } from "tsup";

export default defineConfig({
  // 字を読み込む入口 (fonts) は CSS を読むだけなので型を出さない
  entry: { index: "src/index.ts", fonts: "src/load-fonts.ts" },
  format: ["esm", "cjs"],
  dts: {
    resolve: true,
    entry: { index: "src/index.ts" },
    compilerOptions: { composite: false },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // 字の package は束ねず、頁を束ねる道具に CSS と字の file を運ばせる
  external: ["@cardenelabs/cdl", "react", "react-dom", "@fontsource-variable/noto-sans-jp", "@fontsource-variable/jetbrains-mono"],
  outDir: "dist",
  target: "es2022",
});

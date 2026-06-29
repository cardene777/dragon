import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
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
  external: ["@cardenelabs/cdl", "@cardenelabs/anim", "react", "react-dom"],
  outDir: "dist",
  target: "es2022",
});

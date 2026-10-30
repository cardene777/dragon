/**
 * 字の重なりを 1 件持つ図を描く、検査だけの編集画面の build の設定 (#3197)。
 *
 * 線の無い段の番号を箱の角に置いてから (#3187) 字の重なる図を作れないので、編集画面が重なりを知らせる流れを確かめる検査はこの build を開く。
 * 本番の設定 (`vite.config.ts`) をそのまま読み、2 つだけを足す。
 * 図を描く package は組み上がった物 (`dist`) ではなく元の code から組み、その中で重なりを探す所 (`render/ink`) の読み込み先を
 * `overlap-ink-support.ts` へ向ける。製品の code と本番の build は変えない。
 */
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type Plugin } from "vite";

import base from "../../vite.config";

const at = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

/** package の元の code の入口と、重なりを探す所と、その代わりに読ませる file */
const ENTRY = at("../../../../packages/dragon/src/index.ts");
const INK = at("../../../../packages/dragon/src/render/ink.ts");
const PAIRED = at("./overlap-ink-support.ts");

/** `render/ink` を読み込む所を `overlap-ink-support.ts` へ向ける。`overlap-ink-support.ts` 自身が読む本物の `render/ink` はそのまま通す */
const pairedInk = (): Plugin => ({
  name: "dragon-paired-overlap",
  enforce: "pre",
  async resolveId(source, importer, options) {
    if (!importer || importer === PAIRED) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    return resolved?.id === INK ? PAIRED : null;
  },
});

export default defineConfig((env) =>
  mergeConfig(base(env), {
    plugins: [pairedInk()],
    resolve: { alias: [{ find: /^@cardenelabs\/dragon$/u, replacement: ENTRY }] },
  }),
);

/**
 * 組み立てが本体に埋める値 (`tsup.config.ts` の `__DRAGON_SHARED_BLOCKS__` と `__DRAGON_SHARED_TABLER__`) を、
 * 元の code (`src`) を読む検査のために置く (#3763)。
 * 既定の入口 (`@cardenelabs/dragon`) は組み立てた `dist` を読むので埋めた値を持つが、`src` を読む検査は組み立てを通らない。
 * 共有のブロック集は、初めて引いた時に `blocks/` の定義を読んで作る。共有の定義は Tabler の絵柄を持つので、絵柄集の表も読み込みの時に登録する。
 * 定義の file の決まり (1 file に 1 つの定義、file の名前とブロックの名前が同じ) は組み立てが確かめるので、ここでは読むだけにする
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import "../src/blocks/icon/sets-all";
import type { UserBlock } from "../src/user-blocks";
import { readBlocks } from "../src/user-blocks-read";

// 画面の部品を要る検査 (`jsdom`) では `import.meta.url` が file の URL でないので、dir の path で引く
const SHARED_DIR = join(__dirname, "../blocks");

let shared: UserBlock[] | undefined;
const sharedBlocks = (): UserBlock[] =>
  (shared ??= readdirSync(SHARED_DIR)
    .filter((file) => file.endsWith(".dragon"))
    .sort()
    .flatMap((file) => {
      const read = readBlocks(readFileSync(join(SHARED_DIR, file), "utf8"), { lang: "en" });
      if (!read.ok) throw new Error(`blocks/${file}: ${read.errors.map((e) => `${e.line}:${e.column} ${e.message}`).join(" / ")}`);
      return read.blocks.blocks;
    }));

const globals = globalThis as Record<string, unknown>;
// 検査が自分で置いた値 (`vi.stubGlobal`) は上書きしない
if (!("__DRAGON_SHARED_BLOCKS__" in globals)) Object.defineProperty(globals, "__DRAGON_SHARED_BLOCKS__", { configurable: true, get: sharedBlocks });
if (!("__DRAGON_SHARED_TABLER__" in globals)) {
  Object.defineProperty(globals, "__DRAGON_SHARED_TABLER__", {
    configurable: true,
    get: () => sharedBlocks().flatMap((b) => (b.icon?.startsWith("tabler:") ? [b.name] : [])),
  });
}

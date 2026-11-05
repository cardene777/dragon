/**
 * script の1行の入口の案内役 (#3375)。build で `dist/cdn/dragon.js` になり、頁が `<script type="module">` で読む。
 *
 * jsDelivr は版の範囲の URL (`@0.50`) を file ごとに解き、応答を browser に7日残す。
 * 入口が塊を相対の場所で読むと、修正版を出した後に残った入口が新しい版へ解かれた場所へ塊を取りに行き、名前の変わった塊が 404 になる。
 * 案内役は自分の版を全て書いた場所 (`@0.50.1` など) から本体 `dragon-main.js` を読むので、本体と本体が読む塊は全て案内役と同じ版になる。
 * URL が `/@cardenelabs/dragon@<版>/` を含まない置き場 (自分の server など) では、隣の本体を読む。
 *
 * 案内役は何も import しない。import すると、その部品が範囲の場所からの相対で読まれる。
 */

/** この file の版。build が package の版を入れる (`tsup.config.ts`) */
declare const __DRAGON_VERSION__: string;

/** URL の中の package の名前と版の部分 */
const PACKAGE_AT_VERSION = /\/@cardenelabs\/dragon@[^/]+\//u;

const pinned = import.meta.url.replace(PACKAGE_AT_VERSION, `/@cardenelabs/dragon@${__DRAGON_VERSION__}/`);
await import(new URL("dragon-main.js", pinned).href);

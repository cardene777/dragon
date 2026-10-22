/**
 * 公開の直前に、包んだ物を空の dir に入れて確かめる判定 (#3023)。
 *
 * ## なぜ要るか
 *
 * 0.35.0 は `npm pack --dry-run` で入る file の一覧だけを見て公開し、
 * `require("@cardenelabs/dragon/export")` が断られる版を出した (#3019、#3021)。
 * file が入っていても、名前から引けるかは `exports` の書き方で決まる。
 *
 * ## 確かめる組の決め方
 *
 * `exports` の **入口ごとに `import` と `require` の 2 つを必ず掛ける**。
 * `exports` に書かれた条件から組を導くと、書き忘れた条件は確かめる組からも抜け、
 * 0.35.0 と同じ穴を通す。
 * 一覧は手で書かない。書くと入口を足した時に更新を忘れ、その入口だけ確かめなくなる。
 *
 * ## 何も確かめられなかった回
 *
 * 確かめた組が 0 件の回は「通った」 ではなく「測れていない」 として落とす。
 */

/**
 * `exports` の入口ごとに、`import` と `require` で引く組を返す。
 *
 * `*` を持つ入口は名前が 1 つに決まらず引けないため、黙って飛ばさずに止める。
 *
 * @param {{ name: string, exports?: unknown }} manifest `package.json` の中身
 * @returns {{ 名前: string, 入れ方: "import" | "require" }[]}
 */
export function 入口を導く(manifest) {
  const exportsField = manifest.exports;
  if (exportsField === undefined || exportsField === null) return [];
  const subpaths = typeof exportsField === "string" ? ["."] : Object.keys(exportsField);
  const wild = subpaths.filter((subpath) => subpath.includes("*"));
  if (wild.length > 0) throw new Error(`名前が 1 つに決まらない入口 (*) は引けない: ${wild.join(", ")}`);
  return subpaths.flatMap((subpath) => {
    const 名前 = subpath === "." ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
    return [
      { 名前, 入れ方: /** @type {const} */ ("import") },
      { 名前, 入れ方: /** @type {const} */ ("require") },
    ];
  });
}

/** 入口の値の中に `types` の条件が在るか (入れ子の条件も辿る) */
function hasTypes(target) {
  if (target === null || typeof target !== "object") return false;
  return Object.entries(target).some(([condition, value]) => condition === "types" || hasTypes(value));
}

/**
 * 型を持つ入口の名前。どれかの条件に `types` が在れば型を持つとみなす。
 *
 * 型を持たない入口 (`./fonts` のように頁を束ねる道具が CSS を運ぶ物) は、Node では読み込めないため、
 * 呼ぶ側は名前の解決だけを確かめる。
 *
 * @param {{ name: string, exports?: unknown }} manifest
 * @returns {string[]}
 */
export function 型を持つ入口(manifest) {
  const exportsField = manifest.exports;
  if (exportsField === undefined || exportsField === null || typeof exportsField === "string") return [];
  return Object.entries(exportsField)
    .filter(([, target]) => hasTypes(target))
    .map(([subpath]) => (subpath === "." ? manifest.name : `${manifest.name}/${subpath.slice(2)}`));
}

/**
 * 型を確かめる 2 つの file (`.mts` と `.cts`) の中身。どちらも全ての入口を import する。
 *
 * `.cts` の import は `require` に変わるため、`require` の条件に渡る型が確かめられる。
 *
 * @param {string[]} names
 * @returns {{ mts: string, cts: string }}
 */
export function 型の確かめの中身(names) {
  const lines = names.map((name, i) => `import * as entry${i} from ${JSON.stringify(name)};`);
  const body = `${lines.join("\n")}\nexport const entries = [${names.map((_, i) => `entry${i}`).join(", ")}];\n`;
  return { mts: body, cts: body };
}

/**
 * 確かめた結果を、通ったかと人が読む行にまとめる。0 件の回は通さない。
 *
 * @param {{ 何を: string, 通った: boolean, 理由?: string }[]} results
 * @returns {{ 通った: boolean, 文: string[] }}
 */
export function 結果をまとめる(results) {
  const 落ちた = results.filter((result) => !result.通った);
  const 文 = results.map((result) =>
    result.通った ? `  ok  ${result.何を}` : `  NG  ${result.何を}${result.理由 ? ` (${result.理由})` : ""}`,
  );
  if (results.length === 0) {
    文.push("確かめた組が 0 件で、測れていない");
    return { 通った: false, 文 };
  }
  文.push(`確かめた ${results.length} 件、落ちた ${落ちた.length} 件`);
  return { 通った: 落ちた.length === 0, 文 };
}

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * `main.tsx` の `<Route>` から経路を取り出す。
 *
 * **`<Route` を先に全件数え、 1 つずつ `path` を取る**。 `<Route\s+path="..."` の 1 つの形だけを
 * 拾う書き方だと、 属性の並びを変える / 単引用符にする / 式で渡す のいずれでも取り逃がし、
 * 実装にだけ経路を足しても「未宣言」 に出ない (review 指摘)。
 *
 * 取り出せない形は **例外にして落とす**。 取りこぼしを 0 件として黙って通すと、 検査が
 * 「一致した」 と報告しながら実際には見ていない状態になる。
 *
 * 属性の並びの終わりは `{}` の深さと引用符を数えて決める。 `element={<Page />}` の中の `>` で
 * 切ってしまうと、 その後ろに置いた `path` を読み落とす。
 */
export function 実装の経路(src: string): string[] {
  const out: string[] = [];
  // 名前の続きを持つ tag (`<Routes` / `<Route2`) は別物。 数字と `_` も名前の続きに含める
  for (const m of src.matchAll(/<Route(?![\p{L}\p{N}_])/gu)) {
    const 始まり = m.index;
    let 深さ = 0;
    let 引用: string | null = null;
    let i = 始まり + "<Route".length;
    for (; i < src.length; i++) {
      const c = src[i];
      if (引用 !== null) {
        // 引用の中の `\` は次の 1 文字を字として読む。 数えないと `{"a\"b"}` で引用が閉じたと
        // 誤り、 走査が次の tag まで伸びて別の route の `path` を拾う (review 指摘)
        if (c === "\\") {
          i++;
          continue;
        }
        if (c === 引用) 引用 = null;
        continue;
      }
      if (c === '"' || c === "'") {
        引用 = c;
        continue;
      }
      if (c === "{") 深さ++;
      else if (c === "}") 深さ--;
      else if (深さ === 0 && c === ">") break;
    }
    // 終わりを見つけられない = 読めていない。 その先の字を拾って別の route の値にしない
    if (i >= src.length) {
      throw new Error(`route の属性の終わりを読めない: ${src.slice(始まり, 始まり + 80)}`);
    }
    const 断片 = src.slice(始まり, i);
    const p = /\spath=(?:"([^"]*)"|'([^']*)')/u.exec(断片);
    if (p === null) {
      throw new Error(
        `route の path を字として読めない (式や変数で渡さず literal で書くこと): ${断片.trim()}`,
      );
    }
    // どちらか一方の群が必ず一致する (`null` は上で弾いている)
    const path = p[1] ?? p[2];
    if (path === undefined) continue;
    out.push(path);
  }
  return out;
}

/** `main.tsx` を字として読む。 経路を見る検査はどれもここを通る */
export function 画面の経路(): string[] {
  return 実装の経路(
    readFileSync(fileURLToPath(new URL("../src/main.tsx", import.meta.url)), "utf8"),
  );
}

/**
 * 経路の形に値を入れて、実際に開く path を全件作る (#2270)。
 *
 * `/catalog/:slug` のような欄を持つ経路は、`欄の値` に並べた値ごとに 1 本へ広がる。
 * 欄を 2 つ持つ経路は組み合わせの数だけ広がる。
 *
 * **入れる値が無い欄は例外にして落とす**。 黙って飛ばすと、経路が増えた日にその画面だけ
 * 対象から外れ、検査は「全件通した」 と報告しながら実際には見ていない状態になる。
 *
 * 当たらなかった時の受け皿 (`*`) も `欄の値` の鍵として扱う = router に在る経路なので、
 * 検査の側で「存在しない path」 を思い付きで書かずに済む。
 *
 * 先頭の `/` は落とす。 `new URL(path, base)` が先頭 `/` を origin 直下と読んで base path を
 * 捨てるため、付けたままだと base の外を開く (#1438 で 291 件が同じ形で落ちた)。
 */
export function 経路を広げる(経路: string, 欄の値: Record<string, readonly string[]>): string[] {
  let 組: string[][] = [[]];
  for (const 節 of 経路.split("/")) {
    const 候補 = 節.startsWith(":") || 節 === "*" ? 欄の値[節] : undefined;
    if ((節.startsWith(":") || 節 === "*") && 候補 === undefined) {
      throw new Error(`経路の欄に入れる値が無い: ${節} (${経路})`);
    }
    組 = 組.flatMap((x) => (候補 ?? [節]).map((v) => [...x, v]));
  }
  return 組.map((x) => x.join("/").replace(/^\//u, ""));
}

/**
 * 経路の中で、値を入れないと開けない節 (`:欄` と受け皿の `*`)。
 *
 * 検査の側はこれを `欄の値` の鍵と突き合わせる = router に欄が増えた時、表を直すまで落ちる。
 */
export function 値を入れる節(経路たち: readonly string[]): string[] {
  return [
    ...new Set(
      経路たち.flatMap((p) => p.split("/").filter((x) => x.startsWith(":") || x === "*")),
    ),
  ];
}

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

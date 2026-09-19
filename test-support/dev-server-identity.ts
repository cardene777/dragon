import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 開発 server を見る検査の前に、その相手が dragon の画面かを見る (#2295)。
 *
 * ## 何が起きたか
 *
 * 束ねの古さを見る関門 (#1998) は **disk の記録しか読まない**。 相手の server に 1 度も
 * 触らないので、`DEV_URL` に何が居ても、そもそも何も居なくても通る。
 *
 * 実測 = `DEV_URL` の port を別のリポジトリの preview が押さえており、関門は通ったうえで
 * `row-bounds-offset` の 3 件が 15 秒ずつ「要素が現れない」 とだけ言って落ちた。
 * #1998 が消したかった読めない落ち方が、別の原因で戻っていた。
 *
 * ## 3 通りを畳まない
 *
 * 繋がらない / 別の画面が居る / dragon が居る、で直し方が違う。 1 つに畳むと読み手が
 * 違う方向を直しに行く。 `繋がらない` を `別の画面` に倒すのも同じで、port を空ける作業と
 * server を立てる作業は別物。
 *
 * ## 期待する題は実物から導く
 *
 * `index.html` を読んで突き合わせる。 literal で書くと、題を変えた時に片方だけ直って
 * 検査が黙る。
 */

/** 相手の server が何だったか */
export type 相手 =
  | { readonly 種類: "繋がらない"; readonly 事情: string }
  | { readonly 種類: "別の画面"; readonly 題: string | undefined }
  | { readonly 種類: "dragon" };

/** 頁を引けたかどうか。 引く側を外に出して、見分ける側を純粋な関数に保つ */
export type 引いた結果 =
  { readonly ok: true; readonly html: string } | { readonly ok: false; readonly 事情: string };

/**
 * `index.html` が名乗る題。
 *
 * 取れない時は投げる = 空文字で返すと、相手が何を返しても一致しない側に倒れて
 * 「別の画面が居る」 と言い続ける。 期待値を作れないことは相手の問題ではない。
 */
export function 画面の題(root: string): string {
  const path = join(root, "apps", "playground-spa", "index.html");
  const 題 = htmlの題(readFileSync(path, "utf8"));
  if (題 === undefined || 題 === "") {
    throw new Error(`${path} に <title> が無い。 期待する題を導けないので突き合わせられない`);
  }
  return 題;
}

/** 返った HTML が名乗る題 */
export function htmlの題(html: string): string | undefined {
  const m = /<title>([\s\S]*?)<\/title>/i.exec(html);
  return m ? m[1]!.trim() : undefined;
}

/** 引けた頁と期待する題を突き合わせる */
export function 相手を見分ける(期待: string, 引いた: 引いた結果): 相手 {
  if (!引いた.ok) return { 種類: "繋がらない", 事情: 引いた.事情 };
  const 題 = htmlの題(引いた.html);
  return 題 === 期待 ? { 種類: "dragon" } : { 種類: "別の画面", 題 };
}

/** 相手を 1 回引く。 待ちに上限を付ける = 返らない相手で検査ごと止めない */
export async function 頁を引く(url: string, 上限ms = 5000): Promise<引いた結果> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(上限ms) });
    if (!res.ok) return { ok: false, 事情: `${res.status} ${res.statusText}` };
    return { ok: true, html: await res.text() };
  } catch (e) {
    return { ok: false, 事情: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * 相手が dragon でない時の直し方。 種類ごとに違う文面を返す。
 *
 * dragon が居る時は `null` = 呼出側が「問題なし」 をこの型で受け取れる
 * (`bundleFreshnessProblem` と同じ形)。
 */
export function 相手の問題(url: string, 相手: 相手): string | null {
  if (相手.種類 === "dragon") return null;
  if (相手.種類 === "繋がらない") {
    return (
      `開発 server が ${url} に居ない (${相手.事情})。\n` +
      "    `pnpm dev` で立てる。 その port を別の作業が使っている時は、空いている port で\n" +
      "    `pnpm -C apps/playground-spa dev --port <空いている port> --strictPort` を立て、\n" +
      "    画面の検査に `DEV_SPA_URL=http://localhost:<空いている port>` を付ける"
    );
  }
  return (
    `${url} に別の画面が居る (名乗った題 = ${相手.題 === undefined ? "題が無い" : `「${相手.題}」`})。\n` +
    "    その port を空けるか、空いている port で\n" +
    "    `pnpm -C apps/playground-spa dev --port <空いている port> --strictPort` を立て、\n" +
    "    画面の検査に `DEV_SPA_URL=http://localhost:<空いている port>` を付ける"
  );
}

import ghpages from "gh-pages";

/**
 * 見本帳を GitHub Pages へ配信する (#1347)。
 *
 * `gh-pages` の CLI ではなく API を呼ぶ。 CLI の `--remove` は pattern を 1 つしか受けず、
 * **`.git` を除外する書き方ができない** ため。
 *
 * ## 既定の掃除は dotfile に届かない
 *
 * `gh-pages` は公開用の clone を `node_modules/.cache/gh-pages` に持ち、そこを掃除してから
 * `dist` を写す。 掃除は `globby` に pattern を渡す形で、既定は `.`。
 *
 * `globby` の既定は `dot: false` で、pattern が `.` で始まらない限り dotfile に一致しない。
 * 結果として clone に残った repo の dotfile がそのまま commit される。
 *
 * 実測 (`gh-pages@6.3.0` / `globby@11.1.0` の一時 dir で確認)。
 *
 * | pattern | 一致したもの |
 * |---|---|
 * | `.` (既定) | `a.txt` のみ |
 * | `**\/*` | `a.txt` のみ |
 * | `**\/*` + `.*` | `a.txt` / `.npmrc` |
 * | `**\/*` + `.*` + `.*\/**` | `a.txt` / `.npmrc` / `.github/t.yml` |
 *
 * 実際に 1 度配信したところ、48 file のうち 12 件が repo の dotfile だった
 * (`.claude` / `.mcp.json` / `.npmrc` / `.github` 等)。
 *
 * ## `.git` を除外する
 *
 * `.*\/**` は **`.git/**` にも一致する**。 除外しないと clone の git 情報を消してしまう
 * (実測で `.git/HEAD` と `.git/objects/o` が一致した)。
 */

/**
 * 掃除の対象。
 *
 * `dist` に無いものを全て消す形にする = 公開されるのは `dist` の中身だけになる。
 * `.git` は clone の管理情報なので残す。
 */
export const 掃除の対象 = ["**/*", ".*", ".*/**", "!.git", "!.git/**"];

/** 配信する branch */
export const 配信先branch = "gh-pages";

if (import.meta.url === `file://${process.argv[1]}`) {
  ghpages.publish(
    "dist",
    {
      branch: 配信先branch,
      message: "chore(deploy): GitHub Pages",
      remove: 掃除の対象,
    },
    (err) => {
      if (err) {
        console.error(`[deploy-pages] 配信に失敗しました: ${err.message}`);
        process.exit(1);
      }
      console.log("[deploy-pages] Published");
    },
  );
}

/**
 * 入れた依存が、公開されている中身と一致するかを突き合わせる (#1456)。
 *
 * ## なぜ要るか
 *
 * #1448 で、`node_modules` の `@cardenelabs/cdl` に **未公開の build が上書きされていた**。
 * 公開版に無い種別が一覧に入って見え、それを根拠に書けない記法を merge した。
 *
 * 発生源は特定できていない (#1454 の PR 本文に調べた範囲を残した)。 塞げない以上、
 * **入ったことを検知する側** を持つ。
 *
 * ## 判定
 *
 * 公開されている tarball を取り寄せ、入っている dir と **file 一覧と中身の hash** で比べる。
 * 実測で `@cardenelabs/cdl@0.15.0` は 123 file が完全一致した = 差が出たら手元で変わっている。
 *
 * | 差 | 意味 |
 * |---|---|
 * | 余分 | 手元で書き加わった (#1448 の形) |
 * | 欠け | 手元で消えた |
 * | 中身違い | 手元で書き換わった |
 * | 道具が置いた | 入れる道具 (pnpm) が後から置いた。 差として数えない (#2322) |
 *
 * 4 つ目を分けるのは、`node_modules/` が **配る側の持ち物ではない** ため。
 * 一緒に数えると検査が毎回落ち、本物の差が出ても件数が 1 増えるだけで気付けなくなる。
 *
 * ## network を使うのは main だけ
 *
 * 比べる処理 (`中身を突き合わせる`) は 2 つの dir を受けるだけで、network も
 * `node_modules` も触らない。 検査は fixture を渡して呼べる。
 */
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";

/**
 * dir 配下の file を再帰で並べる (dir からの相対 path)。
 *
 * symlink は辿らない = 辿ると dir の外の中身を比べることになる。
 */
export function fileを並べる(root) {
  const out = [];
  const 降りる = (d) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      // **`lstatSync` で見る**。 `statSync` は symlink を辿るので、
      // 先が file なら `isSymbolicLink()` が常に false になり除外が効かない (実測)
      const st = lstatSync(p, { throwIfNoEntry: false });
      if (st === undefined) continue;
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) 降りる(p);
      else if (st.isFile()) out.push(relative(root, p));
    }
  };
  降りる(root);
  return out.sort();
}

/** file の中身の hash。 時刻や権限は見ない = tarball を展開すると必ず変わるため */
function 中身のhash(p) {
  return createHash("sha256").update(readFileSync(p)).digest("hex");
}

/** `node_modules/argparse/index.js` → `node_modules/argparse`。 1 段目までを返す */
function 入れ物の名(f) {
  return f.split(sep).slice(0, 2).join(sep);
}

/**
 * 入れる道具 (pnpm / npm) が置いた file かを判定する (#2322)。
 *
 * 配る側の持ち物は tarball に入っている file だけで、`node_modules/` はそこに含まれない。
 * pnpm は入れた package の dir に `node_modules/.bin/<名>` という起動用の台本を置くので、
 * 一覧を集合で比べると毎回「手元で書き加わった」 側に落ちる (実測 = `js-yaml@5.4.1`)。
 *
 * **`node_modules/` を一律に外さない**。 `bundleDependencies` を持つ package は
 * `npm pack` の時に `node_modules/<名>/` を tarball へ載せる
 * (`man 5 package-json` の `bundleDependencies` の項)。 一律に外すと、そこに足された
 * file が見えなくなる = この検査が守りたい形そのものが素通りする。
 *
 * 1 段目 (`node_modules/<名>`) ごとに、配る側に file があるかで決める。
 * 配る側に無い入れ物は入れる道具が作ったもの、あるなら配る側の持ち物。
 *
 * @param {string} f 入れた側にだけある file (dir からの相対 path)
 * @param {Set<string>} 配る側の入れ物 配る側が持つ `node_modules/<名>` の一覧
 */
function 道具が置いたか(f, 配る側の入れ物) {
  const 段 = f.split(sep);
  if (段[0] !== "node_modules") return false;
  return !配る側の入れ物.has(入れ物の名(f));
}

/**
 * 2 つの dir を file 一覧と中身で突き合わせる。
 *
 * 入れる道具が置いた file は `道具が置いた` に分け、`余分` から外す (#2322)。
 * 数えなかったものを黙って捨てない = 0 件が「該当なし」 か「見ていない」 かを読み手が分けられる。
 *
 * @param {string} 配布物 公開されている tarball を展開した `package/` の場所
 * @param {string} 実物 `node_modules` に入っている場所
 * @returns {{余分: string[], 欠け: string[], 中身違い: string[], 比べた数: number, 道具が置いた: string[]}}
 */
export function 中身を突き合わせる(配布物, 実物) {
  const a = new Set(fileを並べる(配布物));
  const b = new Set(fileを並べる(実物));

  // 配る側が `node_modules/` を持つのは `bundleDependencies` を使う package だけ
  const 配る側の入れ物 = new Set(
    [...a].filter((f) => f.split(sep)[0] === "node_modules").map(入れ物の名),
  );
  const 入れた側だけ = [...b].filter((f) => !a.has(f)).sort();
  const 道具が置いた = 入れた側だけ.filter((f) => 道具が置いたか(f, 配る側の入れ物));
  const 余分 = 入れた側だけ.filter((f) => !道具が置いたか(f, 配る側の入れ物));
  const 欠け = [...a].filter((f) => !b.has(f)).sort();

  const 中身違い = [];
  let 比べた数 = 0;
  for (const f of [...a].filter((x) => b.has(x)).sort()) {
    比べた数 += 1;
    if (中身のhash(join(配布物, f)) !== 中身のhash(join(実物, f))) 中身違い.push(f);
  }
  return { 余分, 欠け, 中身違い, 比べた数, 道具が置いた };
}

/**
 * 突き合わせの結果を人が読む形にする。
 *
 * **次の一手を必ず添える** (#1454 と同じ理由)。 原因だけ言われても読み手は動けない。
 */
export function 結果を文にする(名, 版, r) {
  if (r.比べた数 === 0) {
    return `${名}@${版}: **比べられていません** (共通の file が 0 件)。 展開に失敗している可能性があります`;
  }
  const 差 = r.余分.length + r.欠け.length + r.中身違い.length;
  // 数えなかった件数を書く = 0 件が「該当なし」 か「見ていない」 かを読み手が分けられる (#2322)。
  // 0 件の時は書かない = 一致の文に常に注釈が付くと、付いている意味が薄れる
  const 外した =
    r.道具が置いた.length > 0
      ? `、入れる道具が置いた ${r.道具が置いた.length} file は数えない`
      : "";
  if (差 === 0) return `${名}@${版}: 一致 (${r.比べた数} file${外した})`;

  const 行 = [`${名}@${版}: **公開されている中身と違います** (${r.比べた数} file を比較${外した})`];
  const 出す = (見出し, 一覧) => {
    if (一覧.length === 0) return;
    行.push(
      `  ${見出し} ${一覧.length} 件: ${一覧.slice(0, 5).join(", ")}${一覧.length > 5 ? " ほか" : ""}`,
    );
  };
  出す("余分 (手元で書き加わった)", r.余分);
  出す("欠け (手元で消えた)", r.欠け);
  出す("中身違い (手元で書き換わった)", r.中身違い);
  行.push("  `pnpm install --force` で入れ直してください");
  return 行.join("\n");
}

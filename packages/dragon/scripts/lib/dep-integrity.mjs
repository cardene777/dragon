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
 *
 * ## network を使うのは main だけ
 *
 * 比べる処理 (`中身を突き合わせる`) は 2 つの dir を受けるだけで、network も
 * `node_modules` も触らない。 検査は fixture を渡して呼べる。
 */
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

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

/**
 * 2 つの dir を file 一覧と中身で突き合わせる。
 *
 * @param {string} 配布物 公開されている tarball を展開した `package/` の場所
 * @param {string} 実物 `node_modules` に入っている場所
 * @returns {{余分: string[], 欠け: string[], 中身違い: string[], 比べた数: number}}
 */
export function 中身を突き合わせる(配布物, 実物) {
  const a = new Set(fileを並べる(配布物));
  const b = new Set(fileを並べる(実物));

  const 余分 = [...b].filter((f) => !a.has(f)).sort();
  const 欠け = [...a].filter((f) => !b.has(f)).sort();

  const 中身違い = [];
  let 比べた数 = 0;
  for (const f of [...a].filter((x) => b.has(x)).sort()) {
    比べた数 += 1;
    if (中身のhash(join(配布物, f)) !== 中身のhash(join(実物, f))) 中身違い.push(f);
  }
  return { 余分, 欠け, 中身違い, 比べた数 };
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
  if (差 === 0) return `${名}@${版}: 一致 (${r.比べた数} file)`;

  const 行 = [`${名}@${版}: **公開されている中身と違います** (${r.比べた数} file を比較)`];
  const 出す = (見出し, 一覧) => {
    if (一覧.length === 0) return;
    行.push(`  ${見出し} ${一覧.length} 件: ${一覧.slice(0, 5).join(", ")}${一覧.length > 5 ? " ほか" : ""}`);
  };
  出す("余分 (手元で書き加わった)", r.余分);
  出す("欠け (手元で消えた)", r.欠け);
  出す("中身違い (手元で書き換わった)", r.中身違い);
  行.push("  `pnpm install --force` で入れ直してください");
  return 行.join("\n");
}

#!/usr/bin/env node
/**
 * 入れた依存が、公開されている中身と一致するかを確かめる (#1456)。
 *
 * ## 使い方
 *
 * ```
 * pnpm verify:deps            # 全ての依存を見る
 * pnpm verify:deps @cardenelabs/cdl   # 名前を渡すとその依存だけ
 * ```
 *
 * ## network を使う
 *
 * 公開されている tarball を `npm pack` で取り寄せるので、**日常の検査 (`pnpm test`) には
 * 入れない**。 手で回すか、依存を上げた後に回す。
 *
 * ## 対象の決め方
 *
 * `package.json` の `dependencies` から導く (`devDependencies` は見ない = 出荷物に入らない)。
 * `workspace:` で始まる指定は repo の中の package なので外す。
 *
 * **一覧を手で書かない**。 書くと依存を足した時に更新を忘れ、その依存だけ無防備になる。
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import { 中身を突き合わせる, 結果を文にする } from "./lib/dep-integrity.mjs";

const ここ = dirname(fileURLToPath(import.meta.url));
const repo = join(ここ, "../../..");
const require_ = createRequire(import.meta.url);

/**
 * 見る `package.json` の場所。 出荷物に入る依存を持つ 2 つ。
 *
 * **依存を探す起点は宣言した package 自身にする**。 pnpm は宣言した package の
 * `node_modules` にだけ link を張るので、repo の root から探すと playground-spa 側の
 * 依存が 1 件も引けない (実測で 20 件が「引けない」 に落ちた)。
 */
const 対象の宣言 = ["packages/dragon", "apps/playground-spa"];

/** 宣言から、公開されている依存の名前を集める */
function 依存を集める() {
  /** @type {Map<string, string[]>} 依存の名前 → 宣言した package の場所 */
  const out = new Map();
  for (const 場所 of 対象の宣言) {
    const p = join(repo, 場所, "package.json");
    if (!existsSync(p)) continue;
    const deps = JSON.parse(readFileSync(p, "utf8")).dependencies ?? {};
    for (const [名, 指定] of Object.entries(deps)) {
      // repo の中の package は公開物と比べる相手がいない
      if (typeof 指定 === "string" && 指定.startsWith("workspace:")) continue;
      const 起点 = out.get(名) ?? [];
      起点.push(join(repo, 場所));
      out.set(名, 起点);
    }
  }
  return [...out.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/** 入っている場所と版を引く。 引けない依存は理由を添えて飛ばす */
function 入っている場所(名, 起点) {
  try {
    const pkg = require_.resolve(`${名}/package.json`, { paths: 起点 });
    return { dir: dirname(pkg), 版: JSON.parse(readFileSync(pkg, "utf8")).version };
  } catch {
    // `exports` に `package.json` を載せない package は解決できない。 入口から遡る
    try {
      const entry = require_.resolve(名, { paths: 起点 });
      let d = dirname(entry);
      for (let i = 0; i < 8; i += 1) {
        const p = join(d, "package.json");
        if (existsSync(p)) {
          const j = JSON.parse(readFileSync(p, "utf8"));
          if (j.name === 名) return { dir: d, 版: j.version };
        }
        const 親 = dirname(d);
        if (親 === d) break;
        d = 親;
      }
    } catch {
      /* 解決できない */
    }
    return null;
  }
}

/** 公開されている tarball を取り寄せて展開し、`package/` の場所を返す */
function 配布物を取り寄せる(名, 版) {
  const work = mkdtempSync(join(tmpdir(), "dep-integrity-"));
  const 出力 = execFileSync("npm", ["pack", `${名}@${版}`, "--silent"], {
    cwd: work,
    encoding: "utf8",
    timeout: 300_000,
  });
  const tgz = 出力.trim().split("\n").filter(Boolean).pop();
  if (!tgz) throw new Error(`${名}@${版}: npm pack が file 名を返しませんでした`);
  execFileSync("tar", ["xzf", tgz], { cwd: work, timeout: 300_000 });
  return join(work, "package");
}

const 絞り込み = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const 一覧 = 依存を集める().filter(([n]) => 絞り込み.length === 0 || 絞り込み.includes(n));

if (一覧.length === 0) {
  console.error("見る依存がありません (宣言を読めていないか、絞り込みが一致しません)");
  process.exit(2);
}

let 違い = 0;
let 見た = 0;
const 飛ばした = [];

for (const [名, 起点] of 一覧) {
  const 場所 = 入っている場所(名, 起点);
  if (場所 === null || !場所.版) {
    飛ばした.push(`${名} (入っている場所を引けない)`);
    continue;
  }
  let 配布物;
  try {
    配布物 = 配布物を取り寄せる(名, 場所.版);
  } catch (e) {
    // 取り寄せに失敗した形は「一致した」 と数えない (#1454 と同じく、測れなかったことを値に潰さない)
    飛ばした.push(`${名}@${場所.版} (取り寄せに失敗: ${e instanceof Error ? e.message.split("\n")[0] : e})`);
    continue;
  }
  const r = 中身を突き合わせる(配布物, 場所.dir);
  見た += 1;
  const 文 = 結果を文にする(名, 場所.版, r);
  const ある = r.余分.length + r.欠け.length + r.中身違い.length > 0 || r.比べた数 === 0;
  if (ある) 違い += 1;
  console.log(ある ? `NG ${文}` : `OK ${文}`);
}

console.log(`\n見た依存 ${見た} 件 / 違い ${違い} 件 / 飛ばした ${飛ばした.length} 件`);
for (const s of 飛ばした) console.log(`  飛ばした: ${s}`);

// 飛ばした件数も非 0 で返す = 「測れなかった」 を「一致した」 と同じ扱いにしない
process.exit(違い > 0 || 飛ばした.length > 0 ? 1 : 0);

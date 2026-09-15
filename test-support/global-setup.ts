import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

import { staleReport } from "./dist-freshness";
import { bundleFreshnessProblem } from "./dep-bundle-freshness";

/**
 * test の前に、 test が実際に読む `dist` が `src` より古くないかを見る。
 *
 * dragon の test は `@cardenelabs/dragon` を package として import する = `dist` を読む。
 * `pnpm test` に build は含まれていないため、 古い `dist` が手元に残っていると
 * **src を壊しても test が通る**。
 *
 * `@cardenelabs/cdl` は対象外。 `#1166` で `link:` を外して公開版に寄せたため、 手元の
 * build 状態に左右されない。
 *
 * 環境変数 `SKIP_DIST_FRESHNESS=1` で外せる。 build 中に test を回す等、 一時的に食い違う形が
 * 正常な場面のため。
 */

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** 検査する package。 */
export interface Target {
  /** package 名。 解決に使う。 */
  readonly name: string;
  /** 解決の起点。 その package を実際に import する側の dir。 */
  readonly from: string;
  /** 直し方 (実行する command)。 */
  readonly hint: string;
}

/**
 * package の root dir を、 **実際に読み込まれる entry** から辿って返す。 見つからなければ `null`。
 *
 * link 先を path で決め打ちしない。 pnpm は link を root ではなく利用側の `node_modules` に置く
 * ため、 root だけを見ると常に「存在しない」 になって検査が丸ごと無効化される (実測)。
 */
export function resolvePkgDir(name: string, fromDir: string): string | null {
  let entry: string;
  try {
    entry = createRequire(join(fromDir, "package.json")).resolve(name);
  } catch {
    return null;
  }
  // entry (`<pkg>/dist/index.cjs`) から上に辿り、 名前の一致する package.json を持つ dir を探す。
  // 名前で照合するのは、 pnpm の store 構造 (`.pnpm/<pkg>@<ver>/node_modules/<pkg>`) で途中の
  // 別 package を掴まないため。
  const root = parse(entry).root;
  for (let dir = dirname(entry); dir !== root; dir = dirname(dir)) {
    const manifest = join(dir, "package.json");
    if (!existsSync(manifest)) continue;
    try {
      if ((JSON.parse(readFileSync(manifest, "utf8")) as { name?: string }).name === name) {
        return realpathSync(dir);
      }
    } catch {
      // 読めない package.json は飛ばす。
    }
  }
  return null;
}

/** 検査する package。 dragon は自己参照で解決する (test が読むのと同じ経路)。 */
export const TARGETS: readonly Target[] = [
  {
    name: "@cardenelabs/dragon",
    from: join(ROOT, "packages", "dragon"),
    hint: "pnpm build:packages",
  },
];

/**
 * 問題のある package の説明を並べて返す。 無ければ空。
 *
 * **解決できない target は素通しせず問題として扱う**。 素通しにすると、 name の typo や
 * package の移動で検査が黙って無効になる (codex review Round 1 の指摘)。 `dist` が無い形も
 * ここに落ちるが、 その場合は import 解決の失敗として別途落ちるので、 先に説明を出す方が良い。
 */
export function collectProblems(targets: readonly Target[]): string[] {
  const problems: string[] = [];
  for (const t of targets) {
    const dir = resolvePkgDir(t.name, t.from);
    if (dir === null) {
      problems.push(
        `${t.name} を ${t.from} から解決できない。 dist が未生成か、 検査の対象指定が実体と` +
          `ずれている。\n  直す: ${t.hint}`,
      );
      continue;
    }
    const r = staleReport(dir, t.name, t.hint);
    if (r !== null) problems.push(r);
  }
  return problems;
}

export default function setup(): void {
  if (process.env.SKIP_DIST_FRESHNESS === "1") return;
  const problems = collectProblems(TARGETS);
  if (problems.length > 0) {
    throw new Error(
      `dist が src より古い package がある。\n\n${problems.join("\n\n")}\n\n` +
        `一時的に外すなら SKIP_DIST_FRESHNESS=1 を付ける。`,
    );
  }

  // 画面が使う依存の束ねが、いま解決される依存を指しているかも見る (#1636)。
  //
  // `dist` の古さと分けて出す = 直し方が違う (片方は build、もう片方は server の入れ直し)。
  // まとめると、どちらを直せばよいか読み手が決められない
  const bundles = bundleFreshnessProblem(ROOT);
  if (bundles !== null) {
    throw new Error(
      `画面が使う依存の束ねが古い。\n\n${bundles}\n\n` +
        `一時的に外すなら SKIP_DIST_FRESHNESS=1 を付ける。`,
    );
  }
}

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

import { staleReport } from "./dist-freshness";
import { BUNDLES, bundleFreshnessProblem, type Bundle } from "./dep-bundle-freshness";

/**
 * test の前に、 test が読むものが古くないかを 2 つ見る。
 *
 * 1 つ目は `dist` が `src` より古くないか。 dragon の test は `@cardenelabs/dragon` を package
 * として import する = `dist` を読む。 `pnpm test` に build は含まれていないため、 古い `dist` が
 * 手元に残っていると **src を壊しても test が通る**。
 *
 * 2 つ目は画面が使う依存の束ねが、 いま解決される依存を指しているか (#1636)。
 *
 * `@cardenelabs/cdl` は 1 つ目の対象外。 `#1166` で `link:` を外して公開版に寄せたため、 手元の
 * build 状態に左右されない。
 *
 * ## 外す指定は関門ごとに分ける (#2026)
 *
 * 直し方が違う = 1 つ目は組み立て直し、 2 つ目は開発 server の入れ直し。 逃し口を 1 本に
 * まとめると、 **直せない方のために守りたい方まで落とす** ことになる。 実際に `0.28.0` を
 * 公開する時、 束ねを持つ開発 server がその作業で起動したものではなく入れ直せないため、
 * 1 本しかない逃し口を使い、 公開で守りたい `dist` の関門も一緒に外れた。
 *
 * 名前は `SKIP_ENV` が持つ。 説明文と判定で別々に書くと、 片方だけ直って食い違う。
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

/** 関門ごとの、 外す指定に使う環境変数の名前。 */
export const SKIP_ENV = {
  dist: "SKIP_DIST_FRESHNESS",
  bundle: "SKIP_DEP_BUNDLE_FRESHNESS",
} as const;

/** どの関門を一時的に外すか。 */
export interface Skips {
  /** `dist` が `src` より古くないかを見る関門 */
  readonly dist: boolean;
  /** 画面が使う依存の束ねが古くないかを見る関門 */
  readonly bundle: boolean;
}

/** 環境から外す指定を読む。 `1` の時だけ外す (`0` や `false` を外すと読まない)。 */
export function readSkips(env: Record<string, string | undefined>): Skips {
  return {
    dist: env[SKIP_ENV.dist] === "1",
    bundle: env[SKIP_ENV.bundle] === "1",
  };
}

/**
 * 止める理由を並べて返す。 無ければ空。
 *
 * **外さなかった関門は両方見てから返す**。 片方で打ち切ると、 直し終えた後に もう片方で
 * 止まるので、 直し方を 1 度に受け取れない。 説明文はそれぞれ独立した塊にして、 各塊が
 * 自分の直し方と自分を外す名前を持つ。
 */
export function freshnessProblems(
  root: string,
  skips: Skips,
  targets: readonly Target[] = TARGETS,
  bundles: readonly Bundle[] = BUNDLES,
): string[] {
  const problems: string[] = [];

  if (!skips.dist) {
    const stale = collectProblems(targets);
    if (stale.length > 0) {
      problems.push(
        `dist が src より古い package がある。\n\n${stale.join("\n\n")}\n\n` +
          `一時的に外すなら ${SKIP_ENV.dist}=1 を付ける。`,
      );
    }
  }

  if (!skips.bundle) {
    const stale = bundleFreshnessProblem(root, bundles);
    if (stale !== null) {
      problems.push(
        `画面が使う依存の束ねが古い。\n\n${stale}\n\n` +
          `一時的に外すなら ${SKIP_ENV.bundle}=1 を付ける。`,
      );
    }
  }

  return problems;
}

export default function setup(): void {
  const problems = freshnessProblems(ROOT, readSkips(process.env));
  if (problems.length > 0) throw new Error(problems.join("\n\n"));
}

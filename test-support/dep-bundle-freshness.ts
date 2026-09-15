import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

/**
 * 画面が使う依存の束ねが、いま解決される依存を指しているかを見る (#1460)。
 *
 * ## 何が起きたか
 *
 * 依存を 0.15.0 に上げた後も、動いていた開発 server は 8/27 08:11 に作った束ねを使い続けた。
 * 束ねに `drawRatio` も `chart-stat` も **1 件も入っておらず**、画面は 0.15.0 を 1 つも
 * 反映していなかった。 記法に足した項目を書いても描く側が知らないので何も出ない。
 *
 * `mtime` は中身の代理でしかなく、lockfile の中身が変わらなくても動く。 実測でも時刻だけが
 * 動いて偽陽性になった。 Vite は内容 hash で判定するため server を起動し直しても束ねを
 * 作り直さず、逃し口を使うまで検査が止まり続けた。 そのため時刻ではなく、Vite が記録した
 * package root と app がいま解決する package root を突き合わせる。
 *
 * `src` の実在だけでは足りない。 pnpm は古い版を `node_modules/.pnpm/` に残し、実測では
 * `@cardenelabs/cdl` が 9 版同居したため、版を上げた後も古い path は実在し続ける。
 *
 * 新しく足してまだ束ねに入っていない依存は見えない。 Vite は要求された時にその場で束ねるため、
 * 束ねに無いこと自体は古さを意味しない。
 */

/** 束ねの置き場所と、直し方 */
export interface Bundle {
  /** repo からの相対で、束ねが置かれる dir */
  readonly dir: string;
  /** 直し方 (実行する command) */
  readonly hint: string;
}

/** 見る束ね。 画面を出す app が持つもの */
export const BUNDLES: readonly Bundle[] = [
  {
    dir: "apps/playground-spa/node_modules/.vite/deps",
    hint: "開発 server を止めて `pnpm dev` で起動し直す",
  },
];

/** 束ねが記録した package root と、いま解決される package root のずれ */
export interface PackageMismatch {
  readonly name: string;
  readonly 記録: string;
  readonly いま: string;
}

/** いま解決される依存と違う実体を記録している束ね */
export interface Stale {
  readonly dir: string;
  readonly hint: string;
  readonly ずれた: PackageMismatch[];
}

function packageName(key: string): string | null {
  const parts = key.split("/");
  const count = key.startsWith("@") ? 2 : 1;
  if (parts.length < count || parts.slice(0, count).some((part) => part.length === 0)) return null;
  return parts.slice(0, count).join("/");
}

function recordedPackageRoot(metadataDir: string, src: string, name: string): string | null {
  const source = resolve(metadataDir, src);
  const marker = `${sep}node_modules${sep}${name.split("/").join(sep)}`;
  let at = source.lastIndexOf(marker);
  while (at >= 0) {
    const end = at + marker.length;
    if (end === source.length || source[end] === sep) return source.slice(0, end);
    at = source.lastIndexOf(marker, at - 1);
  }
  return null;
}

function currentPackageRoot(root: string, appDir: string, name: string): string | null {
  try {
    const current = realpathSync(join(appDir, "node_modules", name));
    const realRoot = realpathSync(root);
    // `/var` と `/private/var` のような repo 手前の別名だけを揃え、package link の解決先は残す。
    if (current === realRoot || current.startsWith(`${realRoot}${sep}`)) {
      return root + current.slice(realRoot.length);
    }
    return current;
  } catch {
    return null;
  }
}

function optimizedEntries(metadata: string): [string, unknown][] | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(metadata, "utf8"));
    if (typeof parsed !== "object" || parsed === null || !("optimized" in parsed)) return null;
    const optimized: unknown = parsed.optimized;
    if (typeof optimized !== "object" || optimized === null || Array.isArray(optimized)) return null;
    return Object.entries(optimized);
  } catch {
    return null;
  }
}

/**
 * 束ねが記録した package root と、app がいま解決する package root が違うものを並べる。
 *
 * 束ねや metadata を読めない形は報告しない。 個々の依存を判定できない時も「古い」には倒さず、
 * 呼出側が空振りを把握できるよう `見られなかった` に数える。
 */
export function staleBundles(
  root: string,
  bundles: readonly Bundle[] = BUNDLES,
): { stale: Stale[]; 見た: number; 見られなかった: number } {
  const stale: Stale[] = [];
  let 見た = 0;
  let 見られなかった = 0;

  for (const bundle of bundles) {
    const dir = join(root, bundle.dir);
    if (!existsSync(dir)) continue;

    const entries = optimizedEntries(join(dir, "_metadata.json"));
    if (entries === null) continue;

    const appDir = dirname(dirname(dirname(dir)));
    const ずれた: PackageMismatch[] = [];
    for (const [key, entry] of entries) {
      const name = packageName(key);
      const src =
        typeof entry === "object" && entry !== null && "src" in entry && typeof entry.src === "string"
          ? entry.src
          : null;
      const 記録 = name === null || src === null ? null : recordedPackageRoot(dir, src, name);
      const いま = name === null ? null : currentPackageRoot(root, appDir, name);
      if (name === null || 記録 === null || いま === null) {
        見られなかった += 1;
        continue;
      }

      見た += 1;
      if (記録 !== いま) ずれた.push({ name, 記録, いま });
    }

    if (ずれた.length > 0) stale.push({ dir: bundle.dir, hint: bundle.hint, ずれた });
  }

  return { stale, 見た, 見られなかった };
}

/**
 * 束ねが古い時の説明。 古くなければ `null` (#1998)。
 *
 * **判定を 1 箇所に閉じる**。 vitest の前処理と画面の検査の 2 経路が同じ古さを見るので、
 * それぞれで `staleBundles` の結果を読んで組み立てると、片方だけ条件が変わって食い違う。
 *
 * 逃し口の案内は呼出側が足す = 外し方が経路ごとに違う (片方は環境変数、もう片方は走らせる
 * 検査の選び方)。
 *
 * 束ねが無い形と読めない形では `null` を返す。 見られなかったことを「古い」 に倒すと、
 * 開発 server を 1 度も立てていない環境で必ず止まる。 見られた件数が要るなら
 * `staleBundles` を直接呼ぶ。
 */
export function bundleFreshnessProblem(
  root: string,
  bundles: readonly Bundle[] = BUNDLES,
): string | null {
  const { stale } = staleBundles(root, bundles);
  return stale.length === 0 ? null : staleBundleReport(stale);
}

/** 落ちた時の案内。 ずれた実体と次の一手を必ず添える */
export function staleBundleReport(stale: readonly Stale[]): string {
  return stale
    .map(
      (bundle) =>
        `${bundle.dir} がいま解決される依存と違う実体を束ねている。\n` +
        bundle.ずれた
          .map((dependency) => `  ${dependency.name}\n    記録: ${dependency.記録}\n    いま: ${dependency.いま}`)
          .join("\n") +
        `\n  直す: ${bundle.hint}`,
    )
    .join("\n\n");
}

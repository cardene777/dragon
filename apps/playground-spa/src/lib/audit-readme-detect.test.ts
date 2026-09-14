import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 監査の説明書 (`audit-reports/README.md`) の検知システムの節が、実物の命令と検査のファイルと
 * 同じことを言っていることの検証 (#1955)。
 *
 * 節は層ごとの表に「検査のファイル」 と「命令」 を置く。 命令を root の `package.json` で展開し、
 * 最後に走る検査の道具 (`playwright test` / `vitest run`) と絞り込みから、実際に走るファイルを求めて
 * 表と照らす。
 *
 * 以前の節は層 1 を回帰検査 1 本と書いていたが、`pnpm check:cdl` は画面の検査を全て走らせていた。
 * 説明書を読む検査が無く、命令を変えた PR のどれもこの節を直していなかった。
 */

const ROOT = join(import.meta.dirname, "../../../..");
const 読む = (rel: string): string => readFileSync(join(ROOT, rel), "utf8");

/** 検知システムの節。 `## 検知システム` の見出しから、次の区切り (`---`) の手前まで */
export function 検知システムの節(文書: string): string {
  return /^## 検知システム[\s\S]*?(?=^---$)/m.exec(文書)?.[0] ?? "";
}

type 層の行 = { 層: string; ファイルたち: string[]; 命令: string };

/** 層の表の行。 1 列目が `層 N` で始まる行の、検査のファイル (3 列目) と命令 (4 列目) を読む */
export function 層の表(節: string): 層の行[] {
  return 節
    .split("\n")
    .filter((行) => /^\| 層 \d/.test(行))
    .map((行) => {
      const 欄 = 行
        .split("|")
        .slice(1, -1)
        .map((s) => s.trim());
      return {
        層: 欄[0] ?? "",
        ファイルたち: [...(欄[2] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]!),
        命令: /`pnpm ([a-z][a-z0-9:._-]*)`/.exec(欄[3] ?? "")?.[1] ?? "",
      };
    });
}

/** 最後に走る検査。 絞り込みが無ければ置き場所の中の全て */
type 走る検査 =
  | { 道具: "playwright"; 置き場所: string; 絞り込み: string | null }
  | { 道具: "vitest"; 絞り込み: string | null }
  | { 道具: "tsc" };

type 展開 = { 検査たち: 走る検査[]; 読めない: string[] };

/** `pnpm --filter <名前>` の名前から package の dir を引く */
function packageのdir(名前: string): string | undefined {
  for (const 群 of ["apps", "packages"]) {
    for (const dir of readdirSync(join(ROOT, 群))) {
      const 場所 = join(群, dir, "package.json");
      if (!existsSync(join(ROOT, 場所))) continue;
      if ((JSON.parse(読む(場所)) as { name?: string }).name === 名前) return `${群}/${dir}`;
    }
  }
  return undefined;
}

/** package の Playwright の検査の置き場所 (`playwright.config.ts` の `testDir`) */
function playwrightの置き場所(dir: string): string | undefined {
  const 設定 = join(dir, "playwright.config.ts");
  if (!existsSync(join(ROOT, 設定))) return undefined;
  const testDir = /testDir:\s*"([^"]+)"/.exec(読む(設定))?.[1];
  return testDir === undefined ? undefined : `${join(dir, testDir)}/`;
}

/**
 * 命令を `scripts` で展開し、最後に走る検査を集める。
 *
 * 読む形は `&&` で繋いだ `pnpm run <名前>` / `pnpm <名前>` と、`pnpm --filter <名前> exec playwright test`・
 * `vitest run`・`tsc` だけ。 それ以外は黙って飛ばさず `読めない` に積む = 展開できない命令を
 * 「何も走らない」 と読むと、表との照らしが空振りする。
 */
export function 命令を展開する(
  名前: string,
  scripts: Readonly<Record<string, string>>,
  辿った: ReadonlySet<string> = new Set(),
): 展開 {
  const 中身 = scripts[名前];
  if (中身 === undefined) return { 検査たち: [], 読めない: [`${名前} (scripts に無い)`] };
  if (辿った.has(名前)) return { 検査たち: [], 読めない: [`${名前} (自分を呼んでいる)`] };
  const 次に辿った = new Set([...辿った, 名前]);
  const 結果: 展開 = { 検査たち: [], 読めない: [] };
  for (const 部分 of 中身.split("&&").map((s) => s.trim())) {
    const 呼ぶ = /^pnpm (?:run )?([a-z][a-z0-9:._-]*)$/.exec(部分);
    const 画面 = /^pnpm --filter (\S+) exec playwright test(?:\s+(\S+))?$/.exec(部分);
    const 単体 = /^vitest run(?:\s+(\S+))?$/.exec(部分);
    if (呼ぶ !== null) {
      const 子 = 命令を展開する(呼ぶ[1]!, scripts, 次に辿った);
      結果.検査たち.push(...子.検査たち);
      結果.読めない.push(...子.読めない);
    } else if (画面 !== null) {
      const dir = packageのdir(画面[1]!);
      const 置き場所 = dir === undefined ? undefined : playwrightの置き場所(dir);
      if (置き場所 === undefined) 結果.読めない.push(`${部分} (検査の置き場所を引けない)`);
      else 結果.検査たち.push({ 道具: "playwright", 置き場所, 絞り込み: 画面[2] ?? null });
    } else if (単体 !== null) {
      結果.検査たち.push({ 道具: "vitest", 絞り込み: 単体[1] ?? null });
    } else if (/^tsc\b/.test(部分)) {
      結果.検査たち.push({ 道具: "tsc" });
    } else {
      結果.読めない.push(部分);
    }
  }
  return 結果;
}

/** dir の下のファイルを repo からの相対で集める */
function ファイルを集める(dir: string): string[] {
  const 集めた: string[] = [];
  for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist") continue;
    const 場所 = `${dir}/${e.name}`;
    if (e.isDirectory()) 集めた.push(...ファイルを集める(場所));
    else 集めた.push(場所);
  }
  return 集めた;
}

/** root の `vitest` が拾うファイル (`vitest.config.ts` の `include` と同じ置き場所) */
function vitestのファイル(): string[] {
  const 置き場所たち = [
    ...readdirSync(join(ROOT, "packages")).map((d) => `packages/${d}/test`),
    ...readdirSync(join(ROOT, "apps")).map((d) => `apps/${d}/src`),
  ].filter((d) => existsSync(join(ROOT, d)));
  return 置き場所たち.flatMap(ファイルを集める).filter((f) => /\.test\.tsx?$/.test(f));
}

/**
 * 走る検査を、表と照らせる字にする。
 *
 * 絞り込みの無い `playwright test` は置き場所の dir そのもの。 絞り込みがある時は、置き場所の中で
 * 絞り込み (Playwright は正規表現、vitest は部分一致で読む) に当たる検査のファイル。
 */
export function 走るファイル(検査たち: readonly 走る検査[]): string[] {
  const 字: string[] = [];
  for (const 検査 of 検査たち) {
    if (検査.道具 === "playwright") {
      if (検査.絞り込み === null) {
        字.push(検査.置き場所);
        continue;
      }
      const 型 = new RegExp(検査.絞り込み);
      字.push(
        ...ファイルを集める(検査.置き場所.replace(/\/$/, "")).filter(
          (f) => /\.(spec|test)\.[cm]?[jt]sx?$/.test(f) && 型.test(f),
        ),
      );
    } else if (検査.道具 === "vitest") {
      const 絞り込み = 検査.絞り込み;
      字.push(...vitestのファイル().filter((f) => 絞り込み === null || f.includes(絞り込み)));
    }
  }
  return [...new Set(字)].sort();
}

/** 表の行のうち、命令が表のファイルを走らせない行 */
export function 表とずれる行(
  行たち: readonly 層の行[],
  scripts: Readonly<Record<string, string>>,
): string[] {
  return 行たち.flatMap((行) => {
    const 展開 = 命令を展開する(行.命令, scripts);
    if (展開.読めない.length > 0) return [`${行.層}: 展開できない (${展開.読めない.join(" / ")})`];
    const 走る = 走るファイル(展開.検査たち);
    const 書いた = [...行.ファイルたち].sort();
    return JSON.stringify(走る) === JSON.stringify(書いた)
      ? []
      : [`${行.層}: 表は ${書いた.join(", ")}、命令が走らせるのは ${走る.join(", ")}`];
  });
}

const scripts = (JSON.parse(読む("package.json")) as { scripts: Record<string, string> }).scripts;
const 節 = 検知システムの節(読む("apps/playground-spa/audit-reports/README.md"));
const 行たち = 層の表(節);

describe("監査の説明書の検知システムの節 (#1955)", () => {
  it("節と層の表を読めている (検査が空振りしていない)", () => {
    expect(節, "検知システムの節が見つからない").not.toBe("");
    expect(行たち.length, "層の表の行を 1 つも読めていない").toBeGreaterThan(0);
    for (const 行 of 行たち) {
      expect(行.命令, `${行.層} の命令を読めていない`).not.toBe("");
      expect(行.ファイルたち.length, `${行.層} の検査のファイルを読めていない`).toBeGreaterThan(0);
    }
  });

  it("層ごとの命令が、表に書いた検査のファイルを走らせる", () => {
    expect(表とずれる行(行たち, scripts)).toEqual([]);
  });

  it("`check:all` は型検査の後に表の層の命令を上から順に走らせる", () => {
    const 部分 = (scripts["check:all"] ?? "")
      .split("&&")
      .map((s) => s.trim().replace(/^pnpm (?:run )?/, ""));
    expect(部分).toEqual(["typecheck", ...行たち.map((行) => 行.命令)]);
  });

  it("層 3 のファイルは層 1 の置き場所の中にある (説明書の「層 3 が 2 度走る」 の前提)", () => {
    const [層1, 層3] = [行たち[0], 行たち[2]];
    expect(層1?.ファイルたち.length, "層 1 の置き場所を読めていない").toBe(1);
    const 置き場所 = 層1!.ファイルたち[0]!;
    expect(層3?.ファイルたち.length, "層 3 のファイルを読めていない").toBeGreaterThan(0);
    expect(層3!.ファイルたち.filter((f) => !f.startsWith(置き場所))).toEqual([]);
  });

  it("節に書いた `pnpm` の命令と、`apps/` と `packages/` のファイルが実在する", () => {
    const 命令たち = [...節.matchAll(/`pnpm ([a-z][a-z0-9:._-]*)`/g)].map((m) => m[1]!);
    const ファイルたち = [...節.matchAll(/`((?:apps|packages)\/[^`]+)`/g)].map((m) => m[1]!);
    expect(命令たち.length, "命令を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(
      ファイルたち.length,
      "ファイルを 1 つも拾えていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(命令たち.filter((c) => scripts[c] === undefined)).toEqual([]);
    expect(ファイルたち.filter((f) => !existsSync(join(ROOT, f)))).toEqual([]);
  });

  /*
   * 植え込み対照は説明書の表を使わず、自分で組んだ 1 行だけを渡す。 説明書の表を使うと、
   * 説明書の別の行がずれた時に対照まで巻き添えで落ち、どちらが壊れたか読めなくなる
   * (説明書の層 2 の行を書き換える変異で、対照 2 件が一緒に落ちたのを実測)。
   */
  const 層2の行 = {
    層: "層 2",
    ファイルたち: ["packages/dragon/test/visual-validate-sweep.test.ts"],
    命令: "check:dragon",
  };
  const 層3の行 = {
    層: "層 3",
    ファイルたち: [
      "apps/playground-spa/tests/kind-geometry-check.spec.ts",
      "apps/playground-spa/tests/kind-geometry-check.proof.spec.ts",
    ],
    命令: "check:kind",
  };

  it("植え込み対照: 組んだ行は、今の命令で表とずれない", () => {
    // 下の 3 件が「ずれた」 と言えるのは、崩す前の行がずれていない時だけ
    expect(表とずれる行([層2の行, 層3の行], scripts)).toEqual([]);
  });

  it("植え込み対照: 層 2 の行のファイルを書き換えると、ずれとして見つける", () => {
    const 書き換えた = { ...層2の行, ファイルたち: ["packages/dragon/test/別の検査.test.ts"] };
    expect(表とずれる行([書き換えた], scripts)).toEqual([
      "層 2: 表は packages/dragon/test/別の検査.test.ts、命令が走らせるのは packages/dragon/test/visual-validate-sweep.test.ts",
    ]);
  });

  it("植え込み対照: `check:kind` の展開先を 1 本外すと、ずれとして見つける", () => {
    const 外した = { ...scripts, "check:kind": "pnpm run test:kind" };
    expect(表とずれる行([層3の行], 外した)).toEqual([
      "層 3: 表は apps/playground-spa/tests/kind-geometry-check.proof.spec.ts, apps/playground-spa/tests/kind-geometry-check.spec.ts、命令が走らせるのは apps/playground-spa/tests/kind-geometry-check.spec.ts",
    ]);
  });

  it("植え込み対照: 展開できない命令を、黙って飛ばさずに挙げる", () => {
    const 読めない = { ...scripts, "check:dragon": "bash scripts/sweep.sh" };
    expect(表とずれる行([層2の行], 読めない)).toEqual([
      "層 2: 展開できない (bash scripts/sweep.sh)",
    ]);
  });
});

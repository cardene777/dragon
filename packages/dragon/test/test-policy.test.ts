/**
 * 検査をどう回し、何を外したかの記録が、検査の実物と食い違わない (#3381)。
 *
 * 外した検査は `docs/removed-tests.md` に、理由と、同じ守りを担う残りの検査の名前を残す。
 * 受入条件を残す `.ikkan/specs/` の行が名指す検査は、全て検査の file に在る。
 * 課題ごとには関係する検査だけを回し、一式は版を出す前の 1 回だけ回す。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * 検査の file の字を全てつないだ物。検査の名前は `"名前"` の形で書かれる。読むのは 1 度だけ。
 * 種類の検査から移した確かめ (`packages/dragon/test/*-checks.ts`) は、それを読む検査の file (`kind-playground.test.ts`、`kind-cli.test.ts`) が回すので、検査の file に数える (#3763)
 */
let sourcesRead: string | undefined;
function testSources(): string {
  sourcesRead ??= execFileSync("git", ["-C", ROOT, "ls-files", "--cached", "--others", "--exclude-standard", "*.test.ts", "*.test.tsx", "packages/dragon/test/*-checks.ts"], { encoding: "utf8" })
    .split("\n")
    .filter((path) => path !== "" && existsSync(join(ROOT, path)))
    .map((path) => readFileSync(join(ROOT, path), "utf8"))
    .join("\n");
  return sourcesRead;
}
// 件の上限の外で、file を読み込む時に読んでおく (#3733)
testSources();

/** 検査の名前が検査の file に書かれているか。名前は引用符で囲んで書く */
const named = (sources: string, name: string): boolean => [`"${name}"`, `'${name}'`, `\`${name}\``].some((quoted) => sources.includes(quoted));

/**
 * 3 つの引用符それぞれで、隣り合う 2 つの引用符の間の字 (#3733)。
 * 引用符を含まない名前は、ここに在る時だけ `named` が真になる。名前ごとに全ての検査の file の字を探し直すと、
 * `.ikkan/specs/` の数千の名前で混んだ機械の 1 件の上限 (10 秒) を超えたので、1 度の走査で引ける形にする
 */
function quotedTexts(sources: string): Set<string> {
  const out = new Set<string>();
  for (const quote of ['"', "'", "`"]) {
    const parts = sources.split(quote);
    for (let i = 1; i < parts.length - 1; i++) out.add(parts[i] ?? "");
  }
  return out;
}

/** markdown の表の本文の行を、欄ごとに分けて返す。見出しの行と区切りの行は外す */
function tableRows(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("|") || /^\|\s*-/u.test(line)) continue;
    rows.push(line.split("|").slice(1, -1).map((cell) => cell.trim()));
  }
  return rows;
}

/** 句点か改行で区切った文のうち、全ての語を含む最初の文。無い時は undefined */
const sentenceWith = (text: string, words: string[]): string | undefined =>
  text.split(/[。\n]/u).find((sentence) => words.every((word) => sentence.includes(word)));

/** 欄の字から、backtick で囲んだ検査の名前を読む。空白を含む名前は二重引用符で囲む。命令と path は外す */
function namesIn(cell: string): string[] {
  const names: string[] = [];
  for (const m of cell.matchAll(/`([^`]+)`/gu)) {
    const raw = m[1] ?? "";
    if (raw.startsWith('"') && raw.endsWith('"')) names.push(raw.slice(1, -1));
    else if (!/[\s/.]/u.test(raw)) names.push(raw);
  }
  return names;
}

/** 欄 `届く検査` の行。1 行でない時も検査が数を確かめられるよう、全ての行を返す */
const reachedRows = (): string[][] =>
  tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8")).filter((cells) => cells[0] === "届く検査");

/** 欄の命令を `&&` で区切った段。`bash -c '...'` の囲みは外す */
const commandSteps = (cell: string): string[] =>
  cell
    .replace(/^`|`$/gu, "")
    .replace(/^bash -c '|'$/gu, "")
    .split("&&")
    .map((step) => step.trim());

/**
 * 欄 `届く検査` の命令が型の検査をどこに置くかの誤り。誤りが無い時は空の配列 (#3730)。
 * 型の検査は検査の file が読む `dist` の型の定義を読むので package の build の後に、
 * 関係する検査より短いので `pnpm test:related` の前に回す。
 */
function reachedTypecheckProblems(cell: string): string[] {
  const steps = commandSteps(cell);
  const build = steps.indexOf("pnpm build:packages");
  const typecheck = steps.indexOf("pnpm typecheck");
  const related = steps.indexOf("pnpm test:related");
  if (typecheck === -1) return ["型の検査 `pnpm typecheck` を回さない"];
  const problems: string[] = [];
  if (build === -1 || typecheck < build) problems.push("型の検査を package の build より前に回す");
  if (related === -1 || typecheck > related) problems.push("型の検査を関係する検査より後に回す");
  return problems;
}

/** `.ikkan/checks.md` の欄の中身。backtick の囲みは残す。欄が無い時は空 */
const checksCell = (field: string): string =>
  tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8")).find((cells) => cells[0] === field)?.[1] ?? "";

/** package.json の script。無い時は空 */
const scriptOf = (file: string, name: string): string =>
  (JSON.parse(readFileSync(join(ROOT, file), "utf8")) as { scripts: Record<string, string> }).scripts[name] ?? "";

/**
 * 命令が型の検査を build より前に回す誤り。誤りが無い時は空の配列 (#3732)。
 * 型の検査は package の src と見本帳の src と検査の file が読む `dist` の型の定義を読み、
 * `dist` の無い作業場所では `TS2307` で落ちるので、build の後に回す。`pnpm run X` は `pnpm X` と同じ段に読む。
 */
function typecheckBeforeBuildProblems(command: string): string[] {
  const steps = commandSteps(command).map((step) => step.replace(/^pnpm run /u, "pnpm "));
  const typecheck = steps.indexOf("pnpm typecheck");
  const build = steps.findIndex((step) => step === "pnpm build" || step === "pnpm build:packages");
  if (typecheck === -1) return ["型の検査を回さない"];
  if (build === -1) return ["build を回さない"];
  if (typecheck < build) return ["型の検査を build より前に回す"];
  return [];
}

/** `pnpm verify` が回す順を書く行のうち、型の検査を build より前に書く行。数えた行も返す */
function verifyOrderLines(text: string, typecheck: string): { counted: number; early: string[] } {
  const lines = text.split(/[。\n]/u).filter((line) => line.includes("pnpm verify") && line.includes("build") && line.includes(typecheck));
  return { counted: lines.length, early: lines.filter((line) => line.indexOf(typecheck) < line.indexOf("build")) };
}

describe("検査の回し方と外した検査の記録 (#3381)", () => {
  it("removed-tests-are-gone-and-covered", () => {
    const record = join(ROOT, "docs/removed-tests.md");
    expect(existsSync(record), "外した検査の記録 docs/removed-tests.md が無い").toBe(true);
    if (!existsSync(record)) return;
    const sources = testSources();
    // 欄は 外した検査 | 在った file | 理由 | 同じ守りを担う検査
    const rows = tableRows(readFileSync(record, "utf8")).filter((cells) => cells.length === 4 && cells[0] !== "外した検査");
    expect(rows.length, "外した検査が記録に 1 件も無い").toBeGreaterThan(0);
    const problems: string[] = [];
    for (const [removed = "", , why = "", kept = ""] of rows) {
      const name = namesIn(removed)[0];
      if (name === undefined) {
        problems.push(`外した検査の名前を読めない行: ${removed}`);
        continue;
      }
      if (named(sources, name)) problems.push(`${name} がまだ検査の file に在る`);
      if (why === "") problems.push(`${name} の理由が空`);
      const keepers = namesIn(kept);
      if (keepers.length === 0) problems.push(`${name} の守りを担う検査の名前が無い`);
      for (const keeper of keepers) if (!named(sources, keeper)) problems.push(`${name} の守りを担う ${keeper} が検査の file に無い`);
    }
    expect(problems, "外した検査の記録と検査の file の食い違い").toEqual([]);
  });

  it("spec-rows-name-existing-tests", () => {
    const sources = testSources();
    const quoted = quotedTexts(sources);
    const isNamed = (name: string): boolean => (/["'`]/u.test(name) ? named(sources, name) : quoted.has(name));
    const dir = join(ROOT, ".ikkan/specs");
    let counted = 0;
    const missing: string[] = [];
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
      for (const cells of tableRows(readFileSync(join(dir, file), "utf8"))) {
        for (const name of namesIn(cells[1] ?? "")) {
          counted += 1;
          if (!isNamed(name)) missing.push(`${file}: ${name}`);
        }
      }
    }
    // 1 件も数えられない時は、読み方が壊れていて確かめていない
    expect(counted, "`.ikkan/specs/` の行から検査の名前を 1 件も読めない").toBeGreaterThan(100);
    expect(missing, "`.ikkan/specs/` の行が名指すのに、検査の file に無い検査").toEqual([]);
  });

  it("typecheck-covers-test-code", () => {
    // 検査の code の型は `pnpm typecheck` が `tsconfig.test.json` で見る (#1413)。`tsc -b` はこの設定を読まない。
    // 型検査の命令に入れる前は、検査の 1 件 (16 秒) が同じ型検査を回していた (#3381)
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.typecheck, "型検査の命令が検査の code の設定を見ていない").toContain("tsc -p packages/dragon/tsconfig.test.json --noEmit");
  });

  it("fixture-configs-typechecked-at-root", () => {
    // 見本の設定は repo の根の設定を読むので `test-support` の外を読む。`tsc -b` の `test-support` から外し、
    // repo の根の設定と同じ所で型を見る。登録が漏れると `pnpm typecheck` が TS6059 で落ちる (#3395)
    const configs = readdirSync(join(ROOT, "test-support/fixtures"), { recursive: true, encoding: "utf8" })
      .filter((path) => path.endsWith("vitest.config.ts"))
      .map((path) => `fixtures/${path}`);
    expect(configs.length, "見本の設定を 1 つも見つけられない").toBeGreaterThan(0);
    const text = (file: string) => readFileSync(join(ROOT, file), "utf8");
    for (const path of configs) {
      for (const file of ["tsconfig.config-files.json", "tsconfig.eslint.json"]) {
        expect(text(file), `${file} の include に test-support/${path} が無い`).toContain(`"test-support/${path}"`);
      }
      expect(text("test-support/tsconfig.json"), `test-support/tsconfig.json の exclude に ${path} が無い`).toContain(`"${path}"`);
    }
  });

  it("checks-declare-light-suite", () => {
    const rows = tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8"));
    const weight = rows.find((cells) => cells[0] === "一式の重さ");
    expect(weight?.[1], "`.ikkan/checks.md` が一式の重さを `軽い` と書いていない").toBe("軽い");
  });

  it("release-fields-all-written", () => {
    // ikkan の配る前の関門 (`deployable.sh`) と配った後の関門 (`deployed.sh`) が求める欄 (#3589)。欄が無い repo は終わり方 3 で断られる
    const fields = ["配る前のテスト", "配る前の動作", "配る前のセキュリティ", "配る先との整合", "壊す変更", "stagingの確かめ", "戻す確かめ", "配った後の確かめ"];
    const rows = tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8"));
    const cell = (field: string): string | undefined => rows.find((cells) => cells[0] === field)?.[1];
    expect(fields.filter((field) => cell(field) === undefined), "`.ikkan/checks.md` に無い欄").toEqual([]);
    // 中身は backtick で囲んだ命令か、`無し (理由)`。理由の無い `無し` は ikkan が断る
    const bad = fields.filter((field) => {
      const text = cell(field) ?? "";
      return !/^`[^`]+`$/u.test(text) && !/^無し\s*[(（][^)）]+[)）]$/u.test(text);
    });
    expect(bad, "命令でも理由つきの `無し` でもない欄").toEqual([]);
  });

  it("release-tests-skip-e2e", () => {
    const rows = tableRows(readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8"));
    const command = (rows.find((cells) => cells[0] === "配る前のテスト")?.[1] ?? "").replace(/^`|`$/gu, "");
    expect(command, "`.ikkan/checks.md` に配る前のテストの命令が無い").not.toBe("");
    for (const part of ["pnpm typecheck", "pnpm build", "pnpm lint", "vitest run packages/", "vitest run apps/"]) {
      expect(command, `配る前のテストが ${part} を回さない`).toContain(part);
    }
    // e2e は配る前にも回さない (ikkan の flow/steps.md、#3585)
    expect(command, "配る前のテストが e2e を回す").not.toMatch(/e2e|playwright\s+test|test:e2e/iu);
  });

  it("checks-run-related-tests-after-building", () => {
    // 照合の step の無い線の実装の関門は、欄 `届く検査` の命令を回す (ikkan の #380)。
    // 検査は build した dist を読み、`pnpm test:related` は build しないので、package を build してから回す (#3679)
    const rows = reachedRows();
    expect(rows, "`.ikkan/checks.md` の欄 `届く検査` が 1 行でない").toHaveLength(1);
    const steps = commandSteps(rows[0]?.[1] ?? "");
    const build = steps.indexOf("pnpm build:packages");
    const related = steps.indexOf("pnpm test:related");
    expect(build, "届く検査が package を build しない").toBeGreaterThanOrEqual(0);
    expect(related, "届く検査が package を build してから関係する検査を回す形でない").toBeGreaterThan(build);
  });

  it("reached-checks-typecheck-after-build", () => {
    // 届く検査は検査の file の型も見る。`pnpm test:related` が起こす vitest は型を見ないため、
    // #3717 の型の誤りが実装の関門を通り、#3728 の配る前の関門で初めて見つかった (#3730)
    const rows = reachedRows();
    expect(rows, "`.ikkan/checks.md` の欄 `届く検査` が 1 行でない").toHaveLength(1);
    expect(reachedTypecheckProblems(rows[0]?.[1] ?? ""), "届く検査の型の検査の置き方の誤り").toEqual([]);
  });

  it("reached-checks-reject-missing-or-early-typecheck", () => {
    // 型の検査を持たない命令と、build より前か関係する検査より後に置いた命令を、誤りとして拒む
    expect(reachedTypecheckProblems("`bash -c 'pnpm build:packages && pnpm test:related'`"), "型の検査を持たない命令").toEqual(["型の検査 `pnpm typecheck` を回さない"]);
    expect(reachedTypecheckProblems("`bash -c 'pnpm typecheck && pnpm build:packages && pnpm test:related'`"), "型の検査を build より前に置いた命令").toEqual(["型の検査を package の build より前に回す"]);
    expect(reachedTypecheckProblems("`bash -c 'pnpm typecheck && pnpm test:related'`"), "build を持たない命令").toEqual(["型の検査を package の build より前に回す"]);
    expect(reachedTypecheckProblems("`bash -c 'pnpm build:packages && pnpm test:related && pnpm typecheck'`"), "型の検査を関係する検査より後に置いた命令").toEqual(["型の検査を関係する検査より後に回す"]);
    expect(reachedTypecheckProblems("`bash -c 'pnpm build:packages && pnpm typecheck && pnpm test:related'`"), "build の後、関係する検査の前に置いた命令").toEqual([]);
  });

  it("checks-suite-and-release-tests-typecheck-after-build", () => {
    // 型の検査は `dist` の型の定義を読む。`dist` の無い作業場所で build より前に回すと `TS2307` で落ちる (#3732)
    const problems = Object.fromEntries(["一式", "配る前のテスト"].map((field) => [field, typecheckBeforeBuildProblems(checksCell(field))]));
    expect(problems, "`.ikkan/checks.md` の欄の型の検査の置き方の誤り").toEqual({ 一式: [], 配る前のテスト: [] });
  });

  it("verify-typechecks-after-build", () => {
    expect(typecheckBeforeBuildProblems(scriptOf("package.json", "verify")), "root の verify の型の検査の置き方の誤り").toEqual([]);
  });

  it("prepublish-typechecks-after-build", () => {
    // package の `tsc --noEmit` も、`src/embed` と `src/frame` が同じ package の入口の型を `dist` から読む (#3732)
    const command = scriptOf("packages/dragon/package.json", "prepublishOnly");
    expect(typecheckBeforeBuildProblems(command), "prepublishOnly の型の検査の置き方の誤り").toEqual([]);
    const steps = commandSteps(command);
    expect(steps.indexOf("pnpm run check:pack"), "prepublishOnly が型の検査の後に check:pack を回さない").toBeGreaterThan(steps.indexOf("pnpm run typecheck"));
  });

  it("typecheck-after-build-rejects-early-typecheck", () => {
    // 欄の形 (`bash -c '...'`) と script の形 (`pnpm run X`) の両方で、型の検査を build より前に置いた命令と、どちらかを持たない命令を拒む
    expect(typecheckBeforeBuildProblems("`bash -c 'pnpm typecheck && pnpm build && pnpm lint'`"), "欄の形で型の検査を build より前に置いた命令").toEqual(["型の検査を build より前に回す"]);
    expect(typecheckBeforeBuildProblems("pnpm run typecheck && pnpm run build && pnpm run check:pack"), "script の形で型の検査を build より前に置いた命令").toEqual(["型の検査を build より前に回す"]);
    expect(typecheckBeforeBuildProblems("pnpm run build && pnpm run lint"), "型の検査を持たない命令").toEqual(["型の検査を回さない"]);
    expect(typecheckBeforeBuildProblems("`bash -c 'pnpm typecheck && pnpm lint'`"), "build を持たない命令").toEqual(["build を回さない"]);
    expect(typecheckBeforeBuildProblems("`bash -c 'pnpm build && pnpm typecheck && pnpm lint'`"), "欄の形で build の後に置いた命令").toEqual([]);
    expect(typecheckBeforeBuildProblems("pnpm run build && pnpm run typecheck && pnpm run check:pack"), "script の形で build の後に置いた命令").toEqual([]);
  });

  it("checks-intro-says-suite-typechecks-after-build", () => {
    const text = readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8");
    const intro = text.slice(0, text.search(/^\|/mu));
    const sentence = sentenceWith(intro, ["一式は", "build", "型検査", "順に回し"]) ?? "";
    expect(sentence, "`.ikkan/checks.md` の冒頭が、一式が回す順を書いていない").not.toBe("");
    expect(sentence.indexOf("build"), "`.ikkan/checks.md` の冒頭が、一式は型検査を build より前に回すと書く").toBeLessThan(sentence.indexOf("型検査"));
  });

  it("maintaining-says-prepublish-typechecks-after-build", () => {
    const doc = readFileSync(join(ROOT, "docs/maintaining.md"), "utf8");
    const section = /^## npmへ出す時の検査\n([\s\S]*?)(?=^## |(?![\s\S]))/mu.exec(doc)?.[1] ?? "";
    const sentence = sentenceWith(section, ["`prepublishOnly`", "この順に回す"]) ?? "";
    const at = (word: string): number => sentence.indexOf(word);
    expect(sentence, "節 npmへ出す時の検査 が、prepublishOnly が回す順を書いていない").not.toBe("");
    expect([at("build"), at("型の検査"), at("`check:pack`")].every((index) => index >= 0), "節 npmへ出す時の検査 の順の文が、build と型の検査と check:pack を書いていない").toBe(true);
    expect(at("build"), "節 npmへ出す時の検査 が、型の検査を build より前に書く").toBeLessThan(at("型の検査"));
    expect(at("型の検査"), "節 npmへ出す時の検査 が、check:pack を型の検査より前に書く").toBeLessThan(at("`check:pack`"));
  });

  it("contributing-says-verify-builds-before-typecheck", () => {
    const read = (file: string): string => readFileSync(join(ROOT, file), "utf8");
    const ja = verifyOrderLines(read("CONTRIBUTING.ja.md"), "型の検査");
    const en = verifyOrderLines(read("CONTRIBUTING.md"), "type check");
    // 地の文と命令の一覧の注釈の 2 か所が、`pnpm verify` の順を書く
    expect(ja.counted, "CONTRIBUTING.ja.md が pnpm verify の順を書く行を 2 つ持たない").toBeGreaterThanOrEqual(2);
    expect(en.counted, "CONTRIBUTING.md が pnpm verify の順を書く行を 2 つ持たない").toBeGreaterThanOrEqual(2);
    expect({ ja: ja.early, en: en.early }, "pnpm verify が型の検査を build より前に回すと書く行").toEqual({ ja: [], en: [] });
  });

  it("checks-intro-names-reached-checks", () => {
    const text = readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8");
    const intro = text.slice(0, text.search(/^\|/mu));
    expect(sentenceWith(intro, ["照合の段", "一式"]), "`.ikkan/checks.md` の冒頭が、通らない照合の段が一式を回すと書いている").toBeUndefined();
    expect(sentenceWith(intro, ["実装の", "関門", "届く検査", "回す"]), "`.ikkan/checks.md` の冒頭が、実装の関門が届く検査を回すと書いていない").toBeDefined();
  });

  it("checks-intro-says-scripts-only-change-picks-script-readers", () => {
    const text = readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8");
    const intro = text.slice(0, text.search(/^\|/mu));
    expect(sentenceWith(intro, ["`package.json`", "`scripts`だけ", "全ての検査を選ばず"]), "`.ikkan/checks.md` の冒頭が、`package.json` の `scripts` だけを変えた時は全ての検査を選ばないと書いていない (#3733)").toBeDefined();
  });

  it("checks-intro-says-load-timeouts-are-cut-by-lighter-tests", () => {
    const text = readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8");
    const intro = text.slice(0, text.search(/^\|/mu));
    expect(sentenceWith(intro, ["負荷", "workerの数", "縮まない"]), "`.ikkan/checks.md` の冒頭が、workerの数を変えても1件の秒数は縮まないと書いていない (#3733)").toBeDefined();
    expect(sentenceWith(intro, ["1件の検査", "仕事", "減らす"]), "`.ikkan/checks.md` の冒頭が、負荷で延びる時間切れを1件の検査の仕事を減らして防ぐと書いていない (#3733)").toBeDefined();
  });

  it("checks-intro-names-typecheck-in-reached-checks", () => {
    const text = readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8");
    const intro = text.slice(0, text.search(/^\|/mu));
    expect(sentenceWith(intro, ["届く検査", "型の検査", "回す"]), "`.ikkan/checks.md` の冒頭が、届く検査は型の検査も回すと書いていない").toBeDefined();
  });

  it("maintainer-notes-say-reached-checks-typecheck", () => {
    const notes = readFileSync(join(ROOT, "docs/maintaining.md"), "utf8");
    const start = notes.indexOf("## 関係する検査だけを回す");
    expect(start, "管理者向けの決まりに、関係する検査だけを回す節が無い").toBeGreaterThanOrEqual(0);
    const rest = notes.slice(start + 1);
    const end = rest.search(/^## /mu);
    const section = end === -1 ? rest : rest.slice(0, end);
    expect(sentenceWith(section, ["`届く検査`", "`pnpm typecheck`"]), "関係する検査だけを回す節が、欄 `届く検査` が `pnpm typecheck` も回すと書いていない").toBeDefined();
  });

  it("maintainer-notes-say-gate-runs-related-tests", () => {
    const notes = readFileSync(join(ROOT, "docs/maintaining.md"), "utf8");
    const start = notes.indexOf("## 関係する検査だけを回す");
    expect(start, "管理者向けの決まりに、関係する検査だけを回す節が無い").toBeGreaterThanOrEqual(0);
    const rest = notes.slice(start + 1);
    const end = rest.search(/^## /mu);
    const section = end === -1 ? rest : rest.slice(0, end);
    expect(sentenceWith(section, ["実装の", "関門", "`届く検査`", "`pnpm test:related`"]), "関係する検査だけを回す節が、実装の関門が欄 `届く検査` で `pnpm test:related` を回すと書いていない").toBeDefined();
  });

  it("maintainer-notes-name-related-runner", () => {
    const notes = readFileSync(join(ROOT, "docs/maintaining.md"), "utf8");
    expect(notes, "管理者向けの決まりが、関係する検査を回す命令を名指していない").toContain("pnpm test:related");
    expect(notes, "管理者向けの決まりが、一式を版を出す前の 1 回だけ回すと書いていない").toMatch(/一式は[^\n。]*版を出す前[^\n。]*1 回だけ回す/u);
    expect(notes, "絞り込んで回すことを禁じる前の決まりが残っている").not.toContain("## 絞り込んだ結果を提出の根拠にしない");
  });
});
